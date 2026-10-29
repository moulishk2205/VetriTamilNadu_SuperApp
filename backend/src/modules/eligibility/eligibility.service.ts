import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { AuditService } from '../../common/audit/audit.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { readDmnDecisions, schemeIdOf, type RuleSpec } from '../workflow/dmn'
import { XmlImportError } from '../workflow/xml'
import { ageFrom, evaluate, type Facts } from './eligibility.engine'

/** What the citizen declared; stored on Citizen.facts. */
export interface DeclaredFacts { annualIncome?: number; landHolder?: 'yes' | 'no'; declaredAt?: string }

type SchemeRow = Prisma.SchemeGetPayload<{ include: { rules: true } }>

const view = (s: SchemeRow) => ({
  schemeId: s.id, name: s.name, nameTamil: s.nameTamil ?? undefined, benefit: s.benefit,
  benefitTamil: s.benefitTamil ?? undefined, department: s.department, color: s.color,
})

/**
 * "No Application" delivery: what a citizen qualifies for, worked out from
 * what the platform knows plus two facts they declare, and a one-tap claim.
 * Also a tester for staff to try rules (live, or a DMN draft) on a sample
 * profile before publishing them.
 */
@Injectable()
export class EligibilityService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private schemes() {
    return this.prisma.scheme.findMany({ include: { rules: { orderBy: { id: 'asc' } } }, orderBy: [{ matchScore: 'desc' }, { name: 'asc' }] })
  }

  /** Profile facts (age, gender, district) plus the declared ones. */
  private async factsOf(citizenId: string): Promise<{ facts: Facts; declared: DeclaredFacts }> {
    const c = await this.prisma.citizen.findUnique({ where: { id: citizenId } })
    if (!c) throw new NotFoundException('Citizen not found')
    const declared = (c.facts ?? {}) as DeclaredFacts
    const facts: Facts = { gender: c.gender, district: c.district, age: ageFrom(c.dob) }
    if (declared.annualIncome !== undefined) facts.annualIncome = declared.annualIncome
    if (declared.landHolder !== undefined) facts.landHolder = declared.landHolder
    return { facts, declared }
  }

  async forCitizen(citizenId: string) {
    const [{ facts, declared }, schemes, claims] = await Promise.all([
      this.factsOf(citizenId), this.schemes(),
      this.prisma.schemeClaim.findMany({ where: { citizenId } }),
    ])
    const claimOf = new Map(claims.map((c) => [c.schemeId, { status: c.status, at: c.createdAt.toISOString() }]))
    return {
      facts: { ...facts, declaredAt: declared.declaredAt },
      schemes: schemes.map((s) => ({ ...view(s), ...evaluate(s.rules, facts), claim: claimOf.get(s.id) })),
    }
  }

  /**
   * Saves declared facts. Each scheme that becomes eligible because of them
   * (and is not claimed yet) gets a "you're eligible, tap to claim" notification.
   */
  async declare(citizenId: string, input: DeclaredFacts) {
    const before = await this.forCitizen(citizenId)
    const { declared } = await this.factsOf(citizenId)
    const next: DeclaredFacts = { ...declared, declaredAt: new Date().toISOString() }
    if (input.annualIncome !== undefined) next.annualIncome = input.annualIncome
    if (input.landHolder !== undefined) next.landHolder = input.landHolder
    await this.prisma.citizen.update({ where: { id: citizenId }, data: { facts: next as Prisma.InputJsonValue } })

    const after = await this.forCitizen(citizenId)
    const wasEligible = new Set(before.schemes.filter((s) => s.verdict === 'eligible').map((s) => s.schemeId))
    const fresh = after.schemes.filter((s) => s.verdict === 'eligible' && !wasEligible.has(s.schemeId) && !s.claim)
    if (fresh.length) {
      await this.prisma.notification.createMany({
        data: fresh.map((s) => ({
          citizenId, category: 'scheme' as const, priority: 'HIGH' as const, actionPath: '/schemes', icon: 'Sparkles', color: 'ok',
          title: `You're eligible for ${s.name}`,
          body: `${s.benefit}. Tap to claim: no application form needed.`,
        })),
      })
    }
    return { ...after, newlyEligible: fresh.map((s) => s.name) }
  }

  /** One-tap claim, accepted only while every recorded condition is met. */
  async claim(citizenId: string, schemeId: string, me: JwtUser) {
    const { facts } = await this.factsOf(citizenId)
    const scheme = await this.prisma.scheme.findUnique({ where: { id: schemeId }, include: { rules: true } })
    if (!scheme) throw new NotFoundException('Scheme not found')
    const result = evaluate(scheme.rules, facts)
    if (result.verdict !== 'eligible') {
      throw new BadRequestException(result.verdict === 'needs_info'
        ? 'Tell us the missing details first, so eligibility can be checked'
        : result.verdict === 'department_review' ? 'This scheme is assessed by the department; claim it at your e-Sevai centre'
        : 'You do not meet the recorded conditions for this scheme')
    }
    const existing = await this.prisma.schemeClaim.findUnique({ where: { citizenId_schemeId: { citizenId, schemeId } } })
    if (existing) throw new ConflictException('You have already claimed this scheme')
    const basis = { facts, conditions: result.conditions, checkedAt: new Date().toISOString() }
    const claim = await this.prisma.schemeClaim.create({ data: { citizenId, schemeId, basis: basis as unknown as Prisma.InputJsonValue } })
    await this.prisma.notification.create({
      data: {
        citizenId, category: 'scheme', actionPath: '/schemes', icon: 'CheckCircle', color: 'info',
        title: `Claim received: ${scheme.name}`,
        body: `${scheme.department} will verify it against the scheme's full conditions and update you here.`,
      },
    })
    await this.audit.record({ actor: `${me.role}:${me.sub}`, action: 'scheme-claim', entity: 'scheme', entityId: schemeId, note: scheme.name })
    return { schemeId, status: claim.status, at: claim.createdAt.toISOString() }
  }

  /**
   * Staff tester: evaluates a sample profile against the live rules, or
   * against the rules in a DMN draft (not saved), so a change can be tried
   * before it is published.
   */
  async simulate(profile: Facts, xml?: string) {
    const schemes = await this.schemes()
    let rulesOf = new Map<string, RuleSpec[]>(schemes.map((s) => [s.id, s.rules]))
    let source: 'live' | 'draft' = 'live'
    if (xml) {
      let decisions
      try { decisions = readDmnDecisions(xml) } catch (e) {
        if (e instanceof XmlImportError) throw new BadRequestException({ message: e.problems })
        throw e
      }
      const byName = new Map(schemes.map((s) => [`${s.name} eligibility`.toLowerCase(), s.id]))
      const ids = new Set(schemes.map((s) => s.id))
      const draft = new Map(rulesOf)
      const unknown: string[] = []
      for (const d of decisions) {
        const id = ids.has(schemeIdOf(d.id)) ? schemeIdOf(d.id) : byName.get(d.name.trim().toLowerCase())
        if (id) draft.set(id, d.rules)
        else unknown.push(`Decision "${d.name}" does not match any scheme`)
      }
      if (unknown.length) throw new BadRequestException({ message: unknown })
      rulesOf = draft
      source = 'draft'
    }
    return { source, profile, schemes: schemes.map((s) => ({ ...view(s), ...evaluate(rulesOf.get(s.id) ?? [], profile) })) }
  }
}

export type CitizenEligibility = Awaited<ReturnType<EligibilityService['forCitizen']>>

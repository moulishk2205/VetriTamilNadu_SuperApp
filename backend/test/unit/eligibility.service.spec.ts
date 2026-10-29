import { BadRequestException, ConflictException } from '@nestjs/common'
import type { AuditService } from '../../src/common/audit/audit.service'
import type { JwtUser } from '../../src/common/decorators/current-user.decorator'
import { EligibilityService } from '../../src/modules/eligibility/eligibility.service'
import { toDmnXml } from '../../src/modules/workflow/dmn'
import type { PrismaService } from '../../src/prisma/prisma.service'

const rule = (schemeId: string, field: string, op: string, value: string) => ({ id: `${schemeId}-${field}`, schemeId, field, op, value })
const SCHEMES = [
  { id: 's-kisan', name: 'PM Kisan', department: 'Agriculture', benefit: '₹6,000 per year', color: '#0F766E', nameTamil: null, benefitTamil: null,
    rules: [rule('s-kisan', 'incomeMax', 'lte', '300000'), rule('s-kisan', 'landHolder', 'eq', 'yes')] },
  { id: 's-bride', name: 'Annanin Seer', department: 'Social Welfare', benefit: 'Gold coin', color: '#DB2777', nameTamil: null, benefitTamil: null,
    rules: [rule('s-bride', 'gender', 'eq', 'Female')] },
  { id: 's-laptop', name: 'Laptop', department: 'Higher Education', benefit: 'Laptop', color: '#7C3AED', nameTamil: null, benefitTamil: null, rules: [] },
]

function setup() {
  const citizen = { id: 'c1', dob: '22 May 2002', gender: 'Male', district: 'Chennai', facts: null as unknown }
  const claims: { citizenId: string; schemeId: string; status: string; createdAt: Date }[] = []
  const notifications: { title: string }[] = []
  const prisma = {
    citizen: {
      findUnique: async () => citizen,
      update: async ({ data }: { data: { facts: unknown } }) => { citizen.facts = data.facts },
    },
    scheme: {
      findMany: async () => SCHEMES,
      findUnique: async ({ where }: { where: { id: string } }) => SCHEMES.find((s) => s.id === where.id) ?? null,
    },
    schemeClaim: {
      findMany: async () => claims,
      findUnique: async ({ where }: { where: { citizenId_schemeId: { schemeId: string } } }) => claims.find((c) => c.schemeId === where.citizenId_schemeId.schemeId) ?? null,
      create: async ({ data }: { data: { citizenId: string; schemeId: string } }) => {
        const c = { ...data, status: 'submitted', createdAt: new Date() }
        claims.push(c)
        return c
      },
    },
    notification: {
      createMany: async ({ data }: { data: { title: string }[] }) => { notifications.push(...data) },
      create: async ({ data }: { data: { title: string } }) => { notifications.push(data) },
    },
  } as unknown as PrismaService
  const audit = { record: jest.fn(async () => undefined) }
  return { svc: new EligibilityService(prisma, audit as unknown as AuditService), citizen, claims, notifications, audit }
}
const me = { sub: 'u1', role: 'CITIZEN' } as unknown as JwtUser
const verdicts = (r: { schemes: { name: string; verdict: string }[] }) => Object.fromEntries(r.schemes.map((s) => [s.name, s.verdict]))

describe('EligibilityService', () => {
  it('uses profile facts and asks for the rest', async () => {
    const { svc } = setup()
    const r = await svc.forCitizen('c1')
    expect(r.facts).toMatchObject({ age: expect.any(Number), gender: 'Male', district: 'Chennai' })
    expect(verdicts(r)).toEqual({ 'PM Kisan': 'needs_info', 'Annanin Seer': 'not_eligible', Laptop: 'department_review' })
  })

  it('notifies once for each scheme the declared facts make eligible', async () => {
    const { svc, notifications } = setup()
    const r = await svc.declare('c1', { annualIncome: 240000, landHolder: 'yes' })
    expect(r.newlyEligible).toEqual(['PM Kisan'])
    expect(notifications.map((n) => n.title)).toEqual(["You're eligible for PM Kisan"])
    await svc.declare('c1', { annualIncome: 250000 })
    expect(notifications).toHaveLength(1)
  })

  it('accepts a claim only when eligible, and only once', async () => {
    const { svc, claims, notifications, audit } = setup()
    await expect(svc.claim('c1', 's-kisan', me)).rejects.toThrow(BadRequestException)
    await svc.declare('c1', { annualIncome: 240000, landHolder: 'yes' })
    const c = await svc.claim('c1', 's-kisan', me)
    expect(c).toMatchObject({ schemeId: 's-kisan', status: 'submitted' })
    expect(claims).toHaveLength(1)
    expect(notifications.at(-1)?.title).toBe('Claim received: PM Kisan')
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'scheme-claim', entityId: 's-kisan' }))
    await expect(svc.claim('c1', 's-kisan', me)).rejects.toThrow(ConflictException)
    await expect(svc.claim('c1', 's-bride', me)).rejects.toThrow(BadRequestException)
    await expect(svc.claim('c1', 's-laptop', me)).rejects.toThrow(BadRequestException)
  })

  it('tests a sample profile against the live rules', async () => {
    const { svc } = setup()
    const r = await svc.simulate({ gender: 'Female', annualIncome: 100000, landHolder: 'no' })
    expect(r.source).toBe('live')
    expect(verdicts(r)).toEqual({ 'PM Kisan': 'not_eligible', 'Annanin Seer': 'eligible', Laptop: 'department_review' })
  })

  it('tests a DMN draft without saving it', async () => {
    const { svc } = setup()
    const draft = toDmnXml([{ ...SCHEMES[2], rules: [rule('s-laptop', 'ageMax', 'lte', '25')] }])
    const r = await svc.simulate({ age: 24 }, draft)
    expect(r.source).toBe('draft')
    expect(verdicts(r).Laptop).toBe('eligible')
    expect(verdicts(await svc.simulate({ age: 24 })).Laptop).toBe('department_review')
  })
})

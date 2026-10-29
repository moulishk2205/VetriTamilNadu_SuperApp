import { BadRequestException, Injectable } from '@nestjs/common'
import { AuditService } from '../../common/audit/audit.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { isServed } from '../catalog/eligibility'
import { checkBpmnConformance, type ConformanceReport } from '../workflow/bpmn'
import { readDmnDecisions, schemeIdOf, type ImportedDecision, type RuleSpec } from '../workflow/dmn'
import { XmlImportError } from '../workflow/xml'

const SYMBOL: Record<string, string> = { lte: '≤', lt: '<', gte: '≥', gt: '>', eq: '=', neq: '≠', in: 'in' }
/** A condition in words, e.g. "incomeMax ≤ 300000". */
export const describeRule = (r: RuleSpec) => `${r.field} ${SYMBOL[r.op] ?? r.op} ${r.value}`

export interface SchemeChange {
  schemeId: string
  scheme: string
  before: string[]
  after: string[]
  /** New conditions kept in the rule store and the DMN export, but not shown in the portal's eligibility summary. */
  notInPortal: string[]
}
export interface DmnImportResult {
  applied: boolean
  changes: SchemeChange[]
  /** Schemes in the file whose conditions are already the same. */
  unchanged: number
  /** Schemes not in the file, which the import leaves alone. */
  notInFile: number
}

/** Turns a parser complaint into a 400 listing every problem. */
function asBadRequest<T>(run: () => T): T {
  try {
    return run()
  } catch (e) {
    if (e instanceof XmlImportError) throw new BadRequestException({ message: e.problems })
    throw e
  }
}

/**
 * Brings edited BPMN/DMN files back in. DMN replaces scheme eligibility
 * conditions (preview first, then apply); BPMN is checked against the running
 * workflow, since the engine executes its built-in definition.
 */
@Injectable()
export class WorkflowImportService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async importDmn(xml: string, apply: boolean, me: JwtUser): Promise<DmnImportResult> {
    const decisions = asBadRequest(() => readDmnDecisions(xml))
    const schemes = await this.prisma.scheme.findMany({ include: { rules: true }, orderBy: [{ matchScore: 'desc' }, { name: 'asc' }] })
    const byId = new Map(schemes.map((s) => [s.id, s]))
    const byName = new Map(schemes.map((s) => [`${s.name} eligibility`.toLowerCase(), s]))

    const problems: string[] = []
    const matched = new Map<string, ImportedDecision>()
    const changes: (SchemeChange & { rules: RuleSpec[] })[] = []
    let unchanged = 0
    for (const d of decisions) {
      const scheme = byId.get(schemeIdOf(d.id)) ?? byName.get(d.name.trim().toLowerCase())
      if (!scheme) { problems.push(`Decision "${d.name}" does not match any scheme`); continue }
      const twin = matched.get(scheme.id)
      if (twin) { problems.push(`Scheme "${scheme.name}" appears twice ("${twin.name}" and "${d.name}")`); continue }
      matched.set(scheme.id, d)
      const before = scheme.rules.map(describeRule).sort()
      const after = d.rules.map(describeRule).sort()
      if (before.length === after.length && before.every((b, i) => b === after[i])) unchanged += 1
      else changes.push({ schemeId: scheme.id, scheme: scheme.name, before, after, notInPortal: d.rules.filter((r) => !isServed(r)).map(describeRule).sort(), rules: d.rules })
    }
    if (problems.length) throw new BadRequestException({ message: problems })

    const applied = apply && changes.length > 0
    if (applied) {
      // The rule changes and one audit row per changed scheme (its full before
      // and after, as structured data) commit together or not at all.
      await this.prisma.$transaction(async (tx) => {
        for (const c of changes) {
          await tx.eligibilityRule.deleteMany({ where: { schemeId: c.schemeId } })
          await tx.eligibilityRule.createMany({ data: c.rules.map((r) => ({ schemeId: c.schemeId, field: r.field, op: r.op, value: r.value })) })
        }
        await this.audit.recordIn(tx, changes.map((c) => ({
          actor: `${me.role}:${me.sub}`, action: 'eligibility-import', entity: 'scheme', entityId: c.schemeId,
          note: c.scheme, meta: { before: c.before, after: c.after },
        })))
      })
    }
    return { applied, changes: changes.map(({ rules: _rules, ...c }) => c), unchanged, notInFile: schemes.length - matched.size }
  }

  checkBpmn(xml: string): ConformanceReport {
    return asBadRequest(() => checkBpmnConformance(xml))
  }
}

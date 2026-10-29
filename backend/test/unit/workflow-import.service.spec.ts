import { BadRequestException } from '@nestjs/common'
import type { AuditService } from '../../src/common/audit/audit.service'
import type { JwtUser } from '../../src/common/decorators/current-user.decorator'
import { WorkflowImportService } from '../../src/modules/admin/workflow-import.service'
import { toDmnXml } from '../../src/modules/workflow/dmn'
import type { PrismaService } from '../../src/prisma/prisma.service'

interface Rule { id: string; schemeId: string; field: string; op: string; value: string }
const SCHEMES = [
  { id: 's-kisan', name: 'PM Kisan', department: 'Agriculture', matchScore: 95 },
  { id: 's-laptop', name: 'Laptop Scheme', department: 'Higher Education', matchScore: 85 },
]

/**
 * In-memory Scheme + EligibilityRule tables. The interactive transaction
 * rolls the rules back if its callback throws, as Postgres would.
 */
function setup(opts: { auditFails?: boolean } = {}) {
  let rules: Rule[] = [{ id: 'r1', schemeId: 's-kisan', field: 'incomeMax', op: 'lte', value: '300000' }]
  const schemesWithRules = async () => SCHEMES.map((s) => ({ ...s, rules: rules.filter((r) => r.schemeId === s.id) }))
  const tx = {
    eligibilityRule: {
      deleteMany: async ({ where }: { where: { schemeId: string } }) => { rules = rules.filter((r) => r.schemeId !== where.schemeId) },
      createMany: async ({ data }: { data: Omit<Rule, 'id'>[] }) => { rules.push(...data.map((d, i) => ({ ...d, id: `new-${i}` }))) },
    },
  }
  const prisma = {
    scheme: { findMany: schemesWithRules },
    $transaction: async (fn: (t: typeof tx) => Promise<void>) => {
      const snapshot = [...rules]
      try { await fn(tx) } catch (e) { rules = snapshot; throw e }
    },
  } as unknown as PrismaService
  const audit = {
    record: jest.fn(async () => undefined),
    recordIn: jest.fn(async (t: unknown, _entries: unknown[]) => {
      expect(t).toBe(tx) // inside the same transaction as the rule changes
      if (opts.auditFails) throw new Error('audit write failed')
    }),
  }
  const svc = new WorkflowImportService(prisma, audit as unknown as AuditService)
  const exportNow = async () => toDmnXml(await schemesWithRules())
  return { svc, audit, exportNow, rules: () => rules }
}

const admin = { sub: 'u-admin', role: 'ADMIN', sid: 's1' } as unknown as JwtUser

describe('WorkflowImportService: DMN', () => {
  it('reports no changes for an unedited export', async () => {
    const { svc, exportNow } = setup()
    expect(await svc.importDmn(await exportNow(), false, admin)).toEqual({ applied: false, changes: [], unchanged: 2, notInFile: 0 })
  })

  it('previews a change without writing it', async () => {
    const { svc, exportNow, rules, audit } = setup()
    const edited = (await exportNow()).replace('&lt;= 300000', '&lt;= 350000')
    const res = await svc.importDmn(edited, false, admin)
    expect(res.changes).toEqual([{ schemeId: 's-kisan', scheme: 'PM Kisan', before: ['incomeMax ≤ 300000'], after: ['incomeMax ≤ 350000'], notInPortal: [] }])
    expect(res.applied).toBe(false)
    expect(rules()).toHaveLength(1)
    expect(rules()[0].value).toBe('300000')
    expect(audit.recordIn).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })

  it('applies the change, audits it, and the next export shows it', async () => {
    const { svc, exportNow, rules, audit } = setup()
    const edited = (await exportNow()).replace('&lt;= 300000', '&lt;= 350000')
    const res = await svc.importDmn(edited, true, admin)
    expect(res.applied).toBe(true)
    expect(rules().map((r) => `${r.schemeId} ${r.field} ${r.op} ${r.value}`)).toEqual(['s-kisan incomeMax lte 350000'])
    expect(audit.recordIn).toHaveBeenCalledWith(expect.anything(), [{
      actor: 'ADMIN:u-admin', action: 'eligibility-import', entity: 'scheme', entityId: 's-kisan', note: 'PM Kisan',
      meta: { before: ['incomeMax ≤ 300000'], after: ['incomeMax ≤ 350000'] },
    }])
    expect((await svc.importDmn(await exportNow(), false, admin)).changes).toEqual([])
  })

  it('records every changed scheme in full, one audit row each, however long the values', async () => {
    const { svc, audit } = setup()
    const long = 'x'.repeat(3000)
    const edited = toDmnXml([
      { id: 's-kisan', name: 'PM Kisan', department: 'Agriculture', rules: [{ id: 'a', field: 'district', op: 'eq', value: long }] },
      { id: 's-laptop', name: 'Laptop Scheme', department: 'Higher Education', rules: [{ id: 'b', field: 'ageMin', op: 'gte', value: '18' }] },
    ])
    const res = await svc.importDmn(edited, true, admin)
    expect(res.changes.map((c) => c.scheme)).toEqual(['PM Kisan', 'Laptop Scheme'])
    const rows = audit.recordIn.mock.calls[0][1] as { entityId: string; meta: { before: string[]; after: string[] } }[]
    expect(rows.map((r) => r.entityId)).toEqual(['s-kisan', 's-laptop'])
    expect(rows[0].meta).toEqual({ before: ['incomeMax ≤ 300000'], after: [`district = ${long}`] })
    expect(rows[1].meta).toEqual({ before: [], after: ['ageMin ≥ 18'] })
  })

  it('changes nothing if the audit rows cannot be written', async () => {
    const { svc, exportNow, rules } = setup({ auditFails: true })
    const edited = (await exportNow()).replace('&lt;= 300000', '&lt;= 350000')
    await expect(svc.importDmn(edited, true, admin)).rejects.toThrow('audit write failed')
    expect(rules()).toEqual([{ id: 'r1', schemeId: 's-kisan', field: 'incomeMax', op: 'lte', value: '300000' }])
  })

  it('flags conditions the portal does not show', async () => {
    const { svc, exportNow } = setup()
    const res = await svc.importDmn((await exportNow()).replace('&lt;= 300000', '&lt; 300000'), false, admin)
    expect(res.changes[0]).toMatchObject({ after: ['annualIncome < 300000'], notInPortal: ['annualIncome < 300000'] })
  })

  it('leaves schemes missing from the file alone', async () => {
    const { svc, exportNow, rules } = setup()
    const onlyLaptop = (await exportNow()).replace(/<decision id="Decision_s-kisan"[\s\S]*?<\/decision>/, '')
    const res = await svc.importDmn(onlyLaptop, true, admin)
    expect(res).toMatchObject({ applied: false, unchanged: 1, notInFile: 1 })
    expect(rules()).toHaveLength(1)
  })

  it('matches by decision name when a modeller changed the id', async () => {
    const { svc, exportNow } = setup()
    const renamed = (await exportNow()).replace('id="Decision_s-kisan"', 'id="Decision_1x"').replace('&lt;= 300000', '&lt;= 1')
    expect((await svc.importDmn(renamed, false, admin)).changes.map((c) => c.scheme)).toEqual(['PM Kisan'])
  })

  it('refuses a decision for an unknown scheme, or the same scheme twice, writing nothing', async () => {
    const { svc, exportNow, rules } = setup()
    const xml = await exportNow()
    const unknown = xml.replace('id="Decision_s-kisan" name="PM Kisan eligibility"', 'id="Decision_zzz" name="Ghost eligibility"')
    await expect(svc.importDmn(unknown, true, admin)).rejects.toThrow(BadRequestException)
    const twice = xml.replace('id="Decision_s-laptop" name="Laptop Scheme eligibility"', 'id="Decision_s-kisan" name="Laptop Scheme eligibility"')
    const err = (await svc.importDmn(twice, true, admin).catch((e: unknown) => e)) as BadRequestException
    expect((err.getResponse() as { message: string[] }).message).toEqual(['Scheme "PM Kisan" appears twice ("PM Kisan eligibility" and "Laptop Scheme eligibility")'])
    expect(rules()).toEqual([{ id: 'r1', schemeId: 's-kisan', field: 'incomeMax', op: 'lte', value: '300000' }])
  })

  it('lists parser problems in the 400 body', async () => {
    const { svc } = setup()
    const err = await svc.importDmn('<a><b></a>', false, admin).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(BadRequestException)
    expect(((err as BadRequestException).getResponse() as { message: string[] }).message[0]).toContain('not well-formed')
  })
})

describe('WorkflowImportService: BPMN', () => {
  it('turns a non-BPMN upload into a 400', () => {
    const { svc } = setup()
    expect(() => svc.checkBpmn('<x/>')).toThrow(BadRequestException)
  })
})

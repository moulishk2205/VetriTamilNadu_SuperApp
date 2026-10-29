import { AuditService } from '../../src/common/audit/audit.service'
import type { PrismaService } from '../../src/prisma/prisma.service'

interface Row {
  id: string; seq: bigint; actor: string; action: string; entity: string; entityId: string
  note: string | null; meta: unknown; at: Date; prevHash: string | null; hash: string | null
}

/** In-memory AuditLog table with just the queries AuditService makes. */
function fakePrisma(rows: Row[]) {
  const auditLog = {
    findFirst: async () => {
      const chained = rows.filter((r) => r.hash !== null)
      return chained.length ? { hash: chained[chained.length - 1].hash } : null
    },
    create: async ({ data }: { data: Omit<Row, 'id' | 'seq'> & { note?: string | null; meta?: unknown } }) => {
      const seq = BigInt(rows.length ? Number(rows[rows.length - 1].seq) + 1 : 1)
      rows.push({ ...data, note: data.note ?? null, meta: data.meta ?? null, id: `row-${seq}`, seq })
    },
    findMany: async ({ where, take }: { where: { seq?: { gt: bigint } }; take: number }) =>
      rows.filter((r) => !where.seq || r.seq > where.seq.gt).slice(0, take),
  }
  return {
    auditLog,
    $transaction: async (fn: (tx: unknown) => Promise<void>) => fn({ $executeRaw: async () => 0, auditLog }),
  } as unknown as PrismaService
}

async function chainOf(n: number) {
  const rows: Row[] = []
  const audit = new AuditService(fakePrisma(rows))
  for (let i = 0; i < n; i++) {
    await audit.record({ actor: `officer-${i}`, action: 'APPROVE', entity: 'Application', entityId: `APP-${i}`, note: `step ${i}`, meta: { b: i, a: 'x' } })
  }
  return { rows, audit }
}

describe('AuditService hash chain', () => {
  it('links every row to the one before it', async () => {
    const { rows, audit } = await chainOf(4)
    expect(rows[0].prevHash).toBe('0'.repeat(64))
    for (let i = 1; i < rows.length; i++) expect(rows[i].prevHash).toBe(rows[i - 1].hash)
    expect(await audit.verify()).toEqual({ valid: true, rows: 4, chained: 4, legacy: 0 })
  })

  it('detects an edited row', async () => {
    const { rows, audit } = await chainOf(4)
    rows[2].note = 'step 2 (edited)'
    const report = await audit.verify()
    expect(report.valid).toBe(false)
    expect(report.brokenAt).toMatchObject({ seq: '3', reason: expect.stringContaining('modified') })
  })

  it('detects a deleted row', async () => {
    const { rows, audit } = await chainOf(4)
    rows.splice(1, 1)
    const report = await audit.verify()
    expect(report.valid).toBe(false)
    expect(report.brokenAt).toMatchObject({ seq: '3', reason: expect.stringContaining('deleted') })
  })

  it('detects a forged hash that does not match the content', async () => {
    const { rows, audit } = await chainOf(3)
    rows[2].hash = 'f'.repeat(64)
    expect((await audit.verify()).valid).toBe(false)
  })

  it('ignores JSON key order, as Postgres jsonb may reorder keys', async () => {
    const { rows, audit } = await chainOf(2)
    rows[0].meta = { a: 'x', b: 0 }
    expect((await audit.verify()).valid).toBe(true)
  })

  it('accepts unhashed rows only before the chain starts', async () => {
    const legacy: Row = { id: 'seed', seq: 0n, actor: 'seed', action: 'SEED', entity: 'System', entityId: '-', note: null, meta: null, at: new Date(0), prevHash: null, hash: null }
    const rows: Row[] = [legacy]
    const audit = new AuditService(fakePrisma(rows))
    await audit.record({ actor: 'a', action: 'X', entity: 'E', entityId: '1' })
    expect(await audit.verify()).toEqual({ valid: true, rows: 2, chained: 1, legacy: 1 })

    rows.push({ ...legacy, id: 'late', seq: 9n })
    expect((await audit.verify()).brokenAt?.reason).toContain('no hash inside the chain')
  })
})

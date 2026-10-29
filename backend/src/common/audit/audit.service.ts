import { Global, Injectable, Logger, Module } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { createHash } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'

export interface AuditEntry {
  actor: string
  action: string
  entity: string
  entityId: string
  note?: string
  meta?: Record<string, unknown>
}

const GENESIS = '0'.repeat(64)
/** Serialises appends across instances sharing one database. */
const CHAIN_LOCK = 727274

/** JSON with sorted keys, so Postgres jsonb key reordering can't change a hash. */
function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null)
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`).join(',')}}`
}

function rowHash(prevHash: string, r: { actor: string; action: string; entity: string; entityId: string; note: string | null; meta: unknown; at: Date }): string {
  return createHash('sha256')
    .update(stable([prevHash, r.actor, r.action, r.entity, r.entityId, r.note, r.meta ?? null, r.at.toISOString()]))
    .digest('hex')
}

export interface ChainReport {
  valid: boolean
  rows: number
  chained: number
  /** Rows written before the chain existed (e.g. the seed anchor). */
  legacy: number
  brokenAt?: { seq: string; id: string; at: string; reason: string }
}

/**
 * Tamper-evident audit trail. Every row stores the SHA-256 of its own content
 * plus the previous row's hash, so editing or deleting any row breaks every
 * hash after it. `verify()` recomputes the whole chain.
 */
@Injectable()
export class AuditService {
  private readonly log = new Logger('Audit')
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly prisma: PrismaService) {}

  /** Append one row. Never throws: an audit failure is logged, not surfaced. */
  record(entry: AuditEntry): Promise<void> {
    const run = this.queue.then(() => this.append(entry)).catch((e: Error) => this.log.warn(`Audit write failed (${entry.action}): ${e.message}`))
    this.queue = run
    return run
  }

  private async append(e: AuditEntry): Promise<void> {
    await this.prisma.$transaction((tx) => this.recordIn(tx, [e]))
  }

  /**
   * Appends rows inside the caller's transaction, so a change and its audit
   * rows commit together or not at all. Unlike record(), failures propagate.
   */
  async recordIn(tx: Prisma.TransactionClient, entries: AuditEntry[]): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CHAIN_LOCK})`
    const last = await tx.auditLog.findFirst({ where: { hash: { not: null } }, orderBy: { seq: 'desc' }, select: { hash: true } })
    let prevHash = last?.hash ?? GENESIS
    for (const e of entries) {
      const at = new Date()
      const meta = e.meta ? (JSON.parse(JSON.stringify(e.meta)) as Prisma.InputJsonValue) : undefined
      const hash = rowHash(prevHash, { actor: e.actor, action: e.action, entity: e.entity, entityId: e.entityId, note: e.note ?? null, meta: meta ?? null, at })
      await tx.auditLog.create({ data: { actor: e.actor, action: e.action, entity: e.entity, entityId: e.entityId, note: e.note, meta, at, prevHash, hash } })
      prevHash = hash
    }
  }

  async verify(): Promise<ChainReport> {
    const report: ChainReport = { valid: true, rows: 0, chained: 0, legacy: 0 }
    let prev: string | null = null
    let cursor: bigint | undefined
    for (;;) {
      const batch = await this.prisma.auditLog.findMany({
        where: cursor === undefined ? {} : { seq: { gt: cursor } },
        orderBy: { seq: 'asc' },
        take: 1000,
      })
      if (batch.length === 0) break
      for (const r of batch) {
        report.rows += 1
        cursor = r.seq
        const broken = (reason: string): ChainReport => ({ ...report, valid: false, brokenAt: { seq: r.seq.toString(), id: r.id, at: r.at.toISOString(), reason } })
        if (!r.hash) {
          if (prev === null) { report.legacy += 1; continue }
          return broken('row has no hash inside the chain')
        }
        const expectedPrev = prev ?? GENESIS
        if (r.prevHash !== expectedPrev) return broken('link to the previous row is broken (a row was deleted or reordered)')
        if (rowHash(expectedPrev, r) !== r.hash) return broken('row content was modified after it was written')
        prev = r.hash
        report.chained += 1
      }
    }
    return report
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}

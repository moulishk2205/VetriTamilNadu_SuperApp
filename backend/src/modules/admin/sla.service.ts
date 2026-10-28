import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ApplicationStage } from '@prisma/client'
import { AuditService } from '../../common/audit/audit.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TRANSITIONS, WorkflowEngine } from '../workflow/workflow.engine'

const OPEN = { notIn: [ApplicationStage.completed, ApplicationStage.rejected] }

export interface SweepResult {
  checkedAt: string
  breached: { referenceNo: string; serviceName: string; daysOverdue: number; escalated: boolean }[]
  /** Citizens told their decision is due within two days. */
  reminded: number
  /** Applications whose current stage overran its own SLA. */
  stageBreached: { referenceNo: string; stage: string; escalated: boolean }[]
}

/**
 * Right to Services enforcement. Every application carries the department's
 * published deadline (`slaDeadline`). The sweep finds open applications past
 * it, flags each once, escalates it where the workflow allows, notifies the
 * citizen and writes an audit row. Runs every SLA_SWEEP_MINUTES (default 15,
 * 0 = only on demand from the Trust Center).
 */
@Injectable()
export class SlaService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('SLA')
  private timer?: NodeJS.Timeout
  readonly intervalMinutes = Number(process.env.SLA_SWEEP_MINUTES ?? 15)

  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly engine: WorkflowEngine) {}

  onModuleInit(): void {
    if (this.intervalMinutes > 0) {
      this.timer = setInterval(() => void this.sweep().catch((e: Error) => this.log.error(`SLA sweep failed: ${e.message}`)), this.intervalMinutes * 60_000)
    }
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
  }

  async sweep(): Promise<SweepResult> {
    const now = new Date()
    const due = await this.prisma.application.findMany({
      where: { deletedAt: null, slaBreachedAt: null, slaDeadline: { lt: now }, stage: OPEN },
      orderBy: { slaDeadline: 'asc' },
      take: 200,
    })
    const breached: SweepResult['breached'] = []
    for (const app of due) {
      // Claim the breach first so concurrent sweeps act once.
      const { count } = await this.prisma.application.updateMany({ where: { id: app.id, slaBreachedAt: null }, data: { slaBreachedAt: now } })
      if (!count) continue
      const escalated = TRANSITIONS[app.stage].includes(ApplicationStage.escalation)
      if (escalated) {
        await this.prisma.application.update({ where: { id: app.id }, data: { stage: ApplicationStage.escalation, statusLabel: this.engine.statusLabel(ApplicationStage.escalation) } })
      }
      const daysOverdue = Math.max(1, Math.ceil((now.getTime() - (app.slaDeadline as Date).getTime()) / 86_400_000))
      await this.prisma.notification.create({
        data: {
          citizenId: app.citizenId, category: 'application', priority: 'HIGH', icon: 'AlertTriangle', color: 'warn', actionPath: '/tracker',
          title: 'Service deadline missed',
          body: `${app.serviceName} ${app.referenceNo} passed its Right to Services deadline by ${daysOverdue} day(s). ${escalated ? 'It has been escalated to a senior officer.' : 'The department has been alerted to act on it first.'}`,
        },
      })
      await this.audit.record({
        actor: 'system:sla', action: escalated ? 'sla-breach+escalate' : 'sla-breach', entity: 'application', entityId: app.referenceNo,
        note: `Deadline ${app.slaDeadline?.toISOString().slice(0, 10)} missed by ${daysOverdue} day(s) at stage ${app.stage}`,
      })
      breached.push({ referenceNo: app.referenceNo, serviceName: app.serviceName, daysOverdue, escalated })
    }
    if (breached.length) this.log.warn(`SLA sweep: ${breached.length} application(s) breached their deadline`)

    // Reminders: one notice per application when its deadline is two days away.
    const soon = await this.prisma.application.findMany({
      where: { deletedAt: null, slaRemindedAt: null, slaBreachedAt: null, stage: OPEN, slaDeadline: { gte: now, lte: new Date(now.getTime() + 2 * 86_400_000) } },
      take: 200,
    })
    let reminded = 0
    for (const app of soon) {
      const { count } = await this.prisma.application.updateMany({ where: { id: app.id, slaRemindedAt: null }, data: { slaRemindedAt: now } })
      if (!count) continue
      const days = Math.max(1, Math.ceil(((app.slaDeadline as Date).getTime() - now.getTime()) / 86_400_000))
      await this.prisma.notification.create({
        data: {
          citizenId: app.citizenId, category: 'reminder', priority: 'MEDIUM', icon: 'Clock', color: 'info', actionPath: '/tracker',
          title: 'Decision due soon',
          body: `${app.serviceName} ${app.referenceNo}: the department must decide within ${days} day(s) under the Right to Services charter.`,
        },
      })
      reminded += 1
    }
    // Per-stage SLA: a stage that overran its own deadline is flagged once,
    // audited, and escalated where the workflow allows (e.g. inspection).
    const late = await this.prisma.application.findMany({
      where: { deletedAt: null, stageBreachedAt: null, stageDeadline: { lt: now }, stage: OPEN },
      take: 200,
    })
    const stageBreached: SweepResult['stageBreached'] = []
    for (const app of late) {
      const { count } = await this.prisma.application.updateMany({ where: { id: app.id, stageBreachedAt: null }, data: { stageBreachedAt: now } })
      if (!count) continue
      const escalated = TRANSITIONS[app.stage].includes(ApplicationStage.escalation)
      if (escalated) {
        await this.prisma.application.update({ where: { id: app.id }, data: { stage: ApplicationStage.escalation, statusLabel: this.engine.statusLabel(ApplicationStage.escalation), stageDeadline: null } })
      }
      const label = this.engine.stage(app.stage)?.label ?? app.stage
      await this.audit.record({
        actor: 'system:sla', action: escalated ? 'stage-sla-breach+escalate' : 'stage-sla-breach', entity: 'application', entityId: app.referenceNo,
        note: `${label} SLA (${this.engine.stage(app.stage)?.slaDays ?? '?'} working days) missed`,
      })
      stageBreached.push({ referenceNo: app.referenceNo, stage: label, escalated })
    }
    return { checkedAt: now.toISOString(), breached, reminded, stageBreached }
  }
}

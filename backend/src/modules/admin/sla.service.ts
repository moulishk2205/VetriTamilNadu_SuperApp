import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ApplicationStage } from '@prisma/client'
import { AuditService } from '../../common/audit/audit.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TRANSITIONS, WorkflowEngine } from '../workflow/workflow.engine'

const OPEN = { notIn: [ApplicationStage.completed, ApplicationStage.rejected] }

export interface SweepResult {
  checkedAt: string
  breached: { referenceNo: string; serviceName: string; daysOverdue: number; escalated: boolean }[]
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
    return { checkedAt: now.toISOString(), breached }
  }
}

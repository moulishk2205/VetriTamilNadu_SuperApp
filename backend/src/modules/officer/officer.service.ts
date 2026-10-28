import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStage, Officer, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { AuditService } from '../../common/audit/audit.service'
import { ApplicationsService } from '../applications/applications.service'
import { WorkflowEngine } from '../workflow/workflow.engine'

interface ActionInput { action: string; note?: string }

const NON_TERMINAL = { notIn: [ApplicationStage.completed, ApplicationStage.rejected] }

@Injectable()
export class OfficerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apps: ApplicationsService,
    private readonly engine: WorkflowEngine,
    private readonly audit: AuditService,
  ) {}

  /** One application in the officer's jurisdiction, for the review screen. */
  async one(idOrRef: string, user: JwtUser) {
    const officer = await this.apps.officerFor(user)
    const app = await this.prisma.application.findFirst({
      where: { AND: [{ OR: [{ id: idOrRef }, { referenceNo: idOrRef }] }, this.apps.officerScope(officer)] },
      include: { officer: true, department: true, remarks: true },
    })
    if (!app) throw new NotFoundException('Application not found')
    return this.apps.toDto(app, app.officer, app.department?.name)
  }

  async queue(user: JwtUser) {
    const officer = await this.apps.officerFor(user)
    const rows = await this.prisma.application.findMany({
      where: this.apps.officerScope(officer), orderBy: { createdAt: 'desc' },
      include: { officer: true, department: true, remarks: true },
    })
    const items = rows.map((a) => this.apps.toDto(a, a.officer, a.department?.name))
    return { officer: this.officerDto(officer), items, total: items.length }
  }

  /** Every figure is computed from the database. Citizen rating is null: no
   *  feedback is collected yet, and a number would be invented. */
  async stats(user: JwtUser) {
    const officer = await this.apps.officerFor(user)
    const scope = this.apps.officerScope(officer)
    const count = (where: Prisma.ApplicationWhereInput) => this.prisma.application.count({ where: { AND: [scope, where] } })
    const tomorrow = new Date(Date.now() + 86_400_000)
    const monthAgo = new Date(Date.now() - 30 * 86_400_000)
    const [pending, escalated, corrections, dueToday, highPriority, completedThisMonth] = await Promise.all([
      count({ stage: NON_TERMINAL }),
      count({ stage: ApplicationStage.escalation }),
      count({ stage: ApplicationStage.correctionRequested }),
      count({ stage: NON_TERMINAL, slaDeadline: { lte: tomorrow } }),
      count({ serviceSlug: { in: ['svc_income', 'svc_community'] }, stage: NON_TERMINAL }),
      this.prisma.application.count({ where: { officerId: officer.id, stage: ApplicationStage.completed, updatedAt: { gte: monthAgo } } }),
    ])
    const [perf] = await this.prisma.$queryRaw<{ completed: number; rejected: number; avg_days: number | null; on_time: number }[]>`
      SELECT count(*) FILTER (WHERE stage = 'completed')::int AS completed,
             count(*) FILTER (WHERE stage = 'rejected')::int AS rejected,
             avg(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) FILTER (WHERE stage = 'completed')::float AS avg_days,
             count(*) FILTER (WHERE stage = 'completed' AND "slaDeadline" IS NOT NULL AND "updatedAt" <= "slaDeadline")::int AS on_time
      FROM "Application" WHERE "officerId" = ${officer.id} AND "deletedAt" IS NULL`
    const ranks = await this.prisma.$queryRaw<{ officerId: string; rank: number }[]>`
      SELECT o.id AS "officerId", rank() OVER (ORDER BY count(a.id) DESC)::int AS rank
      FROM "Officer" o LEFT JOIN "Application" a ON a."officerId" = o.id AND a.stage = 'completed'
      WHERE o."departmentId" = ${officer.departmentId} GROUP BY o.id`
    const decided = perf.completed + perf.rejected
    return {
      pending, dueToday, highPriority, escalated, corrections, completedThisMonth,
      avgProcessingDays: Math.round((perf.avg_days ?? 0) * 10) / 10,
      approvalRate: decided ? Math.round((perf.completed / decided) * 100) : 0,
      citizenRating: null,
      slaCompliance: perf.completed ? Math.round((perf.on_time / perf.completed) * 100) : 0,
      departmentRank: ranks.find((r) => r.officerId === officer.id)?.rank ?? 0,
    }
  }

  async action(idOrRef: string, input: ActionInput, user: JwtUser) {
    const officer = await this.apps.officerFor(user)
    const app = await this.apps.getRawForOfficer(idOrRef, officer)
    const actor = `${officer.name} (${officer.designation})`
    const service = await this.prisma.service.findUnique({ where: { slug: app.serviceSlug } })
    const svcName = service?.name ?? app.serviceName
    if (input.note) await this.apps.addRemark(app.id, actor, input.note)

    switch (input.action) {
      case 'approve': {
        // One legal step only. Issuing a certificate takes the full sequence of
        // approvals (approval → digital signature → generation → delivery).
        const to = await this.apps.step(app, officer)
        if (!to) throw new ConflictException('Cannot approve from this stage')
        await this.writeAudit(actor, 'approve', app.referenceNo, input.note ? `→ ${to}: ${input.note}` : `→ ${to}`)
        // Certificate delivery sends its own "Certificate Ready" notice.
        if (to !== ApplicationStage.walletDelivery) {
          await this.notify(app.citizenId, 'Application Progressed', `${svcName} ${app.referenceNo} moved to ${this.engine.stage(to)?.label ?? to} by ${officer.name}.`, '/tracker', 'CheckCircle', 'ok', 'application')
        }
        break
      }
      case 'reject': {
        if (!(await this.apps.transitionTo(app, ApplicationStage.rejected, officer))) throw new ConflictException('Cannot reject from this stage')
        await this.writeAudit(actor, 'reject', app.referenceNo, input.note)
        await this.notify(app.citizenId, 'Application Rejected', `${svcName} ${app.referenceNo} was rejected. Reason: ${input.note ?? 'see remarks'}. You may re-apply.`, '/tracker', 'AlertTriangle', 'err', 'application')
        break
      }
      case 'correction': {
        if (!(await this.apps.transitionTo(app, ApplicationStage.correctionRequested, officer))) throw new ConflictException('Cannot request correction from this stage')
        await this.writeAudit(actor, 'request-correction', app.referenceNo, input.note)
        await this.notify(app.citizenId, 'Correction Requested', `${svcName} ${app.referenceNo}: ${input.note ?? 'additional documents required'}.`, '/tracker', 'AlertTriangle', 'warn', 'application')
        break
      }
      case 'escalate': {
        if (!(await this.apps.transitionTo(app, ApplicationStage.escalation, officer))) throw new ConflictException('Cannot escalate from this stage')
        await this.writeAudit(actor, 'escalate', app.referenceNo, input.note)
        await this.notify(app.citizenId, 'Application Escalated', `${svcName} ${app.referenceNo} escalated to senior officer.`, '/tracker', 'AlertTriangle', 'warn', 'application')
        break
      }
      case 'transfer': {
        // Stay inside the jurisdiction: another active officer in the same district.
        const other = await this.prisma.officer.findFirst({
          where: { id: { notIn: [officer.id, ...(app.officerId ? [app.officerId] : [])] }, district: officer.district, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        })
        if (!other) throw new ConflictException('No other officer in this jurisdiction to transfer to')
        {
          await this.prisma.application.update({ where: { id: app.id }, data: { officerId: other.id, departmentId: other.departmentId } })
          await this.writeAudit(actor, 'transfer', app.referenceNo, `→ ${other.name}`)
          await this.notify(app.citizenId, 'Officer Reassigned', `${svcName} ${app.referenceNo} transferred to ${other.name}, ${other.designation}.`, '/tracker', 'Users', 'info', 'application')
        }
        break
      }
      default:
        throw new BadRequestException(`Unknown action ${input.action}`)
    }
    return this.apps.get(app.id)
  }

  /** Audit trail consumed by the Admin Portal. */
  async auditTrail() {
    const items = await this.prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: 200 })
    return {
      items: items.map((a) => {
        // Rejected requests are recorded too; say so rather than list them as actions.
        const meta = (a.meta ?? {}) as { outcome?: string; status?: number }
        const note = meta.outcome === 'failure' ? `Rejected (HTTP ${meta.status ?? '?'})` : a.note ?? undefined
        return { id: a.id, actor: a.actor, action: a.action, entity: a.entity, entityId: a.entityId, at: a.at.toISOString(), note }
      }),
      total: items.length,
    }
  }

  private async writeAudit(actor: string, action: string, entityId: string, note?: string) {
    await this.audit.record({ actor, action, entity: 'application', entityId, note })
  }

  private async notify(citizenId: string, title: string, body: string, actionPath: string, icon: string, color: string, category: 'application') {
    await this.prisma.notification.create({ data: { citizenId, title, body, actionPath, icon, color, category, priority: 'HIGH' } })
  }

  private officerDto(o: Officer) {
    return { id: o.id, name: o.name, designation: o.designation, jurisdiction: o.jurisdiction }
  }
}

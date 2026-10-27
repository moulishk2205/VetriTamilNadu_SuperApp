import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { ApplicationStage, Officer, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
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
  ) {}

  async queue(user: JwtUser) {
    const officer = await this.apps.officerFor(user)
    const rows = await this.prisma.application.findMany({
      where: this.apps.officerScope(officer), orderBy: { createdAt: 'desc' },
      include: { officer: true, department: true, remarks: true },
    })
    const items = rows.map((a) => this.apps.toDto(a, a.officer, a.department?.name))
    return { officer: this.officerDto(officer), items, total: items.length }
  }

  async stats(user: JwtUser) {
    const scope = this.apps.officerScope(await this.apps.officerFor(user))
    const count = (where: Prisma.ApplicationWhereInput) => this.prisma.application.count({ where: { AND: [scope, where] } })
    const [pending, escalated, corrections, dueToday, highPriority] = await Promise.all([
      count({ stage: NON_TERMINAL }),
      count({ stage: ApplicationStage.escalation }),
      count({ stage: ApplicationStage.correctionRequested }),
      count({ stage: { in: [ApplicationStage.approval, ApplicationStage.inspection] } }),
      count({ serviceSlug: { in: ['svc_income', 'svc_community'] }, stage: NON_TERMINAL }),
    ])
    return {
      pending, dueToday, highPriority, escalated, corrections,
      completedThisMonth: 47, avgProcessingDays: 4.2, approvalRate: 92,
      citizenRating: 4.6, slaCompliance: 96, departmentRank: 3,
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
        const other = await this.prisma.officer.findFirst({ where: { id: { not: app.officerId ?? officer.id } } })
        if (other) {
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
      items: items.map((a) => ({ id: a.id, actor: a.actor, action: a.action, entity: a.entity, entityId: a.entityId, at: a.at.toISOString(), note: a.note ?? undefined })),
      total: items.length,
    }
  }

  private async writeAudit(actor: string, action: string, entityId: string, note?: string) {
    await this.prisma.auditLog.create({ data: { actor, action, entity: 'application', entityId, note } })
  }

  private async notify(citizenId: string, title: string, body: string, actionPath: string, icon: string, color: string, category: 'application') {
    await this.prisma.notification.create({ data: { citizenId, title, body, actionPath, icon, color, category, priority: 'HIGH' } })
  }

  private officerDto(o: Officer) {
    return { id: o.id, name: o.name, designation: o.designation, jurisdiction: o.jurisdiction }
  }
}

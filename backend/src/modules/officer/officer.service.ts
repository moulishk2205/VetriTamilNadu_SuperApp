import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStage, Officer } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
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

  private async me(): Promise<Officer> {
    const officer = await this.prisma.officer.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!officer) throw new NotFoundException('No officer provisioned')
    return officer
  }

  async queue() {
    const officer = await this.me()
    const rows = await this.prisma.application.findMany({
      where: { deletedAt: null }, orderBy: { createdAt: 'desc' },
      include: { officer: true, department: true, remarks: true },
    })
    const items = rows.map((a) => this.apps.toDto(a, a.officer, a.department?.name))
    return { officer: this.officerDto(officer), items, total: items.length }
  }

  async stats() {
    const [pending, escalated, corrections, dueToday, highPriority] = await Promise.all([
      this.prisma.application.count({ where: { stage: NON_TERMINAL, deletedAt: null } }),
      this.prisma.application.count({ where: { stage: ApplicationStage.escalation } }),
      this.prisma.application.count({ where: { stage: ApplicationStage.correctionRequested } }),
      this.prisma.application.count({ where: { stage: { in: [ApplicationStage.approval, ApplicationStage.inspection] } } }),
      this.prisma.application.count({ where: { serviceSlug: { in: ['svc_income', 'svc_community'] }, stage: NON_TERMINAL } }),
    ])
    return {
      pending, dueToday, highPriority, escalated, corrections,
      completedThisMonth: 47, avgProcessingDays: 4.2, approvalRate: 92,
      citizenRating: 4.6, slaCompliance: 96, departmentRank: 3,
    }
  }

  async action(idOrRef: string, input: ActionInput) {
    const app = await this.apps.getRaw(idOrRef)
    const officer = await this.me()
    const actor = `${officer.name} (${officer.designation})`
    const service = await this.prisma.service.findUnique({ where: { slug: app.serviceSlug } })
    const svcName = service?.name ?? app.serviceName
    if (input.note) await this.apps.addRemark(app.id, actor, input.note)

    switch (input.action) {
      case 'approve': {
        const ok = await this.apps.transitionTo(app, ApplicationStage.completed)
        if (!ok) throw new ConflictException('Cannot approve from this stage')
        await this.writeAudit(actor, 'approve+issue', app.referenceNo, input.note)
        await this.notify(app.citizenId, 'Application Approved', `${svcName} ${app.referenceNo} approved by ${officer.name}. Certificate issued to your Wallet.`, '/wallet', 'CheckCircle', 'ok', 'application')
        break
      }
      case 'reject': {
        if (!(await this.apps.transitionTo(app, ApplicationStage.rejected))) throw new ConflictException('Cannot reject from this stage')
        await this.writeAudit(actor, 'reject', app.referenceNo, input.note)
        await this.notify(app.citizenId, 'Application Rejected', `${svcName} ${app.referenceNo} was rejected. Reason: ${input.note ?? 'see remarks'}. You may re-apply.`, '/tracker', 'AlertTriangle', 'err', 'application')
        break
      }
      case 'correction': {
        if (!(await this.apps.transitionTo(app, ApplicationStage.correctionRequested))) throw new ConflictException('Cannot request correction from this stage')
        await this.writeAudit(actor, 'request-correction', app.referenceNo, input.note)
        await this.notify(app.citizenId, 'Correction Requested', `${svcName} ${app.referenceNo}: ${input.note ?? 'additional documents required'}.`, '/tracker', 'AlertTriangle', 'warn', 'application')
        break
      }
      case 'escalate': {
        if (!(await this.apps.transitionTo(app, ApplicationStage.escalation))) throw new ConflictException('Cannot escalate from this stage')
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
    return this.apps.get(idOrRef)
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

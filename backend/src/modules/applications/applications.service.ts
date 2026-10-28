import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Application, ApplicationStage, Officer, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { STAGES, WorkflowEngine } from '../workflow/workflow.engine'
import type { CreateApplicationDto } from './dto/create-application.dto'

const SVC_CODE: Record<string, string> = {
  svc_income: 'IC', svc_community: 'CC', svc_birth: 'BC', svc_death: 'DC', svc_marriage: 'MC',
  svc_dl: 'DL', svc_ration: 'RC', svc_patta: 'PT', svc_residence: 'RES', svc_nativity: 'NAT',
  svc_legalheir: 'LH', svc_ec: 'EC', svc_chitta: 'CHT', svc_adangal: 'ADG', svc_fmb: 'FMB',
  svc_rctransfer: 'RCT', svc_duprc: 'DRC', svc_mvtax: 'MVT', svc_echallan: 'ECH', svc_proptax: 'PTX', svc_water: 'WTR',
}

const DAY = 86_400_000

/** Charter processing time ("15d", "Same day", …) in days; 30 when unpublished. */
export function charterDays(processingTime: string | null | undefined): number {
  if (!processingTime) return 30
  if (/same day/i.test(processingTime)) return 1
  const days = Number(/(\d+)\s*d/i.exec(processingTime)?.[1])
  return Number.isFinite(days) && days > 0 ? days : 30
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService, private readonly engine: WorkflowEngine) {}

  async list(citizenId: string) {
    const apps = await this.prisma.application.findMany({
      where: { citizenId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { officer: true, department: true, remarks: true },
    })
    const items = apps.map((a) => this.toDto(a, a.officer, a.department?.name))
    return { items, total: items.length, page: 0, pageSize: items.length }
  }

  /** Fetch one application. When `ownerCitizenId` is given (citizen-facing path),
   *  an application belonging to another citizen is treated as not found (no IDOR,
   *  no existence disclosure). Officer/internal callers omit it. */
  async get(idOrRef: string, ownerCitizenId?: string) {
    const app = await this.find(idOrRef)
    if (ownerCitizenId && app.app.citizenId !== ownerCitizenId) throw new NotFoundException('Application not found')
    return this.toDto(app.app, app.officer, app.departmentName)
  }

  async create(citizenId: string, dto: CreateApplicationDto) {
    const service = await this.prisma.service.findUnique({ where: { slug: dto.serviceId } })
    if (!service) throw new BadRequestException('Unknown service')

    const count = await this.prisma.application.count()
    const seq = 44821 + count + 1
    const code = SVC_CODE[dto.serviceId] ?? 'GN'
    const app = await this.prisma.application.create({
      data: {
        referenceNo: `APP-2026-${code}-${seq}`,
        serviceSlug: dto.serviceId,
        serviceName: service.name,
        citizenId,
        stage: this.engine.initial,
        statusLabel: this.engine.statusLabel(this.engine.initial),
        // Right to Services: the department's published processing time.
        slaDeadline: new Date(Date.now() + charterDays(service.processingTime) * DAY),
        fields: dto.fields as object,
        documents: (dto.documents ?? []) as object,
      },
      include: { officer: true, department: true, remarks: true },
    })

    await this.prisma.notification.create({
      data: {
        citizenId, title: 'Application Submitted', category: 'application', priority: 'HIGH',
        body: `${service.name} — ${app.referenceNo} received. We'll notify you at each step.`,
        actionPath: '/tracker', icon: 'CheckCircle', color: 'ok',
      },
    })
    await this.prisma.timelineEvent.create({
      data: { citizenId, applicationId: app.id, year: String(new Date().getFullYear()), title: `${service.name} applied`, subtitle: `${app.referenceNo} · Submitted`, kind: 'application' },
    })
    return this.toDto(app, app.officer, app.department?.name)
  }

  /** The officer behind a staff token. Only OFFICER tokens carry one. */
  async officerFor(user: JwtUser): Promise<Officer> {
    const officer = user.officerId ? await this.prisma.officer.findUnique({ where: { id: user.officerId } }) : null
    if (!officer || officer.deletedAt) throw new ForbiddenException('This action requires an officer profile')
    return officer
  }

  /** An officer's jurisdiction: applications assigned to them, plus unassigned
   *  ones from citizens in their district. Never the statewide table. */
  officerScope(officer: Officer): Prisma.ApplicationWhereInput {
    return {
      deletedAt: null,
      OR: [
        { officerId: officer.id },
        { officerId: null, citizen: { district: officer.district } },
        // Checker duty: cases awaiting approval in the officer's own district and department.
        { stage: ApplicationStage.approval, departmentId: officer.departmentId, citizen: { district: officer.district } },
      ],
    }
  }

  /** Raw entity for officer-side operations; outside the officer's scope it is not found. */
  async getRawForOfficer(idOrRef: string, officer: Officer): Promise<Application> {
    const app = await this.prisma.application.findFirst({
      where: { AND: [{ OR: [{ id: idOrRef }, { referenceNo: idOrRef }] }, this.officerScope(officer)] },
    })
    if (!app) throw new NotFoundException('Application not found')
    return app
  }

  /** Officer moves an application ONE legal step along the primary path. */
  async advance(idOrRef: string, officer: Officer) {
    const app = await this.getRawForOfficer(idOrRef, officer)
    if (!(await this.step(app, officer))) throw new ConflictException('Application is already closed')
    return this.get(app.id)
  }

  /** One legal step forward, or null when the application is terminal. */
  async step(app: Application, officer: Officer): Promise<ApplicationStage | null> {
    const next = this.engine.next(app.stage)
    if (!next) return null
    await this.applyTransition(app, next, officer)
    return next
  }

  /** Move an application to a target stage along a legal path (reject, correction,
   *  escalate). None of those paths passes certificate delivery. */
  async transitionTo(app: Application, target: ApplicationStage, officer: Officer): Promise<boolean> {
    const path = this.engine.pathTo(app.stage, target)
    if (!path) return false
    let cur = app
    for (const stage of path) cur = await this.applyTransition(cur, stage, officer)
    return true
  }

  private async applyTransition(app: Application, to: ApplicationStage, actingOfficer: Officer): Promise<Application> {
    const data: Record<string, unknown> = { stage: to, statusLabel: this.engine.statusLabel(to) }

    // Maker-checker: whoever recommends a case into approval is its maker, and
    // the maker cannot also approve it; a second officer must.
    if (to === ApplicationStage.approval) data.makerOfficerId = actingOfficer.id
    if (app.stage === ApplicationStage.approval && to !== ApplicationStage.rejected && app.makerOfficerId === actingOfficer.id) {
      throw new ForbiddenException('Two-person rule: you recommended this case, so a different officer must approve it.')
    }

    // The officer who moves an unassigned application into assignment takes it.
    if (to === ApplicationStage.officerAssigned && !app.officerId) {
      data.officerId = actingOfficer.id
      data.departmentId = actingOfficer.departmentId
    }

    const updated = await this.prisma.application.update({ where: { id: app.id }, data })

    if (to === ApplicationStage.walletDelivery && !app.certIssued) {
      await this.deliverCertificate(updated)
    }
    return updated
  }

  private async deliverCertificate(app: Application): Promise<void> {
    const service = await this.prisma.service.findUnique({ where: { slug: app.serviceSlug } })
    if (!service?.producesDocumentType) return
    const citizen = await this.prisma.citizen.findUnique({ where: { id: app.citizenId } })
    await this.prisma.application.update({ where: { id: app.id }, data: { certIssued: true } })
    await this.prisma.document.create({
      data: {
        citizenId: app.citizenId, name: service.producesDocumentType, type: service.department,
        number: app.referenceNo.replace('APP', 'CRT'), issuer: service.department,
        holderName: (citizen?.fullName ?? 'CITIZEN').toUpperCase(), dob: citizen?.dob ?? undefined,
        validity: 'Valid', status: 'verified', color: '#059669',
      },
    })
    await this.prisma.notification.create({
      data: { citizenId: app.citizenId, title: 'Certificate Ready', category: 'application', priority: 'HIGH', body: `${service.name} issued and delivered to your Wallet.`, actionPath: '/wallet', icon: 'FileCheck', color: 'ok' },
    })
    await this.prisma.timelineEvent.create({
      data: { citizenId: app.citizenId, applicationId: app.id, year: String(new Date().getFullYear()), title: `${service.producesDocumentType} issued`, subtitle: `${app.referenceNo.replace('APP', 'CRT')} · delivered to Wallet`, kind: 'certificate' },
    })
  }

  async addRemark(applicationId: string, by: string, text: string): Promise<void> {
    await this.prisma.comment.create({ data: { applicationId, by, text } })
  }

  private async find(idOrRef: string) {
    const app = await this.prisma.application.findFirst({
      where: { OR: [{ id: idOrRef }, { referenceNo: idOrRef }], deletedAt: null },
      include: { officer: true, department: true, remarks: true },
    })
    if (!app) throw new NotFoundException('Application not found')
    return { app, officer: app.officer, departmentName: app.department?.name }
  }

  toDto(app: Application & { remarks?: { by: string; text: string; at: Date }[] }, officer: Officer | null, departmentName?: string) {
    // Days left until the Right to Services deadline; negative once overdue.
    const open = !this.engine.isTerminal(app.stage)
    const slaDays = open && app.slaDeadline ? Math.ceil((app.slaDeadline.getTime() - Date.now()) / DAY) : null
    // Synthesize progression dates for visited stages from createdAt.
    const currentIdx = STAGES.findIndex((s) => s.id === app.stage)
    const visited: Record<string, string> = {}
    STAGES.forEach((s, i) => { if (i <= currentIdx) visited[s.id] = new Date(app.createdAt.getTime() + i * 86_400_000).toISOString() })
    return {
      id: app.id,
      referenceNo: app.referenceNo,
      serviceId: app.serviceSlug,
      serviceName: app.serviceName,
      status: app.statusLabel,
      stage: app.stage,
      department: departmentName ?? 'Revenue Department',
      officer: officer ? { name: officer.name, designation: officer.designation, jurisdiction: officer.jurisdiction } : null,
      slaDaysRemaining: slaDays,
      slaDeadline: app.slaDeadline?.toISOString() ?? null,
      overdue: slaDays !== null && slaDays < 0,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      timeline: this.engine.buildTimeline(app.stage, visited),
      fields: app.fields as Record<string, unknown>,
      documents: app.documents as unknown[],
      remarks: (app.remarks ?? []).map((r) => ({ at: r.at.toISOString(), by: r.by, text: r.text })),
    }
  }
}

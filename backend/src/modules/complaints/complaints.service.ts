import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Complaint, ComplaintStatus, Officer, Priority } from '@prisma/client'
import { AuditService } from '../../common/audit/audit.service'
import { PrismaService } from '../../prisma/prisma.service'
import { routeComplaint } from './complaint.routing'
import type { CreateComplaintDto } from './dto/create-complaint.dto'

const PRIORITY_LABEL: Record<Priority, string> = { URGENT: 'Urgent', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

function toDto(c: Complaint) {
  return {
    id: c.id, referenceNo: c.referenceNo, citizenId: c.citizenId,
    category: c.category, description: c.description, priority: PRIORITY_LABEL[c.priority],
    status: c.status, department: c.department ?? undefined, etaDays: c.etaDays ?? undefined,
    resolutionNote: c.resolutionNote ?? undefined, resolvedAt: c.resolvedAt?.toISOString(),
    location: c.ward || c.area ? { ward: c.ward, area: c.area, lat: c.lat, lng: c.lng } : undefined,
    attachmentIds: [] as string[],
    createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
  }
}

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(citizenId: string) {
    const rows = await this.prisma.complaint.findMany({ where: { citizenId, deletedAt: null }, orderBy: { createdAt: 'desc' } })
    const items = rows.map(toDto)
    return { items, total: items.length, page: 0, pageSize: items.length }
  }

  async create(citizenId: string, dto: CreateComplaintDto) {
    const routing = routeComplaint(dto.category)
    const seq = 452 + (await this.prisma.complaint.count()) + 1
    const loc = (dto.location ?? {}) as Record<string, unknown>
    const complaint = await this.prisma.complaint.create({
      data: {
        referenceNo: `CMP-TN-2026-${String(seq).padStart(6, '0')}`,
        citizenId, category: dto.category, description: dto.description,
        priority: routing.priority, status: 'submitted',
        department: routing.department, etaDays: routing.etaDays,
        ward: (loc.ward as string) ?? undefined, area: (loc.area as string) ?? undefined,
        lat: (loc.lat as number) ?? undefined, lng: (loc.lng as number) ?? undefined,
      },
    })
    await this.prisma.notification.create({
      data: { citizenId, title: 'Complaint Filed', category: 'complaint', priority: routing.priority, body: `${dto.category} — ${complaint.referenceNo} routed to ${routing.department}. ETA ${routing.etaDays} days.`, actionPath: '/tracker', icon: 'AlertTriangle', color: 'warn' },
    })
    await this.prisma.timelineEvent.create({
      data: { citizenId, year: String(new Date().getFullYear()), title: `Complaint — ${dto.category}`, subtitle: `${complaint.referenceNo} · ${routing.department}`, kind: 'complaint' },
    })
    return toDto(complaint)
  }

  /** Grievances from citizens in the officer's district: open ones first, oldest first. */
  async queue(officer: Officer) {
    const rows = await this.prisma.complaint.findMany({
      where: { deletedAt: null, citizen: { district: officer.district } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
    const open = (s: ComplaintStatus) => s !== ComplaintStatus.resolved && s !== ComplaintStatus.closed
    rows.sort((a, b) => Number(open(b.status)) - Number(open(a.status)))
    const items = rows.map(toDto)
    return { items, total: items.length, open: rows.filter((r) => open(r.status)).length }
  }

  /** Officer action on a grievance. Only legal moves; resolving needs a note the citizen will read. */
  async act(id: string, input: { action: string; note?: string }, officer: Officer) {
    const c = await this.prisma.complaint.findFirst({ where: { OR: [{ id }, { referenceNo: id }], deletedAt: null, citizen: { district: officer.district } } })
    if (!c) throw new NotFoundException('Grievance not found')
    const rule = GRIEVANCE_ACTIONS[input.action]
    if (!rule) throw new BadRequestException(`Unknown action ${input.action}`)
    if (!rule.from.includes(c.status)) throw new ConflictException(`Cannot ${input.action} a grievance that is ${c.status}`)
    const note = input.note?.trim()
    if (input.action === 'resolve' && !note) throw new BadRequestException('Describe what was done: the citizen sees this note')

    const updated = await this.prisma.complaint.update({
      where: { id: c.id },
      data: { status: rule.to, ...(input.action === 'resolve' ? { resolutionNote: note, resolvedAt: new Date() } : {}) },
    })
    const actor = `${officer.name} (${officer.designation})`
    await this.audit.record({ actor, action: `grievance-${input.action}`, entity: 'complaint', entityId: c.referenceNo, note })
    await this.prisma.notification.create({
      data: {
        citizenId: c.citizenId, category: 'complaint', priority: input.action === 'resolve' ? 'HIGH' : 'MEDIUM', actionPath: '/complaint',
        icon: input.action === 'resolve' ? 'CheckCircle' : 'AlertTriangle', color: input.action === 'resolve' ? 'ok' : 'info',
        title: rule.title, body: `${c.category} · ${c.referenceNo}: ${rule.body(officer.name)}${note ? ` ${note}` : ''}`,
      },
    })
    return toDto(updated)
  }
}

const S = ComplaintStatus
/** Grievance workflow: submitted → in progress → resolved → closed, with escalation. */
const GRIEVANCE_ACTIONS: Record<string, { from: ComplaintStatus[]; to: ComplaintStatus; title: string; body: (who: string) => string }> = {
  start: { from: [S.submitted, S.assigned, S.escalated], to: S.inProgress, title: 'Grievance being worked on', body: (who) => `${who} has taken it up.` },
  escalate: { from: [S.submitted, S.assigned, S.inProgress], to: S.escalated, title: 'Grievance escalated', body: () => 'escalated to a senior officer.' },
  resolve: { from: [S.assigned, S.inProgress, S.escalated], to: S.resolved, title: 'Grievance resolved', body: (who) => `resolved by ${who}.` },
  close: { from: [S.resolved], to: S.closed, title: 'Grievance closed', body: () => 'closed.' },
}

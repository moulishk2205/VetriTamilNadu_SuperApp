import { Injectable } from '@nestjs/common'
import { Complaint, Priority } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { routeComplaint } from './complaint.routing'
import type { CreateComplaintDto } from './dto/create-complaint.dto'

const PRIORITY_LABEL: Record<Priority, string> = { URGENT: 'Urgent', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

function toDto(c: Complaint) {
  return {
    id: c.id, referenceNo: c.referenceNo, citizenId: c.citizenId,
    category: c.category, description: c.description, priority: PRIORITY_LABEL[c.priority],
    status: c.status, department: c.department ?? undefined, etaDays: c.etaDays ?? undefined,
    location: c.ward || c.area ? { ward: c.ward, area: c.area, lat: c.lat, lng: c.lng } : undefined,
    attachmentIds: [] as string[],
    createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
  }
}

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

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
}

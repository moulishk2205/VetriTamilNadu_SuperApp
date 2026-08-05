import { Injectable, NotFoundException } from '@nestjs/common'
import { Notification, Priority } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

const pageOf = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

const PRIORITY_OUT: Record<Priority, 'high' | 'normal' | 'low'> = {
  URGENT: 'high', HIGH: 'high', MEDIUM: 'normal', LOW: 'low',
}

/** Relative "2 hours ago" label the UI shows. */
function timeLabel(at: Date): string {
  const s = Math.floor((Date.now() - at.getTime()) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m} minute${m > 1 ? 's' : ''} ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`
}

export function toNotificationDto(n: Notification) {
  return {
    id: n.id, title: n.title, body: n.body, category: n.category,
    priority: PRIORITY_OUT[n.priority], read: n.read,
    createdAt: n.createdAt.toISOString(), timeLabel: timeLabel(n.createdAt),
    icon: n.icon ?? undefined, color: n.color ?? undefined, actionPath: n.actionPath ?? undefined,
  }
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private feed(citizenId: string) {
    // A citizen sees their own notifications plus broadcasts (citizenId null).
    return this.prisma.notification.findMany({
      where: { OR: [{ citizenId }, { citizenId: null }] },
      orderBy: { createdAt: 'desc' },
    })
  }

  async list(citizenId: string) {
    return pageOf((await this.feed(citizenId)).map(toNotificationDto))
  }

  async markRead(id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } })
    if (!n) throw new NotFoundException('Notification not found')
    return toNotificationDto(await this.prisma.notification.update({ where: { id }, data: { read: true } }))
  }

  async markAllRead(citizenId: string) {
    await this.prisma.notification.updateMany({ where: { OR: [{ citizenId }, { citizenId: null }], read: false }, data: { read: true } })
    return this.list(citizenId)
  }

  /** Admin broadcast — a null-citizen notification that lands in every feed. */
  async broadcast(title: string, body: string) {
    await this.prisma.notification.create({
      data: { title, body, category: 'system', priority: 'MEDIUM', icon: 'Bell', color: 'info', channel: 'broadcast' },
    })
    return { delivered: true }
  }
}

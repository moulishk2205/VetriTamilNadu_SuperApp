import { http, HttpResponse } from 'msw'
import { db } from '../db'

const page = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

export const notificationHandlers = [
  http.get('/api/notifications', () => HttpResponse.json(page(db.notifications))),
  http.patch('/api/notifications/:id/read', ({ params }) => {
    const n = db.notifications.find((x) => x.id === params.id)
    if (!n) return new HttpResponse(null, { status: 404 })
    n.read = true
    return HttpResponse.json(n)
  }),
  /** Admin broadcast → lands in every citizen's notification feed. */
  http.post('/api/admin/broadcast', async ({ request }) => {
    const { title, body } = (await request.json()) as { title: string; body: string }
    db.notifications.unshift({
      id: `ntf_bc_${Date.now()}`, title, body, category: 'system', priority: 'high', read: false,
      createdAt: new Date().toISOString(), timeLabel: 'Just now', icon: 'Bell', color: 'info',
    })
    return HttpResponse.json({ delivered: true })
  }),

  http.post('/api/notifications/read-all', () => {
    db.notifications.forEach((n) => (n.read = true))
    return HttpResponse.json(page(db.notifications))
  }),
]

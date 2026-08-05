import { apiClient } from '@/lib/api/client'
import { PageSchema } from '@/types/models/common'
import { NotificationSchema, type AppNotification } from '@/types/models/notification'

export const notificationsApi = {
  list: (): Promise<AppNotification[]> =>
    apiClient.get('/notifications', { schema: PageSchema(NotificationSchema) }).then((r) => r.items),
  markRead: (id: string): Promise<AppNotification> =>
    apiClient.patch(`/notifications/${id}/read`, undefined, { schema: NotificationSchema }),
  markAllRead: (): Promise<AppNotification[]> =>
    apiClient.post('/notifications/read-all', undefined, { schema: PageSchema(NotificationSchema) }).then((r) => r.items),
}

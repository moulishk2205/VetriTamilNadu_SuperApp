import { z } from 'zod'

export const NotificationCategory = z.enum(['application', 'complaint', 'scheme', 'document', 'system', 'reminder'])
export type NotificationCategory = z.infer<typeof NotificationCategory>

export const NotificationPriority = z.enum(['low', 'normal', 'high', 'urgent'])
export type NotificationPriority = z.infer<typeof NotificationPriority>

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  category: NotificationCategory,
  priority: NotificationPriority.default('normal'),
  read: z.boolean().default(false),
  createdAt: z.string(),
  /** Deep-link target (a route path) the notification opens. */
  actionPath: z.string().optional(),
  /** Legacy icon/color hints so the current card renders unchanged. */
  icon: z.string().optional(),
  color: z.string().optional(),
  timeLabel: z.string().optional(),
})
export type AppNotification = z.infer<typeof NotificationSchema>

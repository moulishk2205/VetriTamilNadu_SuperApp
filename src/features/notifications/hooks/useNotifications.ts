import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useC } from '@/hooks/useUi'
import { resolveIcon } from '@/components/ui/iconRegistry'
import type { Colors } from '@/styles/theme'
import { useAuthStore } from '@/store/authStore'
import { notificationsApi } from '../api/notificationsApi'

export const notificationKeys = { all: ['notifications'] as const }

/** Notifications belong to a citizen; staff sessions have none to fetch. */
export function useNotificationsQuery() {
  const isCitizen = useAuthStore((s) => s.isAuthenticated && s.role === 'citizen')
  return useQuery({ queryKey: notificationKeys.all, queryFn: notificationsApi.list, enabled: isCitizen })
}

/** View shape consumed by NotificationsScreen. Icon strings → components and
 *  theme color keys → palette values are resolved here, not in the component. */
export interface NotificationCard {
  icon: ReturnType<typeof resolveIcon>
  title: string
  desc: string
  time?: string
  cl: string
  read: boolean
}

export function useNotificationCards(): NotificationCard[] {
  const c = useC()
  const { data } = useNotificationsQuery()
  return useMemo(
    () =>
      (data ?? []).map((n) => ({
        icon: resolveIcon(n.icon),
        title: n.title,
        desc: n.body,
        time: n.timeLabel,
        cl: c[(n.color ?? 'info') as keyof Colors] ?? c.info,
        read: n.read,
      })),
    [data, c],
  )
}

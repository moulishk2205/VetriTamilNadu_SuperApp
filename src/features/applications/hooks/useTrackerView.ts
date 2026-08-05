import { useMemo } from 'react'
import { useApplicationsQuery } from './useApplications'

function fmt(at?: string): string {
  if (!at) return 'Pending'
  const d = new Date(at)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export interface TrackerView {
  loading: boolean
  hasApp: boolean
  id: string
  title: string
  ref: string
  status: string
  statusTone: 'warn' | 'ok' | 'err'
  slaDays: number | null
  officer: { name: string; designation: string; jurisdiction: string } | null
  timeline: { t: string; d: string; s: 'done' | 'current' | 'pending' }[]
}

/** Most-recent application, mapped to the Service Tracker's display shape. */
export function useTrackerView(): TrackerView {
  const { data, isLoading } = useApplicationsQuery()
  return useMemo(() => {
    const app = data?.[0]
    const statusTone = app
      ? app.status === 'Completed'
        ? 'ok'
        : app.status === 'Rejected' || app.status === 'Escalated'
          ? 'err'
          : 'warn'
      : 'warn'
    return {
      loading: isLoading,
      hasApp: Boolean(app),
      id: app?.id ?? '',
      title: app?.serviceName ?? '',
      ref: app?.referenceNo ?? '',
      status: app?.status ?? '',
      statusTone,
      slaDays: app?.slaDaysRemaining ?? null,
      officer: app?.officer ?? null,
      timeline: (app?.timeline ?? []).map((row) => ({ t: row.label, d: fmt(row.at), s: row.status })),
    }
  }, [data, isLoading])
}

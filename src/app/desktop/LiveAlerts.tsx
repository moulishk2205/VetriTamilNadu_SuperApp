import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, X } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAuthStore } from '@/store/authStore'
import { LIVE } from '@/lib/api/live'
import { applicationsApi, type ApplicationDTO } from '@/features/applications/api/applicationsApi'
import { applicationKeys } from '@/features/applications/hooks/useApplications'
import { officerApi } from '@/features/officer/api/officerApi'
import { officerKeys } from '@/features/officer/hooks/useOfficer'

interface Alert { id: number; title: string; body: string }

const SHOW_MS = 8_000
const stageLabel = (a: ApplicationDTO) => a.timeline.find((t) => t.status === 'current')?.label ?? a.stage

/**
 * Compares each refetch with the last one and reports what changed. The
 * first load (and the first after a sign-in, which clears the cache) only
 * sets the baseline, so nothing is announced for data the user already sees.
 */
function useDiff(items: ApplicationDTO[] | undefined, onChange: (a: ApplicationDTO, before: string | undefined) => void) {
  const last = useRef<Map<string, string> | null>(null)
  const notify = useRef(onChange)
  notify.current = onChange
  useEffect(() => {
    if (!items) { last.current = null; return }
    const now = new Map(items.map((a) => [a.id, a.stage]))
    if (last.current) for (const a of items) if (last.current.get(a.id) !== a.stage) notify.current(a, last.current.get(a.id))
    last.current = now
  }, [items])
}

/**
 * Live workflow alerts for the web portal. A citizen is told when one of
 * their applications moves to a new stage (an officer's decision); an officer
 * is told when a new case lands in their worklist. Driven by the same live
 * queries the screens use, so nothing extra is fetched.
 */
export function LiveAlerts() {
  const c = useC()
  const role = useAuthStore((s) => (s.isAuthenticated ? s.role : null))
  const [alerts, setAlerts] = useState<Alert[]>([])
  const seq = useRef(0)

  const push = (title: string, body: string) => {
    const id = ++seq.current
    setAlerts((list) => [...list.slice(-2), { id, title, body }])
    setTimeout(() => setAlerts((list) => list.filter((a) => a.id !== id)), SHOW_MS)
  }

  const mine = useQuery({ queryKey: applicationKeys.all, queryFn: applicationsApi.list, enabled: role === 'citizen', ...LIVE })
  const queue = useQuery({ queryKey: officerKeys.queue, queryFn: officerApi.queue, enabled: role === 'officer', ...LIVE })

  useDiff(role === 'citizen' ? mine.data : undefined, (a, before) => {
    if (before !== undefined) push('Application update', `${a.serviceName} (${a.referenceNo}) is now at: ${stageLabel(a)}`)
  })
  useDiff(role === 'officer' ? queue.data?.items : undefined, (a, before) => {
    if (before === undefined) push('New case in your worklist', `${a.serviceName} · ${a.referenceNo} · ${stageLabel(a)}`)
  })

  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000, display: 'grid', gap: 10, width: 'min(360px, calc(100vw - 32px))' }}>
      {alerts.map((a) => (
        <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: c.card, border: `1px solid ${c.bdr}`, borderLeft: `4px solid ${c.pri}`, borderRadius: 12, padding: '12px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)', animation: 'fadeIn 0.25s' }}>
          <Bell size={17} color={c.pri} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{a.title}</p>
            <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 2, lineHeight: 1.45, overflowWrap: 'anywhere' }}>{a.body}</p>
          </div>
          <button onClick={() => setAlerts((list) => list.filter((x) => x.id !== a.id))} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <X size={15} color={c.txt3} />
          </button>
        </div>
      ))}
    </div>
  )
}

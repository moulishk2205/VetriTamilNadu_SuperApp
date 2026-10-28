import { useMemo, useState } from 'react'
import { CheckCheck, ArrowRight, BellOff } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { resolveIcon } from '@/components/ui/iconRegistry'
import { useNotificationsQuery } from '@/features/notifications/hooks/useNotifications'
import { notificationsApi } from '@/features/notifications/api/notificationsApi'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader, Panel, FilterChips, EmptyState, LoadingRows, DeskBtn, StatusChip, Toast } from '@/app/desktop/DesktopUI'

const TONE_KEY: Record<string, 'ok' | 'warn' | 'err' | 'info' | 'neutral'> = {
  ok: 'ok', warn: 'warn', err: 'err', info: 'info', sec: 'neutral',
}

/**
 * Desktop notification centre: a government inbox with category filters, a
 * read/unread split and a mark-all action. Uses the same
 * `useNotificationsQuery()` and notifications API as the mobile screen.
 */
export default function DesktopNotifications() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const qc = useQueryClient()
  const { data, isLoading } = useNotificationsQuery()
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')

  const items = useMemo(() => data ?? [], [data])
  const unread = items.filter((n) => !n.read).length

  const counts = useMemo(() => {
    const by = (cat: string) => items.filter((n) => n.category === cat).length
    return { all: items.length, unread, application: by('application'), complaint: by('complaint'), scheme: by('scheme'), document: by('document') }
  }, [items, unread])

  const rows = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'unread') return items.filter((n) => !n.read)
    return items.filter((n) => n.category === filter)
  }, [items, filter])

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id).catch(() => undefined)
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markAll = async () => {
    await notificationsApi.markAllRead().catch(() => undefined)
    void qc.invalidateQueries({ queryKey: ['notifications'] })
    setToast('All notifications marked as read')
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Official updates on your applications, grievances, documents and welfare eligibility."
        actions={unread > 0 ? <DeskBtn icon={CheckCheck} onClick={() => void markAll()}>Mark all as read ({unread})</DeskBtn> : undefined}
      />

      <div style={{ marginBottom: 20 }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'unread', label: 'Unread', count: counts.unread },
            { id: 'application', label: 'Applications', count: counts.application },
            { id: 'complaint', label: 'Grievances', count: counts.complaint },
            { id: 'scheme', label: 'Schemes', count: counts.scheme },
            { id: 'document', label: 'Documents', count: counts.document },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="vtn-card"><LoadingRows rows={5} /></div>
      ) : rows.length === 0 ? (
        <div className="vtn-card">
          <EmptyState
            title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            desc={filter === 'unread'
              ? 'Every notification has been read. New updates on your applications will appear here.'
              : 'Updates on your applications, grievances and welfare eligibility will appear here automatically.'}
            action={<DeskBtn variant="primary" onClick={() => onNav('services')}>Browse services</DeskBtn>}
          />
        </div>
      ) : (
        <Panel padded={false}>
          {rows.map((n, i) => {
            const Icon = resolveIcon(n.icon)
            const tone = TONE_KEY[n.color ?? 'info'] ?? 'info'
            const col = tone === 'neutral' ? c.txt2 : c[tone]
            return (
              <div
                key={n.id}
                style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 20px', borderBottom: i < rows.length - 1 ? `1px solid ${c.bdr}` : 'none', background: n.read ? 'transparent' : `${c.sec}0A` }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 11, background: `${col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon size={18} color={col} />
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9 }}>
                    <p style={{ fontSize: 14.5, fontWeight: n.read ? 500 : 700, color: c.txt }}>{n.title}</p>
                    {!n.read && <StatusChip label="New" tone="warn" />}
                    <StatusChip label={n.category.charAt(0).toUpperCase() + n.category.slice(1)} tone="neutral" />
                  </div>
                  <p style={{ fontSize: 13, color: c.txt2, marginTop: 5, lineHeight: 1.6 }}>{n.body}</p>
                  <p className="vtn-num" style={{ fontSize: 11.5, color: c.txt3, marginTop: 7 }}>{n.timeLabel}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
                  {n.actionPath && (
                    <DeskBtn icon={ArrowRight} onClick={() => onNav(n.actionPath!.replace(/^\//, ''))}>Open</DeskBtn>
                  )}
                  {!n.read && (
                    <button onClick={() => void markRead(n.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      <BellOff size={13} />Mark read
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </Panel>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  )
}

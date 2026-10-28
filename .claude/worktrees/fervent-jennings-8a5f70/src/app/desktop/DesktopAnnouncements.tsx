import { Megaphone, ArrowRight } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { resolveIcon } from '@/components/ui/iconRegistry'
import { useNotificationsQuery } from '@/features/notifications/hooks/useNotifications'

const TONE: Record<string, keyof ReturnType<typeof useC>> = { ok: 'ok', warn: 'warn', err: 'err', info: 'info', sec: 'sec' }

/**
 * Announcements & notices — the citizen's live notification feed presented as a
 * government bulletin board. Same `useNotificationsQuery()` as the mobile app.
 */
export function DesktopAnnouncements({ limit = 5 }: { limit?: number }) {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { data, isLoading } = useNotificationsQuery()

  const items = (data ?? []).slice(0, limit)

  return (
    <section style={{ background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: `1px solid ${c.bdr}` }}>
        <Megaphone size={17} color={c.pri} />
        <h2 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: c.txt }}>Announcements &amp; Notices</h2>
        <button onClick={() => onNav('notifications')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: c.pri, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          All <ArrowRight size={13} />
        </button>
      </div>

      {isLoading && <p style={{ padding: '18px', fontSize: 13, color: c.txt2 }}>Loading notices…</p>}
      {!isLoading && items.length === 0 && <p style={{ padding: '18px', fontSize: 13, color: c.txt2 }}>No announcements right now.</p>}

      {items.map((n, i) => {
        const Icon = resolveIcon(n.icon)
        const tone = c[(TONE[n.color ?? 'info'] ?? 'info') as 'ok'] as string
        return (
          <button
            key={n.id}
            onClick={() => onNav(n.actionPath ? n.actionPath.replace(/^\//, '') : 'notifications')}
            style={{ width: '100%', display: 'flex', gap: 13, alignItems: 'flex-start', padding: '14px 18px', background: n.read ? 'transparent' : `${c.sec}0A`, border: 'none', borderBottom: i < items.length - 1 ? `1px solid ${c.bdr}` : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 10, background: `${tone}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Icon size={16} color={tone} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>{n.title}</span>
                {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.sec, flexShrink: 0 }} />}
              </span>
              <span style={{ display: 'block', fontSize: 12.5, color: c.txt2, marginTop: 3, lineHeight: 1.5 }}>{n.body}</span>
              <span style={{ display: 'block', fontSize: 11, color: c.txt3, marginTop: 5 }}>{n.timeLabel}</span>
            </span>
          </button>
        )
      })}
    </section>
  )
}

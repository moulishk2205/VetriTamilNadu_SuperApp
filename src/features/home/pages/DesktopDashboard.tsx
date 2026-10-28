import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useApp, useT } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { analyticsApi } from '@/features/analytics/api/analyticsApi'
import { useNotificationsQuery } from '@/features/notifications/hooks/useNotifications'
import { useServiceCatalogView, useServiceCatalogLoading } from '@/features/services/hooks/useServices'
import { PUBLISHED_CONSTITUENCY } from '@/features/transparency/publishedFigures'
import { useHomeBoard, BOARD_STATE } from '@/features/home/useHomeBoard'
import { TamilNaduMap } from '@/components/map/TamilNaduMap'
import { StepRail } from '@/components/feedback/StepRail'
import type { CSSProperties } from 'react'

/** Staged entrance order for the home screen's blocks (see `.v-enter`). */
const enter = (i: number) => ({ '--i': i }) as CSSProperties

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
/** The catalogue writes durations as "15d"; say it in words. */
const duration = (time: string) => time.replace(/^(\d+)d$/, (_, n: string) => plural(Number(n), 'day', 'days'))

// Settings-style icon tiles: each service keeps one colour, so it is found by
// sight on the next visit. Status colours stay separate (dots and step rails).
const STATE = BOARD_STATE

/**
 * Web dashboard. It answers three questions in order — what needs me, where do
 * my applications stand, what can I do next — and gives the citizen's own
 * constituency a working card. Every figure comes from queries the rest of the
 * portal already uses.
 */
export default function DesktopDashboard() {
  const t = useT()
  const { anim } = useApp()
  // Entrance motion follows the Animations preference.
  const en = anim ? ' v-enter' : ''
  const { onNav } = useAppNavigation()
  const { citizen, hasPermission } = useAuth()
  const board = useHomeBoard()
  const services = useServiceCatalogView()
  const servicesLoading = useServiceCatalogLoading()
  const { data: notifications } = useNotificationsQuery()
  // Live for officer / MLA roles; citizens see the published figures.
  const live = useQuery({ queryKey: ['analytics', 'constituency'], queryFn: analyticsApi.constituency, enabled: hasPermission('analytics:read'), retry: false })
  const area = live.data ?? PUBLISHED_CONSTITUENCY

  const first = (citizen?.fullName ?? 'Citizen').split(' ')[0]
  const urgent = board.attention.filter((x) => x.tone !== 'ok')
  const popular = [...services].sort((a, b) => Number(b.pop) - Number(a.pop)).slice(0, 6)
  const done = area.stats.submitted > 0 ? Math.round((area.stats.completed / area.stats.submitted) * 100) : 0
  const issues = area.topComplaints.slice(0, 2)

  return (
    <div className="vh-page">
      <div className={`vh-lead${en}`} style={enter(0)}>
        <h1 className="vh-hello"><span lang="ta" className="vh-hello-ta">வணக்கம்,</span><span>{first}</span></h1>
        <p aria-live="polite">
          {board.loading ? 'Loading your dashboard…'
            : `${urgent.length > 0 ? `${plural(urgent.length, 'thing needs', 'things need')} your action.` : 'Nothing needs your action.'} ${plural(board.inProgress, 'application is', 'applications are')} moving.`}
        </p>
      </div>

      {board.failed && (
        <div className="vh-card" role="alert" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 18px', padding: '1em 1.375em', marginTop: 20 }}>
          <AlertTriangle size={22} color="#C92A2A" aria-hidden="true" />
          <p style={{ flex: '1 1 280px' }}><strong>We could not load your applications.</strong> Check your connection and try again — nothing has been lost.</p>
          <button className="vh-btn vh-btn--line" onClick={board.retry}><RefreshCw size={16} aria-hidden="true" />Try again</button>
        </div>
      )}

      <div className="vh-grid">
        <section className={`vh-card vh-a${en}${!board.loading && urgent.length > 0 ? ' vh-card--urgent' : ''}`} style={enter(1)} aria-labelledby="h-action">
          <div className="vh-ch"><h2 id="h-action">{t('Needs your action')}{urgent.length > 0 && <span className="vh-badge">{urgent.length}</span>}</h2></div>
          {board.loading ? <div className="vh-skel" /> : urgent.length === 0 ? (
            <div style={{ display: 'flex', gap: 14, padding: '.4em 1.375em 1.4em' }}>
              <CheckCircle2 size={26} color="#1E8E4E" aria-hidden="true" style={{ flexShrink: 0 }} />
              <p><strong style={{ fontWeight: 650 }}>Nothing needs your action today.</strong><br /><span style={{ color: 'var(--ink2)', fontSize: '.94em' }}>Corrections, decisions and expiring documents will appear here.</span></p>
            </div>
          ) : (
            <>
              {urgent.slice(0, 2).map((it) => (
                <div key={it.id} style={{ display: 'flex', gap: 16, padding: '.5em 1.375em .9em' }}>
                  <span className="vh-sq" style={{ background: it.tone === 'err' ? '#D9480F' : '#E8590C', width: 46, height: 46, borderRadius: 13 }}><AlertTriangle size={24} aria-hidden="true" /></span>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: '1.19em', fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.3 }}>{it.title}</b>
                    <p style={{ fontSize: '.97em', color: 'var(--ink2)', marginTop: 4 }}>{it.detail}</p>
                    <button className="vh-btn" style={{ marginTop: 14 }} onClick={() => onNav(it.nav)}>{it.action}<ArrowRight size={18} aria-hidden="true" /></button>
                  </div>
                </div>
              ))}
              <p style={{ margin: '.4em 1.375em 0', padding: '.8em 0 1em', borderTop: '1px solid var(--line)', fontSize: '.9em', color: 'var(--ink2)' }}>
                {urgent.length > 2 ? `${urgent.length - 2} more in Notifications.` : 'Nothing else needs you today.'}
              </p>
            </>
          )}
        </section>

        <section className={`vh-card vh-b${en}`} style={enter(2)} aria-labelledby="h-apps">
          <div className="vh-ch"><h2 id="h-apps">{t('Your applications')}</h2>{board.totalApplications > 0 && <button className="vh-link" onClick={() => onNav('tracker')}>See all {board.totalApplications}<ChevronRight size={16} aria-hidden="true" /></button>}</div>
          {board.loading ? <><div className="vh-skel" /><div className="vh-skel" /></> : board.applications.length === 0 ? (
            <p style={{ padding: '.2em 1.375em 1.4em', color: 'var(--ink2)' }}>You have not applied for anything yet. Choose a service below — your application will appear here with each step explained.</p>
          ) : board.applications.slice(0, 3).map((r) => (
            <button key={r.id} className="vh-row" style={{ gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1.5fr) minmax(0,.9fr) 20px' }} onClick={() => onNav(r.state === 'done' ? 'wallet' : 'tracker')} aria-label={`${r.title}, reference ${r.ref}: ${STATE[r.state].label ?? r.status}`}>
              <span><b>{r.title}</b><small className="vh-mono">{r.ref}</small></span>
              <span className="vh-rail">
                <span className="vh-st"><i style={{ background: STATE[r.state].dot }} />{STATE[r.state].label ?? (r.status === 'In Progress' ? 'In progress' : r.status)}</span>
                {r.steps > 0 && <StepRail steps={r.steps} step={r.step} colour={STATE[r.state].dot} complete={r.state === 'done'} track="var(--line)" style={{ maxWidth: 260 }} />}
                <small className="v-num">{r.state === 'done' ? 'Issued to your Digital Locker' : `Step ${r.step} of ${r.steps} · ${r.stageNow}`}</small>
              </span>
              <span className="vh-due" style={r.state === 'done' ? { color: 'var(--link)', fontWeight: 650 } : undefined}>
                {r.state === 'done' ? 'Open locker' : r.daysLeft != null ? <>Decision due<br />in {plural(r.daysLeft, 'day', 'days')}</> : r.stageNext ? <>Next:<br />{r.stageNext}</> : ''}
              </span>
              <ChevronRight size={20} color="var(--chev)" aria-hidden="true" />
            </button>
          ))}
        </section>

        <section className={`vh-card vh-c${en}`} style={enter(3)} aria-labelledby="h-svc">
          <div className="vh-ch"><h2 id="h-svc">{t('Apply for a service')}</h2><button className="vh-link" onClick={() => onNav('services')}>All {services.length || ''} services<ChevronRight size={16} aria-hidden="true" /></button></div>
          {servicesLoading ? <><div className="vh-skel" /><div className="vh-skel" /></> : (
            <div className="vh-svc">
              {popular.map((s) => (
                <button key={s.id} onClick={() => onNav(`service/${s.id}`)}>
                  <span className="vh-sq" style={{ background: s.colour }}><s.icon size={20} aria-hidden="true" /></span>
                  <span style={{ minWidth: 0 }}><b>{s.n}</b><small>{duration(s.time)} · {s.fee}</small></span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={`vh-card vh-d${en}`} style={enter(4)} aria-labelledby="h-area">
          <div className="vh-ch" style={{ paddingBottom: '.5em' }}><h2 id="h-area">Your constituency</h2><button className="vh-link" onClick={() => onNav('mla')}>Full report<ChevronRight size={16} aria-hidden="true" /></button></div>
          <div className="vh-map"><TamilNaduMap focus={area.constituency} /><span>{area.constituency}</span></div>
          <div className="vh-stats">
            <p><b>{done}<i>%</i></b><small>applications completed</small></p>
            <p><b>{area.stats.avgResolutionDays}<i> days</i></b><small>average to decide</small></p>
            <p><b>{area.stats.pending}</b><small>still in progress</small></p>
          </div>
          {issues.length > 0 && (
            <p style={{ padding: '.75em 1.125em 0', fontSize: '.875em', color: 'var(--ink2)' }}>
              Most reported here: {issues.map((x, i) => <span key={x.label}>{i > 0 && ', '}<b style={{ color: 'var(--ink)', fontWeight: 600 }}>{x.label.toLowerCase()}</b> ({x.value})</span>)}
            </p>
          )}
          <div style={{ padding: '.75em 1em 1em' }}><button className="vh-btn vh-btn--line" style={{ width: '100%' }} onClick={() => onNav('complaint')}>Report an issue in {area.constituency}<ArrowRight size={17} aria-hidden="true" /></button></div>
        </section>

        <section className={`vh-card vh-e${en}`} style={enter(5)} aria-labelledby="h-news">
          <div className="vh-ch"><h2 id="h-news">Recent updates</h2><button className="vh-link" onClick={() => onNav('notifications')}>All<ChevronRight size={16} aria-hidden="true" /></button></div>
          {(notifications ?? []).length === 0 && <p style={{ padding: '.2em 1.375em 1.4em', color: 'var(--ink2)', fontSize: '.94em' }}>Updates about your applications and documents will appear here.</p>}
          {(notifications ?? []).slice(0, 4).map((n) => (
            <button key={n.id} className="vh-row" style={{ gridTemplateColumns: 'minmax(0,1fr)', padding: '.62em 1.375em' }} onClick={() => onNav(n.actionPath ? n.actionPath.replace(/^\//, '') : 'notifications')}>
              <span><b style={{ fontSize: '.91em' }}>{n.title}</b><small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.timeLabel ? `${n.timeLabel} · ` : ''}{n.body}</small></span>
            </button>
          ))}
        </section>
      </div>
    </div>
  )
}

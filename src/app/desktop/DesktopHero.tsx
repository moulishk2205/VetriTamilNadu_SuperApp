import { Timer, Wallet, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react'
import { Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useApplicationsQuery } from '@/features/applications/hooks/useApplications'
import { useDocumentsQuery } from '@/features/documents/hooks/useDocuments'
import { useSchemeCards } from '@/features/schemes/hooks/useSchemes'

const DONE = ['Completed', 'Rejected']

/**
 * Executive hero band: official greeting over the emblem watermark, plus the
 * citizen's live key figures. Every number comes from the same queries the
 * mobile app uses — this is presentation only.
 */
export function DesktopHero() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { citizen } = useAuth()
  const { data: apps } = useApplicationsQuery()
  const { data: docs } = useDocumentsQuery()
  const schemes = useSchemeCards()

  const active = (apps ?? []).filter((a) => !DONE.includes(a.status)).length
  const stats = [
    { icon: Timer, l: 'Active Applications', v: active, key: 'tracker' },
    { icon: Wallet, l: 'Documents in Locker', v: (docs ?? []).length, key: 'wallet' },
    { icon: Sparkles, l: 'Eligible Schemes', v: schemes.length, key: 'schemes' },
    { icon: AlertTriangle, l: 'Open Grievances', v: 1, key: 'complaint' },
  ]

  return (
    <section style={{ background: `linear-gradient(135deg, ${c.pri} 0%, ${c.acc} 100%)`, borderRadius: 20, padding: '34px 34px 30px', position: 'relative', overflow: 'hidden', color: '#fff' }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', right: 40, transform: 'translateY(-50%)', opacity: 0.1, filter: 'grayscale(1) brightness(1.8)', pointerEvents: 'none' }}>
        <Seal size={300} />
      </div>

      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', fontFamily: "'Noto Sans Tamil', sans-serif" }}>வணக்கம்,</p>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.7, marginTop: 4 }}>{citizen?.fullName ?? 'Citizen'}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.74)', marginTop: 9, maxWidth: 560, lineHeight: 1.6 }}>
          Welcome to your Government of Tamil Nadu citizen dashboard. Apply for services, track applications and access your verified documents — all in one place.
        </p>

        <button onClick={() => onNav('services')} style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: c.sec, color: '#3A2A05', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Browse All Services <ArrowRight size={16} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 28 }}>
          {stats.map((s) => (
            <button key={s.l} onClick={() => onNav(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '13px 15px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={18} color={c.secLt} />
              </span>
              <span>
                <span style={{ display: 'block', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{s.v}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.l}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

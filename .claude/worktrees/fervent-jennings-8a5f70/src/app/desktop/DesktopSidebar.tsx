import { QrCode, User, ChevronRight, Phone, HeartPulse, Flame, Siren, BadgeCheck } from 'lucide-react'
import { Seal } from '@/components/ui'
import { useC, useT } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DESKTOP_NAV } from './navItems'

/**
 * Left rail: verified identity summary, section jump-links and emergency
 * numbers. Sticky so it stays reachable through a long dashboard scroll.
 */
export function DesktopSidebar() {
  const c = useC()
  const t = useT()
  const { onNav } = useAppNavigation()
  const { citizen } = useAuth()

  return (
    <aside style={{ position: 'sticky', top: 76, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity */}
      <div style={{ background: c.pri, borderRadius: 16, padding: 18, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', right: -26, bottom: -26, opacity: 0.1, filter: 'grayscale(1) brightness(1.8)' }}><Seal size={140} /></div>
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,0.6)' }}>CITIZEN ID</p>
          <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.6, marginTop: 3 }}>{citizen?.citizenId ?? '—'}</p>
          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 12 }}>{citizen?.fullName ?? 'Citizen'}</p>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.66)', marginTop: 2 }}>{citizen?.district ?? '—'} · {citizen?.taluk ?? '—'}</p>
          <p style={{ fontSize: 11.5, color: c.secLt, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <BadgeCheck size={13} />{(citizen?.verifiedVia ?? []).join(' + ') || 'Unverified'}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={pill} onClick={() => onNav('profile')}><QrCode size={12} />QR Verify</button>
            <button style={pill} onClick={() => onNav('profile')}><User size={12} />Profile</button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 16, overflow: 'hidden' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: c.txt3, padding: '13px 16px 9px' }}>{t('Quick Links')}</p>
        {DESKTOP_NAV.slice(1).map((n, i, arr) => (
          <button key={n.key} onClick={() => onNav(n.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', background: 'none', border: 'none', borderTop: `1px solid ${i === 0 ? c.bdr : 'transparent'}`, borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none', cursor: 'pointer', fontSize: 13, color: c.txt, fontFamily: 'inherit', textAlign: 'left' }}>
            <n.icon size={16} color={c.pri} strokeWidth={1.8} />
            <span style={{ flex: 1 }}>{t(n.label)}</span>
            <ChevronRight size={14} color={c.txt3} />
          </button>
        ))}
      </div>

      {/* Emergency */}
      <div style={{ background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: c.txt3, marginBottom: 11 }}>Emergency</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ icon: Phone, l: 'Police', n: '100', cl: '#DC2626' }, { icon: HeartPulse, l: 'Ambulance', n: '108', cl: '#059669' }, { icon: Flame, l: 'Fire', n: '101', cl: '#EA580C' }, { icon: Siren, l: 'Emergency', n: '112', cl: '#2563EB' }].map((e) => (
            <button key={e.l} onClick={() => onNav('emergency')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '11px 4px', background: `${e.cl}0F`, border: `1px solid ${e.cl}26`, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              <e.icon size={17} color={e.cl} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: c.txt }}>{e.l}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: e.cl }}>{e.n}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

const pill: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 9, background: 'rgba(255,255,255,0.16)', border: 'none', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

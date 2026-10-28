import { useLocation } from 'react-router-dom'
import { useC, useT } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { keyToPath } from '@/app/router/paths'
import { DESKTOP_NAV } from './navItems'

/**
 * Primary desktop navigation. Drives the SAME routes as the mobile bottom nav —
 * only the presentation differs (horizontal government-portal menu bar).
 */
export function DesktopNavigation() {
  const c = useC()
  const t = useT()
  const { onNav } = useAppNavigation()
  const { pathname } = useLocation()

  return (
    <nav aria-label="Primary" style={{ background: c.card, borderBottom: `1px solid ${c.bdr}`, position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="vtn-container" style={{ padding: '0 clamp(16px, 3vw, 56px)', display: 'flex', alignItems: 'stretch', gap: 4, overflowX: 'auto' }}>
        {DESKTOP_NAV.map((n) => {
          const active = pathname === (keyToPath[n.key] ?? `/${n.key}`)
          return (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              aria-current={active ? 'page' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'none', border: 'none', borderBottom: `3px solid ${active ? c.pri : 'transparent'}`, color: active ? c.pri : c.txt2, fontSize: 13.5, fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              <n.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {t(n.label)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

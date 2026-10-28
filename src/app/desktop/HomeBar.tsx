import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, User, Moon, Sun, Smartphone, LogOut, Sparkles } from 'lucide-react'
import { Seal } from '@/components/ui'
import { useApp, useT } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { keyToPath } from '@/app/router/paths'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNotificationsQuery } from '@/features/notifications/hooks/useNotifications'
import { usePlatformStore } from '@/store/platformStore'
import { DESKTOP_NAV } from './navItems'

/**
 * Floating menu bar: one translucent capsule above the page that holds the
 * brand, the single primary navigation, search, language, notifications and
 * the account. Theme and "Switch Experience" live in the account menu, so the
 * bar only shows controls a citizen uses every visit. The citizen's name
 * appears here and nowhere else in the chrome.
 */
export function HomeBar() {
  const t = useT()
  const { dark, setDark, lang, setLang } = useApp()
  const { onNav } = useAppNavigation()
  const { pathname } = useLocation()
  const { citizen, logout } = useAuth()
  const { data: notifications } = useNotificationsQuery()
  const resetPlatform = usePlatformStore((s) => s.resetPlatform)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')

  const unread = (notifications ?? []).filter((n) => !n.read).length
  const name = citizen?.fullName ?? 'Citizen'
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const pick = (fn: () => void) => () => { setMenu(false); fn() }
  const accountRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)

  // Close the account menu on a click anywhere outside it, and on Escape (focus
  // returns to the avatar). A full-screen catch layer cannot do this here: the
  // bar's frosted backdrop-filter confines fixed-position children to the bar.
  useEffect(() => {
    if (!menu) return
    const onDown = (e: PointerEvent) => { if (!accountRef.current?.contains(e.target as Node)) setMenu(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); avatarRef.current?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  return (
    <header className="vh-bar">
      <button className="vh-brand" onClick={() => onNav('home')} aria-label="Vetri Tamil Nadu — dashboard"><Seal size={40} /><span>Vetri Tamil Nadu</span></button>

      <nav className="vh-tabs" aria-label="Primary">
        {DESKTOP_NAV.map((n) => (
          <button key={n.key} onClick={() => onNav(n.key)} aria-current={pathname === (keyToPath[n.key] ?? `/${n.key}`) ? 'page' : undefined}>{t(n.label)}</button>
        ))}
      </nav>

      <form className="vh-find" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) onNav('services') }}>
        <Search size={17} aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search services, certificates and schemes" />
      </form>
      <button className="vh-ctl" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')} aria-label={lang === 'en' ? 'தமிழுக்கு மாற்று' : 'Switch to English'} style={{ fontFamily: "'Noto Sans Tamil', Inter, sans-serif" }}>{lang === 'en' ? 'தமிழ்' : 'English'}</button>
      <button className="vh-ctl" style={{ padding: 0 }} onClick={() => onNav('notifications')} aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}>
        <Bell size={19} aria-hidden="true" />{unread > 0 && <em aria-hidden="true">{unread}</em>}
      </button>

      <div ref={accountRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button ref={avatarRef} className="vh-ava" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} aria-label={`Account menu for ${name}`}>{initials}</button>
        {menu && (
          <>
            <div className="vh-menu" role="menu">
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, overflowWrap: 'anywhere' }}>{name}</p>
                <p className="vh-mono" style={{ color: 'var(--ink2)', marginTop: 3 }}>{citizen?.citizenId ?? '—'}</p>
              </div>
              <button role="menuitem" onClick={pick(() => onNav('profile'))}><User size={17} aria-hidden="true" />My profile</button>
              <button role="menuitem" onClick={pick(() => onNav('ai'))}><Sparkles size={17} aria-hidden="true" />Ask Vetri</button>
              <button role="menuitem" onClick={pick(() => setDark(!dark))}>{dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}{dark ? 'Use light appearance' : 'Use dark appearance'}</button>
              <button role="menuitem" onClick={pick(resetPlatform)}><Smartphone size={17} aria-hidden="true" />Switch experience</button>
              <button role="menuitem" onClick={pick(async () => { await logout(); onNav('login') })}><LogOut size={17} aria-hidden="true" />Log out</button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

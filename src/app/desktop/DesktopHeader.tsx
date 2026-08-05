import { useState } from 'react'
import { Search, Bell, Sparkles, ChevronDown, Sun, Moon, Languages, Smartphone, LogOut, User, ShieldCheck } from 'lucide-react'
import { Seal } from '@/components/ui'
import { useC, useApp } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNotificationsQuery } from '@/features/notifications/hooks/useNotifications'
import { usePlatformStore } from '@/store/platformStore'

/**
 * Government portal masthead: a thin official strip above a tall brand bar with
 * global search, notifications and the citizen menu. Reuses the same auth and
 * notification hooks as the mobile app — no duplicated data access.
 */
export function DesktopHeader() {
  const c = useC()
  const { dark, setDark, lang, setLang } = useApp()
  const { onNav } = useAppNavigation()
  const { citizen, logout } = useAuth()
  const { data: notifications } = useNotificationsQuery()
  const resetPlatform = usePlatformStore((s) => s.resetPlatform)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')

  const unread = (notifications ?? []).filter((n) => !n.read).length
  const initials = (citizen?.fullName ?? 'Citizen').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Official strip */}
      <div style={{ background: c.acc, color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
        <div className="vtn-container" style={{ padding: '7px clamp(16px, 3vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={13} color={c.sec} />
            Government of Tamil Nadu · Official Citizen Services Portal
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button onClick={() => setLang(lang === 'en' ? 'ta' : 'en')} style={stripBtn}><Languages size={13} />{lang === 'en' ? 'தமிழ்' : 'English'}</button>
            <button onClick={() => setDark(!dark)} style={stripBtn}>{dark ? <Sun size={13} /> : <Moon size={13} />}{dark ? 'Light' : 'Dark'}</button>
            <button onClick={resetPlatform} style={stripBtn}><Smartphone size={13} />Switch Experience</button>
          </div>
        </div>
      </div>

      {/* Brand bar */}
      <div style={{ background: c.pri, borderBottom: `3px solid ${c.sec}` }}>
        <div className="vtn-container" style={{ padding: '14px clamp(16px, 3vw, 56px)', display: 'flex', alignItems: 'center', gap: 'clamp(12px, 1.6vw, 26px)' }}>
          <button onClick={() => onNav('home')} style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Seal size={46} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Vetri Tamil Nadu</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.66)', marginTop: 1, letterSpacing: 0.3 }}>வெற்றி தமிழ்நாடு · e-Sevai Digital Services</p>
            </div>
          </button>

          <form
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) onNav('services') }}
            style={{ flex: 1, maxWidth: 460, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '9px 14px' }}
          >
            <Search size={17} color="rgba(255,255,255,0.75)" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services, certificates, schemes…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13.5, fontFamily: 'inherit' }}
            />
          </form>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => onNav('ai')} title="Ask Vetri" style={iconBtn(c.sec, true)}><Sparkles size={17} color="#fff" /></button>
            <button onClick={() => onNav('notifications')} title="Notifications" style={iconBtn('rgba(255,255,255,0.14)')}>
              <Bell size={17} color="#fff" />
              {unread > 0 && <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: c.sec, color: '#3A2A05', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
            </button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenu((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '6px 11px 6px 7px', cursor: 'pointer' }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: c.sec, color: '#3A2A05', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</span>
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{citizen?.fullName?.split(' ')[0] ?? 'Citizen'}</span>
                  <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{citizen?.citizenId ?? '—'}</span>
                </span>
                <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
              </button>

              {menu && (
                <>
                  <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 9px)', width: 232, background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 14, boxShadow: '0 18px 40px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 61 }}>
                    {[
                      { icon: User, l: 'My Profile', fn: () => onNav('profile') },
                      { icon: Smartphone, l: 'Switch Experience', fn: resetPlatform },
                    ].map((m) => (
                      <button key={m.l} onClick={() => { setMenu(false); m.fn() }} style={menuRow(c.txt, c.bdr)}>
                        <m.icon size={16} color={c.pri} />{m.l}
                      </button>
                    ))}
                    <button onClick={async () => { setMenu(false); await logout(); onNav('login') }} style={{ ...menuRow(c.err, 'transparent'), borderBottom: 'none' }}>
                      <LogOut size={16} color={c.err} />Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

const stripBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'inherit', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }
const iconBtn = (bg: string, solid = false): React.CSSProperties => ({ position: 'relative', width: 40, height: 40, borderRadius: 12, background: bg, border: solid ? 'none' : '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' })
const menuRow = (color: string, bdr: string): React.CSSProperties => ({ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', background: 'none', border: 'none', borderBottom: `1px solid ${bdr}`, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color, fontFamily: 'inherit', textAlign: 'left' })

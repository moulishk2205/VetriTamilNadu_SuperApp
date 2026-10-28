import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useC } from '@/hooks/useUi'
import { DesktopHeader } from '@/app/desktop/DesktopHeader'
import { DesktopNavigation } from '@/app/desktop/DesktopNavigation'
import { DesktopSidebar } from '@/app/desktop/DesktopSidebar'
import { DesktopFooter } from '@/app/desktop/DesktopFooter'
import { desktopCss } from '@/app/desktop/desktopCss'

/** Pre-login routes render without portal chrome — they own the full viewport. */
const AUTH_PATHS = new Set(['/', '/onboarding', '/login', '/demo'])
/** Routes that get the dashboard layout (left rail + content). */
const RAIL_PATHS = new Set(['/home'])
/**
 * Routes with a purpose-built desktop page — they lay themselves out inside the
 * fluid container. Anything not listed is a mobile-authored screen and is shown
 * in a centred app-view column rather than being stretched.
 */
const DESKTOP_NATIVE = new Set(['/home', '/services', '/tracker', '/wallet', '/complaint', '/schemes', '/profile'])
/** Prefixes that are desktop-native (dynamic segments, e.g. /service/svc_dl). */
const DESKTOP_NATIVE_PREFIXES = ['/service/']

/**
 * Government Web Portal shell — chrome only.
 *
 * It renders the SAME `AppRouter` inside a fluid desktop layout: official
 * masthead, primary navigation, sticky rail and portal footer. All widths are
 * fluid (`clamp()` / `minmax()`), so the portal fills 13" laptops through 4K
 * displays without dead margins.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  const c = useC()
  const { pathname } = useLocation()

  const isAuth = AUTH_PATHS.has(pathname)
  const hasRail = RAIL_PATHS.has(pathname)
  const isNative = DESKTOP_NATIVE.has(pathname) || DESKTOP_NATIVE_PREFIXES.some((p) => pathname.startsWith(p))

  if (isAuth) {
    return (
      <div className="vtn-desktop" style={{ minHeight: '100vh', background: c.bg }}>
        <style>{desktopCss(c)}</style>
        {children}
      </div>
    )
  }

  return (
    <div className="vtn-desktop" style={{ minHeight: '100vh', background: c.bgAlt, display: 'flex', flexDirection: 'column' }}>
      <style>{desktopCss(c)}</style>
      <DesktopHeader />
      <DesktopNavigation />

      <main className="vtn-container" style={{ flex: 1, paddingTop: 28, paddingBottom: 40 }}>
        {hasRail ? (
          <div className="vtn-dash">
            <DesktopSidebar />
            <div style={{ minWidth: 0 }}>{children}</div>
          </div>
        ) : isNative ? (
          <div style={{ minWidth: 0 }}>{children}</div>
        ) : (
          // Mobile-authored screen: present it as a framed citizen app view
          // rather than stretching a 430px layout across a 4K display.
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 430, maxWidth: '100%', background: c.bg, border: `1px solid ${c.bdr}`, borderRadius: 20, overflow: 'hidden', minHeight: '60vh', boxShadow: `0 10px 34px ${c.pri}0F` }}>
              {children}
            </div>
          </div>
        )}
      </main>

      <DesktopFooter />
    </div>
  )
}

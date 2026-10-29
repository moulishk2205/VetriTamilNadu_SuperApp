import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useC, useApp, BannerPaletteContext } from '@/hooks/useUi'
import { HomeBar } from '@/app/desktop/HomeBar'
import { HOME_CSS } from '@/features/home/homeCss'
import { DesktopFooter } from '@/app/desktop/DesktopFooter'
import { desktopCss } from '@/app/desktop/desktopCss'
import { LiveAlerts } from '@/app/desktop/LiveAlerts'

/** Pre-login routes render without portal chrome — they own the full viewport. */
const AUTH_PATHS = new Set(['/', '/onboarding', '/login', '/demo'])

/**
 * Government Web Portal shell — chrome only.
 *
 * It renders the SAME `AppRouter` inside a fluid desktop layout. Every
 * signed-in page shares one look: the floating menu bar over a yellow sky that
 * fades into parchment, the banner palette, and the portal footer. All widths
 * are fluid (`clamp()` / `minmax()`), so the portal fills 13" laptops through
 * 4K displays without dead margins.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  return (
    <BannerPaletteContext value={true}>
      <PortalChrome>{children}</PortalChrome>
    </BannerPaletteContext>
  )
}

/** Inside the palette boundary, so `useC()` here is the banner palette. */
function PortalChrome({ children }: { children: ReactNode }) {
  const c = useC()
  const { dark } = useApp()
  const { pathname } = useLocation()

  // Sign-in lays out its own full-bleed page. Onboarding and the demo persona
  // picker are phone-sized screens: on the portal they sit in a centred column
  // on the same yellow sky and parchment, rather than stretching edge to edge.
  if (pathname === '/login') {
    return (
      <div className="vtn-desktop" style={{ minHeight: '100vh', background: c.bg }}>
        <style>{desktopCss(c)}</style>
        {children}
      </div>
    )
  }
  if (AUTH_PATHS.has(pathname)) {
    return (
      <div className="vtn-desktop vh" data-theme={dark ? 'dark' : 'light'} style={{ minHeight: '100vh' }}>
        <style>{desktopCss(c)}{HOME_CSS}</style>
        <div className="vh-sky" aria-hidden="true" />
        <div className="vh-auth">{children}</div>
      </div>
    )
  }

  const home = pathname === '/home'
  return (
    <div className="vtn-desktop vh" data-theme={dark ? 'dark' : 'light'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{desktopCss(c)}{HOME_CSS}</style>
      <div className={home ? 'vh-sky' : 'vh-sky vh-sky--page'} aria-hidden="true" />
      <HomeBar />
      <main className={home ? 'vh-main' : 'vh-main vh-page'}>{children}</main>
      <DesktopFooter />
      <LiveAlerts />
    </div>
  )
}

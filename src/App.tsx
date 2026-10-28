import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, useLocation, useNavigationType } from 'react-router-dom'
import { CSS } from '@/styles/theme'
import { useApp } from '@/hooks/useUi'
import { AppRouter } from '@/app/router/AppRouter'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'
import { ExperienceSelector } from '@/app/shells/ExperienceSelector'
import { MobileShell } from '@/app/shells/MobileShell'
import { DesktopShell } from '@/app/shells/DesktopShell'
import { usePlatformStore, type Platform } from '@/store/platformStore'

// The original startup animation — part of the product identity. It plays
// full-screen before BOTH experiences, with its original timing and sequence.
const SplashScreen = lazy(() => import('@/features/auth/pages/SplashScreen'))

/**
 * Every new screen opens at the top. Without this the window keeps the scroll
 * offset of the page the citizen just left (a service opened from far down the
 * catalogue would start mid-page). Back/forward keep the browser's own
 * restored position.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navType])
  return null
}

/**
 * App shell selector.
 *
 * One codebase, one backend, one router — two presentations:
 *   • no platform chosen → Experience Selector
 *   • platform chosen    → intro animation, then the matching shell
 *   • 'mobile'  → MobileShell  (citizen super app, unchanged)
 *   • 'website' → DesktopShell (government web portal)
 */
/**
 * The browser's status-bar tint follows the app's own Dark mode switch (not only
 * the OS setting): yellow sky by day, the dark sky's amber at night.
 */
function useThemeColour(dark: boolean) {
  useEffect(() => {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#4A3200' : '#FFC401'))
  }, [dark])
}

export default function App() {
  const { textSize, dark } = useApp()
  useThemeColour(dark)
  const platform = usePlatformStore((s) => s.platform)
  const fs = textSize === 'sm' ? 14 : textSize === 'md' ? 16 : textSize === 'lg' ? 18 : 20

  // Tracks which experience the intro has already played for, so it replays
  // whenever the presenter switches experience.
  const [introShownFor, setIntroShownFor] = useState<Platform | null>(null)

  if (!platform) {
    return (
      <>
        <style>{CSS}</style>
        <ExperienceSelector />
      </>
    )
  }

  if (introShownFor !== platform) {
    return (
      <>
        <style>{CSS}</style>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFC401' }} />}>
          <SplashScreen onDone={() => setIntroShownFor(platform)} />
        </Suspense>
      </>
    )
  }

  const Shell = platform === 'website' ? DesktopShell : MobileShell

  return (
    <>
      <style>{CSS}</style>
      <OfflineBanner />
      <BrowserRouter>
        <ScrollToTop />
        <Shell>
          <div style={{ fontSize: fs }}>
            <AppRouter variant={platform === 'website' ? 'desktop' : 'mobile'} />
          </div>
        </Shell>
      </BrowserRouter>
    </>
  )
}

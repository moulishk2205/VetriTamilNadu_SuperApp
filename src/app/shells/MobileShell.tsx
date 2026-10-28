import type { ReactNode } from 'react'
import { useApp, BannerPaletteContext } from '@/hooks/useUi'

/**
 * Mobile shell — the phone-frame wrapper. It owns the page itself: parchment,
 * with a yellow sky at the top that fades out behind whatever screen is showing,
 * the same way the web portal's does. Screens paint no page background of their
 * own, so the sky reads through every one of them.
 */
const MOBILE_CSS = `
.vm{--vm-page:#F4EAC4;--vm-sky:radial-gradient(120% 110% at 50% -12%,#FFE200 0%,#FFCE12 38%,#FFC401 62%,#FFB101 100%);background:var(--vm-page)}
.vm[data-theme="dark"]{--vm-page:#15110A;--vm-sky:radial-gradient(120% 110% at 50% -12%,#A06A00 0%,#5C3D00 46%,#2A1C00 100%)}
.vm::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:0;height:300px;background:var(--vm-sky);pointer-events:none;
  -webkit-mask-image:linear-gradient(180deg,#000 42%,transparent 100%);mask-image:linear-gradient(180deg,#000 42%,transparent 100%)}
`

export function MobileShell({ children }: { children: ReactNode }) {
  const { dark, textSize } = useApp()
  const fs = textSize === 'sm' ? 14 : textSize === 'md' ? 16 : textSize === 'lg' ? 18 : 20

  return (
    // Outer column reproduces the original `#root` framing (1126px, centred,
    // hairline side borders) now that the root itself is fluid for the portal.
    <div style={{ width: 1126, maxWidth: '100%', margin: '0 auto', borderInline: '1px solid var(--border)', minHeight: '100svh', textAlign: 'center', boxSizing: 'border-box' }}>
      <style>{MOBILE_CSS}</style>
      <div className="vm" data-theme={dark ? 'dark' : 'light'} style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', position: 'relative', isolation: 'isolate', overflow: 'hidden', boxShadow: '0 0 60px rgba(90,60,0,0.14)', fontSize: fs, textAlign: 'left' }}>
        <BannerPaletteContext value={true}>{children}</BannerPaletteContext>
      </div>
    </div>
  )
}

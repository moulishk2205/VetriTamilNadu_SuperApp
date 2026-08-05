import type { ReactNode } from 'react'
import { darkColors } from '@/styles/theme'
import { useApp } from '@/hooks/useUi'

/**
 * Mobile shell — the original phone-frame wrapper, moved out of `App.tsx`
 * verbatim. The mobile experience is intentionally unchanged: same width, same
 * background, same shadow, same text-size scaling.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  const { dark, textSize } = useApp()
  const fs = textSize === 'sm' ? 14 : textSize === 'md' ? 16 : textSize === 'lg' ? 18 : 20

  return (
    // Outer column reproduces the original `#root` framing (1126px, centred,
    // hairline side borders) now that the root itself is fluid for the portal.
    <div style={{ width: 1126, maxWidth: '100%', margin: '0 auto', borderInline: '1px solid var(--border)', minHeight: '100svh', textAlign: 'center', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: dark ? darkColors.bg : '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.1)', fontSize: fs, textAlign: 'left' }}>
        {children}
      </div>
    </div>
  )
}

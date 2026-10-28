import { Info } from 'lucide-react'
import { useDemoOtp } from '@/features/auth/api/authApi'
import { useT } from '@/hooks/useUi'

/**
 * Shown on the code step only when the server says it is running demo sign-in.
 * No SMS is sent in that mode, so the screen gives the fixed code instead of
 * leaving the presenter waiting for a text that never comes.
 */
export function DemoOtpHint() {
  const code = useDemoOtp((s) => s.code)
  const t = useT()
  if (!code) return null
  return (
    <p role="note" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '12px 0 4px', padding: '10px 12px', borderRadius: 10, background: 'rgba(224,160,0,0.14)', border: '1px solid rgba(224,160,0,0.45)', fontSize: 13, lineHeight: 1.45 }}>
      <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
      <span>{t('Demo server: no SMS is sent. Enter')} <b style={{ letterSpacing: 1 }}>{code}</b> {t('to sign in.')}</span>
    </p>
  )
}

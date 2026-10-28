import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useC } from '@/hooks/useUi'

/**
 * Global offline indicator. Renders nothing when online (no visual change), and
 * a slim banner when the device drops offline. Additive — never alters a screen.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()
  const c = useC()
  if (online) return null
  return (
    <div
      role="status"
      style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 300, maxWidth: 'calc(100% - 24px)', background: c.txt, color: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 16px', borderRadius: 999, boxShadow: '0 14px 30px -12px rgba(60,35,0,0.55)', fontSize: 13, fontWeight: 600 }}
    >
      <WifiOff size={15} color={c.sec} aria-hidden="true" /> You are offline. Changes will sync when you reconnect.
    </div>
  )
}

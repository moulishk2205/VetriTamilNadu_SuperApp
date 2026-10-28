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
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, background: c.warn, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
    >
      <WifiOff size={14} /> You are offline — changes will sync when you reconnect
    </div>
  )
}

import { LayoutGrid, FileText, Timer, Wallet, AlertTriangle, Sparkles, BarChart3, LifeBuoy } from 'lucide-react'

/**
 * Desktop primary navigation model. Keys are the same screen keys the mobile
 * bottom nav uses, so both experiences drive one routing table.
 */
export const DESKTOP_NAV = [
  { key: 'home', label: 'Dashboard', icon: LayoutGrid },
  { key: 'services', label: 'Services', icon: FileText },
  { key: 'tracker', label: 'Applications', icon: Timer },
  { key: 'wallet', label: 'Digital Locker', icon: Wallet },
  { key: 'complaint', label: 'Grievances', icon: AlertTriangle },
  { key: 'schemes', label: 'Schemes', icon: Sparkles },
  { key: 'district', label: 'Transparency', icon: BarChart3 },
  { key: 'help', label: 'Help', icon: LifeBuoy },
]

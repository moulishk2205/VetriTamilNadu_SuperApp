import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Permission } from '@/lib/rbac/roles'

/**
 * Permission-aware route guard for future portals (Officer / Department / MLA /
 * Admin). Requires auth AND that the session holds every listed permission.
 * Usage (Phase 2): `<Route element={<RoleRoute require={['application:process']} />}>`.
 */
export function RoleRoute({ require: required }: { require: Permission[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const permissions = useAuthStore((s) => s.permissions)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  const allowed = required.every((p) => permissions.includes(p))
  return allowed ? <Outlet /> : <Navigate to="/home" replace />
}

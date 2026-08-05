import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/**
 * Gate for citizen-only routes. Unauthenticated visitors are redirected to
 * login. CP4 extends this with token validity + RBAC permission checks for the
 * future officer/admin areas; the guard's placement in the route tree stays.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

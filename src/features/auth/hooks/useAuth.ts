import { useAuthStore } from '@/store/authStore'
import { authApi } from '../api/authApi'

/**
 * Typed auth surface for screens. Components call these instead of touching the
 * auth store or API directly.
 */
export function useAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const citizen = useAuthStore((s) => s.citizen)
  const permissions = useAuthStore((s) => s.permissions)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return {
    isAuthenticated,
    citizen,
    permissions,
    login,
    logout,
    hasPermission,
    /** Fire an OTP request (SMS / Aadhaar-linked mobile). */
    requestOtp: authApi.requestOtp,
  }
}

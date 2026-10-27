import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Citizen } from '@/types/models/citizen'
import { authApi, type Credentials, type DemoPersona, type VerifyResult } from '@/features/auth/api/authApi'
import { tokenStore } from '@/lib/api/tokenStore'
import { queryClient } from '@/config/queryClient'
import { createLogger } from '@/lib/logger/logger'

const log = createLogger('auth')

/**
 * Session/auth state — real OTP-verified session, access/refresh tokens, the
 * signed-in citizen, and an RBAC-ready permission list (for future
 * officer/admin areas). The access token lives in-memory (`tokenStore`); only
 * the refresh token + non-sensitive session facts are persisted.
 */
export interface AuthState {
  isAuthenticated: boolean
  citizen: Citizen | null
  role: 'citizen' | 'officer' | 'department' | 'mla' | 'admin'
  permissions: string[]
  refreshToken: string | null
  login: (cred: Credentials) => Promise<void>
  /** Demo Mode only: sign in as a seeded persona (backend AUTH_MOCK must be on). */
  loginAsPersona: (persona: DemoPersona) => Promise<void>
  logout: () => Promise<void>
  /** Re-arm the refresh handler after a reload (persisted session). */
  bootstrap: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Uses the latest refresh token from state (supports rotation).
      const refreshHandler = async (): Promise<string | null> => {
        const rt = get().refreshToken
        if (!rt) return null
        try {
          const tokens = await authApi.refresh(rt)
          set({ refreshToken: tokens.refreshToken })
          return tokens.accessToken
        } catch {
          await get().logout()
          return null
        }
      }

      const startSession = (res: VerifyResult) => {
        tokenStore.setAccessToken(res.tokens.accessToken)
        tokenStore.setRefreshHandler(refreshHandler)
        set({
          isAuthenticated: true,
          citizen: res.citizen,
          role: res.role,
          permissions: res.permissions,
          refreshToken: res.tokens.refreshToken,
        })
      }

      return {
        isAuthenticated: false,
        citizen: null,
        role: 'citizen' as const,
        permissions: [],
        refreshToken: null,

        login: async (cred) => {
          startSession(await authApi.verify(cred))
          log.info('login ok', { method: cred.method, role: get().role })
        },

        loginAsPersona: async (persona) => {
          startSession(await authApi.demo(persona))
          log.info('demo login ok', { role: get().role })
        },

        logout: async () => {
          // Stop refreshing first. With an expired session the logout call is
          // itself refused; left armed, that refusal triggered another refresh,
          // which failed and logged out again — a loop that ran until the
          // server's rate limit blocked sign-in altogether.
          tokenStore.setRefreshHandler(null)
          await authApi.logout()
          tokenStore.clear()
          set({ isAuthenticated: false, citizen: null, role: 'citizen', permissions: [], refreshToken: null })
          queryClient.clear()
          log.info('logout')
        },

        bootstrap: () => {
          if (!get().refreshToken) return
          tokenStore.setRefreshHandler(refreshHandler)
          // Renew the access token now, while the intro plays, so the first
          // screen's requests are authorised instead of each failing once.
          void tokenStore.refresh()
        },

        hasPermission: (permission) => get().permissions.includes(permission),
      }
    },
    {
      name: 'vetri.auth',
      version: 2,
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        citizen: s.citizen,
        role: s.role,
        permissions: s.permissions,
        refreshToken: s.refreshToken,
      }),
    },
  ),
)

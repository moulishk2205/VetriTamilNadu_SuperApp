import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Citizen } from '@/types/models/citizen'
import { authApi, type Credentials, type DemoPersona, type VerifyResult } from '@/features/auth/api/authApi'
import { tokenStore } from '@/lib/api/tokenStore'
import { ApiError } from '@/lib/api/errors'
import { citizenSessionStorage, purgeLegacyCitizenData } from '@/lib/storage/citizenData'
import { useAiStore } from '@/store/aiStore'
import { useDraftStore } from '@/store/draftStore'
import { useOfflineQueue } from '@/store/offlineQueueStore'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'
import { useCitizenMemory } from '@/features/ai/memory/citizenMemory'
import { queryClient } from '@/config/queryClient'
import { createLogger } from '@/lib/logger/logger'

const log = createLogger('auth')

/**
 * Session/auth state — real OTP-verified session, access/refresh tokens, the
 * signed-in citizen, and an RBAC-ready permission list (for future
 * officer/admin areas). The access token lives in-memory (`tokenStore`). Only
 * the refresh token + role/permissions are persisted, in sessionStorage; the
 * citizen's profile is never stored in the browser and is re-read from
 * `/auth/me` after a reload.
 */

/** Wipe everything a previous citizen left in this browser (shared kiosks). */
function clearCitizenData(): void {
  useAiStore.getState().clear()
  useDraftStore.setState({ drafts: {} })
  useCitizenMemory.setState({ frequentServices: {}, lastIntents: [] })
  useOfflineQueue.setState({ queue: [] })
  useSearchHistoryStore.getState().clear()
}
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
  /** After a reload: purge legacy PII, re-arm token refresh, re-read the profile. */
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
        } catch (e) {
          // Only a rejected token ends the session. A network blip, timeout or
          // 5xx keeps it (and the citizen's drafts); the next request retries.
          const dead = e instanceof ApiError && (e.kind === 'unauthorized' || e.kind === 'validation')
          if (dead) await get().logout()
          return null
        }
      }

      const startSession = (res: VerifyResult) => {
        // A new sign-in never inherits the previous person's data or cache.
        clearCitizenData()
        queryClient.clear()
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
          clearCitizenData()
          queryClient.clear()
          log.info('logout')
        },

        bootstrap: () => {
          purgeLegacyCitizenData()
          if (!get().refreshToken) return
          tokenStore.setRefreshHandler(refreshHandler)
          // Renew the access token now (single-flight) and restore the profile,
          // which is never kept in the browser. A dead session logs out via
          // refreshHandler.
          authApi
            .me()
            .then((p) => {
              if (get().isAuthenticated) set({ citizen: p.citizen, role: p.role, permissions: p.permissions })
            })
            .catch((e) => log.warn('profile restore failed', { error: String(e) }))
        },

        hasPermission: (permission) => get().permissions.includes(permission),
      }
    },
    {
      name: 'vetri.auth',
      version: 3,
      storage: citizenSessionStorage,
      // No citizen profile: it is PII and the next citizen at a kiosk could read it.
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        role: s.role,
        permissions: s.permissions,
        refreshToken: s.refreshToken,
      }),
    },
  ),
)

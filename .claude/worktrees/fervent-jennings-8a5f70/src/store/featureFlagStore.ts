import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Feature flags — platform kill-switches managed from the Admin Portal.
 * Persisted locally in Phase 3; a real backend serves these from config so
 * flags flip without a deploy (the store shape is already remote-ready).
 */
export interface FeatureFlagState {
  flags: Record<string, boolean>
  setFlag: (key: string, value: boolean) => void
}

export const DEFAULT_FLAGS: Record<string, boolean> = {
  aiAssistant: true,
  voiceInput: true,
  proactiveSuggestions: true,
  walletSharing: true,
  emergencySos: true,
  schemeDiscovery: true,
}

export const useFeatureFlags = create<FeatureFlagState>()(
  persist(
    (set) => ({
      flags: DEFAULT_FLAGS,
      setFlag: (key, value) => set((s) => ({ flags: { ...s.flags, [key]: value } })),
    }),
    { name: 'vetri.flags', version: 1 },
  ),
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/lib/i18n/translations'

export type TextSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * UI / preferences state — theme, language, and accessibility.
 *
 * In the prototype these lived in `useState` at the App root and reset on every
 * refresh. They now live here, persisted to storage, so a citizen's chosen
 * theme / language / text size survives reloads and sessions.
 */
export interface UiState {
  dark: boolean
  lang: Lang
  textSize: TextSize
  highContrast: boolean
  anim: boolean
  setDark: (v: boolean) => void
  setLang: (v: Lang) => void
  setTextSize: (v: TextSize) => void
  setHighContrast: (v: boolean) => void
  setAnim: (v: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      // Defaults match the prototype's initial App state exactly.
      dark: false,
      lang: 'en',
      textSize: 'md',
      highContrast: false,
      anim: true,
      setDark: (v) => set({ dark: v }),
      setLang: (v) => set({ lang: v }),
      setTextSize: (v) => set({ textSize: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setAnim: (v) => set({ anim: v }),
    }),
    { name: 'vetri.ui', version: 1 },
  ),
)

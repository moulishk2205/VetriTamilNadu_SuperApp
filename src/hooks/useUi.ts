import { useUiStore } from '@/store/uiStore'
import { translations } from '@/lib/i18n/translations'
import { lightColors, darkColors, type Colors } from '@/styles/theme'

/**
 * UI-context hooks — same names, same return shapes as the prototype's
 * Context-based hooks, but now backed by the persisted Zustand store. Screens
 * and primitives keep calling `useApp()` / `useT()` / `useC()` unchanged.
 */

/** Full preferences slice + setters. Mirrors the old AppContext value object. */
export const useApp = () => useUiStore()

/** Translator: Tamil lookup when lang === 'ta', otherwise the key itself. */
export const useT = () => {
  const lang = useUiStore((s) => s.lang)
  return (key: string): string => (lang === 'ta' && translations[key] ? translations[key] : key)
}

/** Active color palette, with the high-contrast overrides applied. */
export const useC = (): Colors => {
  const dark = useUiStore((s) => s.dark)
  const highContrast = useUiStore((s) => s.highContrast)
  const c = dark ? darkColors : lightColors
  return highContrast
    ? {
        ...c,
        txt: dark ? '#FFFFFF' : '#000000',
        txt2: dark ? '#E2E8F0' : '#374151',
        bdr: dark ? '#475569' : '#9CA3AF',
      }
    : c
}

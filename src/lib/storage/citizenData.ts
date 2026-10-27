import { createJSONStorage } from 'zustand/middleware'

/**
 * Where per-citizen browser state lives. e-Sevai kiosks share one browser
 * between citizens, so anything tied to a citizen (session, AI transcript, form
 * drafts, search history, queued submissions) goes to sessionStorage: it
 * survives a reload but not closing the browser, and logout wipes it. The
 * citizen's profile is never stored at all; it is re-read from the backend.
 * Device preferences (language, theme, layout) stay in localStorage.
 */
export const citizenSessionStorage = createJSONStorage(() => sessionStorage)

/** Keys earlier builds wrote to localStorage, some holding citizen PII. */
const LEGACY_LOCAL_KEYS = ['vetri.auth', 'vetri.ai', 'vetri.ai.memory', 'vetri.drafts', 'vetri.search', 'vetri.offline-queue']

export function purgeLegacyCitizenData(): void {
  for (const key of LEGACY_LOCAL_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage unavailable: nothing to purge */
    }
  }
}

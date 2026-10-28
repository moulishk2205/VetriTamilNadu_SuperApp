import { create } from 'zustand'

/**
 * Presentation platform — which *shell* renders the app.
 *
 * This is the ONLY thing that differs between the two experiences: routes,
 * APIs, auth, stores and business logic are shared.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DEMO BUILD BEHAVIOUR (MLA presentation)
 *
 * `PERSIST_SELECTION = false` means the choice is held in memory only:
 * every app start and every page refresh (F5 / Cmd-R) returns to the
 * Experience Selector, so the presenter always controls which experience is
 * shown — without clearing browser storage or opening dev tools.
 *
 * To restore the long-term production behaviour (remember the citizen's
 * choice across reloads), flip this single flag back to `true`. The
 * localStorage read/write helpers below are kept intact for exactly that.
 * ─────────────────────────────────────────────────────────────────────────
 */
const PERSIST_SELECTION = false

export type Platform = 'mobile' | 'website'

const KEY = 'platform'

/** Production persistence helpers — retained, inactive while the flag is off. */
function read(): Platform | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(KEY)
    return v === 'mobile' || v === 'website' ? v : null
  } catch {
    return null
  }
}

function write(v: Platform | null): void {
  try {
    if (v) window.localStorage.setItem(KEY, v)
    else window.localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable (private mode) — selection stays in memory */
  }
}

// Demo build: drop any value persisted by an earlier run so nothing lingers.
if (!PERSIST_SELECTION) write(null)

interface PlatformState {
  /** null = not chosen yet → the Experience Selector is shown. */
  platform: Platform | null
  setPlatform: (p: Platform) => void
  /** Clears the choice so the selector is shown again ("Switch Experience"). */
  resetPlatform: () => void
}

export const usePlatformStore = create<PlatformState>((set) => ({
  // Always starts unselected in the demo build; reads storage in production.
  platform: PERSIST_SELECTION ? read() : null,
  setPlatform: (p) => {
    if (PERSIST_SELECTION) write(p)
    set({ platform: p })
  },
  resetPlatform: () => {
    if (PERSIST_SELECTION) write(null)
    set({ platform: null })
  },
}))

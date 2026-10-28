import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Recent-searches store (persisted), backing the Universal Search recents. */
export interface SearchHistoryState {
  recent: string[]
  record: (term: string) => void
  clear: () => void
}

const LIMIT = 8

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recent: [],
      record: (term) =>
        set((s) => {
          const t = term.trim()
          if (!t) return s
          return { recent: [t, ...s.recent.filter((x) => x !== t)].slice(0, LIMIT) }
        }),
      clear: () => set({ recent: [] }),
    }),
    { name: 'vetri.search', version: 1 },
  ),
)

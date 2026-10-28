import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { citizenSessionStorage } from '@/lib/storage/citizenData'
import type { MemorySnapshot } from '../engine/types'

/**
 * Citizen Memory — persistent personalisation for Ask Vetri. Tracks which
 * services this citizen actually uses and their recent intents; the intent
 * engine uses the snapshot to rank ambiguous matches. Survives reloads within
 * the browser session and is wiped on logout (transcript lives in `aiStore`).
 */
interface CitizenMemoryState {
  frequentServices: Record<string, number>
  lastIntents: string[]
  recordService: (serviceId: string) => void
  recordIntent: (intent: string) => void
  snapshot: () => MemorySnapshot
}

export const useCitizenMemory = create<CitizenMemoryState>()(
  persist(
    (set, get) => ({
      frequentServices: {},
      lastIntents: [],
      recordService: (serviceId) =>
        set((s) => ({ frequentServices: { ...s.frequentServices, [serviceId]: (s.frequentServices[serviceId] ?? 0) + 1 } })),
      recordIntent: (intent) =>
        set((s) => ({ lastIntents: [intent, ...s.lastIntents].slice(0, 10) })),
      snapshot: () => ({ frequentServices: get().frequentServices, lastIntents: get().lastIntents }),
    }),
    { name: 'vetri.ai.memory', version: 1, storage: citizenSessionStorage },
  ),
)

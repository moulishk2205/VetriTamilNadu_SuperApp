import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { citizenSessionStorage } from '@/lib/storage/citizenData'

/**
 * Offline mutation queue — actions captured while offline are persisted and
 * replayed when connectivity returns. Phase 3 ships the queue + replay seam;
 * hooks can enqueue `{path, body}` pairs and `flush()` posts them in order.
 */
export interface QueuedAction {
  id: string
  path: string
  body: unknown
  queuedAt: string
}

interface OfflineQueueState {
  queue: QueuedAction[]
  enqueue: (path: string, body: unknown) => void
  flush: (post: (path: string, body: unknown) => Promise<unknown>) => Promise<number>
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      enqueue: (path, body) =>
        set((s) => ({ queue: [...s.queue, { id: `q_${Date.now()}`, path, body, queuedAt: new Date().toISOString() }] })),
      flush: async (post) => {
        const pending = get().queue
        let done = 0
        for (const item of pending) {
          try {
            await post(item.path, item.body)
            done += 1
            set((s) => ({ queue: s.queue.filter((q) => q.id !== item.id) }))
          } catch {
            break // stop on first failure; retry on next flush
          }
        }
        return done
      },
    }),
    { name: 'vetri.offline-queue', version: 1, storage: citizenSessionStorage },
  ),
)

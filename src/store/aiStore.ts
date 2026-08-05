import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * AI conversation memory — persists across sessions and services, so the
 * assistant remembers the thread ("cross-service memory") after reloads.
 */
export interface AiMessage {
  role: 'user' | 'ai'
  text: string
  en?: string
  acts?: { l: string; s: string }[]
}

interface AiState {
  messages: AiMessage[]
  setMessages: (m: AiMessage[]) => void
  clear: () => void
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      messages: [],
      setMessages: (messages) => set({ messages }),
      clear: () => set({ messages: [] }),
    }),
    { name: 'vetri.ai', version: 1 },
  ),
)

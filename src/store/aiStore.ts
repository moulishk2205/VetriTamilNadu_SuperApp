import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { citizenSessionStorage } from '@/lib/storage/citizenData'

/**
 * AI conversation memory — kept across services and reloads for this browser
 * session only (sessionStorage), and wiped on logout.
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
    { name: 'vetri.ai', version: 1, storage: citizenSessionStorage },
  ),
)

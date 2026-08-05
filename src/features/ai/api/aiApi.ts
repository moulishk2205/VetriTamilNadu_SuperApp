import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import type { MemorySnapshot } from '../engine/types'

/**
 * Ask Vetri transport. Replies carry tool-call actions, the executed plan
 * trace, and the resolved intent — all computed by the AI Operating System
 * orchestrator from live platform state. The client sends its persistent
 * memory snapshot so ranking is personalised. An LLM later swaps in behind
 * this exact contract.
 */

const ActionSchema = z.object({
  label: z.string(),
  screen: z.string(),
  kind: z.enum(['apply', 'track', 'wallet', 'pay', 'view']).optional(),
})

const AiReplySchema = z.object({
  text: z.string(),
  en: z.string().optional(),
  actions: z.array(ActionSchema).optional(),
  plan: z.array(z.string()).optional(),
  intent: z.string().optional(),
})
export type AiReply = z.infer<typeof AiReplySchema>

const SuggestionsSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string(), prompt: z.string(), icon: z.string() })),
})
export type AiSuggestions = z.infer<typeof SuggestionsSchema>

export interface AiTurn {
  role: 'user' | 'ai'
  text: string
}

export const aiApi = {
  chat: (text: string, history: AiTurn[], memory?: MemorySnapshot): Promise<AiReply> =>
    apiClient.post('/ai/chat', { text, history, memory }, { schema: AiReplySchema }),
  suggestions: (): Promise<AiSuggestions> =>
    apiClient.get('/ai/suggestions', { schema: SuggestionsSchema }),
}

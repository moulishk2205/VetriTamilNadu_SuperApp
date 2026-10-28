import { z } from 'zod'

export const ChatRole = z.enum(['user', 'ai', 'system'])
export type ChatRole = z.infer<typeof ChatRole>

/** A tool/action the assistant can surface (deep-link into the app). */
export const ChatActionSchema = z.object({ label: z.string(), screen: z.string() })
export type ChatAction = z.infer<typeof ChatActionSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: ChatRole,
  text: z.string(),
  /** Optional English gloss shown under Tamil replies. */
  en: z.string().optional(),
  action: ChatActionSchema.optional(),
  at: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ConversationSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  messages: z.array(ChatMessageSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Conversation = z.infer<typeof ConversationSchema>

import { http, HttpResponse } from 'msw'
import { runAskVetri, computeProactive } from '@/features/ai/engine/orchestrator'
import type { MemorySnapshot } from '@/features/ai/engine/types'
import type { RawState } from '@/features/ai/engine/contextBuilder'
import { records, toDTO } from './applications'
import { db } from '../db'

/**
 * Ask Vetri backend — a thin delegate to the AI Operating System orchestrator
 * (`features/ai/engine`). This handler only assembles the live platform state
 * (citizen, wallet, applications, schemes) and passes it in; every reply is
 * computed by the intent → context → plan → tools → compose pipeline. No
 * intent lists, no canned replies live here anymore.
 */

function rawState(): RawState {
  return {
    citizen: db.citizen,
    documents: db.documents,
    applications: records.map(toDTO),
    schemes: db.schemes,
    unreadNotifications: db.notifications.filter((n) => !n.read).length,
  }
}

export const aiHandlers = [
  http.post('/api/ai/chat', async ({ request }) => {
    const { text, memory } = (await request.json()) as { text: string; memory?: MemorySnapshot }
    const reply = runAskVetri(text, rawState(), memory)
    return HttpResponse.json({
      text: reply.text,
      en: reply.en,
      actions: reply.actions,
      plan: reply.plan,
      intent: reply.intent,
    })
  }),

  http.get('/api/ai/suggestions', () => HttpResponse.json({ items: computeProactive(rawState()) })),
]

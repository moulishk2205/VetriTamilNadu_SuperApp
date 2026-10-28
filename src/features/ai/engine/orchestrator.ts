import { extractIntent } from './intentEngine'
import { buildContext, type RawState } from './contextBuilder'
import { buildPlan } from './planner'
import { executePlan, type Prediction } from './toolExecutor'
import { compose } from './responseComposer'
import type { ComposedReply, MemorySnapshot } from './types'

/**
 * Ask Vetri Orchestrator — the AI Operating System entrypoint.
 *
 *   text → Intent Engine → Citizen Context → Planning Engine →
 *   Tool Orchestrator → Response Composer → reply (+ visible plan trace)
 *
 * Runs inside the embedded mock backend today; server-side against real
 * databases tomorrow. An LLM slots in at the composer without touching the
 * intent/context/planning/tool layers.
 */

export function runAskVetri(text: string, raw: RawState, memory?: MemorySnapshot): ComposedReply {
  const intent = extractIntent(text, memory)
  const ctx = buildContext(raw)
  const plan = buildPlan(intent)
  const results = executePlan(plan, ctx)
  return compose(intent, ctx, results)
}

/** Proactive "Ask Vetri" — predictive suggestions from live platform state. */
export interface ProactiveSuggestion {
  id: string
  text: string
  prompt: string
  icon: string
}

export function computeProactive(raw: RawState): ProactiveSuggestion[] {
  const ctx = buildContext(raw)
  const results = executePlan({ goal: 'proactive', steps: [{ tool: 'timeline.predict', rationale: 'proactive scan' }] }, ctx)
  const preds = (results[0]?.output as Prediction[]) ?? []
  const iconFor = (p: Prediction): string =>
    /expired|renew/i.test(p.reason) ? 'Clock'
    : /correction/i.test(p.reason) ? 'AlertTriangle'
    : /tax/i.test(p.reason) ? 'Receipt'
    : /scheme/i.test(p.reason) ? 'Sparkles'
    : /licence|licen/i.test(p.reason) ? 'Car'
    : 'Bell'
  return preds.slice(0, 4).map((p, i) => ({
    id: `sg_${i}`,
    text: p.reason,
    prompt: p.serviceId ? `Help me with ${p.serviceId.replace('svc_', '').replace('_', ' ')}` : p.reason,
    icon: iconFor(p),
  }))
}

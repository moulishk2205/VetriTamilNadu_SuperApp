import { getNode } from '../knowledge/serviceGraph'
import { getLifeEvent } from '../knowledge/lifeEvents'
import type { CitizenContext, Plan, PlanStep, ToolResult, WalletDocSnapshot } from './types'

/**
 * Tool Orchestrator — the typed registry through which the AI operates the
 * platform. Tools are pure functions over the citizen context + knowledge
 * graph; the planner decides which run, never the composer.
 */

// ── wallet.coverage: match wallet documents against a service's checklist ────
const REQ_TO_WALLET: [RegExp, RegExp][] = [
  [/aadhaar|govt id|id proof/i, /aadhaar|driving licen/i],
  [/ration|smart|family card/i, /ration/i],
  [/birth/i, /birth/i],
  [/income/i, /income/i],
  [/community/i, /community/i],
  [/death/i, /death/i],
  [/marriage/i, /marriage/i],
  [/driving|licen|\bdl\b/i, /driving/i],
  [/patta|chitta/i, /patta|chitta/i],
  [/encumbrance|\bec\b/i, /encumbrance/i],
  [/residence/i, /residence/i],
  [/nativity/i, /nativity/i],
  [/legal heir/i, /legal heir/i],
  [/\brc\b|registration cert/i, /driving licen/i],
]

export interface CoverageItem {
  requirement: string
  required: boolean
  coveredBy?: WalletDocSnapshot
  expired?: boolean
}

export interface CoverageResult {
  serviceId: string
  items: CoverageItem[]
  covered: number
  requiredTotal: number
  missing: string[]
}

function coverage(ctx: CitizenContext, serviceId: string): CoverageResult {
  const node = getNode(serviceId)
  const items: CoverageItem[] = (node?.requirements ?? []).map((req) => {
    const matcher = REQ_TO_WALLET.find(([reqRe]) => reqRe.test(req.label))
    const doc = matcher ? ctx.wallet.find((w) => matcher[1].test(w.name)) : undefined
    return { requirement: req.label, required: req.required, coveredBy: doc, expired: doc?.expired }
  })
  const requiredItems = items.filter((i) => i.required)
  return {
    serviceId,
    items,
    covered: requiredItems.filter((i) => i.coveredBy && !i.expired).length,
    requiredTotal: requiredItems.length,
    missing: requiredItems.filter((i) => !i.coveredBy || i.expired).map((i) => i.requirement),
  }
}

// ── timeline.predict: past → future reasoning ───────────────────────────────
export interface Prediction {
  reason: string
  serviceId?: string
}

function predict(ctx: CitizenContext): Prediction[] {
  const out: Prediction[] = []
  for (const doc of ctx.wallet) {
    if (doc.expired) out.push({ reason: `${doc.name} (${doc.number}) has expired — renewal recommended`, serviceId: doc.name.includes('Income') ? 'svc_income' : undefined })
  }
  if (ctx.pendingCorrections > 0) out.push({ reason: `${ctx.pendingCorrections} application(s) are waiting on corrections from you` })
  const hasDL = ctx.wallet.some((w) => /driving/i.test(w.name))
  if (!hasDL && (ctx.age ?? 0) >= 18) out.push({ reason: 'No driving licence on record — LLR available from 18', serviceId: 'svc_dl' })
  if ((ctx.age ?? 0) >= 21 && !ctx.wallet.some((w) => /marriage/i.test(w.name))) out.push({ reason: 'Marriage registration and related updates are common next steps at this age', serviceId: 'svc_marriage' })
  const month = new Date().getMonth()
  const window = month === 3 || month === 9
  out.push({
    reason: window
      ? 'Property-tax incentive window is OPEN — pay this month for the 5% rebate'
      : `Property-tax 5% incentive window opens ${month < 3 || month > 9 ? 'April 1' : 'October 1'}`,
    serviceId: 'svc_proptax',
  })
  if (ctx.schemes.length) out.push({ reason: `Eligible for ${ctx.schemes.length} welfare schemes based on your profile`, serviceId: undefined })
  return out.slice(0, 5)
}

// ── executor ────────────────────────────────────────────────────────────────
export function executePlan(plan: Plan, ctx: CitizenContext): ToolResult[] {
  return plan.steps.map((s: PlanStep): ToolResult => {
    switch (s.tool) {
      case 'wallet.list':
        return { step: s, output: ctx.wallet }
      case 'wallet.coverage':
        return { step: s, output: coverage(ctx, String(s.input?.serviceId ?? '')) }
      case 'applications.list':
        return { step: s, output: ctx.applications }
      case 'applications.forService':
        return { step: s, output: ctx.applications.filter((a) => a.serviceId === s.input?.serviceId && a.status !== 'Completed' && a.status !== 'Rejected') }
      case 'service.meta':
        return { step: s, output: s.input?.lifeEvent ? getLifeEvent(String(s.input.lifeEvent)) : getNode(String(s.input?.serviceId ?? '')) }
      case 'schemes.match':
        return { step: s, output: ctx.schemes }
      case 'timeline.predict':
        return { step: s, output: predict(ctx) }
      case 'navigate.build':
        return { step: s, output: s.input ?? {} }
    }
  })
}

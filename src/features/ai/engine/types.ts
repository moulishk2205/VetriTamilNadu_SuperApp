import type { Citizen } from '@/types/models/citizen'
import type { Scheme } from '@/types/models/scheme'

/**
 * Ask Vetri — AI Operating System types.
 *
 * The pipeline is: text → IntentFrame → CitizenContext → Plan → ToolResults →
 * ComposedReply. Every stage is typed data; nothing is a canned reply. A real
 * LLM later replaces `responseComposer`'s surface generation while the intent,
 * context, planning and tool layers stay exactly as they are.
 */

// ── Intent ───────────────────────────────────────────────────────────────────
export type IntentKind =
  | 'lifeEvent'
  | 'applyService'
  | 'explainService'
  | 'documentQuery'
  | 'coverageQuery'
  | 'trackStatus'
  | 'schemeQuery'
  | 'payment'
  | 'timelineQuery'
  | 'navigate'
  | 'smalltalk'

export interface IntentFrame {
  kind: IntentKind
  /** All matched life-event ids (multi-event reasoning). */
  lifeEvents: string[]
  /** All matched service ids, ranked. */
  services: string[]
  entities: {
    referenceNos: string[]
    district?: string
    navTarget?: string
  }
  urgency: 'normal' | 'high'
  sentiment: 'neutral' | 'empathetic' | 'celebratory'
  language: 'en' | 'ta' | 'mixed'
}

// ── Context (built from live state, injected — never fetched here) ──────────
export interface AppSnapshot {
  id: string
  referenceNo: string
  serviceId: string
  serviceName: string
  status: string
  stage: string
  slaDaysRemaining: number | null
}

export interface WalletDocSnapshot {
  id: string
  name: string
  number: string
  validity: string
  expired: boolean
}

export interface CitizenContext {
  citizen: Citizen
  age: number | null
  district: string
  wallet: WalletDocSnapshot[]
  applications: AppSnapshot[]
  schemes: Scheme[]
  pendingCorrections: number
  unreadNotifications: number
}

/** Client-side memory snapshot sent with each request (personalisation). */
export interface MemorySnapshot {
  frequentServices: Record<string, number>
  lastIntents: string[]
}

// ── Planning ─────────────────────────────────────────────────────────────────
export type ToolName =
  | 'wallet.list'
  | 'wallet.coverage'
  | 'applications.list'
  | 'applications.forService'
  | 'service.meta'
  | 'schemes.match'
  | 'timeline.predict'
  | 'navigate.build'

export interface PlanStep {
  tool: ToolName
  input?: Record<string, unknown>
  rationale: string
}

export interface Plan {
  goal: string
  steps: PlanStep[]
}

export interface ToolResult {
  step: PlanStep
  output: unknown
}

// ── Response ─────────────────────────────────────────────────────────────────
export interface ActionCard {
  label: string
  screen: string
  kind?: 'apply' | 'track' | 'wallet' | 'pay' | 'view'
}

export interface ComposedReply {
  text: string
  en?: string
  actions: ActionCard[]
  /** Human-readable executed plan trace ("reasoning steps"). */
  plan: string[]
  intent: string
}

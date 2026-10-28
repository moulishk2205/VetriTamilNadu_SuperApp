import type { IntentFrame, Plan, PlanStep } from './types'

/**
 * Planning Engine — the assistant never answers directly; it first builds a
 * typed plan of tool invocations for the orchestrator to execute. The plan is
 * derived from the intent frame; each step carries its rationale, which becomes
 * the visible reasoning trace.
 */

const step = (tool: PlanStep['tool'], rationale: string, input?: Record<string, unknown>): PlanStep => ({ tool, rationale, input })

export function buildPlan(intent: IntentFrame): Plan {
  const steps: PlanStep[] = []

  switch (intent.kind) {
    case 'lifeEvent': {
      steps.push(step('wallet.list', 'Check which documents the citizen already holds'))
      steps.push(step('applications.list', 'Check for in-flight applications to avoid duplicates'))
      for (const ev of intent.lifeEvents) {
        steps.push(step('service.meta', `Expand the ${ev} event into its service sequence`, { lifeEvent: ev }))
      }
      steps.push(step('navigate.build', 'Prepare one action per recommended service'))
      break
    }
    case 'applyService':
    case 'explainService': {
      const serviceId = intent.services[0]
      steps.push(step('service.meta', 'Load official metadata (fee, SLA, authority, eligibility)', { serviceId }))
      steps.push(step('applications.forService', 'Check for an existing active application', { serviceId }))
      steps.push(step('wallet.coverage', 'Match wallet documents against the requirements', { serviceId }))
      steps.push(step('navigate.build', 'Prepare the apply / track actions', { serviceId }))
      break
    }
    case 'coverageQuery': {
      const serviceId = intent.services[0]
      steps.push(step('service.meta', 'Load the document checklist', { serviceId }))
      steps.push(step('wallet.coverage', 'Compute covered vs missing documents', { serviceId }))
      steps.push(step('navigate.build', 'Prepare the apply action', { serviceId }))
      break
    }
    case 'documentQuery': {
      steps.push(step('wallet.list', 'Read the wallet with expiry analysis'))
      steps.push(step('navigate.build', 'Prepare the wallet action'))
      break
    }
    case 'trackStatus': {
      steps.push(step('applications.list', 'Read live application states and SLA clocks', { refs: intent.entities.referenceNos }))
      steps.push(step('navigate.build', 'Prepare the tracker action'))
      break
    }
    case 'schemeQuery': {
      steps.push(step('schemes.match', 'Match schemes against the citizen profile'))
      steps.push(step('wallet.coverage', 'Verify the income certificate needed for claims', { serviceId: 'svc_income' }))
      steps.push(step('navigate.build', 'Prepare scheme actions'))
      break
    }
    case 'payment': {
      steps.push(step('service.meta', 'Identify payable services', { payment: true }))
      steps.push(step('navigate.build', 'Prepare payment actions'))
      break
    }
    case 'timelineQuery': {
      steps.push(step('timeline.predict', 'Reason over past events to predict future needs'))
      steps.push(step('navigate.build', 'Prepare the timeline action'))
      break
    }
    case 'navigate': {
      steps.push(step('navigate.build', `Open ${intent.entities.navTarget}`, { target: intent.entities.navTarget }))
      break
    }
    case 'smalltalk': {
      steps.push(step('timeline.predict', 'Surface the most useful next actions for this citizen'))
      steps.push(step('navigate.build', 'Prepare starter actions'))
      break
    }
  }

  return { goal: intent.kind, steps }
}

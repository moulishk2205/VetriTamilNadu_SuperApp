import type { WorkflowDefinition, WorkflowInstance, WorkflowStage } from './types'
import { getWorkflowDefinition } from './definitions'

/**
 * Government Workflow Engine — pure, service-agnostic operations over any
 * `WorkflowDefinition`. No service-specific branching lives here.
 */

export function stageOf(def: WorkflowDefinition, stageId: string): WorkflowStage | undefined {
  return def.stages.find((s) => s.id === stageId)
}

export function canTransition(def: WorkflowDefinition, from: string, to: string): boolean {
  return (def.transitions[from] ?? []).includes(to)
}

export function nextStages(def: WorkflowDefinition, instance: WorkflowInstance): string[] {
  return def.transitions[instance.currentStage] ?? []
}

export function isTerminal(def: WorkflowDefinition, stageId: string): boolean {
  return Boolean(stageOf(def, stageId)?.terminal)
}

export function isComplete(def: WorkflowDefinition, instance: WorkflowInstance): boolean {
  return isTerminal(def, instance.currentStage)
}

/** Apply a transition, validating it is legal. Returns a new instance. */
export function applyTransition(
  def: WorkflowDefinition,
  instance: WorkflowInstance,
  to: string,
  meta?: { actor?: string; note?: string; at?: string },
): WorkflowInstance {
  if (!canTransition(def, instance.currentStage, to)) {
    throw new Error(`Illegal transition ${instance.currentStage} → ${to} in ${def.id}`)
  }
  return {
    ...instance,
    currentStage: to,
    history: [...instance.history, { stage: to, at: meta?.at ?? new Date().toISOString(), actor: meta?.actor, note: meta?.note }],
  }
}

/** Create a fresh instance at the definition's initial stage. */
export function startWorkflow(definitionId: string, at = new Date().toISOString()): WorkflowInstance {
  const def = getWorkflowDefinition(definitionId)
  if (!def) throw new Error(`Unknown workflow definition ${definitionId}`)
  return { definitionId, currentStage: def.initial, history: [{ stage: def.initial, at }] }
}

/** Completion percentage based on linear stage position (for progress bars). */
export function progress(def: WorkflowDefinition, instance: WorkflowInstance): number {
  const idx = def.stages.findIndex((s) => s.id === instance.currentStage)
  if (idx < 0) return 0
  return Math.round(((idx + 1) / def.stages.length) * 100)
}

/**
 * Build a display timeline: every stage the instance has visited is `done`, the
 * current stage is `current`, and reachable future stages are `pending`.
 */
export interface TimelineRow {
  id: string
  label: string
  status: 'done' | 'current' | 'pending'
  at?: string
}
export function buildTimeline(def: WorkflowDefinition, instance: WorkflowInstance): TimelineRow[] {
  const visited = new Map(instance.history.map((h) => [h.stage, h.at]))
  const currentIdx = def.stages.findIndex((s) => s.id === instance.currentStage)
  return def.stages
    .filter((s) => !s.terminal || s.id === instance.currentStage)
    .map((s, i) => ({
      id: s.id,
      label: s.label,
      at: visited.get(s.id),
      status: s.id === instance.currentStage ? 'current' : i < currentIdx ? 'done' : 'pending',
    }))
}

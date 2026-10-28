/**
 * Government Workflow Engine — types.
 *
 * A workflow is data, not code: any government service (certificate, licence,
 * complaint, transfer) declares a `WorkflowDefinition` and the engine drives it.
 * No stage logic is hardcoded per service.
 */

export type WorkflowActor = 'citizen' | 'system' | 'officer' | 'department' | 'signatory'

export interface WorkflowStage {
  id: string
  label: string
  actor: WorkflowActor
  /** Right-to-Service SLA for this stage, in days. */
  slaDays?: number
  terminal?: boolean
}

export interface WorkflowDefinition {
  id: string
  name: string
  stages: WorkflowStage[]
  /** Adjacency list of legal transitions: stageId → allowed next stageIds. */
  transitions: Record<string, string[]>
  initial: string
}

export interface WorkflowHistoryEntry {
  stage: string
  at: string
  actor?: string
  note?: string
}

export interface WorkflowInstance {
  definitionId: string
  currentStage: string
  history: WorkflowHistoryEntry[]
}

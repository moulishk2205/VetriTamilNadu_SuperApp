/**
 * Government Workflow Engine — types.
 *
 * Any government service (certificate, licence, complaint, transfer) declares a
 * typed `WorkflowDefinition` and the engine drives it, so no stage logic is
 * hardcoded per service. Definitions are TypeScript today (not admin-editable
 * data); the backend exports the running one as BPMN 2.0.
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

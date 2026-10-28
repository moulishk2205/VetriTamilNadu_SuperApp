import type { WorkflowDefinition } from './types'

/**
 * The standard TN government service workflow — the full pipeline every
 * certificate/licence service can reuse:
 *
 *   submission → document verification → officer assignment → department queue
 *   → inspection → remarks → escalation → approval → digital signature →
 *   certificate generation → wallet delivery → citizen notification → completed
 *
 * A service either reuses this or declares its own definition; the engine is
 * agnostic. Registered in a lookup so instances resolve their definition by id.
 */
export const STANDARD_GOV_WORKFLOW: WorkflowDefinition = {
  id: 'gov.standard.v1',
  name: 'Standard Government Service',
  initial: 'submitted',
  stages: [
    { id: 'submitted', label: 'Submitted', actor: 'citizen' },
    { id: 'docVerification', label: 'Document Verification', actor: 'system', slaDays: 1 },
    { id: 'officerAssigned', label: 'Officer Assigned', actor: 'system' },
    { id: 'departmentQueue', label: 'Department Queue', actor: 'department' },
    { id: 'inspection', label: 'Inspection', actor: 'officer', slaDays: 3 },
    { id: 'remarks', label: 'Remarks', actor: 'officer' },
    { id: 'escalation', label: 'Escalation', actor: 'system' },
    { id: 'approval', label: 'Approval', actor: 'officer', slaDays: 2 },
    { id: 'digitalSignature', label: 'Digital Signature', actor: 'signatory' },
    { id: 'certificateGeneration', label: 'Certificate Generation', actor: 'system' },
    { id: 'walletDelivery', label: 'Delivered to Wallet', actor: 'system' },
    { id: 'notified', label: 'Citizen Notified', actor: 'system' },
    { id: 'completed', label: 'Completed', actor: 'system', terminal: true },
    { id: 'rejected', label: 'Rejected', actor: 'officer', terminal: true },
    { id: 'correctionRequested', label: 'Correction Requested', actor: 'officer' },
  ],
  transitions: {
    submitted: ['docVerification'],
    docVerification: ['officerAssigned', 'correctionRequested', 'rejected'],
    officerAssigned: ['departmentQueue'],
    departmentQueue: ['inspection'],
    inspection: ['remarks', 'escalation'],
    remarks: ['approval', 'correctionRequested', 'rejected'],
    escalation: ['approval', 'rejected'],
    approval: ['digitalSignature', 'rejected'],
    digitalSignature: ['certificateGeneration'],
    certificateGeneration: ['walletDelivery'],
    walletDelivery: ['notified'],
    notified: ['completed'],
    correctionRequested: ['docVerification'],
    completed: [],
    rejected: [],
  },
}

const REGISTRY: Record<string, WorkflowDefinition> = {
  [STANDARD_GOV_WORKFLOW.id]: STANDARD_GOV_WORKFLOW,
}

export function getWorkflowDefinition(id: string): WorkflowDefinition | undefined {
  return REGISTRY[id]
}

export function registerWorkflowDefinition(def: WorkflowDefinition): void {
  REGISTRY[def.id] = def
}

import { Injectable } from '@nestjs/common'
import { ApplicationStage } from '@prisma/client'

/**
 * Government Workflow Engine — the same config-driven pipeline the frontend
 * declares in `lib/workflow`. Pure logic over the stage graph: legal
 * transitions, shortest-path routing (BFS) for officer actions, and timeline
 * projection. No service hardcodes its own flow.
 */

export interface StageDef {
  id: ApplicationStage
  label: string
  actor: string
  slaDays?: number
  terminal?: boolean
}

const S = ApplicationStage

export const STAGES: StageDef[] = [
  { id: S.submitted, label: 'Submitted', actor: 'citizen' },
  { id: S.docVerification, label: 'Document Verification', actor: 'system', slaDays: 1 },
  { id: S.officerAssigned, label: 'Officer Assigned', actor: 'system' },
  { id: S.departmentQueue, label: 'Department Queue', actor: 'department' },
  { id: S.inspection, label: 'Inspection', actor: 'officer', slaDays: 3 },
  { id: S.remarks, label: 'Remarks', actor: 'officer' },
  { id: S.escalation, label: 'Escalation', actor: 'system' },
  { id: S.approval, label: 'Approval', actor: 'officer', slaDays: 2 },
  { id: S.digitalSignature, label: 'Digital Signature', actor: 'signatory' },
  { id: S.certificateGeneration, label: 'Certificate Generation', actor: 'system' },
  { id: S.walletDelivery, label: 'Delivered to Wallet', actor: 'system' },
  { id: S.notified, label: 'Citizen Notified', actor: 'system' },
  { id: S.completed, label: 'Completed', actor: 'system', terminal: true },
  { id: S.rejected, label: 'Rejected', actor: 'officer', terminal: true },
  { id: S.correctionRequested, label: 'Correction Requested', actor: 'officer' },
]

export const TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  submitted: [S.docVerification],
  docVerification: [S.officerAssigned, S.correctionRequested, S.rejected],
  officerAssigned: [S.departmentQueue],
  departmentQueue: [S.inspection],
  inspection: [S.remarks, S.escalation],
  remarks: [S.approval, S.correctionRequested, S.rejected],
  escalation: [S.approval, S.rejected],
  approval: [S.digitalSignature, S.rejected],
  digitalSignature: [S.certificateGeneration],
  certificateGeneration: [S.walletDelivery],
  walletDelivery: [S.notified],
  notified: [S.completed],
  correctionRequested: [S.docVerification],
  completed: [],
  rejected: [],
}

const STATUS_LABEL: Partial<Record<ApplicationStage, string>> = {
  submitted: 'Submitted', escalation: 'Escalated', completed: 'Completed',
  rejected: 'Rejected', correctionRequested: 'Correction Requested',
}

@Injectable()
export class WorkflowEngine {
  readonly initial = S.submitted

  stage(id: ApplicationStage): StageDef | undefined {
    return STAGES.find((s) => s.id === id)
  }

  statusLabel(stage: ApplicationStage): string {
    return STATUS_LABEL[stage] ?? 'In Progress'
  }

  isTerminal(stage: ApplicationStage): boolean {
    return Boolean(this.stage(stage)?.terminal)
  }

  /** Next stage along the primary (approval) path. */
  next(stage: ApplicationStage): ApplicationStage | null {
    return TRANSITIONS[stage]?.[0] ?? null
  }

  /** Shortest legal path from `from` to `target` (BFS over transitions). */
  pathTo(from: ApplicationStage, target: ApplicationStage): ApplicationStage[] | null {
    const prev = new Map<ApplicationStage, ApplicationStage>()
    const queue: ApplicationStage[] = [from]
    const seen = new Set<ApplicationStage>([from])
    while (queue.length) {
      const cur = queue.shift() as ApplicationStage
      if (cur === target) {
        const path: ApplicationStage[] = []
        let node = target
        while (node !== from) {
          path.unshift(node)
          node = prev.get(node) as ApplicationStage
        }
        return path
      }
      for (const nxt of TRANSITIONS[cur] ?? []) {
        if (!seen.has(nxt)) {
          seen.add(nxt)
          prev.set(nxt, cur)
          queue.push(nxt)
        }
      }
    }
    return null
  }

  /** Display timeline given the visited stages. */
  buildTimeline(current: ApplicationStage, visited: Record<string, string>) {
    const currentIdx = STAGES.findIndex((s) => s.id === current)
    return STAGES.filter((s) => !s.terminal || s.id === current).map((s, i) => ({
      id: s.id,
      label: s.label,
      at: visited[s.id],
      status: s.id === current ? 'current' : i < currentIdx ? 'done' : 'pending',
    }))
  }
}

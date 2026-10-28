import { http, HttpResponse } from 'msw'
import { getWorkflowDefinition } from '@/lib/workflow/definitions'
import { applyTransition, isTerminal } from '@/lib/workflow/engine'
import { SERVICE_META_BY_ID } from '@/features/services/catalog/meta'
import { records, findRecord, toDTO, advanceRecord, pushNotification, OFFICERS, type AppRecord } from './applications'

/**
 * Officer Portal backend. Every action is a *legal* Workflow Engine operation:
 * targets are reached via BFS over the definition's transition graph (never a
 * forced state jump), and each action writes the audit log, citizen timeline
 * (workflow history) and a citizen notification.
 */

export interface AuditEntry {
  id: string
  actor: string
  action: string
  entity: string
  entityId: string
  at: string
  note?: string
}
export const auditLog: AuditEntry[] = [
  { id: 'aud_seed1', actor: 'system', action: 'seed', entity: 'platform', entityId: 'vetri', at: new Date(Date.now() - 86400000).toISOString(), note: 'Demo data initialised' },
]

function audit(actor: string, action: string, entityId: string, note?: string) {
  auditLog.unshift({ id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, actor, action, entity: 'application', entityId, at: new Date().toISOString(), note })
}

/** Shortest legal path from the current stage to `target` (BFS on transitions). */
function pathTo(definitionId: string, from: string, target: string): string[] | null {
  const def = getWorkflowDefinition(definitionId)!
  const prev = new Map<string, string>()
  const queue = [from]
  const seen = new Set([from])
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === target) {
      const path: string[] = []
      let node = target
      while (node !== from) {
        path.unshift(node)
        node = prev.get(node)!
      }
      return path
    }
    for (const next of def.transitions[cur] ?? []) {
      if (!seen.has(next)) {
        seen.add(next)
        prev.set(next, cur)
        queue.push(next)
      }
    }
  }
  return null
}

function transitionTowards(r: AppRecord, target: string, actor: string, note?: string): boolean {
  const def = getWorkflowDefinition(r.instance.definitionId)!
  const path = pathTo(r.instance.definitionId, r.instance.currentStage, target)
  if (!path) return false
  for (const stage of path) {
    r.instance = applyTransition(def, r.instance, stage, { at: new Date().toISOString(), actor, note: stage === target ? note : undefined })
  }
  r.updatedAt = new Date().toISOString()
  return true
}

const OFFICER_ME = OFFICERS[0] // Tmt. R. Kalaivani — the demo officer persona

export const officerHandlers = [
  /** The signed-in officer's identity + work queue. */
  http.get('/api/officer/queue', () =>
    HttpResponse.json({
      officer: OFFICER_ME,
      items: records.map(toDTO),
      total: records.length,
    }),
  ),

  /** Daily performance snapshot (live counts + charter-plausible aggregates). */
  http.get('/api/officer/stats', () => {
    const active = records.filter((r) => !isTerminal(getWorkflowDefinition(r.instance.definitionId)!, r.instance.currentStage))
    const escalated = records.filter((r) => r.instance.currentStage === 'escalation').length
    const corrections = records.filter((r) => r.instance.currentStage === 'correctionRequested').length
    return HttpResponse.json({
      pending: active.length,
      dueToday: active.filter((r) => (toDTO(r).slaDaysRemaining ?? 9) <= 1).length,
      highPriority: active.filter((r) => ['svc_income', 'svc_community'].includes(r.serviceId)).length,
      escalated,
      corrections,
      completedThisMonth: 47,
      avgProcessingDays: 4.2,
      approvalRate: 92,
      citizenRating: 4.6,
      slaCompliance: 96,
      departmentRank: 3,
    })
  }),

  /** One application for the officer review screen (mirrors the backend route). */
  http.get('/api/officer/applications/:id', ({ params }) => {
    const r = findRecord(params.id as string)
    return r ? HttpResponse.json(toDTO(r)) : new HttpResponse(null, { status: 404 })
  }),

  /** Officer action on an application — the heart of the portal. */
  http.post('/api/officer/applications/:id/action', async ({ params, request }) => {
    const r = findRecord(params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    const { action, note } = (await request.json()) as { action: string; note?: string }
    const meta = SERVICE_META_BY_ID[r.serviceId]
    const actor = `${OFFICER_ME.name} (${OFFICER_ME.designation})`
    if (note) r.remarks = [...(r.remarks ?? []), { at: new Date().toISOString(), by: actor, text: note }]

    switch (action) {
      case 'approve': {
        // One legal step, like the backend: the certificate is issued only after
        // approval → digital signature → generation → wallet delivery.
        if (isTerminal(getWorkflowDefinition(r.instance.definitionId)!, r.instance.currentStage)) {
          return HttpResponse.json({ message: 'Cannot approve from this stage' }, { status: 409 })
        }
        advanceRecord(r)
        audit(actor, 'approve', r.referenceNo, note)
        pushNotification('Application Progressed', `${meta?.name} ${r.referenceNo} moved forward by ${OFFICER_ME.name}.`, '/tracker', 'CheckCircle', 'ok')
        break
      }
      case 'reject': {
        if (!transitionTowards(r, 'rejected', actor, note)) return HttpResponse.json({ message: 'Cannot reject from this stage' }, { status: 409 })
        audit(actor, 'reject', r.referenceNo, note)
        pushNotification('Application Rejected', `${meta?.name} ${r.referenceNo} was rejected. Reason: ${note ?? 'see remarks'}. You may re-apply.`, '/tracker', 'AlertTriangle', 'err')
        break
      }
      case 'correction': {
        if (!transitionTowards(r, 'correctionRequested', actor, note)) return HttpResponse.json({ message: 'Cannot request correction from this stage' }, { status: 409 })
        audit(actor, 'request-correction', r.referenceNo, note)
        pushNotification('Correction Requested', `${meta?.name} ${r.referenceNo}: ${note ?? 'additional documents required'}.`, '/tracker', 'AlertTriangle', 'warn')
        break
      }
      case 'escalate': {
        if (!transitionTowards(r, 'escalation', actor, note)) return HttpResponse.json({ message: 'Cannot escalate from this stage' }, { status: 409 })
        audit(actor, 'escalate', r.referenceNo, note)
        pushNotification('Application Escalated', `${meta?.name} ${r.referenceNo} escalated to ${meta?.authorities.escalation ?? 'senior officer'}.`, '/tracker', 'AlertTriangle', 'warn')
        break
      }
      case 'transfer': {
        const other = OFFICERS.find((o) => o.name !== (r.officer?.name ?? OFFICER_ME.name)) ?? OFFICERS[1]
        r.officer = other
        r.updatedAt = new Date().toISOString()
        audit(actor, 'transfer', r.referenceNo, `→ ${other.name}`)
        pushNotification('Officer Reassigned', `${meta?.name} ${r.referenceNo} transferred to ${other.name}, ${other.designation}.`, '/tracker', 'Users', 'info')
        break
      }
      default:
        return HttpResponse.json({ message: `Unknown action ${action}` }, { status: 400 })
    }
    return HttpResponse.json(toDTO(r))
  }),

  /** Audit trail (consumed by the Admin Portal). */
  http.get('/api/admin/audit', () => HttpResponse.json({ items: auditLog, total: auditLog.length })),
]

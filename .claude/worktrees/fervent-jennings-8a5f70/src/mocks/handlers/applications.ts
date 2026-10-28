import { http, HttpResponse } from 'msw'
import { SERVICE_META_BY_ID } from '@/features/services/catalog/meta'
import { getWorkflowDefinition } from '@/lib/workflow/definitions'
import { startWorkflow, applyTransition, buildTimeline, stageOf } from '@/lib/workflow/engine'
import type { WorkflowInstance } from '@/lib/workflow/types'
import { db } from '../db'

/** Realistic TN Revenue/Registration officer pool for assignment. */
export const OFFICERS = [
  { name: 'Tmt. R. Kalaivani', designation: 'Revenue Inspector', jurisdiction: 'Mylapore Taluk' },
  { name: 'Thiru. S. Murugesan', designation: 'Deputy Tahsildar', jurisdiction: 'Egmore Taluk' },
  { name: 'Tmt. P. Anitha', designation: 'Zonal Officer', jurisdiction: 'GCC Zone 9' },
  { name: 'Thiru. K. Ramesh', designation: 'Sub-Registrar', jurisdiction: 'Chennai Central' },
]

const SVC_CODE: Record<string, string> = {
  svc_income: 'IC', svc_community: 'CC', svc_birth: 'BC', svc_death: 'DC',
  svc_marriage: 'MC', svc_dl: 'DL', svc_ration: 'RC', svc_patta: 'PT',
  // Phase 3.5 additions
  svc_residence: 'RES', svc_nativity: 'NAT', svc_legalheir: 'LH', svc_ec: 'EC',
  svc_chitta: 'CHT', svc_adangal: 'ADG', svc_fmb: 'FMB', svc_rctransfer: 'RCT',
  svc_duprc: 'DRC', svc_mvtax: 'MVT', svc_echallan: 'ECH', svc_proptax: 'PTX', svc_water: 'WTR',
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted', docVerification: 'In Progress', officerAssigned: 'In Progress',
  departmentQueue: 'In Progress', inspection: 'In Progress', remarks: 'In Progress',
  escalation: 'Escalated', approval: 'In Progress', digitalSignature: 'In Progress',
  certificateGeneration: 'In Progress', walletDelivery: 'In Progress', notified: 'In Progress',
  completed: 'Completed', rejected: 'Rejected', correctionRequested: 'Correction Requested',
}

export interface AppRecord {
  id: string
  referenceNo: string
  serviceId: string
  officer: (typeof OFFICERS)[number] | null
  createdAt: string
  updatedAt: string
  instance: WorkflowInstance
  fields: Record<string, unknown>
  documents?: { requirementId: string; name: string; source: string; walletDocId?: string }[]
  remarks?: { at: string; by: string; text: string }[]
  certIssued?: boolean
}

let seq = 44821
export const records: AppRecord[] = []

export function findRecord(id: string | readonly string[] | undefined): AppRecord | undefined {
  return records.find((x) => x.id === id || x.referenceNo === id)
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Advance a fresh instance through N legal transitions along the primary path. */
function advance(instance: WorkflowInstance, steps: number): WorkflowInstance {
  const def = getWorkflowDefinition(instance.definitionId)!
  let cur = instance
  const path = ['docVerification', 'officerAssigned', 'departmentQueue', 'inspection', 'remarks', 'approval', 'digitalSignature', 'certificateGeneration', 'walletDelivery', 'notified', 'completed']
  let i = 0
  for (let s = 0; s < steps && i < path.length; s++, i++) {
    const to = path[i]
    if ((def.transitions[cur.currentStage] ?? []).includes(to)) {
      cur = applyTransition(def, cur, to, { at: daysFromNow(-(steps - s) * 2) })
    }
  }
  return cur
}

export function toDTO(r: AppRecord) {
  const def = getWorkflowDefinition(r.instance.definitionId)!
  const meta = SERVICE_META_BY_ID[r.serviceId]
  const rows = buildTimeline(def, r.instance)
  const stage = r.instance.currentStage
  const slaDays = stageOf(def, stage)?.slaDays ?? null
  return {
    id: r.id,
    referenceNo: r.referenceNo,
    serviceId: r.serviceId,
    serviceName: meta?.name ?? r.serviceId,
    status: STATUS_LABEL[stage] ?? 'In Progress',
    stage,
    department: meta?.department ?? 'Revenue Department',
    officer: r.officer,
    slaDaysRemaining: slaDays,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    timeline: rows.map((row) => ({ id: row.id, label: row.label, status: row.status, at: row.at })),
    fields: r.fields,
    documents: r.documents ?? [],
    remarks: r.remarks ?? [],
  }
}

/** Apply one legal transition along the primary path, with officer assignment
 *  and certificate → wallet delivery side-effects. Shared by the citizen
 *  tracker's "Check for updates" and every Officer Portal action. */
export function advanceRecord(r: AppRecord): void {
  const def = getWorkflowDefinition(r.instance.definitionId)!
  const meta = SERVICE_META_BY_ID[r.serviceId]
  const next = (def.transitions[r.instance.currentStage] ?? [])[0]
  if (!next) return
  r.instance = applyTransition(def, r.instance, next, { at: new Date().toISOString() })
  r.updatedAt = new Date().toISOString()
  if (!r.officer && r.instance.currentStage === 'officerAssigned') r.officer = OFFICERS[Math.floor(Math.random() * OFFICERS.length)]
  if (r.instance.currentStage === 'walletDelivery' && !r.certIssued && meta?.producesDocumentType) {
    r.certIssued = true
    db.documents.push({ id: `doc_${r.id}`, name: meta.producesDocumentType, type: meta.department, number: r.referenceNo.replace('APP', 'CRT'), issuer: meta.department, holderName: 'CHANDRAMOULISHWARAR K', dob: '22/05/2002', validity: 'Valid', status: 'verified', color: '#059669', version: 1 })
    pushNotification('Certificate Ready', `${meta.name} issued and delivered to your Wallet.`, '/wallet', 'FileCheck', 'ok')
  }
}

export function pushNotification(title: string, body: string, actionPath: string, icon: string, color: string) {
  db.notifications.unshift({
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title, body, category: 'application', priority: 'high', read: false,
    createdAt: new Date().toISOString(), timeLabel: 'Just now', icon, color, actionPath,
  })
}

// Seed two in-progress demo applications so Home + Tracker have real data.
;(function seed() {
  const now = new Date().toISOString()
  const inc: AppRecord = { id: 'app_ic', referenceNo: 'APP-2026-IC-44821', serviceId: 'svc_income', officer: OFFICERS[0], createdAt: daysFromNow(-6), updatedAt: now, instance: advance(startWorkflow('gov.standard.v1', daysFromNow(-6)), 4), fields: { fullName: 'Chandramoulishwarar K', purpose: 'Educational Concession' } }
  const com: AppRecord = { id: 'app_cc', referenceNo: 'APP-2026-CC-44903', serviceId: 'svc_community', officer: OFFICERS[1], createdAt: daysFromNow(-10), updatedAt: now, instance: advance(startWorkflow('gov.standard.v1', daysFromNow(-10)), 6), fields: { fullName: 'Chandramoulishwarar K', community: 'BC' } }
  records.push(inc, com)
})()

export const applicationHandlers = [
  http.get('/api/applications', () => HttpResponse.json({ items: records.map(toDTO), total: records.length, page: 0, pageSize: records.length })),

  http.get('/api/applications/:id', ({ params }) => {
    const r = records.find((x) => x.id === params.id || x.referenceNo === params.id)
    return r ? HttpResponse.json(toDTO(r)) : new HttpResponse(null, { status: 404 })
  }),

  http.post('/api/applications', async ({ request }) => {
    const body = (await request.json()) as { serviceId: string; fields: Record<string, unknown>; documents?: AppRecord['documents'] }
    const meta = SERVICE_META_BY_ID[body.serviceId]
    if (!meta) return new HttpResponse(JSON.stringify({ message: 'Unknown service' }), { status: 400 })
    seq += 1
    const now = new Date().toISOString()
    const code = SVC_CODE[body.serviceId] ?? 'GN'
    const rec: AppRecord = {
      id: `app_${seq}`,
      referenceNo: `APP-2026-${code}-${seq}`,
      serviceId: body.serviceId,
      officer: null,
      createdAt: now,
      updatedAt: now,
      instance: startWorkflow(meta.workflowId, now),
      fields: body.fields ?? {},
      documents: body.documents ?? [],
    }
    records.unshift(rec)
    pushNotification('Application Submitted', `${meta.name} — ${rec.referenceNo} received. We'll notify you at each step.`, '/tracker', 'CheckCircle', 'ok')
    return HttpResponse.json(toDTO(rec), { status: 201 })
  }),

  // Advance a workflow one step — drives the demo forward and, at certificate
  // generation, delivers the certificate to the wallet + notifies the citizen.
  http.post('/api/applications/:id/advance', ({ params }) => {
    const r = findRecord(params.id)
    if (!r) return new HttpResponse(null, { status: 404 })
    advanceRecord(r)
    return HttpResponse.json(toDTO(r))
  }),
]

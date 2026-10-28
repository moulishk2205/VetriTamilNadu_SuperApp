import { useMemo, useState } from 'react'
import { useApplicationsQuery } from '@/features/applications/hooks/useApplications'
import { useDocumentsQuery } from '@/features/documents/hooks/useDocuments'
import { useComplaintsQuery } from '@/features/complaints/hooks/useComplaints'
import { useServiceCatalogView } from '@/features/services/hooks/useServices'
import { presentTimeline } from '@/features/applications/timeline'
import type { ApplicationDTO } from '@/features/applications/api/applicationsApi'

export type BoardTone = 'err' | 'warn' | 'ok' | 'info'

/** One thing the citizen should act on or know about, with exactly one action. */
export interface AttentionItem {
  id: string
  tone: BoardTone
  /** Plain-language status word, so the tone is never carried by colour alone. */
  flag: string
  title: string
  detail: string
  action: string
  nav: string
}

/** One application, reduced to what a citizen asks: where is it, what happens next, how long. */
export interface BoardRow {
  id: string
  title: string
  ref: string
  filed: string
  state: 'action' | 'progress' | 'done' | 'rejected'
  status: string
  stageNow: string
  stageNext: string | null
  step: number
  steps: number
  daysLeft: number | null
  office: string
}

/**
 * Status colours for an application, shared by the web dashboard and the phone
 * home so a state looks the same everywhere: dot, step rail and label agree.
 */
export const BOARD_STATE: Record<BoardRow['state'], { dot: string; label?: string }> = {
  action: { dot: '#E8590C', label: 'Action needed' },
  progress: { dot: '#1F6FEB' },
  done: { dot: '#1E8E4E', label: 'Ready' },
  rejected: { dot: '#C92A2A', label: 'Not approved' },
}

/** Where an application stands, in the board's terms: state, current step, total steps. */
export function railOf(a: ApplicationDTO): { state: BoardRow['state']; step: number; steps: number } {
  const line = presentTimeline(a)
  const at = line.findIndex((r) => r.status === 'current')
  const reached = at >= 0 ? at : line.filter((r) => r.status === 'done').length - 1
  const state: BoardRow['state'] =
    a.stage === 'correctionRequested' ? 'action' : a.status === 'Rejected' ? 'rejected' : a.status === 'Completed' ? 'done' : 'progress'
  return { state, step: state === 'done' ? line.length : Math.max(reached, 0) + 1, steps: Math.max(line.length, 1) }
}

const DAY = 86_400_000
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtMonth = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

/** Locker validity is free text; only "MM/YYYY" carries an expiry we can act on. */
export function expiryOf(validity: string): Date | null {
  const m = /^(\d{1,2})\/(\d{4})$/.exec(validity.trim())
  if (!m) return null
  // Valid through the end of that month.
  return new Date(Number(m[2]), Number(m[1]), 1)
}

/**
 * The citizen home, as data: what needs attention, where each application
 * stands, and the headline counts. Phone and web both render from this, so the
 * two experiences can never disagree. Everything is derived from the queries
 * the rest of the app already uses — nothing here is invented.
 */
export function useHomeBoard() {
  const { data: appList, isLoading: appsLoading, isError: appsFailed, refetch: refetchApps } = useApplicationsQuery()
  const { data: docList, isLoading: docsLoading, refetch: refetchDocs } = useDocumentsQuery()
  const complaints = useComplaintsQuery()
  const services = useServiceCatalogView()
  // Captured once per visit: "now" must not change between renders.
  const [now] = useState(() => Date.now())

  return useMemo(() => {
    const rows: BoardRow[] = (appList ?? []).map((a) => {
      const line = presentTimeline(a)
      const at = line.findIndex((r) => r.status === 'current')
      const reached = at >= 0 ? at : line.filter((r) => r.status === 'done').length - 1
      const state: BoardRow['state'] =
        a.stage === 'correctionRequested' ? 'action' : a.status === 'Rejected' ? 'rejected' : a.status === 'Completed' ? 'done' : 'progress'
      return {
        id: a.id,
        title: a.serviceName,
        ref: a.referenceNo,
        filed: fmtDay(a.createdAt),
        state,
        status: a.status,
        stageNow: line[Math.max(reached, 0)]?.label ?? a.status,
        stageNext: state === 'progress' ? line.find((r) => r.status === 'pending')?.label ?? null : null,
        step: state === 'done' ? line.length : Math.max(reached, 0) + 1,
        steps: Math.max(line.length, 1),
        daysLeft: state === 'progress' ? a.slaDaysRemaining : null,
        office: a.officer ? `${a.officer.designation}, ${a.officer.jurisdiction}` : a.department,
      }
    })

    const rank = { action: 0, progress: 1, done: 2, rejected: 3 } as const
    const board = [...rows].sort((x, y) => rank[x.state] - rank[y.state] || (x.daysLeft ?? 99) - (y.daysLeft ?? 99))

    const attention: AttentionItem[] = []
    for (const a of appList ?? []) {
      const lastRemark = a.remarks[a.remarks.length - 1]?.text
      const recent = now - Date.parse(a.updatedAt) < 30 * DAY
      if (a.stage === 'correctionRequested') {
        attention.push({ id: `fix-${a.id}`, tone: 'warn', flag: 'Action needed', title: `${a.serviceName}: correction requested`, detail: lastRemark ?? 'The officer has asked for corrected details or documents before this can continue.', action: 'Review request', nav: 'tracker' })
      } else if (a.status === 'Rejected' && recent) {
        attention.push({ id: `rej-${a.id}`, tone: 'err', flag: 'Not approved', title: `${a.serviceName} was not approved`, detail: lastRemark ?? 'Read the officer’s remarks. You may apply again if you are eligible.', action: 'See the reason', nav: 'tracker' })
      }
    }
    for (const d of docList ?? []) {
      const expiry = expiryOf(d.validity)
      if (!expiry && d.status !== 'expired') continue
      const daysLeft = expiry ? Math.ceil((expiry.getTime() - now) / DAY) : -1
      if (daysLeft > 60) continue
      const renew = services.find((s) => s.n.toLowerCase() === d.name.toLowerCase())
      const until = expiry ? fmtMonth(new Date(expiry.getTime() - DAY)) : null
      attention.push(
        daysLeft <= 0
          ? { id: `exp-${d.id}`, tone: 'err', flag: 'Expired', title: `${d.name} has expired`, detail: `${until ? `It was valid until ${until}. ` : ''}Renew it before using it for a new application.`, action: renew ? 'Renew now' : 'Open locker', nav: renew ? `service/${renew.id}` : 'wallet' }
          : { id: `exp-${d.id}`, tone: 'warn', flag: 'Expiring soon', title: `${d.name} expires in ${daysLeft} days`, detail: `Valid until ${until}. Renewing early avoids a gap.`, action: renew ? 'Renew now' : 'Open locker', nav: renew ? `service/${renew.id}` : 'wallet' },
      )
    }
    for (const a of appList ?? []) {
      if (a.status === 'Completed' && now - Date.parse(a.updatedAt) < 14 * DAY) {
        attention.push({ id: `done-${a.id}`, tone: 'ok', flag: 'Ready', title: `${a.serviceName} is ready`, detail: 'Your certificate has been issued to your Digital Locker.', action: 'Open locker', nav: 'wallet' })
      }
    }
    // Fixed order: what the citizen must do, then decisions, then good news.
    const toneRank = { warn: 0, err: 1, ok: 2, info: 3 } as const
    attention.sort((x, y) => toneRank[x.tone] - toneRank[y.tone])
    const flagged = new Set(attention.map((x) => x.id.replace(/^(fix|rej|done)-/, '')))

    return {
      loading: appsLoading || docsLoading,
      failed: appsFailed,
      retry: () => { void refetchApps(); void refetchDocs() },
      attention,
      totalApplications: rows.length,
      /** Items that need the citizen to do something (excludes good news). */
      actionCount: attention.filter((x) => x.tone !== 'ok').length,
      // One row per thing: an application already listed under "needs your action"
      // is not repeated in the applications list.
      board: board.filter((r) => !flagged.has(r.id)),
      /** Every application, most pressing first. */
      applications: board,
      inProgress: rows.filter((r) => r.state === 'progress' || r.state === 'action').length,
      documents: (docList ?? []).length,
      openGrievances: (complaints.data ?? []).filter((x) => !['resolved', 'closed'].includes(String(x.status))).length,
    }
  }, [appList, appsLoading, appsFailed, refetchApps, docList, docsLoading, refetchDocs, complaints.data, services, now])
}

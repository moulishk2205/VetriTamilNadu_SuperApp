import type { ApplicationDTO } from './api/applicationsApi'

export type TimelineRow = ApplicationDTO['timeline'][number]

/** Exception branches of the workflow — shown only while the application is in them. */
const EXCEPTION_STAGES = new Set(['escalation', 'correctionRequested'])
/** Steps that only follow an approval, so they can never precede a rejection or a returned application. */
const ISSUING_STAGES = new Set(['approval', 'digitalSignature', 'certificateGeneration', 'walletDelivery', 'notified'])

/**
 * The stage timeline as a citizen or officer should read it.
 *
 * The API returns every stage of the workflow in catalogue order, exception
 * branches included. Shown verbatim, a routine application lists "Escalation"
 * and "Correction Requested" steps it never went through, a finished one still
 * highlights its last step as in progress, and a rejected one appears to have
 * been signed and delivered. This keeps the approval path clean and surfaces an
 * exception branch only when the application is actually in it. Presentation
 * only — the application's stage and status are untouched.
 */
export function presentTimeline(app: Pick<ApplicationDTO, 'stage' | 'timeline' | 'updatedAt'>): TimelineRow[] {
  const halted = app.stage === 'rejected' || app.stage === 'correctionRequested'
  const lastUpdate = Date.parse(app.updatedAt)

  return app.timeline
    .filter((row) => {
      if (row.id === app.stage) return true
      if (EXCEPTION_STAGES.has(row.id)) return false
      // A rejected or returned application never reached the issuing steps.
      if (halted && ISSUING_STAGES.has(row.id)) return false
      // An escalated application went up from inspection, bypassing remarks.
      if (app.stage === 'escalation' && row.id === 'remarks') return false
      return true
    })
    .map((row) => {
      // A finished application has no step still "in progress".
      const status: TimelineRow['status'] = row.id === 'completed' && row.status === 'current' ? 'done' : row.status
      // No step can be dated after the application was last updated.
      const at = row.at && Number.isFinite(lastUpdate) && Date.parse(row.at) > lastUpdate ? app.updatedAt : row.at
      return { ...row, status, at }
    })
}

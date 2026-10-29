import { ApplicationStage } from '@prisma/client'
import { STAGES, TRANSITIONS, WorkflowEngine } from '../../src/modules/workflow/workflow.engine'

const S = ApplicationStage
const engine = new WorkflowEngine()

describe('WorkflowEngine stage graph', () => {
  it('defines every ApplicationStage exactly once', () => {
    const ids = STAGES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(Object.values(S).sort())
  })

  it('only transitions to defined stages', () => {
    for (const [from, tos] of Object.entries(TRANSITIONS)) {
      expect(engine.stage(from as ApplicationStage)).toBeDefined()
      for (const to of tos) expect(engine.stage(to)).toBeDefined()
    }
  })

  it('has no way out of a terminal stage', () => {
    for (const s of STAGES.filter((st) => st.terminal)) expect(TRANSITIONS[s.id]).toEqual([])
    expect(engine.isTerminal(S.completed)).toBe(true)
    expect(engine.isTerminal(S.rejected)).toBe(true)
    expect(engine.isTerminal(S.approval)).toBe(false)
  })

  it('can finish every open application', () => {
    for (const s of STAGES.filter((st) => !st.terminal)) {
      expect(engine.pathTo(s.id, S.completed)).not.toBeNull()
    }
  })
})

describe('WorkflowEngine routing', () => {
  it('follows the primary path with next()', () => {
    expect(engine.next(S.submitted)).toBe(S.docVerification)
    expect(engine.next(S.approval)).toBe(S.digitalSignature)
    expect(engine.next(S.completed)).toBeNull()
  })

  it('finds the shortest legal path', () => {
    expect(engine.pathTo(S.inspection, S.approval)).toEqual([S.remarks, S.approval])
    expect(engine.pathTo(S.approval, S.completed)).toEqual([
      S.digitalSignature, S.certificateGeneration, S.walletDelivery, S.notified, S.completed,
    ])
    expect(engine.pathTo(S.remarks, S.remarks)).toEqual([])
  })

  it('refuses paths the graph does not allow', () => {
    expect(engine.pathTo(S.completed, S.submitted)).toBeNull()
    expect(engine.pathTo(S.rejected, S.approval)).toBeNull()
    expect(engine.pathTo(S.approval, S.inspection)).toBeNull()
  })

  it('loops a correction back through document verification', () => {
    expect(engine.pathTo(S.correctionRequested, S.officerAssigned)).toEqual([S.docVerification, S.officerAssigned])
  })
})

describe('WorkflowEngine presentation', () => {
  it('labels status from the stage', () => {
    expect(engine.statusLabel(S.submitted)).toBe('Submitted')
    expect(engine.statusLabel(S.escalation)).toBe('Escalated')
    expect(engine.statusLabel(S.inspection)).toBe('In Progress')
  })

  it('marks timeline steps done, current and pending', () => {
    const timeline = engine.buildTimeline(S.inspection, { submitted: '2026-10-01' })
    const byId = Object.fromEntries(timeline.map((t) => [t.id, t]))
    expect(byId.submitted.status).toBe('done')
    expect(byId.submitted.at).toBe('2026-10-01')
    expect(byId.inspection.status).toBe('current')
    expect(byId.approval.status).toBe('pending')
    // Terminal stages appear only when the application is in one.
    expect(byId.completed).toBeUndefined()
    expect(byId.rejected).toBeUndefined()
    expect(engine.buildTimeline(S.rejected, {}).some((t) => t.id === S.rejected && t.status === 'current')).toBe(true)
  })
})

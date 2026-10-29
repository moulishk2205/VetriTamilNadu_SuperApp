import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CircleCheck, FileCheck, TriangleAlert, Upload } from 'lucide-react'
import { Card, Btn } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'
import { normalizeError } from '@/lib/api/errors'
import { schemeKeys } from '@/features/schemes/hooks/useSchemes'

interface SchemeChange { schemeId: string; scheme: string; before: string[]; after: string[]; notInPortal: string[] }
interface DmnResult { applied: boolean; changes: SchemeChange[]; unchanged: number; notInFile: number }
interface BpmnResult { conforms: boolean; process: { id: string; name?: string }; tasks: number; flows: number; notesCompared: number; differences: string[] }

type Outcome =
  | { kind: 'dmn'; file: string; xml: string; result: DmnResult }
  | { kind: 'bpmn'; file: string; result: BpmnResult }
  | { kind: 'error'; file: string; problems: string[] }

/**
 * The API takes JSON bodies up to 100 kB (102,400 bytes). The file travels
 * JSON-encoded, where quotes, tabs and line breaks grow, so the encoded size
 * is what is checked.
 */
const MAX_BODY_BYTES = 100_000
const TOO_LARGE = `The file is too large to upload: the limit is about ${MAX_BODY_BYTES / 1000} kB once encoded.`

/** Every problem the server listed, or its single message. */
function problemsOf(e: unknown): string[] {
  const err = normalizeError(e)
  if (err.status === 413) return [TOO_LARGE]
  return err.fieldErrors?._?.length ? err.fieldErrors._ : [err.message]
}

const conditions = (list: string[]) => (list.length ? list.join(' · ') : 'department review')

/**
 * Brings edited files back from a modeller. A DMN file is previewed first and
 * only changes eligibility when "Apply" is pressed; a BPMN file is checked
 * against the running workflow, because the engine runs its built-in
 * definition and cannot deploy an uploaded process.
 */
export function WorkflowImports() {
  const c = useC()
  const qc = useQueryClient()
  const dmnInput = useRef<HTMLInputElement>(null)
  const bpmnInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const readFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again fires a change
    if (!file) return null
    const xml = await file.text()
    if (new Blob([JSON.stringify({ xml })]).size > MAX_BODY_BYTES) {
      setOutcome({ kind: 'error', file: file.name, problems: [TOO_LARGE] })
      return null
    }
    return { name: file.name, xml }
  }

  const run = async (file: string, work: () => Promise<Outcome>) => {
    setBusy(true)
    try {
      setOutcome(await work())
    } catch (e) {
      setOutcome({ kind: 'error', file, problems: problemsOf(e) })
    } finally {
      setBusy(false)
    }
  }

  const onDmn = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = await readFile(e)
    if (!f) return
    await run(f.name, async () => ({ kind: 'dmn', file: f.name, xml: f.xml, result: await apiClient.post<DmnResult>('/admin/workflows/eligibility/dmn/preview', { xml: f.xml }) }))
  }

  const onBpmn = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = await readFile(e)
    if (!f) return
    await run(f.name, async () => ({ kind: 'bpmn', file: f.name, result: await apiClient.post<BpmnResult>('/admin/workflows/gov.standard.v1/bpmn/check', { xml: f.xml }) }))
  }

  const apply = async () => {
    if (outcome?.kind !== 'dmn') return
    const { file, xml } = outcome
    await run(file, async () => {
      const result = await apiClient.post<DmnResult>('/admin/workflows/eligibility/dmn/apply', { xml })
      void qc.invalidateQueries({ queryKey: schemeKeys.all })
      return { kind: 'dmn', file, xml, result }
    })
  }

  const row = (children: ReactNode, key?: string) => (
    <li key={key} style={{ fontSize: 12.5, color: c.txt2, lineHeight: 1.5, marginTop: 6 }}>{children}</li>
  )

  return (
    <Card style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <FileCheck size={20} color={c.pri} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: c.txt }}>Bring edited files back</p>
          <p style={{ fontSize: 12, color: c.txt2, marginTop: 2, lineHeight: 1.45 }}>
            Edit the exports in any BPMN/DMN modeller. A DMN file replaces the stored scheme eligibility rules after you review the changes. A BPMN file is checked against the running workflow; it is not deployed.
          </p>
        </div>
        <Btn variant="outline" icon={Upload} disabled={busy} onClick={() => dmnInput.current?.click()}>Import DMN…</Btn>
        <Btn variant="outline" icon={Upload} disabled={busy} onClick={() => bpmnInput.current?.click()}>Check a BPMN file…</Btn>
        <input ref={dmnInput} type="file" accept=".dmn,.xml" hidden onChange={(e) => void onDmn(e)} />
        <input ref={bpmnInput} type="file" accept=".bpmn,.xml" hidden onChange={(e) => void onBpmn(e)} />
      </div>

      {busy && <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 12 }}>Reading the file…</p>}

      {!busy && outcome?.kind === 'error' && (
        <div role="alert" style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.bdr}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: c.err, display: 'flex', gap: 6, alignItems: 'center' }}><TriangleAlert size={15} /> {outcome.file} cannot be used</p>
          <ul style={{ paddingLeft: 18 }}>{outcome.problems.map((p, i) => row(p, String(i)))}</ul>
        </div>
      )}

      {!busy && outcome?.kind === 'dmn' && (
        <div role="status" style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.bdr}` }}>
          {outcome.result.applied ? (
            <p style={{ fontSize: 13, fontWeight: 700, color: c.ok, display: 'flex', gap: 6, alignItems: 'center' }}>
              <CircleCheck size={15} /> Applied: {outcome.result.changes.length} scheme(s) updated and recorded in the audit trail.
            </p>
          ) : outcome.result.changes.length === 0 ? (
            <p style={{ fontSize: 13, fontWeight: 700, color: c.ok, display: 'flex', gap: 6, alignItems: 'center' }}>
              <CircleCheck size={15} /> No changes: the {outcome.result.unchanged} scheme(s) in {outcome.file} already match.
            </p>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{outcome.file} would change {outcome.result.changes.length} scheme(s):</p>
          )}
          {outcome.result.changes.length > 0 && (
            <ul style={{ paddingLeft: 18 }}>
              {outcome.result.changes.map((ch) => row(
                <>
                  <b style={{ color: c.txt }}>{ch.scheme}</b>: {conditions(ch.before)} → {conditions(ch.after)}
                  {ch.notInPortal.length > 0 && (
                    <span style={{ display: 'block', fontSize: 11.5, color: c.warn }}>
                      Kept in the rules and the DMN export, but not shown in the portal's eligibility summary: {ch.notInPortal.join(' · ')}
                    </span>
                  )}
                </>,
                ch.schemeId,
              ))}
            </ul>
          )}
          {outcome.result.notInFile > 0 && <p style={{ fontSize: 12, color: c.txt3, marginTop: 8 }}>{outcome.result.notInFile} scheme(s) are not in the file and stay as they are.</p>}
          {!outcome.result.applied && outcome.result.changes.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Btn variant="primary" onClick={() => void apply()}>Apply {outcome.result.changes.length} change(s)</Btn>
              <Btn variant="outline" onClick={() => setOutcome(null)}>Discard</Btn>
            </div>
          )}
        </div>
      )}

      {!busy && outcome?.kind === 'bpmn' && (
        <div role="status" style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.bdr}` }}>
          {outcome.result.conforms ? (
            <p style={{ fontSize: 13, fontWeight: 700, color: c.ok, display: 'flex', gap: 6, alignItems: 'center' }}>
              <CircleCheck size={15} /> {outcome.file} matches the running workflow ({outcome.result.tasks} tasks, {outcome.result.flows} flows).
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: c.warn, display: 'flex', gap: 6, alignItems: 'center' }}>
                <TriangleAlert size={15} /> {outcome.file} differs from the running workflow in {outcome.result.differences.length} way(s):
              </p>
              <ul style={{ paddingLeft: 18 }}>{outcome.result.differences.map((d, i) => row(d, String(i)))}</ul>
            </>
          )}
          <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 8, lineHeight: 1.5 }}>
            Compared: the stages, every transition in both directions, and whether each step is done by a person or runs automatically.
            Actor and SLA notes were compared on {outcome.result.notesCompared} of {outcome.result.tasks} tasks; tasks without a note are not checked for them.
          </p>
        </div>
      )}
    </Card>
  )
}

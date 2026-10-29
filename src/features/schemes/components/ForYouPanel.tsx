import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { Panel, DeskBtn } from '@/app/desktop/DesktopUI'
import { normalizeError } from '@/lib/api/errors'
import { eligibilityApi, FACT_INPUTS, type Facts } from '../api/eligibilityApi'

export const ELIGIBILITY_KEY = ['eligibility'] as const

/** "Age 24 · Male · Chennai · Income ₹2,40,000 (declared) …" */
function summary(f: Facts): string {
  const declared = FACT_INPUTS.flatMap(({ key, options }) => {
    const v = (f as Record<string, string | number | undefined>)[key]
    if (v === undefined) return []
    const shown = key === 'annualIncome' ? `Income ₹${Number(v).toLocaleString('en-IN')}` : options?.find(([id]) => id === v)?.[1] ?? String(v)
    return [`${shown} (declared)`]
  })
  return [f.age !== undefined && `Age ${f.age}`, f.gender, f.district, ...declared].filter(Boolean).join(' · ')
}

/**
 * The citizen's eligibility details: what the profile already says, and only
 * the questions the schemes still need answered. The scheme cards below show
 * the result.
 */
export function ForYouPanel() {
  const c = useC()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ELIGIBILITY_KEY, queryFn: eligibilityApi.mine })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const declare = useMutation({
    mutationFn: () => eligibilityApi.declare(Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v !== '').map(([k, v]) => [k, k === 'annualIncome' ? Math.round(Number(v)) : v]),
    )),
    onSuccess: (r) => {
      setEditing(false)
      setDraft({})
      setMessage({ ok: true, text: r.newlyEligible?.length ? `You now qualify for ${r.newlyEligible.join(', ')}.` : 'Details saved.' })
      qc.setQueryData(ELIGIBILITY_KEY, r)
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e) => setMessage({ ok: false, text: normalizeError(e).message }),
  })

  if (!data) return null
  const needs = data.schemes.filter((s) => s.verdict === 'needs_info')
  const missing = new Set(needs.flatMap((s) => s.missing))
  const asks = FACT_INPUTS.filter((f) => (editing ? true : missing.has(f.key)))
  const income = draft.annualIncome ?? ''
  const valid = Object.values(draft).some((v) => v !== '') && (income === '' || (Number.isFinite(Number(income)) && Number(income) >= 0))
  const box = { padding: '9px 12px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 13.5 } as const

  return (
    <div style={{ marginBottom: 24 }}>
      <Panel title="For you, from your profile" action={<DeskBtn variant="line" onClick={() => { setEditing((v) => !v); setDraft({}) }}>{editing ? 'Cancel' : 'Update my details'}</DeskBtn>}>
        <p style={{ fontSize: 12.5, color: c.txt2 }}>Checked against: {summary(data.facts)}</p>

        {message && (
          <p role="status" style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: message.ok ? c.ok : c.err, display: 'flex', gap: 6, alignItems: 'center' }}>
            {message.ok ? <Check size={15} /> : <X size={15} />} {message.text}
          </p>
        )}

        {asks.length > 0 ? (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: `1px dashed ${c.bdr}`, background: `${c.pri}08` }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: c.txt }}>
              {editing ? 'Update your details' : `Answer ${asks.length === 1 ? 'one question' : `${asks.length} questions`} to check ${needs.length} more scheme${needs.length === 1 ? '' : 's'}`}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, alignItems: 'flex-end' }}>
              {asks.map((f) => (
                <label key={f.key} style={{ fontSize: 12, color: c.txt2, display: 'grid', gap: 4 }}>
                  {f.label}
                  {f.options ? (
                    <select value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} style={box}>
                      <option value="">Choose</option>
                      {f.options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  ) : (
                    <input type="number" min={0} inputMode="numeric" value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder="e.g. 240000" style={{ ...box, width: 170 }} />
                  )}
                </label>
              ))}
              <DeskBtn variant="primary" onClick={() => valid && !declare.isPending && declare.mutate()}>{declare.isPending ? 'Checking…' : 'Check my eligibility'}</DeskBtn>
            </div>
            <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 8 }}>You declare these yourself. The department verifies them before any benefit is paid.</p>
          </div>
        ) : (
          <p style={{ fontSize: 12.5, color: c.txt3, marginTop: 8 }}>Every scheme that can be checked automatically has been checked. Update your details if anything changes.</p>
        )}
      </Panel>
    </div>
  )
}

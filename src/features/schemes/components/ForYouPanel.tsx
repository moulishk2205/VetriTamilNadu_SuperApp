import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Sparkles, X } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { Panel, DeskBtn, StatusChip } from '@/app/desktop/DesktopUI'
import { normalizeError } from '@/lib/api/errors'
import { eligibilityApi, FACT_LABEL, type SchemeResult } from '../api/eligibilityApi'

const KEY = ['eligibility'] as const

/**
 * "No Application" delivery on the schemes page: every scheme checked against
 * the citizen's profile, the facts still needed asked for in one place, and a
 * one-tap claim for each scheme whose recorded conditions they meet.
 */
export function ForYouPanel() {
  const c = useC()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: eligibilityApi.mine })
  const [editing, setEditing] = useState(false)
  const [income, setIncome] = useState('')
  const [land, setLand] = useState<'' | 'yes' | 'no'>('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: KEY })
    void qc.invalidateQueries({ queryKey: ['notifications'] })
  }
  const declare = useMutation({
    mutationFn: () => eligibilityApi.declare({
      ...(income.trim() ? { annualIncome: Math.round(Number(income)) } : {}),
      ...(land ? { landHolder: land } : {}),
    }),
    onSuccess: (r) => {
      setEditing(false)
      setMessage({ ok: true, text: r.newlyEligible?.length ? `You now qualify for ${r.newlyEligible.join(', ')}.` : 'Details saved.' })
      qc.setQueryData(KEY, r)
      refresh()
    },
    onError: (e) => setMessage({ ok: false, text: normalizeError(e).message }),
  })
  const claim = useMutation({
    mutationFn: (s: SchemeResult) => eligibilityApi.claim(s.schemeId),
    onSuccess: (_r, s) => { setMessage({ ok: true, text: `Claim sent for ${s.name}. ${s.department} will verify it and update you.` }); refresh() },
    onError: (e) => setMessage({ ok: false, text: normalizeError(e).message }),
  })

  if (isLoading || !data) return null
  const by = (v: SchemeResult['verdict']) => data.schemes.filter((s) => s.verdict === v)
  const eligible = by('eligible'), needs = by('needs_info'), notEligible = by('not_eligible'), review = by('department_review')
  const missing = [...new Set(needs.flatMap((s) => s.missing))]
  const asks = editing ? ['annualIncome', 'landHolder'] : missing.filter((m) => m === 'annualIncome' || m === 'landHolder')
  const f = data.facts
  const known = [
    f.age !== undefined && `Age ${f.age}`, f.gender, f.district,
    f.annualIncome !== undefined ? `Income ₹${f.annualIncome.toLocaleString('en-IN')} (declared)` : 'Income not given',
    f.landHolder ? `Agricultural land: ${f.landHolder} (declared)` : null,
  ].filter(Boolean).join(' · ')
  const valid = (!income.trim() || (Number.isFinite(Number(income)) && Number(income) >= 0)) && (income.trim() !== '' || land !== '')

  return (
    <div style={{ marginBottom: 24 }}>
      <Panel title="For you, from your profile" action={<DeskBtn variant="line" onClick={() => setEditing((v) => !v)}>{editing ? 'Cancel' : 'Update my details'}</DeskBtn>}>
        <p style={{ fontSize: 12.5, color: c.txt2 }}>Checked against: {known}</p>

        {message && (
          <p role="status" style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: message.ok ? c.ok : c.err, display: 'flex', gap: 6, alignItems: 'center' }}>
            {message.ok ? <Check size={15} /> : <X size={15} />} {message.text}
          </p>
        )}

        {asks.length > 0 && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: `1px dashed ${c.bdr}`, background: `${c.pri}08` }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: c.txt }}>
              {editing ? 'Update your details' : `Answer ${asks.length === 1 ? 'one question' : `${asks.length} questions`} to check ${needs.length} more scheme${needs.length === 1 ? '' : 's'}`}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, alignItems: 'flex-end' }}>
              {asks.includes('annualIncome') && (
                <label style={{ fontSize: 12, color: c.txt2, display: 'grid', gap: 4 }}>
                  Annual family income (₹)
                  <input type="number" min={0} inputMode="numeric" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 240000"
                    style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 13.5, width: 180 }} />
                </label>
              )}
              {asks.includes('landHolder') && (
                <label style={{ fontSize: 12, color: c.txt2, display: 'grid', gap: 4 }}>
                  Do you own agricultural land?
                  <select value={land} onChange={(e) => setLand(e.target.value as '' | 'yes' | 'no')}
                    style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 13.5 }}>
                    <option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option>
                  </select>
                </label>
              )}
              <DeskBtn variant="primary" onClick={() => valid && !declare.isPending && declare.mutate()}>{declare.isPending ? 'Checking…' : 'Check my eligibility'}</DeskBtn>
            </div>
            <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 8 }}>You declare these yourself. The department verifies them before any benefit is paid.</p>
          </div>
        )}

        {eligible.length > 0 && (
          <div className="vtn-grid vtn-grid-3" style={{ marginTop: 16 }}>
            {eligible.map((s) => (
              <article key={s.schemeId} className="vtn-card" style={{ padding: 16, borderTop: `3px solid ${s.color}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Sparkles size={16} color={s.color} />
                  <StatusChip label="You're eligible" tone="ok" />
                </div>
                <div>
                  <p style={{ fontSize: 14.5, fontWeight: 700, color: c.txt }}>{s.name}</p>
                  <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 3 }}>{s.benefit} · {s.department}</p>
                </div>
                <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 3 }}>
                  {s.conditions.map((cnd) => (
                    <li key={cnd.text} style={{ fontSize: 12, color: c.txt2, display: 'flex', gap: 5, alignItems: 'center' }}><Check size={13} color={c.ok} />{cnd.text}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 'auto' }}>
                  {s.claim
                    ? <StatusChip label={`Claimed · ${s.claim.status === 'submitted' ? 'under verification' : s.claim.status}`} tone="info" />
                    : <DeskBtn variant="primary" onClick={() => !claim.isPending && claim.mutate(s)}>Claim now: no form needed</DeskBtn>}
                </div>
              </article>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14, display: 'grid', gap: 4 }}>
          {notEligible.map((s) => (
            <p key={s.schemeId} style={{ fontSize: 12, color: c.txt3 }}>
              Not eligible for <b style={{ color: c.txt2 }}>{s.name}</b> (it requires: {s.conditions.filter((x) => x.met === false).map((x) => x.text).join('; ')})
            </p>
          ))}
          {needs.length > 0 && asks.length === 0 && (
            <p style={{ fontSize: 12, color: c.txt3 }}>{needs.length} scheme(s) need details we cannot collect here yet: {missing.map((m) => FACT_LABEL[m] ?? m).join(', ')}.</p>
          )}
          {review.length > 0 && <p style={{ fontSize: 12, color: c.txt3 }}>{review.length} scheme(s) have no automatic check yet; the department assesses those.</p>}
        </div>
      </Panel>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Bookmark, Check, ArrowRight, Building2, Scale, X, FileText, TriangleAlert } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Toolbar, FilterChips, Panel, EmptyState, DeskBtn, StatusChip } from '@/app/desktop/DesktopUI'
import { useSchemeCards } from '@/features/schemes/hooks/useSchemes'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ForYouPanel, ELIGIBILITY_KEY } from '@/features/schemes/components/ForYouPanel'
import { eligibilityApi, FACT_LABEL, type SchemeResult } from '@/features/schemes/api/eligibilityApi'
import { normalizeError } from '@/lib/api/errors'

const VERDICT_LABEL: Record<SchemeResult['verdict'], string> = {
  eligible: "You're eligible", not_eligible: 'Not eligible', needs_info: 'Needs your details', department_review: 'Department decides',
}

/**
 * Desktop scheme recommendations: eligibility-ranked cards with bookmarking and
 * a side-by-side comparison tray. Reads the same `useSchemeCards()` hook the
 * mobile discovery screen uses.
 */
export default function DesktopSchemes() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { citizen } = useAuth()
  const schemes = useSchemeCards()
  const qc = useQueryClient()
  const { data: elig } = useQuery({ queryKey: ELIGIBILITY_KEY, queryFn: eligibilityApi.mine })
  const verdictOf = useMemo(() => new Map((elig?.schemes ?? []).map((r) => [r.name, r])), [elig])
  const [claimMsg, setClaimMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const claim = useMutation({
    mutationFn: (r: SchemeResult) => eligibilityApi.claim(r.schemeId),
    onSuccess: (_x, r) => {
      setClaimMsg({ ok: true, text: `Claim sent for ${r.name}. ${r.department} will verify it and update you.` })
      void qc.invalidateQueries({ queryKey: ELIGIBILITY_KEY })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (e) => setClaimMsg({ ok: false, text: normalizeError(e).message }),
  })

  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')
  const [saved, setSaved] = useState<string[]>([])
  const [compare, setCompare] = useState<string[]>([])
  const [detail, setDetail] = useState<string | null>(null)

  const departments = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of schemes) map.set(s.d, (map.get(s.d) ?? 0) + 1)
    return [{ id: 'all', label: 'All', count: schemes.length }, ...[...map.entries()].map(([d, n]) => ({ id: d, label: d, count: n }))]
  }, [schemes])

  const list = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return schemes
      .filter((s) => (dept === 'all' || s.d === dept) && (!needle || [s.n, s.b, s.nTa, s.bTa].some((v) => (v ?? '').toLowerCase().includes(needle))))
      .sort((a, b) => b.m - a.m)
  }, [schemes, q, dept])

  const toggle = (arr: string[], set: (v: string[]) => void, id: string, max = Infinity) => {
    if (arr.includes(id)) return set(arr.filter((x) => x !== id))
    if (arr.length >= max) return
    set([...arr, id])
  }

  const matched = list.filter((s) => verdictOf.get(s.n)?.verdict === 'eligible')
  const others = list.filter((s) => verdictOf.get(s.n)?.verdict !== 'eligible')

  /** What the eligibility check says, in a line, on the card. */
  const verdictLine = (r: SchemeResult | undefined) => {
    if (!r) return null
    const text = r.verdict === 'not_eligible' ? `Not eligible: requires ${r.conditions.filter((x) => x.met === false).map((x) => x.text).join('; ')}`
      : r.verdict === 'needs_info' ? `Answer the questions above to check (${r.missing.map((m) => FACT_LABEL[m] ?? m).join(', ')})`
      : r.verdict === 'department_review' ? 'No automatic check: the department decides' : null
    return text && <p style={{ fontSize: 12, color: r.verdict === 'not_eligible' ? c.err : c.txt3, lineHeight: 1.45 }}>{text}</p>
  }

  const card = (s: (typeof schemes)[number], isMatch: boolean) => {
    const isSaved = saved.includes(s.n)
    const inCompare = compare.includes(s.n)
    const r = verdictOf.get(s.n)
    return (
      <article key={s.n} className={`vtn-card vtn-hover${isMatch ? ' vtn-matched' : ''}`}
        style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, ...(isMatch ? { boxShadow: `0 0 0 2px ${c.ok}, 0 0 18px ${c.ok}66` } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: `${s.cl}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} color={s.cl} />
          </span>
          {isMatch && <StatusChip label="You're eligible" tone="ok" />}
          <button
            onClick={() => toggle(saved, setSaved, s.n)}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${s.n} from saved` : `Save ${s.n}`}
            style={{ background: isSaved ? `${c.sec}22` : 'transparent', border: `1px solid ${isSaved ? c.sec : c.bdr}`, borderRadius: 9, padding: 7, cursor: 'pointer', display: 'flex' }}
          >
            <Bookmark size={15} color={isSaved ? c.secDk : c.txt3} fill={isSaved ? c.sec : 'none'} />
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: c.txt, lineHeight: 1.35 }}>{s.n}</p>
          {s.nTa && <p style={{ fontSize: 12.5, color: c.txt3, marginTop: 3, fontFamily: "'Noto Sans Tamil', sans-serif" }}>{s.nTa}</p>}
          <p style={{ fontSize: 13, color: c.txt2, marginTop: 6 }}>{s.b}</p>
          {s.budget && <p className="vtn-num" style={{ fontSize: 11.5, color: c.secDk, marginTop: 5, fontWeight: 600 }}>Allocation {s.budget}</p>}
          <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Building2 size={12} />{s.d}
          </p>
        </div>

        {isMatch && r ? (
          <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 3 }}>
            {r.conditions.map((x) => <li key={x.text} style={{ fontSize: 12, color: c.txt2, display: 'flex', gap: 5, alignItems: 'center' }}><Check size={13} color={c.ok} />{x.text}</li>)}
          </ul>
        ) : verdictLine(r)}

        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${c.bdr}`, flexWrap: 'wrap' }}>
          {isMatch && r && (r.claim
            ? <StatusChip label={`Claimed · ${r.claim.status === 'submitted' ? 'under verification' : r.claim.status}`} tone="info" />
            : <DeskBtn variant="primary" onClick={() => !claim.isPending && claim.mutate(r)}>Claim now: no form needed</DeskBtn>)}
          <DeskBtn variant="line" icon={ArrowRight} onClick={() => setDetail(s.n)}>Details</DeskBtn>
          <button
            onClick={() => toggle(compare, setCompare, s.n, 3)}
            aria-pressed={inCompare}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1px solid ${inCompare ? c.pri : c.bdr}`, background: inCompare ? `${c.pri}0F` : c.card, color: inCompare ? c.pri : c.txt2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {inCompare ? <Check size={14} /> : <Scale size={14} />}{inCompare ? 'Comparing' : 'Compare'}
          </button>
        </div>
      </article>
    )
  }

  const comparing = schemes.filter((s) => compare.includes(s.n))
  const selectedScheme = schemes.find((s) => s.n === detail)

  return (
    <>
      <PageHeader
        title="Welfare Schemes"
        subtitle={`Government of Tamil Nadu schemes ranked against ${citizen?.fullName ? `${citizen.fullName}’s` : 'your'} citizen profile — district, income band and verified documents. Scheme details and budgets are illustrative until verified against the Government Order.`}
        actions={compare.length > 0 ? <DeskBtn icon={Scale} onClick={() => setCompare([])}>Clear comparison ({compare.length})</DeskBtn> : undefined}
      />

      <ForYouPanel />

      <Toolbar query={q} onQuery={setQ} placeholder="Search schemes by name or benefit…">
        <FilterChips options={departments} value={dept} onChange={setDept} />
      </Toolbar>

      {/* Scheme detail — real content, no dead end */}
      {selectedScheme && (
        <div style={{ marginBottom: 24 }}>
          <Panel
            title={selectedScheme.n}
            action={<button onClick={() => setDetail(null)} aria-label="Close scheme detail" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={17} color={c.txt3} /></button>}
          >
            {selectedScheme.nTa && <p style={{ fontSize: 14, color: c.txt2, fontFamily: "'Noto Sans Tamil', sans-serif" }}>{selectedScheme.nTa}</p>}
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', marginTop: 16 }}>
              <div>
                <dl style={{ display: 'grid', gap: 12 }}>
                  {[
                    { k: 'Benefit', v: selectedScheme.b },
                    { k: 'Department', v: selectedScheme.d },
                    { k: 'Budget allocation', v: selectedScheme.budget ?? 'Published with the departmental budget' },
                    { k: 'Your eligibility', v: verdictOf.get(selectedScheme.n) ? VERDICT_LABEL[verdictOf.get(selectedScheme.n)!.verdict] : 'Checking…' },
                  ].map((r) => (
                    <div key={r.k}>
                      <dt style={{ fontSize: 11.5, color: c.txt3 }}>{r.k}</dt>
                      <dd className="vtn-num" style={{ fontSize: 13.5, color: c.txt, fontWeight: 500, marginTop: 2 }}>{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: c.txt3 }}>How to apply</p>
                <ol style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 8 }}>
                  <li style={{ fontSize: 13, color: c.txt2, lineHeight: 1.6 }}>Obtain an Income Certificate if you do not already hold a valid one.</li>
                  <li style={{ fontSize: 13, color: c.txt2, lineHeight: 1.6 }}>Carry your Aadhaar, ration card and the certificate to your Taluk e-Sevai centre.</li>
                  <li style={{ fontSize: 13, color: c.txt2, lineHeight: 1.6 }}>The department verifies eligibility and sanctions the benefit.</li>
                </ol>
                <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${c.bdr}`, lineHeight: 1.55 }}>
                  Schemes you are matched for can be claimed online from their card. For the others, the department checks eligibility; applying for the prerequisite certificate below is fully online.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <DeskBtn variant="primary" icon={FileText} onClick={() => onNav('service/svc_income')}>Apply for Income Certificate</DeskBtn>
                  <DeskBtn icon={Sparkles} onClick={() => onNav('ai')}>Ask Vetri about this scheme</DeskBtn>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Comparison tray */}
      {comparing.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <Panel title={`Comparing ${comparing.length} schemes`} padded={false}>
            <div className="vtn-scroll-x">
              <table className="vtn-table">
                <thead>
                  <tr><th>Criterion</th>{comparing.map((s) => <th key={s.n}>{s.n}</th>)}</tr>
                </thead>
                <tbody>
                  <tr><td style={{ fontWeight: 600 }}>Benefit</td>{comparing.map((s) => <td key={s.n}>{s.b}</td>)}</tr>
                  <tr><td style={{ fontWeight: 600 }}>Department</td>{comparing.map((s) => <td key={s.n} style={{ color: c.txt2 }}>{s.d}</td>)}</tr>
                  <tr><td style={{ fontWeight: 600 }}>Your eligibility</td>{comparing.map((s) => { const r = verdictOf.get(s.n); return <td key={s.n}><StatusChip label={r ? VERDICT_LABEL[r.verdict] : '—'} tone={r?.verdict === 'eligible' ? 'ok' : r?.verdict === 'not_eligible' ? 'warn' : 'info'} /></td> })}</tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {claimMsg && (
        <p role="status" style={{ marginBottom: 14, fontSize: 13, fontWeight: 600, color: claimMsg.ok ? c.ok : c.err, display: 'flex', gap: 6, alignItems: 'center' }}>
          {claimMsg.ok ? <Check size={15} /> : <X size={15} />} {claimMsg.text}
        </p>
      )}

      {list.length === 0 ? (
        <div className="vtn-card">
          <EmptyState
            title="No schemes match your filters"
            desc="Try a different department or clear the search to see every welfare scheme."
            action={<DeskBtn variant="primary" onClick={() => { setQ(''); setDept('all') }}>Clear filters</DeskBtn>}
          />
        </div>
      ) : (
        <>
          <style>{`@media (prefers-reduced-motion: no-preference) { .vtn-matched { animation: vtnGlow 2.4s ease-in-out infinite } }
            @keyframes vtnGlow { 0%, 100% { box-shadow: 0 0 0 2px ${c.ok}, 0 0 14px ${c.ok}55 } 50% { box-shadow: 0 0 0 2px ${c.ok}, 0 0 28px ${c.ok}99 } }`}</style>

          <h2 style={{ fontSize: 17, fontWeight: 800, color: c.txt, margin: '6px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={c.ok} /> Matched for you <span style={{ fontSize: 13, fontWeight: 600, color: c.txt3 }}>({matched.length})</span>
          </h2>
          {matched.length === 0 ? (
            <p style={{ fontSize: 13, color: c.txt2, marginBottom: 24 }}>No scheme matches your details yet. Answer the questions above, or update your details if something has changed.</p>
          ) : (
            <div className="vtn-grid vtn-grid-3" style={{ marginBottom: 28 }}>{matched.map((s) => card(s, true))}</div>
          )}

          <h2 style={{ fontSize: 17, fontWeight: 800, color: c.txt, margin: '6px 0 10px' }}>
            Other schemes <span style={{ fontSize: 13, fontWeight: 600, color: c.txt3 }}>({others.length})</span>
          </h2>
          <p role="note" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 12, background: `${c.warn}14`, border: `1px solid ${c.warn}55`, color: c.txt, fontSize: 13, marginBottom: 16 }}>
            <TriangleAlert size={16} color={c.warn} style={{ flexShrink: 0, marginTop: 1 }} />
            You may or may not be eligible for these schemes. Each card says why; the department checks the full conditions.
          </p>
          <div className="vtn-grid vtn-grid-3">{others.map((s) => card(s, false))}</div>
        </>
      )}
    </>
  )
}

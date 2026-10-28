import { useMemo, useState } from 'react'
import { Sparkles, Bookmark, Check, ArrowRight, Building2, Scale } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Toolbar, FilterChips, Panel, EmptyState, DeskBtn, StatusChip } from '@/app/desktop/DesktopUI'
import { useSchemeCards } from '@/features/schemes/hooks/useSchemes'
import { useAuth } from '@/features/auth/hooks/useAuth'

const band = (m: number) => (m >= 85 ? 'High match' : m >= 70 ? 'Likely eligible' : 'Worth checking')
const bandTone = (m: number) => (m >= 85 ? 'ok' : m >= 70 ? 'warn' : 'info') as 'ok' | 'warn' | 'info'

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

  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')
  const [saved, setSaved] = useState<string[]>([])
  const [compare, setCompare] = useState<string[]>([])

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

  const comparing = schemes.filter((s) => compare.includes(s.n))

  return (
    <>
      <PageHeader
        title="Welfare Schemes"
        subtitle={`Government of Tamil Nadu schemes ranked against ${citizen?.fullName ?? 'your'} citizen profile — district, income band and verified documents.`}
        actions={compare.length > 0 ? <DeskBtn icon={Scale} onClick={() => setCompare([])}>Clear comparison ({compare.length})</DeskBtn> : undefined}
      />

      <Toolbar query={q} onQuery={setQ} placeholder="Search schemes by name or benefit…">
        <FilterChips options={departments} value={dept} onChange={setDept} />
      </Toolbar>

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
                  <tr><td style={{ fontWeight: 600 }}>Eligibility match</td>{comparing.map((s) => <td key={s.n}><StatusChip label={`${s.m}% · ${band(s.m)}`} tone={bandTone(s.m)} /></td>)}</tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {list.length === 0 ? (
        <div className="vtn-card">
          <EmptyState
            title="No schemes match your filters"
            desc="Try a different department or clear the search to see every welfare scheme matched to your profile."
            action={<DeskBtn variant="primary" onClick={() => { setQ(''); setDept('all') }}>Clear filters</DeskBtn>}
          />
        </div>
      ) : (
        <div className="vtn-grid vtn-grid-3">
          {list.map((s) => {
            const isSaved = saved.includes(s.n)
            const inCompare = compare.includes(s.n)
            return (
              <article key={s.n} className="vtn-card vtn-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: `${s.cl}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={20} color={s.cl} />
                  </span>
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

                {/* Eligibility meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: c.txt3 }}>Eligibility match</span>
                    <span className="vtn-num" style={{ fontSize: 11.5, fontWeight: 800, color: s.cl }}>{s.m}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: c.bdr, overflow: 'hidden' }}>
                    <div style={{ width: `${s.m}%`, height: '100%', background: s.cl, borderRadius: 3 }} />
                  </div>
                  <div style={{ marginTop: 9 }}><StatusChip label={band(s.m)} tone={bandTone(s.m)} /></div>
                </div>

                <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${c.bdr}`, flexWrap: 'wrap' }}>
                  <DeskBtn variant="primary" icon={ArrowRight} onClick={() => onNav('schemes')}>Apply</DeskBtn>
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
          })}
        </div>
      )}
    </>
  )
}

import { useMemo, useState } from 'react'
import { Clock, IndianRupee, ArrowRight, Star, Building2 } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Toolbar, FilterChips, EmptyState, DeskBtn, Panel } from '@/app/desktop/DesktopUI'
import { useServiceCatalogView, useServiceCategoriesView } from '@/features/services/hooks/useServices'
import { SERVICE_META } from '@/features/services/catalog/meta'
import { useApplicationsQuery } from '@/features/applications/hooks/useApplications'

/**
 * Desktop service catalogue.
 *
 * A wide, searchable directory with category and department filters, a featured
 * row and a recently-used rail. Reads the same `useServiceCatalogView()` the
 * mobile hub uses and opens the identical `/service/:slug` workflow.
 */
export default function DesktopServices() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const all = useServiceCatalogView()
  const categories = useServiceCategoriesView()
  const { data: apps } = useApplicationsQuery()

  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [dept, setDept] = useState('all')

  const deptBySlug = useMemo(() => new Map(SERVICE_META.map((s) => [s.id, s.department])), [])

  // Only categories that actually contain services (never an empty filter).
  const catOptions = useMemo(
    () => categories.filter((x) => x.id === 'all' || all.some((s) => s.cat === x.id)).map((x) => ({ id: x.id, label: x.l, count: x.id === 'all' ? all.length : all.filter((s) => s.cat === x.id).length })),
    [categories, all],
  )

  const departments = useMemo(() => {
    const set = new Map<string, number>()
    for (const s of all) {
      const d = deptBySlug.get(s.id)
      if (d) set.set(d, (set.get(d) ?? 0) + 1)
    }
    return [...set.entries()].sort((a, b) => b[1] - a[1])
  }, [all, deptBySlug])

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return all.filter((s) => {
      if (cat !== 'all' && s.cat !== cat) return false
      if (dept !== 'all' && deptBySlug.get(s.id) !== dept) return false
      if (!needle) return true
      return s.n.toLowerCase().includes(needle) || (deptBySlug.get(s.id) ?? '').toLowerCase().includes(needle)
    })
  }, [all, q, cat, dept, deptBySlug])

  const featured = useMemo(() => all.filter((s) => s.pop).slice(0, 4), [all])
  // Services the citizen has actually applied for, most recent first, de-duped.
  const recent = useMemo(() => {
    const seen = new Set<string>()
    const out: typeof all = []
    for (const a of apps ?? []) {
      const svc = all.find((s) => s.id === a.serviceId)
      if (svc && !seen.has(svc.id)) {
        seen.add(svc.id)
        out.push(svc)
      }
      if (out.length === 4) break
    }
    return out
  }, [apps, all])

  const ServiceCard = ({ s, compact = false }: { s: (typeof all)[number]; compact?: boolean }) => (
    <button
      onClick={() => onNav(`service/${s.id}`)}
      className="vtn-card vtn-hover"
      style={{ textAlign: 'left', padding: compact ? '14px 16px' : '18px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'inherit' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <s.icon size={21} color={c.pri} strokeWidth={1.8} />
        </span>
        {s.pop && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, color: c.secDk, background: `${c.sec}22`, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.3 }}>
            <Star size={9} /> POPULAR
          </span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14.5, fontWeight: 600, color: c.txt, lineHeight: 1.35 }}>{s.n}</p>
        <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 5, lineHeight: 1.45 }}>{deptBySlug.get(s.id) ?? 'Government of Tamil Nadu'}</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 11, borderTop: `1px solid ${c.bdr}` }}>
        <span className="vtn-num" style={{ fontSize: 11.5, color: c.txt2, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{s.time}</span>
        <span className="vtn-num" style={{ fontSize: 11.5, color: c.txt2, display: 'flex', alignItems: 'center', gap: 4 }}><IndianRupee size={12} />{s.fee}</span>
      </div>
    </button>
  )

  return (
    <>
      <PageHeader
        title="Government Services"
        subtitle="Apply online for certificates, licences, land records and welfare services delivered by Government of Tamil Nadu departments."
        actions={<DeskBtn onClick={() => onNav('tracker')} icon={ArrowRight}>Track an application</DeskBtn>}
      />

      {/* Featured */}
      {featured.length > 0 && q === '' && cat === 'all' && dept === 'all' && (
        <section style={{ marginBottom: 32 }}>
          <h2 className="vtn-h2" style={{ color: c.txt, marginBottom: 14 }}>Most requested</h2>
          <div className="vtn-grid vtn-grid-4">{featured.map((s) => <ServiceCard key={s.id} s={s} />)}</div>
        </section>
      )}

      {/* Recently used */}
      {recent.length > 0 && q === '' && cat === 'all' && dept === 'all' && (
        <section style={{ marginBottom: 32 }}>
          <h2 className="vtn-h2" style={{ color: c.txt, marginBottom: 14 }}>Recently used</h2>
          <div className="vtn-grid vtn-grid-4">{recent.map((s) => <ServiceCard key={s.id} s={s} compact />)}</div>
        </section>
      )}

      {/* Full catalogue */}
      <section>
        <h2 className="vtn-h2" style={{ color: c.txt, marginBottom: 14 }}>All services</h2>

        <Toolbar query={q} onQuery={setQ} placeholder="Search by service or department…">
          <FilterChips options={catOptions} value={cat} onChange={setCat} />
        </Toolbar>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 20 }}>
          <div className="vtn-grid" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
            <Panel title="Departments" padded={false}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16 }}>
                <button onClick={() => setDept('all')} style={deptChip(dept === 'all', c)}>
                  <Building2 size={13} /> All departments <span className="vtn-num">· {all.length}</span>
                </button>
                {departments.map(([name, count]) => (
                  <button key={name} onClick={() => setDept(name)} style={deptChip(dept === name, c)} title={name}>
                    {name.length > 42 ? `${name.slice(0, 40)}…` : name} <span className="vtn-num">· {count}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {filtered.length === 0 ? (
            <div className="vtn-card">
              <EmptyState
                title="No services match your filters"
                desc="Try a different department or category, or clear the search to browse the full catalogue."
                action={<DeskBtn variant="primary" onClick={() => { setQ(''); setCat('all'); setDept('all') }}>Clear filters</DeskBtn>}
              />
            </div>
          ) : (
            <>
              <p className="vtn-num" style={{ fontSize: 12.5, color: c.txt2 }}>{filtered.length} service{filtered.length > 1 ? 's' : ''}</p>
              <div className="vtn-grid vtn-grid-3">{filtered.map((s) => <ServiceCard key={s.id} s={s} />)}</div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

const deptChip = (active: boolean, c: ReturnType<typeof useC>): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 9999,
  border: `1px solid ${active ? c.pri : c.bdr}`, background: active ? c.pri : c.bg,
  color: active ? '#fff' : c.txt2, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
})

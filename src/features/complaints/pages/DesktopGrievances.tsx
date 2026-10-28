import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, MapPin, Building2, Hash, CalendarDays, AlertTriangle, Paperclip, Plus } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { PageHeader, Toolbar, FilterChips, Panel, StatusChip, EmptyState, LoadingRows, DeskBtn } from '@/app/desktop/DesktopUI'
import { useComplaintsQuery } from '@/features/complaints/hooks/useComplaints'
import { FileGrievancePanel } from '@/features/complaints/pages/FileGrievancePanel'

const STEPS = ['submitted', 'assigned', 'inProgress', 'resolved'] as const
const STEP_LABEL: Record<string, string> = { submitted: 'Submitted', assigned: 'Assigned to department', inProgress: 'Work in progress', resolved: 'Resolved' }

/** Citizen-facing wording for the API's status keys (never show the raw enum). */
const STATUS_TEXT: Record<string, string> = { submitted: 'Submitted', assigned: 'Assigned', inProgress: 'In Progress', resolved: 'Resolved', closed: 'Closed', escalated: 'Escalated' }
const statusLabel = (s: string) => STATUS_TEXT[s] ?? s
const statusTone = (s: string) => (s === 'resolved' || s === 'closed' ? 'ok' : s === 'escalated' ? 'err' : 'warn')
const priorityTone = (p: string) => (p === 'High' || p === 'Urgent' ? 'err' : p === 'Medium' ? 'warn' : 'info')
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/**
 * Desktop grievance management: the citizen's complaint register with a
 * resolution timeline, routed department, priority and location panel.
 * Reuses `useComplaintsQuery()` — no separate data path.
 */
export default function DesktopGrievances() {
  const c = useC()
  const { data, isLoading } = useComplaintsQuery()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filing, setFiling] = useState(false)

  const items = useMemo(() => data ?? [], [data])

  const counts = useMemo(() => ({
    all: items.length,
    open: items.filter((x) => !['resolved', 'closed'].includes(String(x.status))).length,
    resolved: items.filter((x) => ['resolved', 'closed'].includes(String(x.status))).length,
  }), [items])

  const rows = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return items.filter((x) => {
      if (status === 'open' && ['resolved', 'closed'].includes(String(x.status))) return false
      if (status === 'resolved' && !['resolved', 'closed'].includes(String(x.status))) return false
      if (!needle) return true
      return x.category.toLowerCase().includes(needle) || x.referenceNo.toLowerCase().includes(needle) || x.description.toLowerCase().includes(needle)
    })
  }, [items, q, status])

  // Derived selection — falls back to the first visible row when filters change.
  const sel = rows.find((r) => r.id === selectedId) ?? rows[0]
  const stepIdx = sel ? STEPS.indexOf(String(sel.status) as (typeof STEPS)[number]) : -1

  return (
    <>
      <PageHeader
        title="Grievances"
        subtitle="Report civic issues to the responsible department and follow their resolution against published service timelines."
        actions={<DeskBtn variant="primary" icon={Plus} onClick={() => setFiling(true)}>File a grievance</DeskBtn>}
      />

      <Toolbar query={q} onQuery={setQ} placeholder="Search by category, reference or description…">
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'open', label: 'Open', count: counts.open },
            { id: 'resolved', label: 'Resolved', count: counts.resolved },
          ]}
        />
      </Toolbar>

      {filing && <FileGrievancePanel onClose={() => setFiling(false)} />}

      {isLoading ? (
        <div className="vtn-card"><LoadingRows rows={4} /></div>
      ) : items.length === 0 ? (
        <div className="vtn-card">
          <EmptyState
            title="No grievances filed"
            desc="Report road damage, water supply, streetlight, drainage or sanitation issues. Each report is routed to the responsible department with a tracking number."
            action={<DeskBtn variant="primary" onClick={() => setFiling(true)}>File your first grievance</DeskBtn>}
          />
        </div>
      ) : (
        <div className="vtn-split">
          <Panel padded={false}>
            <div className="vtn-scroll-x">
              <table className="vtn-table">
                <thead>
                  <tr><th>Category</th><th>Reference</th><th>Department</th><th>Priority</th><th>Filed</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((x) => (
                    <tr key={x.id} aria-selected={x.id === sel?.id} onClick={() => setSelectedId(x.id)} tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(x.id) } }}>
                      <td style={{ fontWeight: 600 }}>{x.category}</td>
                      <td className="vtn-num" style={{ color: c.txt2, whiteSpace: 'nowrap' }}>{x.referenceNo}</td>
                      <td style={{ color: c.txt2 }}>{x.department ?? '—'}</td>
                      <td><StatusChip label={String(x.priority)} tone={priorityTone(String(x.priority))} /></td>
                      <td className="vtn-num" style={{ color: c.txt2, whiteSpace: 'nowrap' }}>{fmtDate(x.createdAt)}</td>
                      <td><StatusChip label={statusLabel(String(x.status))} tone={statusTone(String(x.status))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <EmptyState title="No grievances match your filters" desc="Clear the search or switch the status filter to see your full grievance history." />}
          </Panel>

          {sel && (
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Panel title="Grievance detail">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 11, background: `${c.warn}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={19} color={c.warn} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: c.txt }}>{sel.category}</p>
                    <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 4, lineHeight: 1.55 }}>{sel.description}</p>
                  </div>
                </div>

                <dl style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {[
                    { icon: Hash, k: 'Reference', v: sel.referenceNo, mono: true },
                    { icon: Building2, k: 'Routed to', v: sel.department ?? 'Awaiting routing' },
                    { icon: CalendarDays, k: 'Filed on', v: fmtDate(sel.createdAt), mono: true },
                    { icon: Paperclip, k: 'Attachments', v: `${sel.attachmentIds?.length ?? 0} ${sel.attachmentIds?.length === 1 ? 'file' : 'files'}`, mono: true },
                  ].map((r) => (
                    <div key={r.k} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                      <r.icon size={15} color={c.txt3} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <dt style={{ fontSize: 11, color: c.txt3 }}>{r.k}</dt>
                        <dd className={r.mono ? 'vtn-num' : undefined} style={{ fontSize: 13, color: c.txt, marginTop: 2, fontWeight: 500 }}>{r.v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>

                {sel.etaDays != null && (
                  <p style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${c.bdr}`, fontSize: 12, color: c.txt2 }}>
                    Expected resolution within <span className="vtn-num" style={{ fontWeight: 700, color: c.warn }}>{sel.etaDays} days</span> of filing.
                  </p>
                )}
              </Panel>

              <Panel title="Resolution timeline">
                <ol style={{ listStyle: 'none' }}>
                  {STEPS.map((s, i) => {
                    const done = stepIdx >= 0 && i <= stepIdx
                    const current = i === stepIdx
                    const col = done ? (current ? c.pri : c.ok) : c.bdr
                    return (
                      <li key={s} style={{ display: 'flex', gap: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {done && !current ? <CheckCircle2 size={17} color={col} /> : <Circle size={17} color={col} strokeWidth={current ? 2.6 : 1.6} />}
                          {i < STEPS.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 20, background: done ? c.ok : c.bdr }} />}
                        </div>
                        <p style={{ paddingBottom: i < STEPS.length - 1 ? 16 : 0, fontSize: 13, fontWeight: current ? 700 : 500, color: current ? c.pri : done ? c.txt : c.txt3 }}>{STEP_LABEL[s]}</p>
                      </li>
                    )
                  })}
                </ol>
              </Panel>

              <Panel title="Location">
                {sel.location?.ward || sel.location?.area ? (
                  <>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: c.txt, fontWeight: 500 }}>
                      <MapPin size={15} color={c.pri} />{[sel.location?.area, sel.location?.ward].filter(Boolean).join(' · ')}
                    </p>
                    {sel.location?.lat != null && sel.location?.lng != null && (
                      <p className="vtn-num" style={{ fontSize: 11.5, color: c.txt3, marginTop: 6 }}>
                        {sel.location.lat.toFixed(5)}, {sel.location.lng.toFixed(5)}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: c.txt2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={15} color={c.txt3} />No location was attached to this grievance.
                  </p>
                )}
              </Panel>
            </div>
          )}
        </div>
      )}
    </>
  )
}

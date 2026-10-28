import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, UserCheck, Building2, Hash, CalendarDays, ArrowRight, FileText } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { PageHeader, Toolbar, FilterChips, Panel, StatusChip, EmptyState, LoadingRows, DeskBtn } from '@/app/desktop/DesktopUI'
import { useApplicationsQuery } from '@/features/applications/hooks/useApplications'
import type { ApplicationDTO } from '@/features/applications/api/applicationsApi'
import { presentTimeline } from '@/features/applications/timeline'
import { StepRail } from '@/components/feedback/StepRail'
import { BOARD_STATE, railOf } from '@/features/home/useHomeBoard'

const toneFor = (status: string) =>
  status === 'Completed' ? 'ok' : status === 'Rejected' ? 'err' : status === 'Escalated' ? 'err' : 'warn'

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/**
 * Desktop application workspace: a sortable, filterable register of every
 * application on the left and a full Right-to-Service timeline panel on the
 * right. Same `useApplicationsQuery()` as the mobile tracker.
 */
export default function DesktopApplications() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { data, isLoading } = useApplicationsQuery()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<'recent' | 'name'>('recent')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const apps = useMemo(() => data ?? [], [data])

  const counts = useMemo(() => ({
    all: apps.length,
    active: apps.filter((a) => !['Completed', 'Rejected'].includes(a.status)).length,
    completed: apps.filter((a) => a.status === 'Completed').length,
    rejected: apps.filter((a) => a.status === 'Rejected').length,
  }), [apps])

  const rows = useMemo(() => {
    const needle = q.toLowerCase().trim()
    const out = apps.filter((a) => {
      if (status === 'active' && ['Completed', 'Rejected'].includes(a.status)) return false
      if (status === 'completed' && a.status !== 'Completed') return false
      if (status === 'rejected' && a.status !== 'Rejected') return false
      if (!needle) return true
      return a.serviceName.toLowerCase().includes(needle) || a.referenceNo.toLowerCase().includes(needle)
    })
    return [...out].sort((a, b) =>
      sort === 'name' ? a.serviceName.localeCompare(b.serviceName) : (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    )
  }, [apps, q, status, sort])

  // Selection is derived, not stored in an effect: if the current pick is
  // filtered out, the first visible row becomes the detail automatically.
  const selected: ApplicationDTO | undefined = rows.find((r) => r.id === selectedId) ?? rows[0]

  return (
    <>
      <PageHeader
        title="My Applications"
        subtitle="Every application you have filed, with its statutory Right to Service timeline and the officer responsible."
        actions={<DeskBtn variant="primary" icon={FileText} onClick={() => onNav('services')}>Apply for a service</DeskBtn>}
      />

      <Toolbar query={q} onQuery={setQ} placeholder="Search by service or reference number…">
        <FilterChips
          value={status}
          onChange={setStatus}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'active', label: 'In progress', count: counts.active },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'rejected', label: 'Rejected', count: counts.rejected },
          ]}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'recent' | 'name')}
          aria-label="Sort applications"
          style={{ padding: '10px 14px', borderRadius: 23, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="recent">Newest first</option>
          <option value="name">Service A–Z</option>
        </select>
      </Toolbar>

      {isLoading ? (
        <div className="vtn-card"><LoadingRows rows={5} /></div>
      ) : apps.length === 0 ? (
        <div className="vtn-card">
          <EmptyState
            title="You have not applied for anything yet"
            desc="Once you apply for a government service it will appear here with its full progress timeline and assigned officer."
            action={<DeskBtn variant="primary" onClick={() => onNav('services')}>Browse services</DeskBtn>}
          />
        </div>
      ) : (
        <div className="vtn-split">
          {/* Register */}
          <Panel padded={false}>
            <div className="vtn-scroll-x">
              <table className="vtn-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Reference</th>
                    <th>Department</th>
                    <th>Filed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} aria-selected={a.id === selected?.id} onClick={() => setSelectedId(a.id)} tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(a.id) } }}>
                      <td style={{ fontWeight: 600 }}>{a.serviceName}</td>
                      <td className="vtn-num" style={{ color: c.txt2, whiteSpace: 'nowrap' }}>{a.referenceNo}</td>
                      <td style={{ color: c.txt2 }}>{a.department}</td>
                      <td className="vtn-num" style={{ color: c.txt2, whiteSpace: 'nowrap' }}>{fmtDate(a.createdAt)}</td>
                      <td>
                        <StatusChip label={a.status} tone={toneFor(a.status)} />
                        {(() => { const r = railOf(a); return <StepRail steps={r.steps} step={r.step} colour={BOARD_STATE[r.state].dot} complete={r.state === 'done'} track={c.bdr} style={{ width: 120, height: 4, gap: 2, marginTop: 7 }} /> })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <EmptyState title="No applications match your filters" desc="Adjust the status filter or clear the search to see your full application history." />
            )}
          </Panel>

          {/* Detail */}
          {selected && (
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Panel title="Application detail">
                <p style={{ fontSize: 16, fontWeight: 700, color: c.txt }}>{selected.serviceName}</p>
                <div style={{ marginTop: 6 }}><StatusChip label={selected.status} tone={toneFor(selected.status)} /></div>
                {(() => {
                  const r = railOf(selected)
                  const now = presentTimeline(selected).find((x) => x.status === 'current')?.label
                  return (
                    <div style={{ marginTop: 14 }}>
                      <StepRail steps={r.steps} step={r.step} colour={BOARD_STATE[r.state].dot} complete={r.state === 'done'} track={c.bdr} />
                      <p className="vtn-num" style={{ fontSize: 12, color: c.txt2, marginTop: 7 }}>{r.state === 'done' ? 'All steps complete' : `Step ${r.step} of ${r.steps}${now ? ` · ${now}` : ''}`}</p>
                    </div>
                  )
                })()}

                <dl style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {[
                    { icon: Hash, k: 'Reference', v: selected.referenceNo, mono: true },
                    { icon: Building2, k: 'Department', v: selected.department },
                    { icon: UserCheck, k: 'Officer', v: selected.officer ? `${selected.officer.name} · ${selected.officer.designation}` : 'Awaiting assignment' },
                    { icon: CalendarDays, k: 'Filed on', v: fmtDate(selected.createdAt), mono: true },
                  ].map((r) => (
                    <div key={r.k} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                      <r.icon size={15} color={c.txt3} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <dt style={{ fontSize: 11, color: c.txt3, letterSpacing: 0.3 }}>{r.k}</dt>
                        <dd className={r.mono ? 'vtn-num' : undefined} style={{ fontSize: 13, color: c.txt, marginTop: 2, fontWeight: 500 }}>{r.v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>

                {selected.slaDaysRemaining != null && (
                  <p style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${c.bdr}`, fontSize: 12, color: c.txt2 }}>
                    <span className="vtn-num" style={{ fontWeight: 700, color: c.warn }}>{selected.slaDaysRemaining} days</span> remaining under the Right to Service charter.
                  </p>
                )}
              </Panel>

              <Panel title="Progress timeline">
                <ol style={{ display: 'flex', flexDirection: 'column', gap: 0, listStyle: 'none' }}>
                  {presentTimeline(selected).map((t, i, arr) => {
                    const done = t.status === 'done'
                    const current = t.status === 'current'
                    const col = done ? c.ok : current ? c.pri : c.bdr
                    return (
                      <li key={t.id} style={{ display: 'flex', gap: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {done ? <CheckCircle2 size={17} color={col} /> : <Circle size={17} color={col} strokeWidth={current ? 2.6 : 1.6} />}
                          {i < arr.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 22, background: done ? c.ok : c.bdr }} />}
                        </div>
                        <div style={{ paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                          <p style={{ fontSize: 13, fontWeight: current ? 700 : 500, color: current ? c.pri : done ? c.txt : c.txt3 }}>{t.label}</p>
                          <p className="vtn-num" style={{ fontSize: 11.5, color: c.txt3, marginTop: 2 }}>{t.at ? fmtDate(t.at) : 'Pending'}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
                <DeskBtn onClick={() => onNav(`service/${selected.serviceId}`)} icon={ArrowRight}>
                  Open {selected.serviceName}
                </DeskBtn>
              </Panel>
            </div>
          )}
        </div>
      )}
    </>
  )
}

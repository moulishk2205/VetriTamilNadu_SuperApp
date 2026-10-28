import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, FileCheck, AlertTriangle, Sparkles, Milestone, Download } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { analyticsApi } from '@/features/analytics/api/analyticsApi'
import { PageHeader, Panel, FilterChips, EmptyState, LoadingRows, DeskBtn, StatusChip, Toast } from '@/app/desktop/DesktopUI'

const KIND = {
  certificate: { icon: BadgeCheck, label: 'Certificate', tone: 'ok' as const },
  application: { icon: FileCheck, label: 'Application', tone: 'warn' as const },
  complaint: { icon: AlertTriangle, label: 'Grievance', tone: 'err' as const },
  scheme: { icon: Sparkles, label: 'Scheme', tone: 'info' as const },
  milestone: { icon: Milestone, label: 'Milestone', tone: 'neutral' as const },
}
const kindOf = (k: string) => KIND[k as keyof typeof KIND] ?? KIND.milestone

/**
 * Digital Citizen Timeline — desktop.
 *
 * Every recorded interaction between the citizen and the state, grouped by year
 * in a two-column ledger. Same `analyticsApi.citizenTimeline()` as mobile.
 */
export default function DesktopTimeline() {
  const c = useC()
  const { citizen } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['citizen', 'timeline'], queryFn: analyticsApi.citizenTimeline })
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')

  const items = useMemo(() => [...(data?.items ?? [])].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')), [data])

  const counts = useMemo(() => {
    const by = (k: string) => items.filter((i) => i.kind === k).length
    return { all: items.length, certificate: by('certificate'), application: by('application'), complaint: by('complaint'), milestone: by('milestone') }
  }, [items])

  const rows = useMemo(() => (filter === 'all' ? items : items.filter((i) => i.kind === filter)), [items, filter])

  const byYear = useMemo(() => {
    const m = new Map<string, typeof rows>()
    for (const r of rows) {
      const y = r.year || (r.at ?? '').slice(0, 4) || '—'
      m.set(y, [...(m.get(y) ?? []), r])
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [rows])

  const exportTimeline = () => {
    const lines = [
      'GOVERNMENT OF TAMIL NADU — VETRI',
      'DIGITAL CITIZEN TIMELINE', '',
      `Citizen : ${citizen?.fullName ?? '—'}`,
      `ID      : ${citizen?.citizenId ?? '—'}`,
      `Exported: ${new Date().toLocaleString('en-IN')}`, '',
      ...items.map((i) => `${i.year}  ${kindOf(i.kind).label.padEnd(12)}  ${i.title} — ${i.subtitle}`),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'vetri-citizen-timeline.txt'; a.click()
    URL.revokeObjectURL(url)
    setToast('Timeline exported')
  }

  return (
    <>
      <PageHeader
        title="Digital Citizen Timeline"
        subtitle={`Every recorded interaction between ${citizen?.fullName ?? 'the citizen'} and the Government of Tamil Nadu, newest first.`}
        actions={items.length > 0 ? <DeskBtn icon={Download} onClick={exportTimeline}>Export timeline</DeskBtn> : undefined}
      />

      <div style={{ marginBottom: 20 }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'certificate', label: 'Certificates', count: counts.certificate },
            { id: 'application', label: 'Applications', count: counts.application },
            { id: 'complaint', label: 'Grievances', count: counts.complaint },
            { id: 'milestone', label: 'Milestones', count: counts.milestone },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="vtn-card"><LoadingRows rows={6} /></div>
      ) : rows.length === 0 ? (
        <div className="vtn-card">
          <EmptyState title="Nothing recorded yet" desc="Certificates you receive, applications you file and grievances you raise are recorded here as a permanent civic record." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {byYear.map(([year, entries]) => (
            <Panel key={year} title={year} action={<span className="vtn-num" style={{ fontSize: 12, color: c.txt2 }}>{entries.length} event{entries.length > 1 ? 's' : ''}</span>} padded={false}>
              {entries.map((e, i) => {
                const k = kindOf(e.kind)
                return (
                  <div key={`${e.title}-${i}`} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '15px 20px', borderBottom: i < entries.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <k.icon size={17} color={c.pri} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9 }}>
                        <p style={{ fontSize: 14.5, fontWeight: 600, color: c.txt }}>{e.title}</p>
                        <StatusChip label={k.label} tone={k.tone} />
                      </div>
                      <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 4 }}>{e.subtitle}</p>
                    </div>
                    <span className="vtn-num" style={{ fontSize: 12, color: c.txt3, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {e.at ? new Date(e.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : e.year}
                    </span>
                  </div>
                )
              })}
            </Panel>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  )
}

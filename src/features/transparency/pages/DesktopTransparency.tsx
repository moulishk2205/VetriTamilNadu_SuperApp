import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Users, Building2, Gauge } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { BANNER_YELLOW } from '@/styles/theme'
import { analyticsApi } from '@/features/analytics/api/analyticsApi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PageHeader, Panel, LoadingRows, StatusChip } from '@/app/desktop/DesktopUI'
import { PUBLISHED_DEPARTMENT, PUBLISHED_CONSTITUENCY } from '@/features/transparency/publishedFigures'

/** Horizontal bar row — no chart library, scales to the largest value. */
function Bar({ label, value, max, suffix = '', color }: { label: string; value: number; max: number; suffix?: string; color: string }) {
  const c = useC()
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: c.txt2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span className="vtn-num" style={{ fontSize: 12.5, fontWeight: 700, color: c.txt, flexShrink: 0 }}>{value.toLocaleString('en-IN')}{suffix}</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: c.bdr, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

/** Metric tile with tabular figures. */
function Metric({ icon: Icon, label, value, tone }: { icon: typeof Clock; label: string; value: string | number; tone: string }) {
  const c = useC()
  return (
    <div className="vtn-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: `${tone}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={tone} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="vtn-num" style={{ display: 'block', fontSize: 22, fontWeight: 800, color: c.txt, lineHeight: 1.1 }}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: c.txt2, marginTop: 3 }}>{label}</span>
      </span>
    </div>
  )
}

/**
 * Government transparency — desktop.
 *
 * `view="district"` renders departmental delivery performance; `view="mla"`
 * renders constituency-level outcomes. Both read the existing analytics API, so
 * the figures are the same ones the mobile screens show.
 */
export default function DesktopTransparency({ view = 'district' }: { view?: 'district' | 'mla' }) {
  const c = useC()
  const isMla = view === 'mla'
  const canReadLive = useAuth().hasPermission('analytics:read')

  const dept = useQuery({ queryKey: ['analytics', 'department'], queryFn: analyticsApi.department, enabled: !isMla && canReadLive, retry: false })
  const cons = useQuery({ queryKey: ['analytics', 'constituency'], queryFn: analyticsApi.constituency, enabled: isMla && canReadLive, retry: false })
  const loading = isMla ? cons.isLoading : dept.isLoading

  // The analytics endpoints are authorised for officer/department/MLA/admin
  // roles. These are citizen-facing transparency pages, so when the signed-in
  // citizen cannot read the live endpoint we present the same published
  // aggregates the service would return. Officer/MLA personas get live figures.
  const consData = cons.data ?? PUBLISHED_CONSTITUENCY
  const deptData = dept.data ?? PUBLISHED_DEPARTMENT
  const isPublished = isMla ? !cons.data : !dept.data

  if (loading) {
    return (
      <>
        <PageHeader title={isMla ? 'MLA Dashboard' : 'District Scorecard'} subtitle="Loading published performance data…" />
        <div className="vtn-card"><LoadingRows rows={6} /></div>
      </>
    )
  }

  // ── Constituency (MLA) view ───────────────────────────────────────────
  if (isMla) {
    const d = consData
    const maxSvc = Math.max(...d.topServices.map((x) => x.value), 1)
    const maxCmp = Math.max(...d.topComplaints.map((x) => x.value), 1)
    const maxWard = Math.max(...d.wardComparison.map((x) => x.value), 1)
    const maxTrend = Math.max(...d.monthlyTrend.map((x) => x.value), 1)

    return (
      <>
        <PageHeader
          title={`${d.constituency} Constituency`}
          subtitle={`${d.mla} · ${d.district} district. Service delivery and welfare outcomes, published for public scrutiny.${isPublished ? ' Showing the published constituency dataset.' : ''}`}
        />

        <div className="vtn-grid vtn-grid-4" style={{ marginBottom: 24 }}>
          <Metric icon={TrendingUp} label="Applications submitted" value={d.stats.submitted} tone={c.pri} />
          <Metric icon={CheckCircle2} label="Completed" value={d.stats.completed} tone={c.ok} />
          <Metric icon={Clock} label="Pending" value={d.stats.pending} tone={c.warn} />
          <Metric icon={Gauge} label="Avg resolution (days)" value={d.stats.avgResolutionDays} tone={c.info} />
        </div>

        <div className="vtn-split" style={{ marginBottom: 20 }}>
          <Panel title="Monthly applications">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180, paddingTop: 8 }}>
              {d.monthlyTrend.map((m, i) => (
                <div key={m.label} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
                  <span className="vtn-num" style={{ fontSize: 11, color: c.txt2 }}>{m.value.toLocaleString('en-IN')}</span>
                  <div style={{ width: '100%', height: `calc((100% - 44px) * ${m.value / maxTrend})`, background: i === d.monthlyTrend.length - 1 ? c.pri : BANNER_YELLOW, borderRadius: '8px 8px 0 0', minHeight: 4 }} />
                  <span style={{ fontSize: 11.5, color: c.txt3 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Citizen satisfaction">
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p className="vtn-num" style={{ fontSize: 46, fontWeight: 800, color: d.stats.satisfaction == null ? c.txt3 : c.ok, lineHeight: 1 }}>{d.stats.satisfaction ?? '—'}</p>
              <p style={{ fontSize: 13, color: c.txt2, marginTop: 6 }}>{d.stats.satisfaction == null ? 'Not collected yet: ratings open with the feedback module' : 'out of 5 · citizen-rated'}</p>
              {d.stats.schemeUtilisation != null && <div style={{ marginTop: 14 }}><StatusChip label={`Scheme utilisation ${d.stats.schemeUtilisation}%`} tone="info" /></div>}
            </div>
          </Panel>
        </div>

        <div className="vtn-split" style={{ marginBottom: 20 }}>
          <Panel title="Most requested services">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {d.topServices.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={maxSvc} color={c.pri} />)}
            </div>
          </Panel>
          <Panel title="Most reported grievances">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {d.topComplaints.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={maxCmp} color={c.warn} />)}
            </div>
          </Panel>
        </div>

        <div className="vtn-split">
          <Panel title="Taluk comparison">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {d.wardComparison.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={maxWard} color={c.info} />)}
            </div>
          </Panel>
          <Panel title="Department performance" padded={false}>
            {d.departmentPerformance.map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                <Building2 size={15} color={c.txt3} />
                <span style={{ flex: 1, fontSize: 13, color: c.txt }}>{s.label}</span>
                <StatusChip label={`${s.value}${s.suffix ?? '%'}`} tone={s.value >= 90 ? 'ok' : s.value >= 80 ? 'warn' : 'err'} />
              </div>
            ))}
          </Panel>
        </div>

        <Panel title="Beneficiary demographics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {d.demographics.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={Math.max(...d.demographics.map((x) => x.value), 1)} color={c.sec} />)}
          </div>
        </Panel>
      </>
    )
  }

  // ── Departmental (district) view ──────────────────────────────────────
  {
    const d = deptData
    const maxDemand = Math.max(...d.serviceDemand.map((x) => x.value), 1)
    const maxDistrict = Math.max(...d.districtComparison.map((x) => x.value), 1)
    const maxTrend = Math.max(...d.monthlyTrend.map((x) => x.value), 1)

    return (
      <>
        <PageHeader
          title="District Scorecard"
          subtitle={`${d.department}. Delivery performance against Right to Service timelines, published for public scrutiny.${isPublished ? ' Showing the published departmental dataset.' : ''}`}
        />

        <div className="vtn-grid vtn-grid-4" style={{ marginBottom: 24 }}>
          <Metric icon={TrendingUp} label="Applications this month" value={d.month} tone={c.pri} />
          <Metric icon={CheckCircle2} label="Approved" value={d.approved} tone={c.ok} />
          <Metric icon={Clock} label="Pending" value={d.pending} tone={c.warn} />
          <Metric icon={AlertTriangle} label="Overdue" value={d.overdue} tone={c.err} />
        </div>

        <div className="vtn-split" style={{ marginBottom: 20 }}>
          <Panel title="Monthly throughput">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180, paddingTop: 8 }}>
              {d.monthlyTrend.map((m, i) => (
                <div key={m.label} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
                  <span className="vtn-num" style={{ fontSize: 11, color: c.txt2 }}>{m.value.toLocaleString('en-IN')}</span>
                  <div style={{ width: '100%', height: `calc((100% - 44px) * ${m.value / maxTrend})`, background: i === d.monthlyTrend.length - 1 ? c.pri : BANNER_YELLOW, borderRadius: '8px 8px 0 0', minHeight: 4 }} />
                  <span style={{ fontSize: 11.5, color: c.txt3 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Service level">
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <p className="vtn-num" style={{ fontSize: 40, fontWeight: 800, color: c.info, lineHeight: 1 }}>{d.avgSlaDays}</p>
                <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 5 }}>average days to decision</p>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <StatusChip label={`${d.escalations} escalations`} tone="warn" />
                <StatusChip label={`${d.rejected} rejected`} tone="err" />
              </div>
            </div>
          </Panel>
        </div>

        <div className="vtn-split" style={{ marginBottom: 20 }}>
          <Panel title="Service demand">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {d.serviceDemand.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={maxDemand} color={c.pri} />)}
            </div>
          </Panel>
          <Panel title="District comparison">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {d.districtComparison.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={maxDistrict} color={c.info} />)}
            </div>
          </Panel>
        </div>

        <Panel title="Officer performance" padded={false}>
          <div className="vtn-scroll-x">
            <table className="vtn-table">
              <thead><tr><th>Officer</th><th>Designation</th><th>Completed</th><th>SLA compliance</th></tr></thead>
              <tbody>
                {[...d.topOfficers, ...d.slowestOfficers].map((o) => (
                  <tr key={o.name} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: 600 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Users size={14} color={c.txt3} />{o.name}</span></td>
                    <td style={{ color: c.txt2 }}>{o.designation}</td>
                    <td className="vtn-num">{o.completed}</td>
                    <td><StatusChip label={`${o.sla}%`} tone={o.sla >= 90 ? 'ok' : o.sla >= 80 ? 'warn' : 'err'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    )
  }
}

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Building2, LogOut } from 'lucide-react'
import { StatusBar, Card, Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { analyticsApi } from '@/features/analytics/api/analyticsApi'
import { StatTile, BarChart, LineChart, HBars } from '@/components/charts'

/** Department Dashboard — live operational picture for a department head. */
export default function DepartmentDashboard() {
  const c = useC()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data } = useQuery({ queryKey: ['analytics', 'department'], queryFn: analyticsApi.department })

  const sec = (t: string) => (
    <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>{t}</p>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ padding: '0 20px 16px' }}>
        <StatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: c.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: c.txt }}>{data?.department ?? 'Department'}</p>
            <p style={{ fontSize: 12.5, color: c.txt, opacity: 0.8 }}>Operational dashboard · Chennai District</p>
          </div>
          <button onClick={() => { void logout().then(() => navigate('/demo')) }} title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <LogOut size={18} color={c.txt} />
          </button>
          <Seal size={34} />
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <StatTile label="Today" value={data?.today ?? '—'} />
          <StatTile label="This Month" value={data?.month ?? '—'} />
          <StatTile label="Pending" value={data?.pending ?? '—'} color={c.warn} />
          <StatTile label="Approved" value={data?.approved ?? '—'} color={c.ok} />
          <StatTile label="Rejected" value={data?.rejected ?? '—'} color={c.err} />
          <StatTile label="Avg SLA" value={data ? `${data.avgSlaDays}d` : '—'} />
          <StatTile label="Overdue" value={data?.overdue ?? '—'} color={c.err} />
          <StatTile label="Escalations" value={data?.escalations ?? '—'} color={c.warn} />
          <StatTile label="On-time" value="96%" color={c.ok} />
        </div>

        {sec('Monthly Trend')}
        <Card>{data && <LineChart data={data.monthlyTrend} />}</Card>

        {sec('Most Requested Services')}
        <Card>{data && <BarChart data={data.serviceDemand} color={c.sec} />}</Card>

        {sec('District Comparison')}
        <Card>{data && <HBars data={data.districtComparison} />}</Card>

        {sec('Top Officers')}
        <Card style={{ padding: 0 }}>
          {(data?.topOfficers ?? []).map((o, i, arr) => (
            <div key={o.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${c.ok}12`, color: c.ok, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>{o.name}</p>
                <p style={{ fontSize: 11, color: c.txt2 }}>{o.designation}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{o.completed}</p>
                <p style={{ fontSize: 10, color: c.ok }}>SLA {o.sla}%</p>
              </div>
            </div>
          ))}
        </Card>

        {sec('Needs Attention')}
        <Card style={{ padding: 0 }}>
          {(data?.slowestOfficers ?? []).map((o) => (
            <div key={o.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>{o.name}</p>
                <p style={{ fontSize: 11, color: c.txt2 }}>{o.designation}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{o.completed}</p>
                <p style={{ fontSize: 10, color: c.err }}>SLA {o.sla}%</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

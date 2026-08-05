import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Landmark, LogOut, Printer, Play, Pause, Star } from 'lucide-react'
import { StatusBar, Card, Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { analyticsApi } from '@/features/analytics/api/analyticsApi'
import { StatTile, BarChart, LineChart, HBars, Donut, HeatGrid } from '@/components/charts'

/**
 * MLA Dashboard — the constituency command view. Live stats from the analytics
 * backend, chart-kit visualisations, ward heat map, a presentation mode that
 * auto-advances through sections, and print/PDF export via the browser.
 */

const SECTIONS = ['Overview', 'Trends', 'Services', 'People', 'Wards'] as const

export default function MlaPortal() {
  const c = useC()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data } = useQuery({ queryKey: ['analytics', 'constituency'], queryFn: analyticsApi.constituency })
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('Overview')
  const [presenting, setPresenting] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (presenting) {
      timer.current = setInterval(() => {
        setSection((cur) => SECTIONS[(SECTIONS.indexOf(cur) + 1) % SECTIONS.length])
      }, 5000)
    }
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [presenting])

  const sec = (t: string) => (
    <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '16px 0 10px' }}>{t}</p>
  )

  return (
    <div style={{ minHeight: '100vh', background: c.bgAlt, paddingBottom: 40 }}>
      <div style={{ background: `linear-gradient(135deg,${c.acc},${c.priDk})`, padding: '0 20px 22px', borderRadius: '0 0 28px 28px' }}>
        <StatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{data?.constituency ?? '—'} Constituency</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{data?.district} District · Assembly segment</p>
          </div>
          <button onClick={() => window.print()} title="Export PDF" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <Printer size={18} color="rgba(255,255,255,0.85)" />
          </button>
          <button onClick={() => setPresenting((p) => !p)} title="Presentation mode" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            {presenting ? <Pause size={18} color="#fff" /> : <Play size={18} color="rgba(255,255,255,0.85)" />}
          </button>
          <button onClick={() => { void logout().then(() => navigate('/demo')) }} title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <LogOut size={18} color="rgba(255,255,255,0.8)" />
          </button>
          <Seal size={34} />
        </div>
      </div>

      {/* Section chips (interactive filters; auto-advance in presentation mode) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 20px 0' }}>
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)} style={{ padding: '8px 16px', borderRadius: 9999, border: 'none', background: section === s ? c.pri : c.card, color: section === s ? '#fff' : c.txt, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}>{s}</button>
        ))}
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        {section === 'Overview' && data && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <StatTile label="Submitted" value={data.stats.submitted.toLocaleString('en-IN')} />
              <StatTile label="Completed" value={data.stats.completed.toLocaleString('en-IN')} color={c.ok} />
              <StatTile label="Pending" value={data.stats.pending} color={c.warn} />
              <StatTile label="Avg Resolution" value={`${data.stats.avgResolutionDays}d`} />
              <StatTile label="Satisfaction" value={`${data.stats.satisfaction}/5`} color={c.sec} />
              <StatTile label="Scheme Uptake" value={`${data.stats.schemeUtilisation}%`} color={c.info} />
            </div>
            {sec('Department Performance')}
            <Card><HBars data={data.departmentPerformance} color={c.ok} /></Card>
          </div>
        )}

        {section === 'Trends' && data && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Applications — Monthly Trend')}
            <Card><LineChart data={data.monthlyTrend} /></Card>
            {sec('Top Complaints')}
            <Card><BarChart data={data.topComplaints} color={c.err} /></Card>
          </div>
        )}

        {section === 'Services' && data && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Most Requested Services')}
            <Card><BarChart data={data.topServices} color={c.sec} /></Card>
            {sec('Service Demand by Ward (heat map)')}
            <Card><HeatGrid rows={data.heat.rows} cols={data.heat.cols} cells={data.heat.cells} /></Card>
          </div>
        )}

        {section === 'People' && data && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Who is being served')}
            <Card>
              <Donut data={[
                { label: 'Women', value: data.demographics[0].value, color: c.pri },
                { label: 'Youth / Students', value: data.demographics[1].value, color: c.sec },
                { label: 'Senior citizens', value: data.demographics[2].value, color: c.info },
                { label: 'Farmers', value: data.demographics[3].value, color: c.ok },
                { label: 'Disabled', value: data.demographics[4].value, color: c.warn },
              ]} />
            </Card>
            {sec('Beneficiary Groups')}
            <Card><HBars data={data.demographics} color={c.info} /></Card>
          </div>
        )}

        {section === 'Wards' && data && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Ward Comparison — applications served')}
            <Card><HBars data={data.wardComparison} /></Card>
            <Card style={{ marginTop: 10, background: `${c.sec}08`, border: `1px solid ${c.sec}20` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Star size={14} color={c.secDk} />
                <p style={{ fontSize: 12, color: c.txt2 }}>Ward 126 (Mylapore) leads service uptake this quarter.</p>
              </div>
            </Card>
          </div>
        )}

        <p style={{ fontSize: 10, color: c.txt3, textAlign: 'center', marginTop: 16 }}>
          {presenting ? 'Presentation mode — auto-advancing every 5s' : 'Tap sections to explore · ▶ for presentation mode · print icon exports PDF'}
        </p>
      </div>
    </div>
  )
}

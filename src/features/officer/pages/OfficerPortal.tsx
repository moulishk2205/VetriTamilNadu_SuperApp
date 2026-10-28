import { useNavigate } from 'react-router-dom'
import { Shield, Timer, AlertTriangle, TrendingUp, Star, CheckCircle, ChevronRight, LogOut, FileText } from 'lucide-react'
import { StatusBar, Card, Seal } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOfficerQueue, useOfficerStats } from '../hooks/useOfficer'
import { OfficerGrievances } from '../components/OfficerGrievances'

/**
 * Officer Portal — the operating workspace for a government officer. Scoped to
 * the signed-in officer's jurisdiction; every card links into the review
 * workspace where real Workflow Engine actions are taken.
 */
export default function OfficerPortal() {
  const c = useC()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data: queue } = useOfficerQueue()
  const { data: stats } = useOfficerStats()

  const tiles = [
    { l: 'Pending', v: stats?.pending ?? '—', icon: Timer, cl: c.warn },
    { l: 'Due Today', v: stats?.dueToday ?? '—', icon: AlertTriangle, cl: c.err },
    { l: 'High Priority', v: stats?.highPriority ?? '—', icon: TrendingUp, cl: c.pri },
    { l: 'Escalated', v: stats?.escalated ?? '—', icon: AlertTriangle, cl: c.err },
    { l: 'Corrections', v: stats?.corrections ?? '—', icon: FileText, cl: c.info },
    { l: 'Done (month)', v: stats?.completedThisMonth ?? '—', icon: CheckCircle, cl: c.ok },
  ]
  const perf = [
    { l: 'Avg Processing', v: stats ? `${stats.avgProcessingDays}d` : '—' },
    { l: 'Approval Rate', v: stats ? `${stats.approvalRate}%` : '—' },
    { l: 'Citizen Rating', v: stats?.citizenRating != null ? `${stats.citizenRating}/5` : 'Not yet collected' },
    { l: 'SLA Compliance', v: stats ? `${stats.slaCompliance}%` : '—' },
    { l: 'Dept Rank', v: stats ? `#${stats.departmentRank}` : '—' },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ padding: '0 20px 16px' }}>
        <StatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: c.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: c.txt }}>{queue?.officer.name ?? 'Officer'}</p>
            <p style={{ fontSize: 12.5, color: c.txt, opacity: 0.8 }}>{queue?.officer.designation} · {queue?.officer.jurisdiction}</p>
          </div>
          <button onClick={() => { void logout().then(() => navigate('/demo')) }} title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <LogOut size={18} color={c.txt} />
          </button>
          <Seal size={34} />
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
          {tiles.map((t) => (
            <Card key={t.l} style={{ padding: '12px 10px' }}>
              <t.icon size={16} color={t.cl} />
              <p style={{ fontSize: 20, fontWeight: 800, color: c.txt, marginTop: 6 }}>{t.v}</p>
              <p style={{ fontSize: 10, color: c.txt2, marginTop: 2 }}>{t.l}</p>
            </Card>
          ))}
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Work Queue</p>
        {(queue?.items ?? []).map((a) => {
          const tone = a.status === 'Completed' ? c.ok : a.status === 'Rejected' || a.status === 'Escalated' ? c.err : c.warn
          return (
            <Card key={a.id} onClick={() => navigate(`/officer/app/${a.id}`)} style={{ marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.pri}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color={c.pri} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: c.txt }}>{a.serviceName}</p>
                  <p style={{ fontSize: 11, color: c.txt2, fontFamily: 'monospace' }}>{a.referenceNo}</p>
                  {a.slaDaysRemaining != null && (
                    <p style={{ fontSize: 10, color: a.slaDaysRemaining < 0 ? c.err : a.slaDaysRemaining <= 1 ? c.warn : c.txt3, fontWeight: a.slaDaysRemaining < 0 ? 700 : 400, marginTop: 2 }}>
                      {a.slaDaysRemaining < 0 ? `Overdue by ${-a.slaDaysRemaining} day(s): Right to Services deadline missed` : `Right to Services deadline in ${a.slaDaysRemaining} day(s)`}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: tone, padding: '4px 8px', background: `${tone}15`, borderRadius: 9999, whiteSpace: 'nowrap' }}>{a.status}</span>
                <ChevronRight size={16} color={c.txt3} />
              </div>
            </Card>
          )
        })}

        <OfficerGrievances />

        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>Daily Performance</p>
        <Card style={{ padding: 0 }}>
          {perf.map((p, i) => (
            <div key={p.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < perf.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
              <span style={{ fontSize: 13, color: c.txt2 }}>{p.l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c.txt }}>{p.v}</span>
            </div>
          ))}
        </Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          <Star size={12} color={c.sec} />
          <p style={{ fontSize: 11, color: c.txt3 }}>Metrics update live with every action you take</p>
        </div>
      </div>
    </div>
  )
}

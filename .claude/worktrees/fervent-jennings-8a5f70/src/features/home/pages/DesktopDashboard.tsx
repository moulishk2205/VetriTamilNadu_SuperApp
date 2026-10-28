import { useMemo } from 'react'
import { ArrowRight, FileCheck, BadgeCheck, Sparkles, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { DesktopHero } from '@/app/desktop/DesktopHero'
import { DesktopQuickServices } from '@/app/desktop/DesktopQuickServices'
import { DesktopAnnouncements } from '@/app/desktop/DesktopAnnouncements'
import { useApplicationsQuery } from '@/features/applications/hooks/useApplications'
import { useComplaintsQuery } from '@/features/complaints/hooks/useComplaints'
import { useWalletDocumentCards } from '@/features/documents/hooks/useDocuments'
import { useSchemeCards } from '@/features/schemes/hooks/useSchemes'
import { SERVICE_META } from '@/features/services/catalog/meta'

const COMPLAINT_STEPS = ['submitted', 'assigned', 'inProgress', 'resolved']
const STEP_LABEL: Record<string, string> = { submitted: 'Submitted', assigned: 'Assigned', inProgress: 'In Progress', resolved: 'Resolved' }

/**
 * Government Web Portal dashboard — the desktop presentation of the citizen
 * home. It renders the SAME data as the mobile HomeDashboard (identical hooks,
 * identical queries, identical routes); only the composition is desktop-native:
 * multi-column widgets, wide grids and executive spacing.
 */
export default function DesktopDashboard() {
  const c = useC()
  const { onNav } = useAppNavigation()
  const { data: apps } = useApplicationsQuery()
  const { data: complaints } = useComplaintsQuery()
  const docs = useWalletDocumentCards()
  const schemes = useSchemeCards()

  const recentApps = (apps ?? []).slice(0, 4)
  const complaint = (complaints ?? [])[0]

  // Department directory, grouped from the official service catalogue.
  const departments = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of SERVICE_META) map.set(s.department, (map.get(s.department) ?? 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [])

  const card: React.CSSProperties = { background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 16 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <DesktopHero />
      <DesktopQuickServices />

      {/* Applications + Announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        <section style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: `1px solid ${c.bdr}` }}>
            <FileCheck size={17} color={c.pri} />
            <h2 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: c.txt }}>Recent Applications</h2>
            <button onClick={() => onNav('tracker')} style={linkBtn(c.pri)}>Track all <ArrowRight size={13} /></button>
          </div>

          {recentApps.length === 0 && <p style={{ padding: 18, fontSize: 13, color: c.txt2 }}>No applications yet. Browse services to apply.</p>}

          {recentApps.map((a, i) => {
            const tone = a.status === 'Completed' ? c.ok : a.status === 'Rejected' ? c.err : c.warn
            return (
              <button key={a.id} onClick={() => onNav('tracker')} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', borderBottom: i < recentApps.length - 1 ? `1px solid ${c.bdr}` : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.txt }}>{a.serviceName}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tone, background: `${tone}15`, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{a.status}</span>
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: c.txt2, marginTop: 4 }}>
                  {a.referenceNo} · {a.officer?.designation ?? a.department}
                </span>
              </button>
            )
          })}
        </section>

        <DesktopAnnouncements />
      </div>

      {/* Grievance timeline + Digital locker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        <section style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={17} color={c.pri} />
            <h2 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: c.txt }}>Grievance Timeline</h2>
            <button onClick={() => onNav('complaint')} style={linkBtn(c.pri)}>File new <ArrowRight size={13} /></button>
          </div>

          {!complaint && <p style={{ fontSize: 13, color: c.txt2 }}>No grievances filed. Report a civic issue and track it here.</p>}

          {complaint && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.txt }}>{complaint.category}</p>
              <p style={{ fontSize: 12, color: c.txt2, marginTop: 3 }}>{complaint.referenceNo} · {complaint.department ?? 'Assigned department'}</p>

              <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 20 }}>
                {COMPLAINT_STEPS.map((step, i) => {
                  const idx = COMPLAINT_STEPS.indexOf(String(complaint.status))
                  const done = idx >= 0 && i <= idx
                  return (
                    <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {i > 0 && <span style={{ position: 'absolute', top: 11, right: '50%', width: '100%', height: 2, background: done ? c.pri : c.bdr }} />}
                      <span style={{ position: 'relative', width: 24, height: 24, borderRadius: '50%', background: done ? c.pri : c.card, border: `2px solid ${done ? c.pri : c.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {done && <CheckCircle2 size={13} color="#fff" />}
                      </span>
                      <span style={{ fontSize: 10.5, color: done ? c.txt : c.txt3, marginTop: 7, textAlign: 'center', fontWeight: done ? 600 : 400 }}>{STEP_LABEL[step]}</span>
                    </div>
                  )
                })}
              </div>

              {complaint.etaDays != null && (
                <p style={{ fontSize: 11.5, color: c.txt2, marginTop: 16, paddingTop: 13, borderTop: `1px solid ${c.bdr}` }}>
                  Expected resolution within {complaint.etaDays} days of filing.
                </p>
              )}
            </>
          )}
        </section>

        <section style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <BadgeCheck size={17} color={c.pri} />
            <h2 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: c.txt }}>Digital Locker</h2>
            <button onClick={() => onNav('wallet')} style={linkBtn(c.pri)}>Open <ArrowRight size={13} /></button>
          </div>

          {docs.length === 0 && <p style={{ fontSize: 13, color: c.txt2 }}>Approved certificates are delivered here automatically.</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {docs.slice(0, 4).map((d) => (
              <button key={d.id} onClick={() => onNav('wallet')} style={{ textAlign: 'left', background: `${d.cl}0D`, border: `1px solid ${d.cl}2E`, borderRadius: 12, padding: '13px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: d.cl, textTransform: 'uppercase' }}>{d.tp}</span>
                  <BadgeCheck size={14} color={d.cl} />
                </span>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.txt, marginTop: 7 }}>{d.n}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: c.txt2, marginTop: 3, fontFamily: 'monospace' }}>{d.id}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: c.txt3, marginTop: 5 }}>Valid: {d.v}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Scheme recommendations */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt }}>Recommended Schemes</h2>
            <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 3 }}>Welfare schemes matched to your citizen profile</p>
          </div>
          <button onClick={() => onNav('schemes')} style={linkBtn(c.pri)}>View all <ArrowRight size={14} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {schemes.slice(0, 4).map((s) => (
            <button key={s.n} onClick={() => onNav('schemes')} style={{ textAlign: 'left', background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 14, padding: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: `${s.cl}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={17} color={s.cl} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: s.cl }}>{s.m}% match</span>
              </span>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: c.txt, marginTop: 11, lineHeight: 1.35 }}>{s.n}</span>
              <span style={{ display: 'block', fontSize: 12, color: c.txt2, marginTop: 5 }}>{s.b}</span>
              <span style={{ display: 'block', fontSize: 11, color: c.txt3, marginTop: 7 }}>{s.d}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Department directory */}
      <section>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: c.txt }}>Government Departments</h2>
          <p style={{ fontSize: 12.5, color: c.txt2, marginTop: 3 }}>Departments delivering services through this portal</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          {departments.map(([name, count]) => (
            <button key={name} onClick={() => onNav('services')} style={{ display: 'flex', gap: 13, alignItems: 'center', textAlign: 'left', background: c.card, border: `1px solid ${c.bdr}`, borderRadius: 14, padding: '15px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: `${c.pri}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={19} color={c.pri} strokeWidth={1.8} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.txt, lineHeight: 1.35 }}>{name}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: c.txt2, marginTop: 3 }}>{count} service{count > 1 ? 's' : ''}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

const linkBtn = (color: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })

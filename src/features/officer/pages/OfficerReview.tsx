import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, XCircle, FileText, AlertTriangle, Users, User, PenLine, Wallet } from 'lucide-react'
import { StatusBar, Header, Card, Btn } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useApplicationQuery } from '@/features/applications/hooks/useApplications'
import { presentTimeline } from '@/features/applications/timeline'
import { useOfficerAction } from '../hooks/useOfficer'
import type { OfficerAction } from '../api/officerApi'
import { getServiceMeta } from '@/features/services/catalog'

/**
 * Application Review — the officer's case workspace. Every button drives a
 * legal Workflow Engine transition on the mock backend; approval walks the
 * pipeline through digital signature (placeholder) → certificate generation →
 * wallet delivery → citizen notification, exactly as the statute sequences it.
 */
export default function OfficerReview() {
  const { id = '' } = useParams()
  const c = useC()
  const navigate = useNavigate()
  const { data: app, isLoading } = useApplicationQuery(id)
  const act = useOfficerAction()
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState<OfficerAction | null>(null)

  if (isLoading || !app) {
    return (
      <div style={{ minHeight: '100vh', padding: 24 }}>
        <StatusBar />
        <Header title="Review" onBack={() => navigate(-1)} />
        <p style={{ fontSize: 13, color: c.txt2, marginTop: 20 }}>{isLoading ? 'Loading application…' : 'Application not found.'}</p>
      </div>
    )
  }

  const meta = getServiceMeta(app.serviceId)
  const terminal = app.status === 'Completed' || app.status === 'Rejected'
  const tone = app.status === 'Completed' ? c.ok : app.status === 'Rejected' ? c.err : c.warn

  const run = (action: OfficerAction) => {
    setConfirm(null)
    act.mutate({ id: app.id, action, note: note || undefined }, { onSuccess: () => setNote('') })
  }

  const actions: { a: OfficerAction; l: string; icon: typeof CheckCircle; tone: string; desc: string }[] = [
    { a: 'approve', l: 'Approve this step', icon: CheckCircle, tone: c.ok, desc: 'Move to the next stage. The certificate is issued only after approval → eSign → generation.' },
    { a: 'correction', l: 'Request Correction', icon: FileText, tone: c.info, desc: 'Return to citizen for additional documents' },
    { a: 'escalate', l: 'Escalate', icon: AlertTriangle, tone: c.warn, desc: `Escalate to ${meta?.authorities.escalation ?? 'senior officer'}` },
    { a: 'transfer', l: 'Transfer', icon: Users, tone: c.info, desc: 'Reassign to another officer' },
    { a: 'reject', l: 'Reject', icon: XCircle, tone: c.err, desc: 'Record reason and close the application' },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <StatusBar />
      <div style={{ padding: '8px 20px' }}>
        <Header title="Application Review" onBack={() => navigate('/officer')} />

        {/* Case header */}
        <Card style={{ marginBottom: 12, background: `linear-gradient(135deg,${c.pri}08,${c.sec}0D), ${c.card}`, border: `1px solid ${c.pri}15` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: c.txt }}>{app.serviceName}</p>
              <p style={{ fontSize: 12, color: c.txt2, fontFamily: 'monospace' }}>{app.referenceNo}</p>
              <p style={{ fontSize: 11, color: c.txt3, marginTop: 4 }}>{app.department}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: tone, padding: '4px 10px', background: `${tone}15`, borderRadius: 9999 }}>{app.status}</span>
          </div>
        </Card>

        {/* Citizen + fields */}
        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '14px 0 8px' }}>Citizen Application</p>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c.pri}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color={c.pri} /></div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{String(app.fields.fullName ?? app.fields.applicantName ?? app.fields.headName ?? 'Citizen')}</p>
              <p style={{ fontSize: 11, color: c.txt2 }}>Submitted {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          {Object.entries(app.fields).filter(([, v]) => v !== '' && v != null).slice(0, 10).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: c.txt2 }}>{k}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: c.txt, textAlign: 'right' }}>{String(v)}</span>
            </div>
          ))}
        </Card>

        {/* Documents */}
        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '14px 0 8px' }}>Submitted Documents ({app.documents.length})</p>
        <Card style={{ marginBottom: 12, padding: 0 }}>
          {app.documents.length === 0 && <p style={{ fontSize: 12, color: c.txt3, padding: '14px 16px' }}>No documents were attached to this application.</p>}
          {app.documents.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < app.documents.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
              {d.source === 'wallet' ? <Wallet size={15} color={c.pri} /> : <FileText size={15} color={c.pri} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: c.txt }}>{d.requirementId}</p>
                <p style={{ fontSize: 11, color: c.txt2 }}>{d.name}{d.source === 'wallet' ? ' · verified Wallet copy' : ' · uploaded'}</p>
              </div>
              <CheckCircle size={13} color={c.ok} />
            </div>
          ))}
        </Card>

        {/* Timeline */}
        <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '14px 0 8px' }}>Timeline</p>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: c.bdr }} />
            {presentTimeline(app).map((x, i, rows) => (
              <div key={x.id} style={{ position: 'relative', paddingBottom: i === rows.length - 1 ? 0 : 14 }}>
                <div style={{ position: 'absolute', left: -17, top: 3, width: 12, height: 12, borderRadius: '50%', background: x.status === 'done' ? c.ok : x.status === 'current' ? c.pri : c.bdr }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: x.status === 'pending' ? c.txt3 : c.txt, paddingLeft: 6 }}>{x.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Remarks */}
        {app.remarks.length > 0 && (
          <Card style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: c.txt3, textTransform: 'uppercase', marginBottom: 8 }}>Remarks</p>
            {app.remarks.map((r, i) => (
              <p key={i} style={{ fontSize: 12, color: c.txt2, marginBottom: 6 }}><strong style={{ color: c.txt }}>{r.by}:</strong> {r.text}</p>
            ))}
          </Card>
        )}

        {/* Action panel */}
        {!terminal && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '14px 0 8px' }}>Officer Action</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '10px 14px', background: c.card, borderRadius: 14, border: `1px solid ${c.bdr}` }}>
              <PenLine size={16} color={c.txt3} style={{ marginTop: 2 }} />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add remarks (recorded on the audit trail)…" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: c.txt, resize: 'none', height: 40 }} />
            </div>
            {actions.map((x) => (
              <Card key={x.a} onClick={() => !act.isPending && setConfirm(x.a)} style={{ marginBottom: 8, cursor: 'pointer', border: confirm === x.a ? `1.5px solid ${x.tone}` : undefined }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <x.icon size={18} color={x.tone} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: c.txt }}>{x.l}</p>
                    <p style={{ fontSize: 11, color: c.txt2 }}>{x.desc}</p>
                  </div>
                  {confirm === x.a && (
                    <Btn size="sm" variant="primary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); run(x.a) }} disabled={act.isPending}>
                      {act.isPending ? 'Working…' : 'Confirm'}
                    </Btn>
                  )}
                </div>
              </Card>
            ))}
            {act.isError && <p style={{ fontSize: 12, color: c.err, textAlign: 'center', marginTop: 6 }}>Action not permitted from the current stage.</p>}
          </>
        )}
        {terminal && (
          <Card style={{ background: `${tone}08`, border: `1px solid ${tone}20` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>
              Case closed — {app.status === 'Completed' ? 'certificate issued and delivered to the citizen’s Wallet.' : 'application rejected with recorded reason.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

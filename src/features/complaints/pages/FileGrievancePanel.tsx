import { useState } from 'react'
import { AlertTriangle, X, Send, CheckCircle2, MapPin, Loader2 } from 'lucide-react'
import { useC } from '@/hooks/useUi'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { useCreateComplaint } from '@/features/complaints/hooks/useComplaints'
import { routeComplaint } from '@/features/complaints/routing'
import { Panel, DeskBtn, StatusChip } from '@/app/desktop/DesktopUI'
import type { Complaint } from '@/types/models/complaint'

const CATEGORIES = ['Road Damage', 'Water Supply', 'Streetlight', 'Garbage', 'Drainage', 'Other']

/**
 * Desktop grievance intake.
 *
 * Files a real complaint through `useCreateComplaint()` — the same mutation the
 * mobile complaint screen uses — and shows the department routing preview live
 * (from the shared `routeComplaint` rules) before submission, then the issued
 * reference number afterwards.
 */
export function FileGrievancePanel({ onClose }: { onClose: () => void }) {
  const c = useC()
  const { onNav } = useAppNavigation()
  const create = useCreateComplaint()

  const [category, setCategory] = useState('Road Damage')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState('')
  const [ward, setWard] = useState('')
  const [error, setError] = useState('')
  const [filed, setFiled] = useState<Complaint | null>(null)

  const routing = routeComplaint(category)

  const submit = () => {
    if (description.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters so the department can act on it.')
      return
    }
    setError('')
    create.mutate(
      { category, description: description.trim(), location: { area: area.trim() || undefined, ward: ward.trim() || undefined } },
      {
        onSuccess: (complaint) => setFiled(complaint),
        onError: () => setError('The grievance could not be filed just now. Please try again.'),
      },
    )
  }

  // ── Filed: show the issued reference ──────────────────────────────────
  if (filed) {
    return (
      <div style={{ marginBottom: 24 }}>
        <Panel
          title="Grievance filed"
          action={<button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={17} color={c.txt3} /></button>}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ width: 46, height: 46, borderRadius: 13, background: `${c.ok}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={23} color={c.ok} />
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: c.txt }}>{filed.category} reported</p>
              <p style={{ fontSize: 13, color: c.txt2, marginTop: 5, lineHeight: 1.6 }}>
                Routed to <strong style={{ color: c.txt }}>{filed.department ?? routing.department}</strong>
                {filed.etaDays != null && <> · expected resolution within <strong style={{ color: c.txt }}>{filed.etaDays} days</strong></>}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 14, padding: '13px 16px', borderRadius: 11, background: c.bgAlt, border: `1px solid ${c.bdr}` }}>
                <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: c.txt3 }}>Reference</span>
                <span className="vtn-num" style={{ fontSize: 17, fontWeight: 800, color: c.pri, fontFamily: 'monospace' }}>{filed.referenceNo}</span>
                <StatusChip label={String(filed.status)} tone="warn" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <DeskBtn variant="primary" onClick={onClose}>View in my grievances</DeskBtn>
                <DeskBtn onClick={() => onNav('notifications')}>Open notifications</DeskBtn>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────
  const field: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 10, border: `1px solid ${c.bdr}`,
    background: c.bg, color: c.txt, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Panel
        title="File a grievance"
        action={<button onClick={onClose} aria-label="Close grievance form" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={17} color={c.txt3} /></button>}
      >
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: c.txt2, marginBottom: 8 }}>Issue category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((x) => {
                  const on = x === category
                  return (
                    <button key={x} onClick={() => setCategory(x)} aria-pressed={on}
                      style={{ padding: '9px 14px', borderRadius: 9999, border: `1px solid ${on ? c.pri : c.bdr}`, background: on ? c.pri : c.bg, color: on ? '#fff' : c.txt2, fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {x}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="vtn-grv-desc" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: c.txt2, marginBottom: 7 }}>
                What is the problem? <span style={{ color: c.err }}>*</span>
              </label>
              <textarea
                id="vtn-grv-desc" rows={4} value={description}
                onChange={(e) => { setDescription(e.target.value); setError('') }}
                placeholder="Describe the issue and where exactly it is — for example: Large pothole outside 12/3 TTK Road, causing two-wheeler accidents."
                style={{ ...field, resize: 'vertical', lineHeight: 1.6, ...(error ? { borderColor: c.err } : {}) }}
                aria-invalid={Boolean(error)}
              />
            </div>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label htmlFor="vtn-grv-area" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: c.txt2, marginBottom: 7 }}>Area / locality</label>
                <input id="vtn-grv-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Mylapore" style={field} />
              </div>
              <div>
                <label htmlFor="vtn-grv-ward" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: c.txt2, marginBottom: 7 }}>Ward (optional)</label>
                <input id="vtn-grv-ward" value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Ward 121" style={field} />
              </div>
            </div>

            {error && (
              <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: c.err, background: `${c.err}0A`, border: `1px solid ${c.err}2E`, borderRadius: 10, padding: '10px 13px' }}>
                <AlertTriangle size={14} />{error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <button onClick={submit} disabled={create.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 11, border: 'none', background: c.pri, color: '#fff', fontSize: 14, fontWeight: 700, cursor: create.isPending ? 'wait' : 'pointer', opacity: create.isPending ? 0.7 : 1, fontFamily: 'inherit' }}>
                {create.isPending ? <Loader2 size={15} className="vtn-spin" /> : <Send size={15} />}
                {create.isPending ? 'Filing…' : 'Submit grievance'}
              </button>
              <DeskBtn onClick={onClose}>Cancel</DeskBtn>
            </div>
          </div>

          {/* Live routing preview — the same rules the backend applies */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: c.txt3 }}>Where this will go</p>
            <dl style={{ display: 'grid', gap: 13, marginTop: 12 }}>
              {[
                { k: 'Responsible department', v: routing.department },
                { k: 'Priority', v: routing.priority },
                { k: 'Expected resolution', v: `${routing.etaDays} days from filing` },
              ].map((r) => (
                <div key={r.k}>
                  <dt style={{ fontSize: 11.5, color: c.txt3 }}>{r.k}</dt>
                  <dd style={{ fontSize: 13.5, color: c.txt, fontWeight: 500, marginTop: 2 }}>{r.v}</dd>
                </div>
              ))}
            </dl>
            <p style={{ display: 'flex', gap: 9, fontSize: 12, color: c.txt2, marginTop: 16, paddingTop: 13, borderTop: `1px solid ${c.bdr}`, lineHeight: 1.6 }}>
              <MapPin size={14} color={c.txt3} style={{ flexShrink: 0, marginTop: 2 }} />
              Routing is decided by the issue category. You will receive a tracking reference immediately and a
              notification at every stage of resolution.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}

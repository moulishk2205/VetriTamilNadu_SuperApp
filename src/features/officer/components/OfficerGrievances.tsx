import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { MessageSquareWarning } from 'lucide-react'
import { Card } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'
import { ComplaintSchema, type Complaint } from '@/types/models/complaint'
import { LIVE } from '@/lib/api/live'

const QueueSchema = z.object({ items: z.array(ComplaintSchema), total: z.number(), open: z.number() })
type Action = 'start' | 'escalate' | 'resolve' | 'close'

/** Which actions each status allows (mirrors the backend workflow). */
const NEXT: Record<string, { a: Action; l: string }[]> = {
  submitted: [{ a: 'start', l: 'Take up' }, { a: 'escalate', l: 'Escalate' }],
  assigned: [{ a: 'start', l: 'Take up' }, { a: 'escalate', l: 'Escalate' }],
  inProgress: [{ a: 'resolve', l: 'Resolve' }, { a: 'escalate', l: 'Escalate' }],
  escalated: [{ a: 'start', l: 'Take up' }, { a: 'resolve', l: 'Resolve' }],
  resolved: [{ a: 'close', l: 'Close' }],
  closed: [],
}
const LABEL: Record<string, string> = { submitted: 'New', assigned: 'Assigned', inProgress: 'In progress', escalated: 'Escalated', resolved: 'Resolved', closed: 'Closed' }

/**
 * Grievance redressal for the signed-in officer's district. Each action
 * notifies the citizen and is written to the audit trail; resolving requires
 * a note, which the citizen sees.
 */
export function OfficerGrievances() {
  const c = useC()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['officer', 'grievances'], queryFn: () => apiClient.get('/officer/grievances', { schema: QueueSchema }), ...LIVE })
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const act = useMutation({
    mutationFn: ({ id, action, note: n }: { id: string; action: Action; note?: string }) => apiClient.post(`/officer/grievances/${id}/action`, { action, note: n }, { schema: ComplaintSchema }),
    onSuccess: () => { setNoteFor(null); setNote(''); void qc.invalidateQueries({ queryKey: ['officer', 'grievances'] }) },
  })
  const tone = (s: string) => (s === 'resolved' || s === 'closed' ? c.ok : s === 'escalated' ? c.err : s === 'inProgress' ? c.info : c.warn)
  const run = (g: Complaint, a: Action) => (a === 'resolve' ? setNoteFor(g.id) : act.mutate({ id: g.id, action: a }))

  return (
    <>
      <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>
        Grievances in your district {data ? `· ${data.open} open` : ''}
      </p>
      {(data?.items ?? []).slice(0, 8).map((g) => (
        <Card key={g.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <MessageSquareWarning size={18} color={tone(g.status)} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.txt }}>{g.category}</p>
              <p style={{ fontSize: 11, color: c.txt2, fontFamily: 'monospace' }}>{g.referenceNo}{g.department ? ` · ${g.department}` : ''}</p>
              <p style={{ fontSize: 12, color: c.txt2, marginTop: 4, lineHeight: 1.45 }}>{g.description}</p>
              {g.resolutionNote && <p style={{ fontSize: 12, color: c.ok, marginTop: 4 }}>Resolution: {g.resolutionNote}</p>}
              {noteFor === g.id && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input aria-label="What was done" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done (the citizen sees this)" style={{ flex: '1 1 220px', padding: '8px 10px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 13, fontFamily: 'inherit' }} />
                  <button disabled={!note.trim() || act.isPending} onClick={() => act.mutate({ id: g.id, action: 'resolve', note })} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: c.ok, color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', opacity: note.trim() ? 1 : 0.5 }}>Mark resolved</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {(NEXT[g.status] ?? []).map((n) => (
                  <button key={n.a} disabled={act.isPending} onClick={() => run(g, n.a)} style={{ padding: '6px 12px', borderRadius: 9999, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{n.l}</button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: tone(g.status), padding: '4px 8px', background: `${tone(g.status)}15`, borderRadius: 9999, whiteSpace: 'nowrap' }}>{LABEL[g.status] ?? g.status}</span>
          </div>
        </Card>
      ))}
      {act.isError && <p role="alert" style={{ fontSize: 12, color: c.err }}>{act.error?.message}</p>}
    </>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Forward, MessageSquareText } from 'lucide-react'
import { Card } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const Colleagues = z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), designation: z.string(), sameDepartment: z.boolean() })) })
const Reports = z.object({ items: z.array(z.object({ id: z.string(), from: z.string(), to: z.string(), question: z.string(), answer: z.string().nullable(), createdAt: z.string(), answeredAt: z.string().nullable() })) })

/**
 * Forward the case to a named colleague, or seek a report: ask a colleague a
 * question that they answer from their own portal. Answers appear here.
 */
export function CaseCollaboration({ appId, closed }: { appId: string; closed: boolean }) {
  const c = useC()
  const qc = useQueryClient()
  const [to, setTo] = useState('')
  const [text, setText] = useState('')
  const colleagues = useQuery({ queryKey: ['officer', 'colleagues'], queryFn: () => apiClient.get('/officer/colleagues', { schema: Colleagues }) })
  const reports = useQuery({ queryKey: ['officer', 'application', appId, 'reports'], queryFn: () => apiClient.get(`/officer/applications/${appId}/reports`, { schema: Reports }) })
  const done = () => { setText(''); void qc.invalidateQueries({ queryKey: ['officer'] }) }
  const seek = useMutation({ mutationFn: () => apiClient.post(`/officer/applications/${appId}/reports`, { toOfficerId: to, question: text }), onSuccess: done })
  const forward = useMutation({ mutationFn: () => apiClient.post(`/officer/applications/${appId}/action`, { action: 'forward', toOfficerId: to, note: text || undefined }), onSuccess: done })
  const field = { padding: '9px 10px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 13, fontFamily: 'inherit', width: '100%' } as const
  const error = seek.error ?? forward.error

  return (
    <>
      <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>Colleagues</p>
      {!closed && (
        <Card style={{ display: 'grid', gap: 8 }}>
          <select aria-label="Colleague" value={to} onChange={(e) => setTo(e.target.value)} style={field}>
            <option value="">Choose a colleague in your district…</option>
            {(colleagues.data?.items ?? []).map((o) => <option key={o.id} value={o.id}>{o.name} · {o.designation}{o.sameDepartment ? '' : ' (other department)'}</option>)}
          </select>
          <textarea aria-label="Question or note" value={text} onChange={(e) => setText(e.target.value)} placeholder="Question for a report, or a note when forwarding" rows={2} style={{ ...field, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={!to || !text.trim() || seek.isPending} onClick={() => seek.mutate()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9999, border: `1px solid ${c.info}`, background: 'transparent', color: c.info, fontWeight: 600, fontSize: 12.5, cursor: 'pointer', opacity: to && text.trim() ? 1 : 0.5 }}>
              <MessageSquareText size={14} aria-hidden="true" />Seek report
            </button>
            <button disabled={!to || forward.isPending} onClick={() => forward.mutate()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9999, border: `1px solid ${c.pri}`, background: 'transparent', color: c.pri, fontWeight: 600, fontSize: 12.5, cursor: 'pointer', opacity: to ? 1 : 0.5 }}>
              <Forward size={14} aria-hidden="true" />Forward case
            </button>
          </div>
          {seek.isSuccess && <p role="status" style={{ fontSize: 12, color: c.ok }}>Report requested. It appears in your colleague's portal.</p>}
          {forward.isSuccess && <p role="status" style={{ fontSize: 12, color: c.ok }}>Forwarded. The case now sits with your colleague.</p>}
          {error && <p role="alert" style={{ fontSize: 12, color: c.err }}>{error.message}</p>}
        </Card>
      )}
      {(reports.data?.items ?? []).map((r) => (
        <Card key={r.id} style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12, color: c.txt3 }}>{r.from} asked {r.to} · {new Date(r.createdAt).toLocaleString('en-IN')}</p>
          <p style={{ fontSize: 13, color: c.txt, marginTop: 4 }}>{r.question}</p>
          <p style={{ fontSize: 13, color: r.answer ? c.ok : c.warn, marginTop: 6 }}>{r.answer ? `Report: ${r.answer}` : 'Awaiting report'}</p>
        </Card>
      ))}
    </>
  )
}

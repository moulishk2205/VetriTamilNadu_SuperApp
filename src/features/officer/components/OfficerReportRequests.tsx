import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { MessageSquareText } from 'lucide-react'
import { Card } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const Schema = z.object({
  items: z.array(z.object({ id: z.string(), referenceNo: z.string(), serviceName: z.string(), from: z.string(), question: z.string(), answer: z.string().nullable(), createdAt: z.string(), answeredAt: z.string().nullable() })),
  open: z.number(),
})

/** Reports colleagues have asked this officer for; answer them here. Hidden when there are none. */
export function OfficerReportRequests() {
  const c = useC()
  const qc = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const { data } = useQuery({ queryKey: ['officer', 'reports'], queryFn: () => apiClient.get('/officer/reports', { schema: Schema }) })
  const answer = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => apiClient.post(`/officer/reports/${id}/answer`, { answer: text }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['officer'] }),
  })
  if (!data || data.items.length === 0) return null

  return (
    <>
      <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>Reports requested from you · {data.open} open</p>
      {data.items.slice(0, 6).map((r) => (
        <Card key={r.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <MessageSquareText size={18} color={r.answer ? c.ok : c.info} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>{r.serviceName} · <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.referenceNo}</span></p>
              <p style={{ fontSize: 12, color: c.txt3 }}>From {r.from}</p>
              <p style={{ fontSize: 13, color: c.txt, marginTop: 4 }}>{r.question}</p>
              {r.answer ? (
                <p style={{ fontSize: 12.5, color: c.ok, marginTop: 6 }}>Your report: {r.answer}</p>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <input aria-label="Your report" value={drafts[r.id] ?? ''} onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} placeholder="Your report" style={{ flex: '1 1 220px', padding: '8px 10px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 13, fontFamily: 'inherit' }} />
                  <button disabled={!(drafts[r.id] ?? '').trim() || answer.isPending} onClick={() => answer.mutate({ id: r.id, text: drafts[r.id] ?? '' })} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: c.pri, color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Submit report</button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </>
  )
}

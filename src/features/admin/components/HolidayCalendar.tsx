import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { CalendarDays, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const Holidays = z.array(z.object({ date: z.string(), name: z.string() }))

/**
 * The holiday calendar behind every Right to Services deadline: deadlines
 * count working days, skipping Sundays and these dates. Add festival holidays
 * each year from the Government Order.
 */
export function HolidayCalendar() {
  const c = useC()
  const qc = useQueryClient()
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const { data } = useQuery({ queryKey: ['admin', 'holidays'], queryFn: () => apiClient.get('/admin/holidays', { schema: Holidays }) })
  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin', 'holidays'] })
  const add = useMutation({ mutationFn: () => apiClient.post('/admin/holidays', { date, name }), onSuccess: () => { setDate(''); setName(''); refresh() } })
  const remove = useMutation({ mutationFn: (d: string) => apiClient.del(`/admin/holidays/${d}`), onSuccess: refresh })
  const field = { padding: '9px 10px', borderRadius: 10, border: `1px solid ${c.bdr}`, background: c.bg, color: c.txt, fontSize: 13, fontFamily: 'inherit' } as const

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <Card style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <CalendarDays size={18} color={c.pri} style={{ marginTop: 2 }} />
        <p style={{ fontSize: 12.5, color: c.txt2, lineHeight: 1.5 }}>
          Every deadline counts working days: Sundays and the holidays below do not count, for whole applications and for each stage (document verification 1, inspection 3, approval 2 working days). Add festival holidays each year from the Government Order.
        </p>
      </Card>
      <Card style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="date" aria-label="Holiday date" value={date} onChange={(e) => setDate(e.target.value)} style={field} />
        <input aria-label="Holiday name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deepavali" style={{ ...field, flex: '1 1 160px' }} />
        <button disabled={!date || !name.trim() || add.isPending} onClick={() => add.mutate()} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: c.pri, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: date && name.trim() ? 1 : 0.5 }}>Add holiday</button>
      </Card>
      {(add.error ?? remove.error) && <p role="alert" style={{ fontSize: 12.5, color: c.err, marginTop: 8 }}>{(add.error ?? remove.error)?.message}</p>}
      <Card style={{ padding: 0, marginTop: 10 }}>
        {(data ?? []).map((h, i, arr) => (
          <div key={h.date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
            <span className="vtn-num" style={{ fontSize: 12.5, color: c.txt2, minWidth: 92, fontFamily: 'monospace' }}>{h.date}</span>
            <span style={{ flex: 1, fontSize: 13, color: c.txt }}>{h.name}</span>
            <button aria-label={`Remove ${h.name}`} onClick={() => remove.mutate(h.date)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} color={c.txt3} /></button>
          </div>
        ))}
      </Card>
    </div>
  )
}

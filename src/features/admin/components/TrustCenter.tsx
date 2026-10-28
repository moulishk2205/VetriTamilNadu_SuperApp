import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { ShieldCheck, ShieldAlert, Link2, Timer, Users, KeyRound, RefreshCw, Play } from 'lucide-react'
import { Card, Btn } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const Chain = z.object({
  valid: z.boolean(), rows: z.number(), chained: z.number(), legacy: z.number(),
  brokenAt: z.object({ seq: z.string(), id: z.string(), at: z.string(), reason: z.string() }).optional(),
})
const TrustSchema = z.object({
  environment: z.string().optional(),
  sessionsOpen: z.number(), failedLogins24h: z.number(), auditRows: z.number(), chain: Chain,
  sla: z.object({ overdue: z.number(), breached24h: z.number(), sweepMinutes: z.number() }),
  controls: z.array(z.object({ name: z.string(), status: z.enum(['on', 'warn', 'off']), detail: z.string() })),
})
const SweepSchema = z.object({
  checkedAt: z.string(),
  breached: z.array(z.object({ referenceNo: z.string(), serviceName: z.string(), daysOverdue: z.number(), escalated: z.boolean() })),
})

/**
 * Trust Center: the platform's security posture read from live state, including
 * the controls that are not in place yet. Evaluators can re-verify the audit
 * hash chain and trigger the Right to Services deadline check on the spot.
 */
export function TrustCenter() {
  const c = useC()
  const qc = useQueryClient()
  const { data, isFetching, refetch } = useQuery({ queryKey: ['admin', 'trust'], queryFn: () => apiClient.get('/admin/trust', { schema: TrustSchema }) })
  const sweep = useMutation({
    mutationFn: () => apiClient.post('/admin/sla/sweep', undefined, { schema: SweepSchema }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] })
      void qc.invalidateQueries({ queryKey: ['applications'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const tone = { on: c.ok, warn: c.warn, off: c.txt3 } as const
  const word = { on: 'In place', warn: 'Attention', off: 'Not yet' } as const
  const chainOk = data?.chain.valid ?? true

  const tile = (Icon: typeof Users, label: string, value: string | number, color: string) => (
    <Card style={{ padding: 14 }}>
      <Icon size={16} color={color} />
      <p className="vtn-num" style={{ fontSize: 22, fontWeight: 800, color: c.txt, marginTop: 8 }}>{value}</p>
      <p style={{ fontSize: 11.5, color: c.txt2, marginTop: 2 }}>{label}</p>
    </Card>
  )

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <Card style={{ marginTop: 14, display: 'flex', gap: 14, alignItems: 'center', background: `${chainOk ? c.ok : c.err}0D`, border: `1px solid ${chainOk ? c.ok : c.err}33` }}>
        {chainOk ? <ShieldCheck size={34} color={c.ok} /> : <ShieldAlert size={34} color={c.err} />}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: c.txt }}>{chainOk ? 'Audit trail intact' : 'Audit trail tampered'}</p>
          <p style={{ fontSize: 12, color: c.txt2, marginTop: 2, lineHeight: 1.45 }}>
            {data
              ? chainOk
                ? `${data.chain.chained} entries hash-chained (SHA-256)${data.chain.legacy ? `, ${data.chain.legacy} written before the chain` : ''}. Editing or deleting any entry breaks every hash after it.`
                : `Broken at entry #${data.chain.brokenAt?.seq}: ${data.chain.brokenAt?.reason}.`
              : 'Verifying…'}
          </p>
        </div>
        <Btn variant="outline" icon={RefreshCw} onClick={() => void refetch()} disabled={isFetching}>{isFetching ? 'Verifying…' : 'Re-verify'}</Btn>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
        {tile(Link2, 'Audit entries', data?.auditRows ?? '—', c.pri)}
        {tile(Users, 'Open sessions', data?.sessionsOpen ?? '—', c.info)}
        {tile(KeyRound, 'Failed sign-ins (24h)', data?.failedLogins24h ?? '—', data?.failedLogins24h ? c.warn : c.ok)}
        {tile(Timer, 'Past Right to Services deadline', data?.sla.overdue ?? '—', data?.sla.overdue ? c.err : c.ok)}
      </div>

      <Card style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Timer size={18} color={c.pri} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: c.txt }}>Right to Services deadline check</p>
            <p style={{ fontSize: 12, color: c.txt2, marginTop: 2 }}>
              {data?.sla.sweepMinutes ? `Runs automatically every ${data.sla.sweepMinutes} minutes.` : 'Runs on demand on this server.'} Breached applications escalate to a senior officer and the citizen is told.
            </p>
          </div>
          <Btn variant="primary" icon={Play} onClick={() => sweep.mutate()} disabled={sweep.isPending}>{sweep.isPending ? 'Checking…' : 'Run check now'}</Btn>
        </div>
        {sweep.data && (
          <div role="status" style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.bdr}` }}>
            {sweep.data.breached.length === 0 && <p style={{ fontSize: 12.5, color: c.ok }}>No new breaches. Every open application is within its deadline or already escalated.</p>}
            {sweep.data.breached.map((b) => (
              <p key={b.referenceNo} style={{ fontSize: 12.5, color: c.txt, marginTop: 4 }}>
                <b className="vtn-num">{b.referenceNo}</b> · {b.serviceName}: {b.daysOverdue} day(s) overdue → {b.escalated ? 'escalated to senior officer' : 'department alerted'}, citizen notified
              </p>
            ))}
          </div>
        )}
      </Card>

      <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '16px 0 10px' }}>Security controls</p>
      <Card style={{ padding: 0 }}>
        {(data?.controls ?? []).map((ctl, i, arr) => (
          <div key={ctl.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: tone[ctl.status], marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.txt }}>{ctl.name}</p>
              <p style={{ fontSize: 11.5, color: c.txt2, marginTop: 2, lineHeight: 1.4 }}>{ctl.detail}</p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: tone[ctl.status], background: `${tone[ctl.status]}14`, padding: '3px 8px', borderRadius: 9999, whiteSpace: 'nowrap' }}>{word[ctl.status]}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Settings, LogOut, Activity, Users, Building2, FileText, GitBranch, Plug, Flag, Megaphone, ScrollText, ShieldCheck, Send } from 'lucide-react'
import { StatusBar, Card, Seal, Toggle, Btn } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { apiClient } from '@/lib/api/client'
import { gateway } from '@/lib/integrations/registry'
import type { IntegrationCapability } from '@/lib/integrations/types'
import { getLogBuffer } from '@/lib/logger/logger'
import { useFeatureFlags } from '@/store/featureFlagStore'
import { SERVICE_META } from '@/features/services/catalog'
import { TN_DISTRICTS } from '@/features/services/catalog/geo'
import { ROLE_PERMISSIONS } from '@/lib/rbac/roles'
import { STANDARD_GOV_WORKFLOW } from '@/lib/workflow/definitions'
import { StatTile } from '@/components/charts'
import { TrustCenter } from '@/features/admin/components/TrustCenter'
import { ProcessMap } from '@/features/admin/components/ProcessMap'
import { RuleTester } from '@/features/admin/components/RuleTester'
import { UserAdmin } from '@/features/admin/components/UserAdmin'
import { PermissionMatrix } from '@/features/admin/components/PermissionMatrix'
import { HolidayCalendar } from '@/features/admin/components/HolidayCalendar'

const AuditSchema = z.object({ items: z.array(z.object({ id: z.string(), actor: z.string(), action: z.string(), entity: z.string(), entityId: z.string(), at: z.string(), note: z.string().optional() })), total: z.number() })

const TABS = ['Overview', 'Trust Center', 'Process model', 'Eligibility', 'Users & roles', 'Permissions', 'Holidays', 'Manage', 'Flags', 'Broadcast', 'Logs', 'Audit'] as const

/** Super Admin Portal — platform administration over the real registries. */
export default function AdminPortal() {
  const c = useC()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const { flags, setFlag } = useFeatureFlags()
  const [health, setHealth] = useState<Record<string, boolean> | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const { data: audit } = useQuery({ queryKey: ['admin', 'audit'], queryFn: () => apiClient.get('/admin/audit', { schema: AuditSchema }) })
  const broadcast = useMutation({
    mutationFn: () => apiClient.post('/admin/broadcast', { title, body }),
    onSuccess: () => { setTitle(''); setBody(''); qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  useEffect(() => { void gateway.healthAll().then(setHealth) }, [])

  const sec = (t: string) => <p style={{ fontSize: 12, fontWeight: 700, color: c.txt3, letterSpacing: 0.5, textTransform: 'uppercase', margin: '16px 0 10px' }}>{t}</p>
  const row = (icon: typeof Users, label: string, value: string, i: number, len: number) => {
    const Icon = icon
    return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < len - 1 ? `1px solid ${c.bdr}` : 'none' }}>
        <Icon size={16} color={c.pri} />
        <span style={{ flex: 1, fontSize: 13, color: c.txt }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: c.txt2 }}>{value}</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ padding: '0 20px 16px' }}>
        <StatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: c.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: c.txt }}>Platform Administration</p>
            <p style={{ fontSize: 12.5, color: c.txt, opacity: 0.8 }}>Vetri TN · Super Admin</p>
          </div>
          <button onClick={() => { void logout().then(() => navigate('/demo')) }} title="Log out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <LogOut size={18} color={c.txt} />
          </button>
          <Seal size={34} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 20px 0' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 9999, border: 'none', background: tab === t ? c.pri : c.card, color: tab === t ? '#fff' : c.txt, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        {tab === 'Overview' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <StatTile label="Services" value={SERVICE_META.length} />
              <StatTile label="Districts" value={TN_DISTRICTS.length} />
              <StatTile label="Roles" value={Object.keys(ROLE_PERMISSIONS).length} />
              <StatTile label="Workflow Stages" value={STANDARD_GOV_WORKFLOW.stages.length} />
              <StatTile label="Integrations" value={health ? Object.keys(health).length : '—'} />
              <StatTile label="Audit trail" value="Chained" color={c.ok} />
            </div>
            {sec('API & Integration Health')}
            <Card style={{ padding: 0 }}>
              {health && (Object.keys(health) as IntegrationCapability[]).map((cap, i, arr) => (
                <div key={cap} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                  <Activity size={14} color={health[cap] ? c.ok : c.err} />
                  <span style={{ flex: 1, fontSize: 13, color: c.txt }}>{gateway.get(cap).provider}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: health[cap] ? c.ok : c.err, background: `${health[cap] ? c.ok : c.err}12`, padding: '3px 8px', borderRadius: 9999 }}>
                    {health[cap] ? 'HEALTHY' : 'DOWN'} · {gateway.get(cap).mode.toUpperCase()}
                  </span>
                </div>
              ))}
            </Card>
            {sec('System')}
            <Card style={{ padding: 0 }}>
              {row(ShieldCheck, 'Security posture', 'Session-bound JWT · RBAC · see Trust Center', 0, 4)}
              {row(Activity, 'Monitoring', 'Structured logs + hash-chained audit', 1, 4)}
              {row(FileText, 'Storage', 'Not yet encrypted at rest', 2, 4)}
              {row(GitBranch, 'Backup / DR', 'Not yet configured', 3, 4)}
            </Card>
          </div>
        )}

        {tab === 'Trust Center' && <TrustCenter />}

        {tab === 'Process model' && <ProcessMap />}
        {tab === 'Eligibility' && <RuleTester />}

        {tab === 'Users & roles' && <UserAdmin />}

        {tab === 'Permissions' && <PermissionMatrix />}

        {tab === 'Holidays' && <HolidayCalendar />}

        {tab === 'Manage' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Registries')}
            <Card style={{ padding: 0 }}>
              {row(Users, 'Citizens', '1,001 seeded (demo population)', 0, 7)}
              {row(Users, 'Officers', '100 seeded', 1, 7)}
              {row(Building2, 'Departments', '20 seeded', 2, 7)}
              {row(FileText, 'Services & metadata', `${SERVICE_META.length} in catalogue`, 3, 7)}
              {row(FileText, 'Form definitions', `${SERVICE_META.length} schema-driven`, 4, 7)}
              {row(GitBranch, 'Workflows', 'gov.standard.v1 · BPMN export', 5, 7)}
              {row(Plug, 'Integration adapters', '10 mock adapters', 6, 7)}
            </Card>
            <Card style={{ marginTop: 10, background: `${c.info}06`, border: `1px solid ${c.info}15` }}>
              <p style={{ fontSize: 12, color: c.txt2, lineHeight: 1.5 }}>
                Forms are rendered from schemas and the workflow exports to BPMN 2.0, but services, forms and workflows are still defined in code. An admin-editable registry and a BPMN/DMN engine are the next build phase.
              </p>
            </Card>
          </div>
        )}

        {tab === 'Flags' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Feature Flags')}
            <Card style={{ padding: 0 }}>
              {Object.entries(flags).map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                  <Flag size={15} color={c.pri} />
                  <span style={{ flex: 1, fontSize: 13, color: c.txt }}>{k}</span>
                  <Toggle value={v} onChange={(nv: boolean) => setFlag(k, nv)} />
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 'Broadcast' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Broadcast Announcement')}
            <Card>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Scheduled maintenance)" style={{ width: '100%', border: `1.5px solid ${c.bdr}`, borderRadius: 12, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: c.bg, color: c.txt, marginBottom: 10 }} />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message shown in every citizen's notifications…" style={{ width: '100%', height: 80, border: `1.5px solid ${c.bdr}`, borderRadius: 12, padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: c.bg, color: c.txt, resize: 'none' }} />
              <Btn full variant="primary" style={{ marginTop: 10 }} icon={Send} onClick={() => broadcast.mutate()} disabled={!title || !body || broadcast.isPending}>
                {broadcast.isPending ? 'Sending…' : broadcast.isSuccess ? 'Delivered ✓' : 'Broadcast to all citizens'}
              </Btn>
            </Card>
            <Card style={{ marginTop: 10, background: `${c.warn}06`, border: `1px solid ${c.warn}15` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Megaphone size={14} color={c.warn} />
                <p style={{ fontSize: 11.5, color: c.txt2 }}>Broadcasts route through the Notification Engine → push/SMS/email adapters when live.</p>
              </div>
            </Card>
          </div>
        )}

        {tab === 'Logs' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec(`System Logs (${getLogBuffer().length} in ring buffer)`)}
            <Card style={{ padding: 0, maxHeight: 400, overflowY: 'auto' }}>
              {getLogBuffer().slice(-40).reverse().map((l, i, arr) => (
                <div key={i} style={{ padding: '9px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                  <p style={{ fontSize: 11, color: l.level === 'error' ? c.err : l.level === 'warn' ? c.warn : c.txt }}>
                    <span style={{ fontWeight: 700 }}>[{l.scope}]</span> {l.message}
                  </p>
                  <p style={{ fontSize: 9, color: c.txt3, fontFamily: 'monospace' }}>{l.level.toUpperCase()} · {l.ts.slice(11, 19)}</p>
                </div>
              ))}
              {getLogBuffer().length === 0 && <p style={{ fontSize: 12, color: c.txt3, padding: 14 }}>No log entries this session.</p>}
            </Card>
          </div>
        )}

        {tab === 'Audit' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {sec('Audit Trail')}
            <Card style={{ padding: 0 }}>
              {(audit?.items ?? []).slice(0, 25).map((a, i, arr) => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none' }}>
                  <ScrollText size={14} color={c.pri} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: c.txt }}>{a.action} · <span style={{ fontFamily: 'monospace' }}>{a.entityId}</span></p>
                    <p style={{ fontSize: 11, color: c.txt2 }}>{a.actor}{a.note ? ` — ${a.note}` : ''}</p>
                    <p style={{ fontSize: 9, color: c.txt3 }}>{new Date(a.at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

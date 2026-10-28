import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { KeyRound } from 'lucide-react'
import { Card } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const MatrixSchema = z.object({
  catalog: z.array(z.object({ key: z.string(), label: z.string() })),
  roles: z.record(z.string(), z.array(z.string())),
})
const ROLES = ['CITIZEN', 'OFFICER', 'DEPARTMENT', 'MLA', 'ADMIN', 'SUPPORT'] as const

/**
 * Role-based access control, editable: which role may do what. The server
 * checks this matrix on every request, so a change applies immediately (the
 * UI's menus follow at the user's next sign-in). Administrators always keep
 * "Administer the platform".
 */
export function PermissionMatrix() {
  const c = useC()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin', 'permissions'], queryFn: () => apiClient.get('/admin/permissions', { schema: MatrixSchema }) })
  const save = useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) => apiClient.put(`/admin/permissions/${role}`, { permissions }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'permissions'] }),
  })

  const toggle = (role: string, key: string) => {
    const current = data?.roles[role] ?? []
    save.mutate({ role, permissions: current.includes(key) ? current.filter((k) => k !== key) : [...current, key] })
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <Card style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <KeyRound size={18} color={c.pri} style={{ marginTop: 2 }} />
        <p style={{ fontSize: 12.5, color: c.txt2, lineHeight: 1.5 }}>
          Tick what each role may do. The server enforces this on every request, so a change applies at once and is recorded in the audit trail.
        </p>
      </Card>
      {save.isError && <p role="alert" style={{ fontSize: 12.5, color: c.err, marginTop: 8 }}>{save.error?.message}</p>}
      <Card style={{ padding: 0, marginTop: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 14px', color: c.txt3, fontWeight: 700, borderBottom: `1px solid ${c.bdr}` }}>Permission</th>
              {ROLES.map((r) => <th key={r} style={{ padding: '10px 6px', color: c.txt3, fontWeight: 700, fontSize: 11, borderBottom: `1px solid ${c.bdr}` }}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {(data?.catalog ?? []).map((p) => (
              <tr key={p.key}>
                <td style={{ padding: '9px 14px', color: c.txt, borderBottom: `1px solid ${c.bdr}` }}>
                  {p.label}<br /><span style={{ fontSize: 10.5, color: c.txt3, fontFamily: 'monospace' }}>{p.key}</span>
                </td>
                {ROLES.map((r) => {
                  const on = data?.roles[r]?.includes(p.key) ?? false
                  const locked = r === 'ADMIN' && p.key === 'admin:manage'
                  return (
                    <td key={r} style={{ textAlign: 'center', borderBottom: `1px solid ${c.bdr}` }}>
                      <input type="checkbox" aria-label={`${p.label} for ${r}`} checked={on} disabled={locked || save.isPending} onChange={() => toggle(r, p.key)} style={{ width: 16, height: 16, cursor: locked ? 'not-allowed' : 'pointer' }} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

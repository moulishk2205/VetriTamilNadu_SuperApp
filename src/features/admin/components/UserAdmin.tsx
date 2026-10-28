import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { UserCog } from 'lucide-react'
import { Card } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const ROLES = ['CITIZEN', 'OFFICER', 'DEPARTMENT', 'MLA', 'ADMIN', 'SUPPORT'] as const
const UsersSchema = z.object({
  items: z.array(z.object({
    id: z.string(), name: z.string(), detail: z.string(), kind: z.enum(['citizen', 'officer', 'staff']),
    role: z.enum(ROLES), active: z.boolean(), lastSignIn: z.string().nullable(), openSessions: z.number(),
  })),
})
const STAFF_ROLES = ['DEPARTMENT', 'MLA', 'ADMIN', 'SUPPORT'] as const

/**
 * User and role administration. Deactivating an account or changing a staff
 * role ends that person's sessions at once (tokens are checked against the
 * database on every request). Citizen and officer roles come from a linked
 * identity, so only staff roles can be changed here.
 */
export function UserAdmin() {
  const c = useC()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const { data } = useQuery({ queryKey: ['admin', 'users', q], queryFn: () => apiClient.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`, { schema: UsersSchema }) })
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; role?: string; active?: boolean }) => apiClient.patch(`/admin/users/${id}`, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <Card style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <UserCog size={18} color={c.pri} />
        <input aria-label="Search accounts" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or mobile…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: c.txt, fontSize: 13.5, fontFamily: 'inherit' }} />
      </Card>
      {update.isError && <p role="alert" style={{ fontSize: 12.5, color: c.err, marginTop: 8 }}>{update.error?.message}</p>}
      {update.isSuccess && <p role="status" style={{ fontSize: 12.5, color: c.ok, marginTop: 8 }}>Saved. Their open sessions were ended; they must sign in again.</p>}
      <Card style={{ padding: 0, marginTop: 10 }}>
        {(data?.items ?? []).map((u, i, arr) => (
          <div key={u.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${c.bdr}` : 'none', opacity: u.active ? 1 : 0.6 }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: c.txt }}>{u.name}</p>
              <p style={{ fontSize: 11.5, color: c.txt2 }}>{u.detail}{u.lastSignIn ? ` · last sign-in ${new Date(u.lastSignIn).toLocaleString('en-IN')}` : ' · never signed in'}{u.openSessions ? ` · ${u.openSessions} open session(s)` : ''}</p>
            </div>
            {u.kind === 'staff' ? (
              <select aria-label={`Role for ${u.name}`} value={u.role} disabled={update.isPending} onChange={(e) => update.mutate({ id: u.id, role: e.target.value })} style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${c.bdr}`, background: c.card, color: c.txt, fontSize: 12.5 }}>
                {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: c.txt2, padding: '4px 8px', borderRadius: 9999, background: `${c.txt3}18` }} title="Role comes from the linked identity">{u.role}</span>
            )}
            <button disabled={update.isPending} onClick={() => update.mutate({ id: u.id, active: !u.active })} style={{ padding: '6px 12px', borderRadius: 9999, border: `1px solid ${u.active ? c.err : c.ok}`, background: 'transparent', color: u.active ? c.err : c.ok, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {u.active ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        ))}
        {data && data.items.length === 0 && <p style={{ fontSize: 12.5, color: c.txt2, padding: 14 }}>No accounts match.</p>}
      </Card>
      <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 8, lineHeight: 1.5 }}>Accounts appear after their first sign-in. Every change is written to the audit trail. You cannot change your own account.</p>
    </div>
  )
}

import { http, HttpResponse } from 'msw'
import { permissionsForRole, type Role } from '@/lib/rbac/roles'
import { db } from '../db'

const mkTokens = () => ({
  accessToken: `mock.access.${Date.now()}`,
  refreshToken: `mock.refresh.${Date.now()}`,
  expiresIn: 3600,
})

/**
 * Mock auth backend. Mirrors a real OTP → verify → session flow. Any 6-digit
 * OTP is accepted (as the prototype did) so the happy path is demoable; the
 * request/response *shapes* are production-accurate, so a real backend drops in
 * without client changes.
 *
 * Like the real backend, `verify` never takes a role (it always signs in the
 * citizen) and Demo Mode personas go through `/auth/demo`.
 */

const session = (role: Role) => ({
  tokens: mkTokens(),
  citizen: db.citizen,
  role,
  permissions: permissionsForRole(role),
  session: { id: `sess_${Date.now()}` },
})
export const authHandlers = [
  http.post('/api/auth/otp/request', () => HttpResponse.json({ sent: true, channel: 'sms' })),

  http.post('/api/auth/verify', () => HttpResponse.json(session('citizen'))),

  http.post('/api/auth/demo', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { persona?: Role }
    return HttpResponse.json(session(body.persona ?? 'citizen'))
  }),

  http.post('/api/auth/refresh', () => HttpResponse.json(mkTokens())),

  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
]

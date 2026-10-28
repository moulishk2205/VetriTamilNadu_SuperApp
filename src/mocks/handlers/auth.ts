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
 * Phase 3: `verify` accepts an optional `role` (citizen default) and returns
 * that role's RBAC permission set — this powers the Officer / MLA / Admin
 * portals and Demo Mode persona switching through the same session pipeline.
 */
export const authHandlers = [
  http.post('/api/auth/otp/request', () => HttpResponse.json({ sent: true, channel: 'sms' })),

  http.post('/api/auth/verify', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { role?: Role }
    const role: Role = body.role ?? 'citizen'
    return HttpResponse.json({
      tokens: mkTokens(),
      citizen: db.citizen,
      role,
      permissions: permissionsForRole(role),
      session: { id: `sess_${Date.now()}` },
    })
  }),

  http.post('/api/auth/refresh', () => HttpResponse.json(mkTokens())),

  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
]

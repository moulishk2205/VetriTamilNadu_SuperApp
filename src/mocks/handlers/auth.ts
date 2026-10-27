import { http, HttpResponse } from 'msw'
import { permissionsForRole, type Role } from '@/lib/rbac/roles'
import { db } from '../db'

/** Mock tokens carry the persona's role, so a reload can restore it via /auth/me. */
const mkTokens = (role: Role) => ({
  accessToken: `mock.access.${role}.${Date.now()}`,
  refreshToken: `mock.refresh.${role}.${Date.now()}`,
  expiresIn: 3600,
})

const ROLES: Role[] = ['citizen', 'officer', 'department', 'mla', 'admin']
const asRole = (value: unknown): Role => (ROLES.includes(value as Role) ? (value as Role) : 'citizen')
const roleIn = (token: string | null | undefined): Role => asRole(token?.split('.')[2])

/**
 * Mock auth backend. Mirrors a real OTP → verify → session flow. Any 6-digit
 * OTP is accepted (as the prototype did) so the happy path is demoable; the
 * request/response *shapes* are production-accurate, so a real backend drops in
 * without client changes.
 *
 * Like the real backend, `verify` never takes a role (it always signs in the
 * citizen), Demo Mode personas go through `/auth/demo`, and the profile is
 * re-read from `/auth/me` after a reload.
 */

const profile = (role: Role) => ({ citizen: db.citizen, role, permissions: permissionsForRole(role) })
const session = (role: Role) => ({ tokens: mkTokens(role), ...profile(role), session: { id: `sess_${Date.now()}` } })

export const authHandlers = [
  http.post('/api/auth/otp/request', () => HttpResponse.json({ sent: true, channel: 'sms' })),

  http.post('/api/auth/verify', () => HttpResponse.json(session('citizen'))),

  http.post('/api/auth/demo', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { persona?: string }
    return HttpResponse.json(session(asRole(body.persona)))
  }),

  http.get('/api/auth/me', ({ request }) => {
    const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '')
    if (!bearer) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    return HttpResponse.json(profile(roleIn(bearer)))
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { refreshToken?: string }
    return HttpResponse.json(mkTokens(roleIn(body.refreshToken)))
  }),

  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
]

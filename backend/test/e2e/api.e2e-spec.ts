/**
 * End-to-end checks against a running API with demo data:
 *   AUTH_MOCK=true SEED_ON_BOOT=true docker compose up -d
 *   E2E_BASE_URL=http://localhost:4000 npm run test:e2e
 * Each run uses 1 OTP request and 2 OTP verifies, within the limit of
 * 5 per minute per route.
 */
const BASE = (process.env.E2E_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '')

interface Call { status: number; body: any; text: string; type: string }

async function call(method: string, path: string, opts: { token?: string; body?: unknown; raw?: string } = {}): Promise<Call> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(opts.body !== undefined || opts.raw !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  })
  const text = await res.text()
  let body: any = null
  try { body = JSON.parse(text) } catch { /* not JSON */ }
  return { status: res.status, body, text, type: res.headers.get('content-type') ?? '' }
}

const demo = async (persona: string) => {
  const r = await call('POST', '/api/auth/demo', { body: { persona } })
  expect(r.status).toBe(201)
  return r.body as { tokens: { accessToken: string; refreshToken: string }; role: string }
}

describe('Platform', () => {
  it('reports healthy, with the database reachable', async () => {
    expect((await call('GET', '/health')).status).toBe(200)
  })

  it('answers malformed JSON with a generic 400', async () => {
    const r = await call('POST', '/api/auth/otp/request', { raw: '{"identifier":' })
    expect(r.status).toBe(400)
    expect(r.body.message).toBe('Malformed request body')
  })
})

describe('Sign-in and sessions', () => {
  const mobile = '9876543210'

  it('signs in with a one-time code, and a wrong code fails', async () => {
    const req = await call('POST', '/api/auth/otp/request', { body: { identifier: mobile } })
    expect(req.status).toBe(201)
    expect(req.body).toMatchObject({ sent: true, demoOtp: '123456' })

    expect((await call('POST', '/api/auth/verify', { body: { method: 'otp', identifier: mobile, otp: '000000' } })).status).toBe(401)

    const ok = await call('POST', '/api/auth/verify', { body: { method: 'otp', identifier: mobile, otp: '123456' } })
    expect(ok.status).toBe(201)
    expect(ok.body.role).toBe('citizen')
    const me = await call('GET', '/api/auth/me', { token: ok.body.tokens.accessToken })
    expect(me.status).toBe(200)
  })

  it('rejects requests without a token', async () => {
    expect((await call('GET', '/api/auth/me')).status).toBe(401)
    expect((await call('GET', '/api/auth/me', { token: 'not-a-jwt' })).status).toBe(401)
  })

  it('rotates refresh tokens and refuses a replayed one', async () => {
    const { tokens } = await demo('citizen')
    const first = await call('POST', '/api/auth/refresh', { body: { refreshToken: tokens.refreshToken } })
    expect(first.status).toBe(201)
    expect(first.body.refreshToken).not.toBe(tokens.refreshToken)
    expect((await call('POST', '/api/auth/refresh', { body: { refreshToken: tokens.refreshToken } })).status).toBe(401)
  })

  it('ends the session on logout, so the access token stops working at once', async () => {
    const { tokens } = await demo('officer')
    expect((await call('GET', '/api/auth/me', { token: tokens.accessToken })).status).toBe(200)
    expect((await call('POST', '/api/auth/logout', { token: tokens.accessToken })).status).toBe(204)
    expect((await call('GET', '/api/auth/me', { token: tokens.accessToken })).status).toBe(401)
    expect((await call('POST', '/api/auth/refresh', { body: { refreshToken: tokens.refreshToken } })).status).toBe(401)
  })
})

describe('Role-based access', () => {
  let citizen: string, officer: string, admin: string
  beforeAll(async () => {
    citizen = (await demo('citizen')).tokens.accessToken
    officer = (await demo('officer')).tokens.accessToken
    admin = (await demo('admin')).tokens.accessToken
  })

  it('keeps administration to administrators', async () => {
    expect((await call('GET', '/api/admin/trust', { token: citizen })).status).toBe(403)
    expect((await call('GET', '/api/admin/trust', { token: officer })).status).toBe(403)
    expect((await call('GET', '/api/admin/trust', { token: admin })).status).toBe(200)
  })

  it('keeps the officer worklist to officers', async () => {
    expect((await call('GET', '/api/officer/queue', { token: citizen })).status).toBe(403)
    expect((await call('GET', '/api/officer/queue', { token: officer })).status).toBe(200)
  })

  it('keeps citizen notifications to citizens', async () => {
    expect((await call('GET', '/api/notifications', { token: citizen })).status).toBe(200)
    expect((await call('GET', '/api/notifications', { token: admin })).status).toBe(403)
  })

  it('verifies the audit hash chain end to end', async () => {
    const r = await call('GET', '/api/admin/audit/verify', { token: admin })
    expect(r.status).toBe(200)
    expect(r.body.valid).toBe(true)
    expect(r.body.chained).toBeGreaterThan(0)
  })
})

describe('Open-standard exports', () => {
  let admin: string
  beforeAll(async () => { admin = (await demo('admin')).tokens.accessToken })

  it('exports the workflow as BPMN 2.0', async () => {
    const r = await call('GET', '/api/workflows/gov.standard.v1/bpmn', { token: admin })
    expect(r.status).toBe(200)
    expect(r.type).toContain('application/xml')
    expect(r.text).toContain('xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"')
  })

  it('exports the scheme eligibility rules as DMN 1.3', async () => {
    const r = await call('GET', '/api/workflows/eligibility/dmn', { token: admin })
    expect(r.status).toBe(200)
    expect(r.type).toContain('application/xml')
    expect(r.text).toContain('xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"')
    expect(r.text).toContain('<decisionTable')
  })
})

describe('Certificate verification (public QR check)', () => {
  it('accepts the genuine signature and refuses a forged one', async () => {
    const { tokens } = await demo('citizen')
    const docs = await call('GET', '/api/documents', { token: tokens.accessToken })
    expect(docs.status).toBe(200)
    const doc = (docs.body.items as { number: string; verifySig: string; status: string }[]).find((d) => d.status === 'verified')
    expect(doc).toBeDefined()

    const good = await call('GET', `/api/verify/${encodeURIComponent(doc!.number)}?s=${doc!.verifySig}`)
    expect(good.status).toBe(200)
    expect(good.body.authentic).toBe(true)

    const forged = await call('GET', `/api/verify/${encodeURIComponent(doc!.number)}?s=${'0'.repeat(24)}`)
    expect(forged.body.authentic).toBe(false)
  })
})

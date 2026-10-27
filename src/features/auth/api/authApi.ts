import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import { TokenPairSchema } from '@/types/models/session'
import { CitizenSchema } from '@/types/models/citizen'

/** Auth method + identifier the citizen used. There is no role: the backend
 *  takes it from the user record. */
export interface Credentials {
  method: 'otp' | 'aadhaar' | 'biometric'
  identifier?: string
  otp?: string
}

export type DemoPersona = 'citizen' | 'officer' | 'department' | 'mla' | 'admin'

const RequestOtpResponse = z.object({ sent: z.boolean(), channel: z.string() })

const VerifyResponse = z.object({
  tokens: TokenPairSchema,
  citizen: CitizenSchema.nullable(),
  role: z.enum(['citizen', 'officer', 'department', 'mla', 'admin']).default('citizen'),
  permissions: z.array(z.string()),
  session: z.object({ id: z.string() }),
})
export type VerifyResult = z.infer<typeof VerifyResponse>

/**
 * Auth API. In Phase 1 these hit MSW; going live means the same calls reach the
 * real backend (e.g. NestJS + a DLT-registered SMS aggregator + AUA/KUA eKYC).
 * `auth: false` marks endpoints that must not carry a bearer token.
 */
export const authApi = {
  requestOtp: (identifier: string, method: string) =>
    apiClient.post('/auth/otp/request', { identifier, method }, { schema: RequestOtpResponse, auth: false }),

  verify: (cred: Credentials): Promise<VerifyResult> =>
    apiClient.post('/auth/verify', cred, { schema: VerifyResponse, auth: false }),

  /** Demo Mode persona sign-in. The backend serves it only when AUTH_MOCK is on. */
  demo: (persona: DemoPersona): Promise<VerifyResult> =>
    apiClient.post('/auth/demo', { persona }, { schema: VerifyResponse, auth: false }),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }, { schema: TokenPairSchema, auth: false }),

  logout: (): Promise<void> =>
    apiClient.post('/auth/logout').then(() => undefined).catch(() => undefined),
}

import { z } from 'zod'

export const AuthMethod = z.enum(['otp', 'aadhaar', 'biometric'])
export type AuthMethod = z.infer<typeof AuthMethod>

export const DeviceSchema = z.object({
  id: z.string(),
  label: z.string(),
  lastActiveAt: z.string(),
  current: z.boolean().default(false),
})
export type Device = z.infer<typeof DeviceSchema>

export const SessionSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  method: AuthMethod,
  createdAt: z.string(),
  lastLoginAt: z.string(),
  device: z.string().optional(),
  ip: z.string().optional(),
  location: z.string().optional(),
})
export type Session = z.infer<typeof SessionSchema>

/** Access + refresh token pair returned by the auth backend. */
export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int(),
})
export type TokenPair = z.infer<typeof TokenPairSchema>

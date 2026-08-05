import { z } from 'zod'

export const VerificationStatus = z.enum(['verified', 'pending', 'expired', 'revoked'])
export type VerificationStatus = z.infer<typeof VerificationStatus>

/**
 * A wallet document. Mirrors a DigiLocker-style verified credential; the
 * Document Engine (CP5) handles download/preview/QR/verify against this shape.
 */
export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  number: z.string(),
  issuer: z.string(),
  holderName: z.string(),
  dob: z.string().optional(),
  validity: z.string(),
  status: VerificationStatus,
  color: z.string(),
  issuedAt: z.string().optional(),
  version: z.number().int().default(1),
  fileUrl: z.string().optional(),
})
export type WalletDocument = z.infer<typeof DocumentSchema>

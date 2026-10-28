import { z } from 'zod'

// ── Certificate ─────────────────────────────────────────────────────────────
export const CertificateSchema = z.object({
  id: z.string(),
  type: z.string(),
  number: z.string(),
  citizenId: z.string(),
  issuedAt: z.string(),
  validUntil: z.string().optional(),
  fileUrl: z.string().optional(),
})
export type Certificate = z.infer<typeof CertificateSchema>

// ── Payment ─────────────────────────────────────────────────────────────────
export const PaymentStatus = z.enum(['pending', 'paid', 'failed', 'refunded'])
export type PaymentStatus = z.infer<typeof PaymentStatus>
export const PaymentSchema = z.object({
  id: z.string(),
  citizenId: z.string(),
  applicationId: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().default('INR'),
  status: PaymentStatus,
  method: z.string().optional(),
  createdAt: z.string(),
})
export type Payment = z.infer<typeof PaymentSchema>

// ── Audit log ───────────────────────────────────────────────────────────────
export const AuditLogSchema = z.object({
  id: z.string(),
  actor: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  at: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type AuditLog = z.infer<typeof AuditLogSchema>

// ── Search ──────────────────────────────────────────────────────────────────
export const SearchResultSchema = z.object({
  id: z.string(),
  kind: z.enum(['service', 'document', 'application', 'complaint', 'scheme', 'department']),
  title: z.string(),
  subtitle: z.string().optional(),
  path: z.string(),
})
export type SearchResult = z.infer<typeof SearchResultSchema>

// ── Transparency (MLA / District) ───────────────────────────────────────────
export const MlaProjectSchema = z.object({ name: z.string(), status: z.string(), progress: z.number(), budget: z.string() })
export const MlaDashboardSchema = z.object({
  constituency: z.string(),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), icon: z.string(), color: z.string() })),
  projects: z.array(MlaProjectSchema),
})
export type MlaDashboard = z.infer<typeof MlaDashboardSchema>

export const DistrictScorecardSchema = z.object({
  district: z.string(),
  score: z.number(),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), progress: z.number(), color: z.string() })),
})
export type DistrictScorecard = z.infer<typeof DistrictScorecardSchema>

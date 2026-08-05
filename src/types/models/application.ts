import { z } from 'zod'

/**
 * Canonical lifecycle every government service application moves through.
 * The Application Engine (CP5) enforces the legal transitions between these.
 */
export const ApplicationStatus = z.enum([
  'draft',
  'submitted',
  'verification',
  'officerAssigned',
  'inspection',
  'pending',
  'approved',
  'rejected',
  'correctionRequested',
  'completed',
])
export type ApplicationStatus = z.infer<typeof ApplicationStatus>

export const TimelineEventSchema = z.object({
  id: z.string(),
  status: ApplicationStatus,
  label: z.string(),
  at: z.string(),
  note: z.string().optional(),
  actor: z.string().optional(),
})
export type TimelineEvent = z.infer<typeof TimelineEventSchema>

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string().optional(),
  kind: z.enum(['photo', 'video', 'audio', 'file']).default('file'),
})
export type Attachment = z.infer<typeof AttachmentSchema>

/**
 * A single application against a service. This one shape backs Service Tracker
 * today and every service form Phase 2 adds — the `serviceId` selects which.
 */
export const ApplicationSchema = z.object({
  id: z.string(),
  referenceNo: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  citizenId: z.string(),
  status: ApplicationStatus,
  departmentId: z.string().optional(),
  officerId: z.string().optional(),
  officer: z.object({ name: z.string(), designation: z.string(), jurisdiction: z.string() }).optional(),
  slaDeadline: z.string().optional(),
  slaDaysRemaining: z.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeline: z.array(TimelineEventSchema).default([]),
  attachments: z.array(AttachmentSchema).default([]),
  remarks: z.array(z.object({ at: z.string(), by: z.string(), text: z.string() })).default([]),
  fields: z.record(z.string(), z.unknown()).default({}),
})
export type Application = z.infer<typeof ApplicationSchema>

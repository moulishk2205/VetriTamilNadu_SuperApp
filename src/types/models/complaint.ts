import { z } from 'zod'

export const ComplaintPriority = z.enum(['Low', 'Medium', 'High'])
export type ComplaintPriority = z.infer<typeof ComplaintPriority>

export const ComplaintStatus = z.enum(['submitted', 'assigned', 'inProgress', 'resolved', 'closed', 'escalated'])
export type ComplaintStatus = z.infer<typeof ComplaintStatus>

export const ComplaintSchema = z.object({
  id: z.string(),
  referenceNo: z.string(),
  citizenId: z.string(),
  category: z.string(),
  description: z.string(),
  priority: ComplaintPriority,
  status: ComplaintStatus,
  departmentId: z.string().nullish(),
  department: z.string().nullish(),
  etaDays: z.number().int().nullish(),
  /** What the officer did; shown to the citizen once resolved. */
  resolutionNote: z.string().nullish(),
  resolvedAt: z.string().nullish(),
  // The API returns explicit nulls for unset coordinates, so accept null as
  // well as undefined — `.optional()` alone rejects null and fails the parse.
  location: z
    .object({
      ward: z.string().nullish(),
      area: z.string().nullish(),
      lat: z.number().nullish(),
      lng: z.number().nullish(),
    })
    .nullish(),
  attachmentIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Complaint = z.infer<typeof ComplaintSchema>

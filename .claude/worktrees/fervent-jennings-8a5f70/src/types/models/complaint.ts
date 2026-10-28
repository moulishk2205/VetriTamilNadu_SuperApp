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
  departmentId: z.string().optional(),
  department: z.string().optional(),
  etaDays: z.number().int().optional(),
  location: z.object({ ward: z.string().optional(), area: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() }).optional(),
  attachmentIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Complaint = z.infer<typeof ComplaintSchema>

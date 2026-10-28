import { z } from 'zod'
import { apiClient } from '@/lib/api/client'

/** Application DTO returned by the applications backend (view over the DB model). */
const TimelineRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(['done', 'current', 'pending']),
  at: z.string().optional(),
})

export const ApplicationDTOSchema = z.object({
  id: z.string(),
  referenceNo: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  status: z.string(),
  stage: z.string(),
  department: z.string(),
  officer: z.object({ name: z.string(), designation: z.string(), jurisdiction: z.string() }).nullable(),
  slaDaysRemaining: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeline: z.array(TimelineRowSchema),
  fields: z.record(z.string(), z.unknown()),
  documents: z.array(z.object({ requirementId: z.string(), name: z.string(), source: z.string(), walletDocId: z.string().optional() })).default([]),
  remarks: z.array(z.object({ at: z.string(), by: z.string(), text: z.string() })).default([]),
})
export type ApplicationDTO = z.infer<typeof ApplicationDTOSchema>

const PageSchema = z.object({ items: z.array(ApplicationDTOSchema), total: z.number(), page: z.number(), pageSize: z.number() })

export interface AttachedDocument {
  requirementId: string
  name: string
  source: string
  walletDocId?: string
}

export interface CreateApplicationInput {
  serviceId: string
  fields: Record<string, unknown>
  documents?: AttachedDocument[]
}

export const applicationsApi = {
  list: (): Promise<ApplicationDTO[]> => apiClient.get('/applications', { schema: PageSchema }).then((r) => r.items),
  get: (id: string): Promise<ApplicationDTO> => apiClient.get(`/applications/${id}`, { schema: ApplicationDTOSchema }),
  create: (input: CreateApplicationInput): Promise<ApplicationDTO> => apiClient.post('/applications', input, { schema: ApplicationDTOSchema }),
  advance: (id: string): Promise<ApplicationDTO> => apiClient.post(`/applications/${id}/advance`, undefined, { schema: ApplicationDTOSchema }),
}

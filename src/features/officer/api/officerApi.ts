import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import { ApplicationDTOSchema, type ApplicationDTO } from '@/features/applications/api/applicationsApi'

const QueueSchema = z.object({
  officer: z.object({ name: z.string(), designation: z.string(), jurisdiction: z.string() }),
  items: z.array(ApplicationDTOSchema),
  total: z.number(),
})
export type OfficerQueue = z.infer<typeof QueueSchema>

const StatsSchema = z.object({
  pending: z.number(),
  dueToday: z.number(),
  highPriority: z.number(),
  escalated: z.number(),
  corrections: z.number(),
  completedThisMonth: z.number(),
  avgProcessingDays: z.number(),
  approvalRate: z.number(),
  citizenRating: z.number(),
  slaCompliance: z.number(),
  departmentRank: z.number(),
})
export type OfficerStats = z.infer<typeof StatsSchema>

export type OfficerAction = 'approve' | 'reject' | 'correction' | 'escalate' | 'transfer'

export const officerApi = {
  queue: (): Promise<OfficerQueue> => apiClient.get('/officer/queue', { schema: QueueSchema }),
  /** One application in the officer's jurisdiction (GET /applications/:id is citizen-only). */
  get: (id: string): Promise<ApplicationDTO> => apiClient.get(`/officer/applications/${id}`, { schema: ApplicationDTOSchema }),
  stats: (): Promise<OfficerStats> => apiClient.get('/officer/stats', { schema: StatsSchema }),
  act: (id: string, action: OfficerAction, note?: string): Promise<ApplicationDTO> =>
    apiClient.post(`/officer/applications/${id}/action`, { action, note }, { schema: ApplicationDTOSchema }),
}

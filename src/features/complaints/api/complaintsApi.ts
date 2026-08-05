import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import { ComplaintSchema, type Complaint } from '@/types/models/complaint'

export interface CreateComplaintInput {
  category: string
  description: string
  location?: { ward?: string; area?: string; lat?: number; lng?: number }
  attachmentIds?: string[]
}

export const complaintsApi = {
  create: (input: CreateComplaintInput): Promise<Complaint> =>
    apiClient.post('/complaints', input, { schema: ComplaintSchema }),
  list: (): Promise<Complaint[]> =>
    apiClient.get('/complaints', { schema: z.object({ items: z.array(ComplaintSchema), total: z.number(), page: z.number(), pageSize: z.number() }) }).then((r) => r.items),
}

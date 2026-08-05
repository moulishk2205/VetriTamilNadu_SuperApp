import { apiClient } from '@/lib/api/client'
import { PageSchema } from '@/types/models/common'
import { SchemeSchema, type Scheme } from '@/types/models/scheme'

export const schemesApi = {
  list: (): Promise<Scheme[]> =>
    apiClient.get('/schemes', { schema: PageSchema(SchemeSchema) }).then((r) => r.items),
}

import { apiClient } from '@/lib/api/client'
import { PageSchema } from '@/types/models/common'
import { SearchResultSchema, type SearchResult } from '@/types/models/misc'

export const searchApi = {
  query: (q: string): Promise<SearchResult[]> =>
    apiClient.get('/search', { query: { q }, schema: PageSchema(SearchResultSchema) }).then((r) => r.items),
}

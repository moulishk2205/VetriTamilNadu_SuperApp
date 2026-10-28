import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/searchApi'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'

/**
 * Universal search hook. Queries the index (debounce at the call site) and
 * exposes recent-search recording. Voice/AI search plug in here in Phase 2.
 */
export function useSearch(q: string) {
  const record = useSearchHistoryStore((s) => s.record)
  const recent = useSearchHistoryStore((s) => s.recent)
  const query = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchApi.query(q),
    enabled: q.trim().length > 0,
  })
  return { ...query, recent, record }
}

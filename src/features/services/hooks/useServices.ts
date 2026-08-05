import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveIcon } from '@/components/ui/iconRegistry'
import { servicesApi } from '../api/servicesApi'

export const serviceKeys = {
  list: ['services'] as const,
  categories: ['service-categories'] as const,
}

/** Category chips for ServicesHub: {id, l}. */
export function useServiceCategoriesView(): { id: string; l: string }[] {
  const { data } = useQuery({ queryKey: serviceKeys.categories, queryFn: servicesApi.categories })
  return useMemo(() => (data ?? []).map((cat) => ({ id: cat.id, l: cat.label })), [data])
}

/** Service rows for ServicesHub: {id, n, cat, time, fee, icon, pop}. */
export interface ServiceRow {
  id: string
  n: string
  cat: string
  time: string
  fee: string
  icon: ReturnType<typeof resolveIcon>
  pop: boolean
}
export function useServiceCatalogView(): ServiceRow[] {
  const { data } = useQuery({ queryKey: serviceKeys.list, queryFn: servicesApi.list })
  return useMemo(
    () => (data ?? []).map((s) => ({ id: s.id, n: s.name, cat: s.category, time: s.processingTime, fee: s.fee, icon: resolveIcon(s.icon), pop: s.popular })),
    [data],
  )
}

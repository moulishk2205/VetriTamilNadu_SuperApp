import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { serviceLook, type ServiceLook } from '../serviceLook'
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

/**
 * The catalogue API writes fees as "Rs.60"; the service pages write "₹60".
 * Listings use the rupee sign too, so a fee reads the same on every screen.
 */
const formatFee = (fee: string): string => fee.replace(/^Rs\.?\s*/i, '₹')

/** True until the catalogue has loaded once — lets listings show a skeleton, not "no results". */
export function useServiceCatalogLoading(): boolean {
  return useQuery({ queryKey: serviceKeys.list, queryFn: servicesApi.list }).isLoading
}

/** Service rows for the listings: {id, n, cat, time, fee, icon, colour, pop}. Icon and colour come from the shared service look. */
export interface ServiceRow {
  id: string
  n: string
  cat: string
  time: string
  fee: string
  icon: ServiceLook['Icon']
  colour: string
  pop: boolean
}
export function useServiceCatalogView(): ServiceRow[] {
  const { data } = useQuery({ queryKey: serviceKeys.list, queryFn: servicesApi.list })
  return useMemo(
    () => (data ?? []).map((s) => {
      const look = serviceLook(s.id, s.icon, s.category)
      return { id: s.id, n: s.name, cat: s.category, time: s.processingTime, fee: formatFee(s.fee), icon: look.Icon, colour: look.colour, pop: s.popular }
    }),
    [data],
  )
}

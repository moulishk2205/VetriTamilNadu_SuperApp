import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { schemesApi } from '../api/schemesApi'

export const schemeKeys = { all: ['schemes'] as const }

/** View shape consumed by SchemeDiscovery: {n, b, m, d, cl}. */
export interface SchemeCard {
  n: string
  b: string
  m: number
  d: string
  cl: string
}

export function useSchemeCards(): SchemeCard[] {
  const { data } = useQuery({ queryKey: schemeKeys.all, queryFn: schemesApi.list })
  return useMemo(() => (data ?? []).map((s) => ({ n: s.name, b: s.benefit, m: s.matchScore, d: s.department, cl: s.color })), [data])
}

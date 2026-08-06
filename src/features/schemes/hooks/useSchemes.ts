import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { schemesApi } from '../api/schemesApi'

export const schemeKeys = { all: ['schemes'] as const }

/** View shape consumed by SchemeDiscovery: {n, b, m, d, cl}. */
export interface SchemeCard {
  n: string
  /** Tamil name, when published in the 2026 catalogue. */
  nTa?: string
  b: string
  bTa?: string
  m: number
  d: string
  cl: string
  budget?: string
}

export function useSchemeCards(): SchemeCard[] {
  const { data } = useQuery({ queryKey: schemeKeys.all, queryFn: schemesApi.list })
  return useMemo(() => (data ?? []).map((s) => ({ n: s.name, nTa: s.nameTamil, b: s.benefit, bTa: s.benefitTamil, m: s.matchScore, d: s.department, cl: s.color, budget: s.budget })), [data])
}

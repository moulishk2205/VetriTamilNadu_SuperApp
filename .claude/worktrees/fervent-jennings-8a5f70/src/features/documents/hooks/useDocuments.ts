import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '../api/documentsApi'

export const documentKeys = { all: ['documents'] as const }

export function useDocumentsQuery() {
  return useQuery({ queryKey: documentKeys.all, queryFn: documentsApi.list })
}

/** View shape consumed by DigitalWallet, mapped from the domain model. */
export interface DocumentCard {
  n: string
  id: string
  v: string
  tp: string
  cl: string
  h: string
  dob?: string
}

export function useWalletDocumentCards(): DocumentCard[] {
  const { data } = useDocumentsQuery()
  return useMemo(
    () => (data ?? []).map((d) => ({ n: d.name, id: d.number, v: d.validity, tp: d.type, cl: d.color, h: d.holderName, dob: d.dob })),
    [data],
  )
}

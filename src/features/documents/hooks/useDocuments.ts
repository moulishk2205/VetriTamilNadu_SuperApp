import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { documentLook, type ServiceLook } from '@/features/services/serviceLook'
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
  /** The issuing service's colour, so a document matches its service everywhere. */
  cl: string
  icon: ServiceLook['Icon']
  h: string
  dob?: string
  /** Signature for the public verification link behind the certificate QR. */
  sig?: string
}

export function useWalletDocumentCards(): DocumentCard[] {
  const { data } = useDocumentsQuery()
  return useMemo(
    () => (data ?? []).map((d) => {
      const look = documentLook(d.name)
      return { n: d.name, id: d.number, v: d.validity, tp: d.type, cl: look?.colour ?? d.color, icon: look?.Icon ?? FileText, h: d.holderName, dob: d.dob, sig: d.verifySig }
    }),
    [data],
  )
}

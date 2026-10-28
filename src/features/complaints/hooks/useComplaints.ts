import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { complaintsApi, type CreateComplaintInput } from '../api/complaintsApi'

export const complaintKeys = { all: ['complaints'] as const }

/** The citizen's filed complaints. Shared by the mobile and desktop shells. */
export function useComplaintsQuery() {
  return useQuery({ queryKey: complaintKeys.all, queryFn: complaintsApi.list })
}

/** File a complaint. Returns the created complaint (with generated reference). */
export function useCreateComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateComplaintInput) => complaintsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
    },
  })
}

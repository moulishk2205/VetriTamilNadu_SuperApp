import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '../api/applicationsApi'

export const applicationKeys = {
  all: ['applications'] as const,
  detail: (id: string) => ['applications', id] as const,
}

export function useApplicationsQuery() {
  return useQuery({ queryKey: applicationKeys.all, queryFn: applicationsApi.list })
}

export function useApplicationQuery(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => applicationsApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

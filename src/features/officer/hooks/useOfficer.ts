import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { officerApi, type OfficerAction } from '../api/officerApi'
import { LIVE } from '@/lib/api/live'

export const officerKeys = {
  queue: ['officer', 'queue'] as const,
  stats: ['officer', 'stats'] as const,
  application: (id: string) => ['officer', 'application', id] as const,
}

export function useOfficerQueue() {
  return useQuery({ queryKey: officerKeys.queue, queryFn: officerApi.queue, ...LIVE })
}

export function useOfficerApplication(id: string | undefined) {
  return useQuery({ queryKey: officerKeys.application(id ?? ''), queryFn: () => officerApi.get(id as string), enabled: Boolean(id), ...LIVE })
}

export function useOfficerStats() {
  return useQuery({ queryKey: officerKeys.stats, queryFn: officerApi.stats, ...LIVE })
}

export function useOfficerAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: OfficerAction; note?: string }) => officerApi.act(id, action, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['officer'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

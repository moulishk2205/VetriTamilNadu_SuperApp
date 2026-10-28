import type { ComplaintPriority } from '@/types/models/complaint'

/**
 * Complaint department-routing rules. Extracted from the UI so the same logic
 * drives the on-screen review preview AND the backend that actually files the
 * complaint — no business logic left in the component.
 */
export interface ComplaintRouting {
  priority: ComplaintPriority
  etaDays: number
  etaLabel: string
  department: string
}

export function routeComplaint(category: string): ComplaintRouting {
  const high = ['Road Damage', 'Water Supply'].includes(category)
  const medium = ['Streetlight', 'Drainage'].includes(category)
  const priority: ComplaintPriority = high ? 'High' : medium ? 'Medium' : 'Low'
  const etaDays = high ? 5 : 7
  const department = ['Road Damage', 'Streetlight'].includes(category) ? 'GCC - Highways' : 'Metro Water / GCC'
  return { priority, etaDays, etaLabel: `${etaDays} days`, department }
}

import { Priority } from '@prisma/client'

/** Complaint department-routing rules — identical to the frontend's `features/complaints/routing.ts`. */
export interface ComplaintRouting {
  priorityLabel: 'High' | 'Medium' | 'Low'
  priority: Priority
  etaDays: number
  department: string
}

export function routeComplaint(category: string): ComplaintRouting {
  const high = ['Road Damage', 'Water Supply'].includes(category)
  const medium = ['Streetlight', 'Drainage'].includes(category)
  const priorityLabel = high ? 'High' : medium ? 'Medium' : 'Low'
  const priority = high ? Priority.HIGH : medium ? Priority.MEDIUM : Priority.LOW
  const etaDays = high ? 5 : 7
  const department = ['Road Damage', 'Streetlight'].includes(category) ? 'GCC - Highways' : 'Metro Water / GCC'
  return { priorityLabel, priority, etaDays, department }
}

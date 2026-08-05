import { http, HttpResponse } from 'msw'
import { routeComplaint } from '@/features/complaints/routing'
import { startWorkflow } from '@/lib/workflow/engine'

let seq = 452

/**
 * Complaints backend. On create it generates a real reference number, applies
 * department-routing rules, and starts a Government Workflow instance — proving
 * the Application/Workflow Engine drives a real submission end to end.
 */
export const complaintHandlers = [
  http.post('/api/complaints', async ({ request }) => {
    const input = (await request.json()) as { category: string; description: string; location?: unknown }
    const routing = routeComplaint(input.category)
    seq += 1
    const referenceNo = `CMP-TN-2026-${String(seq).padStart(6, '0')}`
    const now = new Date().toISOString()
    const workflow = startWorkflow('gov.standard.v1', now)

    return HttpResponse.json({
      id: `cmp_${seq}`,
      referenceNo,
      citizenId: 'ctz_chandy',
      category: input.category,
      description: input.description,
      priority: routing.priority,
      status: workflow.currentStage === 'submitted' ? 'submitted' : 'submitted',
      department: routing.department,
      etaDays: routing.etaDays,
      location: (input.location as Record<string, unknown>) ?? undefined,
      attachmentIds: [],
      createdAt: now,
      updatedAt: now,
    })
  }),

  http.get('/api/complaints', () =>
    HttpResponse.json({
      items: [
        { id: 'cmp_452', referenceNo: 'CMP-TN-000452', citizenId: 'ctz_chandy', category: 'Road Damage', description: 'Road damage on TTK Road', priority: 'High', status: 'inProgress', department: 'GCC - Highways', etaDays: 5, attachmentIds: [], createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-05T00:00:00Z' },
      ],
      total: 1,
      page: 0,
      pageSize: 1,
    }),
  ),
]

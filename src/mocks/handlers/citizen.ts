import { http, HttpResponse } from 'msw'
import { db } from '../db'

export const citizenHandlers = [
  http.get('/api/citizen/me', () => HttpResponse.json(db.citizen)),
  http.patch('/api/citizen/me', async ({ request }) => {
    const patch = (await request.json()) as Record<string, unknown>
    Object.assign(db.citizen, patch)
    return HttpResponse.json(db.citizen)
  }),
]

import { http, HttpResponse } from 'msw'
import { db } from '../db'

const page = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

export const documentHandlers = [
  http.get('/api/documents', () => HttpResponse.json(page(db.documents))),
  http.get('/api/documents/:id', ({ params }) => {
    const doc = db.documents.find((d) => d.id === params.id)
    return doc ? HttpResponse.json(doc) : new HttpResponse(null, { status: 404 })
  }),
]

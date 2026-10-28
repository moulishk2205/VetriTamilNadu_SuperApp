import { http, HttpResponse } from 'msw'
import { db } from '../db'
import type { SearchResult } from '@/types/models/misc'

/**
 * Universal search index. Indexes services, documents, and schemes (Phase 2 adds
 * applications + complaints). A real backend replaces this with a proper search
 * service; the SearchResult contract stays the same.
 */
function buildIndex(): SearchResult[] {
  return [
    ...db.services.map((s): SearchResult => ({ id: s.id, kind: 'service', title: s.name, subtitle: `${s.processingTime} · ${s.fee}`, path: '/services' })),
    ...db.documents.map((d): SearchResult => ({ id: d.id, kind: 'document', title: d.name, subtitle: d.number, path: '/wallet' })),
    ...db.schemes.map((s): SearchResult => ({ id: s.id, kind: 'scheme', title: s.name, subtitle: [s.benefit, s.nameTamil, s.benefitTamil].filter(Boolean).join(' · '), path: '/schemes' })),
  ]
}

export const searchHandlers = [
  http.get('/api/search', ({ request }) => {
    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase().trim()
    const index = buildIndex()
    const results = q ? index.filter((r) => r.title.toLowerCase().includes(q) || (r.subtitle ?? '').toLowerCase().includes(q)) : index
    return HttpResponse.json({ items: results, total: results.length, page: 0, pageSize: results.length })
  }),
]

import { http, HttpResponse } from 'msw'
import { SERVICE_META } from '@/features/services/catalog/meta'
import type { ServiceCatalogItem } from '@/types/models/service'
import { db } from '../db'

const page = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

const POPULAR = new Set(['svc_income', 'svc_birth', 'svc_dl', 'svc_community'])

/** Real flagship services drive the Services Hub now (was placeholder data). */
const catalogItems: ServiceCatalogItem[] = SERVICE_META.map((m) => ({
  id: m.id,
  name: m.name,
  category: m.category,
  processingTime: m.processingTime.split('(')[0].trim(),
  fee: m.fee,
  popular: POPULAR.has(m.id),
  icon: m.icon,
}))

/** Services catalog, service categories, and welfare schemes. */
export const catalogHandlers = [
  http.get('/api/services', () => HttpResponse.json(page(catalogItems))),
  http.get('/api/service-categories', () => HttpResponse.json(page(db.serviceCategories))),
  http.get('/api/schemes', () => HttpResponse.json(page(db.schemes))),
]

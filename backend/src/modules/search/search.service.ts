import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface SearchResult { id: string; kind: string; title: string; subtitle?: string; path: string }

/** Universal search over services, the citizen's documents and welfare schemes. */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(citizenId: string | undefined, q: string) {
    const [services, documents, schemes] = await Promise.all([
      this.prisma.service.findMany(),
      citizenId ? this.prisma.document.findMany({ where: { citizenId, deletedAt: null } }) : Promise.resolve([]),
      this.prisma.scheme.findMany(),
    ])
    const index: SearchResult[] = [
      ...services.map((s): SearchResult => ({ id: s.slug, kind: 'service', title: s.name, subtitle: `${s.processingTime} · ${s.fee}`, path: '/services' })),
      ...documents.map((d): SearchResult => ({ id: d.id, kind: 'document', title: d.name, subtitle: d.number, path: '/wallet' })),
      ...schemes.map((s): SearchResult => ({ id: s.id, kind: 'scheme', title: s.name, subtitle: s.benefit, path: '/schemes' })),
    ]
    const needle = q.toLowerCase().trim()
    const items = needle
      ? index.filter((r) => r.title.toLowerCase().includes(needle) || (r.subtitle ?? '').toLowerCase().includes(needle))
      : index
    return { items, total: items.length, page: 0, pageSize: items.length }
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

const pageOf = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

/** Services catalog, categories and welfare schemes — mirrors `handlers/catalog.ts`. */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async services() {
    const rows = await this.prisma.service.findMany({ include: { category: true }, orderBy: { name: 'asc' } })
    const items = rows.map((s) => {
      const meta = (s.metadata as Record<string, unknown> | null) ?? {}
      return {
        id: s.slug,
        name: s.name,
        category: s.category.code,
        processingTime: s.processingTime.split('(')[0].trim(),
        fee: s.fee,
        popular: Boolean(meta.popular),
        icon: (meta.icon as string) ?? 'FileText',
      }
    })
    return pageOf(items)
  }

  async categories() {
    const rows = await this.prisma.serviceCategory.findMany({ orderBy: { label: 'asc' } })
    // Keep 'All' first, as the UI's filter bar expects.
    const items = rows.map((c) => ({ id: c.code, label: c.label })).sort((a, b) => (a.id === 'all' ? -1 : b.id === 'all' ? 1 : 0))
    return pageOf(items)
  }

  async schemes() {
    const rows = await this.prisma.scheme.findMany({ include: { rules: true }, orderBy: { matchScore: 'desc' } })
    const items = rows.map((s) => ({
      id: s.id,
      name: s.name,
      nameTamil: s.nameTamil ?? undefined,
      department: s.department,
      benefit: s.benefit,
      benefitTamil: s.benefitTamil ?? undefined,
      budget: s.budget ?? undefined,
      purpose: s.purpose ?? undefined,
      matchScore: s.matchScore,
      color: s.color,
      eligibility: Object.fromEntries(
        s.rules.map((r) => [r.field, r.op === 'lte' ? Number(r.value) : r.value]),
      ),
    }))
    return pageOf(items)
  }
}

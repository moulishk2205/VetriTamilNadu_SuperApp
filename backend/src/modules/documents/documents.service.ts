import { Injectable, NotFoundException } from '@nestjs/common'
import { Document } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

const pageOf = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

export function toWalletDoc(d: Document) {
  return {
    id: d.id, name: d.name, type: d.type, number: d.number, issuer: d.issuer,
    holderName: d.holderName, dob: d.dob ?? undefined, validity: d.validity,
    status: d.status, color: d.color, version: d.docVersion,
  }
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(citizenId: string) {
    const docs = await this.prisma.document.findMany({ where: { citizenId, deletedAt: null }, orderBy: { createdAt: 'asc' } })
    return pageOf(docs.map(toWalletDoc))
  }

  async get(id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, deletedAt: null } })
    if (!doc) throw new NotFoundException('Document not found')
    return toWalletDoc(doc)
  }
}

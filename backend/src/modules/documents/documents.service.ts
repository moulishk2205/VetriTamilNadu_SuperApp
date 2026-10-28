import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Document } from '@prisma/client'
import { createHmac, timingSafeEqual } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'

const pageOf = <T>(items: T[]) => ({ items, total: items.length, page: 0, pageSize: items.length })

export function toWalletDoc(d: Document, verifySig?: string) {
  return {
    id: d.id, name: d.name, type: d.type, number: d.number, issuer: d.issuer,
    holderName: d.holderName, dob: d.dob ?? undefined, validity: d.validity,
    status: d.status, color: d.color, version: d.docVersion, issuedAt: d.createdAt.toISOString(),
    verifySig,
  }
}

/** "CHANDRAMOULISHWARAR K" → "C•••••••••••••••••R K": enough to match a face, not to harvest. */
function maskName(name: string): string {
  return name.split(/\s+/).map((w) => (w.length <= 2 ? w : `${w[0]}${'•'.repeat(w.length - 2)}${w[w.length - 1]}`)).join(' ')
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  /** Signature over the fields printed on the certificate. Any edit to them
   *  (or a forged QR) fails verification. */
  private sign(d: Document): string {
    const key = createHmac('sha256', this.config.getOrThrow<string>('jwt.accessSecret')).update('certificate-signing-v1').digest()
    return createHmac('sha256', key).update([d.number, d.holderName, d.name, d.issuer, d.validity, d.createdAt.toISOString()].join('|')).digest('hex').slice(0, 24)
  }

  async list(citizenId: string) {
    const docs = await this.prisma.document.findMany({ where: { citizenId, deletedAt: null }, orderBy: { createdAt: 'asc' } })
    return pageOf(docs.map((d) => toWalletDoc(d, this.sign(d))))
  }

  /** Owner-scoped: another citizen's document is simply not found. */
  async get(id: string, citizenId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, citizenId, deletedAt: null } })
    if (!doc) throw new NotFoundException('Document not found')
    return toWalletDoc(doc, this.sign(doc))
  }

  /** Public check behind the certificate QR code. Discloses only what is
   *  printed on the certificate, with the holder's name masked. */
  async verify(number: string, sig: string | undefined) {
    const doc = await this.prisma.document.findFirst({ where: { number, deletedAt: null } })
    if (!doc) return { authentic: false, reason: 'No certificate with this number has been issued.' }
    const expected = Buffer.from(this.sign(doc))
    const given = Buffer.from(sig ?? '')
    const signatureOk = given.length === expected.length && timingSafeEqual(given, expected)
    const base = {
      number: doc.number, name: doc.name, type: doc.type, issuer: doc.issuer, holder: maskName(doc.holderName),
      validity: doc.validity, status: doc.status, issuedOn: doc.createdAt.toISOString().slice(0, 10),
    }
    if (!signatureOk) return { authentic: false, reason: 'The QR signature does not match this certificate. It may have been altered.', ...base }
    if (doc.status !== 'verified') return { authentic: false, reason: `This certificate is ${doc.status}.`, ...base }
    return { authentic: true, reason: 'Issued by the department and unchanged since issue.', ...base }
  }
}

import { NotFoundException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { Document } from '@prisma/client'
import { DocumentsService } from '../../src/modules/documents/documents.service'
import type { PrismaService } from '../../src/prisma/prisma.service'

const cert = {
  id: 'doc-1', citizenId: 'cit-1', name: 'Income Certificate', type: 'Revenue', number: 'IC-TN-2026-0001',
  issuer: 'Tahsildar, Mylapore', holderName: 'CHANDRAMOULISHWARAR K', dob: null, validity: '10/2027',
  status: 'verified', color: '#0F766E', docVersion: 1, createdAt: new Date('2026-10-01T05:30:00Z'), deletedAt: null,
} as unknown as Document

/** DocumentsService over one stored document, signed with `secret`. */
function service(doc: Document, secret = 'unit-test-secret-of-32-characters!!') {
  const prisma = {
    document: {
      findFirst: async ({ where }: { where: { id?: string; number?: string; citizenId?: string } }) => {
        if (where.id && where.id !== doc.id) return null
        if (where.number && where.number !== doc.number) return null
        if (where.citizenId && where.citizenId !== doc.citizenId) return null
        return doc
      },
    },
  } as unknown as PrismaService
  const config = { getOrThrow: () => secret } as unknown as ConfigService
  return new DocumentsService(prisma, config)
}

const signatureOf = async (doc: Document) => (await service(doc).get(doc.id, doc.citizenId)).verifySig!

describe('Certificate QR signatures', () => {
  it('verifies a certificate with its own signature', async () => {
    const sig = await signatureOf(cert)
    expect(sig).toMatch(/^[0-9a-f]{24}$/)
    const res = await service(cert).verify(cert.number, sig)
    expect(res).toMatchObject({ authentic: true, number: cert.number, issuedOn: '2026-10-01' })
  })

  it('masks the holder name in the public check', async () => {
    const res = await service(cert).verify(cert.number, await signatureOf(cert))
    const holder = 'holder' in res ? res.holder : ''
    expect(holder).not.toContain('CHANDRAMOULISHWARAR')
    expect(holder).toMatch(/^C•+R K$/)
  })

  it('fails when a printed field was altered after signing', async () => {
    const sig = await signatureOf(cert)
    for (const change of [{ holderName: 'SOMEONE ELSE' }, { validity: '10/2099' }, { issuer: 'Forged Office' }, { name: 'Community Certificate' }]) {
      const res = await service({ ...cert, ...change } as Document).verify(cert.number, sig)
      expect({ change, authentic: res.authentic }).toEqual({ change, authentic: false })
    }
  })

  it('fails on a missing, short or forged signature', async () => {
    const sig = await signatureOf(cert)
    for (const bad of [undefined, '', sig.slice(0, 10), sig.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'))]) {
      expect((await service(cert).verify(cert.number, bad)).authentic).toBe(false)
    }
  })

  it('fails when signed with a different key', async () => {
    const sig = await signatureOf(cert)
    expect((await service(cert, 'another-secret-of-thirty-two-chars!!').verify(cert.number, sig)).authentic).toBe(false)
  })

  it('reports a revoked certificate as not authentic even with a good signature', async () => {
    const revoked = { ...cert, status: 'revoked' } as unknown as Document
    const res = await service(revoked).verify(revoked.number, await signatureOf(revoked))
    expect(res).toMatchObject({ authentic: false, reason: 'This certificate is revoked.' })
  })

  it('reports an unknown number without disclosing anything', async () => {
    expect(await service(cert).verify('IC-TN-0000-0000', 'x')).toEqual({ authentic: false, reason: 'No certificate with this number has been issued.' })
  })

  it('hides another citizen’s document', async () => {
    await expect(service(cert).get(cert.id, 'cit-2')).rejects.toThrow(NotFoundException)
  })
})

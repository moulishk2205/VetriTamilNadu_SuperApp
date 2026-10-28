import { Injectable, NotFoundException } from '@nestjs/common'
import { Address, Citizen } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

export function toCitizenDto(c: Citizen & { addresses: Address[] }) {
  return {
    id: c.id, citizenId: c.citizenId, fullName: c.fullName, dob: c.dob, gender: c.gender,
    mobile: c.mobile, email: c.email ?? undefined, aadhaarMasked: c.aadhaarMasked,
    district: c.district, taluk: c.taluk, state: c.state, verified: c.verified,
    verifiedVia: c.verifiedVia,
    addresses: c.addresses.map((a) => ({
      id: a.id, kind: a.kind, line: a.line, area: a.area,
      district: a.district, state: a.state, pincode: a.pincode,
    })),
    family: [],
  }
}

@Injectable()
export class CitizenService {
  constructor(private readonly prisma: PrismaService) {}

  private async load(citizenId: string) {
    const c = await this.prisma.citizen.findUnique({ where: { id: citizenId }, include: { addresses: true } })
    if (!c) throw new NotFoundException('Citizen not found')
    return c
  }

  async me(citizenId: string) {
    return toCitizenDto(await this.load(citizenId))
  }

  /** Patch only the scalar profile fields the UI edits; relations are untouched.
   *  Once verified, identity fields are locked: certificates copy the name and
   *  date of birth, the mobile is the login identifier, and the district decides
   *  which officers can see the citizen's applications. Changing them needs a
   *  re-verified correction flow, not a profile edit. */
  async update(citizenId: string, patch: Record<string, unknown>) {
    const current = await this.load(citizenId)
    const allowed = current.verified
      ? (['email'] as const)
      : (['fullName', 'dob', 'gender', 'email', 'district', 'taluk', 'state'] as const)
    const data: Record<string, unknown> = {}
    for (const k of allowed) if (k in patch && typeof patch[k] === 'string') data[k] = patch[k]
    await this.prisma.citizen.update({ where: { id: citizenId }, data })
    return toCitizenDto(await this.load(citizenId))
  }

  async timeline(citizenId: string) {
    const rows = await this.prisma.timelineEvent.findMany({ where: { citizenId }, orderBy: { at: 'asc' } })
    const items = rows.map((r) => ({
      year: r.year, title: r.title, subtitle: r.subtitle, kind: r.kind, at: r.at.toISOString(),
    }))
    return { items, total: items.length }
  }
}

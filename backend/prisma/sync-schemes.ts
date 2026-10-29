/**
 * Brings an existing database's welfare catalogue in line with ./schemes.ts
 * without reseeding: renames replaced schemes, updates every scheme's details,
 * replaces its eligibility rules, and removes schemes no longer in the
 * catalogue unless a citizen has claimed them. Safe to run more than once.
 *   node dist/prisma/sync-schemes.js
 */
import { PrismaClient } from '@prisma/client'
import { RENAMED, SCHEMES } from './schemes'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  for (const [from, to] of Object.entries(RENAMED)) {
    const old = await prisma.scheme.findFirst({ where: { name: from } })
    const taken = await prisma.scheme.findFirst({ where: { name: to } })
    if (old && !taken) await prisma.scheme.update({ where: { id: old.id }, data: { name: to } })
  }

  const keep: string[] = []
  for (const s of SCHEMES) {
    const data = {
      nameTamil: s.nameTamil ?? null, department: s.dept, benefit: s.benefit, benefitTamil: null,
      budget: s.budget ?? null, purpose: s.purpose, matchScore: s.score, color: s.color,
    }
    const row = await prisma.scheme.findFirst({ where: { name: s.name } })
    const id = row
      ? (await prisma.scheme.update({ where: { id: row.id }, data })).id
      : (await prisma.scheme.create({ data: { name: s.name, ...data } })).id
    await prisma.$transaction([
      prisma.eligibilityRule.deleteMany({ where: { schemeId: id } }),
      prisma.eligibilityRule.createMany({ data: s.rules.map((r) => ({ schemeId: id, ...r })) }),
    ])
    keep.push(id)
  }

  const stale = await prisma.scheme.findMany({ where: { id: { notIn: keep } }, include: { _count: { select: { claims: true } } } })
  for (const s of stale) {
    if (s._count.claims > 0) { console.log(`  kept "${s.name}": citizens have claimed it`); continue }
    await prisma.$transaction([prisma.eligibilityRule.deleteMany({ where: { schemeId: s.id } }), prisma.scheme.delete({ where: { id: s.id } })])
    console.log(`  removed "${s.name}": no longer in the catalogue`)
  }
  console.log(`✓ welfare catalogue synced: ${SCHEMES.length} schemes`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())

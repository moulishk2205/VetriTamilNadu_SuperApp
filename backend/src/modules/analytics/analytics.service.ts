import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

type Point = { label: string; value: number }

/** The department and constituency these dashboards describe. */
const DEPARTMENT = 'Revenue & Disaster Management'
const DISTRICT = 'Chennai'

/**
 * Analytics: every figure below is computed live from the operational tables,
 * so dashboards move as applications are filed and decided during a demo.
 * Measures with no source data yet (citizen satisfaction, scheme utilisation)
 * are returned as null rather than invented.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Applications per month for the last six months (empty months as 0). */
  private async monthly(scope: Prisma.Sql): Promise<Point[]> {
    const rows = await this.prisma.$queryRaw<{ m: Date; n: number }[]>`
      SELECT date_trunc('month', a."createdAt") AS m, count(*)::int AS n
      FROM "Application" a JOIN "Citizen" c ON c.id = a."citizenId"
      WHERE a."deletedAt" IS NULL AND a."createdAt" >= date_trunc('month', now()) - interval '5 months' AND ${scope}
      GROUP BY 1`
    const byMonth = new Map(rows.map((r) => [`${r.m.getUTCFullYear()}-${r.m.getUTCMonth()}`, r.n]))
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1))
      return { label: d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' }), value: byMonth.get(`${d.getUTCFullYear()}-${d.getUTCMonth()}`) ?? 0 }
    })
  }

  private async totals(scope: Prisma.Sql) {
    const [t] = await this.prisma.$queryRaw<{ total: number; today: number; month: number; pending: number; completed: number; rejected: number; escalated: number; overdue: number; avg_days: number | null }[]>`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE a."createdAt" >= date_trunc('day', now()))::int AS today,
             count(*) FILTER (WHERE a."createdAt" >= now() - interval '30 days')::int AS month,
             count(*) FILTER (WHERE a.stage NOT IN ('completed','rejected'))::int AS pending,
             count(*) FILTER (WHERE a.stage = 'completed')::int AS completed,
             count(*) FILTER (WHERE a.stage = 'rejected')::int AS rejected,
             count(*) FILTER (WHERE a.stage = 'escalation')::int AS escalated,
             count(*) FILTER (WHERE a.stage NOT IN ('completed','rejected') AND a."slaDeadline" < now())::int AS overdue,
             avg(EXTRACT(EPOCH FROM (a."updatedAt" - a."createdAt")) / 86400) FILTER (WHERE a.stage = 'completed')::float AS avg_days
      FROM "Application" a JOIN "Citizen" c ON c.id = a."citizenId"
      WHERE a."deletedAt" IS NULL AND ${scope}`
    return t
  }

  private async top(scope: Prisma.Sql, column: Prisma.Sql, limit = 5): Promise<Point[]> {
    return this.prisma.$queryRaw<Point[]>`
      SELECT ${column} AS label, count(*)::int AS value
      FROM "Application" a JOIN "Citizen" c ON c.id = a."citizenId"
      WHERE a."deletedAt" IS NULL AND ${scope}
      GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT ${limit}`
  }

  async department() {
    const dept = await this.prisma.department.findFirst({ where: { name: DEPARTMENT } })
    const scope = Prisma.sql`a."departmentId" = ${dept?.id ?? ''}`
    const [t, monthlyTrend, serviceDemand, districtComparison, officers] = await Promise.all([
      this.totals(scope),
      this.monthly(scope),
      this.top(scope, Prisma.sql`a."serviceName"`),
      this.top(scope, Prisma.sql`c.district`),
      this.prisma.$queryRaw<{ name: string; designation: string; completed: number; on_time: number }[]>`
        SELECT o.name, o.designation, count(a.id)::int AS completed,
               count(a.id) FILTER (WHERE a."slaDeadline" IS NULL OR a."updatedAt" <= a."slaDeadline")::int AS on_time
        FROM "Officer" o JOIN "Application" a ON a."officerId" = o.id AND a.stage = 'completed' AND a."deletedAt" IS NULL
        WHERE o."departmentId" = ${dept?.id ?? ''} AND o."deletedAt" IS NULL
        GROUP BY o.id, o.name, o.designation`,
    ])
    const perf = officers.map((o) => ({ name: o.name, designation: o.designation, completed: o.completed, sla: Math.round((o.on_time / o.completed) * 100) }))
    return {
      department: DEPARTMENT,
      today: t.today, month: t.month, pending: t.pending, approved: t.completed, rejected: t.rejected,
      avgSlaDays: Math.round((t.avg_days ?? 0) * 10) / 10, overdue: t.overdue, escalations: t.escalated,
      monthlyTrend, serviceDemand, districtComparison,
      topOfficers: [...perf].sort((a, b) => b.completed - a.completed || b.sla - a.sla).slice(0, 3),
      slowestOfficers: [...perf].sort((a, b) => a.sla - b.sla || b.completed - a.completed).slice(0, 1),
    }
  }

  async constituency() {
    const scope = Prisma.sql`c.district = ${DISTRICT}`
    const [t, monthlyTrend, topServices, talukRows, complaints, deptRows, citizens, heatRows] = await Promise.all([
      this.totals(scope),
      this.monthly(scope),
      this.top(scope, Prisma.sql`a."serviceName"`),
      this.top(scope, Prisma.sql`c.taluk`, 6),
      this.prisma.$queryRaw<Point[]>`
        SELECT k.category AS label, count(*)::int AS value FROM "Complaint" k JOIN "Citizen" c ON c.id = k."citizenId"
        WHERE k."deletedAt" IS NULL AND ${scope} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 4`,
      // Right to Services compliance per department: decided on time, or still
      // open and inside the deadline, as a share of all non-rejected cases.
      this.prisma.$queryRaw<{ label: string; done: number; total: number }[]>`
        SELECT d.name AS label,
               count(*) FILTER (WHERE (a.stage = 'completed' AND (a."slaDeadline" IS NULL OR a."updatedAt" <= a."slaDeadline"))
                                   OR (a.stage NOT IN ('completed','rejected') AND (a."slaDeadline" IS NULL OR a."slaDeadline" >= now())))::int AS done,
               count(*) FILTER (WHERE a.stage <> 'rejected')::int AS total
        FROM "Application" a JOIN "Citizen" c ON c.id = a."citizenId" JOIN "Department" d ON d.id = a."departmentId"
        WHERE a."deletedAt" IS NULL AND ${scope} GROUP BY 1 ORDER BY 3 DESC LIMIT 5`,
      this.prisma.citizen.findMany({ where: { district: DISTRICT, deletedAt: null, applications: { some: {} } }, select: { gender: true, dob: true } }),
      this.prisma.$queryRaw<{ svc: string; taluk: string; n: number }[]>`
        SELECT a."serviceName" AS svc, c.taluk, count(*)::int AS n
        FROM "Application" a JOIN "Citizen" c ON c.id = a."citizenId"
        WHERE a."deletedAt" IS NULL AND ${scope} GROUP BY 1, 2`,
    ])
    const age = (dob: string) => {
      const year = Number(/(\d{4})\s*$/.exec(dob.trim())?.[1])
      return Number.isFinite(year) ? new Date().getFullYear() - year : null
    }
    const ages = citizens.map((c) => age(c.dob)).filter((a): a is number => a !== null)
    const rows = topServices.slice(0, 4).map((s) => s.label)
    const cols = talukRows.map((s) => s.label)
    return {
      constituency: 'Mylapore',
      district: DISTRICT,
      mla: `Hon. MLA, Mylapore · live figures for ${DISTRICT} district`,
      stats: {
        submitted: t.total, completed: t.completed, pending: t.pending,
        avgResolutionDays: Math.round((t.avg_days ?? 0) * 10) / 10,
        satisfaction: null, schemeUtilisation: null,
      },
      monthlyTrend, topServices, topComplaints: complaints,
      departmentPerformance: deptRows.map((d) => ({ label: d.label.split(' ')[0], value: d.total ? Math.round((d.done / d.total) * 100) : 0, suffix: '%' })),
      demographics: [
        { label: 'Women applicants', value: citizens.filter((c) => /^f/i.test(c.gender)).length },
        { label: 'Youth (18–30)', value: ages.filter((a) => a >= 18 && a <= 30).length },
        { label: 'Senior citizens (60+)', value: ages.filter((a) => a >= 60).length },
      ],
      wardComparison: talukRows,
      heat: {
        rows,
        cols,
        cells: rows.map((r) => cols.map((col) => heatRows.find((h) => h.svc === r && h.taluk === col)?.n ?? 0)),
      },
    }
  }
}

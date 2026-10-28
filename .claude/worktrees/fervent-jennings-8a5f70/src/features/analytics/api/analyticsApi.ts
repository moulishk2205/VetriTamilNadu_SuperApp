import { z } from 'zod'
import { apiClient } from '@/lib/api/client'

const Point = z.object({ label: z.string(), value: z.number() })
const HPoint = z.object({ label: z.string(), value: z.number(), suffix: z.string().optional() })
const OfficerPerf = z.object({ name: z.string(), designation: z.string(), completed: z.number(), sla: z.number() })

export const DepartmentAnalyticsSchema = z.object({
  department: z.string(),
  today: z.number(), month: z.number(), pending: z.number(), approved: z.number(), rejected: z.number(),
  avgSlaDays: z.number(), overdue: z.number(), escalations: z.number(),
  monthlyTrend: z.array(Point), serviceDemand: z.array(Point), districtComparison: z.array(Point),
  topOfficers: z.array(OfficerPerf), slowestOfficers: z.array(OfficerPerf),
})
export type DepartmentAnalytics = z.infer<typeof DepartmentAnalyticsSchema>

export const ConstituencyAnalyticsSchema = z.object({
  constituency: z.string(), district: z.string(), mla: z.string(),
  stats: z.object({ submitted: z.number(), completed: z.number(), pending: z.number(), avgResolutionDays: z.number(), satisfaction: z.number(), schemeUtilisation: z.number() }),
  monthlyTrend: z.array(Point), topServices: z.array(Point), topComplaints: z.array(Point),
  departmentPerformance: z.array(HPoint), demographics: z.array(HPoint), wardComparison: z.array(Point),
  heat: z.object({ rows: z.array(z.string()), cols: z.array(z.string()), cells: z.array(z.array(z.number())) }),
})
export type ConstituencyAnalytics = z.infer<typeof ConstituencyAnalyticsSchema>

export const TimelineSchema = z.object({
  items: z.array(z.object({ year: z.string(), title: z.string(), subtitle: z.string(), kind: z.enum(['application', 'certificate', 'complaint', 'scheme', 'milestone']), at: z.string() })),
  total: z.number(),
})
export type CitizenTimeline = z.infer<typeof TimelineSchema>

export const analyticsApi = {
  department: () => apiClient.get('/analytics/department', { schema: DepartmentAnalyticsSchema }),
  constituency: () => apiClient.get('/analytics/constituency', { schema: ConstituencyAnalyticsSchema }),
  citizenTimeline: () => apiClient.get('/citizen/timeline', { schema: TimelineSchema }),
}

import { http, HttpResponse } from 'msw'
import { getWorkflowDefinition } from '@/lib/workflow/definitions'
import { isTerminal } from '@/lib/workflow/engine'
import { records, toDTO, OFFICERS } from './applications'
import { db } from '../db'

/**
 * Analytics backend — department, constituency (MLA) and citizen-timeline
 * aggregates. Live counts are derived from the application records; historic
 * series are charter-plausible seeded aggregates (a real backend materialises
 * these from the same workflow events).
 */

const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

function liveCounts() {
  const done = records.filter((r) => r.instance.currentStage === 'completed').length
  const rejected = records.filter((r) => r.instance.currentStage === 'rejected').length
  const pending = records.filter((r) => !isTerminal(getWorkflowDefinition(r.instance.definitionId)!, r.instance.currentStage)).length
  return { done, rejected, pending, total: records.length }
}

export const analyticsHandlers = [
  http.get('/api/analytics/department', () => {
    const live = liveCounts()
    return HttpResponse.json({
      department: 'Revenue & Disaster Management',
      today: 34 + live.total,
      month: 1180,
      pending: 126 + live.pending,
      approved: 982 + live.done,
      rejected: 41 + live.rejected,
      avgSlaDays: 4.6,
      overdue: 17,
      escalations: 9,
      monthlyTrend: MONTHS.map((m, i) => ({ label: m, value: [820, 940, 1010, 1105, 1160, 1180 + live.total][i] })),
      serviceDemand: [
        { label: 'Income', value: 412 }, { label: 'Community', value: 318 },
        { label: 'Patta', value: 214 }, { label: 'Birth', value: 156 }, { label: 'Death', value: 80 },
      ],
      districtComparison: [
        { label: 'Chennai', value: 1180 }, { label: 'Coimbatore', value: 964 },
        { label: 'Madurai', value: 842 }, { label: 'Trichy', value: 733 }, { label: 'Salem', value: 651 },
      ],
      topOfficers: OFFICERS.slice(0, 3).map((o, i) => ({ name: o.name, designation: o.designation, completed: [63, 51, 44][i], sla: [98, 96, 93][i] })),
      slowestOfficers: [{ name: 'Thiru. D. Prakash', designation: 'Deputy Tahsildar', completed: 12, sla: 71 }],
    })
  }),

  http.get('/api/analytics/constituency', () => {
    const live = liveCounts()
    return HttpResponse.json({
      constituency: 'Mylapore',
      district: 'Chennai',
      mla: 'Hon. Member of Legislative Assembly, Mylapore',
      stats: {
        submitted: 4231 + live.total,
        completed: 3867 + live.done,
        pending: 296 + live.pending,
        avgResolutionDays: 5.2,
        satisfaction: 4.3,
        schemeUtilisation: 78,
      },
      monthlyTrend: MONTHS.map((m, i) => ({ label: m, value: [520, 588, 641, 702, 745, 790 + live.total][i] })),
      topServices: [
        { label: 'Income Cert', value: 1240 }, { label: 'Community', value: 918 },
        { label: 'Ration Card', value: 704 }, { label: 'Patta', value: 512 }, { label: 'Birth Cert', value: 431 },
      ],
      topComplaints: [
        { label: 'Road Damage', value: 214 }, { label: 'Water Supply', value: 168 },
        { label: 'Streetlight', value: 122 }, { label: 'Garbage', value: 96 },
      ],
      departmentPerformance: [
        { label: 'Revenue', value: 94, suffix: '%' }, { label: 'Civil Supplies', value: 91, suffix: '%' },
        { label: 'GCC', value: 87, suffix: '%' }, { label: 'Transport', value: 84, suffix: '%' },
        { label: 'Registration', value: 82, suffix: '%' },
      ],
      demographics: [
        { label: 'Women beneficiaries', value: 1832 }, { label: 'Students / Youth', value: 1114 },
        { label: 'Senior citizens', value: 689 }, { label: 'Farmers', value: 402 }, { label: 'Disabled citizens', value: 194 },
      ],
      wardComparison: [
        { label: 'Ward 121', value: 312 }, { label: 'Ward 122', value: 287 }, { label: 'Ward 123', value: 341 },
        { label: 'Ward 124', value: 268 }, { label: 'Ward 125', value: 224 }, { label: 'Ward 126', value: 373 },
      ],
      heat: {
        rows: ['Income', 'Ration', 'Patta', 'Birth'],
        cols: ['W121', 'W122', 'W123', 'W124', 'W125', 'W126'],
        cells: [
          [42, 38, 51, 33, 29, 58],
          [31, 27, 36, 22, 19, 41],
          [18, 14, 22, 12, 9, 26],
          [12, 16, 19, 11, 8, 21],
        ],
      },
    })
  }),

  /** The Digital Citizen Timeline — every government interaction, chronological. */
  http.get('/api/citizen/timeline', () => {
    const dyn = records.map((r) => ({
      year: new Date(r.createdAt).getFullYear().toString(),
      title: toDTO(r).serviceName,
      subtitle: `${r.referenceNo} · ${toDTO(r).status}`,
      kind: 'application' as const,
      at: r.createdAt,
    }))
    const certs = db.documents.filter((d) => d.number.startsWith('CRT')).map((d) => ({
      year: '2026', title: `${d.name} issued`, subtitle: `${d.number} · delivered to Wallet`, kind: 'certificate' as const, at: new Date().toISOString(),
    }))
    const staticEvents = [
      { year: '2002', title: 'Birth Certificate', subtitle: 'BC-TN-2002-4421 · GCC Chennai', kind: 'certificate' as const, at: '2002-05-22' },
      { year: '2008', title: 'School Admission', subtitle: 'Govt. Higher Secondary School, Mylapore', kind: 'milestone' as const, at: '2008-06-01' },
      { year: '2019', title: 'Community Certificate', subtitle: 'Lifetime validity · Tahsildar, Mylapore', kind: 'certificate' as const, at: '2019-03-14' },
      { year: '2024', title: 'Driving Licence', subtitle: 'DL-TN-2024-8842 · RTO Chennai', kind: 'certificate' as const, at: '2024-08-02' },
      { year: '2025', title: 'Ration Card (Smart Card)', subtitle: 'RC-TN-CHN-7788 · Civil Supplies', kind: 'certificate' as const, at: '2025-01-10' },
      { year: '2026', title: 'Complaint — Road Damage', subtitle: 'CMP-TN-000452 · GCC Zone 9 · In progress', kind: 'complaint' as const, at: '2026-07-01' },
    ]
    const items = [...staticEvents, ...dyn, ...certs].sort((a, b) => a.at.localeCompare(b.at))
    return HttpResponse.json({ items, total: items.length })
  }),
]

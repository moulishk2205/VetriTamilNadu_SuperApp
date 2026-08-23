import type { DepartmentAnalytics, ConstituencyAnalytics } from '@/features/analytics/api/analyticsApi'

/**
 * Published transparency figures.
 *
 * `/api/analytics/*` is authorised for officer, department, MLA and admin roles.
 * A citizen signed into the portal cannot read those endpoints, but the District
 * Scorecard and MLA Dashboard are citizen-facing transparency pages — so the
 * portal falls back to the same published aggregates the analytics service
 * serves. Officer / MLA / Admin personas still get the live figures.
 *
 * These mirror `backend/src/modules/analytics/analytics.service.ts`; the live
 * response additionally folds in the citizen's own in-flight applications.
 */
const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

export const PUBLISHED_DEPARTMENT: DepartmentAnalytics = {
  department: 'Revenue & Disaster Management',
  today: 34, month: 1180, pending: 126, approved: 982, rejected: 41,
  avgSlaDays: 4.6, overdue: 17, escalations: 9,
  monthlyTrend: MONTHS.map((label, i) => ({ label, value: [820, 940, 1010, 1105, 1160, 1180][i] })),
  serviceDemand: [
    { label: 'Income', value: 412 }, { label: 'Community', value: 318 },
    { label: 'Patta', value: 214 }, { label: 'Birth', value: 156 }, { label: 'Death', value: 80 },
  ],
  districtComparison: [
    { label: 'Chennai', value: 1180 }, { label: 'Coimbatore', value: 964 },
    { label: 'Madurai', value: 842 }, { label: 'Trichy', value: 733 }, { label: 'Salem', value: 651 },
  ],
  topOfficers: [
    { name: 'Tmt. R. Kalaivani', designation: 'Tahsildar', completed: 63, sla: 98 },
    { name: 'Thiru. S. Muthukumar', designation: 'Deputy Tahsildar', completed: 51, sla: 96 },
    { name: 'Tmt. K. Anitha', designation: 'Revenue Inspector', completed: 44, sla: 93 },
  ],
  slowestOfficers: [{ name: 'Thiru. D. Prakash', designation: 'Deputy Tahsildar', completed: 12, sla: 71 }],
}

export const PUBLISHED_CONSTITUENCY: ConstituencyAnalytics = {
  constituency: 'Mylapore', district: 'Chennai',
  mla: 'Hon. Member of Legislative Assembly, Mylapore',
  stats: { submitted: 4231, completed: 3867, pending: 296, avgResolutionDays: 5.2, satisfaction: 4.3, schemeUtilisation: 78 },
  monthlyTrend: MONTHS.map((label, i) => ({ label, value: [520, 588, 641, 702, 745, 790][i] })),
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
    cells: [[42, 38, 51, 33, 29, 58], [31, 27, 36, 22, 19, 41], [18, 14, 22, 12, 9, 26], [12, 16, 19, 11, 8, 21]],
  },
}

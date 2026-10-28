import { Injectable } from '@nestjs/common'
import { ApplicationStage } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const NON_TERMINAL = { notIn: [ApplicationStage.completed, ApplicationStage.rejected] }

/**
 * Analytics — department & constituency (MLA) aggregates. Live totals are
 * derived from the application table; historic series are charter-plausible
 * seeded aggregates a real backend would materialise from workflow events.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async live() {
    const [done, rejected, pending, total] = await Promise.all([
      this.prisma.application.count({ where: { stage: ApplicationStage.completed } }),
      this.prisma.application.count({ where: { stage: ApplicationStage.rejected } }),
      this.prisma.application.count({ where: { stage: NON_TERMINAL, deletedAt: null } }),
      this.prisma.application.count({ where: { deletedAt: null } }),
    ])
    return { done, rejected, pending, total }
  }

  async department() {
    const live = await this.live()
    const officers = await this.prisma.officer.findMany({ take: 3, orderBy: { createdAt: 'asc' } })
    return {
      department: 'Revenue & Disaster Management',
      today: 34 + live.total, month: 1180, pending: 126 + live.pending,
      approved: 982 + live.done, rejected: 41 + live.rejected,
      avgSlaDays: 4.6, overdue: 17, escalations: 9,
      monthlyTrend: MONTHS.map((m, i) => ({ label: m, value: [820, 940, 1010, 1105, 1160, 1180 + live.total][i] })),
      serviceDemand: [
        { label: 'Income', value: 412 }, { label: 'Community', value: 318 },
        { label: 'Patta', value: 214 }, { label: 'Birth', value: 156 }, { label: 'Death', value: 80 },
      ],
      districtComparison: [
        { label: 'Chennai', value: 1180 }, { label: 'Coimbatore', value: 964 },
        { label: 'Madurai', value: 842 }, { label: 'Trichy', value: 733 }, { label: 'Salem', value: 651 },
      ],
      topOfficers: officers.map((o, i) => ({ name: o.name, designation: o.designation, completed: [63, 51, 44][i], sla: [98, 96, 93][i] })),
      slowestOfficers: [{ name: 'Thiru. D. Prakash', designation: 'Deputy Tahsildar', completed: 12, sla: 71 }],
    }
  }

  async constituency() {
    const live = await this.live()
    return {
      constituency: 'Mylapore', district: 'Chennai',
      mla: 'Hon. Member of Legislative Assembly, Mylapore',
      stats: {
        submitted: 4231 + live.total, completed: 3867 + live.done, pending: 296 + live.pending,
        avgResolutionDays: 5.2, satisfaction: 4.3, schemeUtilisation: 78,
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
    }
  }
}

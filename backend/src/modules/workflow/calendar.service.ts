import { Global, Injectable, Module } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

const DAY = 86_400_000
/** Calendar dates are Indian Standard Time. */
const IST_OFFSET = 330 * 60_000
const istDate = (t: number) => new Date(t + IST_OFFSET).toISOString().slice(0, 10)

/**
 * Working-day arithmetic for Right to Services deadlines. Sundays and the
 * holidays in the Holiday table do not count. Holidays are cached and
 * reloaded after an admin edits the calendar.
 */
@Injectable()
export class WorkingCalendar {
  private holidays: Set<string> | null = null

  constructor(private readonly prisma: PrismaService) {}

  async isWorkingDay(t: number): Promise<boolean> {
    const holidays = await this.load()
    const day = new Date(t + IST_OFFSET).getUTCDay()
    return day !== 0 && !holidays.has(istDate(t))
  }

  /** The moment `days` working days after `from` (same time of day). */
  async addWorkingDays(from: Date, days: number): Promise<Date> {
    let t = from.getTime()
    let left = Math.max(0, Math.round(days))
    while (left > 0) {
      t += DAY
      if (await this.isWorkingDay(t)) left -= 1
    }
    return new Date(t)
  }

  async list() {
    return this.prisma.holiday.findMany({ orderBy: { date: 'asc' } })
  }

  async add(date: string, name: string) {
    const row = await this.prisma.holiday.upsert({ where: { date }, update: { name }, create: { date, name } })
    this.holidays = null
    return row
  }

  async remove(date: string) {
    await this.prisma.holiday.deleteMany({ where: { date } })
    this.holidays = null
  }

  private async load(): Promise<Set<string>> {
    if (!this.holidays) this.holidays = new Set((await this.prisma.holiday.findMany({ select: { date: true } })).map((h) => h.date))
    return this.holidays
  }
}

@Global()
@Module({ providers: [WorkingCalendar], exports: [WorkingCalendar] })
export class CalendarModule {}

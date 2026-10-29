import { WorkingCalendar } from '../../src/modules/workflow/calendar.service'
import type { PrismaService } from '../../src/prisma/prisma.service'

/** In-memory stand-in for the Holiday table. */
function calendarWith(dates: string[]) {
  const rows = new Map(dates.map((date) => [date, { date, name: 'Holiday' }]))
  const findMany = jest.fn(async () => [...rows.values()])
  const prisma = {
    holiday: {
      findMany,
      upsert: jest.fn(async ({ create }: { create: { date: string; name: string } }) => (rows.set(create.date, create), create)),
      deleteMany: jest.fn(async ({ where }: { where: { date: string } }) => (rows.delete(where.date), { count: 1 })),
    },
  }
  return { cal: new WorkingCalendar(prisma as unknown as PrismaService), findMany }
}

/** 10:00 IST on the given calendar date. */
const ist = (date: string) => new Date(`${date}T10:00:00+05:30`)
const istDate = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10)

describe('WorkingCalendar', () => {
  // 2026-10-30 is a Friday, 2026-10-31 a Saturday, 2026-11-01 a Sunday.
  it('skips Sundays but counts Saturdays', async () => {
    const { cal } = calendarWith([])
    expect(istDate(await cal.addWorkingDays(ist('2026-10-30'), 1))).toBe('2026-10-31')
    expect(istDate(await cal.addWorkingDays(ist('2026-10-31'), 1))).toBe('2026-11-02')
  })

  it('skips holidays from the table', async () => {
    const { cal } = calendarWith(['2026-11-02'])
    expect(istDate(await cal.addWorkingDays(ist('2026-10-31'), 1))).toBe('2026-11-03')
    expect(istDate(await cal.addWorkingDays(ist('2026-10-30'), 3))).toBe('2026-11-04')
  })

  it('keeps the time of day and treats zero or negative days as now', async () => {
    const { cal } = calendarWith([])
    // Monday 2 Nov + 2 working days = Wednesday, at the same time of day.
    const from = ist('2026-11-02')
    expect((await cal.addWorkingDays(from, 2)).getTime() - from.getTime()).toBe(2 * 86_400_000)
    expect((await cal.addWorkingDays(from, 0)).getTime()).toBe(from.getTime())
    expect((await cal.addWorkingDays(from, -4)).getTime()).toBe(from.getTime())
  })

  it('decides the weekday in Indian Standard Time, not UTC', async () => {
    const { cal } = calendarWith([])
    // 20:00 UTC on Saturday 31 Oct is already 01:30 IST on Sunday 1 Nov.
    expect(await cal.isWorkingDay(Date.parse('2026-10-31T20:00:00Z'))).toBe(false)
    // 20:00 UTC on Sunday 1 Nov is 01:30 IST on Monday.
    expect(await cal.isWorkingDay(Date.parse('2026-11-01T20:00:00Z'))).toBe(true)
  })

  it('caches the table and reloads it after an edit', async () => {
    const { cal, findMany } = calendarWith([])
    await cal.isWorkingDay(ist('2026-11-02').getTime())
    await cal.isWorkingDay(ist('2026-11-03').getTime())
    expect(findMany).toHaveBeenCalledTimes(1)

    await cal.add('2026-11-02', 'Local holiday')
    expect(await cal.isWorkingDay(ist('2026-11-02').getTime())).toBe(false)
    await cal.remove('2026-11-02')
    expect(await cal.isWorkingDay(ist('2026-11-02').getTime())).toBe(true)
    expect(findMany).toHaveBeenCalledTimes(3)
  })
})

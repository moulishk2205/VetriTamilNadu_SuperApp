import { Priority } from '@prisma/client'
import { charterDays } from '../../src/modules/applications/applications.service'
import { routeComplaint } from '../../src/modules/complaints/complaint.routing'

describe('charterDays (Right to Services deadline)', () => {
  it.each([
    ['15d', 15],
    ['7 d', 7],
    ['Same day', 1],
    ['same day', 1],
    ['', 30],
    [null, 30],
    [undefined, 30],
    ['Varies', 30],
    ['0d', 30],
  ])('reads %p as %p days', (input, days) => {
    expect(charterDays(input as string | null | undefined)).toBe(days)
  })
})

describe('routeComplaint', () => {
  it('sends road damage to highways at high priority', () => {
    expect(routeComplaint('Road Damage')).toEqual({ priorityLabel: 'High', priority: Priority.HIGH, etaDays: 5, department: 'GCC - Highways' })
  })

  it('sends water supply to Metro Water at high priority', () => {
    expect(routeComplaint('Water Supply')).toMatchObject({ priority: Priority.HIGH, department: 'Metro Water / GCC' })
  })

  it('treats streetlights and drainage as medium', () => {
    expect(routeComplaint('Streetlight')).toMatchObject({ priority: Priority.MEDIUM, etaDays: 7, department: 'GCC - Highways' })
    expect(routeComplaint('Drainage')).toMatchObject({ priority: Priority.MEDIUM, etaDays: 7 })
  })

  it('defaults anything else to low priority', () => {
    expect(routeComplaint('Stray Animals')).toMatchObject({ priorityLabel: 'Low', priority: Priority.LOW, etaDays: 7 })
  })
})

import { ageFrom, evaluate } from '../../src/modules/eligibility/eligibility.engine'

const r = (field: string, op: string, value: string) => ({ field, op, value })
const PM_KISAN = [r('incomeMax', 'lte', '300000'), r('landHolder', 'eq', 'yes')]

describe('eligibility engine', () => {
  it('is eligible when every recorded condition is met', () => {
    const e = evaluate(PM_KISAN, { annualIncome: 240000, landHolder: 'yes' })
    expect(e.verdict).toBe('eligible')
    expect(e.conditions.map((c) => [c.text, c.met])).toEqual([
      ['Annual income (₹) ≤ 3,00,000', true],
      ['Owns agricultural land is yes', true],
    ])
  })

  it('is not eligible when any condition fails, even if others are unknown', () => {
    expect(evaluate(PM_KISAN, { annualIncome: 450000 }).verdict).toBe('not_eligible')
    expect(evaluate(PM_KISAN, { annualIncome: 100000, landHolder: 'no' }).verdict).toBe('not_eligible')
  })

  it('asks for what it needs when nothing fails yet', () => {
    const e = evaluate(PM_KISAN, { annualIncome: 240000 })
    expect(e).toMatchObject({ verdict: 'needs_info', missing: ['landHolder'] })
    expect(evaluate(PM_KISAN, {}).missing).toEqual(['annualIncome', 'landHolder'])
  })

  it('leaves schemes without machine-checkable rules to the department', () => {
    expect(evaluate([], { annualIncome: 1 })).toEqual({ verdict: 'department_review', conditions: [], missing: [] })
  })

  it('compares text without case and numbers as numbers', () => {
    expect(evaluate([r('gender', 'eq', 'Female')], { gender: 'female' }).verdict).toBe('eligible')
    expect(evaluate([r('gender', 'eq', 'Female')], { gender: 'Male' }).verdict).toBe('not_eligible')
    expect(evaluate([r('district', 'in', 'Chennai,Madurai')], { district: 'madurai' }).verdict).toBe('eligible')
    expect(evaluate([r('district', 'neq', 'Chennai')], { district: 'Chennai' }).verdict).toBe('not_eligible')
    expect(evaluate([r('ageMin', 'gte', '18')], { age: 18 }).verdict).toBe('eligible')
    expect(evaluate([r('ageMax', 'lt', '60')], { age: 60 }).verdict).toBe('not_eligible')
    expect(evaluate([r('annualIncome', 'gt', '1000')], { annualIncome: '1000.5' }).verdict).toBe('eligible')
  })

  it('treats a comparison it cannot make as unknown, never as met', () => {
    expect(evaluate([r('incomeMax', 'lte', '300000')], { annualIncome: 'not given' }).verdict).toBe('needs_info')
    expect(evaluate([r('community', 'eq', 'BC')], { community: '' }).verdict).toBe('needs_info')
  })

  it('works out age from the date formats the platform stores', () => {
    const today = new Date('2026-10-29T00:00:00Z')
    expect(ageFrom('22 May 2002', today)).toBe(24)
    expect(ageFrom('2002-11-01', today)).toBe(23)
    expect(ageFrom('29/10/2008', today)).toBe(18)
    expect(ageFrom('not a date', today)).toBeUndefined()
  })
})

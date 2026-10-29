import { eligibilityOf, isServed } from '../../src/modules/catalog/eligibility'

const r = (field: string, op: string, value: string) => ({ field, op, value })

describe('eligibility summary served by the schemes API', () => {
  it('serves the income ceiling as a number, as the seed stores it', () => {
    expect(eligibilityOf([r('incomeMax', 'lte', '300000')])).toEqual({ incomeMax: 300000 })
    expect(eligibilityOf([])).toEqual({})
  })

  it('serves every key the portal reads, each in its own type', () => {
    expect(eligibilityOf([r('ageMin', 'gte', '18'), r('ageMax', 'lte', '60'), r('categories', 'in', 'BC,MBC')]))
      .toEqual({ ageMin: 18, ageMax: 60, categories: ['BC', 'MBC'] })
    expect(eligibilityOf([r('categories', 'eq', 'SC')])).toEqual({ categories: ['SC'] })
  })

  it('never serves a condition in a shape the portal would reject', () => {
    const odd = [
      r('incomeMax', 'lt', '300000'), r('incomeMax', 'lte', 'abc'), r('ageMin', 'lte', '18'),
      r('annualIncome', 'gt', '1000'), r('district', 'in', 'Chennai,Madurai'), r('ageMax', 'eq', '60'),
    ]
    expect(eligibilityOf(odd)).toEqual({})
    for (const c of odd) expect(isServed(c)).toBe(false)
    // Every value served has the type the portal's SchemeSchema declares.
    const e = eligibilityOf([...odd, r('incomeMax', 'lte', '250000'), r('categories', 'in', 'BC')])
    expect(typeof e.incomeMax).toBe('number')
    expect(Array.isArray(e.categories)).toBe(true)
  })
})

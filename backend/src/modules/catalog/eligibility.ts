/**
 * The `eligibility` summary the schemes API serves, in exactly the shape the
 * portal's SchemeSchema reads (src/types/models/scheme.ts). Each key accepts
 * one kind of stored condition. Any other condition stays in the rule store
 * and in the DMN export, but is never served here in a shape the portal would
 * reject, which would fail the whole schemes list.
 */
export interface Eligibility { incomeMax?: number; ageMin?: number; ageMax?: number; categories?: string[] }

type Condition = { field: string; op: string; value: string }

/** The one operator, and the kind of value, each served key takes. */
export const PORTAL_KEYS: Record<keyof Eligibility, { op: string[]; kind: 'number' | 'string' }> = {
  incomeMax: { op: ['lte'], kind: 'number' },
  ageMin: { op: ['gte'], kind: 'number' },
  ageMax: { op: ['lte'], kind: 'number' },
  categories: { op: ['in', 'eq'], kind: 'string' },
}

const NUMBER = /^-?\d+(\.\d+)?$/

/** Whether the portal's eligibility summary shows this condition. */
export function isServed(r: Condition): boolean {
  const key = PORTAL_KEYS[r.field as keyof Eligibility]
  if (!key || !key.op.includes(r.op)) return false
  return key.kind === 'string' || NUMBER.test(r.value)
}

export function eligibilityOf(rules: Condition[]): Eligibility {
  const out: Eligibility = {}
  for (const r of rules.filter(isServed)) {
    if (r.field === 'categories') out.categories = r.value.split(',')
    else out[r.field as 'incomeMax' | 'ageMin' | 'ageMax'] = Number(r.value)
  }
  return out
}

/**
 * Scheme eligibility engine. Evaluates a scheme's recorded conditions
 * (EligibilityRule rows, the same ones exported and imported as DMN) against
 * what is known about a person. Pure: no I/O, so it is unit-tested directly.
 *
 * Verdicts are honest about what they rest on:
 *   eligible           every recorded condition is met
 *   not_eligible       at least one recorded condition is not met
 *   needs_info         nothing fails yet, but a condition needs a fact we lack
 *   department_review  the scheme has no machine-checkable condition
 * "Eligible" means the recorded conditions are met; the department still
 * verifies the claim against the full Government Order.
 */

export type Verdict = 'eligible' | 'not_eligible' | 'needs_info' | 'department_review'
export type FactKey = 'age' | 'gender' | 'district' | 'annualIncome' | 'landHolder' | 'community'
export type Facts = Partial<Record<FactKey, string | number>>

export interface Rule { field: string; op: string; value: string }
export interface ConditionResult {
  /** e.g. "Annual income (₹) ≤ 3,00,000" */
  text: string
  fact: string
  /** The person's value, if known. */
  actual?: string | number
  /** true met, false not met, null unknown. */
  met: boolean | null
}
export interface Evaluation { verdict: Verdict; conditions: ConditionResult[]; missing: string[] }

/** Which fact a rule field reads. Unknown fields read a fact of the same name. */
const FACT_OF: Record<string, FactKey> = {
  incomeMax: 'annualIncome', annualIncome: 'annualIncome',
  ageMin: 'age', ageMax: 'age', age: 'age',
  categories: 'community', community: 'community',
  gender: 'gender', district: 'district', landHolder: 'landHolder',
}

export const FACT_LABELS: Record<string, string> = {
  annualIncome: 'Annual income (₹)', age: 'Age', gender: 'Gender', district: 'District',
  landHolder: 'Owns agricultural land', community: 'Community',
}

const SYMBOL: Record<string, string> = { lte: '≤', lt: '<', gte: '≥', gt: '>', eq: 'is', neq: 'is not', in: 'is one of' }
const NUMBER = /^-?\d+(\.\d+)?$/
const num = (v: string | number) => (typeof v === 'number' ? v : NUMBER.test(v.trim()) ? Number(v) : NaN)
const same = (a: string | number, b: string) => {
  const x = num(a), y = num(b)
  return Number.isFinite(x) && Number.isFinite(y) ? x === y : String(a).trim().toLowerCase() === b.trim().toLowerCase()
}
const show = (fact: string, v: string | number) =>
  fact === 'annualIncome' && Number.isFinite(num(v)) ? num(v).toLocaleString('en-IN') : String(v)

function test(op: string, actual: string | number, value: string): boolean | null {
  switch (op) {
    case 'lte': case 'lt': case 'gte': case 'gt': {
      const a = num(actual), b = num(value)
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null
      return op === 'lte' ? a <= b : op === 'lt' ? a < b : op === 'gte' ? a >= b : a > b
    }
    case 'eq': return same(actual, value)
    case 'neq': return !same(actual, value)
    case 'in': return value.split(',').some((v) => same(actual, v))
    default: return null
  }
}

export function factOf(field: string): string {
  return FACT_OF[field] ?? field
}

export function evaluate(rules: Rule[], facts: Facts): Evaluation {
  if (rules.length === 0) return { verdict: 'department_review', conditions: [], missing: [] }
  const conditions = rules.map((r): ConditionResult => {
    const fact = factOf(r.field)
    const label = FACT_LABELS[fact] ?? fact
    const shown = r.op === 'in' ? r.value.split(',').join(', ') : show(fact, r.value)
    const actual = (facts as Record<string, string | number | undefined>)[fact]
    const known = actual !== undefined && actual !== null && String(actual).trim() !== ''
    return { text: `${label} ${SYMBOL[r.op] ?? r.op} ${shown}`, fact, actual: known ? actual : undefined, met: known ? test(r.op, actual, r.value) : null }
  })
  const missing = [...new Set(conditions.filter((c) => c.met === null).map((c) => c.fact))]
  const verdict: Verdict = conditions.some((c) => c.met === false) ? 'not_eligible' : missing.length ? 'needs_info' : 'eligible'
  return { verdict, conditions, missing }
}

/** Age in whole years on `today`, from "22 May 2002", "2002-05-22" or "22/05/2002". */
export function ageFrom(dob: string, today = new Date()): number | undefined {
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dob.trim())
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob.trim())
  const d = dmy ? new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]))
    : iso ? new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]))
    : new Date(`${dob.trim()} UTC`)
  if (Number.isNaN(d.getTime())) return undefined
  let age = today.getUTCFullYear() - d.getUTCFullYear()
  const before = today.getUTCMonth() < d.getUTCMonth() || (today.getUTCMonth() === d.getUTCMonth() && today.getUTCDate() < d.getUTCDate())
  if (before) age -= 1
  return age >= 0 && age < 150 ? age : undefined
}

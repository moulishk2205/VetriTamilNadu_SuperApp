/**
 * DMN 1.3 export of the welfare-scheme eligibility rules (EligibilityRule rows).
 * One decision per scheme. A scheme with rules gets a FIRST-hit decision table:
 * rule 1 says "eligible" when every condition holds, rule 2 says "not eligible"
 * otherwise. A scheme with no machine-checkable rule gets a literal
 * "department review", so the export never claims eligibility it cannot check.
 * `readDmnDecisions` reads such a file back after it was edited in a modeller.
 */
import { PORTAL_KEYS } from '../catalog/eligibility'
import { attr, many, parseXml, textOf, XmlImportError } from './xml'

export interface SchemeRules {
  id: string
  name: string
  department: string
  rules: { id: string; field: string; op: string; value: string }[]
}

interface InputVar { name: string; label: string; typeRef: 'number' | 'string' }

const ANNUAL_INCOME: InputVar = { name: 'annualIncome', label: 'Annual income (₹)', typeRef: 'number' }

/**
 * Known rule fields. `incomeMax` (≤ ceiling, what the catalogue serves as
 * `eligibility.incomeMax`) and `annualIncome` (any other comparison, written
 * by a DMN import) are both the applicant's annual income. Other fields export
 * under their own FEEL-safe name.
 */
const FIELDS: Record<string, InputVar> = { incomeMax: ANNUAL_INCOME, annualIncome: ANNUAL_INCOME }

const NUMBER = /^-?\d+(\.\d+)?$/

function inputFor(field: string, value: string): InputVar {
  const known = FIELDS[field]
  if (known) return known
  const name = field.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1')
  return { name, label: field, typeRef: NUMBER.test(value) ? 'number' : 'string' }
}

/** FEEL unary test for one rule, or null when the operator has no translation. */
function unaryTest(op: string, value: string, typeRef: InputVar['typeRef']): string | null {
  const lit = (v: string) => (typeRef === 'number' ? v.trim() : `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  const parts = op === 'in' ? value.split(',') : [value]
  if (typeRef === 'number' && !parts.every((v) => NUMBER.test(v.trim()))) return null
  switch (op) {
    case 'lte': return `<= ${lit(value)}`
    case 'lt': return `< ${lit(value)}`
    case 'gte': return `>= ${lit(value)}`
    case 'gt': return `> ${lit(value)}`
    case 'eq': return lit(value)
    case 'neq': return `not(${lit(value)})`
    case 'in': return parts.map(lit).join(', ')
    default: return null
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** XML IDs are NCNames: letters, digits, '_', '-', '.', not starting with a digit. */
const xid = (s: string) => s.replace(/[^A-Za-z0-9_.-]/g, '_')

const DEC = { w: 180, h: 80, gap: 40, y: 220 }
const INP = { w: 140, h: 46, y: 60 }
const LEFT = 40

export function toDmnXml(schemes: SchemeRules[]): string {
  // One inputData per distinct input variable, in first-seen order.
  const inputs = new Map<string, InputVar>()
  for (const s of schemes) for (const r of s.rules) {
    const v = inputFor(r.field, r.value)
    if (!inputs.has(v.name)) inputs.set(v.name, v)
  }

  const drg: string[] = []
  const shapes: string[] = []
  const edges: string[] = []
  const decX = (i: number) => LEFT + i * (DEC.w + DEC.gap)
  const rowWidth = schemes.length * (DEC.w + DEC.gap) - DEC.gap
  const inputList = [...inputs.values()]
  const inpX = (i: number) => LEFT + Math.round(((i + 1) * rowWidth) / (inputList.length + 1)) - INP.w / 2
  const inputPos = new Map(inputList.map((v, i) => [v.name, { x: inpX(i), y: INP.y }]))

  inputList.forEach((v) => {
    const id = `InputData_${xid(v.name)}`
    drg.push(
      `  <inputData id="${id}" name="${esc(v.name)}">`,
      `    <description>${esc(v.label)}</description>`,
      `    <variable id="${id}_var" name="${esc(v.name)}" typeRef="${v.typeRef}" />`,
      '  </inputData>',
    )
    const p = inputPos.get(v.name)!
    shapes.push(`      <dmndi:DMNShape id="${id}_di" dmnElementRef="${id}">`, `        <dc:Bounds x="${p.x}" y="${p.y}" width="${INP.w}" height="${INP.h}" />`, '      </dmndi:DMNShape>')
  })

  schemes.forEach((s, i) => {
    const id = `Decision_${xid(s.id)}`
    const name = `${s.name} eligibility`
    const tests = s.rules.map((r) => {
      // The shared inputData decides the type, so every table agrees with it.
      const v = inputs.get(inputFor(r.field, r.value).name)!
      return { rule: r, input: v, test: unaryTest(r.op, r.value, v.typeRef) }
    })
    const untranslatable = tests.filter((t) => t.test === null)
    const used = untranslatable.length === 0 ? tests : []
    const requiredInputs = [...new Set(used.map((t) => t.input.name))]

    const desc = s.rules.length === 0
      ? `${s.department}. No machine-checkable rule is recorded; the department assesses eligibility.`
      : untranslatable.length
        ? `${s.department}. Rule(s) ${untranslatable.map((t) => `${t.rule.field} ${t.rule.op} ${t.rule.value}`).join('; ')} have no DMN translation; the department assesses eligibility.`
        : `${s.department}. Only the conditions recorded in VETRI are checked here; other conditions in the Government Order are assessed by the department.`

    drg.push(`  <decision id="${id}" name="${esc(name)}">`, `    <description>${esc(desc)}</description>`, `    <variable id="${id}_var" name="${esc(name)}" typeRef="string" />`)
    requiredInputs.forEach((n, k) => {
      const irId = `${id}_ir${k}`
      drg.push(`    <informationRequirement id="${irId}">`, `      <requiredInput href="#InputData_${xid(n)}" />`, '    </informationRequirement>')
      const from = inputPos.get(n)!
      edges.push(
        `      <dmndi:DMNEdge id="${irId}_di" dmnElementRef="${irId}">`,
        `        <di:waypoint x="${from.x + INP.w / 2}" y="${from.y + INP.h}" />`,
        `        <di:waypoint x="${decX(i) + DEC.w / 2}" y="${DEC.y}" />`,
        '      </dmndi:DMNEdge>',
      )
    })

    if (used.length === 0) {
      drg.push(`    <literalExpression id="${id}_expr">`, '      <text>"department review"</text>', '    </literalExpression>')
    } else {
      drg.push(`    <decisionTable id="${id}_table" hitPolicy="FIRST">`)
      used.forEach((t, k) => drg.push(
        `      <input id="${id}_in${k}" label="${esc(t.input.label)}">`,
        `        <inputExpression id="${id}_in${k}_expr" typeRef="${t.input.typeRef}">`,
        `          <text>${esc(t.input.name)}</text>`,
        '        </inputExpression>',
        '      </input>',
      ))
      drg.push(
        `      <output id="${id}_out" name="eligibility" typeRef="string">`,
        `        <outputValues id="${id}_out_values">`,
        '          <text>"eligible","not eligible"</text>',
        '        </outputValues>',
        '      </output>',
      )
      const rule = (k: number, entries: string[], result: string) => drg.push(
        `      <rule id="${id}_r${k}">`,
        ...entries.map((e, j) => `        <inputEntry id="${id}_r${k}_i${j}">\n          <text>${esc(e)}</text>\n        </inputEntry>`),
        `        <outputEntry id="${id}_r${k}_o">`,
        `          <text>${esc(result)}</text>`,
        '        </outputEntry>',
        '      </rule>',
      )
      rule(1, used.map((t) => t.test!), '"eligible"')
      rule(2, used.map(() => '-'), '"not eligible"')
      drg.push('    </decisionTable>')
    }
    drg.push('  </decision>')
    shapes.push(`      <dmndi:DMNShape id="${id}_di" dmnElementRef="${id}">`, `        <dc:Bounds x="${decX(i)}" y="${DEC.y}" width="${DEC.w}" height="${DEC.h}" />`, '      </dmndi:DMNShape>')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"',
    '  xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/" xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"',
    '  id="Definitions_scheme_eligibility" name="Welfare scheme eligibility" namespace="https://vetri.tn/dmn" exporter="VETRI workflow engine" exporterVersion="1.0">',
    ...drg,
    '  <dmndi:DMNDI>',
    '    <dmndi:DMNDiagram id="DMNDiagram_1">',
    ...shapes,
    ...edges,
    '    </dmndi:DMNDiagram>',
    '  </dmndi:DMNDI>',
    '</definitions>',
    '',
  ].join('\n')
}

// ─── Import ──────────────────────────────────────────────────────────────────

/** One condition as stored in EligibilityRule. */
export interface RuleSpec { field: string; op: string; value: string }
export interface ImportedDecision { id: string; name: string; rules: RuleSpec[] }

const DMN_MODEL_NS = /https?:\/\/www\.omg\.org\/spec\/DMN\/\d{8}\/MODEL\/?/
const VARIABLE = /^[A-Za-z_][A-Za-z0-9_]*$/
const STRING = /^"((?:[^"\\]|\\["\\])*)"$/

/** The scheme id an exported decision id carries ("Decision_<schemeId>"). */
export const schemeIdOf = (decisionId: string) => (decisionId.startsWith('Decision_') ? decisionId.slice('Decision_'.length) : decisionId)

type Literal = { kind: 'number' | 'string'; value: string }

function literalOf(token: string): Literal | null {
  const t = token.trim()
  if (NUMBER.test(t)) return { kind: 'number', value: t }
  const m = STRING.exec(t)
  return m ? { kind: 'string', value: m[1].replace(/\\(["\\])/g, '$1') } : null
}

/** Splits "a, b" on commas outside string literals. */
function splitList(text: string): string[] {
  const parts: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\' && quoted) { cur += ch + (text[i + 1] ?? ''); i++; continue }
    if (ch === '"') quoted = !quoted
    if (ch === ',' && !quoted) { parts.push(cur); cur = '' } else cur += ch
  }
  parts.push(cur)
  return parts
}

/**
 * The FEEL unary tests the rule store can hold: a comparison with a number,
 * a single value, a list of values, or not(value). Anything else is refused
 * with a reason, rather than stored as something it is not.
 */
function parseUnaryTest(text: string, typeRef: string | undefined): { op: string; value: string; kind: Literal['kind'] } | string {
  const mismatch = (l: Literal) => (typeRef === 'number' || typeRef === 'string') && l.kind !== typeRef
  const cmp = /^(<=|>=|<|>)\s*(.+)$/.exec(text)
  if (cmp) {
    const l = literalOf(cmp[2])
    if (!l || l.kind !== 'number') return `"${text}": a comparison needs a number`
    if (mismatch(l)) return `"${text}": the column holds ${typeRef}s`
    return { op: { '<=': 'lte', '>=': 'gte', '<': 'lt', '>': 'gt' }[cmp[1]] as string, value: l.value, kind: 'number' }
  }
  const neg = /^not\((.*)\)$/.exec(text)
  if (neg) {
    const l = literalOf(neg[1])
    if (!l) return `"${text}": not() can hold one value only`
    if (mismatch(l)) return `"${text}": the column holds ${typeRef}s`
    return { op: 'neq', value: l.value, kind: l.kind }
  }
  const items = splitList(text).map(literalOf)
  if (items.some((l) => l === null)) {
    return `"${text}" is not a test VETRI can store (use <, <=, >, >= with a number, a value, a list of values, or not(value))`
  }
  const lits = items as Literal[]
  if (lits.some(mismatch) || new Set(lits.map((l) => l.kind)).size > 1) return `"${text}": the values must all be ${typeRef ?? 'of one type'}`
  if (lits.length === 1) return { op: 'eq', value: lits[0].value, kind: lits[0].kind }
  if (lits.some((l) => l.value.includes(','))) return `"${text}": a listed value cannot contain a comma`
  return { op: 'in', value: lits.map((l) => l.value).join(','), kind: lits[0].kind }
}

const RESERVED_MEANING: Record<string, string> = {
  incomeMax: '"<= number" (the income ceiling)',
  ageMin: '">= number"',
  ageMax: '"<= number"',
  categories: 'a text value or a list of text values',
}

/** The rule-store field for a DMN input: the income ceiling keeps its catalogue name. */
function fieldFor(input: string, op: string): string {
  return input === ANNUAL_INCOME.name && op === 'lte' ? 'incomeMax' : input
}

/** Conditions of one decision table, or the reason it cannot be stored. */
function readTable(table: Record<string, unknown>, where: string): RuleSpec[] | string {
  const hit = attr(table, 'hitPolicy') ?? 'UNIQUE'
  if (hit !== 'FIRST') return `${where}: the hit policy must be FIRST (found ${hit})`
  if (many(table, 'output').length !== 1) return `${where}: the table needs exactly one output column`
  const inputs = many(table, 'input').map((i) => ({ name: textOf(i.inputExpression).trim(), typeRef: attr(i.inputExpression, 'typeRef') }))
  const bad = inputs.find((i) => !VARIABLE.test(i.name))
  if (bad) return `${where}: input "${bad.name}" must be a plain variable name`
  for (const i of inputs) {
    if (i.name === ANNUAL_INCOME.name && i.typeRef !== undefined && i.typeRef !== 'number') return `${where}: ${ANNUAL_INCOME.name} must be a number column`
  }
  const rows = many(table, 'rule').map((r) => ({
    entries: many(r, 'inputEntry').map((e) => textOf(e).trim()),
    outputs: many(r, 'outputEntry').map((e) => textOf(e).trim()),
  }))
  for (const [k, r] of rows.entries()) {
    if (r.entries.length !== inputs.length || r.outputs.length !== 1) return `${where}: row ${k + 1} does not match the table's columns`
    if (r.outputs[0] !== '"eligible"' && r.outputs[0] !== '"not eligible"') return `${where}: row ${k + 1} must output "eligible" or "not eligible"`
  }
  const eligible = rows.filter((r) => r.outputs[0] === '"eligible"')
  // The store holds one set of conditions that must all hold (AND). Under FIRST,
  // that is exactly: the "eligible" row first, then only catch-all rows.
  if (eligible.length !== 1) return `${where}: VETRI stores one set of conditions per scheme, so the table needs exactly one "eligible" row (found ${eligible.length})`
  if (rows[0] !== eligible[0]) return `${where}: the "eligible" row must come first`
  if (rows.slice(1).some((r) => r.entries.some((e) => e !== '-' && e !== ''))) return `${where}: rows after the "eligible" row must match everything ("-")`

  const specs: RuleSpec[] = []
  for (const [k, input] of inputs.entries()) {
    const entry = eligible[0].entries[k]
    if (entry === '-' || entry === '') continue
    const test = parseUnaryTest(entry, input.name === ANNUAL_INCOME.name ? 'number' : input.typeRef)
    if (typeof test === 'string') return `${where}, ${input.name}: ${test}`
    const field = fieldFor(input.name, test.op)
    // The portal's eligibility summary reads these names with one meaning
    // each; anything else under them would be served in a shape it rejects.
    const reserved = PORTAL_KEYS[field as keyof typeof PORTAL_KEYS]
    if (reserved && (!reserved.op.includes(test.op) || reserved.kind !== test.kind)) {
      return `${where}, ${input.name}: the portal reads "${field}" only as ${RESERVED_MEANING[field]}`
    }
    specs.push({ field, op: test.op, value: test.value })
  }
  // An unconditional "eligible" is not something the store can say: no rules
  // means "the department decides", which is what the literal is for.
  if (specs.length === 0) return `${where}: the "eligible" row has no conditions; to leave the decision to the department, use the literal "department review"`
  return specs
}

/**
 * Reads a DMN file (as exported, after editing in any DMN modeller) back into
 * eligibility conditions, one entry per decision. Throws XmlImportError with
 * every problem found, so nothing is half-imported.
 */
export function readDmnDecisions(xml: string): ImportedDecision[] {
  const defs = parseXml(xml).definitions
  if (!defs || typeof defs !== 'object' || !DMN_MODEL_NS.test(xml)) throw new XmlImportError(['This is not a DMN file (no DMN <definitions> element)'])
  const problems: string[] = []
  const decisions: ImportedDecision[] = []
  for (const d of many(defs, 'decision')) {
    const id = attr(d, 'id') ?? ''
    const name = attr(d, 'name') ?? id
    const where = `Decision "${name}"`
    if (d.literalExpression !== undefined) {
      if (textOf(d.literalExpression).trim() === '"department review"') decisions.push({ id, name, rules: [] })
      else problems.push(`${where}: a literal expression can only be "department review"`)
      continue
    }
    if (!d.decisionTable || typeof d.decisionTable !== 'object') {
      problems.push(`${where}: has no decision table`)
      continue
    }
    const rules = readTable(d.decisionTable as Record<string, unknown>, where)
    if (typeof rules === 'string') problems.push(rules)
    else decisions.push({ id, name, rules })
  }
  if (problems.length) throw new XmlImportError(problems)
  if (decisions.length === 0) throw new XmlImportError(['The file has no decisions'])
  return decisions
}

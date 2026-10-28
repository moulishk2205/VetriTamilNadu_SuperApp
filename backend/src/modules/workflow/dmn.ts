/**
 * DMN 1.3 export of the welfare-scheme eligibility rules (EligibilityRule rows).
 * One decision per scheme. A scheme with rules gets a FIRST-hit decision table:
 * rule 1 says "eligible" when every condition holds, rule 2 says "not eligible"
 * otherwise. A scheme with no machine-checkable rule gets a literal
 * "department review", so the export never claims eligibility it cannot check.
 */

export interface SchemeRules {
  id: string
  name: string
  department: string
  rules: { id: string; field: string; op: string; value: string }[]
}

interface InputVar { name: string; label: string; typeRef: 'number' | 'string' }

/** Known rule fields. Others export under their own (FEEL-safe) name. */
const FIELDS: Record<string, InputVar> = {
  incomeMax: { name: 'annualIncome', label: 'Annual income (₹)', typeRef: 'number' },
}

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

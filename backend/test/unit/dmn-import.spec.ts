import { readDmnDecisions, schemeIdOf, toDmnXml, type SchemeRules } from '../../src/modules/workflow/dmn'
import { XmlImportError } from '../../src/modules/workflow/xml'

const scheme = (id: string, name: string, rules: { field: string; op: string; value: string }[] = []): SchemeRules => ({
  id, name, department: 'Revenue', rules: rules.map((r, i) => ({ id: `${id}-${i}`, ...r })),
})

/** Problems reported for a file, or [] when it imports. */
function problemsOf(xml: string): string[] {
  try {
    readDmnDecisions(xml)
    return []
  } catch (e) {
    if (e instanceof XmlImportError) return e.problems
    throw e
  }
}

/** One exported table whose single condition is replaced by `entry`. */
const withEntry = (entry: string, typeRef = 'number') =>
  toDmnXml([scheme('s1', 'One', [{ field: 'incomeMax', op: 'lte', value: '300000' }])])
    .replace('&lt;= 300000', entry.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'))
    .replace(/(<inputExpression [^>]*typeRef=")number(")/, `$1${typeRef}$2`)

describe('DMN import: round trip of our own export', () => {
  const schemes = [
    scheme('a', 'Ceiling', [{ field: 'incomeMax', op: 'lte', value: '300000' }]),
    scheme('b', 'Manual'),
    scheme('c', 'Mixed', [
      { field: 'district', op: 'in', value: 'Chennai,Madurai' },
      { field: 'gender', op: 'eq', value: 'Female' },
      { field: 'caste', op: 'neq', value: 'X "Y"' },
      { field: 'age', op: 'gte', value: '18' },
      { field: 'annualIncome', op: 'gt', value: '1000' },
    ]),
  ]

  it('reads back exactly the conditions it wrote', () => {
    const decisions = readDmnDecisions(toDmnXml(schemes))
    const norm = (rules: { field: string; op: string; value: string }[]) => rules.map((r) => `${r.field}|${r.op}|${r.value}`).sort()
    expect(decisions.map((d) => schemeIdOf(d.id))).toEqual(['a', 'b', 'c'])
    for (const [i, d] of decisions.entries()) expect(norm(d.rules)).toEqual(norm(schemes[i].rules))
  })

  it('reads "department review" as no conditions', () => {
    expect(readDmnDecisions(toDmnXml([scheme('b', 'Manual')]))[0].rules).toEqual([])
  })
})

describe('DMN import: FEEL tests it accepts', () => {
  it.each([
    ['< 250000', { field: 'annualIncome', op: 'lt', value: '250000' }],
    ['>= 1000', { field: 'annualIncome', op: 'gte', value: '1000' }],
    ['> 5', { field: 'annualIncome', op: 'gt', value: '5' }],
    ['<= 120000', { field: 'incomeMax', op: 'lte', value: '120000' }],
    ['42', { field: 'annualIncome', op: 'eq', value: '42' }],
    ['not(7)', { field: 'annualIncome', op: 'neq', value: '7' }],
    ['1, 2, 3', { field: 'annualIncome', op: 'in', value: '1,2,3' }],
  ])('%s', (entry, rule) => {
    expect(readDmnDecisions(withEntry(entry))[0].rules).toEqual([rule])
  })
})

describe('DMN import: what it refuses, with a reason', () => {
  it.each([
    ['[1..5]', 'is not a test VETRI can store'],
    ['<= "abc"', 'a comparison needs a number'],
    ['"abc"', 'must all be number'],
    ['not(1, 2)', 'not() can hold one value only'],
    ['annualIncome * 2', 'is not a test VETRI can store'],
  ])('%s', (entry, reason) => {
    expect(problemsOf(withEntry(entry)).join(' ')).toContain(reason)
  })

  it('a hit policy other than FIRST', () => {
    expect(problemsOf(withEntry('<= 5').replace('hitPolicy="FIRST"', 'hitPolicy="ANY"'))[0]).toContain('hit policy must be FIRST')
  })

  it('an OR across two "eligible" rows', () => {
    const xml = withEntry('<= 5').replace('&quot;not eligible&quot;', '&quot;eligible&quot;')
    expect(problemsOf(xml)[0]).toContain('exactly one "eligible" row (found 2)')
  })

  it('an "eligible" row that is not first', () => {
    const xml = withEntry('<= 5')
      .replace('&quot;eligible&quot;', '&quot;TMP&quot;')
      .replace('&quot;not eligible&quot;', '&quot;eligible&quot;')
      .replace('&quot;TMP&quot;', '&quot;not eligible&quot;')
    expect(problemsOf(xml).join(' ')).toMatch(/must come first|must match everything/)
  })

  it('an "eligible" row without conditions', () => {
    expect(problemsOf(withEntry('-'))[0]).toContain('use the literal "department review"')
  })

  it('a literal other than "department review"', () => {
    const xml = toDmnXml([scheme('b', 'Manual')]).replace('"department review"', '"eligible"')
    expect(problemsOf(xml)[0]).toContain('can only be "department review"')
  })

  it('an expression instead of a variable as input', () => {
    expect(problemsOf(withEntry('<= 5').replace('<text>annualIncome</text>', '<text>income / 12</text>'))[0]).toContain('plain variable name')
  })

  it('annual income typed as text', () => {
    expect(problemsOf(withEntry('<= 5', 'string'))[0]).toContain('must be a number column')
  })

  it('every problem at once, not just the first', () => {
    const xml = toDmnXml([
      scheme('a', 'A', [{ field: 'incomeMax', op: 'lte', value: '1' }]),
      scheme('b', 'B', [{ field: 'incomeMax', op: 'lte', value: '2' }]),
    ]).replace(/hitPolicy="FIRST"/g, 'hitPolicy="COLLECT"')
    expect(problemsOf(xml)).toHaveLength(2)
  })
})

describe('DMN import: names the portal reads with one meaning', () => {
  const one = (field: string, op: string, value: string) => toDmnXml([scheme('s', 'S', [{ field, op, value }])])

  it('accepts them used as the portal reads them', () => {
    expect(readDmnDecisions(one('ageMin', 'gte', '18'))[0].rules).toEqual([{ field: 'ageMin', op: 'gte', value: '18' }])
    expect(readDmnDecisions(one('ageMax', 'lte', '60'))[0].rules).toEqual([{ field: 'ageMax', op: 'lte', value: '60' }])
    expect(readDmnDecisions(one('categories', 'in', 'BC,MBC'))[0].rules).toEqual([{ field: 'categories', op: 'in', value: 'BC,MBC' }])
  })

  it('refuses them with another operator or type, which would break the schemes list', () => {
    expect(problemsOf(one('ageMin', 'gte', '18').replace('&gt;= 18', '&lt; 18'))[0]).toContain('the portal reads "ageMin" only as ">= number"')
    expect(problemsOf(one('ageMax', 'lte', '60').replace('&lt;= 60', '60'))[0]).toContain('the portal reads "ageMax" only as "<= number"')
    const numericCategory = one('categories', 'in', 'BC,MBC').replace('&quot;BC&quot;, &quot;MBC&quot;', '5').replace(/typeRef="string"/g, 'typeRef="number"')
    expect(problemsOf(numericCategory)[0]).toContain('the portal reads "categories" only as a text value or a list of text values')
    const ceiling = withEntry('< 5').replace('<text>annualIncome</text>', '<text>incomeMax</text>')
    expect(problemsOf(ceiling)[0]).toContain('the portal reads "incomeMax" only as "<= number" (the income ceiling)')
  })
})

describe('DMN import: file-level checks', () => {
  it('reports XML the validator lets through but the parser cannot read, never as a crash', () => {
    const declaration = toDmnXml([scheme('a', 'A')]).replace('<?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1="UTF-8"?>')
    expect(problemsOf(declaration)[0]).toMatch(/not well-formed|could not be read as XML/)
    const deep = `<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/">${'<x>'.repeat(150)}${'</x>'.repeat(150)}</definitions>`
    expect(problemsOf(deep)[0]).toMatch(/not well-formed|could not be read as XML/)
  })

  it('refuses a DOCTYPE, so entities cannot be expanded', () => {
    const xml = '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaa">]><definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/">&a;</definitions>'
    expect(problemsOf(xml)[0]).toContain('DOCTYPE')
  })

  it('refuses XML that is not well-formed', () => {
    expect(problemsOf('<definitions><decision></definitions>')[0]).toContain('not well-formed')
  })

  it('refuses a file that is not DMN', () => {
    expect(problemsOf('<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"/>')[0]).toContain('not a DMN file')
    expect(problemsOf('<notes>hello</notes>')[0]).toContain('not a DMN file')
  })

  it('refuses a DMN file with no decisions', () => {
    expect(problemsOf('<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" id="x" name="x" namespace="x"/>')[0]).toContain('no decisions')
  })

  it('accepts a namespace prefix on DMN elements, as some modellers write', () => {
    const prefixed = toDmnXml([scheme('a', 'A', [{ field: 'incomeMax', op: 'lte', value: '9' }])])
      .replace('xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"', 'xmlns:dmn="https://www.omg.org/spec/DMN/20191111/MODEL/"')
      .replace(/<(\/?)(definitions|inputData|variable|decision|description|informationRequirement|requiredInput|decisionTable|input|inputExpression|text|output|outputValues|rule|inputEntry|outputEntry|literalExpression)([ >/])/g, '<$1dmn:$2$3')
    expect(readDmnDecisions(prefixed)[0].rules).toEqual([{ field: 'incomeMax', op: 'lte', value: '9' }])
  })
})

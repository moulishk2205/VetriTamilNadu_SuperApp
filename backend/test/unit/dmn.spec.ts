import { toDmnXml, type SchemeRules } from '../../src/modules/workflow/dmn'

const scheme = (id: string, name: string, rules: SchemeRules['rules'] = []): SchemeRules => ({ id, name, department: 'Revenue & Disaster Management', rules })
const rule = (field: string, op: string, value: string, id = `${field}-${op}`) => ({ id, field, op, value })

/** The XML of one decision, from its opening tag to its closing tag. */
function decision(xml: string, schemeId: string): string {
  const start = xml.indexOf(`<decision id="Decision_${schemeId}"`)
  expect(start).toBeGreaterThan(-1)
  return xml.slice(start, xml.indexOf('</decision>', start) + '</decision>'.length)
}

describe('DMN 1.3 export of scheme eligibility', () => {
  it('declares DMN 1.3 and one decision per scheme', () => {
    const xml = toDmnXml([scheme('a', 'A'), scheme('b', 'B', [rule('incomeMax', 'lte', '300000')])])
    expect(xml).toContain('xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"')
    expect(xml).toContain('xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/"')
    expect(xml).toContain('namespace="https://vetri.tn/dmn"')
    expect((xml.match(/<decision /g) ?? []).length).toBe(2)
  })

  it('turns an income ceiling into a FIRST-hit decision table', () => {
    const d = decision(toDmnXml([scheme('pmk', 'PM Kisan', [rule('incomeMax', 'lte', '300000')])]), 'pmk')
    expect(d).toContain('<decisionTable id="Decision_pmk_table" hitPolicy="FIRST">')
    expect(d).toContain('<text>annualIncome</text>')
    expect(d).toContain('typeRef="number"')
    // Rule 1: within the ceiling is eligible; rule 2: anything else is not.
    expect(d).toMatch(/<rule id="Decision_pmk_r1">[\s\S]*<text>&lt;= 300000<\/text>[\s\S]*<text>&quot;eligible&quot;<\/text>/)
    expect(d).toMatch(/<rule id="Decision_pmk_r2">[\s\S]*<text>-<\/text>[\s\S]*<text>&quot;not eligible&quot;<\/text>/)
    expect(d).toContain('<requiredInput href="#InputData_annualIncome" />')
  })

  it('never claims eligibility for a scheme without machine-checkable rules', () => {
    const d = decision(toDmnXml([scheme('lap', 'Laptop')]), 'lap')
    expect(d).not.toContain('<decisionTable')
    expect(d).toContain('<text>"department review"</text>')
    expect(d).toContain('No machine-checkable rule is recorded')
  })

  it('falls back to department review when a rule has no FEEL translation', () => {
    const d = decision(toDmnXml([scheme('x', 'X', [rule('incomeMax', 'between', '1-2'), rule('age', 'gte', '18')])]), 'x')
    expect(d).not.toContain('<decisionTable')
    expect(d).toContain('<text>"department review"</text>')
    expect(d).toContain('incomeMax between 1-2')
    // A malformed number is not translated either: "<= 1,000" is not FEEL.
    const bad = decision(toDmnXml([scheme('y', 'Y', [rule('incomeMax', 'lte', '1,000')])]), 'y')
    expect(bad).toContain('<text>"department review"</text>')
  })

  it('combines several rules with AND in one row', () => {
    const d = decision(toDmnXml([scheme('h', 'Housing', [rule('incomeMax', 'lte', '300000'), rule('age', 'gte', '21')])]), 'h')
    const r1 = d.slice(d.indexOf('<rule id="Decision_h_r1">'), d.indexOf('<rule id="Decision_h_r2">'))
    expect(r1).toContain('&lt;= 300000')
    expect(r1).toContain('&gt;= 21')
    expect((d.match(/<input id=/g) ?? []).length).toBe(2)
  })

  it('quotes string values and lists in FEEL', () => {
    const d = decision(toDmnXml([scheme('s', 'S', [rule('district', 'in', 'Chennai,Madurai'), rule('gender', 'eq', 'Female'), rule('caste', 'neq', 'X "Y"')])]), 's')
    expect(d).toContain('<text>&quot;Chennai&quot;, &quot;Madurai&quot;</text>')
    expect(d).toContain('<text>&quot;Female&quot;</text>')
    expect(d).toContain('<text>not(&quot;X \\&quot;Y\\&quot;&quot;)</text>')
    expect(d).toContain('typeRef="string"')
  })

  it('escapes XML in names and keeps ids valid', () => {
    const xml = toDmnXml([scheme('a b/c', "Women's Goat & Rearing <Scheme>", [rule('incomeMax', 'lte', '200000')])])
    expect(xml).toContain('name="Women\'s Goat &amp; Rearing &lt;Scheme&gt; eligibility"')
    expect(xml).toContain('<decision id="Decision_a_b_c"')
    expect(xml).not.toMatch(/id="[^"]*[\s/<>&][^"]*"/)
  })

  it('draws a diagram shape for every element and an edge per requirement', () => {
    const xml = toDmnXml([scheme('a', 'A', [rule('incomeMax', 'lte', '1')]), scheme('b', 'B')])
    expect(xml).toContain('<dmndi:DMNShape id="InputData_annualIncome_di" dmnElementRef="InputData_annualIncome">')
    expect(xml).toContain('<dmndi:DMNShape id="Decision_a_di" dmnElementRef="Decision_a">')
    expect(xml).toContain('<dmndi:DMNShape id="Decision_b_di" dmnElementRef="Decision_b">')
    expect(xml).toContain('<dmndi:DMNEdge id="Decision_a_ir0_di" dmnElementRef="Decision_a_ir0">')
    expect((xml.match(/<dmndi:DMNEdge /g) ?? []).length).toBe(1)
  })
})

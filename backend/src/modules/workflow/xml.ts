import { XMLParser, XMLValidator } from 'fast-xml-parser'

/** Thrown for an upload that is not acceptable XML; the message is safe to show. */
export class XmlImportError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join('; '))
  }
}

/** Elements that may repeat, so the parser always gives arrays for them. */
const REPEATED = new Set([
  // DMN
  'decision', 'inputData', 'input', 'output', 'rule', 'inputEntry', 'outputEntry', 'informationRequirement',
  // BPMN
  'process', 'task', 'userTask', 'serviceTask', 'manualTask', 'scriptTask', 'businessRuleTask', 'sendTask', 'receiveTask',
  'callActivity', 'subProcess', 'exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway', 'complexGateway',
  'startEvent', 'endEvent', 'intermediateThrowEvent', 'intermediateCatchEvent', 'boundaryEvent', 'sequenceFlow',
])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => REPEATED.has(name),
})

/**
 * Parses an uploaded BPMN/DMN file. A DOCTYPE is refused outright: the files
 * modellers write never need one, and declared entities could be expanded
 * into a huge document.
 */
export function parseXml(xml: string): Record<string, unknown> {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new XmlImportError(['The file declares a DOCTYPE or entities, which are not accepted'])
  const valid = XMLValidator.validate(xml)
  if (valid !== true) throw new XmlImportError([`The file is not well-formed XML: ${valid.err.msg} (line ${valid.err.line})`])
  try {
    return parser.parse(xml) as Record<string, unknown>
  } catch (e) {
    // The validator lets a few malformed inputs through (e.g. a broken <?xml?>
    // declaration, or nesting deeper than the parser allows); the parser then
    // throws. Those are still the file's fault: report them, never as a 500.
    throw new XmlImportError([`The file could not be read as XML: ${e instanceof Error ? e.message : String(e)}`])
  }
}

/** Attribute value, or undefined. */
export const attr = (node: unknown, name: string): string | undefined => {
  const v = (node as Record<string, unknown> | undefined)?.[`@_${name}`]
  return typeof v === 'string' ? v : undefined
}

/** The text of a `<text>` child (FEEL expression), '' when empty. */
export const textOf = (node: unknown): string => {
  const t = (node as Record<string, unknown> | undefined)?.text
  if (typeof t === 'string') return t
  if (t && typeof t === 'object' && typeof (t as Record<string, unknown>)['#text'] === 'string') return (t as Record<string, string>)['#text']
  return ''
}

/** Child elements as an array, whether the parser gave one, a single object or none. */
export const many = (node: unknown, name: string): Record<string, unknown>[] => {
  const v = (node as Record<string, unknown> | undefined)?.[name]
  if (v === undefined || v === null || v === '') return []
  return (Array.isArray(v) ? v : [v]).map((x) => (typeof x === 'object' && x !== null ? (x as Record<string, unknown>) : {}))
}

import { buildProcessModel, checkBpmnConformance, toBpmnXml } from '../../src/modules/workflow/bpmn'
import { XmlImportError } from '../../src/modules/workflow/xml'

const exported = toBpmnXml(buildProcessModel())
const model = buildProcessModel()
/** The id of the flow from one node to another in our export. */
const flowId = (from: string, to: string) => model.edges.find((e) => e.from === from && e.to === to)!.id

/** Removes one sequence flow (and its diagram edge) from the export. */
function withoutFlow(xml: string, id: string): string {
  return xml
    .replace(new RegExp(`\\s*<bpmn:sequenceFlow id="${id}"[^>]*/>`), '')
    .replace(new RegExp(`\\s*<bpmndi:BPMNEdge id="${id}_di"[\\s\\S]*?</bpmndi:BPMNEdge>`), '')
}

/** Adds a sequence flow to the export. */
const withFlow = (xml: string, from: string, to: string) =>
  xml.replace('  </bpmn:process>', `    <bpmn:sequenceFlow id="flow_extra" sourceRef="${from}" targetRef="${to}" />\n  </bpmn:process>`)

describe('BPMN import check', () => {
  it('finds our own export identical to the running workflow', () => {
    const report = checkBpmnConformance(exported)
    expect(report.differences).toEqual([])
    expect(report.conforms).toBe(true)
    expect(report.process.id).toBe('Process_gov_standard_v1')
    expect(report.tasks).toBe(model.nodes.filter((n) => n.kind === 'task').length)
    expect(report.flows).toBe(model.edges.length)
  })

  it('still conforms after a modeller renames ids but keeps the labels', () => {
    const renamed = exported.replace(/id="inspection"/, 'id="Activity_0x1"').replace(/"inspection"/g, '"Activity_0x1"')
      .replace(/(sourceRef|targetRef|bpmnElement)="inspection"/g, '$1="Activity_0x1"')
    expect(checkBpmnConformance(renamed).conforms).toBe(true)
  })

  it('reports a missing transition', () => {
    const report = checkBpmnConformance(withoutFlow(exported, flowId('gw_approval', 'end_rejected_approval')))
    expect(report.conforms).toBe(false)
    expect(report.differences).toContain('Missing: "Approval" → "Rejected"')
  })

  it('reports a transition the engine does not allow', () => {
    const report = checkBpmnConformance(withFlow(exported, 'submitted', 'approval'))
    expect(report.differences).toContain('Not in the running workflow: "Submitted" → "Approval"')
  })

  it('reports a stage with no task', () => {
    const xml = exported.replace(/<bpmn:userTask id="inspection"[\s\S]*?<\/bpmn:userTask>/, '')
    expect(checkBpmnConformance(xml).differences).toContain('Stage "Inspection" has no task')
  })

  it('reports an unknown task and a parallel gateway', () => {
    const xml = exported
      .replace('<bpmn:userTask id="inspection" name="Inspection">', '<bpmn:userTask id="inspection" name="Site photo upload">')
      .replace('<bpmn:exclusiveGateway id="gw_approval"', '<bpmn:parallelGateway id="gw_approval"')
      .replace(/(<bpmn:parallelGateway id="gw_approval"[\s\S]*?)<\/bpmn:exclusiveGateway>/, '$1</bpmn:parallelGateway>')
    const { differences } = checkBpmnConformance(xml)
    // Matched by id, so the renamed task still counts as Inspection...
    expect(differences.join('\n')).not.toContain('Site photo upload')
    // ...but the parallel gateway changes what happens and is reported.
    expect(differences.some((d) => d.includes('is a parallelGateway'))).toBe(true)
  })

  it('reports an end event that is neither Completed nor Rejected', () => {
    const xml = exported.replace('<bpmn:endEvent id="end_completed" name="Completed">', '<bpmn:endEvent id="Event_9" name="Archived">')
      .replace(/(sourceRef|targetRef|bpmnElement)="end_completed"/g, '$1="Event_9"')
    expect(checkBpmnConformance(xml).differences).toContain('End event "Archived" must be named "Completed" or "Rejected"')
  })

  it('compares the actor/SLA note of every task in our export', () => {
    expect(checkBpmnConformance(exported).notesCompared).toBe(model.nodes.filter((n) => n.kind === 'task').length)
  })

  it('reports a step that loops back to itself, directly or through its gateway', () => {
    expect(checkBpmnConformance(withFlow(exported, 'gw_inspection', 'inspection')).differences)
      .toContain('Not in the running workflow: "Inspection" → "Inspection"')
    expect(checkBpmnConformance(withFlow(exported, 'notified', 'notified')).differences)
      .toContain('Not in the running workflow: "Citizen Notified" → "Citizen Notified"')
  })

  it('reports flows out of an end event or into the start event', () => {
    const fromEnd = checkBpmnConformance(withFlow(exported, 'end_rejected_approval', 'submitted'))
    expect(fromEnd.conforms).toBe(false)
    expect(fromEnd.differences.join('\n')).toContain('leaves the end event "Rejected"')
    expect(checkBpmnConformance(withFlow(exported, 'officerAssigned', 'start')).differences.join('\n')).toContain('leads back into the start event')
  })

  it('reports a human step made automatic, and the reverse', () => {
    const swapped = exported
      .replace('<bpmn:userTask id="inspection" name="Inspection">', '<bpmn:serviceTask id="inspection" name="Inspection">')
      .replace(/(<bpmn:serviceTask id="inspection"[\s\S]*?)<\/bpmn:userTask>/, '$1</bpmn:serviceTask>')
    expect(checkBpmnConformance(swapped).differences).toContain('"Inspection" is a serviceTask, but in the running workflow it is done by a person, the officer (userTask)')
    const manual = exported
      .replace('<bpmn:serviceTask id="docVerification" name="Document Verification">', '<bpmn:userTask id="docVerification" name="Document Verification">')
      .replace(/(<bpmn:userTask id="docVerification"[\s\S]*?)<\/bpmn:serviceTask>/, '$1</bpmn:userTask>')
    expect(checkBpmnConformance(manual).differences).toContain('"Document Verification" is a userTask, but in the running workflow it runs automatically (serviceTask)')
  })

  it('reports an edited actor or SLA note', () => {
    const edited = exported.replace('Actor: officer · SLA 3 day(s)', 'Actor: citizen · SLA 30 day(s)')
    const { differences } = checkBpmnConformance(edited)
    expect(differences).toContain('"Inspection": the file says actor "citizen", the running workflow has "officer"')
    expect(differences).toContain('"Inspection": the file says an SLA of 30 day(s), the running workflow has 3 day(s)')
    const dropped = checkBpmnConformance(exported.replace('Actor: officer · SLA 3 day(s)', 'Actor: officer'))
    expect(dropped.differences).toContain('"Inspection": the file says no SLA, the running workflow has 3 day(s)')
  })

  it('reports loops, multi-instance and event definitions', () => {
    const xml = exported
      .replace('<bpmn:userTask id="approval" name="Approval">', '<bpmn:userTask id="approval" name="Approval"><bpmn:multiInstanceLoopCharacteristics isSequential="false" />')
      .replace('<bpmn:endEvent id="end_completed" name="Completed">', '<bpmn:endEvent id="end_completed" name="Completed"><bpmn:terminateEventDefinition />')
    const { differences } = checkBpmnConformance(xml)
    expect(differences).toContain('"Approval" repeats (loop or multi-instance), which the running workflow does not do')
    expect(differences).toContain('"Completed" has a terminateEventDefinition, which the running workflow does not have')
  })

  it('refuses files that are not BPMN', () => {
    expect(() => checkBpmnConformance('<definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/"/>')).toThrow(XmlImportError)
    expect(() => checkBpmnConformance('<a><b></a>')).toThrow(/not well-formed/)
    const two = exported.replace('  </bpmn:process>', '  </bpmn:process>\n  <bpmn:process id="P2" />')
    expect(() => checkBpmnConformance(two)).toThrow(/exactly one process \(found 2\)/)
  })
})

import { ApplicationStage } from '@prisma/client'
import { buildProcessModel, toBpmnXml, type ProcessModel } from '../../src/modules/workflow/bpmn'
import { TRANSITIONS } from '../../src/modules/workflow/workflow.engine'

const model: ProcessModel = buildProcessModel()
const byId = new Map(model.nodes.map((n) => [n.id, n]))
const outgoing = (id: string) => model.edges.filter((e) => e.from === id)
const incoming = (id: string) => model.edges.filter((e) => e.to === id)

/** The stage a node stands for: a task's own stage, or the terminal of an end event. */
function stageOf(id: string): ApplicationStage | undefined {
  const n = byId.get(id)!
  if (n.kind === 'task') return n.stage
  if (n.kind === 'end') return n.terminal === 'completed' ? ApplicationStage.completed : ApplicationStage.rejected
  return undefined
}

/** Stages reachable from a task in one engine step: follow flows through gateways. */
function nextStages(taskId: string): ApplicationStage[] {
  const found = new Set<ApplicationStage>()
  const walk = (id: string) => {
    for (const e of outgoing(id)) {
      const to = byId.get(e.to)!
      if (to.kind === 'gateway') walk(to.id)
      else found.add(stageOf(to.id)!)
    }
  }
  walk(taskId)
  return [...found].sort()
}

describe('BPMN process model', () => {
  it('has unique ids and flows between existing nodes', () => {
    const ids = [...model.nodes.map((n) => n.id), ...model.edges.map((e) => e.id)]
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of model.edges) {
      expect(byId.has(e.from)).toBe(true)
      expect(byId.has(e.to)).toBe(true)
      expect(e.points.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('has one start event and only ends without outgoing flows', () => {
    const starts = model.nodes.filter((n) => n.kind === 'start')
    expect(starts).toHaveLength(1)
    expect(incoming(starts[0].id)).toHaveLength(0)
    for (const n of model.nodes) {
      if (n.kind === 'end') expect(outgoing(n.id)).toHaveLength(0)
      else expect(outgoing(n.id).length).toBeGreaterThan(0)
      if (n.kind !== 'start') expect(incoming(n.id).length).toBeGreaterThan(0)
    }
  })

  it('draws a task for every non-terminal stage', () => {
    const tasks = model.nodes.filter((n) => n.kind === 'task').map((n) => n.stage).sort()
    const open = Object.values(ApplicationStage).filter((s) => s !== 'completed' && s !== 'rejected').sort()
    expect(tasks).toEqual(open)
  })

  it('matches the engine transitions exactly, in both directions', () => {
    for (const n of model.nodes.filter((x) => x.kind === 'task')) {
      expect({ stage: n.stage, next: nextStages(n.id) }).toEqual({ stage: n.stage, next: [...TRANSITIONS[n.stage!]].sort() })
    }
  })

  it('starts at the submitted stage', () => {
    const start = model.nodes.find((n) => n.kind === 'start')!
    expect(outgoing(start.id).map((e) => e.to)).toEqual([ApplicationStage.submitted])
  })
})

describe('BPMN 2.0 XML', () => {
  const xml = toBpmnXml(model)

  it('declares the BPMN 2.0 namespaces', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"')
    expect(xml).toContain('xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"')
  })

  it('writes every node, flow and diagram element', () => {
    for (const n of model.nodes) {
      expect(xml).toContain(` id="${n.id}"`)
      expect(xml).toContain(`bpmnElement="${n.id}"`)
    }
    for (const e of model.edges) {
      expect(xml).toContain(`<bpmn:sequenceFlow id="${e.id}" sourceRef="${e.from}" targetRef="${e.to}"`)
      expect(xml).toContain(`<bpmndi:BPMNEdge id="${e.id}_di" bpmnElement="${e.id}">`)
    }
    expect((xml.match(/<bpmn:userTask |<bpmn:serviceTask /g) ?? []).length).toBe(model.nodes.filter((n) => n.kind === 'task').length)
    expect((xml.match(/<bpmn:exclusiveGateway /g) ?? []).length).toBe(model.nodes.filter((n) => n.kind === 'gateway').length)
  })

  it('balances every element it opens', () => {
    for (const tag of ['bpmn:definitions', 'bpmn:process', 'bpmn:userTask', 'bpmn:serviceTask', 'bpmn:exclusiveGateway', 'bpmn:startEvent', 'bpmn:endEvent', 'bpmndi:BPMNShape', 'bpmndi:BPMNEdge', 'bpmndi:BPMNPlane', 'bpmndi:BPMNDiagram']) {
      const open = (xml.match(new RegExp(`<${tag}[ >]`, 'g')) ?? []).length
      const close = (xml.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
      expect({ tag, open }).toEqual({ tag, open: close })
    }
  })
})

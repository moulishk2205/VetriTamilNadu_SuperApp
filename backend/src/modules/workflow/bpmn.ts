import { ApplicationStage } from '@prisma/client'
import { STAGES, TRANSITIONS } from './workflow.engine'

/**
 * The live workflow definition (STAGES + TRANSITIONS) as a laid-out process
 * model, and as standard BPMN 2.0 XML with diagram interchange, so it opens in
 * any BPMN modeller (bpmn.io, Camunda Modeler). Both come from the same graph,
 * so the picture, the export and the running engine cannot drift apart.
 */

export type NodeKind = 'start' | 'task' | 'gateway' | 'end'
export interface ProcessNode {
  id: string
  kind: NodeKind
  label: string
  x: number
  y: number
  w: number
  h: number
  stage?: ApplicationStage
  actor?: string
  slaDays?: number
  terminal?: 'completed' | 'rejected'
}
export interface ProcessEdge { id: string; from: string; to: string; label?: string; points: { x: number; y: number }[] }
export interface ProcessModel { id: string; name: string; width: number; height: number; nodes: ProcessNode[]; edges: ProcessEdge[] }

const S = ApplicationStage
const TASK = { w: 120, h: 64 }
const GW = 50
const EV = 36
const GAP = 50
const TOP_Y = 150
const MAIN_Y = 300
const BOT_Y = 450
const REJ_Y = MAIN_Y - 90

const GATEWAY_LABEL: Partial<Record<ApplicationStage, string>> = {
  docVerification: 'Documents valid?', inspection: 'Needs senior review?', remarks: 'Recommendation',
  escalation: 'Senior decision', approval: 'Approved?',
}
const FLOW_LABEL: Record<string, string> = {
  'docVerification>officerAssigned': 'Documents OK', 'docVerification>correctionRequested': 'Incomplete', 'docVerification>rejected': 'Invalid',
  'inspection>remarks': 'Report filed', 'inspection>escalation': 'Escalate',
  'remarks>approval': 'Recommend', 'remarks>correctionRequested': 'Return', 'remarks>rejected': 'Not eligible',
  'escalation>approval': 'Cleared', 'escalation>rejected': 'Reject', 'approval>digitalSignature': 'Approved', 'approval>rejected': 'Reject',
}

export function buildProcessModel(): ProcessModel {
  const stage = (id: ApplicationStage) => STAGES.find((s) => s.id === id)
  const nodes = new Map<string, ProcessNode>()
  const edges: ProcessEdge[] = []
  const cx = (n: ProcessNode) => n.x + n.w / 2
  const cy = (n: ProcessNode) => n.y + n.h / 2
  const add = (n: ProcessNode) => (nodes.set(n.id, n), n)
  const task = (id: ApplicationStage, x: number, y: number) =>
    add({ id, kind: 'task', label: stage(id)?.label ?? id, x, y: y - TASK.h / 2, w: TASK.w, h: TASK.h, stage: id, actor: stage(id)?.actor, slaDays: stage(id)?.slaDays })
  const gateway = (of: ApplicationStage, x: number, y: number) =>
    add({ id: `gw_${of}`, kind: 'gateway', label: GATEWAY_LABEL[of] ?? '', x, y: y - GW / 2, w: GW, h: GW })
  const event = (id: string, kind: 'start' | 'end', label: string, x: number, y: number, terminal?: 'completed' | 'rejected') =>
    add({ id, kind, label, x: x - EV / 2, y: y - EV / 2, w: EV, h: EV, terminal })
  const flow = (from: string, to: string, points: { x: number; y: number }[], label?: string) =>
    edges.push({ id: `flow_${edges.length + 1}`, from, to, label, points })

  // Main (approval) path, left to right; a gateway follows every decision stage.
  const main: ApplicationStage[] = []
  for (let s: ApplicationStage | null = S.submitted; s && s !== S.completed; s = TRANSITIONS[s][0] ?? null) main.push(s)
  let x = 40
  const start = event('start', 'start', 'Application received', x + EV / 2, MAIN_Y)
  x += EV + GAP
  let prev: ProcessNode = start
  const link = (a: ProcessNode, b: ProcessNode, label?: string) => flow(a.id, b.id, [{ x: a.x + a.w, y: MAIN_Y }, { x: b.x, y: MAIN_Y }], label)
  for (const s of main) {
    const t = task(s, x, MAIN_Y)
    link(prev, t, prev.kind === 'gateway' ? FLOW_LABEL[`${prev.id.slice(3)}>${s}`] : undefined)
    x += TASK.w + GAP
    prev = t
    if (TRANSITIONS[s].length > 1) {
      const g = gateway(s, x, MAIN_Y)
      link(t, g)
      x += GW + GAP
      prev = g
    }
  }
  const done = event('end_completed', 'end', 'Completed', x + EV / 2, MAIN_Y, 'completed')
  link(prev, done)
  const width = x + EV + 40

  const n = (id: string) => nodes.get(id) as ProcessNode
  const label = (from: ApplicationStage, to: ApplicationStage) => FLOW_LABEL[`${from}>${to}`]

  // Escalation sits above the main row, between inspection and approval.
  const esc = task(S.escalation, cx(n(S.remarks)) - TASK.w / 2, TOP_Y)
  const escGw = gateway(S.escalation, cx(n(S.approval)) - GW / 2, TOP_Y)
  const gIns = n(`gw_${S.inspection}`)
  flow(gIns.id, esc.id, [{ x: cx(gIns), y: gIns.y }, { x: cx(gIns), y: TOP_Y }, { x: esc.x, y: TOP_Y }], label(S.inspection, S.escalation))
  flow(esc.id, escGw.id, [{ x: esc.x + esc.w, y: TOP_Y }, { x: escGw.x, y: TOP_Y }])
  flow(escGw.id, S.approval, [{ x: cx(escGw), y: escGw.y + GW }, { x: cx(escGw), y: n(S.approval).y }], label(S.escalation, S.approval))

  // Corrections sit below, between officer assignment and the department queue,
  // and loop back to document verification.
  const corrX = (cx(n(S.officerAssigned)) + cx(n(S.departmentQueue))) / 2 - TASK.w / 2
  const corr = task(S.correctionRequested, corrX, BOT_Y)
  for (const from of [S.docVerification, S.remarks]) {
    const g = n(`gw_${from}`)
    const side = cx(g) < cx(corr) ? corr.x : corr.x + corr.w
    flow(g.id, corr.id, [{ x: cx(g), y: g.y + GW }, { x: cx(g), y: BOT_Y }, { x: side, y: BOT_Y }], label(from, S.correctionRequested))
  }
  const dv = n(S.docVerification)
  flow(corr.id, dv.id, [{ x: cx(corr), y: corr.y + corr.h }, { x: cx(corr), y: BOT_Y + 70 }, { x: cx(dv), y: BOT_Y + 70 }, { x: cx(dv), y: dv.y + dv.h }], 'Resubmitted')

  // One "Rejected" end event per decision, directly above it.
  for (const from of [S.docVerification, S.remarks, S.approval] as ApplicationStage[]) {
    const g = n(`gw_${from}`)
    const end = event(`end_rejected_${from}`, 'end', 'Rejected', cx(g), REJ_Y, 'rejected')
    flow(g.id, end.id, [{ x: cx(g), y: g.y }, { x: cx(g), y: end.y + EV }], label(from, S.rejected))
  }
  const escEnd = event('end_rejected_escalation', 'end', 'Rejected', cx(escGw), TOP_Y - 85, 'rejected')
  flow(escGw.id, escEnd.id, [{ x: cx(escGw), y: escGw.y }, { x: cx(escGw), y: escEnd.y + EV }], label(S.escalation, S.rejected))

  return { id: 'gov.standard.v1', name: 'Government Standard Workflow', width, height: BOT_Y + 110, nodes: [...nodes.values()], edges }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** BPMN 2.0 XML with diagram interchange (DI) for the model above. */
export function toBpmnXml(model: ProcessModel): string {
  const pid = `Process_${model.id.replace(/\W/g, '_')}`
  const inc = (id: string) => model.edges.filter((e) => e.to === id).map((e) => `      <bpmn:incoming>${e.id}</bpmn:incoming>`)
  const out = (id: string) => model.edges.filter((e) => e.from === id).map((e) => `      <bpmn:outgoing>${e.id}</bpmn:outgoing>`)
  const elements = model.nodes.map((nd) => {
    const tag = nd.kind === 'start' ? 'startEvent' : nd.kind === 'end' ? 'endEvent' : nd.kind === 'gateway' ? 'exclusiveGateway'
      : nd.actor === 'system' ? 'serviceTask' : 'userTask'
    const doc = nd.kind === 'task' ? [`      <bpmn:documentation>Actor: ${esc(nd.actor ?? 'officer')}${nd.slaDays ? ` · SLA ${nd.slaDays} day(s)` : ''}</bpmn:documentation>`] : []
    return [`    <bpmn:${tag} id="${nd.id}" name="${esc(nd.label)}">`, ...doc, ...inc(nd.id), ...out(nd.id), `    </bpmn:${tag}>`].join('\n')
  })
  const flows = model.edges.map((e) => `    <bpmn:sequenceFlow id="${e.id}" sourceRef="${e.from}" targetRef="${e.to}"${e.label ? ` name="${esc(e.label)}"` : ''} />`)
  const shapes = model.nodes.map((nd) =>
    `      <bpmndi:BPMNShape id="${nd.id}_di" bpmnElement="${nd.id}"${nd.kind === 'gateway' ? ' isMarkerVisible="true"' : ''}>\n        <dc:Bounds x="${nd.x}" y="${nd.y}" width="${nd.w}" height="${nd.h}" />\n      </bpmndi:BPMNShape>`)
  const lines = model.edges.map((e) =>
    [`      <bpmndi:BPMNEdge id="${e.id}_di" bpmnElement="${e.id}">`, ...e.points.map((p) => `        <di:waypoint x="${p.x}" y="${p.y}" />`), '      </bpmndi:BPMNEdge>'].join('\n'))
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"',
    `  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${pid}" targetNamespace="https://vetri.tn/bpmn" exporter="VETRI workflow engine" exporterVersion="1.0">`,
    `  <bpmn:process id="${pid}" name="${esc(model.name)}" isExecutable="false">`,
    ...elements,
    ...flows,
    '  </bpmn:process>',
    '  <bpmndi:BPMNDiagram id="BPMNDiagram_1">',
    `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${pid}">`,
    ...shapes,
    ...lines,
    '    </bpmndi:BPMNPlane>',
    '  </bpmndi:BPMNDiagram>',
    '</bpmn:definitions>',
    '',
  ].join('\n')
}

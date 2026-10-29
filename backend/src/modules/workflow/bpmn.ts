import { ApplicationStage } from '@prisma/client'
import { STAGES, TRANSITIONS } from './workflow.engine'
import { attr, many, parseXml, XmlImportError } from './xml'

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
      // Wider gap after a decision, so its outcome label fits on the flow.
      x += GW + GAP * 2
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

// ─── Import check ────────────────────────────────────────────────────────────

const BPMN_MODEL_NS = 'http://www.omg.org/spec/BPMN/20100524/MODEL'
const TASK_TAGS = ['task', 'userTask', 'serviceTask', 'manualTask', 'scriptTask', 'businessRuleTask', 'sendTask', 'receiveTask']
/** Task types for steps a person performs, and for steps that run automatically. */
const HUMAN_TASKS = ['userTask', 'manualTask']
const AUTOMATIC_TASKS = ['serviceTask', 'scriptTask', 'businessRuleTask', 'sendTask']
/** Elements that change behaviour in ways the running workflow has no counterpart for. */
const UNSUPPORTED_TAGS = ['callActivity', 'subProcess', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway', 'complexGateway', 'intermediateThrowEvent', 'intermediateCatchEvent', 'boundaryEvent']

export interface ConformanceReport {
  conforms: boolean
  process: { id: string; name?: string }
  tasks: number
  flows: number
  /** Tasks whose "Actor: … · SLA n day(s)" note was compared (notes are optional). */
  notesCompared: number
  /** Every way the file differs from the running workflow, in plain words. */
  differences: string[]
}

/** Text of a BPMN <documentation> child, '' when there is none. */
function documentationOf(el: Record<string, unknown>): string {
  const d = Array.isArray(el.documentation) ? el.documentation[0] : el.documentation
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && typeof (d as Record<string, unknown>)['#text'] === 'string') return (d as Record<string, string>)['#text']
  return ''
}

/**
 * Checks an uploaded BPMN 2.0 file, typically our export after editing in a
 * modeller, against the workflow the engine runs. Tasks are matched to stages
 * by id, or by label; end events by "Completed" / "Rejected". Compared: the
 * stages, every transition in both directions, whether each step is done by a
 * person or runs automatically, and the "Actor / SLA" note where a task has
 * one. The engine runs its built-in definition, so a file can be checked, not
 * deployed: a difference means the file no longer describes what happens.
 */
export function checkBpmnConformance(xml: string): ConformanceReport {
  const defs = parseXml(xml).definitions
  if (!defs || typeof defs !== 'object' || !xml.includes(BPMN_MODEL_NS)) throw new XmlImportError(['This is not a BPMN 2.0 file (no BPMN <definitions> element)'])
  const processes = many(defs, 'process')
  if (processes.length !== 1) throw new XmlImportError([`The file must hold exactly one process (found ${processes.length})`])
  const proc = processes[0]

  const differences: string[] = []
  const label = (s: ApplicationStage) => STAGES.find((x) => x.id === s)?.label ?? s
  const nodes = new Map<string, { tag: string; name: string; el: Record<string, unknown> }>()
  for (const tag of [...TASK_TAGS, ...UNSUPPORTED_TAGS, 'exclusiveGateway', 'startEvent', 'endEvent']) {
    for (const el of many(proc, tag)) {
      const id = attr(el, 'id')
      if (!id) { differences.push(`A ${tag} has no id`); continue }
      const name = (attr(el, 'name') ?? '').trim()
      nodes.set(id, { tag, name, el })
      if (UNSUPPORTED_TAGS.includes(tag)) differences.push(`"${name || id}" is a ${tag}, which the running workflow does not have`)
      if (el.multiInstanceLoopCharacteristics !== undefined || el.standardLoopCharacteristics !== undefined) {
        differences.push(`"${name || id}" repeats (loop or multi-instance), which the running workflow does not do`)
      }
      for (const key of Object.keys(el).filter((k) => k.endsWith('EventDefinition'))) {
        differences.push(`"${name || id}" has a ${key}, which the running workflow does not have`)
      }
    }
  }
  const flows = many(proc, 'sequenceFlow').map((f) => ({ id: attr(f, 'id') ?? '?', from: attr(f, 'sourceRef') ?? '', to: attr(f, 'targetRef') ?? '' }))

  // Tasks → stages, by id first (as exported), then by label.
  const stageIds = new Set<string>(Object.values(ApplicationStage))
  const byLabel = new Map(STAGES.map((s) => [s.label.toLowerCase(), s.id]))
  const stageOf = new Map<string, ApplicationStage>()
  const taskFor = new Map<ApplicationStage, string>()
  for (const [id, n] of nodes) {
    if (!TASK_TAGS.includes(n.tag)) continue
    const stage = (stageIds.has(id) ? id : byLabel.get(n.name.toLowerCase())) as ApplicationStage | undefined
    if (!stage || STAGES.find((s) => s.id === stage)?.terminal) { differences.push(`Task "${n.name || id}" is not a stage of the running workflow`); continue }
    if (taskFor.has(stage)) { differences.push(`Stage "${label(stage)}" appears more than once`); continue }
    stageOf.set(id, stage)
    taskFor.set(stage, id)
  }

  // Who performs each step, and its SLA, where the file says.
  let notesCompared = 0
  for (const [stage, taskId] of taskFor) {
    const def = STAGES.find((s) => s.id === stage)!
    const n = nodes.get(taskId)!
    const automatic = def.actor === 'system'
    if (automatic ? !AUTOMATIC_TASKS.includes(n.tag) : !HUMAN_TASKS.includes(n.tag)) {
      differences.push(`"${def.label}" is a ${n.tag}, but in the running workflow it ${automatic ? 'runs automatically (serviceTask)' : `is done by a person, the ${def.actor} (userTask)`}`)
    }
    const note = documentationOf(n.el)
    const actor = /Actor:\s*([^·\n]+?)\s*(?:·|$)/m.exec(note)?.[1]
    if (!actor) continue
    notesCompared += 1
    if (actor !== def.actor) differences.push(`"${def.label}": the file says actor "${actor}", the running workflow has "${def.actor}"`)
    const sla = /SLA\s+(\d+)\s*day/.exec(note)?.[1]
    const want = def.slaDays
    if ((sla === undefined ? undefined : Number(sla)) !== want) {
      differences.push(`"${def.label}": the file says ${sla ? `an SLA of ${sla} day(s)` : 'no SLA'}, the running workflow has ${want ? `${want} day(s)` : 'none'}`)
    }
  }
  const endStage = (id: string): ApplicationStage | undefined => {
    const name = nodes.get(id)?.name.toLowerCase()
    if (name === 'completed' || id.startsWith('end_completed')) return ApplicationStage.completed
    if (name === 'rejected' || id.startsWith('end_rejected')) return ApplicationStage.rejected
    return undefined
  }
  for (const [id, n] of nodes) {
    if (n.tag === 'endEvent' && !endStage(id)) differences.push(`End event "${n.name || id}" must be named "Completed" or "Rejected"`)
  }
  for (const f of flows) {
    if (!nodes.has(f.from) || !nodes.has(f.to)) differences.push(`Flow ${f.id} connects an element the check does not know ("${f.from}" → "${f.to}")`)
    else if (nodes.get(f.from)!.tag === 'endEvent') differences.push(`Flow ${f.id} leaves the end event "${nodes.get(f.from)!.name || f.from}"; a finished application cannot move on`)
    else if (nodes.get(f.to)!.tag === 'startEvent') differences.push(`Flow ${f.id} leads back into the start event`)
  }

  /**
   * Stages one step after `id`, passing through exclusive gateways. Only
   * gateways are marked as walked, so a flow back to the step itself (a loop
   * the engine does not have) is still found.
   */
  const next = (id: string): Set<ApplicationStage> => {
    const found = new Set<ApplicationStage>()
    const walked = new Set<string>()
    const walk = (from: string) => {
      for (const f of flows.filter((x) => x.from === from)) {
        const n = nodes.get(f.to)
        if (!n) continue
        if (n.tag === 'exclusiveGateway') {
          if (walked.has(f.to)) continue
          walked.add(f.to)
          walk(f.to)
        } else if (n.tag === 'endEvent') { const s = endStage(f.to); if (s) found.add(s) }
        else if (stageOf.has(f.to)) found.add(stageOf.get(f.to)!)
      }
    }
    walk(id)
    return found
  }

  const starts = [...nodes].filter(([, n]) => n.tag === 'startEvent').map(([id]) => id)
  if (starts.length !== 1) differences.push(`The process must have exactly one start event (found ${starts.length})`)
  else {
    const first = [...next(starts[0])]
    if (first.length !== 1 || first[0] !== ApplicationStage.submitted) differences.push(`The start event must lead to "${label(ApplicationStage.submitted)}" only`)
  }

  for (const stage of STAGES.filter((s) => !s.terminal)) {
    const taskId = taskFor.get(stage.id)
    if (!taskId) { differences.push(`Stage "${stage.label}" has no task`); continue }
    const actual = next(taskId)
    const expected = new Set(TRANSITIONS[stage.id])
    for (const to of expected) if (!actual.has(to)) differences.push(`Missing: "${stage.label}" → "${label(to)}"`)
    for (const to of actual) if (!expected.has(to)) differences.push(`Not in the running workflow: "${stage.label}" → "${label(to)}"`)
  }

  const unique = [...new Set(differences)]
  return {
    conforms: unique.length === 0,
    process: { id: attr(proc, 'id') ?? '', name: attr(proc, 'name') },
    tasks: [...nodes.values()].filter((n) => TASK_TAGS.includes(n.tag)).length,
    flows: flows.length,
    notesCompared,
    differences: unique,
  }
}

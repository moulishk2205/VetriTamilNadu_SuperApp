import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Download, GitBranch } from 'lucide-react'
import { Card, Btn } from '@/components/ui'
import { useC } from '@/hooks/useUi'
import { apiClient } from '@/lib/api/client'

const Point = z.object({ x: z.number(), y: z.number() })
const ModelSchema = z.object({
  id: z.string(), name: z.string(), width: z.number(), height: z.number(),
  nodes: z.array(z.object({
    id: z.string(), kind: z.enum(['start', 'task', 'gateway', 'end']), label: z.string(),
    x: z.number(), y: z.number(), w: z.number(), h: z.number(),
    stage: z.string().optional(), actor: z.string().optional(), slaDays: z.number().optional(), terminal: z.enum(['completed', 'rejected']).optional(),
  })),
  edges: z.array(z.object({ id: z.string(), from: z.string(), to: z.string(), label: z.string().optional(), points: z.array(Point) })),
  counts: z.record(z.string(), z.number()),
})

/** Wraps a label onto at most three lines of ~15 characters. */
function lines(label: string): string[] {
  const out: string[] = []
  for (const word of label.split(' ')) {
    const last = out[out.length - 1]
    if (last && (last + ' ' + word).length <= 15) out[out.length - 1] = `${last} ${word}`
    else out.push(word)
  }
  return out.slice(0, 3)
}

/**
 * The running workflow drawn as a BPMN process map, generated from the same
 * definition the engine executes, with today's live count of applications at
 * each stage. "Download BPMN 2.0" exports standard XML that opens in any BPMN
 * modeller (bpmn.io, Camunda Modeler).
 */
export function ProcessMap() {
  const c = useC()
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'workflow-model'], queryFn: () => apiClient.get('/workflows/gov.standard.v1/model', { schema: ModelSchema }) })

  const download = async () => {
    const xml = await apiClient.get<string>('/workflows/gov.standard.v1/bpmn')
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'gov.standard.v1.bpmn'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || !data) return <p style={{ fontSize: 13, color: c.txt2, marginTop: 16 }}>Loading process model…</p>

  const live = Object.values(data.counts).reduce((a, b) => a + b, 0)

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <Card style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <GitBranch size={20} color={c.pri} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: c.txt }}>{data.name} · <span className="vtn-num">{data.id}</span></p>
          <p style={{ fontSize: 12, color: c.txt2, marginTop: 2, lineHeight: 1.45 }}>
            Drawn from the definition the engine runs. Badges show the {live.toLocaleString('en-IN')} applications at each stage right now. Export is standard BPMN 2.0 XML.
          </p>
        </div>
        <Btn variant="primary" icon={Download} onClick={() => void download()}>Download BPMN 2.0</Btn>
      </Card>

      <Card style={{ marginTop: 10, padding: 0, overflowX: 'auto' }}>
        <svg role="img" aria-label={`BPMN process map of ${data.name}`} width={data.width * 0.78} height={data.height * 0.78} viewBox={`0 0 ${data.width} ${data.height}`} style={{ display: 'block' }}>
          <defs>
            <marker id="vtn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={c.txt2} />
            </marker>
          </defs>

          {data.edges.map((e) => {
            const pts = e.points.map((p) => `${p.x},${p.y}`).join(' ')
            const [a, b] = e.points
            const lx = (a.x + b.x) / 2
            const ly = (a.y + b.y) / 2
            return (
              <g key={e.id}>
                <polyline points={pts} fill="none" stroke={c.txt3} strokeWidth={1.6} markerEnd="url(#vtn-arrow)" />
                {e.label && (
                  <text x={lx + (a.x === b.x ? 6 : 0)} y={ly - (a.x === b.x ? 0 : 6)} fontSize={11} fill={c.txt2} textAnchor={a.x === b.x ? 'start' : 'middle'}>{e.label}</text>
                )}
              </g>
            )
          })}

          {data.nodes.map((n) => {
            const cx = n.x + n.w / 2
            const cy = n.y + n.h / 2
            if (n.kind === 'start' || n.kind === 'end') {
              const col = n.terminal === 'rejected' ? c.err : n.kind === 'end' ? c.ok : c.pri
              return (
                <g key={n.id}>
                  <circle cx={cx} cy={cy} r={n.w / 2} fill={c.card} stroke={col} strokeWidth={n.kind === 'end' ? 4 : 2} />
                  {/* Rejected ends sit above their decision, so their label goes on top. */}
                  <text x={cx} y={n.terminal === 'rejected' ? n.y - 7 : n.y + n.h + 14} fontSize={11} fill={c.txt2} textAnchor="middle">{n.label}</text>
                </g>
              )
            }
            if (n.kind === 'gateway') {
              return (
                <g key={n.id}>
                  <polygon points={`${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}`} fill={c.card} stroke={c.warn} strokeWidth={2} />
                  <text x={cx} y={cy + 6} fontSize={18} fontWeight={700} fill={c.warn} textAnchor="middle">×</text>
                </g>
              )
            }
            const count = n.stage ? data.counts[n.stage] ?? 0 : 0
            const system = n.actor === 'system'
            return (
              <g key={n.id}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} fill={c.card} stroke={system ? c.info : c.pri} strokeWidth={1.8} />
                {lines(n.label).map((l, i, arr) => (
                  <text key={i} x={cx} y={cy - ((arr.length - 1) * 13) / 2 + i * 13 + 4} fontSize={12} fontWeight={600} fill={c.txt} textAnchor="middle">{l}</text>
                ))}
                <text x={n.x + 6} y={n.y + n.h - 6} fontSize={9.5} fill={c.txt3}>{system ? 'system' : n.actor}{n.slaDays ? ` · ${n.slaDays}d` : ''}</text>
                {count > 0 && (
                  <g>
                    <rect x={n.x + n.w - 30} y={n.y - 10} width={34} height={20} rx={10} fill={c.pri} />
                    <text x={n.x + n.w - 13} y={n.y + 4} fontSize={11} fontWeight={700} fill="#fff" textAnchor="middle">{count}</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </Card>
      <p style={{ fontSize: 11.5, color: c.txt3, marginTop: 8, lineHeight: 1.5 }}>
        Steps marked “system” run automatically; the others are performed by officers or the citizen, with the stage SLA in days. × marks a decision. Today the engine executes this definition from code; the BPMN export is the interchange format for moving it onto a standards-based engine.
      </p>
    </div>
  )
}

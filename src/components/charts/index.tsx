import { useC } from '@/hooks/useUi'

/**
 * Theme-aware SVG chart kit — bar, line, donut, heat and stat primitives used
 * by the Department / MLA / Admin dashboards. Pure SVG + palette tokens (no
 * chart library), so visuals match the app's design language in both themes.
 */

export function StatTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  const c = useC()
  return (
    <div style={{ background: c.card, borderRadius: 16, padding: '14px 12px', border: `1px solid ${c.bdr}` }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: color ?? c.txt, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 10.5, color: c.txt2, marginTop: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 9.5, color: c.txt3, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

export function BarChart({ data, height = 120, color }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const c = useC()
  const max = Math.max(...data.map((d) => d.value), 1)
  const bw = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none" role="img" aria-label="bar chart">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 26)
        return (
          <g key={d.label}>
            <rect x={i * bw + bw * 0.18} y={height - 16 - h} width={bw * 0.64} height={h} rx={1.5} fill={color ?? c.pri} opacity={0.85} />
            <text x={i * bw + bw / 2} y={height - 5} textAnchor="middle" fontSize={4.4} fill={c.txt3}>{d.label}</text>
            <text x={i * bw + bw / 2} y={height - 19 - h} textAnchor="middle" fontSize={4.6} fontWeight={700} fill={c.txt2}>{d.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function LineChart({ data, height = 110, color }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const c = useC()
  const max = Math.max(...data.map((d) => d.value), 1)
  const stroke = color ?? c.pri
  const pts = data.map((d, i) => [8 + (i * (100 - 16)) / Math.max(data.length - 1, 1), height - 18 - (d.value / max) * (height - 34)] as const)
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = `${path} L${pts[pts.length - 1][0]},${height - 16} L${pts[0][0]},${height - 16} Z`
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none" role="img" aria-label="line chart">
      <path d={area} fill={stroke} opacity={0.08} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 2.2 : 1.4} fill={stroke} />
          <text x={p[0]} y={height - 5} textAnchor="middle" fontSize={4.2} fill={c.txt3}>{data[i].label}</text>
        </g>
      ))}
    </svg>
  )
}

export function Donut({ data, size = 96 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const c = useC()
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const R = 15.9155
  // Precompute each segment's dash offset (segments start at 12 o'clock).
  const segments = data.map((d, i) => ({
    ...d,
    pct: (d.value / total) * 100,
    offset: 25 - data.slice(0, i).reduce((s, x) => s + (x.value / total) * 100, 0),
  }))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg viewBox="0 0 42 42" style={{ width: size, height: size, flexShrink: 0 }} role="img" aria-label="donut chart">
        <circle cx="21" cy="21" r={R} fill="none" stroke={c.bdr} strokeWidth="5" />
        {segments.map((d) => (
          <circle key={d.label} cx="21" cy="21" r={R} fill="none" stroke={d.color} strokeWidth="5"
            strokeDasharray={`${d.pct} ${100 - d.pct}`} strokeDashoffset={d.offset} strokeLinecap="butt" />
        ))}
        <text x="21" y="23" textAnchor="middle" fontSize="7" fontWeight="800" fill={c.txt}>{total}</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: c.txt2, flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.txt, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Horizontal comparison bars (village/ward/district comparisons). */
export function HBars({ data, color }: { data: { label: string; value: number; suffix?: string }[]; color?: string }) {
  const c = useC()
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      {data.map((d) => (
        <div key={d.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: c.txt2 }}>{d.label}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: c.txt, fontVariantNumeric: 'tabular-nums' }}>{d.value}{d.suffix ?? ''}</span>
          </div>
          <div style={{ height: 6, background: c.bdr, borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: color ?? c.pri, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Simple intensity heat grid (service demand by area). */
export function HeatGrid({ rows, cols, cells }: { rows: string[]; cols: string[]; cells: number[][] }) {
  const c = useC()
  const max = Math.max(...cells.flat(), 1)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%' }}>
        <thead>
          <tr>
            <th />
            {cols.map((col) => <th key={col} style={{ fontSize: 9, color: c.txt3, fontWeight: 600, padding: 2 }}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row}>
              <td style={{ fontSize: 10, color: c.txt2, paddingRight: 6, whiteSpace: 'nowrap' }}>{row}</td>
              {cols.map((_, ci) => {
                const v = cells[ri]?.[ci] ?? 0
                const alpha = 0.12 + (v / max) * 0.75
                return (
                  <td key={ci} title={`${v}`} style={{ background: `rgba(155,27,48,${alpha})`, borderRadius: 4, width: 28, height: 22, textAlign: 'center', fontSize: 9, fontWeight: 700, color: alpha > 0.5 ? '#fff' : c.txt2 }}>
                    {v}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

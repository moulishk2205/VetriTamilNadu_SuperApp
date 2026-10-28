import { useMemo, type CSSProperties } from 'react'
import { useTnMap } from './tnMap'

export interface TamilNaduMapProps {
  /** Zoom to this constituency and its neighbours; omit for the whole state. */
  focus?: string
  /** Size of the zoomed view, in map units (the state is 736 × 1000). */
  span?: [number, number]
  className?: string
  style?: CSSProperties
}

/** Everyday short forms where the official name is long. */
const ALIAS: Record<string, string> = { Thiyagarayanagar: 'T. Nagar' }
const tidy = (name: string) => ALIAS[name] ?? name.replace(/\s*\((SC|ST)\)/i, '').split('-')[0]

/**
 * Tamil Nadu drawn from its 235 assembly constituencies, in the current text
 * colour. Whole-state it is a backdrop; with `focus` it becomes a local map —
 * the citizen's constituency filled, its neighbours named.
 */
export function TamilNaduMap({ focus, span = [30, 20], className, style }: TamilNaduMapProps) {
  const map = useTnMap()
  const lines = useMemo(() => (map ? map.assembly.map((a) => a.d).join('') : ''), [map])
  const home = focus && map ? map.assembly.find((a) => a.name.toLowerCase() === focus.toLowerCase()) : undefined

  if (!map) return <svg className={className} style={style} aria-hidden="true" />

  if (!home) {
    return (
      <svg className={className} style={style} viewBox={`0 0 ${map.w} ${map.h}`} aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeLinejoin="round">
          <path d={lines} strokeWidth={0.8} opacity={0.6} />
          <path d={map.state} strokeWidth={2.8} />
        </g>
      </svg>
    )
  }

  const [w, h] = span
  const [cx, cy] = home.c
  const dist = (a: { c: [number, number] }) => Math.hypot(a.c[0] - cx, a.c[1] - cy)
  // Name up to four neighbours, nearest first, skipping any label that would
  // run into one already placed or fall outside the window.
  const FS = 0.92
  const box = (a: { name: string; c: [number, number] }) => {
    const half = (tidy(a.name).length * FS * 0.58) / 2
    return { l: a.c[0] - half, r: a.c[0] + half, t: a.c[1] - FS * 0.8, b: a.c[1] + FS * 0.25 }
  }
  const placed: { l: number; r: number; t: number; b: number }[] = []
  const near = map.assembly.filter((a) => a !== home).sort((a, b) => dist(a) - dist(b)).slice(0, 10).filter((a) => {
    if (placed.length >= 4) return false
    const k = box(a)
    // The card shows a wide crop of the window (about 2.4 : 1), with the
    // constituency's name tab in the top-right corner.
    const half = Math.min(h / 2, w / 5.4)
    if (k.l < cx - w / 2 + 0.4 || k.r > cx + w / 2 - 0.4 || k.t < cy - half + 0.3 || k.b > cy + half - 0.3) return false
    if (k.r > cx + w * 0.12 && k.t < cy - half * 0.2) return false
    if (placed.some((p) => k.l < p.r + 0.3 && k.r > p.l - 0.3 && k.t < p.b + 0.15 && k.b > p.t - 0.15)) return false
    placed.push(k)
    return true
  })
  return (
    <svg className={className} style={style} viewBox={`${cx - w / 2} ${cy - h / 2} ${w} ${h}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Map of ${tidy(home.name)} constituency and its neighbours`}>
      <g fill="none" stroke="currentColor" strokeLinejoin="round">
        <path d={lines} strokeWidth={0.16} opacity={0.75} />
        <path d={map.state} strokeWidth={0.38} />
      </g>
      <path d={home.d} fill="currentColor" stroke="currentColor" strokeWidth={0.2} />
      {near.map((a) => (
        <text key={a.name} x={a.c[0]} y={a.c[1]} fontSize={FS} fontWeight={600} textAnchor="middle" fill="currentColor" strokeWidth={0.32} strokeLinejoin="round" style={{ stroke: 'var(--map-halo, none)', paintOrder: 'stroke' }}>{tidy(a.name)}</text>
      ))}
    </svg>
  )
}

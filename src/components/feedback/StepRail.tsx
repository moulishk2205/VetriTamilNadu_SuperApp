import type { CSSProperties } from 'react'

export interface StepRailProps {
  /** Total statutory steps for the service. */
  steps: number
  /** The step the application is on now (1-based). Steps before it are done. */
  step: number
  /** Status colour — the same one as the status dot beside it. */
  colour: string
  /** Every step finished (issued / completed). */
  complete?: boolean
  /** Track colour for steps not reached yet. */
  track?: string
  style?: CSSProperties
}

/**
 * An application's journey as one segment per statutory step: finished steps
 * filled, the current one half-filled, the rest waiting. It shows at a glance
 * what "Step 7 of 11" says in words, so the words stay beside it for screen
 * readers and for anyone who reads rather than scans.
 */
export function StepRail({ steps, step, colour, complete = false, track = 'rgba(90,60,0,.13)', style }: StepRailProps) {
  const total = Math.max(1, Math.min(steps, 24))
  const now = complete ? total + 1 : Math.max(1, Math.min(step, total))
  return (
    <span aria-hidden="true" style={{ display: 'flex', gap: 3, height: 6, width: '100%', ...style }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const fill = n < now ? colour : n === now ? `linear-gradient(90deg, ${colour} 0 50%, ${track} 50% 100%)` : track
        return <span key={n} style={{ flex: 1, minWidth: 0, borderRadius: 3, background: fill }} />
      })}
    </span>
  )
}

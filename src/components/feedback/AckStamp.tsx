import { useId } from 'react'

export interface AckStampProps {
  /** When the office received the application. */
  date: Date
  size?: number
  /** Ink colour: banner red on paper, a lighter red on dark surfaces. */
  ink?: string
  className?: string
}

const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

/**
 * The office's "received" stamp, the mark a citizen has always been given at
 * a government counter: ring lettering in Tamil and English, the date in the
 * middle, slightly rough ink. It lands once (`.v-stamp`) on the acknowledgement,
 * the best moment of the whole journey, and is otherwise still.
 */
export function AckStamp({ date, size = 128, ink = '#8A1C15', className = 'v-stamp' }: AckStampProps) {
  const id = useId().replace(/:/g, '')
  const ring = `ring-${id}`
  const rough = `rough-${id}`
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label={`Received stamp, ${fmt(date)}`}
      style={{ display: 'block', transform: 'rotate(-9deg)', color: ink, flexShrink: 0, overflow: 'visible' }}
    >
      <defs>
        <path id={ring} d="M64 64 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0" />
        {/* A little unevenness so it reads as ink from a rubber stamp, not a vector badge. */}
        <filter id={rough} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feComponentTransfer in="n" result="speck"><feFuncA type="discrete" tableValues="1 1 1 1 0.55 1 1 1" /></feComponentTransfer>
          <feComposite in="d" in2="speck" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${rough})`} fill="none" stroke="currentColor" opacity={0.88}>
        <circle cx="64" cy="64" r="60" strokeWidth="3.2" />
        <circle cx="64" cy="64" r="34" strokeWidth="1.4" />
        <text fill="currentColor" stroke="none" fontSize="10.4" fontWeight="800" letterSpacing="1.2" fontFamily="'Noto Sans Tamil', Inter, sans-serif">
          <textPath href={`#${ring}`} startOffset="0">பெறப்பட்டது ★ RECEIVED ★ VETRI TN ★</textPath>
        </text>
        <text x="64" y="61" fill="currentColor" stroke="none" fontSize="9.4" fontWeight="800" textAnchor="middle" letterSpacing=".6" fontFamily="Inter, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(date).split(' ').slice(0, 2).join(' ')}</text>
        <text x="64" y="74" fill="currentColor" stroke="none" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1" fontFamily="Inter, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{date.getFullYear()}</text>
      </g>
    </svg>
  )
}

import type { CSSProperties } from 'react'

const NAME = 'வெற்றி தமிழ்நாடு'
// Written one letter-cluster at a time, like a title card being lettered.
const CLUSTERS = ['வெ', 'ற்', 'றி', ' ', 'த', 'மி', 'ழ்', 'நா', 'டு']

/**
 * The brand title in its poster lettering: heavy, condensed, flared — red with
 * a near-white outline. With `play` it forms the way the showreel titles do:
 * the outline of each letter is drawn first, then the colour floods in.
 * `still` shows the finished lettering with no motion.
 *
 * Styles and the display face are supplied by the screen that hosts it
 * (see WORDMARK_CSS) so the lettering never loads on screens that don't use it.
 */
export function VetriWordmark({ play, still = false }: { play: boolean; still?: boolean }) {
  return (
    <svg className={`vw${play ? ' vw--play' : ''}${still ? ' vw--still' : ''}`} role="img" aria-label="வெற்றி தமிழ்நாடு">
      <text className="vw-back" x="50%" y="74%" textAnchor="middle">{NAME}</text>
      <text className="vw-fill" x="50%" y="74%" textAnchor="middle">{NAME}</text>
      <text className="vw-line" x="50%" y="74%" textAnchor="middle" aria-hidden="true">
        {CLUSTERS.map((g, i) => <tspan key={i} style={{ '--i': i } as CSSProperties}>{g}</tspan>)}
      </text>
    </svg>
  )
}

/** The face the lettering is set in; wait for it before starting the animation. */
export const WORDMARK_FONT = '900 80px "Noto Serif Tamil"'

export const WORDMARK_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wdth,wght@80,900&display=swap');
.vw{display:block;overflow:visible;width:9.6em;max-width:96vw;height:1.62em;font-size:clamp(30px,8.6vw,124px);font-family:'Noto Serif Tamil','Noto Sans Tamil',serif;font-weight:900;font-stretch:80%;letter-spacing:-.012em;transform:scaleY(1.07)}
.vw text{stroke-linejoin:round;stroke-linecap:round}
.vw-back{fill:#FFF5F3;stroke:#FFF5F3;stroke-width:.14em;opacity:0;filter:drop-shadow(0 .075em 0 rgba(134,27,19,.3))}
.vw-fill{fill:#8A1C15;stroke:#8A1C15;stroke-width:.024em;opacity:0}
.vw-line{fill:none;stroke:#8A1C15;stroke-width:.022em;stroke-dasharray:14em;stroke-dashoffset:14em}
.vw--play .vw-line tspan{animation:vwDraw 1.15s cubic-bezier(.6,0,.2,1) forwards;animation-delay:calc(var(--i) * 85ms)}
.vw--play .vw-back,.vw--play .vw-fill{animation:vwFill .7s ease forwards;animation-delay:1.55s}
@keyframes vwDraw{to{stroke-dashoffset:0}}
@keyframes vwFill{to{opacity:1}}
.vw--still .vw-back,.vw--still .vw-fill{opacity:1;animation:none}
.vw--still .vw-line{display:none}
`

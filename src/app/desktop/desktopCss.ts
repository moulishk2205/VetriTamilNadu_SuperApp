import type { Colors } from '@/styles/theme'

/**
 * Desktop portal layout layer.
 *
 * Everything here is fluid: containers use `clamp()` padding with a generous
 * max-width, grids use `minmax()`/`auto-fit`, and real media queries collapse
 * columns on smaller laptops. No dashboard width is hardcoded, so the portal
 * fills 13" MacBooks through 4K displays without dead margins.
 *
 * Spacing follows an 8-point system (8 / 16 / 24 / 32 / 48).
 */
export function desktopCss(c: Colors): string {
  return `
/* Mobile-only chrome never appears in the portal — the shell has its own. */
.vtn-desktop [data-mobile-chrome]{display:none !important}

/* ── Fluid container ───────────────────────────────────────────────── */
.vtn-container{
  width:100%;
  max-width:1760px;
  margin-inline:auto;
  padding-inline:clamp(16px, 3vw, 56px);
}

/* ── Dashboard: sidebar + content, collapses on narrow laptops ─────── */
.vtn-dash{
  display:grid;
  grid-template-columns:clamp(232px, 19vw, 312px) minmax(0, 1fr);
  gap:clamp(16px, 1.6vw, 28px);
  align-items:start;
}
@media (max-width: 1080px){
  .vtn-dash{grid-template-columns:minmax(0,1fr)}
  .vtn-dash > aside{position:static}
}

/* ── Generic responsive card grids ─────────────────────────────────── */
.vtn-grid{display:grid;gap:clamp(12px, 1.1vw, 20px)}
.vtn-grid-2{grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr))}
.vtn-grid-3{grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr))}
.vtn-grid-4{grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr))}

/* ── Split view: list + detail panel (Applications, Grievances) ────── */
.vtn-split{
  display:grid;
  grid-template-columns:minmax(0, 1.45fr) minmax(0, 1fr);
  gap:clamp(16px, 1.5vw, 24px);
  align-items:start;
}
@media (max-width: 1180px){ .vtn-split{grid-template-columns:minmax(0,1fr)} }

/* ── Locker: folder rail + files ───────────────────────────────────── */
.vtn-locker{
  display:grid;
  grid-template-columns:clamp(200px, 16vw, 260px) minmax(0, 1fr);
  gap:clamp(16px, 1.5vw, 24px);
  align-items:start;
}
@media (max-width: 900px){ .vtn-locker{grid-template-columns:minmax(0,1fr)} }

/* ── Login: hero + auth panel ──────────────────────────────────────── */
.vtn-login{
  display:grid;
  grid-template-columns:minmax(0, 1.15fr) minmax(380px, 0.85fr);
  min-height:100vh;
}
@media (max-width: 980px){
  .vtn-login{grid-template-columns:minmax(0,1fr)}
  .vtn-login__hero{display:none}
}

/* ── Fluid type for hero headings ──────────────────────────────────── */
.vtn-h1{font-size:clamp(26px, 2.4vw, 40px);font-weight:800;letter-spacing:-0.7px;line-height:1.12}
.vtn-h2{font-size:clamp(17px, 1.25vw, 21px);font-weight:700;letter-spacing:-0.2px}
.vtn-lede{font-size:clamp(13.5px, 0.95vw, 15.5px);line-height:1.6;max-width:62ch}

/* Tabular figures for all portal data — columns line up. */
.vtn-num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}

/* ── Interaction: desktop hover + keyboard focus ───────────────────── */
.vtn-card{
  background:${c.card};
  border:1px solid ${c.bdr};
  border-radius:14px;
  transition:border-color .15s ease, transform .15s ease, box-shadow .15s ease;
}
.vtn-hover:hover{border-color:${c.pri}59;transform:translateY(-2px);box-shadow:0 8px 22px ${c.pri}14}
.vtn-desktop :focus-visible{outline:2px solid ${c.pri};outline-offset:2px;border-radius:8px}

/* ── Table ─────────────────────────────────────────────────────────── */
.vtn-table{width:100%;border-collapse:collapse;font-size:13.5px}
.vtn-table th{
  text-align:left;font-size:11px;font-weight:700;letter-spacing:.6px;
  text-transform:uppercase;color:${c.txt3};padding:12px 16px;
  border-bottom:1px solid ${c.bdr};white-space:nowrap;
}
.vtn-table td{padding:14px 16px;border-bottom:1px solid ${c.bdr};color:${c.txt};vertical-align:middle}
.vtn-table tbody tr{cursor:pointer;transition:background .12s ease}
.vtn-table tbody tr:hover{background:${c.pri}0A}
.vtn-table tbody tr[aria-selected="true"]{background:${c.pri}12}
.vtn-scroll-x{overflow-x:auto}

@keyframes vtnSpin{to{transform:rotate(360deg)}}
.vtn-spin{animation:vtnSpin .9s linear infinite}
@media (prefers-reduced-motion: reduce){
  .vtn-desktop *,.vtn-desktop *::before,.vtn-desktop *::after{animation-duration:.01ms !important;transition-duration:.01ms !important}
}

.vtn-desktop ::-webkit-scrollbar{width:10px;height:10px}
.vtn-desktop ::-webkit-scrollbar-thumb{background:${c.bdr};border-radius:6px}
.vtn-desktop ::-webkit-scrollbar-thumb:hover{background:${c.txt3}}
`
}

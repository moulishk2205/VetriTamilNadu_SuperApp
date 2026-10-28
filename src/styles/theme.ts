// ═══════════════════════════════════════════
// THEME TOKENS + GLOBAL CSS
// Extracted verbatim from the original prototype. These values are the visual
// contract of the app — do not alter colors, keyframes, or fonts.
// ═══════════════════════════════════════════

export interface Colors {
  pri: string
  priDk: string
  acc: string
  sec: string
  secDk: string
  secLt: string
  bg: string
  bgAlt: string
  card: string
  txt: string
  txt2: string
  txt3: string
  ok: string
  warn: string
  err: string
  info: string
  bdr: string
}

export const lightColors: Colors = {
  pri: '#9B1B30', priDk: '#7A1526', acc: '#6B1D2A', sec: '#D4A843', secDk: '#B8922E', secLt: '#E8C66A',
  bg: '#FFFFFF', bgAlt: '#F7F7FA', card: '#FFFFFF',
  txt: '#1C1C1E', txt2: '#6B7280', txt3: '#9CA3AF',
  ok: '#059669', warn: '#D97706', err: '#DC2626', info: '#2563EB', bdr: '#E5E7EB',
}

/**
 * The banner palette, used by every screen of the web portal and the phone app —
 * the dashboard's look expressed as the same tokens the screens already read: warm near-white surfaces on parchment, banner red
 * for brand and main actions, gold as the highlight. `sec` is a deeper gold than
 * the banner yellow because pages also use it for figures and icons on white.
 */
export const BANNER_YELLOW = '#FFC401'

export const webLightColors: Colors = {
  pri: '#8A1C15', priDk: '#761610', acc: '#861B13', sec: '#D9A300', secDk: '#8A6400', secLt: '#FFE08A',
  bg: '#FFFEFA', bgAlt: '#F8F3E2', card: '#FFFEFA',
  txt: '#1F1A12', txt2: '#5F584A', txt3: '#7D7562',
  ok: '#1B7F45', warn: '#B45309', err: '#C4281C', info: '#1D5FD1', bdr: '#E9E0C8',
}

export const webDarkColors: Colors = {
  pri: '#D0453A', priDk: '#B5382E', acc: '#3A0F0B', sec: '#FFC401', secDk: '#FFD24A', secLt: '#FFE08A',
  bg: '#1B160D', bgAlt: '#2C2416', card: '#211B11',
  txt: '#F6EFE0', txt2: '#BCB09A', txt3: '#8C8169',
  ok: '#4ADE80', warn: '#FBBF24', err: '#F87171', info: '#7CB0FF', bdr: '#3A311F',
}

export const darkColors: Colors = {
  pri: '#E8485C', priDk: '#C4354E', acc: '#9B1B30', sec: '#E8C66A', secDk: '#D4A843', secLt: '#F0D88A',
  bg: '#0F172A', bgAlt: '#1E293B', card: '#1E293B',
  txt: '#F1F5F9', txt2: '#94A3B8', txt3: '#64748B',
  ok: '#34D399', warn: '#FBBF24', err: '#F87171', info: '#60A5FA', bdr: '#334155',
}

export const CSS = `
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{font-family:'Inter','Noto Sans Tamil',system-ui,sans-serif}
  ::-webkit-scrollbar{width:0}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes emblemGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(212,168,67,0.3))}50%{filter:drop-shadow(0 0 20px rgba(212,168,67,0.6))}}
  @keyframes breathe{0%,100%{opacity:0.4}50%{opacity:1}}
  @keyframes successPop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}

  /* ── Craft layer (design-skill: Apple typography, Emil Kowalski motion, Jakub Krehel UI) ──
     Inter is variable with an optical-size axis: large headings switch to its
     display cut automatically. Figures line up. Motion uses two strong curves. */
  :root{--ease-out:cubic-bezier(.23,1,.32,1);--ease-io:cubic-bezier(.77,0,.175,1)}
  body{font-optical-sizing:auto;text-rendering:optimizeLegibility}
  .vh h1,.vh h2,.vh h3,.vm h1,.vm h2,.vm h3{text-wrap:balance}
  .vh p,.vm p{text-wrap:pretty}
  .v-num{font-variant-numeric:tabular-nums}
  /* Controls answer the finger on press, never on release; the browser's own tap flash is replaced by it. */
  .vh button,.vm button,.vm [role="button"]{touch-action:manipulation;-webkit-user-select:none;user-select:none}
  .vh button:not(:disabled),.vm button:not(:disabled),.vm [role="button"]{transition-property:transform,background-color,box-shadow,color,filter,opacity;transition-duration:160ms;transition-timing-function:var(--ease-out)}
  .vh button:not(:disabled):active,.vm button:not(:disabled):active{transform:scale(.97)}
  .vm [role="button"]:active{transform:scale(.985)}
  /* Staged entrance for the two home screens — seen once per visit, so it may take a moment. */
  @keyframes vEnter{from{opacity:0;transform:translateY(10px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
  .v-enter{animation:vEnter 420ms var(--ease-out) both;animation-delay:calc(var(--i,0) * 60ms)}
  /* The acknowledgement stamp lands once, on the rarest and best moment: an application received. */
  @keyframes vStamp{0%{opacity:0;transform:rotate(-16deg) scale(1.35)}60%{opacity:1}100%{opacity:1;transform:rotate(-9deg) scale(1)}}
  .v-stamp{animation:vStamp 520ms var(--ease-out) 260ms both}
  @keyframes vFade{from{opacity:0}to{opacity:1}}
  @media (prefers-reduced-motion: reduce){
    .v-enter{animation:none}
    .v-stamp{animation:vFade 200ms ease both}
    .vh button:not(:disabled):active,.vm button:not(:disabled):active,.vm [role="button"]:active{transform:none}
  }
`

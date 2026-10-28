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

export const darkColors: Colors = {
  pri: '#E8485C', priDk: '#C4354E', acc: '#9B1B30', sec: '#E8C66A', secDk: '#D4A843', secLt: '#F0D88A',
  bg: '#0F172A', bgAlt: '#1E293B', card: '#1E293B',
  txt: '#F1F5F9', txt2: '#94A3B8', txt3: '#64748B',
  ok: '#34D399', warn: '#FBBF24', err: '#F87171', info: '#60A5FA', bdr: '#334155',
}

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Tamil:wght@300;400;500;600;700;800&display=swap');
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
`

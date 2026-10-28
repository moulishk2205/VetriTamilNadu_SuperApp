// VETRI TAMIL NADU — "One Thread" · Director's Cut (60 s). Every frame is seek(t).
// Acts I–II carry the v1 film (same shots, same language) with room to breathe;
// Act III adds four real citizen journeys captured in one live session; Act IV returns to the state.
import { clamp, lerp, seg, E, mulberry32, noise1, h } from './lib.js'
import { parsePath, resample, mix, cumul, slice } from './geom.js'
import { T, COPY, S16, DUR } from './timeline.js'
import { icon } from './icons.js'

const W = 1920, H = 1080
const DPR = window.devicePixelRatio || 1
const $ = (id) => document.getElementById(id)
const px = (v) => `${v}px`

// ── assets ───────────────────────────────────────────────────────────────────
const geo = await (await fetch('../assets/geo.json')).json()
const SERVICES = await (await fetch('data/services.json')).json()
const QR = await (await fetch('data/qr.json')).json()
const SEAL = '../assets/seal_tn.svg'
await Promise.all([
  document.fonts.load('800 100px Inter'), document.fonts.load('600 20px Inter'), document.fonts.load('500 20px Inter'), document.fonts.load('700 20px Inter'),
  document.fonts.load('600 40px "Noto Sans Tamil"', 'சொத்து'), document.fonts.load('700 40px "Noto Sans Tamil"', 'சொத்து'), document.fonts.load('400 14px "Noto Sans Tamil"', 'சொத்து'),
  document.fonts.load('600 24px "IBM Plex Mono"'), document.fonts.load('500 24px "IBM Plex Mono"'),
])
await new Promise((r) => { const im = new Image(); im.onload = r; im.onerror = r; im.src = SEAL })

// ── layers ───────────────────────────────────────────────────────────────────
const mapC = $('map'), thrC = $('thread'), grainC = $('grain')
for (const c of [mapC, thrC, grainC]) { c.width = W * DPR; c.height = H * DPR }
const mx = mapC.getContext('2d'), tx = thrC.getContext('2d'), gx = grainC.getContext('2d')
const thrS = document.createElement('canvas'); thrS.className = 'layer'; thrS.width = W * DPR; thrS.height = H * DPR; Object.assign(thrS.style, { width: W + 'px', height: H + 'px', left: 0, top: 0 }); $('screen').prepend(thrS)
const sx2 = thrS.getContext('2d')
const wash = document.createElement('div'); Object.assign(wash.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', background: '#F7F7FA', opacity: 0, pointerEvents: 'none' }); $('screen').prepend(wash)
const back = $('back'), front = $('front'), screenL = $('screen'), typeL = $('type'), flash = $('flash'), vig = $('vig'), uiwrap = $('uiwrap')
function el(parent, cls, style = {}, html) { const e = h('div', cls, html); Object.assign(e.style, style); parent.appendChild(e); return e }
const show = (e, on) => { if (e._d === undefined) e._d = e.style.display === 'none' ? '' : e.style.display; const v = on ? e._d : 'none'; if (e.style.display !== v) e.style.display = v }   // keeps an element's own display (flex/grid)

// ── geography ────────────────────────────────────────────────────────────────
const MYL = geo.chennai.find((a) => a.no === 25)
const M = MYL.c
const mylRing = parsePath(MYL.d).sort((a, b) => b.length - a.length)[0]
const mylPath = new Path2D(MYL.d)
const chennaiPaths = geo.chennai.map((a) => ({ no: a.no, p: new Path2D(a.d) }))
const statePath = new Path2D(geo.state)
const districts = geo.districts.map((d) => {
  const rings = parsePath(d.d)
  return { p: new Path2D(d.d), len: rings.reduce((s, r) => s + cumul(r).at(-1), 0), dist: Math.hypot(d.c[0] - M[0], d.c[1] - M[1]) }
})
const maxDistrictDist = Math.max(...districts.map((d) => d.dist))
const acs = geo.assembly.map((a) => {
  const rings = parsePath(a.d)
  return { no: a.no, c: a.c, p: new Path2D(a.d), len: rings.reduce((s, r) => s + cumul(r).at(-1), 0), dist: Math.hypot(a.c[0] - M[0], a.c[1] - M[1]), y: a.c[1] }
})
// ACT V: every constituency activates in a wave out of Chennai; the visited four first
const maxAcDist = Math.max(...acs.map((a) => a.dist))
const STOP_T = { 25: T.lineOut, 22: T.viru, 14: T.villi, 24: T.tnagar }
acs.forEach((a) => { a.act = STOP_T[a.no] ?? (T.pull + 0.35 + Math.pow(a.dist / maxAcDist, 0.75) * (T.count234End - T.pull - 0.4)); a.rd = Math.pow(a.dist / maxAcDist, 0.8) })
const ACT_T = [...new Map(acs.map((a) => [a.no, a.act])).values()].sort((x, y) => x - y)
const activeCount = (t) => { let n = 0; for (const v of ACT_T) { if (v <= t) n++; else break } return Math.min(234, Math.max(1, n)) }
const NET = acs.filter((a, i) => i % 6 === 2 && a.dist > 22).map((a) => {
  const nx = -(a.c[1] - M[1]), ny = a.c[0] - M[0], cx = (M[0] + a.c[0]) / 2 + nx * 0.16, cy = (M[1] + a.c[1]) / 2 + ny * 0.16
  const p = new Path2D(); p.moveTo(M[0], M[1]); p.quadraticCurveTo(cx, cy, a.c[0], a.c[1])
  return { p, len: a.dist * 1.08, t: a.act + 0.12 }
})
const REP = [...acs].filter((a) => a.dist > 40).sort((x, y) => x.dist - y.dist).filter((_, i, arr) => i % Math.floor(arr.length / 8) === 4).slice(0, 8)

const IGN_R = 980
const wave = (u) => 0.25 * u + 0.75 * (1 - (1 - u) * (1 - u))
const invWave = (v) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (wave(m) < v) lo = m; else hi = m } return (lo + hi) / 2 }
const vil = geo.villages.map(([x, y]) => { const d = Math.hypot(x - M[0], y - M[1]); return { x, y, d, ti: T.impact + (T.igniteEnd - T.impact) * invWave(clamp(d / IGN_R)) } }).sort((a, b) => a.ti - b.ti)
const VX = new Float32Array(vil.map((v) => v.x)), VY = new Float32Array(vil.map((v) => v.y))
const VT = new Float32Array(vil.map((v) => v.ti)), VD = new Float32Array(vil.map((v) => v.d))
const hashV = new Float32Array(vil.length).map((_, i) => mulberry32(i * 7919 + 13)())
function sprite(rgb, size, soft) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const g = c.getContext('2d'), r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r)
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(soft, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr; g.fillRect(0, 0, size, size); return c
}
const SP_SETTLE = sprite('242,213,138', 32, 0.18), SP_FLASH = sprite('255,246,220', 32, 0.3)

// map camera
const FULL = { s: 0.98, c: [368, 500] }
const camAt = (Ms, s) => ({ s, c: [M[0] - (Ms[0] - 960) / s, M[1] - (Ms[1] - 540) / s] })
const logLerp = (a, b, p) => Math.exp(lerp(Math.log(a), Math.log(b), p))
const toScreen = (cam, g) => [(g[0] - cam.c[0]) * cam.s + 960, (g[1] - cam.c[1]) * cam.s + 540]
const HOLD_END = { s: 1.18, c: [430, 440] }
const mHoldEnd = toScreen(HOLD_END, M)
const END = { s: 0.85, c: [368 - (1420 - 960) / 0.85, 500 - (520 - 540) / 0.85] }
const mEnd = toScreen(END, M)
const IRIS_P = [960, 540], PLATE_M = [960, 830]

// UI camera
let ui = { cx: 960, cy: 540, z: 1 }
const P2S = (p) => [(p[0] - ui.cx) * ui.z + 960, (p[1] - ui.cy) * ui.z + 540]
function setUI(c) { ui = c; const t = `translate(${960 - c.cx * c.z}px, ${540 - c.cy * c.z}px) scale(${c.z})`; back.style.transform = front.style.transform = t }
setUI(ui)

// ═════════════════════════════════════════════════════════════════════════════
// BUILD
// ═════════════════════════════════════════════════════════════════════════════
const ground = el(back, 'abs', { left: '-3000px', top: '117px', width: '9000px', height: '14000px', background: 'var(--bgAlt)' })

function masthead(parent, y0, active) {
  const m = el(parent, 'mast', { top: px(y0) })
  const strip = el(m, 'strip', {}, `<span></span><span style="display:flex;gap:22px;align-items:center">${icon('languages', 14, 'rgba(255,255,255,.85)', 1.8)}<span class="ta" style="margin-left:-14px">தமிழ்</span>${icon('moon', 13, 'rgba(255,255,255,.85)')}<span style="margin-left:-14px">Dark</span></span>`)
  const bar = el(m, 'bar', {}, `
    <img src="${SEAL}" style="width:46px;height:46px;object-fit:contain">
    <div><div class="word">Vetri Tamil Nadu</div><div class="sub"><span class="ta">வெற்றி தமிழ்நாடு</span> · e-Sevai Digital Services</div></div>
    <div class="search">${icon('search', 16, 'rgba(255,255,255,.6)')}Search services, certificates, schemes…</div>
    <div style="flex:1"></div>
    <div style="width:40px;height:40px;border-radius:12px;background:var(--sec);display:flex;align-items:center;justify-content:center">${icon('sparkles', 19, '#3A2A05', 1.9)}</div>
    <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;position:relative">${icon('bell', 18, '#fff')}<span style="position:absolute;top:-6px;right:-6px;background:var(--sec);color:#3A2A05;font-size:10px;font-weight:800;border-radius:9px;padding:1px 5px">2</span></div>
    <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:6px 12px 6px 6px">
      <div style="width:30px;height:30px;border-radius:9px;background:var(--sec);color:#3A2A05;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">CK</div>
      <div><div style="color:#fff;font-size:13px;font-weight:700">Chandramoulishwarar</div><div style="color:rgba(255,255,255,.66);font-size:10.5px">TN-2024-XXXX-8842</div></div>
      ${icon('chevron-down', 14, 'rgba(255,255,255,.8)')}
    </div>`)
  const TABS = [['layout-grid', 'Dashboard'], ['file-text', 'Services'], ['timer', 'Applications'], ['wallet', 'Digital Locker'], ['triangle-alert', 'Grievances'], ['sparkles', 'Schemes'], ['chart-column', 'Transparency'], ['life-buoy', 'Help']]
  const nav = el(m, 'nav', {}, TABS.map(([ic, l]) => `<div class="tab${active === l ? ' on' : ''}" data-l="${l}">${icon(ic, 16, active === l ? '#9B1B30' : '#6B7280', active === l ? 2.2 : 1.8)}${l}</div>`).join(''))
  const tabs = Object.fromEntries([...nav.querySelectorAll('.tab')].map((t) => [t.dataset.l, t]))
  return { m, strip, bar, nav, tabs }
}

// ── Region A · Ask Vetri → Services catalogue ────────────────────────────────
const mastA = masthead(back, 0)
const askPage = el(back, 'abs', { left: 0, top: 0 })
const pageTitleA = el(askPage, 'abs', { left: '136px', top: '192px', fontSize: '30px', fontWeight: 800, letterSpacing: '-.6px', color: 'var(--txt)', whiteSpace: 'nowrap' }, 'Ask Vetri')
const chat = el(askPage, 'panel abs', { left: '136px', top: '252px', width: '1000px', height: '588px' })
el(chat, 'abs', { left: 0, right: 0, bottom: 0, height: '78px', borderTop: '1px solid var(--bdr)', background: 'var(--bgAlt)', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px' },
  `<div style="flex:1;height:46px;border:1px solid var(--bdr);border-radius:11px;background:#fff;display:flex;align-items:center;padding:0 16px;color:var(--txt3);font-size:13.5px">Ask about a service, application, document or scheme…</div><div style="height:46px;border-radius:11px;background:#9B1B30;opacity:.55;color:#fff;display:flex;align-items:center;gap:8px;padding:0 20px;font-size:14px;font-weight:600">Send ${icon('send', 15, '#fff')}</div>`)
const askRail = el(askPage, 'abs', { left: '1168px', top: '252px', width: '616px' })
el(askRail, 'panel', {}, `<div class="panel-h">Suggested for you</div><div style="padding:14px 16px;display:grid;gap:10px">${[
  'Income Certificate (IC-TN-2024-9912) has expired — renewal recommended', 'Marriage registration and related updates are common next steps at this age',
  'Property-tax incentive window is OPEN — pay this month for the 5% rebate', 'Eligible for 9 welfare schemes based on your profile',
].map((s) => `<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--bdr);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt)">${icon('lightbulb', 15, '#D4A843')}${s}</div>`).join('')}</div>`)
el(askRail, 'panel', { marginTop: '16px' }, `<div class="panel-h">What Vetri can see</div><div style="padding:14px 18px;font-size:13px;line-height:1.6;color:var(--txt2)">Your verified profile, your applications and their stages, the documents in your locker, and the welfare catalogue. Answers are generated from your own records — nothing is shared outside the platform.</div>`)
const rbub = el(front, 'rbub', { left: '156px', top: '342px', width: '749px' }, `
  <div class="h">சொத்து வாங்குதல் — தேவையான சேவைகளை வரிசைப்படுத்தியுள்ளேன்:</div>
  <div class="en2">1. Encumbrance Certificate (₹116 + ₹5/yr, 2–5 working days) — due diligence first — search back to 1987 before you register 2. Chitta / Patta Extract (Free, Instant) 3. Patta Transfer (₹60 (transfer) · ₹25 (extracts), Full/Joint: 15 days · Subdivision: 30 days) — mutation after the registered sale deed 4. Property Tax Payment (Calculated dynamically, Instant) — name change follows the patta mutation 5. Water Charges (Fixed tax + volumetric charge, Instant) — new connection / name transfer after ownership is recorded Also check: First-time buyer stamp-duty concessions where applicable. I sequenced these by dependency — start from the top. Your Wallet already holds 4 verified documents I can reuse across these.</div>
  <div class="acts">${['Encumbrance Certificate', 'Chitta / Patta Extract', 'Patta Transfer', 'Property Tax Payment'].map((l) => `<div class="act">${l}${icon('arrow-right', 13, 'currentColor', 2)}</div>`).join('')}</div>`)
const rbH = rbub.querySelector('.h'), rbEn = rbub.querySelector('.en2'), chips = [...rbub.querySelectorAll('.act')]
const ubub = el(front, 'ubub', { zIndex: 6 }, 'I bought land')

const SVC5 = [
  { id: 'svc_ec', name: 'Encumbrance Certificate', ta: 'வில்லங்கச் சான்றிதழ்', meta: '₹116 + ₹5/yr · 2–5 working days', ic: 'scroll-text' },
  { id: 'svc_chitta', name: 'Chitta / Patta Extract', ta: 'சிட்டா / பட்டா சாறு', meta: 'Free · Instant', ic: 'scale' },
  { id: 'svc_patta', name: 'Patta Transfer', ta: 'பட்டா மாற்றம்', meta: '₹60 · Full/Joint: 15 days', ic: 'scale' },
  { id: 'svc_proptax', name: 'Property Tax Payment', ta: 'சொத்து வரி', meta: 'Calculated dynamically · Instant', ic: 'building-2' },
  { id: 'svc_water', name: 'Water Charges', ta: 'குடிநீர்க் கட்டணம்', meta: 'Fixed tax + volumetric charge', ic: 'droplet' },
]
const tiles = SVC5.map((s, i) => {
  const t = el(front, 'svc', {}, `<div class="no">${i + 1}</div><div class="ic">${icon(s.ic, 23, '#9B1B30', 1.8)}</div><div class="tx"><div class="nm">${s.name}</div><div class="ta2">${s.ta}</div><div class="meta">${s.meta}</div></div>`)
  return { el: t, no: t.querySelector('.no'), meta: t.querySelector('.meta'), tx: t.querySelector('.tx'), ic: t.querySelector('.ic') }
})
const SCAT = [[1170, 228], [330, 300], [1290, 520], [420, 592], [1060, 724]]
const DEPTS = [['Registration (IGR)', 1250, 186], ['Revenue', 210, 262], ['Local bodies', 300, 716], ['Water board', 1470, 860]]
const depts = DEPTS.map(([t, x, y]) => el(front, 'dept', { left: px(x), top: px(y) }, t))
const mapLabel = el(front, 'maplabel', {}, `Mylapore<span class="ta">மயிலாப்பூர்</span>`)
const hero = el(front, 'abs', { left: '136px', top: '262px' }, `
  <div class="kt" style="position:relative"><span class="ln tam" style="font-size:40px;color:#B8922E;font-weight:600"><span class="w">சொத்து</span> <span class="w">வாங்குதல்</span></span></div>
  <div class="kt" style="position:relative;margin-top:10px"><span class="ln tam" style="font-size:68px;color:#1C1C1E;font-weight:700"><span class="w">தேவையான</span> <span class="w">சேவைகளை</span></span></div>
  <div class="kt" style="position:relative;margin-top:-4px"><span class="ln tam" style="font-size:68px;color:#1C1C1E;font-weight:700"><span class="w">வரிசைப்படுத்தியுள்ளேன்</span></span></div>`)
const heroWords = [...hero.querySelectorAll('.w')]
const ROWS_X = 1290, ROWS_Y = 196, ROW_DY = 132, SPINE_X = 1196, RSC = 1.2

// Services catalogue (same region; the Services tab takes over the page)
const ICON_MAP = { IndianRupee: 'indian-rupee', Users: 'users', FileCheck: 'file-check', Car: 'car', Scale: 'scale', Home: 'house', MapPin: 'map-pin', ScrollText: 'scroll-text', Wheat: 'wheat', Map: 'map', Receipt: 'receipt', AlertTriangle: 'triangle-alert', Building2: 'building-2', Droplet: 'droplet' }
const catPage = el(back, 'abs', { left: 0, top: 0 })
const catTitle = el(catPage, 'abs', { left: '136px', top: '192px', whiteSpace: 'nowrap' }, `<div style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Government Services</div><div style="font-size:15px;color:var(--txt2);margin-top:8px">Apply online for certificates, licences, land records and welfare services delivered by Government of Tamil Nadu departments.</div>`)
const CHIPS = [['All', 21], ['Certificates', 8], ['Transport', 5], ['Revenue', 5], ['Welfare', 1], ['Municipal', 2]]
const catChips = el(catPage, 'abs', { left: '136px', top: '300px', display: 'flex', gap: '8px' }, CHIPS.map(([l, n], i) => `<span class="fchip${i === 0 ? ' on' : ''}">${l} · <b class="cn" data-n="${n}" style="margin-left:4px">0</b></span>`).join(''))
const chipCounts = [...catChips.querySelectorAll('.cn')]
const GRID_X = 136, GRID_Y = 368, COLS = 7, CW = (1648 - 6 * 16) / 7, CH = 168, GAP = 16
const ORDER_IDS = ['svc_income', 'svc_community', 'svc_birth', 'svc_death', 'svc_marriage', 'svc_residence', 'svc_nativity', 'svc_dl', 'svc_ration', 'svc_legalheir', 'svc_ec', 'svc_chitta', 'svc_patta', 'svc_adangal', 'svc_fmb', 'svc_rctransfer', 'svc_duprc', 'svc_mvtax', 'svc_echallan', 'svc_proptax', 'svc_water']
const catCards = ORDER_IDS.map((id, k) => {
  const s = SERVICES.find((x) => x.id === id)
  const x = GRID_X + (k % COLS) * (CW + GAP), y = GRID_Y + Math.floor(k / COLS) * (CH + GAP)
  const e = el(back, 'cat-card', { left: px(x), top: px(y), width: px(CW), height: px(CH) }, `
    <span class="md ${s.mode === 'digital' ? 'dg' : 'as'}">${s.mode === 'digital' ? 'DIGITAL' : 'ASSISTED'}</span>
    <div class="ic">${icon(ICON_MAP[s.icon] || 'file-text', 20, '#9B1B30', 1.8)}</div>
    <div class="nm">${s.name}</div><div class="ta3">${s.ta}</div><div class="dp">${s.dept}</div>`)
  return { id, e, x, y, k }
})
const cardOf = (id) => catCards.find((c) => c.id === id)

// ── service-page builder (DL / Ration / Birth) ───────────────────────────────
function servicePage(y0, cfg) {
  const R = { y0 }
  R.mast = masthead(back, y0, 'Services')
  el(back, 'abs', { left: '136px', top: px(y0 + 184), fontSize: '13px', color: 'var(--txt3)', whiteSpace: 'nowrap' }, `<span style="color:var(--pri);font-weight:600">Home</span> &nbsp;›&nbsp; <span style="color:var(--pri);font-weight:600">Services</span> &nbsp;›&nbsp; ${cfg.name} &nbsp;›&nbsp; <b style="color:var(--txt)">Application</b>`)
  R.title = el(back, 'abs', { left: '136px', top: px(y0 + 214), display: 'flex', alignItems: 'center', gap: '14px', whiteSpace: 'nowrap' },
    `<span style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">${cfg.name}</span><span class="chip ${cfg.mode === 'Digital' ? 'ok' : 'warn'}">${cfg.mode}</span><span class="ta" style="font-size:22px;color:var(--txt2);font-weight:500">${cfg.ta}</span>`)
  R.stepper = el(back, 'stepper', { left: '136px', top: px(y0 + 282), width: '1648px' }, cfg.steps.map((s, i) => `<div class="step"><div class="c">${i + 1}</div><span>${s}</span></div>`).join(''))
  R.stepEls = [...R.stepper.querySelectorAll('.step')]
  R.formP = el(back, 'panel abs', { left: '136px', top: px(y0 + 372), width: '1000px', height: px(cfg.formH || 420) })
  R.formIn = el(R.formP, 'abs', { inset: 0 })
  R.info = el(back, 'panel abs', { left: '1168px', top: px(y0 + 372), width: '616px' }, `<div class="panel-h">Service information</div><div style="padding:16px 20px;display:grid;gap:14px">${cfg.info.map(([ic, k, v]) => `<div style="display:flex;gap:12px">${icon(ic, 16, '#9CA3AF')}<div><div style="font-size:11.5px;color:var(--txt3)">${k}</div><div style="font-size:14px;color:var(--txt);margin-top:3px;line-height:1.45">${v}</div></div></div>`).join('')}</div>`)
  // acknowledgement (inside the same panel)
  R.ackIn = el(R.formP, 'abs', { inset: 0 })
  R.ackTile = el(R.ackIn, 'abs', { left: '22px', top: '30px', width: '52px', height: '52px', borderRadius: '14px', background: '#05966914', display: 'flex', alignItems: 'center', justifyContent: 'center' }, icon('circle-check', 26, '#059669', 2))
  R.ackTitle = el(R.ackIn, 'abs', { left: '90px', top: '26px', fontSize: '30px', fontWeight: 800, letterSpacing: '-.5px', color: 'var(--txt)', whiteSpace: 'nowrap' }, 'Application submitted')
  R.ackDesc = el(R.ackIn, 'abs', { left: '90px', top: '72px', fontSize: '16px', color: 'var(--txt2)', whiteSpace: 'nowrap' }, `Your application has been received by ${cfg.dept}.`)
  R.refBox = el(R.ackIn, 'abs', { left: '22px', top: '118px', width: '956px', height: '170px', borderRadius: '14px', background: 'var(--bgAlt)', border: '1px solid var(--bdr)' })
  el(R.refBox, 'abs', { left: '24px', top: '34px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.4px', color: 'var(--txt3)' }, 'REFERENCE NUMBER')
  R.refNum = el(R.refBox, 'abs mono', { left: '22px', top: '56px', fontSize: '34px', fontWeight: 600, color: 'var(--pri)', whiteSpace: 'nowrap', transformOrigin: '0 50%' }, cfg.ref)
  el(R.refBox, 'abs', { left: '24px', top: '112px' }, '<span class="chip warn">Submitted</span>')
  const qb = el(R.refBox, 'abs', { left: '700px', top: '18px', width: '128px', height: '128px', background: '#fff', padding: '6px', borderRadius: '6px' })
  R.qrCv = h('canvas'); R.qrCv.width = R.qrCv.height = cfg.qr.size * 8; Object.assign(R.qrCv.style, { width: '116px', height: '116px', imageRendering: 'pixelated' }); qb.appendChild(R.qrCv)
  R.qr = cfg.qr
  if (cfg.handoff) {
    R.hand = el(R.ackIn, 'abs handoff', { left: '22px', top: '306px', width: '956px' }, `<div style="font-size:16px;color:var(--txt2);line-height:1.5">This service is completed on <b style="color:var(--txt)">${cfg.handoff}</b>. Your details are saved — continue there to finish.</div><div class="hb" style="font-size:16px;padding:10px 16px">${icon('external-link', 17, '#1C1C1E')}Continue on ${cfg.handoff}</div>`)
    R.handBtn = R.hand.querySelector('.hb')
  }
  return R
}
const RA = 1600, RB = 3200, RC = 4800, RS = 8200
const STEPS7 = ['Overview', 'Eligibility', 'Documents', 'Application', 'Review', 'Payment', 'Submit']
const STEPS6 = ['Overview', 'Eligibility', 'Documents', 'Application', 'Review', 'Submit']

// A · Driving Licence
const DL = servicePage(RA, {
  name: 'Driving Licence', ta: 'ஓட்டுநர் உரிமம்', mode: 'Assisted', steps: STEPS7, ref: 'APP-2026-DL-44822', qr: QR.dl, handoff: 'Parivahan Sarathi', formH: 440,
  dept: 'Ministry of Road Transport & Highways (MoRTH)',
  info: [['clock', 'Processing time', 'LLR: same day · DL: after 30-day hold + driving test'], ['indian-rupee', 'Official fee', 'LLR ₹200 · DL ₹700 (single) / ₹1,000 (dual)'], ['building-2', 'Department', 'Ministry of Road Transport & Highways (MoRTH) · State Transport Department · RTO']],
})
el(DL.formIn, 'panel-h', {}, 'Licence Type')
const dlType = el(DL.formIn, 'abs', { left: '20px', top: '70px', width: '470px' }, `<div class="lb2">Application Type <span style="color:var(--err)">*</span></div><div class="sel ph"><span class="v">Select…</span>${icon('chevron-down', 16, '#6B7280')}</div>`)
el(DL.formIn, 'abs', { left: '510px', top: '70px', width: '470px' }, `<div class="lb2">Vehicle Class <span style="color:var(--err)">*</span></div><div class="sel"><span>LMV (Car)</span>${icon('chevron-down', 16, '#6B7280')}</div>`)
const dlTypeV = dlType.querySelector('.v'), dlTypeSel = dlType.querySelector('.sel')
el(DL.formIn, 'abs', { left: 0, right: 0, top: '170px', height: '1px', background: 'var(--bdr)' })
const dlAddrH = el(DL.formIn, 'abs', { left: '20px', top: '186px', fontSize: '14.5px', fontWeight: 700, color: 'var(--txt)' }, 'Address')
const ADDR = [['Address Line', '12/3, TTK Road, Alwarpet'], ['District', 'Chennai'], ['Taluk', 'Mylapore'], ['Pincode', '600018']]
const dlAddr = el(DL.formIn, 'abs', { left: '20px', top: '224px', right: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' })
const dlAddrV = ADDR.map(([l, v]) => el(dlAddr, 'fld', {}, `<div class="lb">${l} <span style="color:var(--err)">*</span></div><div class="in"><span class="val">${v}</span></div>`).querySelector('.val'))
const DL_OPTS = ['Learner Licence (LLR)', 'Permanent Driving Licence', 'Renewal', 'Duplicate', 'Address Change', 'International Driving Permit']
const dlList = el(DL.formIn, 'listbox', { left: '20px', top: '146px', width: '470px', zIndex: 5 }, `<div class="hl"></div>${DL_OPTS.map((o) => `<div class="op">${o}</div>`).join('')}`)
const dlListHL = dlList.querySelector('.hl')

// B · Ration Card
const RCd = servicePage(RB, {
  name: 'Ration Card (Smart Card)', ta: 'ரேஷன் அட்டை', mode: 'Assisted', steps: STEPS6, ref: 'APP-2026-RC-44823', qr: QR.rc, handoff: 'TNPDS', formH: 440,
  dept: 'Civil Supplies & Consumer Protection Department',
  info: [['clock', 'Processing time', 'New card: up to 60 days'], ['indian-rupee', 'Official fee', 'Free (Gov ₹0)'], ['building-2', 'Department', 'Civil Supplies & Consumer Protection Department · Taluk Supply Office (TSO)']],
})
RCd.formP.style.overflow = 'visible'
const rcDocs = el(RCd.formIn, 'abs', { inset: 0 })
el(rcDocs, 'panel-h', {}, `Required documents<span style="flex:1"></span><span class="cnt2" style="font-size:14px;color:var(--txt2);font-weight:700">2/3 attached</span>`)
const rcCnt = rcDocs.querySelector('.cnt2')
const docRow = (y, name, attached, tag) => el(rcDocs, 'abs', { left: '20px', top: px(y), width: '960px' }, `
  <div class="docrow">${icon('file-text', 16, '#9B1B30')}<span class="dn">${name}</span>${tag}</div>
  <div class="slot${attached ? ' ok' : ''}">${attached ? `${icon('circle-check', 20, '#059669', 2)}<div><div style="font-size:13.5px;font-weight:600;color:var(--txt)">${attached}</div><div style="font-size:11.5px;color:var(--txt3)">Attached</div></div>` : ''}</div>`)
docRow(66, 'Head of Family Photo (5×3.5 cm)', 'family_photo.jpg', '<span class="chip ok">Attached</span>')
docRow(162, 'Aadhaar of all family members', 'aadhaar_family.pdf', '<span class="chip ok">Attached</span>')
const resRow = docRow(258, 'Residence Proof (EB bill / property tax / rent)', null, '<span class="chip" style="color:var(--err);background:#DC262618">Required</span>')
const resSlot = resRow.querySelector('.slot'), resChip = resRow.querySelector('.chip')
const resEmpty = el(resSlot, 'abs', { left: '14px', top: '13px' }, `<div style="display:flex;gap:10px;align-items:center"><span class="altbtn">${icon('wallet', 14, '#9B1B30')}Use a wallet document</span><span style="font-size:12.5px;color:var(--txt3)">or drag & drop · PDF / JPEG · max 200 KB</span></div>`)
const resBtn = resEmpty.querySelector('.altbtn')
const resFull = el(resSlot, 'abs', { left: '14px', top: '6px' }, `<div style="display:flex;gap:12px;align-items:center">${icon('circle-check', 24, '#059669', 2)}<div><div style="font-size:17px;font-weight:700;color:var(--txt);line-height:1.2">Driving License</div><div style="display:flex;gap:9px;align-items:center;margin-top:3px"><span style="font-size:14px;font-weight:700;color:#047857;background:#0596691a;border:1px solid #05966955;border-radius:999px;padding:1px 10px">✓ From wallet</span><span class="mono" style="font-size:14px;color:#374151">DL-TN-2024-8842</span></div></div></div>`)
const WALLET = [['Driving License', 'DL-TN-2024-8842', '#2563EB'], ['Birth Certificate', 'BC-TN-2002-4421', '#7C3AED']]
const picker = el(rcDocs, 'picker', { left: '40px', top: '336px', width: '470px', zIndex: 6 }, `<div class="ph2">VERIFIED DOCUMENTS</div><div class="hl" style="position:absolute;left:10px;right:10px;height:56px;border-radius:10px;background:#9B1B3010"></div>${WALLET.map(([n, no, col]) => `<div class="it"><div style="width:34px;height:34px;border-radius:9px;background:${col}14;display:flex;align-items:center;justify-content:center">${icon('file-text', 17, col)}</div><div style="flex:1"><div class="t1">${n}</div><div class="t2 mono">${no} · Verified</div></div>${icon('circle-check', 16, '#059669', 2)}</div>`).join('')}`)
const pickerHL = picker.querySelector('.hl'), pickerItems = [...picker.querySelectorAll('.it')]
const rcApp = el(RCd.formIn, 'abs', { inset: 0 })
el(rcApp, 'panel-h', {}, 'Request Type')
const rcType = el(rcApp, 'abs', { left: '20px', top: '70px', width: '470px' }, `<div class="lb2">Request Type <span style="color:var(--err)">*</span></div><div class="sel ph"><span class="v">Select…</span>${icon('chevron-down', 16, '#6B7280')}</div>`)
const rcTypeV = rcType.querySelector('.v'), rcTypeSel = rcType.querySelector('.sel')
el(rcApp, 'abs', { left: '510px', top: '70px', width: '470px' }, `<div class="lb2">Card Type</div><div class="sel"><span>Rice (PHH)</span>${icon('chevron-down', 16, '#6B7280')}</div>`)
el(rcApp, 'abs', { left: '20px', top: '176px', right: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px 24px' }, [['Head of Family', 'Chandramoulishwarar K'], ['Number of Members', '3'], ['District', 'Chennai']].map(([l, v]) => `<div class="fld"><div class="lb">${l}</div><div class="in">${v}</div></div>`).join(''))
const RC_OPTS = ['New Family Card', 'Member Addition', 'Member Removal', 'Address Change', 'Duplicate / Replacement']
const rcList = el(rcApp, 'listbox', { left: '20px', top: '146px', width: '470px', zIndex: 5 }, `<div class="hl"></div>${RC_OPTS.map((o) => `<div class="op">${o}</div>`).join('')}`)
const rcListHL = rcList.querySelector('.hl')

// C · Birth Certificate
const BCd = servicePage(RC, {
  name: 'Birth Certificate', ta: 'பிறப்புச் சான்றிதழ்', mode: 'Digital', steps: STEPS6, ref: 'APP-2026-BC-44824', qr: QR.bc, formH: 360,
  dept: 'Directorate of Public Health & Preventive Medicine (DPHPM)',
  info: [['clock', 'Processing time', '≤ 21 days: automatic · delayed: per authorisation'], ['indian-rupee', 'Official fee', 'Free within 21 days'], ['building-2', 'Department', 'Directorate of Public Health & Preventive Medicine (DPHPM) · Greater Chennai Corporation / Local Body Registrar']],
})
el(BCd.formIn, 'panel-h', {}, 'Registration Type')
const bcVals = el(BCd.formIn, 'abs', { left: '20px', top: '70px', right: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' },
  [['Registration Type', 'Standard (within 21 days)'], ['RCH / PICME ID', 'From the mother’s PICME record'], ['Date of Birth', '24/09/2026'], ['Place of Birth', 'Hospital']].map(([l, v]) => `<div class="fld"><div class="lb">${l} <span style="color:var(--err)">*</span></div><div class="in"><span class="val">${v}</span></div></div>`).join(''))
const bcV = [...bcVals.querySelectorAll('.val')]
el(BCd.formIn, 'abs', { left: '20px', top: '262px', display: 'flex', gap: '8px' }, ['Digitally Signed PDF', 'QR-code verification', 'RCH (PICME) auto-population', 'Free portal download'].map((f) => `<span style="font-size:12px;font-weight:600;color:var(--pri);background:#9B1B300D;padding:7px 12px;border-radius:999px;white-space:nowrap">${f}</span>`).join(''))

// spine (birth workflow) + officer + locker
const STAGES = ['Submitted', 'Document Verification', 'Officer Assigned', 'Department Queue', 'Inspection', 'Remarks', 'Approval', 'Digital Signature', 'Certificate Generation', 'Delivered to Wallet', 'Citizen Notified', 'Completed']
const SPX = 980, SP0 = RC + 920, SPD = 104
const stageY = (i) => SP0 + i * SPD
const stg = STAGES.map((s, i) => { const e = el(front, 'stg', { left: px(SPX - 11), top: px(stageY(i) - 11) }, `<div class="d"></div><div class="l">${s}</div>`); return { e, d: e.querySelector('.d'), l: e.querySelector('.l') } })
const tag = el(front, 'tag mono', {}, '')
const TAG_A = 'APP-2026-BC-44824', TAG_C = 'CRT-2026-BC-44824'
const OFX = SPX + 178, OFY = stageY(6) - 96
const officer = el(front, 'abs', { left: px(OFX), top: px(OFY), width: '310px', borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid var(--bdr)', boxShadow: '0 22px 50px rgba(30,4,10,.18)' }, `
  <div style="background:linear-gradient(135deg,#6B1D2A,#7A1526);padding:14px 16px;display:flex;align-items:center;gap:12px">
    <div style="width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${icon('shield', 19, '#fff')}</div>
    <div><div style="color:#fff;font-size:15px;font-weight:700">Tmt. P. Anitha</div><div style="color:rgba(255,255,255,.72);font-size:12px">Zonal Officer · GCC Zone 9</div></div>
  </div>
  <div style="padding:14px"><div style="display:flex;align-items:center;gap:12px;border:1.5px solid #05966966;border-radius:14px;padding:12px 12px 12px 14px">${icon('circle-check', 19, '#059669', 2)}<div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--txt)">Approve &amp; Issue</div><div style="font-size:11.5px;color:var(--txt2);margin-top:2px;white-space:nowrap">APP-2026-BC-44824</div></div><div class="cfm" style="background:#9B1B30;color:#fff;font-size:12.5px;font-weight:600;border-radius:16px;padding:8px 14px;min-width:88px;text-align:center">Confirm</div></div></div>`)
const cfm = officer.querySelector('.cfm')
const LKX = 136, LKY = stageY(11) + 230, LKW = 300, LKG = 18
const lockTitle = el(front, 'abs', { left: px(LKX), top: px(LKY - 74), display: 'flex', alignItems: 'baseline', gap: '22px', whiteSpace: 'nowrap' }, `<span style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Digital Locker</span><span style="font-size:16px;color:var(--txt2);font-weight:500;margin-left:6px">All documents · <b class="cnt" style="color:var(--pri)">4</b></span>`)
const lockCnt = lockTitle.querySelector('.cnt')
const DOCS = [['Ration Card', 'RC-TN-CHN-7788', 'CIVIL SUPPLIES', '#059669'], ['Income Certificate', 'IC-TN-2024-9912', 'REVENUE', '#059669'], ['Birth Certificate', 'BC-TN-2002-4421', 'CIVIL', '#7C3AED'], ['Driving License', 'DL-TN-2024-8842', 'TRANSPORT', '#2563EB'], ['Birth Certificate', 'CRT-2026-BC-44824', 'PUBLIC HEALTH (DPHPM)', '#059669']]
const docs = DOCS.map(([t, n, cat, col], i) => el(front, 'doc', { left: px(LKX + i * (LKW + LKG)), top: px(LKY), width: px(LKW) }, `<div class="ic" style="background:${col}14">${icon('file-text', 18, col)}</div><div class="t">${t}</div><div class="n mono">${n}</div><div class="f"><span class="cat" style="color:${col}">${cat}</span><span class="v">${icon('circle-check', 13, '#059669', 2)}Verified</span></div>`))
const cert = docs[4]
{ const n = cert.querySelector('.n'); n.style.fontSize = '15px'; n.style.color = '#374151'; n.style.fontWeight = 600; cert.querySelector('.t').style.fontSize = '18px' }

// D · Schemes (ranked against the citizen profile) + tracked prerequisite
const mastS = masthead(back, RS, 'Schemes')
const schHead = el(back, 'abs', { left: '136px', top: px(RS + 192), whiteSpace: 'nowrap' }, `<div style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Welfare Schemes</div><div style="font-size:15px;color:var(--txt2);margin-top:8px">Government of Tamil Nadu schemes ranked against Chandramoulishwarar K citizen profile — district, income band and verified documents.</div>`)
const SCH = [
  ['PM Kisan Samman Nidhi', 'பிரதம மந்திரி கிசான் சம்மான் நிதி', 95, '#0F766E', 'High match'], ['Annanin Seer Scheme', 'அண்ணனின் சீர் திட்டம்', 92, '#DB2777', 'High match'],
  ['Thai Maaman Thanga Modhiram Scheme', 'தாய் மாமன் தங்க மோதிரம் திட்டம்', 88, '#F59E0B', 'High match'], ['Vetri Laptop Scheme', 'வெற்றி மடிக்கணினி திட்டம்', 85, '#7C3AED', 'High match'],
  ['Modern Bicycle Scheme', 'நவீன மிதிவண்டி திட்டம்', 80, '#0891B2', 'Likely eligible'], ['Vetri Skill Training Scheme', 'வெற்றி திறன் பயிற்சி திட்டம்', 78, '#2563EB', 'Likely eligible'],
  ['Vetri Housing Scheme', 'வெற்றி வீட்டுவசதி திட்டம்', 74, '#059669', 'Likely eligible'], ["Vetri Women's Goat Rearing Scheme", 'வெற்றி மகளிர் ஆடு வளர்ப்பு திட்டம்', 70, '#16A34A', 'Possible'],
  ['Digital Library Initiative', 'டிஜிட்டல் நூலகத் திட்டம்', 66, '#8B5CF6', 'Possible'],
]
const SCW = (1648 - 4 * 16) / 5, SCH_H = 232
const schCards = SCH.map(([n, ta, m, col, band], k) => {
  const x = 136 + (k % 5) * (SCW + 16), y = RS + 300 + Math.floor(k / 5) * (SCH_H + 16)
  const e = el(back, 'sch', { left: px(x), top: px(y), width: px(SCW), height: px(SCH_H) }, `<div class="ic" style="background:${col}18">${icon('sparkles', 18, col)}</div><div class="n1">${n}</div><div class="n2">${ta}</div><div style="position:absolute;left:16px;right:16px;bottom:16px"><div class="mt"><span>Eligibility match</span><b class="pc" style="color:var(--txt)">0%</b></div><div class="bar"><i style="width:0;background:${col}"></i></div><span class="band" style="color:${m >= 82 ? '#059669' : '#D97706'};background:${m >= 82 ? '#05966914' : '#D9770614'}">${band}</span></div>`)
  return { e, m, x, y, bar: e.querySelector('.bar i'), pc: e.querySelector('.pc'), band: e.querySelector('.band') }
})
const thai = schCards[2]
const SD_W = 900, SD_X = 510   // a dialog opening out of the Thai Maaman card: the scheme stays named above its steps
const schDetail = el(front, 'panel abs', { left: px(SD_X), top: px(RS + 290), width: px(SD_W), boxShadow: '0 30px 70px rgba(30,4,10,.22)' }, `
  <div class="panel-h" style="font-size:19px;padding:16px 22px">${icon('sparkles', 18, '#F59E0B')}Thai Maaman Thanga Modhiram Scheme<span style="flex:1"></span><span class="chip ok" style="font-size:15px">88% · High match</span>${icon('x', 17, '#9CA3AF')}</div>
  <div style="padding:14px 24px 20px">
    <div class="ta" style="font-size:16px;color:var(--txt2)">தாய் மாமன் தங்க மோதிரம் திட்டம்</div>
    <div style="display:flex;gap:30px;margin-top:12px;font-size:17px;color:var(--txt);line-height:1.4"><div class="bnf" style="border-radius:6px"><span style="font-size:12.5px;color:var(--txt3);display:block">Benefit</span>1 g gold ring for every baby born in a Government hospital</div><div style="white-space:nowrap"><span style="font-size:12px;color:var(--txt3);display:block">Department</span>Health &amp; Family Welfare</div></div>
    <div style="font-size:12.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--txt3);margin-top:18px">How to apply</div>
    <ol class="howto" style="margin-top:8px;padding-left:22px;display:grid;gap:6px;font-size:16.5px;color:var(--txt2);line-height:1.5"><li class="h1"><b style="color:var(--txt)">Obtain an Income Certificate</b> if you do not already hold a valid one.</li><li>Carry your Aadhaar, ration card and the certificate to your Taluk e-Sevai centre.</li><li>The department verifies eligibility and sanctions the benefit.</li></ol>
    <div style="display:flex;gap:8px;margin-top:16px"><span class="btn pri apl">${icon('file-text', 15, '#fff')}Apply for Income Certificate</span><span class="btn">${icon('sparkles', 15, '#1C1C1E')}Ask Vetri about this scheme</span></div>
  </div>`)
const howH1 = schDetail.querySelector('.h1'), aplBtn = schDetail.querySelector('.apl'), bnf = schDetail.querySelector('.bnf')
// tracked prerequisite: the citizen's Income Certificate application (seeded, live)
const TRY = RS + 1150
const tracker = el(front, 'panel abs', { left: '136px', top: px(TRY), width: '780px' }, `
  <div class="panel-h">Application detail</div>
  <div style="padding:18px 22px">
    <div style="display:flex;align-items:center;gap:12px"><span style="font-size:22px;font-weight:800;color:var(--txt)">Income Certificate</span><span class="chip warn">In Progress</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 26px;margin-top:16px">${[['Reference', '<span class="mono">APP-2026-IC-44821</span>'], ['Department', 'Revenue & Disaster Management Department'], ['Officer', 'Tmt. R. Kalaivani · Revenue Inspector'], ['Filed on', '26 Sept 2026']].map(([k, v]) => `<div><div style="font-size:11.5px;color:var(--txt3)">${k}</div><div style="font-size:15px;color:var(--txt);margin-top:3px">${v}</div></div>`).join('')}</div>
    <div class="days" style="margin-top:18px;padding-top:14px;border-top:1px solid var(--bdr);font-size:17px;color:var(--txt2)"><b style="color:#D97706;font-size:22px">3 days</b> remaining under the Right to Service charter.</div>
  </div>`)
const daysEl = tracker.querySelector('.days')
const IC_ST = ['Submitted', 'Document Verification', 'Officer Assigned', 'Department Queue', 'Inspection', 'Remarks', 'Approval']
const icTimeline = el(front, 'abs', { left: '1000px', top: px(TRY + 4), width: '440px' }, IC_ST.map((s, i) => `<div style="display:flex;align-items:center;gap:14px;height:58px;position:relative">${i < IC_ST.length - 1 ? `<span style="position:absolute;left:11px;top:34px;width:2px;height:48px;background:${i < 4 ? '#059669' : '#E5E7EB'}"></span>` : ''}<span style="width:24px;height:24px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;${i < 4 ? 'background:#059669' : i === 4 ? 'background:#fff;border:2.5px solid #9B1B30' : 'background:#fff;border:2px solid #D7DAE0'}">${i < 4 ? icon('check', 12, '#fff', 3.2) : ''}</span><span style="font-size:18px;font-weight:${i <= 4 ? 700 : 600};color:${i < 4 ? '#1C1C1E' : i === 4 ? '#9B1B30' : '#9CA3AF'}">${s}</span>${i === 4 ? '<span class="chip warn" style="margin-left:6px">Current</span>' : ''}</div>`).join(''))

// ── screen-space: rail (My Applications), fly tag, expander, register, plate, finale ──
const RROWS = [['Birth Certificate', 'APP-2026-BC-44824', 'Submitted', 'warn'], ['Ration Card (Smart Card)', 'APP-2026-RC-44823', 'Submitted', 'warn'], ['Driving Licence', 'APP-2026-DL-44822', 'Submitted', 'warn'], ['Income Certificate', 'APP-2026-IC-44821', 'In Progress', 'warn'], ['Community Certificate', 'APP-2026-CC-44903', 'In Progress', 'warn']]
const ROW_H = 80, RAIL_HEAD = 66, RAIL_W = 480
const RAIL_X = 1920 - RAIL_W - 110, RAIL_Y = Math.round((1080 - (RAIL_HEAD + 5 * ROW_H)) / 2)
const rail = el(screenL, 'rail', { left: px(RAIL_X), top: px(RAIL_Y), width: px(RAIL_W) }, `<div class="rh" style="height:${RAIL_HEAD}px;font-size:21px">${icon('timer', 21, '#9B1B30', 2)}My Applications<span style="flex:1"></span><span class="rc" style="font-size:15px;color:var(--txt2);font-weight:500">All · 2</span></div><div class="rbody" style="position:relative"></div>`)
const railBody = rail.querySelector('.rbody'), railCount = rail.querySelector('.rc')
const railRows = RROWS.map(([n, r, st, tone]) => el(railBody, 'rr', { position: 'absolute', left: 0, right: 0, height: px(ROW_H), overflow: 'hidden', boxSizing: 'border-box', padding: '0 22px' }, `<div style="flex:1"><div class="rn" style="font-size:20px">${n}</div><div class="rf mono" style="font-size:14px;margin-top:3px">${r}</div></div><span class="chip ${tone} st" style="font-size:14px;padding:6px 13px">${st}</span>`))
const railChips = railRows.map((r) => r.querySelector('.st'))
rail.style.transformOrigin = '0 0'
const trackerS = el(screenL, 'panel abs', { left: '330px', top: '300px', width: '1260px', boxShadow: '0 40px 90px rgba(30,4,10,.28)', transformOrigin: '50% 50%' }, `
  <div class="panel-h" style="font-size:18px;padding:18px 26px">${icon('timer', 19, '#9B1B30', 2)}Application detail<span style="flex:1"></span><span class="chip warn" style="font-size:14px;padding:6px 14px">In Progress</span></div>
  <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:36px;padding:24px 28px 26px">
    <div><div style="font-size:34px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Income Certificate</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;margin-top:20px">${[['Reference', '<span class="mono">APP-2026-IC-44821</span>'], ['Filed on', '26 Sept 2026'], ['Officer', 'Tmt. R. Kalaivani · Revenue Inspector'], ['Department', 'Revenue & Disaster Management']].map(([k, v]) => `<div><div style="font-size:14px;color:var(--txt3)">${k}</div><div style="font-size:20px;color:var(--txt);margin-top:4px;line-height:1.35">${v}</div></div>`).join('')}</div>
      <div class="days" style="margin-top:22px;padding:16px 18px;border-radius:12px;font-size:23px;color:var(--txt2);line-height:1.35"><b style="color:#D97706;font-size:34px">3 days</b> remaining under the Right to Service charter.</div></div>
    <div>${['Submitted', 'Document Verification', 'Officer Assigned', 'Department Queue', 'Inspection', 'Remarks', 'Approval'].map((st, i) => `<div style="display:flex;align-items:center;gap:16px;height:52px;position:relative">${i < 6 ? `<span style="position:absolute;left:12px;top:36px;width:2px;height:40px;background:${i < 4 ? '#059669' : '#E5E7EB'}"></span>` : ''}<span style="width:26px;height:26px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;${i < 4 ? 'background:#059669' : i === 4 ? 'background:#fff;border:3px solid #9B1B30' : 'background:#fff;border:2px solid #D7DAE0'}">${i < 4 ? icon('check', 13, '#fff', 3.2) : ''}</span><span style="font-size:21px;font-weight:${i <= 4 ? 700 : 600};color:${i < 4 ? '#1C1C1E' : i === 4 ? '#9B1B30' : '#9CA3AF'}">${st}</span>${i === 4 ? '<span class="chip warn" style="margin-left:4px;font-size:13px">Current</span>' : ''}</div>`).join('')}</div>
  </div>`)
const trackerDays = trackerS.querySelector('.days')
const TRK_S = 1.38, TRK_R = { x: (1920 - 1260 * TRK_S) / 2, y: (1080 - trackerS.offsetHeight * TRK_S) / 2 - 6, w: 1260 * TRK_S, h: trackerS.offsetHeight * TRK_S }
const dotsL = el(screenL, 'abs', { left: 0, top: 0, width: '1920px', height: '1080px' })
const DOTS = [['#059669', 'Birth Certificate'], ['#D97706', 'Ration Card'], ['#D97706', 'Driving Licence'], ['#D97706', 'Income Certificate'], ['#D97706', 'Community Certificate']]
const dotEls = DOTS.map(([c]) => { const d = el(dotsL, 'abs', { width: '22px', height: '22px', borderRadius: '50%', background: c, boxShadow: '0 0 0 6px rgba(255,255,255,.08)' }); d.dataset.c = c; return d })
const dotLabels = el(dotsL, 'abs', { left: px(IRIS_P[0] - 300), top: px(IRIS_P[1] + 26), width: '600px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,.75)' }, DOTS.map(([, l]) => `<span>${l}</span>`).join(''))
const flyTag = el(screenL, 'flytag mono', {}, '')
const mylLabel = el(screenL, 'maplabel', { fontSize: '28px' }, `Mylapore<span class="ta">மயிலாப்பூர்</span>`)
const flyHand = el(screenL, 'abs', { display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '28px', fontWeight: 600, color: '#1C1C1E', background: '#fff', border: '2px solid #2563EB', borderRadius: '13px', padding: '12px 20px', boxShadow: '0 12px 30px rgba(37,99,235,.18)', whiteSpace: 'nowrap', zIndex: 21 }, `${icon('external-link', 22, '#1C1C1E')}Continue on TNPDS`)
const expander = el(screenL, 'expander', {}, `<div class="exin" style="position:absolute;left:0;top:0;transform-origin:0 0;padding:14px"><div style="width:40px;height:40px;border-radius:11px;background:#9B1B300D;display:flex;align-items:center;justify-content:center">${icon('car', 20, '#9B1B30', 1.8)}</div><div style="font-size:15px;font-weight:700;color:var(--txt);margin-top:12px;white-space:nowrap">Driving Licence</div><div class="ta" style="font-size:12px;color:var(--txt2);margin-top:3px">ஓட்டுநர் உரிமம்</div></div>`)
const exin = expander.querySelector('.exin')
const SUG_W = 760, SUG_S = 1.9
const sugg = el(screenL, 'expander', { left: px(960 - SUG_W * SUG_S / 2), top: px(540 - 60 * SUG_S), width: px(SUG_W), overflow: 'hidden', boxShadow: '0 30px 70px rgba(30,4,10,.3)' }, `<div class="sgin" style="position:absolute;left:0;top:0;transform-origin:0 0;width:${SUG_W}px"><div style="padding:14px 18px 6px;font-size:11px;font-weight:700;letter-spacing:1.4px;color:var(--txt3)">SUGGESTED FOR YOU</div><div style="margin:4px 14px 14px;display:flex;gap:12px;align-items:center;border:1px solid var(--bdr);border-radius:10px;padding:12px 14px;font-size:16px;font-weight:600;color:var(--txt);white-space:nowrap">${icon('lightbulb', 18, '#D4A843')}Eligible for 9 welfare schemes based on your profile${icon('arrow-right', 16, '#9B1B30', 2)}</div></div>`)
const sgin = sugg.querySelector('.sgin')
const SUG_H = sgin.offsetHeight
const REG = [['Birth Certificate', 'APP-2026-BC-44824', 'Directorate of Public Health & Preventive Medicine', 'Completed', 'ok'], ['Ration Card (Smart Card)', 'APP-2026-RC-44823', 'Civil Supplies & Consumer Protection', 'Submitted', 'warn'], ['Driving Licence', 'APP-2026-DL-44822', 'Ministry of Road Transport & Highways', 'Submitted', 'warn'], ['Income Certificate', 'APP-2026-IC-44821', 'Revenue & Disaster Management', 'In Progress', 'warn'], ['Community Certificate', 'APP-2026-CC-44903', 'Revenue Department', 'In Progress', 'warn']]
const regp = el(screenL, 'regp', { left: '210px', top: '230px', width: '1500px' }, `<div class="rh" style="display:flex;align-items:center;gap:10px;padding:18px 22px;border-bottom:1px solid var(--bdr);font-size:19px;font-weight:800;color:var(--txt)">${icon('timer', 19, '#9B1B30', 2)}My Applications<span style="flex:1"></span><span style="font-size:13px;color:var(--txt2);font-weight:500">Every application, with its Right to Service timeline and the officer responsible</span></div><table><thead><tr><th>Service</th><th>Reference</th><th>Department</th><th>Status</th></tr></thead><tbody>${REG.map(([n, r, d, st, tone]) => `<tr><td style="font-weight:700">${n}</td><td class="ref">${r}</td><td style="color:var(--txt2)">${d}</td><td><span class="chip ${tone} rs">${st}</span></td></tr>`).join('')}</tbody></table>`)
const regRows = [...regp.querySelectorAll('tbody tr')], regChips = [...regp.querySelectorAll('.rs')]

const plate = el(screenL, 'plate', { width: '760px' }, `
  <div class="hd"><div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${icon('landmark', 22, '#fff')}</div>
  <div><div style="color:var(--secLt);font-size:13px;font-weight:700;letter-spacing:3px;margin-bottom:4px">MLA DASHBOARD</div><div style="color:#fff;font-size:20px;font-weight:700">Mylapore Constituency</div><div style="color:rgba(255,255,255,.72);font-size:13.5px;margin-top:2px">Chennai District · Assembly segment</div></div></div>
  <div class="body">
  <div class="tiles">
    <div class="tl" style="position:relative"><div class="v odo0" style="color:var(--txt)"></div><div class="k">Submitted</div><b class="p1" style="position:absolute;right:10px;top:8px;font-size:19px;font-weight:800;color:#fff;background:#9B1B30;border-radius:999px;padding:1px 10px">+1</b></div>
    <div class="tl" style="position:relative"><div class="v odo1" style="color:#059669"></div><div class="k">Completed</div><b class="p1" style="position:absolute;right:10px;top:8px;font-size:19px;font-weight:800;color:#fff;background:#059669;border-radius:999px;padding:1px 10px">+1</b></div>
    <div class="tl" style="position:relative"><div class="v odo2" style="color:#D97706"></div><div class="k">Pending</div><b class="p1" style="position:absolute;right:10px;top:8px;font-size:19px;font-weight:800;color:#fff;background:#D97706;border-radius:999px;padding:1px 10px">+1</b></div>
  </div></div>`)
const plus1 = [...plate.querySelectorAll('.p1')]
const PLATE_H = plate.offsetHeight
// odometers with per-digit wheels (carry-aware)
function odometer(host, digits) {
  host.innerHTML = ''
  const wheels = []
  for (let k = 0; k < digits; k++) {
    if (digits - k === 3 && digits > 3) host.appendChild(document.createTextNode(','))
    const w = h('span'); Object.assign(w.style, { display: 'inline-block', height: '38px', overflow: 'hidden', verticalAlign: 'top' })
    const strip = h('span'); Object.assign(strip.style, { display: 'block' }); strip.innerHTML = Array.from({ length: 11 }, (_, d) => `${d % 10}`).join('<br>')
    w.appendChild(strip); host.appendChild(w); wheels.push(strip)
  }
  return (value) => { // value may be fractional mid-roll
    const iv = Math.floor(value), fr = value - iv
    wheels.forEach((s, k) => {
      const p = digits - 1 - k, unit = 10 ** p
      let d = Math.floor(iv / unit) % 10
      const lower = iv % unit
      const rolling = p === 0 || lower === unit - 1
      const pos = d + (rolling ? fr : 0)
      s.style.transform = `translateY(${-pos * 38 / 1}px)`
    })
  }
}
const odo = [odometer(plate.querySelector('.odo0'), 4), odometer(plate.querySelector('.odo1'), 4), odometer(plate.querySelector('.odo2'), 3)]

const sign = el(screenL, 'sign', {}, `
  <img class="seal" src="${SEAL}" style="position:absolute;left:0;top:0;width:120px;height:auto;transform-origin:50% 50%">
  <div style="position:absolute;left:146px;top:0;overflow:hidden;padding-bottom:6px"><div class="sw" style="font-size:62px;font-weight:800;letter-spacing:-1.6px;color:#fff;white-space:nowrap">Vetri Tamil Nadu</div></div>
  <div style="position:absolute;left:149px;top:80px;overflow:hidden;padding-bottom:8px"><div class="st2 ta" style="font-size:36px;font-weight:600;color:var(--secLt);white-space:nowrap">வெற்றி தமிழ்நாடு</div></div>`)
const signSeal = sign.querySelector('.seal'), signW = sign.querySelector('.sw'), signT = sign.querySelector('.st2')

// ── E · Grievances (the app's real complaint flow) ───────────────────────────
const RG = 9600
const mastG = masthead(back, RG, 'Grievances')
el(back, 'abs', { left: '136px', top: px(RG + 192), whiteSpace: 'nowrap' }, `<div style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Grievances</div><div style="font-size:15px;color:var(--txt2);margin-top:8px">Report civic issues to the responsible department and follow their resolution against published service timelines.</div>`)
const gChips = el(back, 'abs', { left: '136px', top: px(RG + 296), display: 'flex', gap: '8px' }, [['All', 0], ['Open', 0], ['Resolved', 0]].map(([l, n], i) => `<span class="fchip${i === 0 ? ' on' : ''}">${l} · <b class="gcn" style="margin-left:4px">${n}</b></span>`).join(''))
const gCn = [...gChips.querySelectorAll('.gcn')]
const GP_W = 1440
const grvP = el(back, 'panel abs', { left: '136px', top: px(RG + 356), width: px(GP_W), height: '470px' })
const grvForm = el(grvP, 'abs', { inset: 0 })
el(grvForm, 'panel-h', { fontSize: '17px' }, `File a grievance<span style="flex:1"></span>${icon('x', 17, '#9CA3AF')}`)
const G_CATS = ['Road Damage', 'Water Supply', 'Streetlight', 'Garbage', 'Drainage', 'Other']
const grvLeft = el(grvForm, 'abs', { left: '24px', top: '74px', width: '820px' }, `
  <div style="font-size:14px;font-weight:600;color:var(--txt2);margin-bottom:10px">Issue category</div>
  <div class="gcats" style="display:flex;flex-wrap:wrap;gap:9px">${G_CATS.map((c) => `<span class="gcat" style="padding:11px 18px;border-radius:999px;border:1px solid var(--bdr);background:#fff;color:var(--txt2);font-size:17px;font-weight:500;white-space:nowrap">${c}</span>`).join('')}</div>
  <div style="font-size:14px;font-weight:600;color:var(--txt2);margin:22px 0 8px">What is the problem? <span style="color:var(--err)">*</span></div>
  <div class="gdesc" style="height:96px;border:1px solid var(--bdr);border-radius:11px;background:#fff;padding:12px 15px;font-size:16px;line-height:1.55;color:var(--txt)"><span class="gtxt"></span><span class="gcar" style="display:inline-block;width:2px;height:19px;background:#9B1B30;vertical-align:-3px;margin-left:1px"></span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px">
    <div><div style="font-size:14px;font-weight:600;color:var(--txt2);margin-bottom:7px">Area / locality</div><div style="height:46px;border:1px solid var(--bdr);border-radius:10px;background:#fff;display:flex;align-items:center;padding:0 14px;font-size:16px"><span class="garea" style="color:var(--txt)"></span></div></div>
    <div><div style="font-size:14px;font-weight:600;color:var(--txt2);margin-bottom:7px">Ward (optional)</div><div style="height:46px;border:1px solid var(--bdr);border-radius:10px;background:#fff;display:flex;align-items:center;padding:0 14px;font-size:16px;color:var(--txt3)">Ward 121</div></div>
  </div>`)
const grvSubmit = el(grvForm, 'abs', { left: '24px', top: '410px', display: 'flex', gap: '9px' }, `<span class="gsub" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:11px;background:#9B1B30;color:#fff;font-size:15px;font-weight:700">${icon('send', 15, '#fff')}Submit grievance</span><span class="btn">Cancel</span>`)
const gCats = [...grvLeft.querySelectorAll('.gcat')], gTxt = grvLeft.querySelector('.gtxt'), gCar = grvLeft.querySelector('.gcar'), gArea = grvLeft.querySelector('.garea'), gSub = grvSubmit.querySelector('.gsub')
const G_DESC = 'Large pothole outside 12/3 TTK Road, causing two-wheeler accidents.'
const grvRoute = el(grvForm, 'abs', { left: '900px', top: '74px', width: '510px' }, `
  <div style="font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--txt3)">Where this will go</div>
  <div class="groute" style="display:grid;gap:16px;margin-top:14px">${[['Responsible department', 'GCC - Highways'], ['Priority', 'High'], ['Expected resolution', '5 days from filing']].map(([k, v]) => `<div class="grr" style="border-radius:8px;padding:2px 0"><div style="font-size:13px;color:var(--txt3)">${k}</div><div style="font-size:18px;color:var(--txt);font-weight:600;margin-top:3px">${v}</div></div>`).join('')}</div>
  <div style="display:flex;gap:9px;font-size:13.5px;color:var(--txt2);margin-top:20px;padding-top:15px;border-top:1px solid var(--bdr);line-height:1.6">${icon('map-pin', 15, '#9CA3AF')}<span>Routing is decided by the issue category. You will receive a tracking reference immediately and a notification at every stage of resolution.</span></div>`)
const gRoute = grvRoute.querySelector('.groute'), gRR = [...grvRoute.querySelectorAll('.grr')]
const grvFiled = el(grvP, 'abs', { inset: 0 })
el(grvFiled, 'panel-h', { fontSize: '17px' }, `Grievance filed<span style="flex:1"></span>${icon('x', 17, '#9CA3AF')}`)
const gFiledTile = el(grvFiled, 'abs', { left: '24px', top: '80px', width: '56px', height: '56px', borderRadius: '15px', background: '#05966915', display: 'flex', alignItems: 'center', justifyContent: 'center' }, icon('circle-check', 28, '#059669', 2))
const gFiledTx = el(grvFiled, 'abs', { left: '100px', top: '78px', width: '800px' }, `<div style="font-size:26px;font-weight:800;color:var(--txt);letter-spacing:-.4px">Road Damage reported</div><div style="font-size:17px;color:var(--txt2);margin-top:8px;line-height:1.55">Routed to <b style="color:var(--txt)">GCC - Highways</b> · expected resolution within <b style="color:var(--txt)">5 days</b></div>`)
const gRefBox = el(grvFiled, 'abs', { left: '100px', top: '190px', display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px', borderRadius: '13px', background: 'var(--bgAlt)', border: '1px solid var(--bdr)' }, `<span style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:var(--txt3)">Reference</span><span class="mono gref" style="font-size:30px;font-weight:700;color:var(--pri);white-space:nowrap">CMP-TN-2026-000453</span><span class="chip warn" style="font-size:14px;padding:6px 13px">Submitted</span>`)
const gRef = gRefBox.querySelector('.gref')
el(grvFiled, 'abs', { left: '100px', top: '296px', display: 'flex', gap: '9px' }, `<span class="btn pri">View in my grievances</span><span class="btn">${icon('bell', 15, '#1C1C1E')}Open notifications</span>`)
const G_STEPS = ['Submitted', 'Assigned to department', 'Work in progress', 'Resolved']
const grvTime = el(back, 'panel abs', { left: px(136 + 1004), top: px(RG + 356), width: '420px' }, `<div class="panel-h" style="font-size:17px">Resolution timeline</div><div style="padding:18px 22px 20px">${G_STEPS.map((st, i) => `<div style="display:flex;gap:14px;align-items:flex-start;position:relative;padding-bottom:${i < 3 ? 22 : 0}px">${i < 3 ? `<span style="position:absolute;left:11px;top:26px;width:2px;height:calc(100% - 22px);background:#E5E7EB"></span>` : ''}<span style="width:24px;height:24px;border-radius:50%;flex:none;${i === 0 ? 'background:#fff;border:3px solid #9B1B30' : 'background:#fff;border:2px solid #D7DAE0'}"></span><span style="font-size:18px;font-weight:${i === 0 ? 700 : 500};color:${i === 0 ? '#9B1B30' : '#9CA3AF'};margin-top:1px">${st}</span>${i === 0 ? '<span class="chip warn" style="margin-left:4px;font-size:12.5px">Current</span>' : ''}</div>`).join('')}<div style="margin-top:20px;padding-top:15px;border-top:1px solid var(--bdr);font-size:15px;color:var(--txt2);line-height:1.55">Expected resolution within <b style="color:#D97706">5 days</b> of filing. A notification at every stage.</div></div>`)

// ── D · the scheme's hero moment (the 1 g gold ring) ─────────────────────────
const heroG = el(screenL, 'abs', { left: 0, top: 0, width: '1920px', height: '1080px', pointerEvents: 'none' }, `
  <div class="hgOver" style="position:absolute;left:0;right:0;top:190px;text-align:center"><div style="font-size:34px;font-weight:800;letter-spacing:5px;color:#9B1B30">THAI MAAMAN THANGA MODHIRAM SCHEME</div><div class="ta" style="font-size:30px;color:#6B7280;margin-top:10px">தாய் மாமன் தங்க மோதிரம் திட்டம்</div></div>
  <div class="hgRow" style="position:absolute;left:0;right:0;top:318px;display:flex;justify-content:center;align-items:center;gap:40px">
    <svg class="hgRing" width="420" height="420" viewBox="0 0 280 280" style="overflow:visible"><defs><linearGradient id="hgFoil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E3A1"/><stop offset=".3" stop-color="#D4A843"/><stop offset=".55" stop-color="#8C6A1F"/><stop offset=".8" stop-color="#E8C66A"/><stop offset="1" stop-color="#B8922E"/></linearGradient><radialGradient id="hgGlow"><stop offset="0" stop-color="rgba(241,212,136,.3)"/><stop offset="1" stop-color="rgba(241,212,136,0)"/></radialGradient></defs><g transform="translate(140 140) rotate(-12) scale(1 0.78)"><circle r="107" fill="none" stroke="#8C6A1F" stroke-width="2.5" opacity=".55"/><circle class="hgC" r="92" fill="none" stroke="url(#hgFoil)" stroke-width="30" stroke-linecap="round" transform="rotate(-90)" stroke-dasharray="590" stroke-dashoffset="590"/><circle class="hgC2" r="84" fill="none" stroke="#F6E3A1" stroke-width="4" stroke-linecap="round" opacity=".85" transform="rotate(-90)" stroke-dasharray="540" stroke-dashoffset="540"/><circle class="hgGlint" r="92" fill="none" stroke="#FFFBEA" stroke-width="9" stroke-linecap="round" stroke-dasharray="34 544" transform="rotate(-90)" opacity="0"/></g></svg>
    <div class="hgTx" style="white-space:nowrap"><div style="font-size:184px;font-weight:800;letter-spacing:-5px;line-height:1.12;padding-bottom:.06em;background:linear-gradient(180deg,#D9A93A 0%,#9A6B12 58%,#C99A35 100%);-webkit-background-clip:text;background-clip:text;color:transparent">1 g</div><div style="font-size:92px;font-weight:800;letter-spacing:-2px;line-height:1.02;color:#1C1C1E">GOLD RING</div></div>
  </div>
  <div class="hgCtx" style="position:absolute;left:0;right:0;top:716px;text-align:center"><div style="font-size:36px;color:#374151;font-weight:600">for every baby born in a Government hospital</div><div style="display:inline-flex;gap:14px;margin-top:18px;align-items:center"><span class="chip ok" style="font-size:28px;padding:9px 20px">88% · High match</span><span style="font-size:26px;color:#6B7280">Health &amp; Family Welfare</span></div></div>`)
const hgOver = heroG.querySelector('.hgOver'), hgRow = heroG.querySelector('.hgRow'), hgCtx = heroG.querySelector('.hgCtx'), hgC = heroG.querySelector('.hgC'), hgC2 = heroG.querySelector('.hgC2'), hgGlint = heroG.querySelector('.hgGlint'), hgHalo = heroG.querySelector('.hgHalo'), hgTx = heroG.querySelector('.hgTx'), hgRing = heroG.querySelector('.hgRing')

// ── ACT V · scale: constituency dashboards, the 234, the portrait, மாற்றம், identity ──
const ACG = (no) => geo.chennai.find((a) => a.no === no)
const STOPS = [
  { no: 22, name: 'Virugambakkam', ta: 'விருகம்பாக்கம்' },
  { no: 14, name: 'Villivakkam', ta: 'வில்லிவாக்கம்' },
  { no: 24, name: 'T. Nagar', ta: 'தியாகராய நகர்' },
].map((st) => ({ ...st, c: ACG(st.no).c, p: new Path2D(ACG(st.no).d) }))
function makeDash(name) {
  const d = el(screenL, 'plate', { width: '620px' }, `
  <div class="hd"><div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${icon('landmark', 22, '#fff')}</div>
  <div style="flex:1"><div style="color:var(--secLt);font-size:13px;font-weight:700;letter-spacing:3px;margin-bottom:4px">MLA DASHBOARD</div><div style="color:#fff;font-size:21px;font-weight:700">${name} Constituency</div><div style="color:rgba(255,255,255,.72);font-size:13.5px;margin-top:2px">Chennai District · Assembly segment</div></div>
  <span class="live" style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.14);color:#F2E3BC;font-size:16px;font-weight:700;padding:7px 14px;border-radius:999px"><i style="width:9px;height:9px;border-radius:50%;background:#E8C66A;display:inline-block"></i>Ready</span></div>
  <div class="body"><div class="tiles">${['Submitted', 'Completed', 'Pending'].map((k) => `<div class="tl" style="position:relative;overflow:hidden"><div style="height:38px;display:flex;flex-direction:column;justify-content:center;gap:7px"><i class="db" style="display:block;height:10px;border-radius:5px;background:#E5E7EB;width:0"></i><i class="db" style="display:block;height:10px;border-radius:5px;background:#EEF0F3;width:0"></i></div><div class="k">${k}</div><span class="sh" style="position:absolute;top:0;bottom:0;width:60%;background:linear-gradient(90deg,transparent,rgba(212,168,67,.32),transparent);transform:translateX(-120%)"></span></div>`).join('')}</div></div>`)
  return { e: d, live: d.querySelector('.live'), bars: [...d.querySelectorAll('.db')], sh: [...d.querySelectorAll('.sh')] }
}
const dashes = STOPS.map((st) => makeDash(st.name))
dashes[2].e.querySelector('.body').style.display = 'none'   // the run accelerates: T. Nagar shows its header only
const DASH_HS = dashes.map((d) => d.e.offsetHeight), DASH_S = [1.5, 1.2, 1.15], DASH_OFF = [96, 120, 250], LBL_OFF = [70, 76, 104]
const stopLabels = STOPS.map((st) => el(screenL, 'maplabel', { fontSize: '40px', fontWeight: 700, textShadow: '0 2px 14px rgba(0,0,0,.75)' }, `${st.name}<span class="ta" style="font-size:33px">${st.ta}</span>`))
const DASH_H = dashes[0].e.offsetHeight
const cntScrim = el(screenL, 'abs', { left: 0, top: 0, width: '820px', height: '1080px', background: 'linear-gradient(to right, rgba(11,5,7,.94), rgba(11,5,7,.72) 60%, rgba(11,5,7,0))' })
const cnt234 = el(screenL, 'abs', { left: '150px', top: '310px', whiteSpace: 'nowrap' }, `<div class="cnum" style="font-size:190px;font-weight:800;letter-spacing:-6px;line-height:1;color:#F1D488;font-variant-numeric:tabular-nums">4</div><div style="font-size:32px;font-weight:800;letter-spacing:6px;color:#E8C66A;margin-top:16px">ASSEMBLY CONSTITUENCIES</div><div style="font-size:34px;color:rgba(247,243,232,.88);margin-top:12px;font-weight:500">Built for every constituency.</div>`)
const cntNum = cnt234.querySelector('.cnum')
// portrait: the supplied reference, placed so its red map sits on the film's map
const PIMG_K = 0.952, PIMG_X = 960 - 887 * PIMG_K / 2, PIMG_Y = 20
const P_CAM = { s: 0.879, c: [417.6, 540.7] }
const portraitBox = el(screenL, 'abs', { left: px(PIMG_X), top: px(PIMG_Y), width: px(887 * PIMG_K), height: px(1092 * PIMG_K), transformOrigin: '0 0' })
screenL.insertBefore(portraitBox, thrS)
const dipDark = el(screenL, 'abs', { left: 0, top: 0, width: '1920px', height: '1080px', background: '#0B0607', opacity: 0 }); screenL.insertBefore(dipDark, thrS)   // above the portrait and the map, below the gold line
const silBox = el(screenL, 'abs', { left: px(PIMG_X), top: px(PIMG_Y), width: px(887 * PIMG_K), height: px(1092 * PIMG_K) }); screenL.insertBefore(silBox, thrS)
const pRed = h('img'); pRed.src = '../assets/portrait_red.png'; Object.assign(pRed.style, { position: 'absolute', inset: 0, width: '100%', height: '100%' }); portraitBox.appendChild(pRed)
const pGold = h('img'); pGold.src = '../assets/portrait_gold.png'; Object.assign(pGold.style, { position: 'absolute', inset: 0, width: '100%', height: '100%' }); portraitBox.appendChild(pGold)
await Promise.all([pRed, pGold].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = r; im.onerror = r }))))
const FACE_F = [PIMG_X + 475 * PIMG_K, PIMG_Y + 60 * PIMG_K]   // zoom anchor just above the crown: the close-up keeps the whole head
// stipple particles read from the reference itself: features and edges weigh more
const PART = (() => {
  const cv = document.createElement('canvas'); cv.width = 887; cv.height = 1092
  const g = cv.getContext('2d'); g.drawImage(pRed, 0, 0)
  const d = g.getImageData(0, 0, 887, 1092).data
  const lum = (x, y) => { const i = (y * 887 + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] }
  const isPerson = (x, y) => { const i = (y * 887 + x) * 4; return d[i + 3] > 128 && !(d[i] > 130 && d[i + 1] < 40 && d[i + 2] < 40) }
  const sil = document.createElement('canvas'); sil.width = 887; sil.height = 1092
  const sg = sil.getContext('2d'), si = sg.createImageData(887, 1092)
  for (let y = 2; y < 1090; y++) for (let x = 2; x < 885; x++) {
    if (!isPerson(x, y)) continue
    const o = (y * 887 + x) * 4, edge = !isPerson(x - 2, y) || !isPerson(x + 2, y) || !isPerson(x, y - 2) || !isPerson(x, y + 2)
    if (edge) { si.data[o] = 241; si.data[o + 1] = 212; si.data[o + 2] = 136; si.data[o + 3] = 255 } else { si.data[o] = 30; si.data[o + 1] = 4; si.data[o + 2] = 8; si.data[o + 3] = 236 }
  }
  sg.putImageData(si, 0, 0); Object.assign(sil.style, { position: 'absolute', inset: 0, width: '100%', height: '100%' }); silBox.appendChild(sil)
  const rnd = mulberry32(2026), out = []
  let guard = 0
  while (out.length < 11000 && guard < 1600000) {
    guard++
    const x = 2 + Math.floor(rnd() * 883), y = 2 + Math.floor(rnd() * 1088)
    if (!isPerson(x, y)) continue
    const L = lum(x, y), gx = lum(x + 2, y) - lum(x - 2, y), gy = lum(x, y + 2) - lum(x, y - 2)
    const edge = Math.min(1, Math.hypot(gx, gy) / 70), dark = Math.pow(1 - L / 255, 1.4)
    const w = 0.12 + 0.55 * dark + 0.9 * edge
    if (rnd() > w) continue
    out.push({ x: PIMG_X + x * PIMG_K, y: PIMG_Y + y * PIMG_K, w: Math.min(1, w), r1: rnd(), r2: rnd(), v: Math.floor(rnd() * vil.length) })
  }
  return out
})()
const maatram = el(screenL, 'abs', { left: 0, top: 0, width: '1920px', height: '1080px', pointerEvents: 'none' }, `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;overflow:visible"><defs><linearGradient id="mGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8E7A8"/><stop offset=".55" stop-color="#E2B94E"/><stop offset="1" stop-color="#B8922E"/></linearGradient></defs><text class="mtx" x="960" y="590" text-anchor="middle" font-family="Noto Sans Tamil" font-weight="700" font-size="236" fill="url(#mGold)" fill-opacity="0" stroke="#F1D488" stroke-width="3" stroke-dasharray="1400" stroke-dashoffset="1400">மாற்றம்</text></svg>`)
const mTx = maatram.querySelector('.mtx')
const toWord = el(screenL, 'abs', { left: 0, right: 0, top: '738px', width: '1920px', textAlign: 'center', fontSize: '112px', fontWeight: 800, letterSpacing: '8px', paddingLeft: '8px', boxSizing: 'border-box', color: '#F7F3E8' }, 'TO')
const ident = el(screenL, 'abs', { left: 0, top: 0, width: '1920px', height: '1080px', pointerEvents: 'none' }, `
  <img class="idSeal" src="${SEAL}" style="position:absolute;left:${960 - 70}px;top:256px;width:140px;height:auto">
  <div style="position:absolute;left:0;right:0;top:436px;text-align:center;overflow:hidden;padding-bottom:8px"><div class="idW" style="font-size:122px;font-weight:800;letter-spacing:-2px;color:#F7F3E8;white-space:nowrap">VETRI TAMIL NADU</div></div>
  <div style="position:absolute;left:0;right:0;top:622px;text-align:center;overflow:hidden"><div class="idS" style="font-size:48px;font-weight:700;letter-spacing:22px;color:#F1D488;white-space:nowrap;padding-left:22px">SUPER APP</div></div>
  <div style="position:absolute;left:0;right:0;top:704px;text-align:center;overflow:hidden;padding-bottom:10px"><div class="idT ta" style="font-size:60px;font-weight:700;color:#E8C66A;white-space:nowrap">வெற்றி தமிழ்நாடு சூப்பர் ஆப்</div></div>`)
const idSeal = ident.querySelector('.idSeal'), idW = ident.querySelector('.idW'), idS = ident.querySelector('.idS'), idT = ident.querySelector('.idT')
await document.fonts.load('700 236px "Noto Sans Tamil"', 'மாற்றம்')
const MB = (() => { const b = mTx.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height } })()

// ── kinetic type ─────────────────────────────────────────────────────────────
function headline(lines, { x = 136, y, size = 100, color = '#fff', ta = null, taColor = '#E8C66A', taSize = 44, rule = 'var(--sec)' }) {
  const box = el(typeL, 'kt', { left: px(x), top: px(y) })
  const r = el(box, 'rule', { top: '-26px', background: rule })
  const ws = []
  lines.forEach((ln) => { const l = el(box, 'ln en', { fontSize: px(size), color }); ln.split(' ').forEach((w, k) => { if (k) l.appendChild(document.createTextNode(' ')); ws.push(el(l, 'w', {}, w)) }) })
  if (ta) { const l = el(box, 'ln tam', { fontSize: px(taSize), color: taColor, marginTop: '10px' }); ta.split(' ').forEach((w, k) => { if (k) l.appendChild(document.createTextNode(' ')); ws.push(el(l, 'w', {}, w)) }) }
  return { box, rule: r, ws }
}
function playHead(hd, t, tin, tout, ruleOn = true, fade = false) {
  const on = t >= tin - 0.01 && t <= tout + 0.45
  show(hd.box, on)
  if (!on) return
  hd.box.style.opacity = fade ? 1 - seg(t, tout, tout + 0.22, E.inOut) : 1
  hd.rule.style.transform = `scaleX(${ruleOn ? seg(t, tin - 0.12, tin + 0.22, E.out) * (1 - seg(t, tout, tout + 0.3, E.in)) : 0})`
  hd.ws.forEach((w, i) => {
    const a = seg(t, tin + i * 0.045, tin + i * 0.045 + 0.5, E.outExpo)
    const b = fade ? 0 : seg(t, tout + i * 0.02, tout + i * 0.02 + 0.3, E.in)
    w.style.transform = `translateY(${(1 - a) * 112 - b * 112}%)`
  })
}
const scrim = el(typeL, 'abs', { left: 0, top: 0, width: '1920px', height: '1080px', background: 'linear-gradient(to top, rgba(247,247,250,.97) 0%, rgba(247,247,250,.9) 16%, rgba(247,247,250,0) 34%)', maskImage: 'linear-gradient(to right, #000 0%, #000 52%, transparent 78%)', webkitMaskImage: 'linear-gradient(to right, #000 0%, #000 52%, transparent 78%)' })
const DARK = '#1C1C1E', GDK = 'var(--secDk)'
const Q = {
  q1: headline([COPY.q1], { y: 856, size: 104 }),
  q2: headline([COPY.q2], { y: 856, size: 104, color: DARK, rule: GDK }),
  q3: headline([COPY.q3.join(' ')], { y: 880, size: 96, color: DARK, rule: GDK }),
  qA: headline([COPY.qA], { y: 880, size: 96, color: DARK, rule: GDK }),
  qB: headline([COPY.qB], { y: 880, size: 96, color: DARK, rule: GDK }),
  qC: headline([COPY.qC], { y: 880, size: 96, color: DARK, rule: GDK }),
  q4: headline(COPY.q4, { y: 768, size: 96, color: DARK, rule: GDK }),
  qD: headline([COPY.qD.join(' ')], { y: 880, size: 96, color: DARK, rule: GDK }),
  q5: headline(COPY.q5, { y: 750, size: 96 }),
  qE: headline([COPY.qE], { y: 880, size: 96, color: DARK, rule: GDK }),
}

// grain
const grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 256
{ const g = grainTile.getContext('2d'), im = g.createImageData(256, 256), r = mulberry32(99); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255 * 0.9; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 } g.putImageData(im, 0, 0) }

// ═════════════════════════════════════════════════════════════════════════════
// MEASURE (camera identity → client px = page px)
// ═════════════════════════════════════════════════════════════════════════════
const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } }
const ctr = (r) => [r.x + r.w / 2, r.y + r.h / 2]
const rbHR = rect(rbH)
const chipR = chips.map(rect), rbubR = rect(rbub), tileSize = tiles.map((t) => rect(t.el)), ububR = rect(ubub)
const catTargets = SVC5.slice(0, 4).map((s) => { const c = cardOf(s.id); return { x: c.x, y: c.y, w: CW, h: CH } })
const pages = [DL, RCd, BCd].map((R) => ({
  stepC: R.stepEls.map((s) => ctr(rect(s.querySelector('.c')))), refR: rect(R.refNum), refBoxR: rect(R.refBox), formR: rect(R.formP), titleR: rect(R.title),
  handR: R.handBtn ? rect(R.handBtn) : null,
}))
const dlListR = rect(dlList), rcListR = rect(rcList), dlTypeR = rect(dlTypeSel), rcTypeR = rect(rcTypeSel)
const resBtnR = rect(resBtn), resSlotR = rect(resSlot), pickerR = rect(picker), pickerItemR = pickerItems.map(rect)
const certR = rect(cert), certFrom = [SPX + 60, stageY(10) - 30]
const cfmR = rect(cfm)
const thaiR = { x: thai.x, y: thai.y, w: SCW, h: SCH_H }, detailR = rect(schDetail), howR = rect(howH1), howB = rect(howH1.querySelector('b')), trackerR = rect(tracker), daysR = rect(daysEl)
const RAIL_S = 1
const chipW = railChips.map((c) => c.offsetWidth)
const RAIL_HH = RAIL_HEAD + 5 * ROW_H, RS2 = 1.6, RAIL_C = [960 - RAIL_W * RS2 / 2, 540 - RAIL_HH * RS2 / 2]
const RAIL_B = 1.4, RAIL_HX = 1920 - 96 - RAIL_W * RAIL_B, RAIL_HY = (1080 - RAIL_HH * RAIL_B) / 2
// the register rail: only while a reference docks (in · land · hold · out), then once more at centre
const RAIL_WIN = [[T.dockA - 0.35, T.B - 0.1, 0.35], [T.restEnd - 0.1, T.D + 0.05, 0.35], [T.railD - 0.2, T.track + 0.15, 0.3]]
function railGeom(t) {
  let a = 0
  for (const [w0, w1, d] of RAIL_WIN) a = Math.max(a, seg(t, w0, w0 + 0.4, E.outExpo) * (1 - seg(t, w1 - d, w1, E.in)))
  const reg = t >= T.reg - 0.05, g = seg(t, T.reg, T.regEnd, E.inOutExpo), sc = lerp(RAIL_B, RS2, g)
  const x = reg ? lerp(RAIL_HX, RAIL_C[0], g) : RAIL_HX + (1 - a) * 820, y = reg ? lerp(RAIL_HY, RAIL_C[1], g) : RAIL_HY
  const op = reg ? seg(t, T.reg - 0.05, T.reg + 0.15) * (1 - seg(t, T.gather, T.gather + 0.25)) : 1
  return { a: reg ? 0 : a, x, y, sc, op, vis: reg ? t < T.gather + 0.26 : a > 0.001 }
}
const railR = { x: RAIL_X, y: RAIL_Y, w: RAIL_W, h: RAIL_HEAD + 4 * ROW_H }
const regR = rect(regp)
const dlListOptR = [...dlList.querySelectorAll('.op')].map(rect), rcListOptR = [...rcList.querySelectorAll('.op')].map(rect)
const dlNameR = rect(DL.title.firstElementChild)
const schTitleY = RS + 192

// thread route for the birth spine — from under the form (C has no acknowledgement card)
const ulY = pages[2].formR.y + pages[2].formR.h + 46
const ulX = pages[2].formR.x + 40
const spineRoute = [[ulX, ulY], [ulX + 200, ulY]]
{ const xr = SPX - 70; spineRoute.push([xr, ulY]); for (let k = 1; k <= 12; k++) { const a = (k / 12) * Math.PI / 2; spineRoute.push([xr + Math.sin(a) * 70, ulY + (1 - Math.cos(a)) * 70]) } spineRoute.push([SPX, stageY(0)]); spineRoute.push([SPX, stageY(11)]) }
const spineC = cumul(spineRoute), spineLen = spineC.at(-1)
const uAtY = (y) => clamp((spineC[spineC.length - 2] + (y - spineRoute[spineRoute.length - 2][1])) / spineLen)
const uUnderEnd = spineC[1] / spineLen

// ═════════════════════════════════════════════════════════════════════════════
// CAMERA PATH (page space) — keyframes; z interpolated in log space
// ═════════════════════════════════════════════════════════════════════════════
const bubFocus = [rbubR.x + rbubR.w / 2 + 40, rbubR.y + rbubR.h / 2 + 10]
const CATF = [960, 600]
const dlCard = cardOf('svc_dl')
const SPZ = 1.85
const spineCam = (y, z = SPZ) => [SPX - (760 - 960) / z, y + 30, z]
const ackCam = (i, z = 1.7) => { const r = pages[i].refBoxR; return [r.x + r.w * 0.47, r.y + r.h * 0.5, z] }
const lockC = [LKX + 3 * (LKW + LKG) + (2 * LKW + LKG) / 2, LKY + 40], LOCK_W = LKX + (5 * LKW + 4 * LKG) / 2
// punch-in helpers: frame a page rect so it sits at a chosen screen position at zoom z
const frameAt = (px_, py_, sx, sy, z) => [px_ - (sx - 960) / z, py_ - (sy - 540) / z, z]
const pA = pages[0], pB = pages[1], pC = pages[2]
const hlA = pA.handR, resR = resSlotR
const KEYS = [
  [0, 960, 540, 1], [T.rows[4] + 0.2, 960, 540, 1],
  // the ordered plan holds; the frame leans in on the whole plan
  [T.cat - 0.05, 960 / 1.07, 540 / 1.07, 1.07, E.inOut],
  [T.catEnd + 0.2, 960, 540, 1.0, E.inOutExpo], [T.q3Out + 0.05, 960, 608, 1.1, E.linear],
  [T.glow[0] - 0.05, 960, 599, 1.12, E.inOut], [T.glow[3] + 0.12, 952, 599, 1.12, E.linear],
  [T.glow[3] + 0.45, 484.5, 544, 1.55, E.inOut], [T.expand - 0.02, 484.5, 544, 1.57, E.linear],
  [T.expand, dlCard.x + CW / 2, dlCard.y + CH / 2, 2.0, E.inOut],
  [T.expand + 0.3, dlCard.x + CW / 2, dlCard.y + CH / 2, 2.1, E.linear, 'cut'],
  // A · Driving Licence — still frame for the need line, then punch in on each proof string
  [T.expand + 0.31, ...frameAt(136, RA + 232, 210, 219, 1.9), E.linear], [T.qAOut + 0.05, ...frameAt(136, RA + 232, 213, 221, 1.92), E.linear],
  [T.listA - 0.05, ...frameAt(dlListR.x + 235, dlTypeR.y + 150, 960, 480, 1.6), E.inOut], [T.pickA - 0.02, ...frameAt(dlListR.x + 235, dlTypeR.y + 150, 960, 480, 1.62), E.linear],
  [T.pickA + 0.35, ...frameAt(dlTypeR.x + 235, dlTypeR.y + 23, 960, 500, 2.2), E.inOut], [T.pickA + 0.78, ...frameAt(dlTypeR.x + 235, dlTypeR.y + 23, 960, 500, 2.24), E.linear],
  [T.prefillA + 0.15, ...frameAt(pA.formR.x + 500, pA.formR.y + 250, 960, 540, 1.75), E.inOut], [T.ackA - 0.3, ...frameAt(pA.formR.x + 500, pA.formR.y + 250, 960, 540, 1.78), E.linear],
  // the acknowledgement as ONE composition: reference, QR and the hand-off together, held
  [T.ackA - 0.02, ...frameAt(pA.formR.x + 500, pA.formR.y + 220, 960, 540, 1.6), E.inOut], [T.handA - 0.05, ...frameAt(pA.formR.x + 500, pA.formR.y + 220, 960, 540, 1.62), E.linear],
  [T.handA + 0.3, ...frameAt(pA.formR.x + 500, hlA.y - 14, 960, 600, 1.9), E.inOut], [T.dockA - 0.25, ...frameAt(pA.formR.x + 500, hlA.y - 14, 960, 600, 1.92), E.linear],
  // the register docks: the page steps back and left so nothing is covered
  [T.dockA + 0.1, ...frameAt(pA.formR.x + 500, pA.formR.y + 215, 700, 600, 1.38), E.inOut], [T.dockAEnd + 0.3, ...frameAt(pA.formR.x + 500, pA.formR.y + 215, 694, 598, 1.37), E.linear],
  // glide down to B
  // B opens on the page and its documents (no masthead), then locks still for the picker
  // B: the documents at 1.45 under the line, then ONE push to the picker; selection, attach and outcome all in that frame
  [T.B + 0.05, ...frameAt(636, RB + 300, 960, 400, 1.3), E.inOutExpo], [T.qBOut - 0.25, ...frameAt(636, RB + 300, 960, 396, 1.32), E.linear],
  [T.walletB - 0.15, ...frameAt(636, resR.y, 960, 560, 1.45), E.inOut],
  [T.walletB + 0.4, ...frameAt(resR.x + 480, resR.y + 100, 960, 520, 1.85), E.inOut], [T.dockB, ...frameAt(resR.x + 480, resR.y + 100, 960, 516, 1.88), E.linear],
  // glide down to C
  [T.C + 0.05, ...frameAt(136, RC + 232, 200, 190, 1.45), E.inOutExpo], [T.qCOut + 0.05, ...frameAt(136, RC + 232, 204, 190, 1.48), E.linear],
  [T.formC + 0.25, ...frameAt(pC.formR.x + 480, pC.formR.y + 170, 960, 520, 1.8), E.inOut], [T.chipC - 0.05, ...frameAt(pC.formR.x + 480, pC.formR.y + 180, 960, 520, 1.85), E.linear],
  [T.spine + 0.35, ...spineCam(stageY(1)), E.inOut], [T.approval, ...spineCam(stageY(6)), E.inOut],
  // the named officer, big and still: reference chip and Approval node to the left, caption below
  [T.officer + 0.5, ...frameAt(OFX + 155, stageY(6) - 18, 1380, 400, 2.2), E.inOut], [T.confirm - 0.05, ...frameAt(OFX + 155, stageY(6) - 18, 1377, 402, 2.26), E.linear],
  [T.confirm + 0.15, ...frameAt(OFX + 155, stageY(6) - 18, 1376, 403, 2.27), E.linear],
  [T.stages2[5] + 0.05, OFX + 155 - (1375 - 960) / 2.1, stageY(11) - 40, 2.1, E.inOut],
  [T.cert + 0.1, OFX + 155 - (1375 - 960) / 2.1, stageY(11) - 36, 2.1, E.linear], [T.seat + 0.02, LOCK_W, LKY + 40, 1.1, E.inOut],
  [T.seat + 0.35, LOCK_W + 3, LKY + 40, 1.11, E.linear], [T.seat + 0.75, certR.x + 110, LKY + 62, 2.0, E.inOut], [T.restEnd - 0.08, certR.x + 112, LKY + 62, 2.02, E.linear],
  [T.dockC + 0.2, ...frameAt(certR.x + LKW / 2, LKY + 60, 760, 540, 1.75), E.inOut], [T.page + 0.14, ...frameAt(certR.x + LKW / 2, LKY + 60, 754, 540, 1.77), E.linear],
  // the suggestion opens the Schemes page: title and left margin in frame
  // the page opens on the three best matches (title and 'ranked against … citizen profile' above)
  [T.page + 0.15, ...frameAt(136 + (3 * SCW + 32) / 2, RS + 300, 960, 250, 1.6), E.linear, 'cut'], [T.qDOut + 0.05, ...frameAt(136 + (3 * SCW + 32) / 2, RS + 300, 960, 247, 1.63), E.linear],
  [T.focusD + 0.35, ...frameAt(thaiR.x + thaiR.w / 2, thaiR.y + thaiR.h / 2, 960, 470, 2.0), E.inOut], [T.detail - 0.05, ...frameAt(thaiR.x + thaiR.w / 2, thaiR.y + thaiR.h / 2, 960, 472, 2.03), E.linear],
  [T.detail + 0.45, ...frameAt(SD_X + SD_W / 2, detailR.y + detailR.h / 2, 960, 540, 1.88), E.inOut], [T.railD, ...frameAt(SD_X + SD_W / 2, detailR.y + detailR.h / 2, 960, 540, 1.92), E.linear],
  [T.linkD + 0.3, ...frameAt(SD_X + SD_W / 2, detailR.y + detailR.h / 2, 730, 540, 1.55), E.inOut], [T.E + 0.04, ...frameAt(SD_X + SD_W / 2, detailR.y + detailR.h / 2, 730, 540, 1.5), E.linear],
  // E · Grievances: page + panel under the line; category and live routing; the description; the reference; the timeline
  [T.E + 0.05, ...frameAt(136, RG + 232, 190, 140, 1.15), E.linear, 'cut'], [T.qEOut - 0.2, ...frameAt(136, RG + 232, 193, 140, 1.17), E.linear],
  [T.catE - 0.08, ...frameAt(858, RG + 556, 960, 540, 1.36), E.inOut], [T.descE - 0.05, ...frameAt(858, RG + 556, 960, 540, 1.4), E.linear],   // cause and effect in one shot: the chip and its routing
  [T.descE + 0.3, ...frameAt(560, RG + 610, 960, 540, 2.0), E.inOut], [T.submitE + 0.25, ...frameAt(560, RG + 610, 960, 540, 2.03), E.linear],   // the description, read close; Submit is in frame
  [T.filedE + 0.45, ...frameAt(136 + 490, RG + 560, 960, 540, 1.75), E.inOut], [T.timeE - 0.1, ...frameAt(136 + 490, RG + 560, 960, 540, 1.77), E.linear],
  [T.timeE + 0.45, ...frameAt(136 + 1004 + 210, RG + 546, 960, 540, 1.85), E.inOut], [T.irisEnd, ...frameAt(136 + 1004 + 210, RG + 546, 960, 540, 1.9), E.linear],
]
function camKeys(t) {
  if (t <= KEYS[0][0]) return { cx: KEYS[0][1], cy: KEYS[0][2], z: KEYS[0][3] }
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, x1, y1, z1, e, cut] = KEYS[i]
    if (t <= t1) {
      const [t0, x0, y0, z0] = KEYS[i - 1]
      const p = (e || E.inOut)(clamp((t - t0) / (t1 - t0 || 1)))
      return { cx: lerp(x0, x1, p), cy: lerp(y0, y1, p), z: logLerp(z0, z1, p) }
    }
  }
  const k = KEYS[KEYS.length - 1]
  return { cx: k[1], cy: k[2], z: k[3] }
}

// ═════════════════════════════════════════════════════════════════════════════
// RENDER HELPERS
// ═════════════════════════════════════════════════════════════════════════════
function clearCtx(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W * DPR, H * DPR) }
const thrTx = tx
function drawThread(pts, { width = 4, alpha = 1, tip = true, screen = false } = {}) {
  if (pts.length < 2) return
  const S = screen ? (p) => p : P2S, tx = screen ? sx2 : thrTx
  tx.setTransform(DPR, 0, 0, DPR, 0, 0); tx.lineCap = 'round'; tx.lineJoin = 'round'
  tx.beginPath(); pts.forEach((p, i) => { const s = S(p); if (i) tx.lineTo(s[0], s[1]); else tx.moveTo(s[0], s[1]) })
  tx.globalAlpha = alpha; tx.strokeStyle = '#C99A35'; tx.lineWidth = width; tx.stroke()
  tx.strokeStyle = '#F1D488'; tx.lineWidth = Math.max(1, width * 0.34); tx.stroke()
  if (tip) { const e = S(pts[pts.length - 1]); const g = tx.createRadialGradient(e[0], e[1], 0, e[0], e[1], 18); g.addColorStop(0, 'rgba(255,246,214,1)'); g.addColorStop(0.25, 'rgba(255,232,160,.75)'); g.addColorStop(1, 'rgba(255,220,120,0)'); tx.fillStyle = g; tx.beginPath(); tx.arc(e[0], e[1], 18, 0, Math.PI * 2); tx.fill() }
  tx.globalAlpha = 1
}
function spark(sp, r = 26) {
  tx.setTransform(DPR, 0, 0, DPR, 0, 0)
  const g = tx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r)
  g.addColorStop(0, 'rgba(255,255,236,1)'); g.addColorStop(0.18, 'rgba(255,214,64,.95)'); g.addColorStop(1, 'rgba(255,204,0,0)')
  tx.fillStyle = g; tx.beginPath(); tx.arc(sp[0], sp[1], r, 0, Math.PI * 2); tx.fill()
}
function catmull(points, n = 240) {
  const out = [], P = [points[0], ...points, points[points.length - 1]]
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], steps = Math.ceil(n / (points.length - 1))
    for (let k = 0; k < steps; k++) { const t = k / steps, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))) }
  }
  out.push(points[points.length - 1]); return out
}
const rise = (e, t, t0, d = 0.45) => { const a = seg(t, t0, t0 + d, E.outExpo); e.style.clipPath = `inset(0 0 ${(1 - a) * 100}% 0)`; e.style.transform = `translateY(${(1 - a) * 14}px)` }
function drawQR(R, t, t0, t1) {
  const g = R.qrCv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, R.qrCv.width, R.qrCv.height)
  const n = Math.floor(R.qr.mods.length * seg(t, t0, t1, E.inOut)); g.fillStyle = '#111'
  for (let i = 0; i < n; i++) g.fillRect(R.qr.mods[i][0] * 8, R.qr.mods[i][1] * 8, 8, 8)
}
function steps(R, t, doneTimes, preDone) {
  R.stepEls.forEach((s, i) => {
    const dt = i < preDone ? -1 : doneTimes[i - preDone]
    const d = dt !== undefined && t >= dt, prevDone = i === 0 || (i - 1 < preDone) || (doneTimes[i - 1 - preDone] !== undefined && t >= doneTimes[i - 1 - preDone])
    const act = !d && prevDone
    const c = s.querySelector('.c'), pop = d && dt > 0 ? seg(t, dt, dt + 0.22, E.appPop) : 1
    const html = d ? icon('check', 14, '#fff', 3) : String(i + 1)
    if (c.dataset.h !== html) { c.innerHTML = html; c.dataset.h = html }
    Object.assign(c.style, { background: d ? '#059669' : act ? '#9B1B30' : '#fff', borderColor: d ? '#059669' : act ? '#9B1B30' : '#E5E7EB', color: act ? '#fff' : '#9CA3AF', transform: `scale(${pop})` })
    s.style.color = d ? '#1C1C1E' : act ? '#9B1B30' : '#9CA3AF'; s.style.fontWeight = act ? 700 : d ? 600 : 500; s.style.background = act ? '#9B1B300D' : 'transparent'
  })
}
function listbox(box, hl, optR, t, tOpen, tPick, idx, boxR) {
  const open = seg(t, tOpen, tOpen + 0.22, E.outExpo) * (1 - seg(t, tPick + 0.18, tPick + 0.36, E.in))
  show(box, open > 0.001)
  box.style.transform = 'none'; box.style.opacity = 1; box.style.clipPath = `inset(0 0 ${(1 - open) * 100}% 0 round 12px)`
  const hp = seg(t, tOpen + 0.18, tPick - 0.05, E.inOut)
  const y = lerp(optR[0].y, optR[idx].y, hp) - boxR.y
  Object.assign(hl.style, { top: px(y), height: px(optR[0].h) })
  hl.style.background = t >= tPick ? '#9B1B3024' : '#9B1B3012'
}

// ═════════════════════════════════════════════════════════════════════════════
// MAP WORLD
// ═════════════════════════════════════════════════════════════════════════════
const platePush = (t) => 1 + 0.15 * seg(t, T.rolls[0] - 0.25, T.q5Out, E.inOut)
function mapCam(t) {
  const start = camAt([1060, 410], 2.3)
  if (t < T.hold) { const p = seg(t, 0, T.pullEnd, E.inOut); const s = logLerp(start.s, FULL.s, p); return camAt([lerp(1060, toScreen(FULL, M)[0], p), lerp(410, toScreen(FULL, M)[1], p)], s) }
  if (t < T.dive) { // NEW: the lit state breathes — a slow push toward the north
    const p = seg(t, T.hold, T.holdEnd, E.inOut)
    return { s: logLerp(FULL.s, HOLD_END.s, p), c: [lerp(FULL.c[0], HOLD_END.c[0], p), lerp(FULL.c[1], HOLD_END.c[1], p)] }
  }
  if (t < T.gather) { const p = seg(t, T.dive, T.diveEnd, E.inOutExpo); const s = logLerp(HOLD_END.s, 30, p) * (1 + 0.05 * seg(t, T.diveEnd, T.snap)); return camAt([lerp(mHoldEnd[0], 930, p), lerp(mHoldEnd[1], 452, p)], s) }
  if (t < T.irisEnd) return camAt(IRIS_P, logLerp(118, 30, seg(t, T.iris, T.irisEnd, E.inOutExpo)))
  if (t < T.lineOut) { const p = seg(t, T.irisEnd, T.plate + 0.3, E.inOut); return camAt([lerp(IRIS_P[0], PLATE_M[0], p), lerp(IRIS_P[1], PLATE_M[1], p)], logLerp(30, 26, p) * platePush(t)) }
  return scaleCam(t)
}
const STOP_SP = [860, 720]
const camFor = (g, sp, s) => ({ s, c: [g[0] - (sp[0] - 960) / s, g[1] - (sp[1] - 540) / s] })
function camMix(a, b, p) {   // zoom-pan: the centre moves evenly in visible-extent space
  const s = logLerp(a.s, b.s, p)
  const w = Math.abs(Math.log(a.s / b.s)) < 0.3 ? p : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s)
  return { s, c: [lerp(a.c[0], b.c[0], w), lerp(a.c[1], b.c[1], w)] }
}
const zoomAbout = (cam, F, zf) => { const s = cam.s * zf, g = [(F[0] - 960) / cam.s + cam.c[0], (F[1] - 540) / cam.s + cam.c[1]]; return { s, c: [g[0] - (F[0] - 960) / s, g[1] - (F[1] - 540) / s] } }
function portraitZoom(t) {
  if (t < T.redEnd - 0.3) return 1
  if (t < T.formClose) return logLerp(1, 2.3, seg(t, T.redEnd - 0.3, T.formClose, E.inOut))
  if (t < T.reveal) return 2.3 * (1 + 0.06 * seg(t, T.formClose, T.reveal))
  if (t < T.revealEnd) return logLerp(2.3 * 1.06, 1, seg(t, T.reveal, T.revealEnd, E.inOutExpo))
  return 1 + 0.02 * seg(t, T.revealEnd, T.portraitHold)
}
const portraitShift = (t) => -200 * seg(t, T.lineBack + 0.2, T.clearEnd, E.inOut)   // it steps aside for the line
const P234 = { s: P_CAM.s, c: [P_CAM.c[0] - 130 / P_CAM.s, P_CAM.c[1]] }   // the state sits right of the 234 block
function scaleCam(t) {
  const A0 = camAt(PLATE_M, 26 * platePush(T.lineOut))
  const cams = STOPS.map((st) => camFor(st.c, STOP_SP, 23))
  const drift = (i, a, b) => ({ s: cams[i].s * (1 + 0.045 * seg(t, a, b)), c: cams[i].c })
  const dEnd = (i) => ({ s: cams[i].s * 1.045, c: cams[i].c })
  if (t < T.viru) return camMix(A0, cams[0], seg(t, T.lineOut + 0.1, T.viru, E.inOut))
  if (t < T.viruHold) return drift(0, T.viru, T.viruHold)
  if (t < T.villi) return camMix(dEnd(0), cams[1], seg(t, T.viruHold, T.villi, E.inOut))
  if (t < T.villiHold) return drift(1, T.villi, T.villiHold)
  if (t < T.tnagar) return camMix(dEnd(1), cams[2], seg(t, T.villiHold, T.tnagar, E.inOut))
  if (t < T.pull) return drift(2, T.tnagar, T.pull)
  if (t < T.scaleEnd) return camMix(dEnd(2), P234, seg(t, T.pull, T.scaleEnd, E.inOut))
  const base = camMix(P234, P_CAM, seg(t, T.red, T.red + 0.9, E.inOut))
  const cm = zoomAbout(base, FACE_F, portraitZoom(t)), dx = portraitShift(t)
  return { s: cm.s, c: [cm.c[0] - dx / cm.s, cm.c[1]] }
}
function drawTile(x, y, w, hh, a) {   // a constituency dashboard, at a distance
  sx2.globalAlpha = a
  sx2.fillStyle = '#FFFFFF'; sx2.beginPath(); sx2.roundRect(x, y, w, hh, Math.min(9, w * 0.09)); sx2.fill()
  sx2.save(); sx2.clip(); sx2.fillStyle = '#7A1526'; sx2.fillRect(x, y, w, hh * 0.27); sx2.restore()
  const cols = ['#1C1C1E', '#059669', '#D97706'], bh = [0.55, 0.8, 0.42], bw = w * 0.2
  cols.forEach((c, i) => { const bx = x + w * 0.12 + i * (bw + w * 0.07), h2 = hh * 0.5 * bh[i]; sx2.fillStyle = c; sx2.fillRect(bx, y + hh * 0.86 - h2, bw, h2) })
  sx2.globalAlpha = 1
}
function drawMap(t) {
  clearCtx(mx); mx.fillStyle = '#0B0607'; mx.fillRect(0, 0, W * DPR, H * DPR)
  mapC.style.opacity = t >= T.clearEnd ? 0 : 1
  if (t > T.mastEnd + 0.05 && t < T.gather) return null
  const cam = mapCam(t), s = cam.s
  const ce = toScreen(cam, [368, 500])
  const g0 = mx.createRadialGradient(ce[0] * DPR, ce[1] * DPR, 0, ce[0] * DPR, ce[1] * DPR, 900 * DPR)
  g0.addColorStop(0, 'rgba(78,18,32,.55)'); g0.addColorStop(1, 'rgba(78,18,32,0)'); mx.fillStyle = g0; mx.fillRect(0, 0, W * DPR, H * DPR)
  if (t >= T.red) {   // red + gold: the constituencies fill in a wave out of Chennai, then the state is one red field
    mx.setTransform(s * DPR, 0, 0, s * DPR, (960 - cam.c[0] * s) * DPR, (540 - cam.c[1] * s) * DPR)
    const g = seg(t, T.goldWipe, T.goldWipeEnd, E.inOut), R = Math.round(lerp(159, 255, g)), G = Math.round(lerp(0, 204, g))
    for (const a of acs) { const k = seg(t, T.red + a.rd * 1.5, T.red + a.rd * 1.5 + 0.6, E.inOut); if (k <= 0) continue; mx.fillStyle = `rgba(${R},${G},0,${k})`; mx.fill(a.p) }
    const solid = seg(t, T.red + 1.6, T.redEnd); if (solid > 0) { mx.fillStyle = `rgba(${R},${G},0,${solid})`; mx.fill(statePath) }
    mx.setTransform(1, 0, 0, 1, 0, 0)
  }
  const deep = seg(s, 3, 20)
  if (t >= T.gather && t < T.irisEnd + 0.3) mx.globalAlpha = 1
  const ringR = t > T.ring ? lerp(0, 1050, seg(t, T.ring, T.ringEnd, E.outSoft)) : -1
  const holdTw = t > T.igniteEnd && t < T.dive ? seg(t, T.igniteEnd, T.hold + 0.5) : 0
  const pullDim = t >= T.pull && t < T.red + 0.4 ? 1 - 0.62 * seg(t, T.pull + 0.6, T.scaleEnd, E.inOut) * (1 - seg(t, T.scaleHold - 0.4, T.red + 0.4)) : 1   // the field steps back; the constituency nodes carry the count
  const baseA = (t < T.iris ? lerp(0.4, 0.46, deep) + 0.06 * holdTw : lerp(0.46, 0.52, seg(t, T.pull, T.scaleEnd)) * pullDim) * (1 - 0.85 * seg(t, T.red + 0.2, T.redEnd - 0.4)) * (1 - 0.8 * seg(t, T.form, T.reveal + 0.5))
  mx.globalCompositeOperation = 'lighter'
  const dot = clamp(1.7 + 2.0 * deep, 1.7, 3.7)
  for (let i = 0; i < VX.length; i++) {
    if (VT[i] > t) break
    const sx = (VX[i] - cam.c[0]) * s + 960, sy = (VY[i] - cam.c[1]) * s + 540
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue
    const fl = Math.exp(-(t - VT[i]) / 0.11)
    let a = baseA * (0.7 + 0.6 * hashV[i]) + 0.62 * fl
    if (holdTw > 0) a *= 1 + 0.22 * holdTw * noise1(t * 1.6 + i * 0.37)
    let fl2 = 0
    if (t >= T.ring) { const t2 = T.ring + (T.ringEnd - T.ring) * invWave(clamp(VD[i] / IGN_R)); if (t >= t2) fl2 = Math.exp(-(t - t2) / 0.16); a += 0.42 * fl2 * pullDim }
    const sz = Math.min(dot * (1 + 0.9 * Math.max(fl, fl2)) * 3.0, t >= T.fold ? 6 : 99)
    mx.globalAlpha = clamp(a, 0, 1)
    mx.drawImage(Math.max(fl, fl2) > 0.35 ? SP_FLASH : SP_SETTLE, (sx - sz / 2) * DPR, (sy - sz / 2) * DPR, sz * DPR, sz * DPR)
  }
  mx.globalAlpha = 1; mx.globalCompositeOperation = 'source-over'
  mx.setTransform(s * DPR, 0, 0, s * DPR, (960 - cam.c[0] * s) * DPR, (540 - cam.c[1] * s) * DPR)
  const dA = t < T.iris ? 1 - seg(s, 5, 10) : 0
  if (dA > 0.01) {
    // NEW (hold): the 234 constituencies breathe in under the districts
    const cAlpha = t < T.iris ? (t < T.dive ? 1 : 1 - seg(t, T.dive, T.dive + 0.3)) : 0.35
    if (cAlpha > 0.01) {
      mx.lineWidth = 0.6 / s
      for (const a of acs) { const st = T.constit + (a.y / 1000) * 1.3; const p = t < T.iris ? seg(t, st, st + 0.55, E.out) : 1; if (p <= 0) continue; const band = t < T.iris ? Math.exp(-Math.pow((t - st - 0.3) / 0.35, 2)) : 0; mx.strokeStyle = `rgba(${Math.round(200 + 40 * band)},${Math.round(160 + 50 * band)},${Math.round(62 + 60 * band)},${Math.min(1, 0.6 * (1 + 0.55 * band)) * cAlpha * dA})`; mx.setLineDash([a.len * p, a.len]); mx.stroke(a.p) }
      mx.setLineDash([])
    }
    mx.lineWidth = 1.05 / s
    for (const d of districts) { const st = T.districts + (d.dist / maxDistrictDist) * 0.75; const p = t < T.iris ? seg(t, st, st + 0.45, E.out) : 1; if (p <= 0) continue; mx.strokeStyle = `rgba(232,198,106,${0.34 * dA})`; mx.setLineDash([d.len * p, d.len]); mx.stroke(d.p) }
    mx.setLineDash([])
    mx.lineWidth = 1.4 / s; mx.strokeStyle = `rgba(232,198,106,${0.5 * dA * seg(t, T.districts, T.districtsEnd)})`; mx.stroke(statePath)
  }
  const cA = seg(s, 6, 14)
  if (cA > 0.01) {
    mx.lineWidth = 1 / s
    for (const c of chennaiPaths) { if (c.no === 25) continue; mx.strokeStyle = `rgba(232,198,106,${0.26 * cA})`; mx.stroke(c.p) }
    const mp = t < T.iris ? seg(t, T.dive + 0.25, T.diveEnd + 0.15, E.out) : 1
    mx.fillStyle = `rgba(155,27,48,${0.32 * cA * mp})`; mx.fill(mylPath)
    mx.strokeStyle = `rgba(241,212,136,${0.95 * cA})`; mx.lineWidth = 2 / s
    const L = cumul(mylRing).at(-1); mx.setLineDash([L * mp, L]); mx.stroke(mylPath); mx.setLineDash([])
  }
  if (t >= T.lineOut) {   // ACT V · the connected state
    const fadeNet = 1 - seg(t, T.form, T.reveal + 0.4)
    STOPS.forEach((st, k) => { const ta = [T.viru, T.villi, T.tnagar][k], nx = [T.villi, T.tnagar, 1e9][k]; const a = seg(t, ta - 0.05, ta + 0.3, E.out) * (1 - seg(t, T.pull + 1.2, T.scaleEnd)); if (a <= 0) return; mx.fillStyle = `rgba(155,27,48,${0.34 * a * (1 - 0.6 * seg(t, nx, nx + 0.3))})`; mx.fill(st.p); mx.strokeStyle = `rgba(241,212,136,${0.95 * a})`; mx.lineWidth = 2 / s; mx.stroke(st.p) })
    if (t >= T.pull) {
      mx.lineWidth = 0.8 / s
      for (const a of acs) { const k = seg(t, a.act, a.act + 0.4); if (k <= 0) continue; const fl = Math.exp(-Math.max(0, t - a.act) / 0.25); mx.strokeStyle = `rgba(${Math.round(232 + 23 * fl)},${Math.round(198 + 40 * fl)},${Math.round(106 + 80 * fl)},${(0.42 + 0.5 * fl) * k * fadeNet})`; mx.stroke(a.p) }
      mx.lineWidth = 1.1 / s
      mx.lineWidth = 1.7 / s
      for (const n of NET) { const k = seg(t, n.t, n.t + 0.5, E.inOut); if (k <= 0) continue; mx.strokeStyle = `rgba(241,212,136,${0.62 * fadeNet * (1 - 0.5 * seg(t, T.count234End, T.scaleHold)) * (1 - seg(t, T.red + 0.6, T.redEnd))})`; mx.setLineDash([n.len * k, n.len]); mx.stroke(n.p) }
      mx.setLineDash([])
    }
    if (t >= T.red) { mx.lineWidth = 0.7 / s; const ge = 0.55 * seg(t, T.red + 0.3, T.red + 1.2) * (1 - seg(t, T.redEnd - 0.6, T.formClose)) * fadeNet; if (ge > 0) for (const a of acs) { mx.strokeStyle = `rgba(241,212,136,${0.55 * ge})`; mx.stroke(a.p) } }
  }
  const mS = toScreen(cam, M)
  let pa = 0
  if (t < T.bubble + 0.2) pa = 1 - seg(t, T.bubble, T.bubble + 0.18)
  if (t >= T.iris) pa = seg(t, T.iris, T.iris + 0.12) * (1 + 0.9 * Math.exp(-Math.pow((t - (T.lineOut + 0.1)) / 0.16, 2))) * (1 - seg(t, T.red + 0.5, T.redEnd))
  if (pa > 0) {
    mx.setTransform(DPR, 0, 0, DPR, 0, 0)
    const r = 5.5 * (1 + 0.18 * Math.sin(Math.min(t, 0.6) / 0.6 * Math.PI))
    const g = mx.createRadialGradient(mS[0], mS[1], 0, mS[0], mS[1], r * 5)
    g.addColorStop(0, `rgba(255,240,200,${pa})`); g.addColorStop(0.2, `rgba(232,198,106,${0.8 * pa})`); g.addColorStop(1, 'rgba(212,168,67,0)')
    mx.fillStyle = g; mx.beginPath(); mx.arc(mS[0], mS[1], r * 5, 0, Math.PI * 2); mx.fill()
    mx.fillStyle = `rgba(255,248,226,${pa})`; mx.beginPath(); mx.arc(mS[0], mS[1], r * 0.55, 0, Math.PI * 2); mx.fill()
  }
  if (false && ringR > 0) { mx.setTransform(DPR, 0, 0, DPR, 0, 0); mx.strokeStyle = `rgba(241,212,136,${(1 - seg(t, T.ring + 0.8, T.ringEnd)) * 0.55})`; mx.lineWidth = 1.5; mx.beginPath(); mx.arc(mS[0], mS[1], ringR * cam.s, 0, Math.PI * 2); mx.stroke() }
  return { cam, mS }
}

// ═════════════════════════════════════════════════════════════════════════════
// SEEK
// ═════════════════════════════════════════════════════════════════════════════
let irisRing = -1
window.seek = async (t) => {
  const frame = Math.round(t * 60)
  const mapInfo = drawMap(t)
  { // UI camera (+ shrink into the iris point)
    let c = camKeys(t)
    if (t >= T.iris) {
      const f = 1 - 0.12 * seg(t, T.iris, T.irisEnd, E.in)   // a slight pull toward the point while the iris opens
      const Q0 = [(IRIS_P[0] - 960) / c.z + c.cx, (IRIS_P[1] - 540) / c.z + c.cy], z = c.z * f
      c = { z, cx: Q0[0] - (IRIS_P[0] - 960) / z, cy: Q0[1] - (IRIS_P[1] - 540) / z }
    }
    setUI(c)
  }
  clearCtx(tx); clearCtx(sx2)
  let dimK = 0, blurK = 0
  show(back, t >= T.snap - 0.02 && t < T.irisEnd)
  show(front, t < T.irisEnd)
  ground.style.opacity = 1
  const inChapterBlur = (t > T.spine + 0.15 && t < T.cert + 0.2)
  back.style.filter = inChapterBlur ? `blur(${(2.4 * seg(t, T.spine + 0.15, T.spine + 0.6, E.inOut) * (1 - seg(t, T.cert - 0.1, T.cert + 0.2))).toFixed(2)}px)` : 'none'

  // ── ACT I · bar-2 elements (identical choreography to v1, retimed) ──
  const camB2 = mapInfo && t < T.snap ? mapInfo.cam : null
  if (camB2 && t > T.dive + 0.3) {
    const ms = toScreen(camB2, M); show(mapLabel, true)
    const a = seg(t, T.dive + 0.35, T.dive + 0.6, E.out) * (1 - seg(t, T.wrong, T.wrong + 0.3))
    Object.assign(mapLabel.style, { left: px(ms[0] + 104), top: px(ms[1] + 96), opacity: a, transform: `translateY(${(1 - a) * 8}px)` })
  } else show(mapLabel, false)
  { // the question bubble
    const ms = camB2 ? toScreen(camB2, M) : [930, 452]
    const pB = seg(t, T.bubble, T.bubble + 0.42, E.appPop), BIG = 2.1, bw = ububR.w, bh = ububR.h
    let x = ms[0] - bw * 0.5, y = ms[1] - bh - 16, sc = pB * BIG
    const wait = [SPINE_X - 40 - bw * 1.5, 196 + bh * 0.5]
    if (t >= T.snap) { const fl = seg(t, T.snap, T.snap + 0.55, E.outExpo); x = lerp(x, wait[0], fl); y = lerp(y, wait[1], fl); sc = lerp(BIG, 1.5, fl) }
    const out = seg(t, T.rows[4] + 0.35, T.rows[4] + 0.6)
    show(ubub, t >= T.bubble && t < T.rows[4] + 0.62)
    Object.assign(ubub.style, { left: px(x), top: px(y), opacity: 1 - out, transform: `scale(${Math.max(0.001, sc)})`, transformOrigin: '50% 100%', borderRadius: `${lerp(24, 14, pB)}px ${lerp(24, 14, pB)}px 4px ${lerp(24, 14, pB)}px` })
  }
  const knotK = seg(t, T.knot, T.snap, E.in), C = [930, 520]
  const tilePos = tiles.map((tl, i) => {
    const pop = seg(t, T.tiles[i], T.tiles[i] + 0.38, E.appPop)
    let [x, y] = SCAT[i]
    x += noise1(t * 2.1 + i * 9) * 6 * (0.4 + 2.2 * knotK); y += noise1(t * 1.7 + i * 5 + 40) * 6 * (0.4 + 2.2 * knotK)
    x = lerp(x, C[0] - tileSize[i].w / 2 + (SCAT[i][0] - C[0]) * 0.45, knotK * 0.68); y = lerp(y, C[1] - tileSize[i].h / 2 + (SCAT[i][1] - C[1]) * 0.45, knotK * 0.68)
    let rot = (1 - pop) * (i % 2 ? 6 : -6) + noise1(t * 3 + i) * 2.2 * knotK
    const fl = seg(t, T.snap, T.snap + 0.34, E.outExpo), ang = Math.atan2(SCAT[i][1] + tileSize[i].h / 2 - C[1], SCAT[i][0] + tileSize[i].w / 2 - C[0])
    x += Math.cos(ang) * 1500 * fl; y += Math.sin(ang) * 1100 * fl
    const r = seg(t, T.rows[i] - 0.28, T.rows[i] + 0.12, E.outExpo), R = [ROWS_X, ROWS_Y + i * ROW_DY]
    return { x: lerp(x, R[0], r), y: lerp(y, R[1], r), sc: pop, rot: lerp(rot, 0, r), r }
  })
  tiles.forEach((tl, i) => {
    const p = tilePos[i], vis = t >= T.tiles[i] && t < T.catEnd + i * 0.05 + 0.02
    show(tl.el, vis); if (!vis) return
    tl.no.style.transform = `scale(${seg(t, T.rows[i] + 0.02, T.rows[i] + 0.3, E.appPop)})`
    tl.meta.style.display = 'block'; tl.meta.style.opacity = seg(t, T.rows[i], T.rows[i] + 0.25)
    const f = i < 4 ? seg(t, T.cat + i * 0.05, T.catEnd + i * 0.05, E.inOutExpo) : 0
    let x = p.x, y = p.y, w = tileSize[i].w, hh = tileSize[i].h, rad = 18
    if (f > 0) { const tg = catTargets[i]; x = lerp(x, tg.x, f); y = lerp(y, tg.y, f); w = lerp(w, tg.w, f); hh = lerp(hh, tg.h, f); rad = lerp(18, 14, f) }
    const k = Math.max(p.r, f), rs = lerp(lerp(1, RSC, p.r), 1, f)
    Object.assign(tl.el.style, { left: px(x), top: px(y), width: f > 0 ? px(w) : '', height: f > 0 ? px(hh) : '', borderRadius: px(rad), transformOrigin: p.r > 0 ? '0 50%' : '50% 50%', transform: `rotate(${p.rot}deg) scale(${Math.max(0.001, p.sc * rs)})`, boxShadow: `0 ${lerp(18, 2, k)}px ${lerp(44, 6, k)}px rgba(30,4,10,${lerp(0.34, 0.06, k)})`, overflow: f > 0 ? 'hidden' : 'visible', opacity: i === 4 ? 1 - seg(t, T.cat - 0.15, T.cat + 0.15) : 1 - seg(f, 0.82, 1) })
    tl.tx.style.opacity = tl.ic.style.opacity = 1 - seg(f, 0.6, 0.9); tl.no.style.opacity = 1 - seg(f, 0, 0.3)
  })
  depts.forEach((d, i) => { const a = seg(t, 5.9 + i * 0.12, 6.3 + i * 0.12, E.out) * (1 - seg(t, T.snap, T.snap + 0.12)); show(d, a > 0.001); d.style.opacity = a; d.style.transform = `translate(${noise1(t * 0.9 + i * 3) * 10}px, ${(1 - a) * 10 + noise1(t * 0.8 + i * 7) * 6}px)` })
  if (t >= T.wrong && t < T.mastEnd) {
    const ub = rect(ubub), B = [ub.x + ub.w - 4, ub.y + ub.h - 2]
    const cen = (i) => [tilePos[i].x + tileSize[i].w / 2, tilePos[i].y + tileSize[i].h / 2]
    const route = catmull([B, cen(4), cen(3), cen(2), cen(0), cen(1), [cen(1)[0] + 140, cen(1)[1] + 160]], 360)
    let pts = slice(route, 0, Math.max(0.002, seg(t, T.wrong, T.wrongEnd, E.inOut)))
    if (knotK > 0) pts = resample(pts, 360).map((p, k) => { const a = k / 360 * Math.PI * 14 + t * 3, rr = (60 + 30 * Math.sin(k * 0.21)) * (1 - 0.38 * knotK); return [lerp(p[0], C[0] + Math.cos(a) * rr * 1.5, knotK * 0.82), lerp(p[1], C[1] + Math.sin(a) * rr * 0.8, knotK * 0.82)] })
    if (t >= T.snap) { const sp = seg(t, T.snap, T.snap + 0.2, E.outExpo); pts = mix(resample(pts, 400), Array.from({ length: 400 }, (_, k) => [lerp(-60, W + 60, k / 399), 115.5]), sp) }
    drawThread(pts, { width: 4, tip: t < T.snap + 0.1, alpha: 1 - seg(t, T.snap + 0.24, T.snap + 0.4) })
  }
  { // masthead + ground wipes from the rule
    const pBar = seg(t, T.snap + 0.03, T.snap + 0.26, E.out), pStrip = seg(t, T.snap + 0.14, T.snap + 0.34, E.out), pDown = seg(t, T.snap, T.mastEnd, E.inOut)
    mastA.bar.style.clipPath = `inset(${(1 - pBar) * 100}% 0 0 0)`; mastA.strip.style.clipPath = `inset(${(1 - pStrip) * 100}% 0 0 0)`
    mastA.nav.style.clipPath = `inset(0 0 ${(1 - seg(pDown, 0, 0.25)) * 100}% 0)`; ground.style.clipPath = t < T.mastEnd + 0.1 ? `inset(0 0 ${(1 - pDown) * 100}% 0)` : 'none'
    show(mastA.m, t >= T.snap)
  }
  { // hero Tamil, spine, ordered rows (they hold, then become catalogue cards)
    const heroOn = t >= T.hero && t < T.flip + 0.4; show(hero, heroOn)
    if (heroOn) heroWords.forEach((w, i) => { const a = seg(t, T.hero + i * 0.075, T.hero + i * 0.075 + 0.55, E.outExpo), b = seg(t, T.flip - 0.08 + i * 0.03, T.flip + 0.2 + i * 0.03, E.inExpo); w.style.transform = `translateY(${(1 - a) * 115 - b * 115}%)` })
    if (t >= T.hero && t < T.flipEnd) {
      const down = seg(t, T.hero + 0.1, T.rows[4] + 0.05, E.inOut), up = seg(t, T.flip, T.flip + 0.25, E.in)
      const y1 = lerp(117, ROWS_Y + 4 * ROW_DY + tileSize[4].h / 2, down), y0 = lerp(117, y1, up)
      drawThread([[SPINE_X, y0], [SPINE_X, Math.max(y0 + 0.5, y1)]], { width: 4, tip: down < 0.999 && up === 0 })
      tiles.forEach((tl, i) => { const r = seg(t, T.rows[i] + 0.05, T.rows[i] + 0.22, E.out) * (1 - up); if (r <= 0) return; const yy = ROWS_Y + i * ROW_DY + tileSize[i].h / 2; drawThread([[SPINE_X, yy], [SPINE_X + (ROWS_X - 60 * RSC - 4 - SPINE_X) * r, yy]], { width: 3, tip: false }) })
    }
    show(askPage, false); show(rbub, false)
  }

  // ── ACT II · catalogue ──
  {
    const on = t >= T.cat - 0.15 && t < T.expandEnd + 0.1
    show(catPage, on)
    const tabOn = seg(t, T.cat + 0.05, T.cat + 0.35, E.out)
    const tS = mastA.tabs.Services; tS.classList.toggle('on', tabOn > 0.5)
    rise(catTitle, t, T.cat - 0.12, 0.45); rise(catChips, t, T.cat, 0.45)
    chipCounts.forEach((c, i) => { const n = +c.dataset.n; c.textContent = String(Math.round(n * seg(t, T.counts + i * 0.06, T.counts + i * 0.06 + 0.45, E.out))) })
    { const pu = Math.sin(Math.PI * seg(t, T.counts, T.counts + 0.8)); catChips.firstElementChild.style.transform = `scale(${1 + 0.35 * pu})`; catChips.firstElementChild.style.transformOrigin = '0 50%' }
    const fiveIds = SVC5.slice(0, 4).map((s) => s.id)
    catCards.forEach((c) => {
      const isChip = fiveIds.includes(c.id)
      const ci = fiveIds.indexOf(c.id)
      const vis = on && (isChip ? t >= T.catEnd + ci * 0.05 - 0.2 : true)
      show(c.e, vis); if (!vis) return
      const d = Math.hypot(c.x + CW / 2 - 960, c.y + CH / 2 - 560)
      const t0 = isChip ? -9 : T.cascade + (c.x - GRID_X) / 1648 * 0.7 + Math.floor(c.k / COLS) * 0.06 + mulberry32(c.k + 3)() * 0.06
      const a = seg(t, t0, t0 + 0.42, E.outExpo)
      const glowI = ['svc_dl', 'svc_ration', 'svc_birth'].indexOf(c.id)
      const g = glowI >= 0 ? seg(t, T.glow[glowI], T.glow[glowI] + 0.3, E.out) : 0
      Object.assign(c.e.style, { opacity: isChip ? seg(t, T.catEnd + ci * 0.05 - 0.2, T.catEnd + ci * 0.05) : a, transform: `translateY(${(1 - a) * 26}px) scale(${lerp(0.94, 1, a)})`, borderColor: g > 0 ? `rgba(212,168,67,${g})` : 'var(--bdr)', boxShadow: g > 0 ? `0 0 0 ${3 * g}px rgba(212,168,67,${g}), 0 18px 40px rgba(30,4,10,${0.18 * g})` : 'none', background: g > 0 ? `linear-gradient(rgba(212,168,67,${0.09 * g}), rgba(212,168,67,${0.09 * g})), #fff` : '#fff' })
    })
    // schemes tab glints as the fourth chapter
    const gS = seg(t, T.glow[3], T.glow[3] + 0.3, E.out) * (1 - seg(t, T.expand, T.expand + 0.2))
    mastA.tabs.Schemes.style.boxShadow = gS > 0 ? `inset 0 -3px 0 rgba(212,168,67,${gS})` : 'none'
    mastA.tabs.Schemes.style.color = gS > 0.5 ? '#B8922E' : ''
  }
  { // DL card expands into its page (screen-space expander)
    const p = seg(t, T.expand, T.expandEnd, E.inOutExpo), out = seg(t, T.expandEnd - 0.05, T.expandEnd + 0.07, E.inOut)
    show(expander, t >= T.expand && t < T.expandEnd + 0.32)
    if (t >= T.expand) {
      const savedCam = ui
      const r0 = (() => { const c = camKeys(T.expand); setUI(c); const a = P2S([dlCard.x, dlCard.y]), b = P2S([dlCard.x + CW, dlCard.y + CH]); setUI(savedCam); return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] } })()
      const cE = camKeys(T.expandEnd), s1 = 2 * cE.z, tg = [(dlNameR.x - cE.cx) * cE.z + 960, (dlNameR.y - cE.cy) * cE.z + 540]
      const s0 = r0.w / CW
      exin.style.transform = `translate(${lerp(0, tg[0] - 14 * s1, p)}px, ${lerp(0, tg[1] - 66 * s1, p)}px) scale(${lerp(s0, s1, p)})`
      exin.style.opacity = 1
      exin.firstElementChild.style.opacity = exin.lastElementChild.style.opacity = 1 - seg(p, 0.3, 0.7)
      Object.assign(expander.style, { left: px(lerp(r0.x, 0, p)), top: px(lerp(r0.y, 0, p)), width: px(lerp(r0.w, W, p)), height: px(lerp(r0.h, H, p)), borderRadius: px(lerp(14, 0, p)), opacity: 1 - out, background: `rgb(${Math.round(lerp(255, 247, p))},${Math.round(lerp(255, 247, p))},${Math.round(lerp(255, 250, p))})` })
    }
  }

  // ── ACT III · A · Driving Licence ──
  {
    const R = DL
    steps(R, t, [T.ackA - 0.5, T.ackA - 0.44, T.ackA - 0.38, T.ackA - 0.32], 3)
    listbox(dlList, dlListHL, dlListOptR, t, T.listA, T.pickA, 4, dlListR)
    const picked = t >= T.pickA + 0.12
    dlTypeV.textContent = picked ? 'Address Change' : 'Select…'; dlTypeSel.classList.toggle('ph', !picked)
    dlTypeSel.style.borderColor = t >= T.listA && t < T.pickA + 0.9 ? '#9B1B30' : 'var(--bdr)'
    dlTypeSel.style.boxShadow = t >= T.pickA + 0.12 && t < T.pickA + 0.9 ? '0 0 0 4px rgba(155,27,48,.10)' : 'none'
    { const ar = seg(t, T.qAOut, T.qAOut + 0.35, E.out); dlAddrH.style.opacity = dlAddr.style.opacity = ar }
    dlAddrV.forEach((v, i) => { const a = seg(t, T.prefillA + i * 0.08, T.prefillA + i * 0.08 + 0.3, E.outExpo); v.style.display = 'inline-block'; v.style.transform = `translateX(${(1 - a) * 18}px)`; v.style.opacity = a })
    R.stepper.style.opacity = R.info.style.opacity = 1 - seg(t, T.ackA - 0.45, T.ackA - 0.2)   // the acknowledgement stands alone
    const sw = seg(t, T.ackA - 0.5, T.ackA - 0.25, E.inOut)
    R.formIn.style.clipPath = `inset(0 0 ${sw * 100}% 0)`; R.formIn.style.transform = `translateY(${-sw * 24}px)`; show(R.formIn, sw < 1)
    show(R.ackIn, t >= T.ackA - 0.45)
    R.ackTile.style.transform = `scale(${seg(t, T.ackA - 0.4, T.ackA - 0.05, E.appPop)})`
    rise(R.ackTitle, t, T.ackA - 0.38); rise(R.ackDesc, t, T.ackA - 0.3); rise(R.refBox, t, T.ackA - 0.42); rise(R.hand, t, T.handA - 0.2)
    const st = seg(t, T.ackA - 0.25, T.ackA + 0.05, E.outExpo); R.refNum.style.transform = `scale(${lerp(1.12, 1, st)})`; R.refNum.style.clipPath = `inset(0 ${(1 - seg(t, T.ackA - 0.25, T.ackA - 0.08)) * 100}% 0 0)`
    drawQR(R, t, T.qrA - 0.2, T.qrA + 0.2)
    const hb = seg(t, T.handA + 0.3, T.handA + 0.55, E.out)
    R.handBtn.style.borderColor = hb > 0.5 ? '#2563EB' : 'var(--bdr)'; R.handBtn.style.boxShadow = `0 0 0 ${3 * hb}px rgba(37,99,235,${0.18 * hb})`
  }
  // ── B · Ration Card ── (the wallet reuse is the hero; then the honest status)
  {
    const R = RCd
    steps(R, t, [T.pickB + 0.3, T.chipB - 0.3, T.chipB - 0.2, T.chipB - 0.08], 2)
    show(rcDocs, true); show(rcApp, false)
    const pk = seg(t, T.walletB, T.walletB + 0.24, E.outExpo) * (1 - seg(t, T.pickB + 0.2, T.pickB + 0.38, E.in))
    show(picker, pk > 0.001); picker.style.transform = `scale(${lerp(0.94, 1, pk)})`; picker.style.opacity = pk
    resBtn.style.background = t >= T.walletB - 0.15 && t < T.walletB + 0.1 ? '#9B1B3014' : '#fff'
    resBtn.style.transform = `scale(${1 - 0.05 * Math.sin(Math.PI * seg(t, T.walletB - 0.15, T.walletB + 0.05))})`
    pickerHL.style.top = px(pickerItemR[0].y - pickerR.y); pickerHL.style.background = t >= T.pickB ? '#9B1B3024' : `rgba(155,27,48,${0.06 * seg(t, T.walletB + 0.2, T.pickB - 0.1, E.inOut)})`
    const att = t >= T.pickB + 0.15
    resSlot.classList.toggle('ok', att); show(resEmpty, !att); show(resFull, att)
    resFull.style.transform = `translateX(${(1 - seg(t, T.pickB + 0.15, T.pickB + 0.45, E.outExpo)) * 16}px)`
    resChip.textContent = att ? 'Attached' : 'Required'; resChip.style.color = att ? '#059669' : '#DC2626'; resChip.style.background = att ? '#05966918' : '#DC262618'
    rcCnt.textContent = att ? '3/3 attached' : '2/3 attached'; rcCnt.style.color = att ? '#047857' : 'var(--txt2)'
    show(rcList, false)
    resSlot.style.boxShadow = att ? `0 0 0 ${4 * seg(t, T.pickB + 0.15, T.pickB + 0.4, E.out) * (1 - seg(t, T.chipB - 0.3, T.chipB))}px rgba(5,150,105,.14)` : 'none'
    show(R.ackIn, false)
  }
  // ── C · Birth Certificate ── (digital: the reference rides the workflow to a named officer and the Locker)
  {
    const R = BCd
    steps(R, t, [T.formC + 0.2, T.formC + 0.75, T.chipC - 0.2, T.chipC - 0.05], 2)
    bcV.forEach((v, i) => { const a = seg(t, T.formC + 0.15 + i * 0.12, T.formC + 0.45 + i * 0.12, E.outExpo); v.style.display = 'inline-block'; v.style.transform = `translateX(${(1 - a) * 18}px)`; v.style.opacity = a })
    show(R.ackIn, false)
    const headY = (tt) => tt < T.spine ? ulY : tt < T.approval ? lerp(ulY, stageY(6), seg(tt, T.spine, T.approval, E.inOut)) : tt < T.confirm ? stageY(6) : lerp(stageY(6), stageY(11), seg(tt, T.confirm, T.stages2[5] + 0.05, E.inOut))
    if (t >= T.chipC && t < T.D) {
      const hy = headY(t)
      const u = t < T.spine ? uUnderEnd * seg(t, T.chipC, T.spine, E.inOut) : Math.max(uUnderEnd, uAtY(hy))
      drawThread(slice(spineRoute, 0, Math.max(0.0005, u), spineC), { width: 4, tip: t < T.stages2[5] + 0.1, alpha: 1 - seg(t, T.cert, T.cert + 0.35, E.inOut) })
    }
    stg.forEach((s, i) => {
      const vis = t >= T.spine - 0.05 && t < T.D; show(s.e, vis); if (!vis) return
      const appear = seg(t, T.spine + i * 0.05, T.spine + i * 0.05 + 0.3, E.out), doneT = i < 6 ? T.stages[i] : T.stages2[i - 6]
      const d = t >= doneT, pop = d ? seg(t, doneT, doneT + 0.22, E.appPop) : 1, ap = i === 6 && t > T.approval - 0.3
      const html = d ? icon('check', 12, '#fff', 3.2) : ''
      if (s.d.dataset.h !== html) { s.d.innerHTML = html; s.d.dataset.h = html }
      Object.assign(s.d.style, { background: d ? (i === 11 ? '#9B1B30' : '#059669') : '#fff', borderColor: d ? (i === 11 ? '#9B1B30' : '#059669') : ap ? '#9B1B30' : '#D7DAE0', transform: `scale(${pop})` })
      s.l.style.color = d ? '#1C1C1E' : ap ? '#9B1B30' : '#9CA3AF'; s.l.style.fontWeight = d || i === 6 ? 700 : 600
      const dimU = i > 6 ? seg(t, T.officer, T.officer + 0.4) * (1 - seg(t, T.confirm, T.confirm + 0.25)) : 0
      s.e.style.opacity = appear * (1 - seg(t, T.cert - 0.15, T.cert + 0.1)) * (1 - 0.82 * dimU); s.e.style.transform = `translateX(${(1 - appear) * 12}px)`
    })
    // the reference appears under the completed form and rides the spine
    const tagVis = t >= T.chipC && t < T.cert + 0.12
    show(tag, tagVis)
    if (tagVis) {
      const fp = seg(t, T.flap, T.flapEnd), nflip = Math.floor(fp * 3.999)
      tag.textContent = TAG_A.split('').map((ch, i) => (i < 3 && i < nflip) ? TAG_C[i] : ch).join('')
      const a = seg(t, T.chipC, T.chipC + 0.3, E.appPop)
      const pre = t < T.spine
      const pos = pre ? [lerp(ulX, SPX - 236, seg(t, T.chipC + 0.1, T.spine + 0.2, E.inOut)), lerp(ulY - 16, stageY(0) - 16, seg(t, T.chipC + 0.1, T.spine + 0.25, E.inOut))] : [SPX - 236, headY(t) - 16]
      Object.assign(tag.style, { left: px(pos[0]), top: px(pos[1]), opacity: Math.min(1, a * 1.4), transform: `scale(${lerp(0.6, 1, a)}) rotateX(${Math.sin(fp * Math.PI * 3) * 50}deg)`, background: t >= T.flapEnd ? '#059669' : '#9B1B30' })
    }
    const ofVis = t >= T.officer && t < T.cert + 0.3; show(officer, ofVis)
    if (ofVis) {
      const a = seg(t, T.officer, T.officerEnd, E.outExpo), out = seg(t, T.stages2[3], T.cert + 0.2, E.inOut)
      officer.style.transform = `translateX(${(1 - a) * 160}px)`; officer.style.opacity = a * (1 - out)
      cfm.style.transform = `scale(${1 - 0.07 * Math.sin(Math.PI * seg(t, T.confirm - 0.04, T.confirm + 0.1))})`
      cfm.style.background = t >= T.confirm ? '#7A1526' : '#9B1B30'; cfm.textContent = t >= T.confirm + 0.12 ? 'Confirmed' : 'Confirm'
    }
    if (t >= T.confirm && t < T.stages2[5] + 0.2) {
      const p1 = seg(t, T.confirm, T.confirm + 0.14, E.in), c0 = ctr(cfmR)
      spark(P2S(t < T.confirm + 0.14 ? [lerp(c0[0], SPX, p1), lerp(c0[1], stageY(6), p1)] : [SPX, headY(t)]))
    }
    const lkOn = t >= T.cert + 0.1 && t < T.page + 0.15
    docs.forEach((d, i) => { if (i < 4) { show(d, lkOn); const a = seg(t, T.cert + 0.12 + i * 0.04, T.cert + 0.42 + i * 0.04, E.out); d.style.opacity = 0.5 * a; d.style.transform = `translateY(${(1 - a) * 18}px)` } })
    show(lockTitle, lkOn); lockTitle.style.opacity = seg(t, T.cert + 0.2, T.cert + 0.45); lockCnt.textContent = t >= T.seat ? '5' : '4'
    show(cert, t >= T.cert && t < T.page + 0.15)
    if (t >= T.cert) {
      const p = seg(t, T.cert, T.seat, E.inOutExpo), seatPop = seg(t, T.seat, T.seat + 0.25, E.appPop)
      Object.assign(cert.style, { left: px(lerp(certFrom[0], certR.x, p)), top: px(lerp(certFrom[1], certR.y, p) - Math.sin(p * Math.PI) * 120), transform: `scale(${lerp(1.12, 1, p) * (t >= T.seat ? lerp(1.04, 1, seatPop) : 1)}) rotate(${Math.sin(p * Math.PI) * -4}deg)`, transformOrigin: '0 0', boxShadow: `inset 0 ${3 * seatPop}px 0 #D4A843, 0 ${lerp(30, 14, seatPop)}px ${lerp(60, 34, seatPop)}px rgba(30,4,10,${lerp(0.22, 0.12, seatPop)})` })
    }
  }
  // ── D · Schemes → the tracked prerequisite ──
  {
    { // the app's own suggestion opens the chapter, then becomes the Schemes page
      const pop = seg(t, T.suggest, T.suggest + 0.4, E.appPop), p = seg(t, T.page - 0.15, T.page + 0.2, E.inOutExpo), out = seg(t, T.page + 0.12, T.page + 0.24, E.out)
      show(sugg, t >= T.suggest && t < T.page + 0.37)
      { const sp = seg(t, T.suggest - 0.15, T.suggest + 0.2) * (1 - seg(t, T.page + 0.05, T.page + 0.16)); dimK = Math.max(dimK, 0.65 * sp); blurK = Math.max(blurK, 8 * sp) }
      if (t >= T.suggest) {
        const w0 = SUG_W * SUG_S, h0 = SUG_H * SUG_S, x0 = 960 - w0 / 2, y0 = 520 - h0 / 2
        Object.assign(sugg.style, { left: px(lerp(x0, 0, p)), top: px(lerp(y0, 0, p)), width: px(lerp(w0, W, p)), height: px(lerp(h0, H, p)), borderRadius: px(lerp(14, 0, p)), opacity: seg(t, T.suggest, T.suggest + 0.12) * (1 - out), transform: `scale(${p > 0 ? 1 : lerp(0.92, 1, pop)})`, transformOrigin: '50% 50%', background: `rgb(${Math.round(lerp(255, 247, p))},${Math.round(lerp(255, 247, p))},${Math.round(lerp(255, 250, p))})` })
        sgin.style.transform = `scale(${SUG_S})`; sgin.style.opacity = 1 - seg(p, 0.7, 1)
      }
    }
    schCards.forEach((c, k) => {
      const a = seg(t, T.page + 0.08 + k * 0.015, T.page + 0.4 + k * 0.015, E.outExpo)
      c.e.style.opacity = (t >= T.page && k < 3 ? 1 : 0) * (k < 2 ? 1 - seg(t, T.focusD, T.focusD + 0.25) : 1 - seg(t, T.detail, T.detail + 0.18)); c.e.style.transform = `translateY(${(1 - a) * 12}px)`
      const b = seg(t, T.bars + k * 0.03, T.bars + 0.45 + k * 0.03, E.outExpo)
      c.bar.style.width = `${c.m * b}%`; c.pc.textContent = b < 0.04 ? '' : `${Math.round(c.m * b)}%`; c.band.style.opacity = seg(b, 0.55, 0.8)   // never '0%' beside 'High match'
      const f = k === 2 ? seg(t, T.focusD, T.focusD + 0.3, E.out) : 0
      c.e.style.boxShadow = f > 0 ? `0 0 0 ${2.5 * f}px rgba(212,168,67,${f}), 0 22px 50px rgba(30,4,10,${0.18 * f})` : 'none'
      c.e.style.filter = k !== 2 && t > T.focusD ? `saturate(${1 - 0.6 * seg(t, T.focusD, T.focusD + 0.4)})` : 'none'
    })
    schHead.style.opacity = 1 - seg(t, T.focusD, T.focusD + 0.25)
    const dv = seg(t, T.detail, T.detail + 0.45, E.inOutExpo)
    show(schDetail, dv > 0.001 && t < T.E + 0.05)
    { const L = thaiR.x - detailR.x, R2 = detailR.x + detailR.w - (thaiR.x + thaiR.w), T2 = Math.max(0, thaiR.y - detailR.y), B2 = Math.max(0, detailR.y + detailR.h - (thaiR.y + thaiR.h))
      const sc0 = thaiR.w / detailR.w, ox = (thaiR.x + thaiR.w / 2) - (detailR.x + detailR.w / 2), oy = (thaiR.y + thaiR.h / 2) - (detailR.y + detailR.h / 2)
      schDetail.style.clipPath = 'none'; schDetail.style.transformOrigin = '50% 50%'; schDetail.style.transform = `translate(${lerp(ox, 0, dv)}px, ${lerp(oy, 0, dv)}px) scale(${lerp(sc0, 1, dv)})`
      schDetail.firstElementChild.style.opacity = schDetail.lastElementChild.style.opacity = 1 }
    const hw = seg(t, T.howto, T.howto + 0.3, E.out)
    howH1.style.background = `rgba(212,168,67,${0.22 * hw})`; howH1.style.borderRadius = '6px'; howH1.style.padding = `2px ${6 * hw}px`
    aplBtn.style.opacity = 0.4
    { const bh = seg(t, T.heroOut - 0.05, T.heroOut + 0.25, E.out) * (1 - seg(t, T.howto, T.howto + 0.25)); bnf.style.background = `rgba(212,168,67,${0.22 * bh})`; bnf.style.padding = `2px ${6 * bh}px`; bnf.style.margin = `0 ${-6 * bh}px` }
    show(tracker, false); show(icTimeline, false)
    { // THE MOMENT — the scheme's tangible benefit, held: 1 g gold ring
      const hin = seg(t, T.ringHero, T.ringHero + 0.45, E.out), hout = seg(t, T.heroOut, T.heroOut + 0.25, E.inOut), on = t >= T.ringHero && t < T.heroOut + 0.3
      show(heroG, on)
      const hk = hin * (1 - seg(t, T.heroOut + 0.25, T.heroOut + 0.5, E.inOut)); dimK = Math.max(dimK, 0.985 * hk); blurK = Math.max(blurK, 18 * hk)
      heroG.style.transform = `scale(${1 + 0.06 * hout})`
      if (on) {
        const ri = (e, t0, d = 0.55) => { const a = seg(t, t0, t0 + d, E.outExpo); e.style.opacity = a * (1 - hout); e.style.transform = `translateY(${(1 - a) * 22 - hout * 12}px)` }
        ri(hgOver, T.ringHero); ri(hgRow, T.ringHero + 0.14); ri(hgCtx, T.ringHero + 0.6)
        const rp = seg(t, T.heroRing, T.heroRing + 0.75, E.inOut); hgC.setAttribute('stroke-dashoffset', String(590 * (1 - rp))); hgC2.setAttribute('stroke-dashoffset', String(540 * (1 - rp)))
        { const dr = seg(t, T.heroRing + 0.75, T.heroOut); hgRing.style.transform = `rotate(${-3 + 7 * dr}deg) scale(${1 + 0.035 * dr})` }   // the foil keeps moving through the hold
        const gl = seg(t, T.heroGlint, T.heroGlint + 0.7, E.inOut)
        hgGlint.setAttribute('opacity', String(Math.sin(Math.PI * gl))); hgGlint.setAttribute('transform', `rotate(${-90 + 300 * gl})`)
      }
    }
    // the prerequisite links to the citizen's existing, tracked application …
    if (t >= T.linkD && t < T.track + 0.3) {
      const a = P2S([howB.x + howB.w + 8, howB.y + howB.h / 2])
      const rg = railGeom(t), b = [rg.x - 6, rg.y + (RAIL_HEAD + 3 * ROW_H + ROW_H / 2) * rg.sc]
      const route = Array.from({ length: 40 }, (_, k) => { const u = k / 39; return [lerp(a[0], b[0], u), lerp(a[1], b[1], E.inOut(u)) - Math.sin(u * Math.PI) * 40] })
      const p = seg(t, T.linkD, T.linkD + 0.35, E.inOut)
      drawThread(slice(route, 0, Math.max(0.002, p)), { width: 4, screen: true, tip: p < 1, alpha: 1 - seg(t, T.track, T.track + 0.3) })
    }
    // … whose register row opens into the application detail (big, centred, still)
    const tv = seg(t, T.track, T.track + 0.45, E.outExpo)
    show(trackerS, t >= T.track && t < T.E + 0.05)
    if (t >= T.track) {
      const rg = railGeom(t), r0 = { x: rg.x, y: rg.y + (RAIL_HEAD + 3 * ROW_H) * rg.sc, w: RAIL_W * rg.sc, h: ROW_H * rg.sc }
      const x = lerp(r0.x, TRK_R.x, tv), y = lerp(r0.y, TRK_R.y, tv), sc = lerp(r0.w / 1260, TRK_S, tv)
      Object.assign(trackerS.style, { left: px(x), top: px(y), width: '1260px', transformOrigin: '0 0', transform: `scale(${sc})`, opacity: t < T.track + 0.1 ? seg(t, T.track, T.track + 0.1) : 1 })   // held sharp and in place: the Grievances page is the very next frame
      trackerDays.style.background = `rgba(217,119,6,${0.1 * seg(t, T.days, T.days + 0.35, E.out)})`
    }
    // the page behind steps back while the detail holds
    const back2 = t < T.E + 0.05 ? seg(t, T.track, T.track + 0.4) : (t < T.irisEnd ? seg(t, T.reg - 0.05, T.reg + 0.3) : 0)
    dimK = Math.max(dimK, 0.45 * back2); blurK = Math.max(blurK, 5 * back2)
    uiwrap.style.opacity = 1
    { const ir = t >= T.iris && t < T.irisEnd ? 1180 * E.in(seg(t, T.iris, T.irisEnd - 0.05)) : -1, m = ir >= 0 ? `radial-gradient(circle at ${IRIS_P[0]}px ${IRIS_P[1]}px, transparent ${ir.toFixed(1)}px, #000 ${(ir + 1.5).toFixed(1)}px)` : 'none'
      if (uiwrap.style.maskImage !== m) { uiwrap.style.maskImage = m; uiwrap.style.webkitMaskImage = m; wash.style.maskImage = m; wash.style.webkitMaskImage = m }
      irisRing = ir }
  }
  // ── E · Complaint filing: the app's real grievance flow ──
  {
    gCats.forEach((c, i) => { const sel = i === 0 && t >= T.catE; Object.assign(c.style, { background: sel ? '#9B1B30' : '#fff', borderColor: sel ? '#9B1B30' : 'var(--bdr)', color: sel ? '#fff' : 'var(--txt2)', fontWeight: sel ? 700 : 500, transform: i === 0 ? `scale(${1 - 0.06 * Math.sin(Math.PI * seg(t, T.catE - 0.12, T.catE + 0.06))})` : 'none' }) })
    gRoute.style.opacity = 1; gRR.forEach((r, i) => { const v = r.lastElementChild, a = seg(t, T.routeE + i * 0.06, T.routeE + i * 0.06 + 0.25, E.out); v.style.opacity = a; v.style.transform = `translateY(${(1 - a) * 6}px)`; r.firstElementChild.style.opacity = lerp(0.55, 1, a) })   // nothing is routed until a category is chosen
    { const n = t >= T.filedE + 0.1 ? '1' : '0'; if (gCn[0].textContent !== n) { gCn[0].textContent = n; gCn[1].textContent = n } }   // the citizen's first grievance
    gRR.forEach((r, i) => { const w = seg(t, T.routeE + i * 0.08, T.routeE + i * 0.08 + 0.3) * (1 - seg(t, T.routeE + 0.9 + i * 0.08, T.routeE + 1.3 + i * 0.08)); r.style.background = `rgba(212,168,67,${0.2 * w})`; r.style.padding = `2px ${8 * w}px`; r.style.margin = `0 ${-8 * w}px` })
    gTxt.textContent = G_DESC.slice(0, Math.round(G_DESC.length * seg(t, T.descE, T.areaE - 0.1)))
    gCar.style.opacity = t >= T.descE - 0.2 && t < T.areaE ? (Math.floor(t * 4) % 2 ? 1 : 0.2) : 0
    gArea.textContent = t >= T.areaE ? 'Mylapore' : ''; gArea.style.opacity = seg(t, T.areaE, T.areaE + 0.2)
    gSub.style.transform = `scale(${1 - 0.06 * Math.sin(Math.PI * seg(t, T.submitE - 0.06, T.submitE + 0.12))})`; gSub.style.background = t >= T.submitE ? '#7A1526' : '#9B1B30'
    const fo = seg(t, T.submitE + 0.1, T.submitE + 0.28, E.in), fi = seg(t, T.filedE + 0.05, T.filedE + 0.25, E.out)   // never two layers at once
    grvForm.style.opacity = 1 - fo; grvForm.style.transform = `translateY(${-40 * fo}px)`; show(grvForm, fo < 1)
    show(grvFiled, fi > 0); grvFiled.style.opacity = fi; grvFiled.style.transform = `translateY(${(1 - fi) * 24}px)`
    grvP.style.width = px(lerp(GP_W, 980, seg(t, T.filedE, T.filedE + 0.4, E.inOut)))
    gFiledTile.style.transform = `scale(${seg(t, T.filedE + 0.1, T.filedE + 0.45, E.appPop)})`
    rise(gFiledTx, t, T.filedE + 0.12); rise(gRefBox, t, T.refE)
    grvP.style.opacity = (1 - 0.85 * seg(t, T.timeE + 0.1, T.timeE + 0.4)) * (1 - seg(t, T.reg - 0.3, T.reg - 0.05))   // the timeline is read alone; both clear before the register
    gRef.style.clipPath = `inset(0 ${(1 - seg(t, T.refE, T.refE + 0.3)) * 100}% 0 0)`
    show(grvTime, t >= T.timeE - 0.05); rise(grvTime, t, T.timeE, 0.5); if (t >= T.reg - 0.3) grvTime.style.opacity = 1 - seg(t, T.reg - 0.3, T.reg - 0.05)
  }
  // ── the register rail: each chapter's reference joins the citizen's record ──
  {
    const rg = railGeom(t), a = rg.a
    show(rail, rg.vis)
    if (t < T.track) dimK = Math.max(dimK, 0.1 * a)   // a light wash only: the hero behind stays sharp
    const lands = [T.dockCEnd, T.dockBEnd, T.dockAEnd, -1, -1]
    let y = 0
    railRows.forEach((r, i) => {
      const L = lands[i], hgt = L < 0 ? 1 : seg(t, L - 0.12, L + 0.18, E.outExpo)
      r.style.top = px(y); r.style.height = px(ROW_H * hgt)
      r.style.opacity = L < 0 ? (i === 4 ? 0.32 : lerp(0.35, 1, seg(t, T.railD, T.linkD + 0.2))) : seg(t, L, L + 0.15)
      const gl = i <= 2 ? Math.exp(-Math.pow((t - (T.regEnd + 0.1 + i * 0.06)) / 0.16, 2)) : 0   // the three applications this film counted
      r.style.background = gl > 0.02 ? `rgba(${i === 0 ? '5,150,105' : '217,119,6'},${0.2 * gl})` : L > 0 && t >= L && t < L + 0.8 ? `rgba(212,168,67,${0.18 * (1 - seg(t, L + 0.4, L + 0.8))})` : (i === 3 && t >= T.linkD && t < T.reg ? `rgba(217,119,6,${0.12 * seg(t, T.linkD + 0.2, T.linkD + 0.5)})` : 'transparent')
      r.style.boxShadow = L > 0 && t >= L && t < L + 0.8 ? `inset 4px 0 0 rgba(212,168,67,${1 - seg(t, L + 0.4, L + 0.8)})` : 'none'
      y += ROW_H * hgt
    })
    railBody.style.height = px(y)
    railCount.textContent = `All · ${2 + (t >= T.dockAEnd) + (t >= T.dockBEnd) + (t >= T.dockCEnd)}`
    const done = t >= T.completeC
    railChips[0].textContent = done ? 'Completed' : 'Submitted'; railChips[0].className = `chip ${done ? 'ok' : 'warn'} st`
    railChips.forEach((c) => { c.style.opacity = 1 - seg(t, T.gather - 0.12, T.gather) })   // statuses lift off as dots
    rail.style.transform = `translate(${rg.x - RAIL_X}px, ${rg.y - RAIL_Y}px) scale(${rg.sc})`; rail.style.opacity = rg.op
    // the reference chip flies into the register
    const subPill = (R, P) => P2S([P.refBoxR.x + 60, P.refBoxR.y + 126])
    const flights = [[T.dockA, T.dockAEnd, 'APP-2026-DL-44822', () => subPill(DL, pA), null], [T.dockB, T.dockBEnd, 'APP-2026-RC-44823', () => P2S([resR.x + 20, resR.y + resR.h + 34]), T.chipB, true], [T.dockC, T.dockCEnd, 'APP-2026-BC-44824', () => P2S([certR.x + 16, certR.y + 104]), null]]
    let fl = null
    for (const f of flights) if (t >= (f[4] ?? f[0] - 0.12) && t < f[1] + 0.05) fl = f
    show(flyTag, !!fl)
    show(flyHand, !!fl && fl[4] !== null && t < fl[0] + 0.1)
    if (fl) {
      const [t0, t1, txt, fromF, tPop, stay] = fl
      const p = seg(t, t0, t1, E.inOutExpo), from = fromF()
      const to = [rg.x + 22 * rg.sc, rg.y + (RAIL_HEAD + ROW_H / 2) * rg.sc]
      const pop = seg(t, tPop ?? t0 - 0.12, (tPop ?? t0 - 0.12) + 0.25, E.appPop)
      flyTag.textContent = txt
      const x = stay ? from[0] : lerp(from[0], to[0], p), yy = stay ? from[1] - 18 : lerp(from[1], to[1], p) - 18 - Math.sin(p * Math.PI) * 60
      Object.assign(flyTag.style, { left: px(x), top: px(yy), transform: `scale(${(stay ? lerp(2.1, 1.9, p) : lerp(tPop ? 1.7 : 1.25, 1.1, p)) * pop})`, transformOrigin: '0 50%', opacity: stay ? 1 - p : 1 - seg(p, 0.85, 1) })
      if (tPop) { Object.assign(flyHand.style, { left: px(x), top: px(yy + 84), opacity: seg(t, tPop + 0.1, tPop + 0.3) * (1 - seg(t, t0 - 0.1, t0 + 0.05)), transform: `translateY(${(1 - seg(t, tPop + 0.1, tPop + 0.35, E.outExpo)) * 10}px)` }) }
    }
  }

  { const uiOut = t >= T.irisEnd ? 0 : 1
    wash.style.opacity = (dimK * uiOut).toFixed(3); uiwrap.style.filter = blurK > 0.01 ? `blur(${blurK.toFixed(2)}px)` : 'none' }

  // ── ACT IV · one citizen's record → four statuses → one gold point → Mylapore ──
  show(regp, false)
  {
    const on = t >= T.gather && t < T.irisEnd + 0.1
    show(dotsL, on)
    if (on) {
      const a = seg(t, T.gather, T.gather + 0.12, E.out), c = seg(t, T.dots + 0.05, T.iris, E.inOutExpo)
      dotEls.forEach((d, i) => {
        const x0 = RAIL_C[0] + (RAIL_W - 22 - chipW[i] / 2) * RS2, y0 = RAIL_C[1] + (RAIL_HEAD + i * ROW_H + ROW_H / 2) * RS2
        const x = lerp(x0, IRIS_P[0], c), y = lerp(y0, IRIS_P[1], c) - Math.sin(c * Math.PI) * 40 * (i - 2)
        Object.assign(d.style, { left: px(x - 11), top: px(y - 11), opacity: a * (i === 4 ? 0.35 : 1) * (1 - seg(t, T.iris, T.iris + 0.12)), transform: `scale(${lerp(1.2, 0.6, c)})`, background: c > 0.7 ? '#E8C66A' : d.dataset.c })
      })
      dotLabels.style.opacity = 0
    }
    if (irisRing > 0) { sx2.setTransform(DPR, 0, 0, DPR, 0, 0); sx2.strokeStyle = `rgba(241,212,136,${0.85 * (1 - seg(irisRing, 700, 1180))})`; sx2.lineWidth = 2; sx2.beginPath(); sx2.arc(IRIS_P[0], IRIS_P[1], irisRing + 1, 0, Math.PI * 2); sx2.stroke()
    }
  }
  if (false && t >= T.iris && t < T.irisEnd + 0.01 && mapInfo) {
    const cam = mapInfo.cam, k = logLerp(60, 1, seg(t, T.iris, T.irisEnd, E.inOutExpo)), pp = seg(t, T.iris, T.irisEnd)
    const ring = resample(mylRing, 90).map((g) => { const s = toScreen(cam, g); return [IRIS_P[0] + (s[0] - mapInfo.mS[0]) * k + (mapInfo.mS[0] - IRIS_P[0]) * pp, IRIS_P[1] + (s[1] - mapInfo.mS[1]) * k + (mapInfo.mS[1] - IRIS_P[1]) * pp] })
    uiwrap.style.clipPath = `polygon(${ring.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',')})`
  } else uiwrap.style.clipPath = 'none'

  { // the iris lands: name the place (rhymes with the dive)
    const on = t >= T.irisEnd - 0.4 && t < T.plate + 0.3 && mapInfo
    show(mylLabel, !!on)
    if (on) { const a = seg(t, T.irisEnd - 0.08, T.irisEnd + 0.2, E.out) * (1 - seg(t, T.plate - 0.05, T.plate + 0.25)); Object.assign(mylLabel.style, { left: px(mapInfo.mS[0] + 70), top: px(mapInfo.mS[1] + 46), opacity: a, transform: `translateY(${(1 - a) * 8}px)` }) }   // the label appears only once the iris has opened past it
  }
  { // MLA plate — the same record, counted at constituency level
    const vis = t >= T.plate - 0.02 && t < T.fold + 0.5 && mapInfo
    show(plate, !!vis)
    if (vis) {
      const ms = mapInfo.mS, up = seg(t, T.plate, T.plateEnd, E.outExpo), down = seg(t, T.fold, T.fold + 0.45, E.in)
      const PS = 1.75 * platePush(t)
      Object.assign(plate.style, { left: px(ms[0] - 380 * PS), top: px(ms[1] - 114 - PLATE_H), transform: `rotateX(${lerp(88, 0, up)}deg) scale(${PS * lerp(1, 0.06, down)})`, transformOrigin: down > 0 ? `50% ${PLATE_H + 114}px` : '50% 100%', opacity: 1 - seg(down, 0.55, 1) })
      plate.style.left = px(ms[0] - 380)
      const roll = (t0) => seg(t, t0, t0 + 0.28, E.outExpo)
      odo[0](4233 + roll(T.rolls[0]) + roll(T.rolls[1]) + roll(T.rolls[2]))
      odo[1](3867 + roll(T.rollDone))
      odo[2](298 + roll(T.rollPend) + roll(T.rollPend + 0.1563))
      const EV = [T.rolls, [T.rollDone], [T.rollPend, T.rollPend + 0.1563]]
      plus1[2].textContent = t >= T.rollPend + 0.1563 ? '+2' : '+1'
      plus1.forEach((e, k) => { let last = -1; for (const tt of EV[k]) if (t >= tt) last = tt; e.style.opacity = last < 0 ? 0 : seg(t, last, last + 0.06) * (1 - seg(t, last + 0.26, last + 0.42)); e.style.transform = `translateY(${-12 * seg(t, last, last + 0.42, E.out)}px)` })
    }
  }
  show(sign, false)
  { // ── ACT V · one constituency → another → the state → the portrait → மாற்றம் → the app ──
    const cam = mapInfo ? mapInfo.cam : null
    // the gold line escapes the Mylapore dashboard and travels constituency to constituency
    if (cam && t >= T.lineOut && t < T.red + 0.6) {
      const times = [[T.lineOut + 0.15, T.viru], [T.viruHold, T.villi], [T.villiHold, T.tnagar]]
      const fadeAll = Math.max(0, 1 - 0.5 * seg(t, T.pull + 0.4, T.scaleEnd) - 0.5 * seg(t, T.red, T.red + 0.5))
      for (let k = 0; k < 3; k++) {
        const p = seg(t, times[k][0], times[k][1], E.inOut); if (p <= 0) continue
        const alpha = fadeAll * (k < 2 ? 1 - 0.65 * seg(t, times[k + 1][0], times[k + 1][0] + 0.4) : 1)
        const a = M, b = STOPS[k].c, nx = -(b[1] - a[1]), ny = b[0] - a[0]
        const route = Array.from({ length: 32 }, (_, j2) => { const u = j2 / 31, bu = Math.sin(u * Math.PI) * 0.18; return toScreen(cam, [lerp(a[0], b[0], u) + nx * bu, lerp(a[1], b[1], u) + ny * bu]) })
        drawThread(slice(route, 0, Math.max(0.002, p)), { width: 4, screen: true, tip: p < 1, alpha })
      }
    }
    // each constituency's dashboard resolves on arrival (the same capability; no figures the app doesn't hold)
    STOPS.forEach((st, k) => {
      const ta = [T.viru, T.villi, T.tnagar][k], tOut = [T.viruHold, T.villiHold, T.pull][k], d = dashes[k], lb = stopLabels[k]
      const vis = cam && t >= ta && t < tOut + 0.35
      show(d.e, !!vis); show(lb, !!vis)
      if (!vis) return
      const sp = toScreen(cam, st.c), up = seg(t, ta + 0.15, ta + 0.55, E.outExpo), down = seg(t, tOut, tOut + 0.3, E.inOutExpo)
      const dh = DASH_HS[k], off = DASH_OFF[k], da = seg(up, 0, 0.4) * (1 - seg(down, 0.55, 1))
      Object.assign(d.e.style, { left: px(sp[0] - 310), top: px(sp[1] - off - dh), transform: `rotateX(${lerp(35, 0, up)}deg) scale(${DASH_S[k] * lerp(1, 0.06, down)})`, transformOrigin: `50% ${dh + off}px`, opacity: da })
      if (off > 100 && da > 0.01) { const y0 = sp[1] - off * lerp(1, 0.06, down); sx2.setTransform(DPR, 0, 0, DPR, 0, 0); sx2.globalAlpha = da; sx2.strokeStyle = '#E8C66A'; sx2.lineWidth = 1.2; sx2.beginPath(); sx2.moveTo(sp[0], y0); sx2.lineTo(sp[0], sp[1] - 6); sx2.stroke(); sx2.fillStyle = '#F6E3A1'; sx2.beginPath(); sx2.arc(sp[0], sp[1], 3.2, 0, Math.PI * 2); sx2.fill(); sx2.globalAlpha = 1 }   // a 1 px leader to its constituency
      d.bars.forEach((b, j2) => { const g = seg(t, ta + 0.35 + j2 * 0.03, ta + 0.7 + j2 * 0.03, E.outExpo); b.style.width = `${(j2 % 2 ? 58 : 82) * g}%` })
      d.sh.forEach((e2, j2) => { e2.style.transform = `translateX(${lerp(-120, 220, seg(t, ta + 0.7 + j2 * 0.06, ta + 1.2 + j2 * 0.06, E.inOut))}%)` })
      d.live.style.opacity = seg(t, ta + 0.8, ta + 0.95)
      const la = seg(t, ta + 0.05, ta + 0.35, E.out) * (1 - seg(t, tOut, tOut + 0.2))
      const dvx = st.c[0] - M[0], dvy = st.c[1] - M[1], dl = Math.hypot(dvx, dvy), ox = dvx / dl * LBL_OFF[k], oy = dvy / dl * LBL_OFF[k] * 0.72
      Object.assign(lb.style, { left: px(sp[0] + ox), top: px(sp[1] + oy - 10), opacity: la, transform: `translate(${ox < 0 ? '-100%' : '0'}, ${(1 - la) * 8}px)` })   // the name sits on the side away from Mylapore
    })
    // every constituency the line reaches stays lit as a gold node; on the pull, the rest light in waves
    if (cam && t >= T.viru && t < T.red + 0.6) {
      sx2.setTransform(DPR, 0, 0, DPR, 0, 0)
      sx2.globalCompositeOperation = 'lighter'
      for (const a of acs) {
        if (a.act > t) continue
        const sp = toScreen(cam, a.c); if (sp[0] < -20 || sp[0] > W + 20 || sp[1] < -20 || sp[1] > H + 20) continue
        const age = t - a.act, pr = seg(age, 0, 0.5), fade = 1 - seg(t, T.red, T.red + 0.6)
        const nr = t >= T.pull ? lerp(2.6, 4, seg(t, T.pull + 0.8, T.scaleEnd)) : 2.6
        sx2.globalAlpha = 0.9 * fade; sx2.fillStyle = '#F6E3A1'; sx2.beginPath(); sx2.arc(sp[0], sp[1], nr, 0, Math.PI * 2); sx2.fill()
        if (pr < 1) { sx2.globalAlpha = (1 - pr) * 0.8 * fade; sx2.strokeStyle = '#F6E3A1'; sx2.lineWidth = 1.6; sx2.beginPath(); sx2.arc(sp[0], sp[1], nr + 2 + 12 * pr, 0, Math.PI * 2); sx2.stroke() }
      }
      sx2.globalAlpha = 1; sx2.globalCompositeOperation = 'source-over'
    }
    { // 234
      const vis = t >= T.count234 - 0.2 && t < T.scaleHold + 0.35; show(cnt234, vis); show(cntScrim, vis)
      if (vis) { const a = seg(t, T.count234 - 0.2, T.count234 + 0.15, E.out) * (1 - seg(t, T.scaleHold, T.scaleHold + 0.3)); cnt234.style.opacity = a; cntScrim.style.opacity = a; cnt234.style.transform = `translateY(${(1 - a) * 14}px)`
        cntNum.textContent = String(Math.round(lerp(4, 234, 1 - Math.pow(1 - seg(t, T.count234, T.count234End), 3)))) }
    }
    // the portrait: stage 1 — recognition, read from the reference as gold points; stage 2 — the reference itself
    const zf = portraitZoom(t), dx = portraitShift(t)
    const PZ = (x, y) => [FACE_F[0] + (x - FACE_F[0]) * zf + dx, FACE_F[1] + (y - FACE_F[1]) * zf]
    if (cam && t >= T.form && t < T.revealEnd + 0.4) {
      sx2.setTransform(DPR, 0, 0, DPR, 0, 0); sx2.globalCompositeOperation = 'lighter'; sx2.fillStyle = '#F1D488'
      const fadeP = 1 - seg(t, T.reveal + 0.2, T.revealEnd - 0.2, E.inOut), sz0 = Math.min(zf, 2.2) * lerp(0.45, 1, fadeP)
      for (const q of PART) {
        const ts = T.form + q.r1 * 1.7, k = seg(t, ts, ts + 1.15, E.inOut); if (k <= 0) continue
        const v = vil[q.v], s0 = toScreen(cam, [v.x, v.y]), tg = PZ(q.x, q.y), sb = Math.sin(k * Math.PI)
        const x = lerp(s0[0], tg[0], k) + sb * (q.r2 - 0.5) * 90, y = lerp(s0[1], tg[1], k) - sb * 30
        sx2.globalAlpha = (0.3 + 0.7 * q.w) * seg(t, ts, ts + 0.25) * fadeP
        const z = (1.1 + 1.3 * q.w) * sz0; sx2.fillRect(x - z / 2, y - z / 2, z, z)
      }
      sx2.globalAlpha = 1; sx2.globalCompositeOperation = 'source-over'
    }
    { const vis = t >= T.form + 0.4 && t < T.revealEnd + 0.45; show(silBox, vis)   // the silhouette forms, then the face emerges from it
      if (vis) { silBox.style.clipPath = 'none'; silBox.style.transformOrigin = `${FACE_F[0] - PIMG_X}px ${FACE_F[1] - PIMG_Y}px`; silBox.style.transform = `translateX(${dx}px) scale(${zf})`; silBox.style.opacity = 0.92 * seg(t, T.form + 0.4, T.formClose + 0.9, E.inOut) * (1 - seg(t, T.revealEnd + 0.15, T.revealEnd + 0.4)) } }
    { const vis = t >= T.reveal + 0.3 && t < T.clearEnd + 0.05; show(portraitBox, vis)
      if (vis) {
        portraitBox.style.clipPath = 'none'
        portraitBox.style.transformOrigin = `${FACE_F[0] - PIMG_X}px ${FACE_F[1] - PIMG_Y}px`
        portraitBox.style.transform = `translateX(${dx}px) scale(${zf})`
        portraitBox.style.opacity = seg(t, T.reveal + 0.35, T.revealEnd + 0.2, E.inOut)   // the clear is a dip to dark over the whole composite (below)
        const g = seg(t, T.goldWipe, T.goldWipeEnd, E.inOut), ch = toScreen(P_CAM, M)   // gold spreads out of Chennai, with the map
        const m = `radial-gradient(circle at ${(ch[0] - PIMG_X).toFixed(1)}px ${(ch[1] - PIMG_Y).toFixed(1)}px, #000 ${(g * 150).toFixed(1)}%, transparent ${(g * 150 + 12).toFixed(1)}%)`
        pGold.style.opacity = g > 0.001 ? 1 : 0; pGold.style.maskImage = m; pGold.style.webkitMaskImage = m
      } }
    { const dk = t >= T.clear ? seg(t, T.clear, T.clearEnd, E.inOut) : 0; show(dipDark, dk > 0); dipDark.style.opacity = dk }
    // the same gold line re-emerges from Chennai on the composition and becomes the underline of மாற்றம்
    const W0 = [MB.x - 30, MB.y + MB.h + 24], W1 = [MB.x + MB.w + 30, MB.y + MB.h + 24]
    const toLock = seg(t, T.toOut + 0.25, T.identity - 0.15, E.inOut)
    if (t >= T.lineBack && t < T.identity + 99) {
      const ch = toScreen(P_CAM, M), A = PZ(ch[0], ch[1])
      const curve = catmull([A, [A[0] + 150, A[1] + 220], [W1[0] + 170, W1[1] - 170], [W1[0] + 40, W1[1] - 6], W1], 160)   // one gesture: down the right side, into the underline
      const route = [...curve, ...Array.from({ length: 24 }, (_, j2) => [lerp(W1[0], W0[0], (j2 + 1) / 24), W1[1]])]
      const rc = cumul(route), Lc = cumul(curve).at(-1) / rc.at(-1)
      const head = t < T.maatram ? Lc * seg(t, T.lineBack, T.maatram, E.inOut) : Lc + (1 - Lc) * seg(t, T.maatram, T.maatram + 1.0, E.inOut)
      const tail = Lc * seg(t, T.maatram - 0.2, T.maatramEnd - 0.3, E.inOut)
      if (toLock <= 0) drawThread(slice(route, tail, Math.max(tail + 0.001, head), rc), { width: 4, screen: true, tip: head < 0.999, alpha: 1 })
      else { const y = lerp(W0[1], 604, toLock), xa = lerp(W0[0], 900, toLock), xb = lerp(W1[0], 1020, toLock); drawThread([[xa, y], [xb, y]], { width: lerp(4, 3, toLock), screen: true, tip: false, alpha: 1 - seg(t, T.fadeOut, DUR - 0.3) }) }   // it lands as the lockup's rule
    }
    { const vis = t >= T.maatram - 0.05 && t < T.toOut + 0.4; show(maatram, vis)
      if (vis) {
        maatram.style.clipPath = 'none'
        mTx.setAttribute('stroke-dashoffset', String(1400 * (1 - seg(t, T.maatram, T.maatram + 1.0, E.inOut))))
        mTx.setAttribute('fill-opacity', String(seg(t, T.maatram + 0.85, T.maatramEnd + 0.1, E.inOut)))
        const out = seg(t, T.toOut, T.toOut + 0.3, E.inOut); maatram.style.opacity = (1 - out) * (1 - 0.35 * seg(t, T.to, T.to + 0.3, E.inOut)); maatram.style.transform = `translateY(${-30 * out}px)`
      } }
    { const vis = t >= T.to - 0.05 && t < T.toOut + 0.4; show(toWord, vis)
      if (vis) { const a = seg(t, T.to, T.to + 0.4, E.out) * (1 - seg(t, T.toOut, T.toOut + 0.3, E.inOut)); toWord.style.opacity = a; toWord.style.transform = `translateY(${(1 - a) * 14}px)` } }
    { const vis = t >= T.identity - 0.05; show(ident, vis)
      if (vis) {
        const sp = seg(t, T.identity, T.identity + 0.55, E.appPop), glow = Math.exp(-Math.pow((t - (T.identity + 0.6)) / 0.4, 2)), br = 0.5 + 0.5 * Math.sin((t - T.identity) * 2.2)
        idSeal.style.opacity = seg(t, T.identity, T.identity + 0.15); idSeal.style.transform = `scale(${lerp(0.7, 1, sp)})`
        idSeal.style.filter = `drop-shadow(0 0 ${10 + 18 * glow + 6 * br}px rgba(212,168,67,${0.32 + 0.3 * glow + 0.08 * br}))`
        const ru = (e, t0) => { const a = seg(t, t0, t0 + 0.6, E.outExpo); e.style.transform = `translateY(${(1 - a) * 160}%)`; e.style.opacity = seg(t, t0, t0 + 0.12) }
        ru(idW, T.idWord); ru(idS, T.idSuper); ru(idT, T.idTa)
        ident.style.transformOrigin = '960px 540px'; ident.style.transform = `scale(${1 + 0.022 * seg(t, T.idTa + 0.4, T.fadeOut + 1.2)})`
      } }
  }
  // ── kinetic type ──
  { const vis = (a, b) => seg(t, a - 0.2, a + 0.1) * (1 - seg(t, b + 0.1, b + 0.4)); scrim.style.opacity = Math.max(vis(T.q2, T.q2Out), vis(T.q3, T.q3Out), vis(T.qA, T.qAOut), vis(T.qB, T.qBOut), vis(T.qC, T.qCOut), vis(T.q4, T.q4Out), vis(T.qD, T.qDOut), vis(T.qE, T.qEOut))
    const m = vis(T.q3, T.q3Out) > 0 ? 'none' : vis(T.q2, T.q2Out) > 0 ? 'linear-gradient(to right, #000 0%, #000 50%, transparent 62%)' : 'linear-gradient(to right, #000 0%, #000 52%, transparent 78%)'
    if (scrim.style.maskImage !== m) { scrim.style.maskImage = m; scrim.style.webkitMaskImage = m } }
  playHead(Q.q1, t, T.q1, T.q1Out); playHead(Q.q2, t, T.q2, T.q2Out); playHead(Q.q3, t, T.q3, T.q3Out)
  playHead(Q.qA, t, T.qA, T.qAOut, true, true); playHead(Q.qB, t, T.qB, T.qBOut, true, true); playHead(Q.qC, t, T.qC, T.qCOut, true, true)
  playHead(Q.q4, t, T.q4, T.q4Out, true, true); playHead(Q.qD, t, T.qD, T.qDOut, true, true); playHead(Q.q5, t, T.q5, T.q5Out, true, true)
  playHead(Q.qE, t, T.qE, T.qEOut, true, true)

  // ── grade ──
  const light = t >= T.snap + 0.2 && t < T.irisEnd - 0.05
  vig.style.background = light ? 'radial-gradient(ellipse 90% 85% at 50% 46%, rgba(0,0,0,0) 60%, rgba(0,0,0,.06) 100%)' : 'radial-gradient(ellipse 75% 70% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'
  grainC.style.opacity = light ? 0.035 : 0.06
  gx.setTransform(1, 0, 0, 1, 0, 0)
  const r = mulberry32(frame + 1), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256)
  gx.setTransform(DPR * 1.5, 0, 0, DPR * 1.5, -ox, -oy); gx.fillStyle = gx.createPattern(grainTile, 'repeat'); gx.fillRect(0, 0, W * DPR, H * DPR)
  flash.style.background = '#000'; flash.style.opacity = seg(t, T.fadeOut, DUR - 0.2, E.inOut)
  await new Promise((res) => requestAnimationFrame(() => res()))
}
window.__ready = true

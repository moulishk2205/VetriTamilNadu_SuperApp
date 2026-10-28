// VETRI TAMIL NADU — "One Thread" · Director's Cut (60 s). Every frame is seek(t).
// Acts I–II carry the v1 film (same shots, same language) with room to breathe;
// Act III adds four real citizen journeys captured in one live session; Act IV returns to the state.
import { clamp, lerp, seg, E, mulberry32, noise1, h } from './lib.js'
import { parsePath, resample, mix, cumul, slice } from './geom.js'
import { T, COPY, S16 } from './timeline.js'
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
const back = $('back'), front = $('front'), screenL = $('screen'), typeL = $('type'), flash = $('flash'), vig = $('vig'), uiwrap = $('uiwrap')
function el(parent, cls, style = {}, html) { const e = h('div', cls, html); Object.assign(e.style, style); parent.appendChild(e); return e }
const show = (e, on) => { const v = on ? '' : 'none'; if (e.style.display !== v) e.style.display = v }

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
  return { p: new Path2D(a.d), len: rings.reduce((s, r) => s + cumul(r).at(-1), 0), dist: Math.hypot(a.c[0] - M[0], a.c[1] - M[1]) }
})

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
const HOLD_END = { s: 1.05, c: [400, 470] }
const mHoldEnd = toScreen(HOLD_END, M)
const END = { s: 0.94, c: [368 - (600 - 960) / 0.94, 500 - (546 - 540) / 0.94] }
const mEnd = toScreen(END, M)
const IRIS_P = [960, 600]

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
const ROWS_X = 1290, ROWS_Y = 196, ROW_DY = 132, SPINE_X = 1196

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
  R.ackTitle = el(R.ackIn, 'abs', { left: '90px', top: '28px', fontSize: '27px', fontWeight: 800, letterSpacing: '-.5px', color: 'var(--txt)', whiteSpace: 'nowrap' }, 'Application submitted')
  R.ackDesc = el(R.ackIn, 'abs', { left: '90px', top: '72px', fontSize: '14.5px', color: 'var(--txt2)', whiteSpace: 'nowrap' }, `Your application has been received by ${cfg.dept}.`)
  R.refBox = el(R.ackIn, 'abs', { left: '22px', top: '118px', width: '956px', height: '170px', borderRadius: '14px', background: 'var(--bgAlt)', border: '1px solid var(--bdr)' })
  el(R.refBox, 'abs', { left: '24px', top: '34px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.4px', color: 'var(--txt3)' }, 'REFERENCE NUMBER')
  R.refNum = el(R.refBox, 'abs mono', { left: '22px', top: '56px', fontSize: '34px', fontWeight: 600, color: 'var(--pri)', whiteSpace: 'nowrap', transformOrigin: '0 50%' }, cfg.ref)
  el(R.refBox, 'abs', { left: '24px', top: '112px' }, '<span class="chip warn">Submitted</span>')
  const qb = el(R.refBox, 'abs', { left: '700px', top: '18px', width: '128px', height: '128px', background: '#fff', padding: '6px', borderRadius: '6px' })
  R.qrCv = h('canvas'); R.qrCv.width = R.qrCv.height = cfg.qr.size * 8; Object.assign(R.qrCv.style, { width: '116px', height: '116px', imageRendering: 'pixelated' }); qb.appendChild(R.qrCv)
  R.qr = cfg.qr
  if (cfg.handoff) {
    R.hand = el(R.ackIn, 'abs handoff', { left: '22px', top: '306px', width: '956px' }, `<div style="font-size:14px;color:var(--txt2);line-height:1.55">This service is completed on <b style="color:var(--txt)">${cfg.handoff}</b>. Your details are saved — continue there to finish.</div><div class="hb">${icon('external-link', 15, '#1C1C1E')}Continue on ${cfg.handoff}</div>`)
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
el(DL.formIn, 'abs', { left: '20px', top: '186px', fontSize: '14.5px', fontWeight: 700, color: 'var(--txt)' }, 'Address')
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
const rcDocs = el(RCd.formIn, 'abs', { inset: 0 })
el(rcDocs, 'panel-h', {}, `Required documents<span style="flex:1"></span><span class="cnt2" style="font-size:12px;color:var(--txt2);font-weight:500">2/3 attached</span>`)
const rcCnt = rcDocs.querySelector('.cnt2')
const docRow = (y, name, attached, tag) => el(rcDocs, 'abs', { left: '20px', top: px(y), width: '960px' }, `
  <div class="docrow">${icon('file-text', 16, '#9B1B30')}<span class="dn">${name}</span>${tag}</div>
  <div class="slot${attached ? ' ok' : ''}">${attached ? `${icon('circle-check', 20, '#059669', 2)}<div><div style="font-size:13.5px;font-weight:600;color:var(--txt)">${attached}</div><div style="font-size:11.5px;color:var(--txt3)">Attached</div></div>` : ''}</div>`)
docRow(66, 'Head of Family Photo (5×3.5 cm)', 'family_photo.jpg', '<span class="chip ok">Attached</span>')
docRow(162, 'Aadhaar of all family members', 'aadhaar_family.pdf', '<span class="chip ok">Attached</span>')
const resRow = docRow(258, 'Residence Proof (EB bill / property tax / rent)', null, '<span class="chip" style="color:var(--err);background:#DC262618">Required</span>')
const resSlot = resRow.querySelector('.slot'), resChip = resRow.querySelector('.chip')
const resEmpty = el(resSlot, 'abs', { left: '14px', top: '13px', display: 'flex', gap: '10px', alignItems: 'center' }, `<span class="altbtn">${icon('wallet', 14, '#9B1B30')}Use a wallet document</span><span style="font-size:12.5px;color:var(--txt3)">or drag & drop · PDF / JPEG · max 200 KB</span>`)
const resBtn = resEmpty.querySelector('.altbtn')
const resFull = el(resSlot, 'abs', { left: '14px', top: '10px', display: 'flex', gap: '12px', alignItems: 'center' }, `${icon('circle-check', 20, '#059669', 2)}<div><div style="font-size:13.5px;font-weight:600;color:var(--txt)">Driving License</div><div style="font-size:11.5px;color:var(--txt3)">From wallet · DL-TN-2024-8842</div></div>`)
const WALLET = [['Driving License', 'DL-TN-2024-8842', '#2563EB'], ['Birth Certificate', 'BC-TN-2002-4421', '#7C3AED'], ['Income Certificate', 'IC-TN-2024-9912', '#059669'], ['Ration Card', 'RC-TN-CHN-7788', '#059669']]
const picker = el(rcDocs, 'picker', { left: '40px', top: '336px', width: '470px', zIndex: 6 }, `<div class="ph2">VERIFIED DOCUMENTS</div><div class="hl" style="position:absolute;left:10px;right:10px;height:56px;border-radius:10px;background:#9B1B3010"></div>${WALLET.map(([n, no, col]) => `<div class="it"><div style="width:34px;height:34px;border-radius:9px;background:${col}14;display:flex;align-items:center;justify-content:center">${icon('file-text', 17, col)}</div><div style="flex:1"><div class="t1">${n}</div><div class="t2 mono">${no}</div></div>${icon('circle-check', 16, '#059669', 2)}</div>`).join('')}`)
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
  <div style="padding:14px"><div style="display:flex;align-items:center;gap:12px;border:1.5px solid #05966966;border-radius:14px;padding:12px 12px 12px 14px">${icon('circle-check', 19, '#059669', 2)}<div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--txt)">Approve &amp; Issue</div><div style="font-size:11.5px;color:var(--txt2);margin-top:2px">APP-2026-BC-44824</div></div><div class="cfm" style="background:#9B1B30;color:#fff;font-size:12.5px;font-weight:600;border-radius:16px;padding:8px 16px">Confirm</div></div></div>`)
const cfm = officer.querySelector('.cfm')
const LKX = 136, LKY = stageY(11) + 230, LKW = 300, LKG = 18
const lockTitle = el(front, 'abs', { left: px(LKX + 2 * (LKW + LKG)), top: px(LKY - 74), display: 'flex', alignItems: 'baseline', gap: '16px', whiteSpace: 'nowrap' }, `<span style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Digital Locker</span><span style="font-size:14px;color:var(--txt2)">All documents · <b class="cnt" style="color:var(--pri)">4</b></span>`)
const lockCnt = lockTitle.querySelector('.cnt')
const DOCS = [['Driving License', 'DL-TN-2024-8842', 'TRANSPORT', '#2563EB'], ['Birth Certificate', 'BC-TN-2002-4421', 'CIVIL', '#7C3AED'], ['Income Certificate', 'IC-TN-2024-9912', 'REVENUE', '#059669'], ['Ration Card', 'RC-TN-CHN-7788', 'CIVIL SUPPLIES', '#059669'], ['Birth Certificate', 'CRT-2026-BC-44824', 'PUBLIC HEALTH (DPHPM)', '#059669']]
const docs = DOCS.map(([t, n, cat, col], i) => el(front, 'doc', { left: px(LKX + i * (LKW + LKG)), top: px(LKY), width: px(LKW) }, `<div class="ic" style="background:${col}14">${icon('file-text', 18, col)}</div><div class="t">${t}</div><div class="n mono">${n}</div><div class="f"><span class="cat" style="color:${col}">${cat}</span><span class="v">${icon('circle-check', 13, '#059669', 2)}Verified</span></div>`))
const cert = docs[4]

// D · Schemes (ranked against the citizen profile) + tracked prerequisite
const mastS = masthead(back, RS, 'Schemes')
el(back, 'abs', { left: '136px', top: px(RS + 192), whiteSpace: 'nowrap' }, `<div style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Welfare Schemes</div><div style="font-size:15px;color:var(--txt2);margin-top:8px">Government of Tamil Nadu schemes ranked against Chandramoulishwarar K citizen profile — district, income band and verified documents.</div>`)
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
  return { e, m, x, y, bar: e.querySelector('.bar i'), pc: e.querySelector('.pc') }
})
const thai = schCards[2]
const schDetail = el(front, 'panel abs', { left: '136px', top: px(RS + 300), width: '1648px', height: '330px', boxShadow: '0 30px 70px rgba(30,4,10,.2)' }, `
  <div class="panel-h">Thai Maaman Thanga Modhiram Scheme<span style="flex:1"></span>${icon('x', 17, '#9CA3AF')}</div>
  <div style="padding:18px 22px;display:grid;grid-template-columns:1fr 1.2fr;gap:30px">
    <div><div class="ta" style="font-size:15px;color:var(--txt2)">தாய் மாமன் தங்க மோதிரம் திட்டம்</div>
      <dl style="display:grid;gap:12px;margin-top:16px">${[['Benefit', '1 g gold ring for every baby born in a Government hospital'], ['Department', 'Health & Family Welfare'], ['Eligibility match', '88% · High match']].map(([k, v]) => `<div><dt style="font-size:11.5px;color:var(--txt3)">${k}</dt><dd style="font-size:14.5px;color:var(--txt);font-weight:500;margin-top:2px">${v}</dd></div>`).join('')}</dl></div>
    <div><div style="font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--txt3)">How to apply</div>
      <ol class="howto" style="margin-top:10px;padding-left:20px;display:grid;gap:8px;font-size:14px;color:var(--txt2);line-height:1.55"><li class="h1"><b style="color:var(--txt)">Obtain an Income Certificate</b> if you do not already hold a valid one.</li><li>Carry your Aadhaar, ration card and the certificate to your Taluk e-Sevai centre.</li><li>The department verifies eligibility and sanctions the benefit.</li></ol>
      <div style="display:flex;gap:8px;margin-top:16px"><span class="btn pri">${icon('file-text', 15, '#fff')}Apply for Income Certificate</span><span class="btn">${icon('sparkles', 15, '#1C1C1E')}Ask Vetri about this scheme</span></div></div>
  </div>`)
const howH1 = schDetail.querySelector('.h1')
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
const ROW_H = 64, RAIL_HEAD = 52
const rail = el(screenL, 'rail', { left: '1452px', top: '250px' }, `<div class="rh" style="height:${RAIL_HEAD}px">${icon('timer', 17, '#9B1B30', 2)}My Applications<span style="flex:1"></span><span class="rc" style="font-size:12px;color:var(--txt2);font-weight:500">All · 2</span></div><div class="rbody" style="position:relative"></div>`)
const railBody = rail.querySelector('.rbody'), railCount = rail.querySelector('.rc')
const railRows = RROWS.map(([n, r, st, tone]) => el(railBody, 'rr', { position: 'absolute', left: 0, right: 0, height: px(ROW_H), overflow: 'hidden', boxSizing: 'border-box' }, `<div style="flex:1"><div class="rn">${n}</div><div class="rf mono">${r}</div></div><span class="chip ${tone} st">${st}</span>`))
const railChips = railRows.map((r) => r.querySelector('.st'))
const flyTag = el(screenL, 'flytag mono', {}, '')
const expander = el(screenL, 'expander', {}, `<div class="exin" style="position:absolute;left:0;top:0;transform-origin:0 0;padding:14px"><div style="width:40px;height:40px;border-radius:11px;background:#9B1B300D;display:flex;align-items:center;justify-content:center">${icon('car', 20, '#9B1B30', 1.8)}</div><div style="font-size:15px;font-weight:700;color:var(--txt);margin-top:12px;white-space:nowrap">Driving Licence</div><div class="ta" style="font-size:12px;color:var(--txt2);margin-top:3px">ஓட்டுநர் உரிமம்</div></div>`)
const exin = expander.querySelector('.exin')
const REG = [['Birth Certificate', 'APP-2026-BC-44824', 'Directorate of Public Health & Preventive Medicine', 'Completed', 'ok'], ['Ration Card (Smart Card)', 'APP-2026-RC-44823', 'Civil Supplies & Consumer Protection', 'Submitted', 'warn'], ['Driving Licence', 'APP-2026-DL-44822', 'Ministry of Road Transport & Highways', 'Submitted', 'warn'], ['Income Certificate', 'APP-2026-IC-44821', 'Revenue & Disaster Management', 'In Progress', 'warn'], ['Community Certificate', 'APP-2026-CC-44903', 'Revenue Department', 'In Progress', 'warn']]
const regp = el(screenL, 'regp', { left: '210px', top: '230px', width: '1500px' }, `<div class="rh" style="display:flex;align-items:center;gap:10px;padding:18px 22px;border-bottom:1px solid var(--bdr);font-size:19px;font-weight:800;color:var(--txt)">${icon('timer', 19, '#9B1B30', 2)}My Applications<span style="flex:1"></span><span style="font-size:13px;color:var(--txt2);font-weight:500">Every application, with its Right to Service timeline and the officer responsible</span></div><table><thead><tr><th>Service</th><th>Reference</th><th>Department</th><th>Status</th></tr></thead><tbody>${REG.map(([n, r, d, st, tone]) => `<tr><td style="font-weight:700">${n}</td><td class="ref">${r}</td><td style="color:var(--txt2)">${d}</td><td><span class="chip ${tone} rs">${st}</span></td></tr>`).join('')}</tbody></table>`)
const regRows = [...regp.querySelectorAll('tbody tr')], regChips = [...regp.querySelectorAll('.rs')]

const plate = el(screenL, 'plate', { width: '760px' }, `
  <div class="hd"><div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${icon('landmark', 22, '#fff')}</div>
  <div><div style="color:#fff;font-size:20px;font-weight:700">Mylapore Constituency</div><div style="color:rgba(255,255,255,.72);font-size:13.5px;margin-top:2px">Chennai District · Assembly segment</div></div></div>
  <div class="body"><div class="pills">${['Citizen', 'Officer', 'Department', 'MLA', 'Super Admin'].map((p) => `<span class="pill">${p}</span>`).join('')}</div>
  <div class="tiles">
    <div class="tl"><div class="v odo0" style="color:var(--txt)"></div><div class="k">Submitted</div></div>
    <div class="tl"><div class="v odo1" style="color:#059669"></div><div class="k">Completed</div></div>
    <div class="tl"><div class="v odo2" style="color:#D97706"></div><div class="k">Pending</div></div>
  </div></div>`)
const pills = [...plate.querySelectorAll('.pill')]
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
  <img class="seal" src="${SEAL}" style="position:absolute;left:0;top:0;width:76px;height:auto;transform-origin:50% 50%">
  <div style="position:absolute;left:96px;top:6px;overflow:hidden;padding-bottom:6px"><div class="sw" style="font-size:40px;font-weight:800;letter-spacing:-1px;color:#fff;white-space:nowrap">Vetri Tamil Nadu</div></div>
  <div style="position:absolute;left:97px;top:56px;overflow:hidden;padding-bottom:8px"><div class="st2 ta" style="font-size:22px;font-weight:600;color:var(--secLt);white-space:nowrap">வெற்றி தமிழ்நாடு · ஒரே குடிமகன் அடையாளம்</div></div>`)
const signSeal = sign.querySelector('.seal'), signW = sign.querySelector('.sw'), signT = sign.querySelector('.st2')

// ── kinetic type ─────────────────────────────────────────────────────────────
function headline(lines, { x = 136, y, size = 100, color = '#fff', ta = null, taColor = '#E8C66A', taSize = 44, rule = 'var(--sec)' }) {
  const box = el(typeL, 'kt', { left: px(x), top: px(y) })
  const r = el(box, 'rule', { top: '-26px', background: rule })
  const ws = []
  lines.forEach((ln) => { const l = el(box, 'ln en', { fontSize: px(size), color }); ln.split(' ').forEach((w, k) => { if (k) l.appendChild(document.createTextNode(' ')); ws.push(el(l, 'w', {}, w)) }) })
  if (ta) { const l = el(box, 'ln tam', { fontSize: px(taSize), color: taColor, marginTop: '10px' }); ta.split(' ').forEach((w, k) => { if (k) l.appendChild(document.createTextNode(' ')); ws.push(el(l, 'w', {}, w)) }) }
  return { box, rule: r, ws }
}
function playHead(hd, t, tin, tout, ruleOn = true) {
  const on = t >= tin - 0.01 && t <= tout + 0.45
  show(hd.box, on)
  if (!on) return
  hd.rule.style.transform = `scaleX(${ruleOn ? seg(t, tin - 0.12, tin + 0.22, E.out) * (1 - seg(t, tout, tout + 0.3, E.in)) : 0})`
  hd.ws.forEach((w, i) => {
    const a = seg(t, tin + i * 0.045, tin + i * 0.045 + 0.5, E.outExpo)
    const b = seg(t, tout + i * 0.02, tout + i * 0.02 + 0.3, E.in)
    w.style.transform = `translateY(${(1 - a) * 112 - b * 112}%)`
  })
}
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
  q5: headline(COPY.q5, { y: 752, size: 96 }),
  q6: headline(COPY.q6, { x: 1010, y: 380, size: 84, ta: COPY.q6ta, taSize: 40 }),
  cb: headline([COPY.q1], { x: 1010, y: 440, size: 76 }),
  ans: headline(COPY.answer, { x: 1010, y: 396, size: 84 }),
}

// grain
const grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 256
{ const g = grainTile.getContext('2d'), im = g.createImageData(256, 256), r = mulberry32(99); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255 * 0.9; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 } g.putImageData(im, 0, 0) }

// ═════════════════════════════════════════════════════════════════════════════
// MEASURE (camera identity → client px = page px)
// ═════════════════════════════════════════════════════════════════════════════
const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } }
const ctr = (r) => [r.x + r.w / 2, r.y + r.h / 2]
const chipR = chips.map(rect), rbubR = rect(rbub), tileSize = tiles.map((t) => rect(t.el)), ububR = rect(ubub)
const catTargets = SVC5.slice(0, 4).map((s) => { const c = cardOf(s.id); return { x: c.x, y: c.y, w: CW, h: CH } })
const pages = [DL, RCd, BCd].map((R) => ({
  stepC: R.stepEls.map((s) => ctr(rect(s.querySelector('.c')))), refR: rect(R.refNum), refBoxR: rect(R.refBox), formR: rect(R.formP), titleR: rect(R.title),
  handR: R.handBtn ? rect(R.handBtn) : null,
}))
const dlListR = rect(dlList), rcListR = rect(rcList), dlTypeR = rect(dlTypeSel), rcTypeR = rect(rcTypeSel)
const resBtnR = rect(resBtn), resSlotR = rect(resSlot), pickerR = rect(picker), pickerItemR = pickerItems.map(rect)
const certR = rect(cert), certFrom = [SPX - 236, stageY(11) - 40]
const cfmR = rect(cfm)
const thaiR = { x: thai.x, y: thai.y, w: SCW, h: SCH_H }, detailR = rect(schDetail), howR = rect(howH1), trackerR = rect(tracker), daysR = rect(daysEl)
const RAIL_S = 1.38
const railR = { x: 1452 + 420 - 420 * RAIL_S, y: 250 + (RAIL_HEAD + 5 * ROW_H) * (1 - RAIL_S) / 2, w: 420 * RAIL_S, h: (RAIL_HEAD + 5 * ROW_H) * RAIL_S }
const regR = rect(regp)
const dlListOptR = [...dlList.querySelectorAll('.op')].map(rect), rcListOptR = [...rcList.querySelectorAll('.op')].map(rect)

// thread route for the birth spine
const ulY = pages[2].refR.y + pages[2].refR.h + 8
const spineRoute = [[pages[2].refR.x, ulY], [pages[2].refR.x + pages[2].refR.w, ulY]]
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
const SPZ = 1.42
const spineCam = (y, z = SPZ) => [SPX - (1090 - 960) / z, y + 30, z]
const ackCam = (i, z = 1.7) => { const r = pages[i].refBoxR; return [r.x + r.w * 0.47, r.y + r.h * 0.5, z] }
const lockC = [LKX + 3 * (LKW + LKG) + LKW * 0.5 + 40, LKY + 30]
const KEYS = [
  [0, 960, 540, 1], [T.flip, 960, 540, 1],
  [T.flipEnd + 0.1, ...bubFocus, 1.62, E.inOut], [T.cat, ...bubFocus, 1.7, E.linear],
  [T.catEnd + 0.2, ...CATF, 1.0, E.inOutExpo], [T.glow[0] - 0.15, CATF[0], CATF[1] + 10, 1.04, E.linear],
  [T.expand, dlCard.x + CW / 2, dlCard.y + CH / 2, 1.32, E.inOut],
  // A · DL (cut under the expander)
  [T.expand + 0.42, dlCard.x + CW / 2, dlCard.y + CH / 2, 1.38, E.linear, 'cut'],
  [T.expand + 0.43, 136, RA + 520, 1.4, E.linear],
  [T.qAOut, 136, RA + 540, 1.46, E.linear],
  [T.prefillA + 0.25, 760, RA + 640, 1.42, E.inOut], [T.stepsA[3] + 0.15, 1000, RA + 520, 1.3, E.inOut],
  [T.ackA + 0.05, ...ackCam(0, 1.62), E.inOutExpo], [T.handA - 0.05, ...ackCam(0, 1.68), E.linear],
  [T.handA + 0.4, pages[0].handR.x + 200, pages[0].handR.y - 40, 1.75, E.inOut], [T.dockA, pages[0].handR.x + 220, pages[0].handR.y - 50, 1.8, E.linear],
  // glide down to B
  [T.B + 0.05, 136, RB + 620, 1.4, E.inOutExpo],
  [T.qBOut, 136, RB + 640, 1.46, E.linear],
  [T.listB + 0.05, 700, RB + 560, 1.5, E.inOut], [T.chooseB + 0.35, 700, RB + 590, 1.55, E.linear],
  [T.ackB + 0.05, pages[1].refBoxR.x + 470, pages[1].refBoxR.y + 150, 1.5, E.inOutExpo], [T.dockBEnd + 0.1, pages[1].refBoxR.x + 480, pages[1].refBoxR.y + 160, 1.55, E.linear],
  // glide down to C
  [T.C + 0.05, 136, RC + 520, 1.4, E.inOutExpo], [T.qCOut, 136, RC + 540, 1.46, E.linear],
  [T.ackC + 0.05, ...ackCam(2, 1.65), E.inOutExpo], [T.spine, ...ackCam(2, 1.7), E.linear],
  [T.spine + 0.55, ...spineCam(stageY(1)), E.inOut], [T.approval, ...spineCam(stageY(6)), E.inOut],
  [T.confirm + 0.05, ...spineCam(stageY(6)), E.linear], [T.stages2[5] + 0.2, ...spineCam(stageY(11)), E.inOut],
  [T.cert + 0.1, ...spineCam(stageY(11)), E.linear], [T.seat + 0.02, ...lockC, 1.5, E.inOut], [T.dockC + 0.3, lockC[0] + 10, lockC[1], 1.55, E.linear],
  // glide down to D (Schemes)
  [T.D + 0.1, 960, RS + 560, 0.95, E.inOutExpo], [T.focusD - 0.1, 960, RS + 560, 0.98, E.linear],
  [T.focusD + 0.45, thaiR.x + thaiR.w / 2 + 120, thaiR.y + thaiR.h / 2, 1.45, E.inOut],
  [T.detail + 0.4, howR.x + 260, howR.y + 40, 1.42, E.inOut], [T.howto + 0.4, howR.x + 240, howR.y + 30, 1.5, E.linear],
  [T.track + 0.1, 790, trackerR.y + 200, 1.18, E.inOutExpo], [T.days + 0.4, daysR.x + 330, daysR.y + 10, 1.62, E.inOut], [T.reg, daysR.x + 340, daysR.y + 10, 1.68, E.linear],
  [T.irisEnd, daysR.x + 340, daysR.y + 10, 1.0, E.inOut],
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
function drawThread(pts, { width = 4, alpha = 1, tip = true, screen = false } = {}) {
  if (pts.length < 2) return
  const S = screen ? (p) => p : P2S
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
  box.style.transform = `scaleY(${lerp(0.9, 1, open)})`; box.style.opacity = open
  const hp = seg(t, tOpen + 0.18, tPick - 0.05, E.inOut)
  const y = lerp(optR[0].y, optR[idx].y, hp) - boxR.y
  Object.assign(hl.style, { top: px(y), height: px(optR[0].h) })
  hl.style.background = t >= tPick ? '#9B1B3024' : '#9B1B3012'
}

// ═════════════════════════════════════════════════════════════════════════════
// MAP WORLD
// ═════════════════════════════════════════════════════════════════════════════
function mapCam(t) {
  const start = camAt([1060, 410], 2.3)
  if (t < T.hold) { const p = seg(t, 0, T.pullEnd, E.inOut); const s = logLerp(start.s, FULL.s, p); return camAt([lerp(1060, toScreen(FULL, M)[0], p), lerp(410, toScreen(FULL, M)[1], p)], s) }
  if (t < T.dive) { // NEW: the lit state breathes — a slow push toward the north
    const p = seg(t, T.hold, T.holdEnd, E.inOut)
    return { s: logLerp(FULL.s, HOLD_END.s, p), c: [lerp(FULL.c[0], HOLD_END.c[0], p), lerp(FULL.c[1], HOLD_END.c[1], p)] }
  }
  if (t < T.iris) { const p = seg(t, T.dive, T.diveEnd, E.inOutExpo); const s = logLerp(HOLD_END.s, 30, p) * (1 + 0.05 * seg(t, T.diveEnd, T.snap)); return camAt([lerp(mHoldEnd[0], 930, p), lerp(mHoldEnd[1], 452, p)], s) }
  if (t < T.pullOut) { const p = seg(t, T.iris, T.plate + 0.3, E.inOut); return camAt([lerp(IRIS_P[0], 640, p), lerp(IRIS_P[1], 640, p)], logLerp(30, 26, p)) }
  const p = seg(t, T.pullOut, T.pullOutEnd, E.inOutExpo)
  return camAt([lerp(640, mEnd[0], p), lerp(640, mEnd[1], p)], logLerp(26, END.s, p))
}
function drawMap(t) {
  clearCtx(mx); mx.fillStyle = '#0B0607'; mx.fillRect(0, 0, W * DPR, H * DPR)
  if (t > T.mastEnd + 0.05 && t < T.iris) return null
  const cam = mapCam(t), s = cam.s
  const ce = toScreen(cam, [368, 500])
  const g0 = mx.createRadialGradient(ce[0] * DPR, ce[1] * DPR, 0, ce[0] * DPR, ce[1] * DPR, 900 * DPR)
  g0.addColorStop(0, 'rgba(78,18,32,.55)'); g0.addColorStop(1, 'rgba(78,18,32,0)'); mx.fillStyle = g0; mx.fillRect(0, 0, W * DPR, H * DPR)
  const deep = seg(s, 3, 20)
  const ringR = t > T.ring ? lerp(0, 1050, seg(t, T.ring, T.ringEnd, E.outSoft)) : -1
  const holdTw = t > T.igniteEnd && t < T.dive ? seg(t, T.igniteEnd, T.hold + 0.5) : 0
  const baseA = t < T.iris ? lerp(0.4, 0.46, deep) + 0.06 * holdTw : lerp(0.46, 0.52, seg(t, T.pullOut, T.pullOutEnd))
  mx.globalCompositeOperation = 'lighter'
  const dot = clamp(1.7 + 2.0 * deep, 1.7, 3.7)
  for (let i = 0; i < VX.length; i++) {
    if (VT[i] > t) break
    const sx = (VX[i] - cam.c[0]) * s + 960, sy = (VY[i] - cam.c[1]) * s + 540
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue
    const fl = Math.exp(-(t - VT[i]) / 0.11)
    let a = baseA * (0.7 + 0.6 * hashV[i]) + 0.62 * fl
    if (holdTw > 0) a *= 1 + 0.22 * holdTw * noise1(t * 1.6 + i * 0.37)
    if (ringR > 0) { const dd = Math.abs(VD[i] - ringR); a += 0.55 * Math.exp(-(dd * dd) / (2 * 22 * 22)) }
    const sz = dot * (1 + 0.9 * fl) * 3.0
    mx.globalAlpha = clamp(a, 0, 1)
    mx.drawImage(fl > 0.35 ? SP_FLASH : SP_SETTLE, (sx - sz / 2) * DPR, (sy - sz / 2) * DPR, sz * DPR, sz * DPR)
  }
  mx.globalAlpha = 1; mx.globalCompositeOperation = 'source-over'
  mx.setTransform(s * DPR, 0, 0, s * DPR, (960 - cam.c[0] * s) * DPR, (540 - cam.c[1] * s) * DPR)
  const dA = (1 - seg(s, 5, 10)) * (t < T.iris ? 1 : seg(t, T.pullOut + 0.3, T.pullOutEnd))
  if (dA > 0.01) {
    // NEW (hold): the 234 constituencies breathe in under the districts
    const cAlpha = t < T.iris ? seg(t, T.constit, T.constit + 1.4) * (1 - seg(t, T.dive, T.dive + 0.3)) : 0.5
    if (cAlpha > 0.01) {
      mx.lineWidth = 0.6 / s
      for (const a of acs) { const st = T.constit + (a.dist / maxDistrictDist) * 1.2; const p = t < T.iris ? seg(t, st, st + 0.6, E.out) : 1; if (p <= 0) continue; mx.strokeStyle = `rgba(155,27,48,${0.55 * cAlpha * dA})`; mx.setLineDash([a.len * p, a.len]); mx.stroke(a.p) }
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
  const mS = toScreen(cam, M)
  let pa = 0
  if (t < T.bubble + 0.2) pa = 1 - seg(t, T.bubble, T.bubble + 0.18)
  if (t >= T.iris) pa = 1
  if (pa > 0) {
    mx.setTransform(DPR, 0, 0, DPR, 0, 0)
    const r = 5.5 * (1 + 0.18 * Math.sin(Math.min(t, 0.6) / 0.6 * Math.PI))
    const g = mx.createRadialGradient(mS[0], mS[1], 0, mS[0], mS[1], r * 5)
    g.addColorStop(0, `rgba(255,240,200,${pa})`); g.addColorStop(0.2, `rgba(232,198,106,${0.8 * pa})`); g.addColorStop(1, 'rgba(212,168,67,0)')
    mx.fillStyle = g; mx.beginPath(); mx.arc(mS[0], mS[1], r * 5, 0, Math.PI * 2); mx.fill()
    mx.fillStyle = `rgba(255,248,226,${pa})`; mx.beginPath(); mx.arc(mS[0], mS[1], r * 0.55, 0, Math.PI * 2); mx.fill()
  }
  if (ringR > 0) { mx.setTransform(DPR, 0, 0, DPR, 0, 0); mx.strokeStyle = `rgba(241,212,136,${(1 - seg(t, T.ring + 0.8, T.ringEnd)) * 0.55})`; mx.lineWidth = 1.5; mx.beginPath(); mx.arc(mS[0], mS[1], ringR * cam.s, 0, Math.PI * 2); mx.stroke() }
  return { cam, mS }
}

// ═════════════════════════════════════════════════════════════════════════════
// SEEK
// ═════════════════════════════════════════════════════════════════════════════
window.seek = async (t) => {
  const frame = Math.round(t * 60)
  const mapInfo = drawMap(t)
  { // UI camera (+ shrink into the iris point)
    let c = camKeys(t)
    if (t >= T.iris) {
      const k = logLerp(60, 1, seg(t, T.iris, T.irisEnd, E.inOutExpo)), f = k / 60
      const Q0 = [(IRIS_P[0] - 960) / c.z + c.cx, (IRIS_P[1] - 540) / c.z + c.cy], z = c.z * f
      c = { z, cx: Q0[0] - (IRIS_P[0] - 960) / z, cy: Q0[1] - (IRIS_P[1] - 540) / z }
    }
    setUI(c)
  }
  clearCtx(tx)
  show(back, t >= T.snap - 0.02 && t < T.irisEnd)
  show(front, t < T.irisEnd)
  ground.style.opacity = t >= T.iris ? 1 - seg(t, T.iris, T.iris + 0.3) : 1
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
    const wait = [SPINE_X - 40 - bw * 1.5, 196 + bh * 0.5], dock = [136 + 1000 - 20 - bw, 252 + 20]
    if (t >= T.snap) { const fl = seg(t, T.snap, T.snap + 0.55, E.outExpo), dk = seg(t, T.flip, T.flipEnd + 0.05, E.inOutExpo); x = lerp(lerp(x, wait[0], fl), dock[0], dk); y = lerp(lerp(y, wait[1], fl), dock[1], dk); sc = lerp(lerp(BIG, 1.5, fl), 1, dk) }
    const out = seg(t, T.cat, T.cat + 0.3, E.in)
    show(ubub, t >= T.bubble && t < T.catEnd)
    Object.assign(ubub.style, { left: px(x), top: px(y), opacity: 1 - out, transform: `scale(${Math.max(0.001, sc)})`, transformOrigin: '50% 100%', borderRadius: `${lerp(24, 14, pB)}px ${lerp(24, 14, pB)}px 4px ${lerp(24, 14, pB)}px` })
  }
  const knotK = seg(t, T.knot, T.snap, E.in), C = [930, 520]
  const tilePos = tiles.map((tl, i) => {
    const pop = seg(t, T.tiles[i], T.tiles[i] + 0.38, E.appPop)
    let [x, y] = SCAT[i]
    x += noise1(t * 2.1 + i * 9) * 6 * (0.4 + 2.2 * knotK); y += noise1(t * 1.7 + i * 5 + 40) * 6 * (0.4 + 2.2 * knotK)
    x = lerp(x, C[0] - tileSize[i].w / 2 + (SCAT[i][0] - C[0]) * 0.45, knotK * 0.55); y = lerp(y, C[1] - tileSize[i].h / 2 + (SCAT[i][1] - C[1]) * 0.45, knotK * 0.55)
    let rot = (1 - pop) * (i % 2 ? 6 : -6) + noise1(t * 3 + i) * 2.2 * knotK
    const fl = seg(t, T.snap, T.snap + 0.34, E.outExpo), ang = Math.atan2(SCAT[i][1] + tileSize[i].h / 2 - C[1], SCAT[i][0] + tileSize[i].w / 2 - C[0])
    x += Math.cos(ang) * 1500 * fl; y += Math.sin(ang) * 1100 * fl
    const r = seg(t, T.rows[i] - 0.28, T.rows[i] + 0.12, E.outExpo), R = [ROWS_X, ROWS_Y + i * ROW_DY]
    return { x: lerp(x, R[0], r), y: lerp(y, R[1], r), sc: pop, rot: lerp(rot, 0, r), r }
  })
  tiles.forEach((tl, i) => {
    const p = tilePos[i], vis = t >= T.tiles[i] && t < T.flipEnd + 0.02
    show(tl.el, vis); if (!vis) return
    tl.no.style.transform = `scale(${seg(t, T.rows[i] + 0.02, T.rows[i] + 0.3, E.appPop)})`
    tl.meta.style.display = 'block'; tl.meta.style.opacity = seg(t, T.rows[i], T.rows[i] + 0.25)
    const f = seg(t, T.flip + i * 0.025, T.flipEnd, E.inOutExpo)
    let x = p.x, y = p.y, w = tileSize[i].w, hh = tileSize[i].h, rad = 18
    if (f > 0) { const tg = i < 4 ? chipR[i] : { x: rbubR.x + 30, y: rbubR.y + 120, w: 200, h: 20 }; x = lerp(x, tg.x, f); y = lerp(y, tg.y, f); w = lerp(w, tg.w, f); hh = lerp(hh, tg.h, f); rad = lerp(18, 9, f) }
    const k = Math.max(p.r, f)
    Object.assign(tl.el.style, { left: px(x), top: px(y), width: f > 0 ? px(w) : '', height: f > 0 ? px(hh) : '', borderRadius: px(rad), transform: `rotate(${p.rot}deg) scale(${Math.max(0.001, p.sc)})`, boxShadow: `0 ${lerp(18, 2, k)}px ${lerp(44, 6, k)}px rgba(30,4,10,${lerp(0.34, 0.06, k)})`, overflow: f > 0 ? 'hidden' : 'visible', opacity: i === 4 ? 1 - seg(t, T.flip, T.flipEnd) : 1 })
    tl.tx.style.opacity = tl.ic.style.opacity = 1 - seg(f, 0, 0.45); tl.no.style.opacity = 1 - seg(f, 0, 0.3)
  })
  depts.forEach((d, i) => { const a = seg(t, 5.9 + i * 0.12, 6.3 + i * 0.12, E.out) * (1 - seg(t, T.snap, T.snap + 0.12)); show(d, a > 0.001); d.style.opacity = a; d.style.transform = `translate(${noise1(t * 0.9 + i * 3) * 10}px, ${(1 - a) * 10 + noise1(t * 0.8 + i * 7) * 6}px)` })
  if (t >= T.wrong && t < T.mastEnd) {
    const ub = rect(ubub), B = [ub.x + ub.w - 4, ub.y + ub.h - 2]
    const cen = (i) => [tilePos[i].x + tileSize[i].w / 2, tilePos[i].y + tileSize[i].h / 2]
    const route = catmull([B, cen(4), cen(3), cen(2), cen(0), cen(1), [cen(1)[0] + 140, cen(1)[1] + 160]], 360)
    let pts = slice(route, 0, Math.max(0.002, seg(t, T.wrong, T.wrongEnd, E.inOut)))
    if (knotK > 0) pts = resample(pts, 360).map((p, k) => { const a = k / 360 * Math.PI * 14 + t * 3, rr = 60 + 30 * Math.sin(k * 0.21); return [lerp(p[0], C[0] + Math.cos(a) * rr * 1.5, knotK * 0.82), lerp(p[1], C[1] + Math.sin(a) * rr * 0.8, knotK * 0.82)] })
    if (t >= T.snap) { const sp = seg(t, T.snap, T.snap + 0.2, E.outExpo); pts = mix(resample(pts, 400), Array.from({ length: 400 }, (_, k) => [lerp(-60, W + 60, k / 399), 115.5]), sp) }
    drawThread(pts, { width: 4, tip: t < T.snap + 0.1, alpha: 1 - seg(t, T.snap + 0.24, T.snap + 0.4) })
  }
  { // masthead + ground wipes from the rule
    const pBar = seg(t, T.snap + 0.03, T.snap + 0.26, E.out), pStrip = seg(t, T.snap + 0.14, T.snap + 0.34, E.out), pDown = seg(t, T.snap + 0.04, T.mastEnd, E.inOut)
    mastA.bar.style.clipPath = `inset(${(1 - pBar) * 100}% 0 0 0)`; mastA.strip.style.clipPath = `inset(${(1 - pStrip) * 100}% 0 0 0)`
    mastA.nav.style.clipPath = `inset(0 0 ${(1 - seg(pDown, 0, 0.25)) * 100}% 0)`; ground.style.clipPath = t < T.mastEnd + 0.1 ? `inset(0 0 ${(1 - pDown) * 100}% 0)` : 'none'
    show(mastA.m, t >= T.snap)
  }
  { // hero Tamil, spine, ordered rows, FLIP into the real reply
    const heroOn = t >= T.hero && t < T.flip + 0.4; show(hero, heroOn)
    if (heroOn) heroWords.forEach((w, i) => { const a = seg(t, T.hero + i * 0.075, T.hero + i * 0.075 + 0.55, E.outExpo), b = seg(t, T.flip - 0.08 + i * 0.03, T.flip + 0.2 + i * 0.03, E.inExpo); w.style.transform = `translateY(${(1 - a) * 115 - b * 115}%)` })
    if (t >= T.hero && t < T.flipEnd) {
      const down = seg(t, T.hero + 0.1, T.rows[4] + 0.05, E.inOut), up = seg(t, T.flip, T.flip + 0.25, E.in)
      const y1 = lerp(117, ROWS_Y + 4 * ROW_DY + tileSize[4].h / 2, down), y0 = lerp(117, y1, up)
      drawThread([[SPINE_X, y0], [SPINE_X, Math.max(y0 + 0.5, y1)]], { width: 4, tip: down < 0.999 && up === 0 })
      tiles.forEach((tl, i) => { const r = seg(t, T.rows[i] + 0.05, T.rows[i] + 0.22, E.out) * (1 - up); if (r <= 0) return; const yy = ROWS_Y + i * ROW_DY + tileSize[i].h / 2; drawThread([[SPINE_X, yy], [SPINE_X + (ROWS_X - 60 - SPINE_X) * r, yy]], { width: 3, tip: false }) })
    }
    const pg = seg(t, T.flip - 0.05, T.flipEnd, E.out), gone = seg(t, T.cat, T.cat + 0.32, E.inOut)
    for (const e of [pageTitleA, chat]) { show(e, t >= T.flip - 0.05 && gone < 1); e.style.clipPath = `inset(0 0 ${(1 - pg + gone) * 100}% 0)` }
    { const pr = seg(t, T.flipEnd - 0.1, T.flipEnd + 0.2, E.out); show(askRail, pr > 0 && gone < 1); askRail.style.clipPath = `inset(0 0 ${(1 - pr + gone) * 100}% 0)` }
    show(rbub, t >= T.flip + 0.12 && t < T.catEnd + 0.4)
    rbub.style.background = `rgba(247,247,250,${seg(t, T.flip + 0.12, T.flipEnd) * (1 - gone)})`
    rbH.style.opacity = seg(t, T.flip + 0.15, T.flipEnd) * (1 - gone); rbEn.style.opacity = 0.72 * seg(t, T.flip + 0.2, T.flipEnd + 0.1) * (1 - gone)
    // ACT II: the four plan chips leave the reply and become catalogue cards
    chips.forEach((c, i) => {
      c.style.opacity = t >= T.flipEnd ? 1 : 0
      const f = seg(t, T.cat + i * 0.05, T.catEnd + i * 0.05, E.inOutExpo), r0 = chipR[i], r1 = catTargets[i]
      if (t >= T.cat) Object.assign(c.style, { position: 'absolute', left: px(lerp(r0.x, r1.x, f) - rbubR.x), top: px(lerp(r0.y, r1.y, f) - rbubR.y), width: px(lerp(r0.w, r1.w, f)), height: px(lerp(r0.h, r1.h, f)), borderRadius: px(lerp(9, 14, f)), opacity: 1 - seg(f, 0.86, 1), boxShadow: `0 ${12 * Math.sin(f * Math.PI)}px ${30 * Math.sin(f * Math.PI)}px rgba(30,4,10,.18)` })
      else Object.assign(c.style, { position: '', left: '', top: '', width: '', height: '', borderRadius: '', color: '' })
    })
  }

  // ── ACT II · catalogue ──
  {
    const on = t >= T.cat && t < T.expandEnd + 0.1
    show(catPage, on)
    const tabOn = seg(t, T.cat + 0.05, T.cat + 0.35, E.out)
    const tS = mastA.tabs.Services; tS.classList.toggle('on', tabOn > 0.5)
    rise(catTitle, t, T.cat + 0.1, 0.5); rise(catChips, t, T.cat + 0.2, 0.5)
    chipCounts.forEach((c, i) => { const n = +c.dataset.n; c.textContent = String(Math.round(n * seg(t, T.counts + i * 0.06, T.counts + i * 0.06 + 0.45, E.out))) })
    const fiveIds = SVC5.slice(0, 4).map((s) => s.id)
    catCards.forEach((c) => {
      const isChip = fiveIds.includes(c.id)
      const ci = fiveIds.indexOf(c.id)
      const vis = on && (isChip ? t >= T.catEnd + ci * 0.05 - 0.04 : true)
      show(c.e, vis); if (!vis) return
      const d = Math.hypot(c.x + CW / 2 - 960, c.y + CH / 2 - 560)
      const t0 = isChip ? T.catEnd + ci * 0.05 - 0.04 : T.cascade + d / 1100 * 0.75 + mulberry32(c.k + 3)() * 0.12
      const a = seg(t, t0, t0 + 0.42, E.outExpo)
      const glowI = ['svc_dl', 'svc_ration', 'svc_birth'].indexOf(c.id)
      const g = glowI >= 0 ? seg(t, T.glow[glowI], T.glow[glowI] + 0.3, E.out) : 0
      Object.assign(c.e.style, { opacity: isChip ? 1 : a, transform: `translateY(${(1 - a) * 26}px) scale(${lerp(0.94, 1, a)})`, borderColor: g > 0 ? `rgba(212,168,67,${g})` : 'var(--bdr)', boxShadow: g > 0 ? `0 0 0 ${2 * g}px rgba(212,168,67,${0.9 * g}), 0 18px 40px rgba(30,4,10,${0.18 * g})` : 'none' })
    })
    // schemes tab glints as the fourth chapter
    const gS = seg(t, T.glow[3], T.glow[3] + 0.3, E.out) * (1 - seg(t, T.expand, T.expand + 0.2))
    mastA.tabs.Schemes.style.boxShadow = gS > 0 ? `inset 0 -3px 0 rgba(212,168,67,${gS})` : 'none'
    mastA.tabs.Schemes.style.color = gS > 0.5 ? '#B8922E' : ''
  }
  { // DL card expands into its page (screen-space expander)
    const p = seg(t, T.expand, T.expandEnd, E.inOutExpo), out = seg(t, T.expandEnd, T.expandEnd + 0.28, E.out)
    show(expander, t >= T.expand && t < T.expandEnd + 0.3)
    if (t >= T.expand) {
      const savedCam = ui
      const r0 = (() => { const c = camKeys(T.expand); setUI(c); const a = P2S([dlCard.x, dlCard.y]), b = P2S([dlCard.x + CW, dlCard.y + CH]); setUI(savedCam); return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] } })()
      exin.style.transform = `translate(${lerp(0, 120, p)}px, ${lerp(0, 150, p)}px) scale(${lerp(r0.w / CW, 3.2, p)})`; exin.style.opacity = 1 - seg(p, 0.55, 0.95)
      Object.assign(expander.style, { left: px(lerp(r0.x, 0, p)), top: px(lerp(r0.y, 0, p)), width: px(lerp(r0.w, W, p)), height: px(lerp(r0.h, H, p)), borderRadius: px(lerp(14, 0, p)), opacity: 1 - out, background: `rgb(${Math.round(lerp(255, 247, p))},${Math.round(lerp(255, 247, p))},${Math.round(lerp(255, 250, p))})` })
    }
  }

  // ── ACT III · A · Driving Licence ──
  {
    const R = DL, P = pages[0]
    steps(R, t, [...T.stepsA], 3)
    listbox(dlList, dlListHL, dlListOptR, t, T.listA, T.pickA, 4, dlListR)
    const picked = t >= T.pickA + 0.12
    dlTypeV.textContent = picked ? 'Address Change' : 'Select…'; dlTypeSel.classList.toggle('ph', !picked)
    dlTypeSel.style.borderColor = t >= T.listA && t < T.pickA + 0.3 ? '#9B1B30' : 'var(--bdr)'
    dlAddrV.forEach((v, i) => { const a = seg(t, T.prefillA + i * 0.08, T.prefillA + i * 0.08 + 0.3, E.outExpo); v.style.display = 'inline-block'; v.style.transform = `translateX(${(1 - a) * 18}px)`; v.style.opacity = a })
    const sw = seg(t, T.ackA - 0.3, T.ackA, E.inOut)
    R.formIn.style.clipPath = `inset(0 0 ${sw * 100}% 0)`; R.formIn.style.transform = `translateY(${-sw * 24}px)`; show(R.formIn, sw < 1)
    show(R.ackIn, t >= T.ackA - 0.2)
    R.ackTile.style.transform = `scale(${seg(t, T.ackA - 0.08, T.ackA + 0.3, E.appPop)})`
    rise(R.ackTitle, t, T.ackA - 0.04); rise(R.ackDesc, t, T.ackA + 0.06); rise(R.refBox, t, T.ackA - 0.1); rise(R.hand, t, T.handA - 0.1)
    const st = seg(t, T.ackA, T.ackA + 0.32, E.outExpo); R.refNum.style.transform = `scale(${lerp(1.18, 1, st)})`; R.refNum.style.clipPath = `inset(0 ${(1 - seg(t, T.ackA, T.ackA + 0.18)) * 100}% 0 0)`
    drawQR(R, t, T.qrA, T.qrA + 0.5)
    const hb = seg(t, T.handA + 0.25, T.handA + 0.5, E.out)
    R.handBtn.style.borderColor = hb > 0.5 ? '#2563EB' : 'var(--bdr)'; R.handBtn.style.boxShadow = `0 0 0 ${3 * hb}px rgba(37,99,235,${0.18 * hb})`
    if (t > T.stepsA[0] - 0.3 && t < T.ackA) {
      const n = T.stepsA.filter((x) => x <= t).length
      const cur = Math.min(6, 3 + n), prev = Math.min(6, 2 + n)
      const tPrev = n === 0 ? T.stepsA[0] - 0.3 : T.stepsA[n - 1], tNext = T.stepsA[Math.min(3, n)]
      const fx = n >= 4 ? P.stepC[6][0] : lerp(P.stepC[prev][0], P.stepC[cur][0], seg(t, tPrev, tNext, E.inOut))
      drawThread([[P.stepC[0][0], P.stepC[0][1] + 36], [Math.max(P.stepC[0][0] + 1, fx), P.stepC[0][1] + 36]], { width: 4, alpha: 1 - seg(t, T.ackA - 0.25, T.ackA) })
    }
  }
  // ── B · Ration Card ──
  {
    const R = RCd
    steps(R, t, [T.pickB + 0.3, T.chooseB + 0.35, T.ackB - 0.4, T.ackB - 0.25], 2)
    const phase2 = seg(t, T.listB - 0.35, T.listB - 0.05, E.inOut)
    rcDocs.style.clipPath = `inset(0 0 ${phase2 * 100}% 0)`; show(rcDocs, phase2 < 1)
    rcApp.style.clipPath = `inset(${(1 - phase2) * 100}% 0 0 0)`; show(rcApp, phase2 > 0)
    const pk = seg(t, T.walletB, T.walletB + 0.24, E.outExpo) * (1 - seg(t, T.pickB + 0.2, T.pickB + 0.38, E.in))
    show(picker, pk > 0.001); picker.style.transform = `scale(${lerp(0.94, 1, pk)})`; picker.style.opacity = pk
    resBtn.style.background = t >= T.walletB - 0.15 && t < T.walletB + 0.1 ? '#9B1B3014' : '#fff'
    resBtn.style.transform = `scale(${1 - 0.05 * Math.sin(Math.PI * seg(t, T.walletB - 0.15, T.walletB + 0.05))})`
    const hlp = seg(t, T.walletB + 0.2, T.pickB - 0.1, E.inOut)
    pickerHL.style.top = px(pickerItemR[0].y - pickerR.y); pickerHL.style.background = t >= T.pickB ? '#9B1B3024' : `rgba(155,27,48,${0.06 * hlp})`
    const att = t >= T.pickB + 0.15
    resSlot.classList.toggle('ok', att); show(resEmpty, !att); show(resFull, att)
    resFull.style.transform = `translateX(${(1 - seg(t, T.pickB + 0.15, T.pickB + 0.45, E.outExpo)) * 16}px)`
    resChip.textContent = att ? 'Attached' : 'Required'; resChip.style.color = att ? '#059669' : '#DC2626'; resChip.style.background = att ? '#05966918' : '#DC262618'
    rcCnt.textContent = att ? '3/3 attached' : '2/3 attached'
    listbox(rcList, rcListHL, rcListOptR, t, T.listB, T.chooseB, 0, rcListR)
    const chosen = t >= T.chooseB + 0.12
    rcTypeV.textContent = chosen ? 'New Family Card' : 'Select…'; rcTypeSel.classList.toggle('ph', !chosen)
    rcTypeSel.style.borderColor = t >= T.listB && t < T.chooseB + 0.3 ? '#9B1B30' : 'var(--bdr)'
    const sw = seg(t, T.ackB - 0.3, T.ackB, E.inOut)
    R.formIn.style.clipPath = `inset(0 0 ${sw * 100}% 0)`; R.formIn.style.transform = `translateY(${-sw * 24}px)`; show(R.formIn, sw < 1)
    show(R.ackIn, t >= T.ackB - 0.2)
    R.ackTile.style.transform = `scale(${seg(t, T.ackB - 0.08, T.ackB + 0.3, E.appPop)})`
    rise(R.ackTitle, t, T.ackB - 0.04); rise(R.ackDesc, t, T.ackB + 0.06); rise(R.refBox, t, T.ackB - 0.1); rise(R.hand, t, T.handB - 0.1)
    const st = seg(t, T.ackB, T.ackB + 0.32, E.outExpo); R.refNum.style.transform = `scale(${lerp(1.18, 1, st)})`; R.refNum.style.clipPath = `inset(0 ${(1 - seg(t, T.ackB, T.ackB + 0.18)) * 100}% 0 0)`
    drawQR(R, t, T.qrB, T.qrB + 0.5)
    const hb = seg(t, T.handB + 0.25, T.handB + 0.5, E.out)
    R.handBtn.style.borderColor = hb > 0.5 ? '#2563EB' : 'var(--bdr)'; R.handBtn.style.boxShadow = `0 0 0 ${3 * hb}px rgba(37,99,235,${0.18 * hb})`
  }
  // ── C · Birth Certificate ──
  {
    const R = BCd
    steps(R, t, [...T.stepsC, T.ackC - 0.2], 2)
    bcV.forEach((v, i) => { const a = seg(t, T.formC + 0.2 + i * 0.09, T.formC + 0.5 + i * 0.09, E.outExpo); v.style.display = 'inline-block'; v.style.transform = `translateX(${(1 - a) * 18}px)`; v.style.opacity = a })
    const sw = seg(t, T.ackC - 0.3, T.ackC, E.inOut)
    R.formIn.style.clipPath = `inset(0 0 ${sw * 100}% 0)`; R.formIn.style.transform = `translateY(${-sw * 24}px)`; show(R.formIn, sw < 1)
    show(R.ackIn, t >= T.ackC - 0.2)
    R.ackTile.style.transform = `scale(${seg(t, T.ackC - 0.08, T.ackC + 0.3, E.appPop)})`
    rise(R.ackTitle, t, T.ackC - 0.04); rise(R.ackDesc, t, T.ackC + 0.06); rise(R.refBox, t, T.ackC - 0.1)
    const st = seg(t, T.ackC, T.ackC + 0.32, E.outExpo); R.refNum.style.transform = `scale(${lerp(1.18, 1, st)})`; R.refNum.style.clipPath = `inset(0 ${(1 - seg(t, T.ackC, T.ackC + 0.18)) * 100}% 0 0)`
    drawQR(R, t, T.ackC + 0.08, T.ackC + 0.5)
    // spine
    const headY = (tt) => tt < T.spine ? ulY : tt < T.approval ? lerp(ulY, stageY(6), seg(tt, T.spine, T.approval, E.inOut)) : tt < T.confirm ? stageY(6) : lerp(stageY(6), stageY(11), seg(tt, T.confirm, T.stages2[5] + 0.05, E.inOut))
    if (t >= T.ackC && t < T.iris) {
      const ul = seg(t, T.ackC + 0.08, T.ackC + 0.4, E.out) * uUnderEnd, hy = headY(t)
      const blend = seg(t, T.spine, T.spine + 0.25, E.out)
      const u = t < T.spine ? ul : Math.max(uUnderEnd, uAtY(hy) * blend + uUnderEnd * (1 - blend))
      drawThread(slice(spineRoute, 0, Math.max(0.0005, u), spineC), { width: 4, tip: t < T.stages2[5] + 0.1, alpha: (1 - seg(t, T.cert + 0.2, T.seat, E.inOut) * 0.6) * (1 - seg(t, T.D - 0.4, T.D, E.inOut)) })
    }
    stg.forEach((s, i) => {
      const vis = t >= T.spine - 0.05 && t < T.D; show(s.e, vis); if (!vis) return
      const appear = seg(t, T.spine + i * 0.06, T.spine + i * 0.06 + 0.3, E.out), doneT = i < 6 ? T.stages[i] : T.stages2[i - 6]
      const d = t >= doneT, pop = d ? seg(t, doneT, doneT + 0.22, E.appPop) : 1, ap = i === 6 && t > T.approval - 0.3
      const html = d ? icon('check', 12, '#fff', 3.2) : ''
      if (s.d.dataset.h !== html) { s.d.innerHTML = html; s.d.dataset.h = html }
      Object.assign(s.d.style, { background: d ? (i === 11 ? '#9B1B30' : '#059669') : '#fff', borderColor: d ? (i === 11 ? '#9B1B30' : '#059669') : ap ? '#9B1B30' : '#D7DAE0', transform: `scale(${pop})` })
      s.l.style.color = d ? '#1C1C1E' : ap ? '#9B1B30' : '#9CA3AF'; s.l.style.fontWeight = d || i === 6 ? 700 : 600
      s.e.style.opacity = appear * (1 - seg(t, T.cert + 0.3, T.seat + 0.2)); s.e.style.transform = `translateX(${(1 - appear) * 12}px)`
    })
    const tagVis = t >= T.spine + 0.1 && t < T.cert + 0.12
    show(tag, tagVis)
    if (tagVis) {
      const fp = seg(t, T.flap, T.flapEnd), nflip = Math.floor(fp * 3.999)
      tag.textContent = TAG_A.split('').map((ch, i) => (i < 3 && i < nflip) ? TAG_C[i] : ch).join('')
      const a = seg(t, T.spine + 0.1, T.spine + 0.35, E.out)
      Object.assign(tag.style, { left: px(SPX - 236), top: px(headY(t) - 16), opacity: a, transform: `translateX(${(1 - a) * 20}px) rotateX(${Math.sin(fp * Math.PI * 3) * 50}deg)`, background: t >= T.flapEnd ? '#059669' : '#9B1B30' })
    }
    const ofVis = t >= T.officer && t < T.cert + 0.3; show(officer, ofVis)
    if (ofVis) {
      const a = seg(t, T.officer, T.officerEnd, E.outExpo), out = seg(t, T.stages2[2], T.cert + 0.2, E.inOut)
      officer.style.transform = `translateX(${(1 - a) * 160}px)`; officer.style.opacity = a * (1 - out)
      cfm.style.transform = `scale(${1 - 0.07 * Math.sin(Math.PI * seg(t, T.confirm - 0.04, T.confirm + 0.1))})`
      cfm.style.background = t >= T.confirm ? '#7A1526' : '#9B1B30'; cfm.textContent = t >= T.confirm + 0.12 ? 'Confirmed' : 'Confirm'
    }
    if (t >= T.confirm && t < T.stages2[5] + 0.2) {
      const p1 = seg(t, T.confirm, T.confirm + 0.14, E.in), c0 = ctr(cfmR)
      spark(P2S(t < T.confirm + 0.14 ? [lerp(c0[0], SPX, p1), lerp(c0[1], stageY(6), p1)] : [SPX, headY(t)]))
    }
    const lkOn = t >= T.cert + 0.1 && t < T.D + 0.3
    docs.forEach((d, i) => { if (i < 4) { show(d, lkOn); const a = seg(t, T.cert + 0.12 + i * 0.04, T.cert + 0.42 + i * 0.04, E.out); d.style.opacity = a; d.style.transform = `translateY(${(1 - a) * 24}px)` } })
    show(lockTitle, lkOn); lockTitle.style.opacity = seg(t, T.cert + 0.2, T.cert + 0.45); lockCnt.textContent = t >= T.count ? '5' : '4'
    show(cert, t >= T.cert && t < T.D + 0.3)
    if (t >= T.cert) {
      const p = seg(t, T.cert, T.seat, E.inOutExpo), seatPop = seg(t, T.seat, T.seat + 0.25, E.appPop)
      Object.assign(cert.style, { left: px(lerp(certFrom[0], certR.x, p)), top: px(lerp(certFrom[1], certR.y, p) - Math.sin(p * Math.PI) * 120), transform: `scale(${lerp(0.62, 1, p) * (t >= T.seat ? lerp(1.04, 1, seatPop) : 1)}) rotate(${Math.sin(p * Math.PI) * -4}deg)`, transformOrigin: '0 0', boxShadow: `0 ${lerp(30, 0, seatPop)}px ${lerp(60, 0, seatPop)}px rgba(30,4,10,${lerp(0.22, 0, seatPop)})` })
    }
  }
  // ── D · Schemes → tracked prerequisite ──
  {
    mastS.tabs.Schemes.style.transform = `scaleX(1)`
    schCards.forEach((c, k) => {
      const a = seg(t, T.page + k * 0.05, T.page + 0.4 + k * 0.05, E.outExpo)
      c.e.style.opacity = a; c.e.style.transform = `translateY(${(1 - a) * 22}px)`
      const b = seg(t, T.bars + k * 0.06, T.bars + 0.6 + k * 0.06, E.outExpo)
      c.bar.style.width = `${c.m * b}%`; c.pc.textContent = `${Math.round(c.m * b)}%`
      const f = k === 2 ? seg(t, T.focusD, T.focusD + 0.3, E.out) : 0
      c.e.style.boxShadow = f > 0 ? `0 0 0 ${2.5 * f}px rgba(212,168,67,${f}), 0 22px 50px rgba(30,4,10,${0.18 * f})` : 'none'
      c.e.style.filter = k !== 2 && t > T.focusD ? `saturate(${1 - 0.6 * seg(t, T.focusD, T.focusD + 0.4)})` : 'none'
    })
    const dv = seg(t, T.detail, T.detail + 0.4, E.outExpo) * (1 - seg(t, T.track - 0.2, T.track + 0.1, E.in))
    show(schDetail, dv > 0.001)
    schDetail.style.clipPath = `inset(0 0 ${(1 - dv) * 100}% 0)`; schDetail.style.transform = `translateY(${(1 - dv) * 40}px)`
    const hw = seg(t, T.howto, T.howto + 0.3, E.out)
    howH1.style.background = `rgba(212,168,67,${0.22 * hw})`; howH1.style.borderRadius = '6px'; howH1.style.padding = `2px ${6 * hw}px`
    const tv = seg(t, T.track - 0.05, T.track + 0.35, E.outExpo); show(tracker, tv > 0.001); show(icTimeline, tv > 0.001)
    tracker.style.opacity = tv; tracker.style.transform = `translateY(${(1 - tv) * 30}px)`
    icTimeline.style.opacity = seg(t, T.track + 0.1, T.track + 0.45); icTimeline.style.transform = `translateX(${(1 - seg(t, T.track + 0.1, T.track + 0.45, E.outExpo)) * 20}px)`
    const dd = seg(t, T.days, T.days + 0.35, E.out)
    daysEl.style.background = `rgba(217,119,6,${0.09 * dd})`; daysEl.style.borderRadius = '10px'; daysEl.style.padding = `${14 * dd}px ${12 * dd}px`
  }

  // ── the register rail: each chapter's reference joins the citizen's record ──
  {
    const windows = [[T.dockA - 0.25, T.B - 0.05], [T.dockB - 0.25, T.C - 0.15], [T.dockC - 0.3, T.completeC + 0.7], [T.dockD - 0.3, T.reg]]
    let a = 0
    for (const [w0, w1] of windows) a = Math.max(a, seg(t, w0, w0 + 0.35, E.outExpo) * (1 - seg(t, w1 - 0.3, w1, E.in)))
    const regOn = t >= T.reg
    show(rail, (a > 0.001 && !regOn) || (regOn && t < T.regEnd))
    // newest first: BC, RC, DL insert at the top as each chapter docks; IC and CC were already there
    const lands = [T.dockCEnd, T.dockBEnd, T.dockAEnd, -1, -1]
    let y = 0
    railRows.forEach((r, i) => {
      const L = lands[i], hgt = L < 0 ? 1 : seg(t, L - 0.12, L + 0.18, E.outExpo)
      r.style.top = px(y); r.style.height = px(ROW_H * hgt); r.style.opacity = L < 0 ? 1 : seg(t, L, L + 0.15)
      r.style.background = L > 0 && t >= L && t < L + 0.8 ? `rgba(212,168,67,${0.16 * (1 - seg(t, L + 0.3, L + 0.8))})` : (i === 3 && t >= T.dockD ? `rgba(217,119,6,${0.1 * seg(t, T.dockD, T.dockD + 0.3)})` : 'transparent')
      y += ROW_H * hgt
    })
    railBody.style.height = px(y)
    railCount.textContent = `All · ${2 + (t >= T.dockAEnd) + (t >= T.dockBEnd) + (t >= T.dockCEnd)}`
    const done = t >= T.completeC
    railChips[0].textContent = done ? 'Completed' : 'Submitted'; railChips[0].className = `chip ${done ? 'ok' : 'warn'} st`
    railChips[3].style.boxShadow = t >= T.dockD ? `0 0 0 ${3 * seg(t, T.dockD, T.dockD + 0.3)}px rgba(217,119,6,.22)` : 'none'
    if (!regOn) rail.style.transform = `translateX(${(1 - a) * 720}px) scale(${RAIL_S})`
    // fly tags: reference → rail row
    const flights = [[T.dockA, T.dockAEnd, 'APP-2026-DL-44822', pages[0].refR, 0], [T.dockB, T.dockBEnd, 'APP-2026-RC-44823', pages[1].refR, 1], [T.dockC, T.dockCEnd, 'APP-2026-BC-44824', null, 2]]
    let fl = null
    for (const f of flights) if (t >= f[0] && t < f[1] + 0.05) fl = f
    show(flyTag, !!fl)
    if (fl) {
      const [t0, t1, txt, refR, row] = fl
      const p = seg(t, t0, t1, E.inOutExpo)
      const from = refR ? P2S([refR.x, refR.y + refR.h / 2]) : P2S([certR.x + 20, certR.y + 70])
      const rr = rail.getBoundingClientRect(), to = [rr.left + 18 * RAIL_S, rr.top + (RAIL_HEAD + ROW_H / 2) * RAIL_S]
      flyTag.textContent = txt
      Object.assign(flyTag.style, { left: px(lerp(from[0], to[0], p)), top: px(lerp(from[1], to[1], p) - 18 - Math.sin(p * Math.PI) * 60), transform: `scale(${lerp(1.1, 0.8, p)})`, opacity: 1 - seg(p, 0.85, 1) })
    }
  }

  // ── ACT IV · register → one point → iris into Mylapore ──
  {
    const on = t >= T.reg && t < T.iris + 0.1
    show(regp, on)
    if (on) {
      const p = seg(t, T.reg, T.regEnd, E.inOutExpo), g = seg(t, T.gather, T.iris, E.inExpo)
      const r0 = railR, r1 = regR
      Object.assign(regp.style, { left: px(lerp(r0.x, r1.x, p)), top: px(lerp(r0.y, r1.y, p)), width: px(lerp(r0.w, r1.w, p)), opacity: 1 - seg(t, T.gather + 0.1, T.iris, E.in), transform: `scale(${lerp(1, 0.06, g)})`, transformOrigin: `${IRIS_P[0] - r1.x}px ${IRIS_P[1] - r1.y}px` })
      regRows.forEach((r, i) => { const a = seg(t, T.regEnd - 0.2 + i * 0.05, T.regEnd + 0.15 + i * 0.05, E.out); r.style.opacity = a })
    }
    const dim = seg(t, T.reg, T.regEnd, E.out) * (1 - seg(t, T.iris, T.irisEnd))
    uiwrap.style.filter = dim > 0.01 ? `brightness(${1 - 0.4 * dim}) blur(${3 * dim}px)` : 'none'
  }
  if (t >= T.iris && t < T.irisEnd + 0.01 && mapInfo) {
    const cam = mapInfo.cam, k = logLerp(60, 1, seg(t, T.iris, T.irisEnd, E.inOutExpo)), pp = seg(t, T.iris, T.irisEnd)
    const ring = resample(mylRing, 90).map((g) => { const s = toScreen(cam, g); return [IRIS_P[0] + (s[0] - mapInfo.mS[0]) * k + (mapInfo.mS[0] - IRIS_P[0]) * pp, IRIS_P[1] + (s[1] - mapInfo.mS[1]) * k + (mapInfo.mS[1] - IRIS_P[1]) * pp] })
    uiwrap.style.clipPath = `polygon(${ring.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',')})`
  } else uiwrap.style.clipPath = 'none'

  { // MLA plate — the same record, counted at constituency level
    const vis = t >= T.plate - 0.02 && t < T.pullOut + 0.6 && mapInfo
    show(plate, !!vis)
    if (vis) {
      const ms = mapInfo.mS, up = seg(t, T.plate, T.plateEnd, E.outExpo), down = seg(t, T.fold, T.fold + 0.32, E.inExpo)
      Object.assign(plate.style, { left: px(ms[0] - 96), top: px(ms[1] - 74 - PLATE_H), transform: `rotateX(${lerp(88, 0, up) + lerp(0, 88, down)}deg) scale(1.32)`, transformOrigin: '0 100%', opacity: 1 - seg(t, T.fold + 0.22, T.fold + 0.36) })
      pills.forEach((p, i) => { const at = [T.pills[0], T.pills[1], T.pills[2], T.pills[3], 99][i], on = t >= at && i !== 2 || (i === 2 && t >= T.pills[2]); const pop = seg(t, at, at + 0.2, E.appPop); Object.assign(p.style, { background: on && i !== 4 ? '#9B1B30' : '#fff', color: on && i !== 4 ? '#fff' : 'var(--txt2)', borderColor: on && i !== 4 ? '#9B1B30' : 'var(--bdr)', transform: `scale(${on ? lerp(0.9, 1, pop) : 1})` }) })
      const roll = (t0) => seg(t, t0, t0 + 0.28, E.outExpo)
      odo[0](4233 + roll(T.rolls[0]) + roll(T.rolls[1]) + roll(T.rolls[2]))
      odo[1](3867 + roll(T.rollDone))
      odo[2](298 + roll(T.rollPend) + roll(T.rollPend + 0.3125))
    }
  }

  { // finale: the thread draws Mylapore → the right column; question; answer; sign-off
    if (t >= T.line && mapInfo) {
      const A = mapInfo.mS, B = [1012, 336], E2 = [1012 + 56, 336]
      const route = [A, ...Array.from({ length: 30 }, (_, k) => { const u = (k + 1) / 31; return [lerp(A[0], B[0], u) + Math.sin(u * Math.PI) * 30, lerp(A[1], B[1], E.inOut(u))] }), B, E2]
      const rc = cumul(route), pDraw = seg(t, T.line, T.line + 0.24, E.inOut), pTail = seg(t, T.line + 0.16, T.lineEnd, E.inOut)
      const uS = pTail * (1 - 56 / rc.at(-1)); drawThread(slice(route, uS, Math.max(uS + 0.001, pDraw), rc), { width: 4, screen: true, tip: pDraw < 1 })
    }
    const sOn = t >= T.sign - 0.05; show(sign, sOn)
    if (sOn) {
      sign.style.top = px(640)
      const sp = seg(t, T.sign, T.sign + 0.55, E.appPop), glow = Math.exp(-Math.pow((t - (T.sign + 0.5)) / 0.35, 2))
      signSeal.style.transform = `scale(${lerp(0.7, 1, sp)})`; signSeal.style.opacity = seg(t, T.sign, T.sign + 0.12)
      signSeal.style.filter = `drop-shadow(0 0 ${8 + 12 * glow}px rgba(212,168,67,${0.3 + 0.3 * glow}))`
      const ru = (e, t0) => { e.style.transform = `translateY(${(1 - seg(t, t0, t0 + 0.55, E.outExpo)) * 110}%)` }
      ru(signW, T.signWord); ru(signT, T.signTa)
    }
  }

  // ── kinetic type ──
  playHead(Q.q1, t, T.q1, T.q1Out); playHead(Q.q2, t, T.q2, T.q2Out); playHead(Q.q3, t, T.q3, T.q3Out)
  playHead(Q.qA, t, T.qA, T.qAOut); playHead(Q.qB, t, T.qB, T.qBOut); playHead(Q.qC, t, T.qC, T.qCOut)
  playHead(Q.q4, t, T.q4, T.q4Out); playHead(Q.qD, t, T.qD, T.qDOut); playHead(Q.q5, t, T.q5, T.q5Out)
  playHead(Q.q6, t, T.q6, T.q6Out); playHead(Q.cb, t, T.callback, T.callbackOut, false); playHead(Q.ans, t, T.answer, 99)

  // ── grade ──
  const light = t >= T.snap + 0.2 && t < T.iris + 0.25
  vig.style.background = `radial-gradient(ellipse 75% 70% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,${light ? 0.16 : 0.55}) 100%)`
  grainC.style.opacity = light ? 0.035 : 0.06
  gx.setTransform(1, 0, 0, 1, 0, 0)
  const r = mulberry32(frame + 1), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256)
  gx.setTransform(DPR * 1.5, 0, 0, DPR * 1.5, -ox, -oy); gx.fillStyle = gx.createPattern(grainTile, 'repeat'); gx.fillRect(0, 0, W * DPR, H * DPR)
  flash.style.opacity = 0
  await new Promise((res) => requestAnimationFrame(() => res()))
}
window.__ready = true

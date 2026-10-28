// VETRI TAMIL NADU — "One Thread". Every frame is seek(t): a pure function of time.
import { clamp, lerp, inv, seg, kf, E, spring, mulberry32, noise1, h } from './lib.js'
import { parsePath, resample, mix, cumul, slice, at } from './geom.js'
import { T, COPY, S16, BEAT } from './timeline.js'
import { icon } from './icons.js'

const W = 1920, H = 1080
const DPR = window.devicePixelRatio || 1
const $ = (id) => document.getElementById(id)
const px = (v) => `${v}px`

// ── assets ───────────────────────────────────────────────────────────────────
const geo = await (await fetch('../assets/geo.json')).json()
const qrSvg = await (await fetch('../assets/qr_ec.svg')).text()
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

function el(parent, cls, style = {}, html) {
  const e = h('div', cls, html)
  Object.assign(e.style, style)
  parent.appendChild(e)
  return e
}
const show = (e, on) => { const v = on ? '' : 'none'; if (e.style.display !== v) e.style.display = v }

// ── geography ────────────────────────────────────────────────────────────────
const MYL = geo.chennai.find((a) => a.no === 25)
const M = MYL.c // Mylapore centroid in geo units
const mylRing = parsePath(MYL.d).sort((a, b) => b.length - a.length)[0]
const mylPath = new Path2D(MYL.d)
const chennaiPaths = geo.chennai.map((a) => ({ no: a.no, p: new Path2D(a.d) }))
const statePath = new Path2D(geo.state)
const districts = geo.districts.map((d) => {
  const rings = parsePath(d.d)
  const len = rings.reduce((s, r) => s + cumul(r).at(-1), 0)
  const dist = Math.hypot(d.c[0] - M[0], d.c[1] - M[1])
  return { name: d.name, p: new Path2D(d.d), len, dist }
})
const maxDistrictDist = Math.max(...districts.map((d) => d.dist))

// villages: ignition time from a distance wavefront centred on Mylapore
const IGN_R = 980
// wavefront radius r(u) = R·(0.25u + 0.75·(1-(1-u)²)) → invert numerically
const wave = (u) => 0.25 * u + 0.75 * (1 - (1 - u) * (1 - u))
const invWave = (v) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (wave(m) < v) lo = m; else hi = m } return (lo + hi) / 2 }
const vil = geo.villages.map(([x, y]) => {
  const d = Math.hypot(x - M[0], y - M[1])
  return { x, y, d, ti: T.impact + (T.igniteEnd - T.impact) * invWave(clamp(d / IGN_R)) }
}).sort((a, b) => a.ti - b.ti)
const VX = new Float32Array(vil.map((v) => v.x)), VY = new Float32Array(vil.map((v) => v.y))
const VT = new Float32Array(vil.map((v) => v.ti)), VD = new Float32Array(vil.map((v) => v.d))
const hashV = new Float32Array(vil.length).map((_, i) => mulberry32(i * 7919 + 13)())

function sprite(rgb, size, soft) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const g = c.getContext('2d'), r = size / 2
  const gr = g.createRadialGradient(r, r, 0, r, r, r)
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(soft, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr; g.fillRect(0, 0, size, size)
  return c
}
const SP_SETTLE = sprite('242,213,138', 32, 0.18)
const SP_FLASH = sprite('255,246,220', 32, 0.3)

// ── map camera (geo units → screen px) ───────────────────────────────────────
const FULL = { s: 0.98, c: [368, 500] }
function camAt(Mscreen, s) { return { s, c: [M[0] - (Mscreen[0] - 960) / s, M[1] - (Mscreen[1] - 540) / s] } }
const logLerp = (a, b, p) => Math.exp(lerp(Math.log(a), Math.log(b), p))
const toScreen = (cam, g) => [(g[0] - cam.c[0]) * cam.s + 960, (g[1] - cam.c[1]) * cam.s + 540]
const mScreenFull = toScreen(FULL, M)

// UI-world camera (page px → screen px)
let ui = { cx: 960, cy: 540, z: 1 }
const P2S = (p) => [(p[0] - ui.cx) * ui.z + 960, (p[1] - ui.cy) * ui.z + 540]

// ═════════════════════════════════════════════════════════════════════════════
// BUILD — rebuilt app UI (geometry from the 3840px captures / src/app/desktop)
// ═════════════════════════════════════════════════════════════════════════════

// page ground: the app's #F7F7FA field, revealed at the snap
const ground = el(back, 'abs', { left: '-3000px', top: '117px', width: '9000px', height: '9000px', background: 'var(--bgAlt)' })

function masthead(parent, y0, opts = {}) {
  const m = el(parent, 'mast', { top: px(y0) })
  const strip = el(m, 'strip', {}, `<span></span><span style="display:flex;gap:22px;align-items:center">${icon('languages', 14, 'rgba(255,255,255,.85)', 1.8)}<span class="ta" style="margin-left:-14px">தமிழ்</span>${icon('moon', 13, 'rgba(255,255,255,.85)')}<span style="margin-left:-14px">Dark</span></span>`)
  const bar = el(m, 'bar', {}, `
    <img src="${SEAL}" style="width:46px;height:46px;object-fit:contain">
    <div><div class="word">Vetri Tamil Nadu</div><div class="sub"><span class="ta">வெற்றி தமிழ்நாடு</span> · e-Sevai Digital Services</div></div>
    <div class="search">${icon('search', 16, 'rgba(255,255,255,.6)')}Search services, certificates, schemes…</div>
    <div style="flex:1"></div>
    <div class="spk" style="width:40px;height:40px;border-radius:12px;background:var(--sec);display:flex;align-items:center;justify-content:center">${icon('sparkles', 19, '#3A2A05', 1.9)}</div>
    <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;position:relative">${icon('bell', 18, '#fff')}<span style="position:absolute;top:-6px;right:-6px;background:var(--sec);color:#3A2A05;font-size:10px;font-weight:800;border-radius:9px;padding:1px 5px">2</span></div>
    <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:6px 12px 6px 6px">
      <div style="width:30px;height:30px;border-radius:9px;background:var(--sec);color:#3A2A05;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">CK</div>
      <div><div style="color:#fff;font-size:13px;font-weight:700">Chandramoulishwarar</div><div style="color:rgba(255,255,255,.66);font-size:10.5px">TN-2024-XXXX-8842</div></div>
      ${icon('chevron-down', 14, 'rgba(255,255,255,.8)')}
    </div>`)
  const tabs = [['layout-grid', 'Dashboard'], ['file-text', 'Services'], ['timer', 'Applications'], ['wallet', 'Digital Locker'], ['triangle-alert', 'Grievances'], ['sparkles', 'Schemes'], ['chart-column', 'Transparency'], ['life-buoy', 'Help']]
  const nav = el(m, 'nav', {}, tabs.map(([ic, l]) => `<div class="tab${opts.active === l ? ' on' : ''}">${icon(ic, 16, opts.active === l ? '#9B1B30' : '#6B7280', opts.active === l ? 2.2 : 1.8)}${l}</div>`).join(''))
  return { m, strip, bar, nav }
}

// ── Region A · Ask Vetri ─────────────────────────────────────────────────────
const mastA = masthead(back, 0)
const pageTitleA = el(back, 'abs', { left: '136px', top: '192px', fontSize: '30px', fontWeight: 800, letterSpacing: '-.6px', color: 'var(--txt)' }, 'Ask Vetri')
const chat = el(back, 'panel abs', { left: '136px', top: '252px', width: '1000px', height: '588px' })
el(chat, 'abs', { left: 0, right: 0, bottom: 0, height: '78px', borderTop: '1px solid var(--bdr)', background: 'var(--bgAlt)', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px' },
  `<div style="flex:1;height:46px;border:1px solid var(--bdr);border-radius:11px;background:#fff;display:flex;align-items:center;padding:0 16px;color:var(--txt3);font-size:13.5px">Ask about a service, application, document or scheme…</div><div style="height:46px;border-radius:11px;background:#9B1B30;opacity:.55;color:#fff;display:flex;align-items:center;gap:8px;padding:0 20px;font-size:14px;font-weight:600">Send ${icon('send', 15, '#fff')}</div>`)
const rail = el(back, 'abs', { left: '1168px', top: '252px', width: '616px' })
el(rail, 'panel', {}, `<div class="panel-h">Suggested for you</div><div style="padding:14px 16px;display:grid;gap:10px">${[
  'Income Certificate (IC-TN-2024-9912) has expired — renewal recommended',
  'Marriage registration and related updates are common next steps at this age',
  'Property-tax incentive window is OPEN — pay this month for the 5% rebate',
  'Eligible for 9 welfare schemes based on your profile',
].map((s) => `<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--bdr);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt)">${icon('lightbulb', 15, '#D4A843')}${s}</div>`).join('')}</div>`)
el(rail, 'panel', { marginTop: '16px' }, `<div class="panel-h">What Vetri can see</div><div style="padding:14px 18px;font-size:13px;line-height:1.6;color:var(--txt2)">Your verified profile, your applications and their stages, the documents in your locker, and the welfare catalogue. Answers are generated from your own records — nothing is shared outside the platform.</div>`)

// the real reply bubble (final state of the FLIP)
const rbub = el(front, 'rbub', { left: '156px', top: '342px', width: '749px' }, `
  <div class="h">சொத்து வாங்குதல் — தேவையான சேவைகளை வரிசைப்படுத்தியுள்ளேன்:</div>
  <div class="en2">1. Encumbrance Certificate (₹116 + ₹5/yr, 2–5 working days) — due diligence first — search back to 1987 before you register 2. Chitta / Patta Extract (Free, Instant) 3. Patta Transfer (₹60 (transfer) · ₹25 (extracts), Full/Joint: 15 days · Subdivision: 30 days) — mutation after the registered sale deed 4. Property Tax Payment (Calculated dynamically, Instant) — name change follows the patta mutation 5. Water Charges (Fixed tax + volumetric charge, Instant) — new connection / name transfer after ownership is recorded Also check: First-time buyer stamp-duty concessions where applicable. I sequenced these by dependency — start from the top. Your Wallet already holds 4 verified documents I can reuse across these.</div>
  <div class="acts">${['Encumbrance Certificate', 'Chitta / Patta Extract', 'Patta Transfer', 'Property Tax Payment'].map((l) => `<div class="act">${l}${icon('arrow-right', 13, 'currentColor', 2)}</div>`).join('')}</div>`)
const rbH = rbub.querySelector('.h'), rbEn = rbub.querySelector('.en2'), chips = [...rbub.querySelectorAll('.act')]

// the citizen's question: bubble (born from the Mylapore point)
const ubub = el(front, 'ubub', { zIndex: 6 }, 'I bought land')

// the five services (one DOM element each, it lives through bar 2 → bar 3 → FLIP)
const SVC = [
  { name: 'Encumbrance Certificate', ta: 'வில்லங்கச் சான்றிதழ்', meta: '₹116 + ₹5/yr · 2–5 working days', ic: 'scroll-text' },
  { name: 'Chitta / Patta Extract', ta: 'சிட்டா / பட்டா சாறு', meta: 'Free · Instant', ic: 'scale' },
  { name: 'Patta Transfer', ta: 'பட்டா மாற்றம்', meta: '₹60 · Full/Joint: 15 days', ic: 'scale' },
  { name: 'Property Tax Payment', ta: 'சொத்து வரி', meta: 'Calculated dynamically · Instant', ic: 'building-2' },
  { name: 'Water Charges', ta: 'குடிநீர்க் கட்டணம்', meta: 'Fixed tax + volumetric charge', ic: 'map-pin' },
]
const tiles = SVC.map((s, i) => {
  const t = el(front, 'svc', {}, `<div class="no">${i + 1}</div><div class="ic">${icon(s.ic, 23, '#9B1B30', 1.8)}</div><div class="tx"><div class="nm">${s.name}</div><div class="ta2">${s.ta}</div><div class="meta">${s.meta}</div></div>`)
  return { el: t, no: t.querySelector('.no'), meta: t.querySelector('.meta'), tx: t.querySelector('.tx'), ic: t.querySelector('.ic') }
})
// scattered positions (bar 2, screen = page) — tile i's top-left
const SCAT = [[1170, 228], [330, 300], [1290, 520], [420, 592], [1060, 724]]
const DEPTS = [['Registration (IGR)', 1250, 186], ['Revenue', 210, 262], ['Local bodies', 300, 716], ['Water board', 1470, 860]]
const depts = DEPTS.map(([t, x, y]) => el(front, 'dept', { left: px(x), top: px(y) }, t))
const mapLabel = el(front, 'maplabel', {}, `Mylapore<span class="ta">மயிலாப்பூர்</span>`)

// hero Tamil (bar 3)
const hero = el(front, 'abs', { left: '136px', top: '262px' }, `
  <div class="kt" style="position:relative"><span class="ln tam" style="font-size:40px;color:#B8922E;font-weight:600"><span class="w">சொத்து</span> <span class="w">வாங்குதல்</span></span></div>
  <div class="kt" style="position:relative;margin-top:10px"><span class="ln tam" style="font-size:68px;color:#1C1C1E;font-weight:700"><span class="w">தேவையான</span> <span class="w">சேவைகளை</span></span></div>
  <div class="kt" style="position:relative;margin-top:-4px"><span class="ln tam" style="font-size:68px;color:#1C1C1E;font-weight:700"><span class="w">வரிசைப்படுத்தியுள்ளேன்</span></span></div>`)
const heroWords = [...hero.querySelectorAll('.w')]
const ROWS_X = 1290, ROWS_Y = 196, ROW_DY = 132, SPINE_X = 1196

// ── Region B · Encumbrance Certificate service → acknowledgement ────────────
const BY = 2000
const mastB = masthead(back, BY, { active: 'Services' })
el(back, 'abs', { left: '136px', top: px(BY + 184), fontSize: '13px', color: 'var(--txt3)' }, `<span style="color:var(--pri);font-weight:600">Home</span> &nbsp;›&nbsp; <span style="color:var(--pri);font-weight:600">Services</span> &nbsp;›&nbsp; Encumbrance Certificate &nbsp;›&nbsp; <b style="color:var(--txt)">Application</b>`)
el(back, 'abs', { left: '136px', top: px(BY + 214), display: 'flex', alignItems: 'center', gap: '14px', whiteSpace: 'nowrap' },
  `<span style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Encumbrance Certificate</span><span class="chip ok">Digital</span><span class="ta" style="font-size:22px;color:var(--txt2);font-weight:500">வில்லங்கச் சான்றிதழ்</span>`)
const STEPS = ['Overview', 'Eligibility', 'Documents', 'Application', 'Review', 'Payment', 'Submit']
const stepper = el(back, 'stepper', { left: '136px', top: px(BY + 282), width: '1648px' }, STEPS.map((s, i) => `<div class="step"><div class="c">${i + 1}</div><span>${s}</span></div>`).join(''))
const stepEls = [...stepper.querySelectorAll('.step')]
const formP = el(back, 'panel abs', { left: '136px', top: px(BY + 372), width: '1000px', height: '330px' })
const formIn = el(formP, 'abs', { inset: 0 })
el(formIn, 'panel-h', {}, 'Property details')
const FIELDS = [['Zone', 'Mylapore'], ['District', 'Chennai'], ['Sub-Registrar Office (SRO)', 'Mylapore'], ['Survey / Subdivision Number', '112/4B']]
const fldGrid = el(formIn, 'abs', { left: '20px', top: '72px', right: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 24px' })
const fldVals = FIELDS.map(([l, v]) => { const f = el(fldGrid, 'fld', {}, `<div class="lb">${l} <span style="color:var(--err)">*</span></div><div class="in"><span class="val">${v}</span></div>`); return f.querySelector('.val') })
const infoP = el(back, 'panel abs', { left: '1168px', top: px(BY + 372), width: '616px' }, `<div class="panel-h">Service information</div><div style="padding:16px 20px;display:grid;gap:14px">${[
  ['clock', 'Processing time', '2–5 working days'], ['indian-rupee', 'Official fee', '₹116 + ₹5/yr'], ['building-2', 'Department', 'Registration Department (IGR) · Sub-Registrar Office (SRO)'],
].map(([ic, k, v]) => `<div style="display:flex;gap:12px">${icon(ic, 16, '#9CA3AF')}<div><div style="font-size:11.5px;color:var(--txt3)">${k}</div><div style="font-size:14px;color:var(--txt);margin-top:3px">${v}</div></div></div>`).join('')}</div>`)

// acknowledgement content (inside the same panel position)
const ackIn = el(formP, 'abs', { inset: 0 })
const ackTile = el(ackIn, 'abs', { left: '22px', top: '30px', width: '52px', height: '52px', borderRadius: '14px', background: '#05966914', display: 'flex', alignItems: 'center', justifyContent: 'center' }, icon('circle-check', 26, '#059669', 2))
const ackTitle = el(ackIn, 'abs', { left: '90px', top: '28px', fontSize: '27px', fontWeight: 800, letterSpacing: '-.5px', color: 'var(--txt)', whiteSpace: 'nowrap' }, 'Application submitted')
const ackDesc = el(ackIn, 'abs', { left: '90px', top: '72px', fontSize: '14.5px', color: 'var(--txt2)', whiteSpace: 'nowrap' }, 'Your application has been received by Registration Department (IGR).')
const refBox = el(ackIn, 'abs', { left: '22px', top: '118px', width: '956px', height: '190px', borderRadius: '14px', background: 'var(--bgAlt)', border: '1px solid var(--bdr)' })
el(refBox, 'abs', { left: '24px', top: '42px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.4px', color: 'var(--txt3)' }, 'REFERENCE NUMBER')
const refNum = el(refBox, 'abs mono', { left: '22px', top: '64px', fontSize: '34px', fontWeight: 600, color: 'var(--pri)', whiteSpace: 'nowrap', transformOrigin: '0 50%' }, 'APP-2026-EC-44822')
const refChip = el(refBox, 'abs', { left: '24px', top: '122px' }, '<span class="chip warn">Submitted</span>')
const qrBox = el(refBox, 'abs', { left: '660px', top: '20px', width: '128px', height: '128px', background: '#fff', padding: '6px', borderRadius: '6px' })
const qrCv = h('canvas'); qrCv.width = qrCv.height = 33 * 8; Object.assign(qrCv.style, { width: '116px', height: '116px', imageRendering: 'pixelated' }); qrBox.appendChild(qrCv)
el(refBox, 'abs', { left: '640px', top: '156px', width: '168px', textAlign: 'center', fontSize: '11px', color: 'var(--txt3)' }, 'Scan to verify this reference')
const qrMods = []
{ // parse the real QR (same payload format the app encodes) into module list
  const m = qrSvg.match(/<path[^>]*stroke="#000000"[^>]*d="([^"]+)"/)
  const d = m ? m[1] : ''
  const re = /M(\d+)\s(\d+(?:\.\d+)?)h(\d+)|m(-?\d+)\s(-?\d+(?:\.\d+)?)h(\d+)/g
  let cx = 0, cy = 0, mm
  while ((mm = re.exec(d))) {
    if (mm[1] !== undefined) { cx = +mm[1]; cy = Math.floor(+mm[2]); for (let k = 0; k < +mm[3]; k++) qrMods.push([cx + k, cy]); cx += +mm[3] }
    else { cx += +mm[4]; cy = Math.floor(cy + +mm[5] + 0.0001); for (let k = 0; k < +mm[6]; k++) qrMods.push([cx + k, cy]); cx += +mm[6] }
  }
  qrMods.sort((a, b) => a[1] - b[1] || a[0] - b[0])
}
const qg = qrCv.getContext('2d')

// ── workflow spine ───────────────────────────────────────────────────────────
const STAGES = ['Submitted', 'Document Verification', 'Officer Assigned', 'Department Queue', 'Inspection', 'Remarks', 'Approval', 'Digital Signature', 'Certificate Generation', 'Delivered to Wallet', 'Citizen Notified', 'Completed']
const SPX = 980, SP0 = BY + 960, SPD = 104
const stageY = (i) => SP0 + i * SPD
const stg = STAGES.map((s, i) => {
  const e = el(front, 'stg', { left: px(SPX - 11), top: px(stageY(i) - 11) }, `<div class="d"></div><div class="l">${s}</div>`)
  return { e, d: e.querySelector('.d'), l: e.querySelector('.l') }
})
const tag = el(front, 'tag mono', {}, '')
const TAG_A = 'APP-2026-EC-44822', TAG_C = 'CRT-2026-EC-44822'
// officer card (Officer Portal banner + the real "Approve & Issue" action row)
const OFX = SPX + 178, OFY = stageY(6) - 96
const officer = el(front, 'abs', { left: px(OFX), top: px(OFY), width: '300px', borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid var(--bdr)', boxShadow: '0 22px 50px rgba(30,4,10,.18)' }, `
  <div style="background:linear-gradient(135deg,#6B1D2A,#7A1526);padding:14px 16px;display:flex;align-items:center;gap:12px">
    <div style="width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${icon('shield', 19, '#fff')}</div>
    <div><div style="color:#fff;font-size:15px;font-weight:700">Thiru. K. Ramesh</div><div style="color:rgba(255,255,255,.72);font-size:12px">Sub-Registrar · Chennai Central</div></div>
  </div>
  <div style="padding:14px"><div class="okrow" style="display:flex;align-items:center;gap:12px;border:1.5px solid #05966966;border-radius:14px;padding:12px 12px 12px 14px">${icon('circle-check', 19, '#059669', 2)}<div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--txt)">Approve &amp; Issue</div><div style="font-size:11.5px;color:var(--txt2);margin-top:2px">APP-2026-EC-44822</div></div><div class="cfm" style="background:#9B1B30;color:#fff;font-size:12.5px;font-weight:600;border-radius:16px;padding:8px 16px">Confirm</div></div></div>`)
const cfm = officer.querySelector('.cfm')

// ── Digital Locker ───────────────────────────────────────────────────────────
const LKX = 136, LKY = stageY(11) + 230, LKW = 300, LKG = 18
const lockTitle = el(front, 'abs', { left: px(LKX + 2 * (LKW + LKG)), top: px(LKY - 74), display: 'flex', alignItems: 'baseline', gap: '16px', whiteSpace: 'nowrap' }, `<span style="font-size:30px;font-weight:800;letter-spacing:-.6px;color:var(--txt)">Digital Locker</span><span style="font-size:14px;color:var(--txt2)">All documents · <b class="cnt" style="color:var(--pri)">4</b></span>`)
const lockCnt = lockTitle.querySelector('.cnt')
const DOCS = [
  ['Driving License', 'DL-TN-2024-8842', 'TRANSPORT', '#2563EB'], ['Birth Certificate', 'BC-TN-2002-4421', 'CIVIL', '#7C3AED'],
  ['Income Certificate', 'IC-TN-2024-9912', 'REVENUE', '#059669'], ['Ration Card', 'RC-TN-CHN-7788', 'CIVIL SUPPLIES', '#059669'],
  ['Encumbrance Certificate', 'CRT-2026-EC-44822', 'REGISTRATION DEPT (IGR)', '#059669'],
]
const docs = DOCS.map(([t, n, cat, col], i) => el(front, 'doc', { left: px(LKX + i * (LKW + LKG)), top: px(LKY), width: px(LKW) }, `
  <div class="ic" style="background:${col}14">${icon('file-text', 18, col)}</div><div class="t">${t}</div><div class="n mono">${n}</div>
  <div class="f"><span class="cat" style="color:${col}">${cat}</span><span class="v">${icon('circle-check', 13, '#059669', 2)}Verified</span></div>`))
const cert = docs[4]
const certV = cert.querySelector('.v svg')

// ── screen-space (dark world): MLA plate, lockup ─────────────────────────────
const plate = el(screenL, 'plate', { width: '760px' }, `
  <div class="hd"><div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center">${icon('landmark', 22, '#fff')}</div>
  <div><div style="color:#fff;font-size:20px;font-weight:700">Mylapore Constituency</div><div style="color:rgba(255,255,255,.72);font-size:13.5px;margin-top:2px">Chennai District · Assembly segment</div></div></div>
  <div class="body"><div class="pills">${['Citizen', 'Officer', 'Department', 'MLA', 'Super Admin'].map((p) => `<span class="pill">${p}</span>`).join('')}</div>
  <div class="tiles">
    <div class="tl"><div class="v" style="color:var(--txt)"><span class="odo" data-a="4,233" data-b="4,234"></span></div><div class="k">Submitted</div></div>
    <div class="tl"><div class="v" style="color:#059669"><span class="odo" data-a="3,867" data-b="3,868"></span></div><div class="k">Completed</div></div>
    <div class="tl"><div class="v" style="color:#D97706">298</div><div class="k">Pending</div></div>
  </div></div>`)
const pills = [...plate.querySelectorAll('.pill')]
const PLATE_H = plate.offsetHeight
const odos = [...plate.querySelectorAll('.odo')].map((o) => {
  const a = o.dataset.a, b = o.dataset.b
  // last digit wheel
  o.innerHTML = `${a.slice(0, -1)}<span class="wheel" style="display:inline-block;position:relative;height:38px;overflow:hidden;vertical-align:top"><span class="wi" style="display:block">${a.slice(-1)}<br>${b.slice(-1)}</span></span>`
  return o.querySelector('.wi')
})

const lock = el(screenL, 'lock', {}, `
  <img class="seal" src="${SEAL}" style="position:absolute;left:0;top:0;width:118px;height:auto;transform-origin:50% 50%">
  <div class="lw" style="position:absolute;left:0;top:150px;overflow:hidden;padding-bottom:8px"><div class="lwi" style="font-size:86px;font-weight:800;letter-spacing:-2.2px;color:#fff;white-space:nowrap;line-height:1.05">Vetri Tamil Nadu</div></div>
  <div class="lt" style="position:absolute;left:3px;top:258px;overflow:hidden;padding-bottom:10px"><div class="lti ta" style="font-size:42px;font-weight:600;color:var(--secLt);white-space:nowrap">வெற்றி தமிழ்நாடு</div></div>
  <div class="ls" style="position:absolute;left:3px;top:384px;overflow:hidden;padding-bottom:8px"><div class="lsi" style="font-size:46px;font-weight:700;letter-spacing:-.8px;color:#F7F3E8;white-space:nowrap">${COPY.close}</div></div>
  <div class="lst" style="position:absolute;left:3px;top:448px;overflow:hidden;padding-bottom:10px"><div class="lsti ta" style="font-size:33px;font-weight:600;color:var(--secLt);white-space:nowrap">${COPY.closeTa}</div></div>`)
const lockSeal = lock.querySelector('.seal'), lockW = lock.querySelector('.lwi'), lockT = lock.querySelector('.lti'), lockS = lock.querySelector('.lsi'), lockST = lock.querySelector('.lsti')
const LOCK_Y = 262, LOCK_RULE = [1083, LOCK_Y + 352]

// ── kinetic type ─────────────────────────────────────────────────────────────
function headline(lines, { x = 136, y, size = 100, color = '#fff', ta = null, taColor = '#E8C66A', taSize = 44 }) {
  const box = el(typeL, 'kt', { left: px(x), top: px(y) })
  const rule = el(box, 'rule', { top: '-26px' })
  const ws = []
  lines.forEach((ln) => {
    const l = el(box, 'ln en', { fontSize: px(size), color })
    ln.split(' ').forEach((w, k) => { if (k) l.appendChild(document.createTextNode(' ')); const s = el(l, 'w', {}, w); ws.push(s) })
  })
  if (ta) { const l = el(box, 'ln tam', { fontSize: px(taSize), color: taColor, marginTop: '10px' }); ta.split(' ').forEach((w, k) => { if (k) l.appendChild(document.createTextNode(' ')); ws.push(el(l, 'w', {}, w)) }) }
  return { box, rule, ws }
}
function playHead(hd, t, tin, tout) {
  const on = t >= tin - 0.01 && t <= tout + 0.45
  show(hd.box, on)
  if (!on) return
  hd.rule.style.transform = `scaleX(${seg(t, tin - 0.12, tin + 0.22, E.out) * (1 - seg(t, tout, tout + 0.3, E.in))})`
  hd.ws.forEach((w, i) => {
    const a = seg(t, tin + i * 0.045, tin + i * 0.045 + 0.5, E.outExpo)
    const b = seg(t, tout + i * 0.02, tout + i * 0.02 + 0.3, E.in)
    w.style.transform = `translateY(${(1 - a) * 112 - b * 112}%)`
  })
}
const Q = {
  q1: headline([COPY.q1], { y: 856, size: 104 }),
  q2: headline([COPY.q2], { y: 856, size: 104, color: '#1C1C1E' }),
  q3: headline(['One workflow.', 'Every application.'], { y: 752, size: 96, color: '#1C1C1E' }),
  q4: headline(['A named officer', 'approves.'], { y: 752, size: 96, color: '#1C1C1E' }),
  q5: headline(['Same data.', 'Every role.'], { y: 752, size: 96 }),
  q6: headline(['Designed for all', '38 districts.'], { x: 1080, y: 380, size: 84, ta: COPY.q6ta, taSize: 40 }),
}
Q.q2.rule.style.background = Q.q3.rule.style.background = Q.q4.rule.style.background = 'var(--secDk)'

// ── grain tile ───────────────────────────────────────────────────────────────
const grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 256
{
  const g = grainTile.getContext('2d'), im = g.createImageData(256, 256), r = mulberry32(99)
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255 * 0.9; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 }
  g.putImageData(im, 0, 0)
}

// ═════════════════════════════════════════════════════════════════════════════
// LAYOUT MEASUREMENTS (page px; camera is identity at build time)
// ═════════════════════════════════════════════════════════════════════════════
function setUI(c) { ui = c; const t = `translate(${960 - c.cx * c.z}px, ${540 - c.cy * c.z}px) scale(${c.z})`; back.style.transform = front.style.transform = t }
setUI({ cx: 960, cy: 540, z: 1 })
const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } }
const chipR = chips.map(rect)
const rbHR = rect(rbH), rbubR = rect(rbub)
const tileSize = tiles.map((t) => rect(t.el))
const step1C = (() => { const r = rect(stepEls[0].querySelector('.c')); return [r.x + r.w / 2, r.y + r.h / 2] })()
const stepC = stepEls.map((s) => { const r = rect(s.querySelector('.c')); return [r.x + r.w / 2, r.y + r.h / 2] })
const refR = rect(refNum), refBoxR = rect(refBox), ackR = rect(formP)
const certR = rect(cert), certVR = rect(certV)
const cfmR = rect(cfm)
const ecArrow = (() => { const r = rect(chips[0].querySelector('svg')); return [r.x + r.w / 2, r.y + r.h / 2] })()
const heroR = rect(hero)
const ububR = rect(ubub)

// thread routes in page space
const ROW = (i) => [ROWS_X, ROWS_Y + i * ROW_DY]
const ulY = refR.y + refR.h + 8
const spineRoute = [[refR.x, ulY], [refR.x + refR.w, ulY]]
{ // underline → right → corner → down the spine
  const xr = SPX - 70, r0 = [refR.x + refR.w, ulY]
  spineRoute.push([xr, ulY])
  for (let k = 1; k <= 12; k++) { const a = (k / 12) * Math.PI / 2; spineRoute.push([xr + Math.sin(a) * 70, ulY + (1 - Math.cos(a)) * 70]) }
  spineRoute.push([SPX, stageY(0)]); spineRoute.push([SPX, stageY(11)])
}
const spineC = cumul(spineRoute)
const spineLen = spineC.at(-1)
const uAtY = (y) => { // arc fraction where the route reaches page y on the vertical part
  const yStart = spineRoute[spineRoute.length - 2][1]
  const sAt = spineC[spineC.length - 2] + (y - yStart)
  return clamp(sAt / spineLen)
}
const uUnderEnd = spineC[1] / spineLen

// ═════════════════════════════════════════════════════════════════════════════
// RENDER HELPERS
// ═════════════════════════════════════════════════════════════════════════════
function clearCtx(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W * DPR, H * DPR) }

// gold thread with a hot tip; pts in page coords (UI camera) unless screen=true
function drawThread(pts, { width = 4, alpha = 1, tip = true, screen = false } = {}) {
  if (pts.length < 2) return
  const S = screen ? (p) => p : P2S
  tx.setTransform(DPR, 0, 0, DPR, 0, 0)
  tx.lineCap = 'round'; tx.lineJoin = 'round'
  tx.beginPath()
  pts.forEach((p, i) => { const s = S(p); if (i) tx.lineTo(s[0], s[1]); else tx.moveTo(s[0], s[1]) })
  tx.globalAlpha = alpha
  tx.strokeStyle = '#C99A35'; tx.lineWidth = width; tx.stroke()
  tx.strokeStyle = '#F1D488'; tx.lineWidth = Math.max(1, width * 0.34); tx.stroke()
  if (tip) {
    const e = S(pts[pts.length - 1])
    const g = tx.createRadialGradient(e[0], e[1], 0, e[0], e[1], 18)
    g.addColorStop(0, 'rgba(255,246,214,1)'); g.addColorStop(0.25, 'rgba(255,232,160,.75)'); g.addColorStop(1, 'rgba(255,220,120,0)')
    tx.fillStyle = g; tx.beginPath(); tx.arc(e[0], e[1], 18, 0, Math.PI * 2); tx.fill()
  }
  tx.globalAlpha = 1
}

function catmull(points, n = 240) {
  const out = []
  const P = [points[0], ...points, points[points.length - 1]]
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]]
    const steps = Math.ceil(n / (points.length - 1))
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)))
    }
  }
  out.push(points[points.length - 1])
  return out
}

// ═════════════════════════════════════════════════════════════════════════════
// MAP WORLD
// ═════════════════════════════════════════════════════════════════════════════
function mapCam(t) {
  // bar 1: pull back from Chennai to the full state
  const start = camAt([1060, 410], 2.3)
  if (t < T.dive) {
    const p = seg(t, 0, T.pullEnd, E.inOut)
    const s = logLerp(start.s, FULL.s, p)
    const ms = [lerp(1060, mScreenFull[0], p), lerp(410, mScreenFull[1], p)]
    return camAt(ms, s)
  }
  if (t < T.iris) { // bar 2: dive to Mylapore, then creep
    const p = seg(t, T.dive, T.diveEnd, E.inOutExpo)
    const s = logLerp(FULL.s, 30, p) * (1 + 0.05 * seg(t, T.diveEnd, 5.0))
    const ms = [lerp(mScreenFull[0], 930, p), lerp(mScreenFull[1], 452, p)]
    return camAt(ms, s)
  }
  // bar 7: return — Mylapore sits where the locker tick was, then settles
  const P0 = irisPoint()
  if (t < T.pullOut) {
    const p = seg(t, T.iris, T.plate + 0.3, E.inOut)
    return camAt([lerp(P0[0], 640, p), lerp(P0[1], 640, p)], logLerp(30, 26, p))
  }
  const p = seg(t, T.pullOut, T.pullOutEnd, E.inOutExpo)
  const end = { s: 0.94, c: [368 - (600 - 960) / 0.94, 500 - (546 - 540) / 0.94] }
  const mEnd = toScreen(end, M)
  return camAt([lerp(640, mEnd[0], p), lerp(640, mEnd[1], p)], logLerp(26, 0.94, p))
}

function drawMap(t) {
  clearCtx(mx)
  mx.setTransform(1, 0, 0, 1, 0, 0)
  mx.fillStyle = '#0B0607'; mx.fillRect(0, 0, W * DPR, H * DPR)
  const covered = t > T.mastEnd + 0.05 && t < T.iris
  if (covered) return
  const cam = mapCam(t)
  // subtle maroon floor glow centred on the state
  const ce = toScreen(cam, [368, 500])
  const g0 = mx.createRadialGradient(ce[0] * DPR, ce[1] * DPR, 0, ce[0] * DPR, ce[1] * DPR, 900 * DPR)
  g0.addColorStop(0, 'rgba(78,18,32,.55)'); g0.addColorStop(1, 'rgba(78,18,32,0)')
  mx.fillStyle = g0; mx.fillRect(0, 0, W * DPR, H * DPR)

  const s = cam.s
  // villages
  const deep = seg(s, 3, 20)
  const ringR = t > T.ring ? lerp(0, 1050, seg(t, T.ring, T.ringEnd, E.outSoft)) : -1
  const baseA = t < T.iris ? lerp(0.4, 0.46, deep) : lerp(0.46, 0.5, seg(t, T.pullOut, T.pullOutEnd))
  mx.globalCompositeOperation = 'lighter'
  const dot = clamp(1.7 + 2.0 * deep, 1.7, 3.7)
  for (let i = 0; i < VX.length; i++) {
    if (VT[i] > t) break
    const sx = (VX[i] - cam.c[0]) * s + 960, sy = (VY[i] - cam.c[1]) * s + 540
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue
    const age = t - VT[i]
    const fl = Math.exp(-age / 0.11)
    let a = baseA * (0.7 + 0.6 * hashV[i]) + 0.62 * fl
    if (ringR > 0) { const dd = Math.abs(VD[i] - ringR); a += 0.55 * Math.exp(-(dd * dd) / (2 * 22 * 22)) }
    const sz = dot * (1 + 0.9 * fl) * 3.0
    mx.globalAlpha = clamp(a, 0, 1)
    mx.drawImage(fl > 0.35 ? SP_FLASH : SP_SETTLE, (sx - sz / 2) * DPR, (sy - sz / 2) * DPR, sz * DPR, sz * DPR)
  }
  mx.globalAlpha = 1
  mx.globalCompositeOperation = 'source-over'

  // districts (draw-on by distance from Mylapore) — fade out when deep
  mx.setTransform(s * DPR, 0, 0, s * DPR, (960 - cam.c[0] * s) * DPR, (540 - cam.c[1] * s) * DPR)
  const dA = (1 - seg(s, 5, 10)) * (t < T.iris ? 1 : seg(t, T.pullOut + 0.3, T.pullOutEnd))
  if (dA > 0.01) {
    mx.lineWidth = 1.05 / s
    for (const d of districts) {
      const st = T.districts + (d.dist / maxDistrictDist) * 0.75
      const p = t < T.iris ? seg(t, st, st + 0.45, E.out) : 1
      if (p <= 0) continue
      mx.strokeStyle = `rgba(232,198,106,${0.34 * dA})`
      mx.setLineDash([d.len * p, d.len]); mx.stroke(d.p)
    }
    mx.setLineDash([])
    mx.lineWidth = 1.4 / s; mx.strokeStyle = `rgba(232,198,106,${0.5 * dA * seg(t, T.districts, T.districtsEnd)})`; mx.stroke(statePath)
  }
  // Chennai constituencies + Mylapore (deep zoom)
  const cA = seg(s, 6, 14)
  if (cA > 0.01) {
    mx.lineWidth = 1 / s
    for (const c of chennaiPaths) { if (c.no === 25) continue; mx.strokeStyle = `rgba(232,198,106,${0.26 * cA})`; mx.stroke(c.p) }
    // Mylapore outline draws on during the dive
    const mp = t < T.iris ? seg(t, T.dive + 0.25, T.diveEnd + 0.15, E.out) : 1
    mx.fillStyle = `rgba(155,27,48,${0.32 * cA * mp})`; mx.fill(mylPath)
    mx.strokeStyle = `rgba(241,212,136,${0.95 * cA})`; mx.lineWidth = 2 / s
    const L = cumul(mylRing).at(-1)
    mx.setLineDash([L * mp, L]); mx.stroke(mylPath); mx.setLineDash([])
  }
  // the Mylapore point (frame 1 → bubble birth; return after iris)
  const mS = toScreen(cam, M)
  let pa = 0
  if (t < T.bubble + 0.2) pa = 1 - seg(t, T.bubble, T.bubble + 0.18)
  if (t >= T.iris) pa = 1
  if (pa > 0) {
    mx.setTransform(DPR, 0, 0, DPR, 0, 0)
    const breathe = 1 + 0.18 * Math.sin(Math.min(t, 0.6) / 0.6 * Math.PI)
    const r = 5.5 * breathe
    const g = mx.createRadialGradient(mS[0], mS[1], 0, mS[0], mS[1], r * 5)
    g.addColorStop(0, `rgba(255,240,200,${pa})`); g.addColorStop(0.2, `rgba(232,198,106,${0.8 * pa})`); g.addColorStop(1, 'rgba(212,168,67,0)')
    mx.fillStyle = g; mx.beginPath(); mx.arc(mS[0], mS[1], r * 5, 0, Math.PI * 2); mx.fill()
    mx.fillStyle = `rgba(255,248,226,${pa})`; mx.beginPath(); mx.arc(mS[0], mS[1], r * 0.55, 0, Math.PI * 2); mx.fill()
  }
  // calm ring echo (bar 8)
  if (ringR > 0) {
    mx.setTransform(DPR, 0, 0, DPR, 0, 0)
    const ra = (1 - seg(t, T.ring + 0.8, T.ringEnd)) * 0.55
    mx.strokeStyle = `rgba(241,212,136,${ra})`; mx.lineWidth = 1.5
    mx.beginPath(); mx.arc(mS[0], mS[1], ringR * cam.s, 0, Math.PI * 2); mx.stroke()
  }
  return { cam, mS }
}

let irisCache = null
function irisPoint() {
  if (irisCache) return irisCache
  const saved = ui
  const c = camLocker(T.iris)
  setUI(c)
  irisCache = P2S([certVR.x + certVR.w / 2, certVR.y + certVR.h / 2])
  setUI(saved)
  return irisCache
}

// ═════════════════════════════════════════════════════════════════════════════
// UI CAMERA (page space)
// ═════════════════════════════════════════════════════════════════════════════
const bubFocus = [rbubR.x + rbubR.w / 2 + 40, rbubR.y + rbubR.h / 2 + 10]
const STZ = 1.55
const stepFocus0 = [136 + 960 / STZ - 10, BY + 2315 - 2000 + (540 - 400) / STZ]
const stepFocus1 = [1784 - 960 / STZ + 30, stepFocus0[1]]
const ackFocus = [refBoxR.x + refBoxR.w * 0.47, refBoxR.y + refBoxR.h * 0.42]
const SPZ = 1.42
const spineCam = (y, z = SPZ) => ({ cx: SPX - (1090 - 960) / z, cy: y + 30, z })
function camLocker(t) {
  const lockC = [LKX + 3 * (LKW + LKG) + LKW * 0.5 + 40, LKY + 30]
  const p = seg(t, T.cert + 0.1, T.seat + 0.02, E.inOut)
  const from = spineCam(stageY(11))
  const z = lerp(from.z, 1.5, p) * (1 + 0.05 * seg(t, T.seat, T.iris))
  return { cx: lerp(from.cx, lockC[0], p), cy: lerp(from.cy, lockC[1], p), z }
}
function uiCam(t) {
  if (t < T.flip) return { cx: 960, cy: 540, z: 1 }
  if (t < T.press) { const p = seg(t, T.flip, T.flipEnd + 0.1, E.inOut); const z = lerp(1, 1.62, p) * (1 + 0.04 * seg(t, T.flipEnd, T.press)); return { cx: lerp(960, bubFocus[0], p), cy: lerp(540, bubFocus[1], p), z } }
  if (t < T.pushEnd) { // push through the EC chip's arrow
    const p = seg(t, T.press, T.pushEnd, E.inExpo)
    const z0 = 1.62 * 1.04
    return { cx: lerp(bubFocus[0], ecArrow[0], seg(p, 0, 0.6, E.out)), cy: lerp(bubFocus[1], ecArrow[1], seg(p, 0, 0.6, E.out)), z: logLerp(z0, 34, p) }
  }
  if (t < T.steps[0]) { // out of the crimson step-1 circle
    const p = seg(t, T.stepIn, T.stepInEnd, E.outExpo)
    return { cx: lerp(step1C[0], stepFocus0[0], seg(p, 0.05, 1, E.inOut)), cy: lerp(step1C[1], stepFocus0[1], seg(p, 0.05, 1, E.inOut)), z: logLerp(34, STZ, p) }
  }
  if (t < T.ack) { // track along the stepper
    const p = seg(t, T.steps[0], T.submitGrow, E.inOut)
    const q = seg(t, T.submitGrow - 0.1, T.ack + 0.05, E.inOut)
    const sx = lerp(stepFocus0[0], stepFocus1[0], p), sy = stepFocus0[1]
    return { cx: lerp(sx, ackFocus[0], q), cy: lerp(sy, ackFocus[1], q), z: lerp(STZ, 1.72, q) }
  }
  if (t < T.spine) { const z = 1.72 * (1 + 0.05 * seg(t, T.ack, T.spine)); return { cx: ackFocus[0], cy: ackFocus[1], z } }
  if (t < T.confirm + 0.05) { // descend with the head to Approval
    const p = seg(t, T.spine, T.approval, E.inOut)
    const head = headY(t)
    const from = { cx: ackFocus[0], cy: ackFocus[1], z: 1.72 * 1.05 }
    const to = spineCam(Math.max(head, stageY(0)))
    const q = seg(t, T.spine, T.spine + 0.55, E.inOut)
    return { cx: lerp(from.cx, to.cx, q), cy: lerp(from.cy, to.cy, q), z: lerp(from.z, SPZ, q) + 0 * p }
  }
  if (t < T.cert + 0.15) { const y = lerp(stageY(6), stageY(11), seg(t, T.confirm + 0.05, T.stages2[5] + 0.2, E.inOut)); return spineCam(y) }
  return camLocker(t)
}

// head of the thread on the spine (page y)
function headY(t) {
  if (t < T.spine) return ulY
  if (t < T.approval) {
    const p = seg(t, T.spine, T.approval, E.inOut)
    return lerp(ulY, stageY(6), p)
  }
  if (t < T.confirm) return stageY(6)
  return lerp(stageY(6), stageY(11), seg(t, T.confirm, T.stages2[5] + 0.05, E.inOut))
}

// ═════════════════════════════════════════════════════════════════════════════
// SEEK
// ═════════════════════════════════════════════════════════════════════════════
window.seek = async (t) => {
  const frame = Math.round(t * 60)
  const mapInfo = drawMap(t)
  {
    let c = uiCam(t)
    if (t >= T.iris) {
      const P = irisPoint()
      const k = logLerp(60, 1, seg(t, T.iris, T.irisEnd, E.inOutExpo))
      const f = k / 60
      const Q = [(P[0] - 960) / c.z + c.cx, (P[1] - 540) / c.z + c.cy]
      const z = c.z * f
      c = { z, cx: Q[0] - (P[0] - 960) / z, cy: Q[1] - (P[1] - 540) / z }
    }
    setUI(c)
  }
  back.style.filter = t > T.spine && t < T.iris ? `blur(${(2.4 * seg(t, T.spine + 0.15, T.spine + 0.6, E.inOut)).toFixed(2)}px)` : 'none'
  clearCtx(tx)

  // ── visibility of worlds ──
  const uiWorld = t >= T.snap && t < T.irisEnd
  show(back, t >= T.snap - 0.02 && t < T.irisEnd)

  // ── BAR 2 elements (screen = page, camera identity) ──
  const camB2 = mapInfo && t < T.snap ? mapInfo.cam : null
  // Mylapore label
  if (camB2 && t > T.dive + 0.3) {
    const ms = toScreen(camB2, M)
    show(mapLabel, true)
    const a = seg(t, T.dive + 0.35, T.dive + 0.6, E.out) * (1 - seg(t, T.wrong, T.wrong + 0.3))
    Object.assign(mapLabel.style, { left: px(ms[0] + 104), top: px(ms[1] + 96), opacity: a, transform: `translateY(${(1 - a) * 8}px)` })
  } else show(mapLabel, false)

  // bubble: born from the point (bar 2) → docks top-right of the chat (bar 3)
  {
    const ms = camB2 ? toScreen(camB2, M) : [930, 452]
    const pB = seg(t, T.bubble, T.bubble + 0.42, E.appPop)
    const bw = ububR.w, bh = ububR.h
    const BIG = 2.1
    let x = ms[0] - bw * 0.5, y = ms[1] - bh - 16, sc = pB * BIG
    const wait = [SPINE_X - 40 - bw * 1.5, 196 + bh * 0.5]
    const dock = [136 + 1000 - 20 - bw, 252 + 20]
    if (t >= T.snap) {
      const fl = seg(t, T.snap, T.snap + 0.55, E.outExpo)
      const dk = seg(t, T.flip, T.flipEnd + 0.05, E.inOutExpo)
      x = lerp(lerp(x, wait[0], fl), dock[0], dk); y = lerp(lerp(y, wait[1], fl), dock[1], dk)
      sc = lerp(lerp(BIG, 1.5, fl), 1, dk)
    }
    show(ubub, t >= T.bubble)
    Object.assign(ubub.style, { left: px(x), top: px(y), transform: `scale(${Math.max(0.001, sc)})`, transformOrigin: '50% 100%', borderRadius: `${lerp(24, 14, pB)}px ${lerp(24, 14, pB)}px 4px ${lerp(24, 14, pB)}px` })
  }

  // five services: scatter (bar 2) → wrong-order knot → fling → ordered rows → FLIP to chips
  const knotK = seg(t, T.knot, T.snap, E.in)
  const C = [930, 520]
  const tilePos = tiles.map((tl, i) => {
    const pop = seg(t, T.tiles[i], T.tiles[i] + 0.38, E.appPop)
    let [x, y] = SCAT[i]
    const n1 = noise1(t * 2.1 + i * 9) * 6, n2 = noise1(t * 1.7 + i * 5 + 40) * 6
    x += n1 * (0.4 + 2.2 * knotK); y += n2 * (0.4 + 2.2 * knotK)
    x = lerp(x, C[0] - tileSize[i].w / 2 + (SCAT[i][0] - C[0]) * 0.45, knotK * 0.55); y = lerp(y, C[1] - tileSize[i].h / 2 + (SCAT[i][1] - C[1]) * 0.45, knotK * 0.55)
    let sc = pop, rot = (1 - pop) * (i % 2 ? 6 : -6) + noise1(t * 3 + i) * 2.2 * knotK
    // fling at the snap
    const fl = seg(t, T.snap, T.snap + 0.34, E.outExpo)
    const ang = Math.atan2(SCAT[i][1] + tileSize[i].h / 2 - C[1], SCAT[i][0] + tileSize[i].w / 2 - C[0])
    const fx = x + Math.cos(ang) * 1500 * fl, fy = y + Math.sin(ang) * 1100 * fl
    x = fx; y = fy
    // return in dependency order as rows hanging on the spine
    const rt = T.rows[i]
    const r = seg(t, rt - 0.28, rt + 0.12, E.outExpo)
    const R = ROW(i)
    x = lerp(x, R[0], r); y = lerp(y, R[1], r); rot = lerp(rot, 0, r)
    return { x, y, sc, rot, r }
  })
  tiles.forEach((tl, i) => {
    const p = tilePos[i]
    const vis = t >= T.tiles[i] && t < T.flipEnd + 0.02
    show(tl.el, vis)
    if (!vis) return
    const land = seg(t, T.rows[i] + 0.02, T.rows[i] + 0.3, E.appPop)
    tl.no.style.transform = `scale(${land})`
    tl.meta.style.display = 'block'
    tl.meta.style.opacity = seg(t, T.rows[i], T.rows[i] + 0.25)
    // FLIP: rows → chips (Water → the paragraph)
    const f = seg(t, T.flip + i * 0.025, T.flipEnd, E.inOutExpo)
    let x = p.x, y = p.y, w = tileSize[i].w, hh = tileSize[i].h, rad = 14
    if (f > 0) {
      const target = i < 4 ? chipR[i] : { x: rbubR.x + 30, y: rbubR.y + 120, w: 200, h: 20 }
      x = lerp(x, target.x, f); y = lerp(y, target.y, f); w = lerp(w, target.w, f); hh = lerp(hh, target.h, f); rad = lerp(14, 9, f)
    }
    Object.assign(tl.el.style, {
      left: px(x), top: px(y), width: f > 0 ? px(w) : '', height: f > 0 ? px(hh) : '', borderRadius: px(rad),
      transform: `rotate(${p.rot}deg) scale(${Math.max(0.001, p.sc)})`,
      boxShadow: `0 ${lerp(18, 2, Math.max(p.r, f))}px ${lerp(44, 6, Math.max(p.r, f))}px rgba(30,4,10,${lerp(0.34, 0.06, Math.max(p.r, f))})`,
      overflow: f > 0 ? 'hidden' : 'visible',
      opacity: i === 4 ? 1 - seg(t, T.flip, T.flipEnd) : 1,
    })
    tl.tx.style.opacity = tl.ic.style.opacity = 1 - seg(f, 0, 0.45)
    tl.no.style.opacity = 1 - seg(f, 0, 0.3)
  })
  // department overlines float, unattached
  depts.forEach((d, i) => {
    const a = seg(t, 3.2 + i * 0.09, 3.55 + i * 0.09, E.out) * (1 - seg(t, T.snap, T.snap + 0.12))
    show(d, a > 0.001)
    d.style.opacity = a
    d.style.transform = `translate(${noise1(t * 0.9 + i * 3) * 10}px, ${(1 - a) * 10 + noise1(t * 0.8 + i * 7) * 6}px)`
  })

  // ── thread in bar 2: wrong order → knot → snap to the masthead rule ──
  if (t >= T.wrong && t < T.mastEnd) {
    const ub = rect(ubub)
    const B = [ub.x + ub.w - 4, ub.y + ub.h - 2]
    const cen = (i) => [tilePos[i].x + tileSize[i].w / 2, tilePos[i].y + tileSize[i].h / 2]
    const route = catmull([B, cen(4), cen(3), cen(2), cen(0), cen(1), [cen(1)[0] + 140, cen(1)[1] + 160]], 360)
    const head = seg(t, T.wrong, T.wrongEnd, E.inOut)
    let pts = slice(route, 0, Math.max(0.002, head))
    // knot: pull the path tight around the centre
    if (knotK > 0) {
      pts = resample(pts, 360).map((p, k) => {
        const a = k / 360 * Math.PI * 14 + t * 3
        const rr = 60 + 30 * Math.sin(k * 0.21)
        const kp = [C[0] + Math.cos(a) * rr * 1.5, C[1] + Math.sin(a) * rr * 0.8]
        return [lerp(p[0], kp[0], knotK * 0.82), lerp(p[1], kp[1], knotK * 0.82)]
      })
    }
    if (t >= T.snap) {
      const sp = seg(t, T.snap, T.snap + 0.2, E.outExpo)
      const A = resample(pts, 400)
      const L = Array.from({ length: 400 }, (_, k) => [lerp(-60, W + 60, k / 399), 115.5])
      pts = mix(A, L, sp)
    }
    drawThread(pts, { width: 4, tip: t < T.snap + 0.1, alpha: 1 - seg(t, T.snap + 0.24, T.snap + 0.4) })
  }

  // ── masthead + ground wipes from the rule ──
  {
    const pBar = seg(t, T.snap + 0.03, T.snap + 0.26, E.out)
    const pStrip = seg(t, T.snap + 0.14, T.snap + 0.34, E.out)
    const pDown = seg(t, T.snap + 0.04, T.mastEnd, E.inOut)
    mastA.bar.style.clipPath = `inset(${(1 - pBar) * 100}% 0 0 0)`
    mastA.strip.style.clipPath = `inset(${(1 - pStrip) * 100}% 0 0 0)`
    mastA.nav.style.clipPath = `inset(0 0 ${(1 - seg(pDown, 0, 0.25)) * 100}% 0)`
    ground.style.clipPath = `inset(0 0 ${(1 - pDown) * 100}% 0)`
    show(mastA.m, t >= T.snap)
  }

  // ── BAR 3: hero Tamil + spine + rows; FLIP into the real reply ──
  {
    const heroOn = t >= T.hero && t < T.flip + 0.4
    show(hero, heroOn)
    if (heroOn) {
      heroWords.forEach((w, i) => {
        const a = seg(t, T.hero + i * 0.075, T.hero + i * 0.075 + 0.55, E.outExpo)
        const b = seg(t, T.flip - 0.08 + i * 0.03, T.flip + 0.2 + i * 0.03, E.inExpo)
        w.style.transform = `translateY(${(1 - a) * 115 - b * 115}%)`
      })
    }
    // spine branch from the rule
    if (t >= T.hero && t < T.flipEnd) {
      const down = seg(t, T.hero + 0.1, T.rows[4] + 0.05, E.inOut)
      const up = seg(t, T.flip, T.flip + 0.25, E.in)
      const y1 = lerp(117, ROWS_Y + 4 * ROW_DY + tileSize[4].h / 2, down)
      const y0 = lerp(117, y1, up)
      drawThread([[SPINE_X, y0], [SPINE_X, Math.max(y0 + 0.5, y1)]], { width: 4, tip: down < 0.999 && up === 0 })
      // little connectors to each landed row
      tiles.forEach((tl, i) => {
        const r = seg(t, T.rows[i] + 0.05, T.rows[i] + 0.22, E.out) * (1 - up)
        if (r <= 0) return
        const yy = ROWS_Y + i * ROW_DY + tileSize[i].h / 2
        drawThread([[SPINE_X, yy], [SPINE_X + (ROWS_X - 46 - SPINE_X) * r, yy]], { width: 3, tip: false })
      })
    }
    // the page around the reply masks in during the FLIP
    const pg = seg(t, T.flip - 0.05, T.flipEnd, E.out)
    for (const e of [pageTitleA, chat]) { show(e, t >= T.flip - 0.05); e.style.clipPath = `inset(0 0 ${(1 - pg) * 100}% 0)` }
    { const pr = seg(t, T.flipEnd - 0.1, T.flipEnd + 0.2, E.out); show(rail, pr > 0); rail.style.clipPath = `inset(0 0 ${(1 - pr) * 100}% 0)` }
    const real = t >= T.flipEnd
    show(rbub, t >= T.flip + 0.12 && t < T.pushEnd + 0.1)
    rbub.style.background = `rgba(247,247,250,${seg(t, T.flip + 0.12, T.flipEnd)})`
    rbH.style.opacity = seg(t, T.flip + 0.15, T.flipEnd)
    rbEn.style.opacity = 0.72 * seg(t, T.flip + 0.2, T.flipEnd + 0.1)
    chips.forEach((c, i) => {
      c.style.opacity = real ? 1 : 0
      const pr = i === 0 ? seg(t, T.press, T.press + 0.05) : 0
      c.style.background = pr ? '#9B1B30' : '#fff'; c.style.color = pr ? '#fff' : 'var(--pri)'; c.style.borderColor = pr ? '#9B1B30' : 'var(--bdr)'
      c.style.transform = `scale(${1 - 0.05 * Math.sin(Math.PI * seg(t, T.press, T.press + 0.1))})`
    })
  }

  // crimson bridge at the peak of the push
  {
    const a = seg(t, T.press + 0.25, T.pushEnd, E.in) * (1 - seg(t, T.pushEnd, T.pushEnd + 0.16, E.out))
    flash.style.opacity = a
  }

  // ── BAR 4: stepper ──
  {
    const done = (i) => t >= T.steps[i]
    stepEls.forEach((s, i) => {
      const d = done(i), act = !d && (i === 0 || done(i - 1))
      const c = s.querySelector('.c')
      const pop = d ? seg(t, T.steps[i], T.steps[i] + 0.22, E.appPop) : 1
      c.innerHTML = d ? icon('check', 14, '#fff', 3) : String(i + 1)
      Object.assign(c.style, { background: d ? '#059669' : act ? '#9B1B30' : '#fff', borderColor: d ? '#059669' : act ? '#9B1B30' : '#E5E7EB', color: act ? '#fff' : '#9CA3AF', transform: `scale(${pop})` })
      s.style.color = d ? '#1C1C1E' : act ? '#9B1B30' : '#9CA3AF'
      s.style.fontWeight = act ? 700 : d ? 600 : 500
      s.style.background = act ? '#9B1B300D' : 'transparent'
    })
    // prefill snaps
    fldVals.forEach((v, i) => { const a = seg(t, T.prefill + i * 0.07, T.prefill + i * 0.07 + 0.3, E.outExpo); v.style.display = 'inline-block'; v.style.transform = `translateX(${(1 - a) * 18}px)`; v.style.opacity = a })
    // thread along the stepper
    if (t > T.steps[0] - 0.05 && t < T.ack + 0.1) {
      const k = clamp(T.steps.findIndex((s) => s > t), 0, 7)
      const idx = k === -1 ? 6 : k
      const prevT = idx === 0 ? T.steps[0] - 0.05 : T.steps[idx - 1]
      const nextT = T.steps[Math.min(6, idx)]
      const fx = idx >= 7 || t >= T.steps[6] ? stepC[6][0] : lerp(stepC[Math.max(0, idx - 1)][0], stepC[idx][0], seg(t, prevT, nextT, E.inOut))
      const yy = stepC[0][1] + 36
      drawThread([[stepC[0][0], yy], [Math.max(stepC[0][0] + 0.5, fx), yy]], { width: 4, alpha: 1 - seg(t, T.submitGrow, T.ack) })
    }
    // form → acknowledgement
    const sw = seg(t, T.submitGrow, T.ack, E.inOut)
    formIn.style.clipPath = `inset(0 0 ${sw * 100}% 0)`
    formIn.style.transform = `translateY(${-sw * 24}px)`
    show(formIn, sw < 1)
    show(ackIn, t >= T.submitGrow + 0.1)
    const tp = seg(t, T.ack - 0.08, T.ack + 0.3, E.appPop)
    ackTile.style.transform = `scale(${tp})`
    const rise = (e, t0) => { const a = seg(t, t0, t0 + 0.45, E.outExpo); e.style.clipPath = `inset(0 0 ${(1 - a) * 100}% 0)`; e.style.transform = `translateY(${(1 - a) * 14}px)` }
    rise(ackTitle, T.ack - 0.04); rise(ackDesc, T.ack + 0.06); rise(refBox, T.ack - 0.1)
    const st = seg(t, T.ack, T.ack + 0.32, E.outExpo)
    refNum.style.transform = `scale(${lerp(1.18, 1, st)})`
    refNum.style.clipPath = `inset(0 ${(1 - seg(t, T.ack, T.ack + 0.18)) * 100}% 0 0)`
    refChip.style.opacity = seg(t, T.ack + 0.2, T.ack + 0.35)
    // QR builds in raster order
    qg.setTransform(1, 0, 0, 1, 0, 0); qg.clearRect(0, 0, qrCv.width, qrCv.height)
    const nq = Math.floor(qrMods.length * seg(t, T.qr, T.qrEnd, E.inOut))
    qg.fillStyle = '#111'
    for (let i = 0; i < nq; i++) qg.fillRect(qrMods[i][0] * 8, qrMods[i][1] * 8, 8, 8)
  }

  // ── BAR 5–6: underline → spine → stages; officer; APP→CRT; locker ──
  {
    const onSpine = t >= T.ack && t < T.iris
    if (onSpine) {
      // underline draws, then the head runs down the route
      const ul = seg(t, T.ack + 0.08, T.ack + 0.4, E.out) * uUnderEnd
      const hy = headY(t)
      const u = t < T.spine ? ul : Math.max(uUnderEnd, uAtY(hy) * seg(t, T.spine, T.spine + 0.25, E.out) + uUnderEnd * (1 - seg(t, T.spine, T.spine + 0.25, E.out)))
      const pts = slice(spineRoute, 0, Math.max(0.0005, u), spineC)
      const fadeAway = 1 - seg(t, T.cert + 0.2, T.seat, E.inOut) * 0.6
      drawThread(pts, { width: 4, tip: t < T.stages2[5] + 0.1, alpha: fadeAway })
    }
    // stage dots
    stg.forEach((s, i) => {
      const vis = t >= T.spine - 0.05 && t < T.iris
      show(s.e, vis)
      if (!vis) return
      const appear = seg(t, T.spine + i * 0.06, T.spine + i * 0.06 + 0.3, E.out)
      const doneT = i < 6 ? T.stages[i] : T.stages2[i - 6]
      const d = t >= doneT
      const pop = d ? seg(t, doneT, doneT + 0.22, E.appPop) : 1
      const isApproval = i === 6
      s.d.innerHTML = d ? icon('check', 12, '#fff', 3.2) : ''
      Object.assign(s.d.style, { background: d ? (i === 11 ? '#9B1B30' : '#059669') : '#fff', borderColor: d ? (i === 11 ? '#9B1B30' : '#059669') : (isApproval && t > T.approval - 0.3 ? '#9B1B30' : '#D7DAE0'), transform: `scale(${pop})` })
      s.l.style.color = d ? '#1C1C1E' : isApproval && t > T.approval - 0.3 ? '#9B1B30' : '#9CA3AF'
      s.l.style.fontWeight = d || isApproval ? 700 : 600
      s.e.style.opacity = appear
      s.e.style.transform = `translateX(${(1 - appear) * 12}px)`
    })
    // the riding tag (reference → certificate number)
    const tagVis = t >= T.spine + 0.1 && t < T.cert + 0.12
    show(tag, tagVis)
    if (tagVis) {
      const y = headY(t)
      const flapP = seg(t, T.flap, T.flapEnd)
      const nflip = Math.floor(flapP * 3.999) // A→C, P→R, P→T
      tag.textContent = TAG_A.split('').map((ch, i) => (i < 3 && i < nflip) ? TAG_C[i] : ch).join('')
      const a = seg(t, T.spine + 0.1, T.spine + 0.35, E.out)
      Object.assign(tag.style, { left: px(SPX - 236), top: px(y - 16), opacity: a, transform: `translateX(${(1 - a) * 20}px) rotateX(${Math.sin(flapP * Math.PI * 3) * 50}deg)`, background: t >= T.flapEnd ? '#059669' : '#9B1B30' })
    }
    // officer card
    const ofVis = t >= T.officer && t < T.cert + 0.3
    show(officer, ofVis)
    if (ofVis) {
      const a = seg(t, T.officer, T.officerEnd, E.outExpo)
      const out = seg(t, T.stages2[2], T.cert + 0.2, E.inOut)
      officer.style.transform = `translateX(${(1 - a) * 160}px)`
      officer.style.opacity = a * (1 - out)
      const pr = Math.sin(Math.PI * seg(t, T.confirm - 0.04, T.confirm + 0.1))
      cfm.style.transform = `scale(${1 - 0.07 * pr})`
      cfm.style.background = t >= T.confirm ? '#7A1526' : '#9B1B30'
      cfm.textContent = t >= T.confirm + 0.12 ? 'Confirmed' : 'Confirm'
    }
    // the decision spark (warm yellow) — from Confirm into the spine, then down
    if (t >= T.confirm && t < T.stages2[5] + 0.2) {
      const p1 = seg(t, T.confirm, T.confirm + 0.14, E.in)
      const c0 = [cfmR.x + cfmR.w / 2, cfmR.y + cfmR.h / 2]
      const s0 = [SPX, stageY(6)]
      const y = t < T.confirm + 0.14 ? stageY(6) : headY(t)
      const p = t < T.confirm + 0.14 ? [lerp(c0[0], s0[0], p1), lerp(c0[1], s0[1], p1)] : [SPX, y]
      const sp = P2S(p)
      tx.setTransform(DPR, 0, 0, DPR, 0, 0)
      const g = tx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 26)
      g.addColorStop(0, 'rgba(255,255,236,1)'); g.addColorStop(0.18, 'rgba(255,214,64,.95)'); g.addColorStop(1, 'rgba(255,204,0,0)')
      tx.fillStyle = g; tx.beginPath(); tx.arc(sp[0], sp[1], 26, 0, Math.PI * 2); tx.fill()
    }
    // certificate card: emerges from the tag, flies into the locker's 5th slot
    const lkOn = t >= T.cert + 0.1 && t < T.irisEnd
    docs.forEach((d, i) => { if (i < 4) { show(d, lkOn); const a = seg(t, T.cert + 0.12 + i * 0.04, T.cert + 0.42 + i * 0.04, E.out); d.style.opacity = a; d.style.transform = `translateY(${(1 - a) * 24}px)` } })
    show(lockTitle, lkOn); lockTitle.style.opacity = seg(t, T.cert + 0.2, T.cert + 0.45)
    lockCnt.textContent = t >= T.count ? '5' : '4'
    show(cert, t >= T.cert && t < T.irisEnd)
    if (t >= T.cert) {
      const from = [SPX - 236, stageY(11) - 40]
      const p = seg(t, T.cert, T.seat, E.inOutExpo)
      const seatPop = seg(t, T.seat, T.seat + 0.25, E.appPop)
      const x = lerp(from[0], certR.x, p), y = lerp(from[1], certR.y, p) - Math.sin(p * Math.PI) * 120
      const sc = lerp(0.62, 1, p) * (t >= T.seat ? lerp(1.04, 1, seatPop) : 1)
      Object.assign(cert.style, { left: px(x), top: px(y), transform: `scale(${sc}) rotate(${Math.sin(p * Math.PI) * -4}deg)`, transformOrigin: '0 0', boxShadow: `0 ${lerp(30, 0, seatPop)}px ${lerp(60, 0, seatPop)}px rgba(30,4,10,${lerp(0.22, 0, seatPop)})` })
    }
  }

  // ── BAR 7: iris back into Mylapore, MLA plate, odometers ──
  if (t >= T.iris && t < T.irisEnd + 0.01 && mapInfo) {
    const cam = mapInfo.cam
    const P = irisPoint()
    const k = logLerp(60, 1, seg(t, T.iris, T.irisEnd, E.inOutExpo))
    const ring = resample(mylRing, 90).map((g) => { const s = toScreen(cam, g); return [P[0] + (s[0] - mapInfo.mS[0]) * k + (mapInfo.mS[0] - P[0]) * seg(t, T.iris, T.irisEnd), P[1] + (s[1] - mapInfo.mS[1]) * k + (mapInfo.mS[1] - P[1]) * seg(t, T.iris, T.irisEnd)] })
    uiwrap.style.clipPath = `polygon(${ring.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',')})`
  } else uiwrap.style.clipPath = 'none'
  show(front, t < T.irisEnd)

  {
    const vis = t >= T.plate - 0.02 && t < T.pullOut + 0.6 && mapInfo
    show(plate, !!vis)
    if (vis) {
      const ms = mapInfo.mS
      const up = seg(t, T.plate, T.plateEnd, E.outExpo)
      const down = seg(t, T.fold, T.fold + 0.32, E.inExpo)
      const ang = lerp(88, 0, up) + lerp(0, 88, down)
      Object.assign(plate.style, { left: px(ms[0] - 96), top: px(ms[1] - 74 - PLATE_H), transform: `rotateX(${ang}deg) scale(1.32)`, transformOrigin: '0 100%', opacity: 1 - seg(t, T.fold + 0.22, T.fold + 0.36) })
      pills.forEach((p, i) => {
        const at = i === 0 ? T.pills[0] : i === 1 ? T.pills[1] : i === 3 ? T.pills[2] : 99
        const on = t >= at
        const pop = seg(t, at, at + 0.2, E.appPop)
        Object.assign(p.style, { background: on ? '#9B1B30' : '#fff', color: on ? '#fff' : 'var(--txt2)', borderColor: on ? '#9B1B30' : 'var(--bdr)', transform: `scale(${on ? lerp(0.9, 1, pop) : 1})` })
      })
      odos.forEach((o, i) => { const tt = i === 0 ? T.roll1 : T.roll2; const r = seg(t, tt, tt + 0.28, E.outExpo); o.style.transform = `translateY(${-r * 50}%)` })
    }
  }

  // ── BAR 8: thread → lockup rule; lockup ──
  {
    if (t >= T.line && mapInfo) {
      const ms = mapInfo.mS
      const pDraw = seg(t, T.line, T.line + 0.24, E.inOut)
      const pTail = seg(t, T.line + 0.16, T.lineEnd, E.inOut)
      const A = ms, B = LOCK_RULE, E2 = [LOCK_RULE[0] + 56, LOCK_RULE[1]]
      const route = [A, ...Array.from({ length: 30 }, (_, k) => { const u = (k + 1) / 31; return [lerp(A[0], B[0], u) + Math.sin(u * Math.PI) * 30, lerp(A[1], B[1], E.inOut(u))] }), B, E2]
      const rc = cumul(route)
      const uEnd = pDraw, uStart = pTail * (1 - 56 / rc.at(-1))
      const pts = slice(route, uStart, Math.max(uStart + 0.001, uEnd), rc)
      drawThread(pts, { width: 4, screen: true, tip: pDraw < 1 })
    }
    const lk = t >= T.lockup - 0.05
    show(lock, lk)
    if (lk) {
      lock.style.top = px(LOCK_Y)
      const sp = seg(t, T.lockup, T.lockup + 0.6, E.appPop)
      const glow = Math.exp(-Math.pow((t - (T.lockup + 0.55)) / 0.35, 2))
      lockSeal.style.transform = `scale(${lerp(0.7, 1, sp)})`
      lockSeal.style.opacity = seg(t, T.lockup, T.lockup + 0.12)
      lockSeal.style.filter = `drop-shadow(0 0 ${8 + 12 * glow}px rgba(212,168,67,${0.3 + 0.3 * glow}))`
      const rise = (e, t0) => { const a = seg(t, t0, t0 + 0.55, E.outExpo); e.style.transform = `translateY(${(1 - a) * 110}%)` }
      rise(lockW, T.word); rise(lockT, T.tamil); rise(lockS, T.stmt); rise(lockST, T.stmt + 0.1)
    }
  }

  // ── kinetic type ──
  playHead(Q.q1, t, T.q1, T.q1Out)
  playHead(Q.q2, t, T.q2, T.q2Out)
  playHead(Q.q3, t, T.q3, T.q3Out)
  playHead(Q.q4, t, T.q4, T.q4Out)
  playHead(Q.q5, t, T.q5, T.q5Out)
  playHead(Q.q6, t, T.q6, T.q6Out)

  // ── grade: vignette + grain ──
  const light = t >= T.snap + 0.2 && t < T.iris + 0.25 ? 1 : 0
  vig.style.background = `radial-gradient(ellipse 75% 70% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,${light ? 0.16 : 0.55}) 100%)`
  grainC.style.opacity = light ? 0.035 : 0.06
  gx.setTransform(1, 0, 0, 1, 0, 0)
  const r = mulberry32(frame + 1)
  const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256)
  const pat = gx.createPattern(grainTile, 'repeat')
  gx.setTransform(DPR * 1.5, 0, 0, DPR * 1.5, -ox, -oy)
  gx.fillStyle = pat; gx.fillRect(0, 0, W * DPR, H * DPR)

  // wait for images/fonts to settle before the screenshot
  await new Promise((res) => requestAnimationFrame(() => res()))
}

window.__ready = true

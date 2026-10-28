import { useSyncExternalStore } from 'react'
import { ArrowRight } from 'lucide-react'
import phonePreview from '@/assets/chooser-phone.jpg'
import webPreview from '@/assets/chooser-web.jpg'
import { Seal } from '@/components/ui'
import { TamilNaduMap } from '@/components/map/TamilNaduMap'
import { VetriWordmark, WORDMARK_CSS } from '@/components/brand/VetriWordmark'
import { useApp } from '@/hooks/useUi'
import { usePlatformStore, type Platform } from '@/store/platformStore'

/**
 * Welcome experience — the first screen on a fresh visit. The citizen picks how
 * the SAME application should present itself: the mobile citizen super app, or
 * the desktop government portal.
 *
 * It shows rather than describes: each option carries a picture of the real
 * thing, and the one that suits the screen in use is offered first. Like the
 * loading screen it leads into, it is theme-independent — always the banner
 * yellow — so the first impression is the same for everyone.
 *
 * The two pictures are screenshots of the phone home and the web dashboard
 * (`src/assets/chooser-*.jpg`); retake them if those screens change noticeably.
 */
const OPTIONS: { id: Platform; tab: string; title: string; desc: string }[] = [
  { id: 'mobile', tab: 'FOR CITIZENS', title: 'Mobile Super App', desc: 'The citizen app, exactly as it runs on a phone.' },
  { id: 'website', tab: 'FOR OFFICIALS AND PRESENTATIONS', title: 'Government Web Portal', desc: 'The full portal, laid out for laptops and large screens.' },
]

const WIDE = '(min-width: 900px)'

// Read through useSyncExternalStore so a size change that lands between the
// first paint and the subscription is never missed; `resize` backs up the
// media-query event for windows that are resized without one firing.
function onScreenChange(notify: () => void) {
  const mq = window.matchMedia(WIDE)
  mq.addEventListener('change', notify)
  window.addEventListener('resize', notify)
  return () => {
    mq.removeEventListener('change', notify)
    window.removeEventListener('resize', notify)
  }
}

/** True on screens wide enough for the web portal to be the natural choice. */
function useWideScreen() {
  return useSyncExternalStore(onScreenChange, () => window.matchMedia(WIDE).matches)
}

export function ExperienceSelector() {
  const setPlatform = usePlatformStore((s) => s.setPlatform)
  const { anim } = useApp()
  const suggested: Platform = useWideScreen() ? 'website' : 'mobile'

  return (
    <div className={`vx${anim ? ' vx--anim' : ''}`}>
      <style>{WORDMARK_CSS}{CHOOSER_CSS}</style>
      <TamilNaduMap className="vx-map" />

      <header className="vx-top">
        <Seal size={66} />
        <VetriWordmark play={false} still />
        <h1 className="vx-h1">Choose your experience</h1>
        <p className="vx-sub">Same secure services. Two ways to use them.</p>
      </header>

      <main className="vx-cards">
        {OPTIONS.map((o) => {
          const pick = o.id === suggested
          return (
            // The whole card is a pointer target; the button inside is the one
            // keyboard and screen-reader users reach, and its click bubbles here.
            <div key={o.id} className="vx-card" data-pick={pick} onClick={() => setPlatform(o.id)}>
              <span className="vx-tab">{o.tab}</span>
              <div className="vx-stage" aria-hidden="true">
                {o.id === 'mobile' ? (
                  <div className="vx-phone"><img src={phonePreview} alt="" width={430} height={932} /></div>
                ) : (
                  <div className="vx-win"><i><b /></i><img src={webPreview} alt="" width={1000} height={694} /></div>
                )}
              </div>
              <div className="vx-body">
                <h2 className="vx-h2">{o.title}</h2>
                <p className="vx-desc">{o.desc}</p>
                <div className="vx-row">
                  <button type="button" className="vx-btn" aria-label={`Continue with the ${o.title}`}>
                    Continue <ArrowRight size={18} strokeWidth={2.3} aria-hidden="true" />
                  </button>
                  {pick && <span className="vx-hint">Best fit for this screen</span>}
                </div>
              </div>
            </div>
          )
        })}
      </main>

      <p className="vx-note">You can switch anytime from your profile.</p>
    </div>
  )
}

const CHOOSER_CSS = `
.vx{position:relative;display:flex;flex-direction:column;align-items:center;min-height:100vh;min-height:100dvh;overflow:hidden;padding:clamp(16px,3.3vh,30px) clamp(14px,4vw,48px) clamp(16px,2.6vh,24px);color-scheme:light;
  background:radial-gradient(70% 70% at 50% 34%,#FFE200 0%,#FFD518 26%,#FFC401 54%,#FFB101 86%,#F8A300 100%);
  font-family:Inter,'Noto Sans Tamil',system-ui,sans-serif;font-size:16px;line-height:1.4;letter-spacing:0;color:#1F1A12;text-align:center}
.vx *,.vx *::before,.vx *::after{box-sizing:border-box}
.vx-map{position:absolute;left:50%;top:-4%;height:112%;width:auto;aspect-ratio:736.1/1000;transform:translateX(-50%);color:#8A1C15;opacity:.26;pointer-events:none;
  -webkit-mask-image:radial-gradient(60% 55% at 50% 45%,transparent 30%,#000 80%);mask-image:radial-gradient(60% 55% at 50% 45%,transparent 30%,#000 80%)}

.vx-top{position:relative;display:flex;flex-direction:column;align-items:center}
.vx-top img{width:clamp(46px,7.3vh,66px);height:auto;filter:drop-shadow(0 0 16px rgba(255,255,255,.95))}
.vx .vw{height:1.5em;margin-top:2px;max-width:none;font-size:clamp(26px,min(6.2vh,9.4vw),56px)}
.vx .vx-h1{margin:clamp(8px,1.6vh,14px) 0 0;font:800 clamp(20px,3vh,27px)/1.15 Inter,'Noto Sans Tamil',system-ui,sans-serif;letter-spacing:-.022em;color:#1F1A12}
.vx-sub{margin:6px 0 0;font-size:clamp(14.5px,1.9vh,17px);color:#3A3122}

.vx-cards{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,560px));justify-content:center;gap:clamp(16px,2.1vw,30px);width:100%;margin-top:clamp(26px,4.9vh,44px)}
.vx-card{position:relative;padding:14px 14px 22px;border:1px solid rgba(138,28,21,.07);border-radius:28px;background:#FFFEFA;box-shadow:0 40px 70px -32px rgba(120,58,0,.6),0 4px 14px rgba(120,58,0,.08);text-align:left;cursor:pointer;transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease}
.vx-card[data-pick=true]{box-shadow:0 0 0 3px #8A1C15,0 44px 76px -30px rgba(120,58,0,.7)}
.vx-card:hover{transform:translateY(-4px)}
.vx-card:active{transform:scale(.992)}
.vx-tab{position:absolute;left:26px;top:-13px;z-index:2;padding:.72em 1em .66em 1.1em;border-radius:8px;background:#8A1C15;color:#FFF5F3;font:800 11.5px/1 Inter,system-ui,sans-serif;letter-spacing:.2em;white-space:nowrap}
.vx-stage{position:relative;height:clamp(150px,29vh,262px);overflow:hidden;border-radius:18px;background:radial-gradient(80% 110% at 50% 20%,#FFE86A 0%,#FFD21A 52%,#FFBD0A 100%)}
.vx-stage img{display:block;width:100%;height:auto}
.vx-phone{position:absolute;left:50%;top:8.5%;width:min(196px,46%);transform:translateX(-50%);overflow:hidden;border:7px solid #17130C;border-radius:30px;box-shadow:0 22px 40px -14px rgba(80,40,0,.6)}
.vx-win{position:absolute;left:50%;top:10%;width:min(452px,88%);transform:translateX(-50%);overflow:hidden;border-radius:12px 12px 0 0;background:#FFFEFA;box-shadow:0 22px 40px -14px rgba(80,40,0,.6)}
.vx-win i{display:flex;align-items:center;height:22px;background:#EFE6CC}
.vx-win i b{display:block;width:150px;max-width:40%;height:9px;margin:0 auto;border-radius:5px;background:#DDD0AA}
.vx-body{padding:18px 12px 0}
.vx .vx-h2{margin:0;font:800 clamp(19px,1.6vw,23px)/1.2 Inter,'Noto Sans Tamil',system-ui,sans-serif;letter-spacing:-.02em;color:#1F1A12}
.vx-desc{margin:5px 0 0;font-size:15.5px;line-height:1.45;color:#5F584A}
.vx-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px 16px;margin-top:16px}
.vx .vx-btn{display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 24px;border:0;border-radius:24px;background:none;color:#8A1C15;box-shadow:inset 0 0 0 1.6px #8A1C15;font:700 16px/1 Inter,system-ui,sans-serif;cursor:pointer}
.vx .vx-card[data-pick=true] .vx-btn{background:#8A1C15;color:#FFF5F3;box-shadow:0 12px 22px -12px rgba(138,28,21,.75)}
.vx .vx-btn:focus-visible{outline:3px solid #1F1A12;outline-offset:3px}
.vx-hint{font-size:13.5px;font-weight:600;color:#8A1C15}
.vx-note{position:relative;margin:auto 0 0;padding-top:clamp(18px,3vh,28px);font-size:14.5px;font-weight:600;color:#5F4A12}

@media (max-width:860px){
  .vx-cards{grid-template-columns:minmax(0,520px);gap:26px}
  .vx-stage{height:clamp(150px,23vh,230px)}
}
@media (max-width:420px){
  .vx-tab{left:18px;font-size:10.5px;letter-spacing:.12em}
  .vx-desc{font-size:14.5px}
}

/* Arrival: the heading settles, then the two options rise in turn. Fill is
   "backwards" only, so the hover lift is free once each card has landed. */
.vx--anim .vx-top{animation:vxIn .7s cubic-bezier(.16,1,.3,1) backwards}
.vx--anim .vx-card{animation:vxUp .75s cubic-bezier(.16,1,.3,1) .14s backwards}
.vx--anim .vx-card:nth-child(2){animation-delay:.24s}
.vx--anim .vx-note{animation:vxIn .6s ease .5s backwards}
@keyframes vxIn{from{opacity:0;transform:translateY(-8px)}}
@keyframes vxUp{from{opacity:0;transform:translateY(22px)}}
@media (prefers-reduced-motion:reduce){.vx *{animation:none !important;transition:none !important}}
`

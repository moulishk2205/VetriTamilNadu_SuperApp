import { useState, useEffect, useRef } from "react";
import sealUrl from "@/assets/seal-tn.svg";
import { useApp } from "@/hooks/useUi";
import { TamilNaduMap } from "@/components/map/TamilNaduMap";
import { VetriWordmark, WORDMARK_CSS, WORDMARK_FONT } from "@/components/brand/VetriWordmark";

const SPLASH_CSS = `
.vs{position:relative;height:100vh;height:100dvh;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#8A1C15;
  background:radial-gradient(74% 66% at 50% 45%,#FFE200 0%,#FFD518 24%,#FFC401 50%,#FFB101 80%,#F8A300 100%)}
.vs-map{position:absolute;left:50%;top:50%;height:132%;aspect-ratio:736/1000;transform:translate(-50%,-50%);opacity:.26;pointer-events:none;
  -webkit-mask-image:radial-gradient(closest-side,transparent 38%,#000 78%);mask-image:radial-gradient(closest-side,transparent 38%,#000 78%)}
.vs-map svg{display:block;width:100%;height:100%}
.vs-emblem{position:relative;width:clamp(96px,11vw,158px);opacity:0;transform:scale(.7);transition:opacity .8s ease,transform .8s cubic-bezier(.34,1.56,.64,1)}
.vs-emblem.in{opacity:1;transform:scale(1)}
.vs-emblem img{position:relative;display:block;width:100%;height:auto;animation:vsGlow 2.6s ease-in-out .9s infinite}
.vs-halo{position:absolute;inset:-48%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.96) 0%,rgba(255,247,170,.72) 34%,rgba(255,226,0,0) 68%);animation:vsHalo 2.6s ease-in-out .9s infinite}
@keyframes vsGlow{0%,100%{filter:drop-shadow(0 0 10px rgba(255,255,255,.75))}50%{filter:drop-shadow(0 0 26px rgba(255,255,255,1)) drop-shadow(0 0 54px rgba(255,238,120,.9))}}
@keyframes vsHalo{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}
.vs .vw{position:relative;margin-top:clamp(10px,1.6vw,20px)}
.vs-tab{position:relative;display:flex;align-items:center;gap:clamp(8px,1.2vw,18px);margin-top:clamp(14px,2.2vw,30px);opacity:0;transform:translateY(10px);transition:opacity .6s ease 1.9s,transform .6s cubic-bezier(.16,1,.3,1) 1.9s}
.vs-tab.in{opacity:1;transform:none}
.vs-br{width:clamp(18px,6.5vw,170px);height:20px;border-bottom:3px solid #8A1C15}
.vs-br.l{border-right:3px solid #8A1C15}.vs-br.r{border-left:3px solid #8A1C15}
.vs-pill{background:#8A1C15;color:#FFF5F3;font:800 clamp(12px,1.25vw,17px)/1 Inter,'Noto Sans Tamil',sans-serif;letter-spacing:.3em;padding:.82em 1.1em .78em 1.4em;border-radius:10px;white-space:nowrap}
.vs-bar{position:relative;width:210px;height:6px;border-radius:3px;background:rgba(138,28,21,.2);margin-top:clamp(20px,2.6vw,36px);overflow:hidden;opacity:0;transition:opacity .5s ease 2.2s}
.vs-bar.in{opacity:1}
.vs-bar i{display:block;width:40%;height:100%;border-radius:3px;background:#8A1C15;animation:vsLoad 1.3s ease-in-out infinite}
@keyframes vsLoad{from{transform:translateX(-110%)}to{transform:translateX(280%)}}
.vs-foot{position:absolute;left:0;right:0;bottom:clamp(18px,3vh,30px);font:600 15px Inter,'Noto Sans Tamil',sans-serif}
.vs--still .vs-emblem,.vs--still .vs-tab,.vs--still .vs-bar{transition:none}
.vs--still .vs-emblem img,.vs--still .vs-halo,.vs--still .vs-bar i{animation:none}
@media (prefers-reduced-motion: reduce){.vs-emblem,.vs-tab,.vs-bar{transition:none}.vs-emblem img,.vs-halo,.vs-bar i{animation:none}}
`;

/**
 * Startup screen — the state emblem lights up on the yellow field, then the
 * title is lettered: outline first, colour second, as in the showreel.
 *
 * The lettering waits for its display face (briefly) so it is never drawn in a
 * fallback font, and the whole sequence collapses to a still frame when the
 * system or the app's Accessibility setting asks for no motion.
 */
const SplashScreen = ({onDone}) => {
  const { anim } = useApp();
  const [still] = useState(() => !anim || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [emblem, setEmblem] = useState(still);
  const [word, setWord] = useState(still);
  // Keep the latest onDone in a ref (updated in an effect, never during render)
  // so the one-shot timers below never re-run if the parent passes a new callback.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    if (still) {
      later(() => onDoneRef.current(), 1800);
      return () => timers.forEach(clearTimeout);
    }
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setWord(true);
      later(() => onDoneRef.current(), 3500);
    };
    later(() => setEmblem(true), 250);
    // Letter the title once its face is ready, but never before the emblem has
    // landed and never later than 2.4s in.
    const face = document.fonts?.load ? document.fonts.load(WORDMARK_FONT, "வெற்றி தமிழ்நாடு") : Promise.resolve();
    later(() => face.then(start, start), 800);
    later(start, 2400);
    return () => timers.forEach(clearTimeout);
  }, [still]);

  return (
    <div className={`vs${still ? " vs--still" : ""}`}>
      <style>{WORDMARK_CSS}{SPLASH_CSS}</style>
      <div className="vs-map" aria-hidden="true"><TamilNaduMap /></div>
      <div className={`vs-emblem${emblem ? " in" : ""}`}><span className="vs-halo" /><img src={sealUrl} alt="Government of Tamil Nadu emblem" /></div>
      <VetriWordmark play={word} still={still} />
      <div className={`vs-tab${word ? " in" : ""}`}><span className="vs-br l" /><span className="vs-pill">GOVERNMENT SUPER APP</span><span className="vs-br r" /></div>
      <div className={`vs-bar${word ? " in" : ""}`}><i /></div>
      <p className="vs-foot">e-Sevai 2.0 prototype · <span lang="ta">தமிழ்நாடு மக்களுக்காக</span></p>
    </div>
  );
};

export default SplashScreen;

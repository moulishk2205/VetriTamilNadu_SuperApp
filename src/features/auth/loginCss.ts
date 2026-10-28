/**
 * Sign-in in the street-banner look: a yellow poster — the Chief Minister in
 * front of the constituency map, the title lettering across the chest — beside
 * a quiet near-white form. One stylesheet serves the web portal sign-in and the
 * phone sign-in; the poster is sized in container units so the same markup
 * holds its proportions in a 900px panel and a 390px phone.
 *
 * Shapes: card 28px, controls 14px, tabs 10px, the language switch a full pill.
 * The surface is deliberately theme-independent, like the loading screen.
 */

// Poster proportions when it sits above the form (phone, and the portal below 980px).
const POSTER_ON_TOP =
  '--fig-x:50cqw;--fig-h:84cqh;--fig-w:150cqw;--fig-b:-7.6cqh;--map-x:50%;--map-y:-6.7%;--map-h:121%;--halo:121%;--word:min(9.74cqw,10cqh);--word-x:50cqw;--word-b:3cqh'

export const LOGIN_CSS = `
.vl{position:relative;display:grid;grid-template-rows:minmax(0,1fr) auto;min-height:100vh;min-height:100dvh;overflow:hidden;color-scheme:light;
  background:radial-gradient(58% 80% at 25.5% 46%,#FFE200 0%,#FFD518 24%,#FFC401 50%,#FFB101 84%,#F8A300 100%);
  font-family:Inter,'Noto Sans Tamil',system-ui,sans-serif;font-size:16px;line-height:1.4;letter-spacing:0;color:#1F1A12;text-align:left}
.vl *,.vl *::before,.vl *::after{box-sizing:border-box}

/* ── Identity and language, over the top edge ──────────────────────── */
.vl-head{position:absolute;z-index:3;inset:0 0 auto 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:clamp(18px,4.6vh,42px) clamp(20px,4.4vw,64px) 0;pointer-events:none}
.vl-head>*{pointer-events:auto}
.vl-lock{display:flex;align-items:center;gap:14px}
.vl-lock img{display:block;filter:drop-shadow(0 0 14px rgba(255,255,255,.9))}
.vl-lock b{display:block;font:800 21px/1.2 'Noto Sans Tamil',Inter,sans-serif;color:#8A1C15}
.vl-lock span{display:block;margin-top:3px;font-size:13.5px;font-weight:600;color:#5F4A12}
.vl .vl-lang{display:inline-flex;align-items:center;gap:8px;height:42px;margin-top:8px;padding:0 16px;border-radius:21px;border:1px solid rgba(138,28,21,.24);background:rgba(255,254,250,.66);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#8A1C15;font:700 15px/1 'Noto Sans Tamil',Inter,sans-serif;cursor:pointer;transition:background .15s ease}
.vl .vl-lang:hover{background:rgba(255,254,250,.9)}

/* ── The poster ────────────────────────────────────────────────────── */
.vl-stage{display:grid;grid-template-columns:minmax(0,1fr) clamp(420px,36vw,520px);min-height:0}
.vl-poster{position:relative;container-type:size;min-height:420px;overflow:hidden;
  --fig-x:40cqw;--fig-h:93cqh;--fig-w:112cqw;--fig-b:-7.4cqh;--map-x:53.5%;--map-y:-14.1%;--map-h:112.8%;--halo:96%;--word:min(8.7cqw,14cqh);--word-x:46.7cqw;--word-b:1.9cqh}
/* Side by side, the poster is sized by the window, not by the form: an error line or the code step never rescales the portrait. */
@media (min-width:981px){.vl-stage>.vl-poster{align-self:end;height:max(420px,calc(100vh - 62px));height:max(420px,calc(100dvh - 62px))}}
.vl-fig{position:absolute;left:var(--fig-x);bottom:var(--fig-b);height:min(var(--fig-h),var(--fig-w));aspect-ratio:4/5;transform:translateX(-50%)}
.vl-map{position:absolute;left:var(--map-x);top:var(--map-y);height:var(--map-h);width:auto;aspect-ratio:736.1/1000;transform:translateX(-50%);color:#8A1C15;opacity:.42}
.vl-halo{position:absolute;left:49.8%;top:37.7%;width:var(--halo);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,252,220,.95) 0,rgba(255,238,110,.82) 40%,rgba(255,226,0,0) 70%)}
.vl-cm{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%)}
.vl-cap{position:absolute;left:82.7%;top:48.5%;white-space:nowrap}
.vl-pill{display:inline-block;padding:.72em 1.05em .66em;border-radius:10px;background:#8A1C15;color:#FFF5F3;font:800 clamp(12px,1.75cqw,16px)/1 'Noto Sans Tamil',Inter,sans-serif;letter-spacing:.07em}
.vl-cap small{display:block;margin-top:9px;font-size:clamp(11px,1.47cqw,13.5px);font-weight:600;color:#5F4A12}
@container (max-width:700px){.vl-cap{display:none}}
.vl-word{position:absolute;left:var(--word-x);bottom:var(--word-b);transform:translateX(-50%);pointer-events:none}
.vl .vl-word .vw{font-size:var(--word);max-width:none}

/* ── The form ──────────────────────────────────────────────────────── */
.vl-side{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;min-width:0;padding:calc(clamp(18px,4.6vh,42px) + 62px) clamp(20px,4.4vw,64px) calc(clamp(18px,4.6vh,42px) + 24px) 0}
.vl-card{width:100%;padding:clamp(26px,4.6vh,44px) clamp(26px,2.9vw,42px) clamp(24px,3.6vh,34px);border-radius:28px;border:1px solid rgba(138,28,21,.07);background:#FFFEFA;box-shadow:0 40px 70px -30px rgba(120,58,0,.55),0 4px 14px rgba(120,58,0,.08)}
.vl .vl-h1{margin:0;font:800 clamp(32px,2.9vw,42px)/1.05 Inter,'Noto Sans Tamil',system-ui,sans-serif;letter-spacing:-.028em;color:#1F1A12}
.vl-lede{margin:12px 0 clamp(20px,3.2vh,30px);font-size:16.5px;line-height:1.5;color:#5F584A}
.vl-lede b{font-weight:700;color:#1F1A12;white-space:nowrap}
.vl-lab{display:block;margin-bottom:9px;font-size:14.5px;font-weight:600;color:#1F1A12}
.vl-field{display:flex;align-items:stretch;height:60px;overflow:hidden;border-radius:14px;border:1.5px solid #978A63;background:#fff;transition:border-color .15s ease,box-shadow .15s ease}
.vl-field:focus-within{border-color:#8A1C15;box-shadow:0 0 0 1px #8A1C15,0 0 0 5px rgba(138,28,21,.14)}
.vl-field[data-invalid=true]{border-color:#B3261E}
.vl-pre{display:flex;align-items:center;padding:0 16px;border-right:1.5px solid #E6DCBD;background:#FBF7EA;font-size:18px;font-weight:600;color:#5F584A}
.vl .vl-in{flex:1;min-width:0;height:100%;padding:0 16px;border:0;border-radius:0;outline:0;background:transparent;color:#1F1A12;caret-color:#8A1C15;font:600 21px/1 Inter,system-ui,sans-serif;letter-spacing:.03em;font-variant-numeric:tabular-nums}
.vl .vl-in--code{font-size:25px;font-weight:700;letter-spacing:.42em}
.vl .vl-in:-webkit-autofill{-webkit-box-shadow:0 0 0 80px #fff inset;-webkit-text-fill-color:#1F1A12}
.vl-hint{margin-top:9px;font-size:13.5px;color:#5F584A}
.vl-err{display:flex;align-items:flex-start;gap:7px;margin-top:9px;font-size:14px;font-weight:600;line-height:1.4;color:#B3261E}
.vl-err svg{flex:none;margin-top:1px}
.vl .vl-cta{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:58px;margin-top:22px;border:0;border-radius:14px;background:#8A1C15;color:#FFF5F3;box-shadow:0 14px 24px -12px rgba(138,28,21,.7);font:700 17px/1 Inter,'Noto Sans Tamil',system-ui,sans-serif;cursor:pointer;transition:background .15s ease,transform .12s ease}
.vl .vl-cta:hover{background:#761610}
.vl .vl-cta:active{transform:scale(.985)}
.vl .vl-cta[aria-busy=true]{cursor:progress}
.vl .vl-link{padding:0;border:0;background:none;color:#8A1C15;font:inherit;font-weight:700;cursor:pointer}
.vl .vl-link:hover{text-decoration:underline;text-underline-offset:3px}
.vl .vl-back{display:inline-flex;align-items:center;gap:7px;min-height:32px;margin:-6px 0 18px;font-size:14.5px;font-weight:600}
.vl-resend{margin-top:18px;font-size:14.5px;line-height:1.5;color:#5F584A;text-align:center}
.vl-trust{display:flex;align-items:flex-start;gap:10px;margin-top:clamp(18px,3vh,28px);padding-top:clamp(14px,2.2vh,20px);border-top:1px solid #ECE3C7;font-size:13px;line-height:1.5;color:#5F584A}
.vl-trust svg{flex:none;margin-top:1px;color:#1E8E4E}
.vl-spin{animation:vlSpin .9s linear infinite}
.vl .vl-lang:focus-visible,.vl .vl-cta:focus-visible,.vl .vl-link:focus-visible,.vl .vl-seg button:focus-visible{outline:3px solid #1F1A12;outline-offset:3px}
.vl .vl-lang:focus-visible{border-radius:21px}.vl .vl-cta:focus-visible{border-radius:14px}.vl .vl-link:focus-visible{border-radius:6px}.vl .vl-seg button:focus-visible{border-radius:10px}
.vl .vl-in:focus-visible{outline:0;border-radius:0}

/* ── Base strip ────────────────────────────────────────────────────── */
.vl-band{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px 24px;flex-wrap:wrap;min-height:62px;padding:12px clamp(20px,4.4vw,64px);background:#8A1C15;color:#FFF5F3;font-size:16px;font-weight:600}
.vl-band span:last-child{font-size:14px;font-weight:500;color:#F3D9D5}

/* ── Tamil: no negative tracking, a little more leading ────────────── */
.vl[lang=ta] .vl-h1{font-size:clamp(23px,1.88vw,27px);line-height:1.3;letter-spacing:0}
.vl[lang=ta] .vl-lede{font-size:15.5px;line-height:1.65}
.vl[lang=ta] .vl-cta{font-size:16px}
.vl[lang=ta] .vl-band{font-size:15px}

/* ── Portal on a narrow window: poster above, form below ───────────── */
@media (max-width:980px){
  .vl{background:radial-gradient(90% 420px at 50% 210px,#FFE200 0%,#FFD518 30%,#FFC401 60%,#FFB101 100%)}
  .vl-cap{display:none}
  .vl-stage{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}
  .vl-poster{height:clamp(300px,46vh,440px);min-height:0;${POSTER_ON_TOP}}
  .vl-side{justify-content:flex-start;margin-top:-1px;padding:0 clamp(16px,4vw,32px) 32px}
  .vl-card{max-width:560px;margin:0 auto}
  .vl-lock b{font-size:17px}.vl-lock span{font-size:12.5px}
}
@media (max-width:560px){
  .vl-lock span{display:none}
  .vl-band{font-size:14px}
}

/* ── Phone: the form is a sheet rising over the poster ─────────────── */
.vl--phone{display:flex;flex-direction:column;min-height:100vh;min-height:100svh;background:radial-gradient(520px 440px at 50% 200px,#FFE200 0%,#FFD518 30%,#FFC401 60%,#FFB101 100%)}
.vl-status{position:absolute;z-index:3;inset:0 0 auto 0}
.vl-status [data-mobile-chrome]{color:#1F1A12 !important}
.vl--phone .vl-head{padding:42px 18px 0}
.vl--phone .vl-lock{gap:9px}.vl--phone .vl-lock b{font-size:15px}.vl--phone .vl-lock span{display:none}
.vl--phone .vl-lang{height:36px;margin-top:0;padding:0 13px;border-radius:18px;font-size:13.5px}
.vl--phone .vl-lang:focus-visible{border-radius:18px}
.vl--phone .vl-cap{display:none}
.vl--phone .vl-poster{flex:none;height:clamp(290px,46vh,420px);min-height:0;${POSTER_ON_TOP}}
.vl-sheet{position:relative;z-index:2;flex:1;padding:28px 22px 30px;border-radius:30px 30px 0 0;background:#FFFEFA;box-shadow:0 -18px 40px -14px rgba(120,58,0,.45)}
.vl .vl-sheet .vl-h1{font-size:30px;line-height:1.1;letter-spacing:-.025em}
.vl[lang=ta] .vl-sheet .vl-h1{font-size:25px;line-height:1.3;letter-spacing:0}
.vl-sheet .vl-lede{margin:8px 0 18px;font-size:15px}
.vl-sheet .vl-field{height:56px}
.vl .vl-sheet .vl-cta{height:56px;margin-top:18px}
.vl-sheet .vl-trust{margin-top:22px;padding-top:16px;font-size:12.5px}
.vl-seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-bottom:20px;padding:4px;border-radius:14px;background:#F3ECD6}
.vl .vl-seg button{min-height:44px;padding:4px 6px;border:0;border-radius:10px;background:transparent;color:#5F584A;font:600 14px/1.15 Inter,'Noto Sans Tamil',system-ui,sans-serif;cursor:pointer;transition:background .15s ease,color .15s ease}
.vl .vl-seg button[aria-pressed=true]{background:#fff;color:#8A1C15;font-weight:700;box-shadow:0 2px 6px rgba(120,58,0,.16)}
.vl-bio{text-align:center}
.vl-bio-ico{display:flex;align-items:center;justify-content:center;width:88px;height:88px;margin:2px auto 14px;border-radius:50%;background:#FBF1DF;color:#8A1C15}
.vl-bio-t{font-size:18px;font-weight:700;color:#1F1A12}
.vl-bio .vl-lede{margin:6px 0 4px}
.vl-bio .vl-err{justify-content:center;text-align:left}
.vl-bio .vl-link{display:inline-flex;align-items:center;min-height:32px;margin-top:10px;font-size:14.5px}
.vl-wait{padding:44px 0 36px;text-align:center;color:#8A1C15}
.vl-wait p{margin-top:14px;font-size:16px;font-weight:600;color:#1F1A12}

/* ── Arrival ───────────────────────────────────────────────────────── */
.vl--anim .vl-fig{animation:vlRise .9s cubic-bezier(.16,1,.3,1) both}
.vl--anim .vl-word{animation:vlWord .8s cubic-bezier(.16,1,.3,1) .28s both}
.vl--anim .vl-cap{animation:vlFade .6s ease .7s both}
.vl--anim .vl-card,.vl--anim .vl-sheet{animation:vlCard .7s cubic-bezier(.16,1,.3,1) .12s both}
.vl--anim .vl-step{animation:vlStep .3s ease both}
@keyframes vlRise{from{opacity:0;transform:translate(-50%,3%)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes vlWord{from{opacity:0;transform:translate(-50%,12%) scale(.96)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes vlFade{from{opacity:0}to{opacity:1}}
@keyframes vlCard{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes vlStep{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes vlSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.vl *{animation:none !important;transition:none !important}}
`

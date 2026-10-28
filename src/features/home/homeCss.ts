/**
 * Web dashboard styles — a sunlit yellow sky over a calm parchment desk.
 *
 * Yellow is the brand's field, so it is kept to the top of the page where the
 * greeting sits; everything that is read at length rests on near-white cards.
 * Red is reserved for the brand, the active menu item, the one main action and
 * links. Sizes inside the page are in `em` so the Accessibility text-size
 * setting scales them.
 */
export const HOME_CSS = `
.vh{--foot:#FAF2D3;--strip:#8A1C15;--page:#F4EAC4;--card:#FFFEFA;--tile:#F8F3E2;--ink:#1F1A12;--ink2:#5F584A;--line:rgba(90,60,0,.13);
  --accent:#8A1C15;--on-accent:#fff;--link:#8A1C15;--glass:rgba(255,255,255,.68);--ctl:rgba(31,26,18,.07);--chev:#A39A86;
  --sky:radial-gradient(64% 120% at 50% -8%,#FFE200 0%,#FFCE12 38%,#FFC401 60%,#FFB101 100%);
  --edge:transparent;--lift:0 0 0 1px rgba(90,60,0,.075),0 1px 1px -.5px rgba(90,60,0,.07),0 3px 3px -1.5px rgba(90,60,0,.06),0 6px 6px -3px rgba(90,60,0,.05),0 12px 12px -6px rgba(90,60,0,.045),0 24px 24px -12px rgba(90,60,0,.04);
  position:relative;background:var(--page);color:var(--ink)}
.vh[data-theme="dark"]{--foot:#1B160D;--strip:#3A0F0B;--page:#15110A;--card:#211B11;--tile:#2C2416;--ink:#F6EFE0;--ink2:#BCB09A;--line:rgba(255,235,180,.15);
  --accent:#FFC401;--on-accent:#1F1A12;--link:#FFD24A;--glass:rgba(44,35,18,.72);--ctl:rgba(255,240,200,.1);--chev:#8C8169;
  --sky:radial-gradient(64% 120% at 50% -8%,#A06A00 0%,#5C3D00 46%,#2A1C00 100%);
  --edge:rgba(255,235,180,.15);--lift:0 1px 0 rgba(255,240,200,.05) inset,0 18px 30px -22px rgba(0,0,0,.7)}
.vh-sky{position:absolute;left:0;right:0;top:0;height:400px;background:var(--sky);pointer-events:none;
  -webkit-mask-image:linear-gradient(180deg,#000 46%,transparent 100%);mask-image:linear-gradient(180deg,#000 46%,transparent 100%)}

/* Floating menu bar: translucent material above the content */
.vh-bar{position:sticky;top:14px;z-index:50;margin:14px 24px 0;height:62px;border-radius:31px;display:flex;align-items:center;gap:10px;padding:0 11px 0 14px;
  background:var(--glass);-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);border:1px solid rgba(255,255,255,.5);box-shadow:0 10px 26px -14px rgba(90,50,0,.55)}
.vh[data-theme="dark"] .vh-bar{border-color:rgba(255,235,180,.16)}
.vh-bar button{font-family:inherit;cursor:pointer;border:none;color:var(--ink)}
.vh-brand{display:flex;align-items:center;gap:10px;background:none;padding:0;font-size:16.5px;font-weight:700;letter-spacing:-.01em;white-space:nowrap;flex-shrink:0}
.vh-tabs{display:flex;gap:2px;margin:0 auto;min-width:0;overflow-x:auto;scrollbar-width:none}
.vh-tabs::-webkit-scrollbar{display:none}
.vh-tabs button{padding:9px 11px;border-radius:20px;background:none;font-size:14.5px;font-weight:600;white-space:nowrap;transition:background .15s ease}
.vh-tabs button:hover{background:var(--ctl)}
.vh-tabs button[aria-current="page"]{background:var(--accent);color:var(--on-accent)}
.vh-find{display:flex;align-items:center;gap:8px;width:150px;height:40px;border-radius:20px;background:var(--ctl);padding:0 14px;color:var(--ink2);flex-shrink:0}
.vh-find input{flex:1;min-width:0;background:none;border:none;outline:none;font:inherit;font-size:14.5px;color:var(--ink)}
.vh-find input::placeholder{color:var(--ink2)}
.vh-find:focus-within{box-shadow:0 0 0 2px var(--accent)}
.vh-ctl{position:relative;height:40px;min-width:40px;border-radius:20px;display:grid;place-items:center;background:var(--ctl);font-size:14px;font-weight:600;padding:0 13px;flex-shrink:0}
.vh-ctl em{position:absolute;top:-4px;right:-4px;min-width:19px;height:19px;border-radius:10px;background:var(--accent);color:var(--on-accent);font:700 11.5px Inter,sans-serif;display:grid;place-items:center;padding:0 4px}
.vh-ava{width:40px;height:40px;border-radius:50%;background:var(--accent) !important;color:var(--on-accent) !important;font-size:13.5px;font-weight:700;flex-shrink:0}
.vh-menu{position:absolute;right:0;top:calc(100% + 12px);width:270px;background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 20px 44px -16px rgba(40,25,0,.45);overflow:hidden;z-index:61}
.vh-menu button{width:100%;display:flex;align-items:center;gap:11px;padding:13px 16px;background:none;border-top:1px solid var(--line);font-size:14.5px;font-weight:500;text-align:left}
.vh-menu button:hover{background:var(--ctl)}
@media (max-width:1260px){.vh-find{display:none}}
@media (max-width:1140px){.vh-brand span{display:none}}

/* Page */
.vh-main{position:relative;flex:1;padding:26px clamp(16px,3.9vw,56px) 44px}
/* Inner pages: a shorter sky, the same margins, a comfortable maximum width */
.vh-sky--page{height:320px}
/* Phone-sized pre-sign-in screens shown on the portal */
.vh-auth{position:relative;max-width:480px;min-height:100vh;margin:0 auto}
.vh-page{width:100%;max-width:1760px;margin-inline:auto;padding-top:30px}
.vh-lead h1{margin:0;font-size:2.75em;font-weight:700;letter-spacing:-.022em;line-height:1.12;color:var(--ink);overflow-wrap:anywhere}
.vh-lead h1 span{font-family:'Noto Sans Tamil',sans-serif;font-size:.9em}
.vh-lead h1.vh-hello{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .32em;font-size:3.1em;letter-spacing:-.03em;line-height:1.08}
.vh-hello .vh-hello-ta{font-family:'Noto Serif Tamil','Noto Sans Tamil',serif;font-weight:900;font-stretch:80%;font-size:.86em;letter-spacing:0;color:var(--accent)}
.vh[data-theme="dark"] .vh-hello .vh-hello-ta{color:#FFC401}
.vh-lead p{font-size:1.1875em;margin-top:.45em;color:var(--ink);opacity:.86}
.vh-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:20px;margin-top:26px}
.vh-a{grid-column:span 5}.vh-b{grid-column:span 7}.vh-c{grid-column:span 6}.vh-d,.vh-e{grid-column:span 3}
@media (max-width:1180px){.vh-a,.vh-b,.vh-c{grid-column:span 12}.vh-d,.vh-e{grid-column:span 6}}
@media (max-width:760px){.vh-d,.vh-e{grid-column:span 12}}
.vh-card{background:var(--card);border:1px solid var(--edge);border-radius:22px;box-shadow:var(--lift);overflow:hidden;min-width:0}
/* The one card that asks something of the citizen stands apart: a warm edge, nothing louder. */
.vh-card--urgent{border-color:transparent;background:linear-gradient(180deg,rgba(255,206,18,.13),transparent 9em) padding-box,linear-gradient(var(--card),var(--card)) padding-box,linear-gradient(165deg,rgba(232,89,12,.6),rgba(232,89,12,.14) 42%,rgba(90,60,0,.08)) border-box;box-shadow:0 18px 34px -22px rgba(200,70,0,.45),var(--lift)}
.vh[data-theme="dark"] .vh-card--urgent{background:linear-gradient(180deg,rgba(255,150,40,.10),transparent 9em) padding-box,linear-gradient(var(--card),var(--card)) padding-box,linear-gradient(165deg,rgba(255,140,60,.55),rgba(255,140,60,.12) 42%,rgba(255,235,180,.1)) border-box}
.vh-ch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1.1em 1.375em .6em}
.vh-ch h2{margin:0;font-size:1.09em;font-weight:700;letter-spacing:-.01em;color:var(--ink)}
.vh-link{display:inline-flex;align-items:center;gap:2px;background:none;border:none;padding:0;font:inherit;font-size:.9em;font-weight:600;color:var(--link);cursor:pointer;white-space:nowrap}
.vh-link:hover{text-decoration:underline;text-underline-offset:3px}
.vh-badge{display:inline-grid;place-items:center;min-width:1.7em;height:1.7em;border-radius:1em;background:var(--accent);color:var(--on-accent);font-size:.72em;font-weight:700;margin-left:.6em;vertical-align:.1em}
.vh-row{width:100%;display:grid;align-items:center;gap:14px;padding:.8em 1.375em;border:none;border-top:1px solid var(--line);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;transition:background .15s ease}
.vh-row:hover{background:var(--ctl)}
.vh .vh-row:not(:disabled):active{transform:none;background:var(--ctl)}
.vh-rail{display:flex;flex-direction:column;gap:7px;min-width:0}
.vh-rail small{font-size:.84em;color:var(--ink2);line-height:1.35}
.vh-row b{display:block;font-size:1em;font-weight:650;letter-spacing:-.005em;overflow-wrap:anywhere}
.vh-row small{display:block;font-size:.84em;color:var(--ink2);line-height:1.4}
.vh-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8em !important;letter-spacing:.01em}
.vh-st{display:flex;align-items:center;gap:8px;font-size:.9em;font-weight:600}
.vh-st i{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.vh-due{font-size:.875em;color:var(--ink2);text-align:right}
.vh-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 22px;border-radius:23px;border:none;background:var(--accent);color:var(--on-accent);font:inherit;font-size:.97em;font-weight:650;cursor:pointer;transition:transform .2s cubic-bezier(.16,1,.3,1),filter .2s ease}
@media (hover:hover) and (pointer:fine){.vh-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}}
.vh-btn--line{background:none;color:var(--link);box-shadow:inset 0 0 0 1.5px var(--link);min-height:42px}
.vh-sq{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;flex-shrink:0}
.vh-svc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:.25em 1em 1.1em}
.vh-svc button{display:flex;align-items:center;gap:12px;padding:1em .75em;border-radius:16px;border:none;background:var(--tile);font:inherit;color:inherit;text-align:left;cursor:pointer;transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s ease}
@media (hover:hover) and (pointer:fine){.vh-svc button:hover{transform:translateY(-1px);box-shadow:0 8px 18px -12px rgba(60,40,0,.5)}}
.vh-svc b{display:block;font-size:.94em;font-weight:650;line-height:1.25}
.vh-svc small{font-size:.82em;color:var(--ink2)}
@media (max-width:560px){.vh-svc{grid-template-columns:minmax(0,1fr)}}
.vh-map{position:relative;height:112px;margin:0 1em;border-radius:14px;overflow:hidden;background:radial-gradient(90% 90% at 60% 40%,#FFE200,#FFC401);color:#8A1C15}
.vh-map{--map-halo:#FFD60A}
.vh-map svg{display:block;width:100%;height:100%}
.vh-map span{position:absolute;right:10px;top:10px;background:#8A1C15;color:#fff;font-size:.82em;font-weight:700;padding:.3em .8em;border-radius:8px}
.vh-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:.75em 1em 0;text-align:center}
.vh-stats p{background:var(--tile);border-radius:12px;padding:.5em .25em}
.vh-stats b{display:block;font-size:1.36em;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.vh-stats b i{font-style:normal;font-size:.6em;font-weight:600;letter-spacing:0;color:var(--ink2)}
.vh-stats small{display:block;font-size:.78em;color:var(--ink2);line-height:1.25}
.vh-skel{margin:.4em 1.375em 1.2em;height:4em;border-radius:12px;background:var(--tile)}
.vh :focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* Footer: quiet on the page, the banner's red only in the slim strip at the bottom */
.vh-foot{position:relative;margin-top:48px;border-top:1px solid var(--line);background:var(--foot);color:var(--ink2)}
.vh-foot-in{display:grid;grid-template-columns:minmax(230px,1.3fr) repeat(auto-fit,minmax(150px,1fr));gap:30px;max-width:1760px;margin:0 auto;padding:38px clamp(16px,3.9vw,56px) 30px}
.vh-foot-id{display:flex;align-items:center;gap:11px}
.vh-foot-name{font-size:15.5px;font-weight:700;color:var(--ink)}
.vh-foot-ta{font-size:12px;color:var(--ink2);font-family:'Noto Sans Tamil',sans-serif}
.vh-foot-about{max-width:300px;margin-top:13px;font-size:13px;line-height:1.6}
.vh-foot .vh-foot-h{margin:0 0 12px;font-size:12.5px;font-weight:700;letter-spacing:.02em;color:var(--ink)}
.vh-foot nav{display:flex;flex-direction:column;align-items:flex-start;gap:9px}
.vh-foot nav button{padding:0;border:0;background:none;font:inherit;font-size:13.5px;color:var(--ink2);cursor:pointer;text-align:left}
.vh-foot nav button:hover{color:var(--link);text-decoration:underline;text-underline-offset:3px}
.vh-foot-strip{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;padding:14px clamp(16px,3.9vw,56px);background:var(--strip);color:#FFF5F3;font-size:12.5px;font-weight:500}
.vh-foot-strip span:last-child{color:#F3D9D5}
@media (prefers-reduced-motion: reduce){.vh-btn,.vh-svc button{transition:none}}
`

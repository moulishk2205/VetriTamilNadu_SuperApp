import { useState } from "react";
import { ChevronRight, Search, Bell, Mic, User, Phone, AlertTriangle, HeartPulse, BadgeCheck, Siren, Flame, Sparkles, QrCode, ArrowRight } from "lucide-react";
import { Seal, StatusBar, BottomNav, Card, Sec, SearchModal, LIFT } from "@/components/ui";
import { useApp, useT, useC } from "@/hooks/useUi";
import { useSchemeCards } from "@/features/schemes/hooks/useSchemes";
import { serviceLook, documentLook, FEATURE_LOOKS } from "@/features/services/serviceLook";
import { useHomeBoard, BOARD_STATE, expiryOf } from "@/features/home/useHomeBoard";
import { useWalletDocumentCards } from "@/features/documents/hooks/useDocuments";
import { StepRail } from "@/components/feedback/StepRail";

/**
 * Fine security-print linework for the citizen ID card: interleaved sine bands,
 * the pattern printed on real identity documents. Drawn once.
 */
const GUILLOCHE = Array.from({ length: 9 }, (_, k) => {
  let d = "";
  for (let x = 0; x <= 220; x += 4) {
    const y = 64 + Math.sin(x / 17 + k * 0.7) * (22 + k * 2) + Math.sin(x / 41 - k) * 9;
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
  }
  return d;
}).join("");

const enter = (i) => ({ "--i": i });

const HomeDashboard = ({onNav}) => { const c=useC(); const t=useT(); const {dark,anim}=useApp();
  const [searchOpen,setSearchOpen]=useState(false);
  // "Now" is read once per visit so expiry checks stay stable between renders.
  const [now]=useState(()=>Date.now());
  // Entrance motion follows the Animations preference.
  const en=anim?"v-enter":undefined;
  // Each shortcut deep-links straight into its own workflow — no intermediate
  // Services page. Service shortcuts route to /service/:slug; the rest to their tab.
  // Icons and colours come from the shared service look, so a shortcut matches
  // the same service on the Services page and on the web portal.
  const svc=(id,l)=>{const k=serviceLook(id);return {icon:k.Icon,l,cl:k.colour,nav:`service/${id}`};};
  const feat=(k,l,nav)=>({icon:FEATURE_LOOKS[k].Icon,l,cl:FEATURE_LOOKS[k].colour,nav});
  const qa=[svc("svc_dl","Driving Licence"),svc("svc_ration","Ration Card"),svc("svc_birth","Birth Certificate"),feat("complaint","Complaints","complaint"),feat("tracker","Track Service","tracker"),feat("schemes","Schemes","schemes")];
  // The same board the web dashboard reads: what needs the citizen, then their
  // applications most pressing first, each with its statutory steps.
  const board=useHomeBoard();
  const urgent=board.attention.filter(x=>x.tone!=="ok");
  const apps=board.applications.slice(0,2);
  const schemes=useSchemeCards();
  const walletDocs=useWalletDocumentCards();
  const docs=walletDocs.length>0?walletDocs:[{n:"Driving Licence",id:"DL-TN-2024-XXXX",v:"2029"},{n:"Ration Card",id:"RC-TN-XXXX-4421",v:"Active"},{n:"Birth Certificate",id:"BC-2002-XXXX",v:"Lifetime"}].map(d=>({...d,cl:documentLook(d.n)?.colour??c.pri,icon:documentLook(d.n)?.Icon}));
  const lift=dark?{border:`1px solid ${c.bdr}`,boxShadow:"0 18px 30px -22px rgba(0,0,0,.7)"}:{border:"1px solid transparent",boxShadow:LIFT};
  // Round translucent controls, like the ones in the web portal's menu bar.
  const ctl={width:40,height:40,borderRadius:20,background:c.card+"B8",border:`1px solid ${c.bdr}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"};
  const tile={display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 4px 12px",background:c.card,borderRadius:18,cursor:"pointer",fontFamily:"inherit",...lift};
  return (
    <div style={{minHeight:"100vh",paddingBottom:90}}>
      {searchOpen&&<SearchModal onClose={()=>setSearchOpen(false)} onNav={onNav}/>}
      <div style={{padding:"0 20px 4px"}}>
        <StatusBar/>
        <div className={en} style={{...enter(0),display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:8}}>
          <h1 style={{margin:0,lineHeight:1.05}}>
            <span lang="ta" style={{display:"block",fontFamily:"'Noto Serif Tamil','Noto Sans Tamil',serif",fontWeight:900,fontStretch:"80%",fontSize:21,color:dark?"#FFC401":c.pri}}>வணக்கம்,</span>
            <span style={{display:"block",fontSize:31,fontWeight:700,letterSpacing:"-0.03em",color:c.txt,marginTop:3}}>Chandy</span>
          </h1>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setSearchOpen(true)} aria-label="Search" style={ctl}><Search size={18} color={c.txt}/></button>
            <button onClick={()=>onNav("notifications")} aria-label="Notifications" style={{...ctl,position:"relative"}}><Bell size={18} color={c.txt}/><div style={{position:"absolute",top:8,right:9,width:9,height:9,borderRadius:"50%",background:c.pri,border:"2px solid "+c.card}}/></button>
            <button onClick={()=>onNav("ai")} aria-label="Ask Vetri" style={ctl}><Mic size={18} color={c.pri}/></button>
          </div>
        </div>

        {/* Citizen ID — printed like a real identity card: seal, security linework, the number set for reading aloud. */}
        <section aria-label={t("Citizen ID")} className={en} style={{...enter(1),position:"relative",overflow:"hidden",marginTop:16,padding:"16px 18px",borderRadius:22,background:`radial-gradient(120% 90% at 100% 0%, ${dark?"rgba(255,196,1,.14)":"rgba(255,206,18,.24)"}, transparent 58%), ${c.card}`,...lift}}>
          <svg viewBox="0 0 220 128" width="240" height="140" aria-hidden="true" style={{position:"absolute",right:-28,top:-6,opacity:dark?0.5:0.55,pointerEvents:"none"}}><path d={GUILLOCHE} fill="none" stroke={dark?"#FFC401":c.pri} strokeOpacity={dark?0.22:0.16} strokeWidth={0.7}/></svg>
          <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
            <Seal size={42}/>
            <div style={{minWidth:0,flex:1}}>
              <p style={{fontSize:11.5,fontWeight:600,color:c.txt2}}>{t("Government of Tamil Nadu")}</p>
              <p style={{fontSize:10,fontWeight:700,color:c.txt3,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2}}>{t("Citizen ID")}</p>
            </div>
            <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px 4px 7px",borderRadius:999,background:`${c.ok}14`,color:c.ok,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}><BadgeCheck size={14}/>{t("Verified")}</span>
          </div>
          <p className="v-num" style={{position:"relative",fontSize:22,fontWeight:700,color:c.txt,marginTop:14,letterSpacing:"0.02em"}}>TN-2024-XXXX-8842</p>
          <div style={{position:"relative",display:"flex",gap:22,marginTop:8}}>
            <div><p style={{fontSize:10.5,color:c.txt3}}>{t("District")}</p><p style={{fontSize:13,color:c.txt,fontWeight:600}}>Chennai</p></div>
            <div><p style={{fontSize:10.5,color:c.txt3}}>{t("Linked to")}</p><p style={{fontSize:13,color:c.txt,fontWeight:600}}>Aadhaar · DigiLocker</p></div>
          </div>
          <div style={{position:"relative",display:"flex",gap:8,marginTop:14}}>
            <button onClick={()=>onNav("profile")} style={{flex:1,minHeight:40,borderRadius:999,background:"transparent",border:`1.5px solid ${c.pri}`,cursor:"pointer",color:c.pri,fontSize:12.5,fontWeight:650,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><QrCode size={15}/>{t("QR Verify")}</button>
            <button onClick={()=>onNav("profile")} style={{flex:1,minHeight:40,borderRadius:999,background:c.bgAlt,border:`1px solid ${c.bdr}`,cursor:"pointer",color:c.txt,fontSize:12.5,fontWeight:650,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><User size={15}/>{t("View Profile")}</button>
          </div>
        </section>
      </div>

      <div style={{padding:"20px 20px 0"}}>
        {/* The one thing the citizen must do — the same item the web dashboard leads with. */}
        {!board.loading&&urgent.length>0&&(()=>{const it=urgent[0];return(
          <section aria-labelledby="ph-action" className={en} style={{...enter(2),marginBottom:24,padding:"16px 16px 16px",borderRadius:22,border:"1px solid transparent",background:dark
              ?`linear-gradient(180deg,rgba(255,150,40,.10),transparent 7em) padding-box,linear-gradient(${c.card},${c.card}) padding-box,linear-gradient(165deg,rgba(255,140,60,.55),rgba(255,140,60,.12) 45%,${c.bdr}) border-box`
              :`linear-gradient(180deg,rgba(255,206,18,.14),transparent 7em) padding-box,linear-gradient(${c.card},${c.card}) padding-box,linear-gradient(165deg,rgba(232,89,12,.6),rgba(232,89,12,.14) 45%,rgba(90,60,0,.08)) border-box`,
            boxShadow:dark?"none":`0 16px 30px -22px rgba(200,70,0,.45),${LIFT}`}}>
            <p id="ph-action" style={{fontSize:12,fontWeight:700,color:"#C2410C",display:"flex",alignItems:"center",gap:6}}>{t("Needs your action")}{urgent.length>1&&<span className="v-num" style={{minWidth:18,height:18,borderRadius:9,background:c.pri,color:"#fff",fontSize:10.5,display:"inline-grid",placeItems:"center",padding:"0 5px"}}>{urgent.length}</span>}</p>
            <div style={{display:"flex",gap:12,marginTop:10}}>
              <span style={{width:42,height:42,borderRadius:12,background:it.tone==="err"?"#D9480F":"#E8590C",display:"grid",placeItems:"center",flexShrink:0}}><AlertTriangle size={21} color="#fff" aria-hidden="true"/></span>
              <div style={{minWidth:0}}>
                <p style={{fontSize:15.5,fontWeight:700,color:c.txt,letterSpacing:"-0.01em",lineHeight:1.3}}>{it.title}</p>
                <p style={{fontSize:12.5,color:c.txt2,marginTop:3,lineHeight:1.45}}>{it.detail}</p>
                <button onClick={()=>onNav(it.nav)} style={{marginTop:12,minHeight:40,padding:"0 18px",borderRadius:999,border:"none",background:c.pri,color:"#fff",fontFamily:"inherit",fontSize:13,fontWeight:650,display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}>{it.action}<ArrowRight size={16} aria-hidden="true"/></button>
              </div>
            </div>
          </section>);})()}

        <div className={en} style={enter(3)}>
          <Sec title="Quick access"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0,1fr))",gap:10,marginBottom:24}}>
            {qa.map((a,i)=><button key={i} onClick={()=>onNav(a.nav)} style={tile}><span style={{width:42,height:42,borderRadius:13,background:a.cl,display:"flex",alignItems:"center",justifyContent:"center"}}><a.icon size={22} color="#fff" strokeWidth={1.9} aria-hidden="true"/></span><span style={{fontSize:11.5,fontWeight:600,textAlign:"center",lineHeight:1.2,color:c.txt}}>{t(a.l)}</span></button>)}
          </div>
        </div>

        <div className={en} style={enter(4)}>
          <Sec title="My applications" action="View all" onAction={()=>onNav("tracker")}/>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            {board.loading&&<Card><div style={{height:62,borderRadius:12,background:c.bgAlt}}/></Card>}
            {!board.loading&&apps.length===0&&<Card><p style={{fontSize:13,color:c.txt2,lineHeight:1.5}}>You have not applied for anything yet. Choose a service above — your application will appear here with each step explained.</p></Card>}
            {apps.map(a=>{const s=BOARD_STATE[a.state];const label=s.label??(a.status==="In Progress"?"In progress":a.status);return(
              <Card key={a.id} onClick={()=>onNav(a.state==="done"?"wallet":"tracker")}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div style={{minWidth:0}}><p style={{fontSize:14.5,fontWeight:650,color:c.txt}}>{a.title}</p><p className="v-num" style={{fontSize:11,color:c.txt2,marginTop:2,fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace"}}>{a.ref}</p></div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11.5,fontWeight:650,color:c.txt,whiteSpace:"nowrap",flexShrink:0}}><i style={{width:8,height:8,borderRadius:4,background:s.dot}}/>{t(label)}</span>
                </div>
                <StepRail steps={a.steps} step={a.step} colour={s.dot} complete={a.state==="done"} track={c.bdr} style={{marginTop:12}}/>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:7}}>
                  <span className="v-num" style={{fontSize:11,color:c.txt2,minWidth:0}}>{a.state==="done"?"Issued to your Digital Locker":`Step ${a.step} of ${a.steps} · ${a.stageNow}`}</span>
                  {a.daysLeft!=null&&<span className="v-num" style={{fontSize:11,fontWeight:650,color:c.txt,whiteSpace:"nowrap"}}>{a.daysLeft} {a.daysLeft===1?"day":"days"} left</span>}
                </div>
              </Card>);})}
          </div>
        </div>

        <div className={en} style={enter(5)}>
          <Sec title="My complaints" action="File New" onAction={()=>onNav("complaint")}/>
          <Card style={{marginBottom:24}} onClick={()=>onNav("complaint")}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:44,height:44,borderRadius:12,background:`${c.warn}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertTriangle size={20} color={c.warn}/></div><div style={{flex:1,minWidth:0}}><p style={{fontSize:14,fontWeight:600,color:c.txt}}>Road damage, TTK Road</p><div style={{display:"flex",gap:8,marginTop:4}}><span className="v-num" style={{fontSize:11,color:c.txt2}}>CMP-TN-000452</span><span style={{fontSize:11,fontWeight:600,color:c.warn}}>{t("In Progress")}</span></div></div><ChevronRight size={16} color={c.txt3}/></div></Card>
        </div>

        {/* Documents as wallet passes: same service colour as everywhere else, the number set to be read. */}
        <Sec title="Documents" action="Open wallet" onAction={()=>onNav("wallet")}/>
        <div style={{display:"flex",gap:12,overflowX:"auto",margin:"-6px -20px 18px",padding:"6px 20px 12px",scrollSnapType:"x mandatory",scrollPaddingInline:20,scrollbarWidth:"none",overscrollBehaviorX:"contain"}}>
          {docs.map((d,i)=>{const exp=expiryOf(d.v||"");const expired=exp?exp.getTime()<now:false;return(
            <button key={i} onClick={()=>onNav("wallet")} style={{minWidth:226,flex:"0 0 auto",scrollSnapAlign:"start",textAlign:"left",padding:"14px 15px 13px",borderRadius:20,border:"none",background:`linear-gradient(135deg,${d.cl},${d.cl}CC)`,color:"#fff",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 14px 22px -16px ${d.cl}, inset 0 1px 0 rgba(255,255,255,.22)`}}>
              <span style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <span style={{minWidth:0}}>
                  {d.tp&&<span style={{display:"block",fontSize:9.5,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",opacity:.75}}>{d.tp}</span>}
                  <span style={{display:"block",fontSize:14.5,fontWeight:700,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t(d.n)}</span>
                </span>
                <span style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>{!expired&&<BadgeCheck size={16} color="#FFE08A" aria-label={t("Verified")}/>}<Seal size={24}/></span>
              </span>
              <span className="v-num" style={{display:"block",fontSize:12,marginTop:12,opacity:.85,fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",letterSpacing:"0.02em"}}>{d.id}</span>
              <span style={{display:"inline-block",fontSize:10.5,marginTop:6,fontWeight:expired?700:500,opacity:expired?1:.75,...(expired?{background:"rgba(0,0,0,.22)",padding:"2px 8px",borderRadius:999}:{})}}>{expired?t("Expired"):/\d/.test(d.v||"")?`${t("Valid until")} ${d.v}`:t(d.v)}</span>
            </button>);})}
        </div>

        <Card style={{marginBottom:24,background:`linear-gradient(135deg,${c.sec}10,${c.sec}05), ${c.card}`}} onClick={()=>onNav("schemes")}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:40,height:40,borderRadius:12,background:`${c.sec}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Sparkles size={18} color={c.secDk}/></div><div style={{flex:1}}><p style={{fontSize:13.5,fontWeight:650,color:c.txt}}>{t("Eligible schemes")}</p><p style={{fontSize:11.5,color:c.txt2}}><span className="v-num">{schemes.length||3}</span> {t("found for you")}</p></div><span style={{fontSize:12.5,fontWeight:700,color:c.secDk}}>{t("View")}</span><ChevronRight size={14} color={c.secDk}/></div></Card>
        <Sec title="Emergency"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, minmax(0,1fr))",gap:8,marginBottom:24}}>
          {[{icon:Phone,l:"Police",n:"100",cl:"#DC2626"},{icon:HeartPulse,l:"Ambulance",n:"108",cl:"#059669"},{icon:Flame,l:"Fire",n:"101",cl:"#EA580C"},{icon:Siren,l:"Emergency",n:"112",cl:"#2563EB"}].map((e,i)=><button key={i} onClick={()=>onNav("emergency")} aria-label={`${t(e.l)} ${e.n}`} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 4px",background:`linear-gradient(${e.cl}0D,${e.cl}0D), ${c.card}`,borderRadius:16,border:`1px solid ${e.cl}26`,cursor:"pointer",fontFamily:"inherit"}}><e.icon size={22} color={e.cl} aria-hidden="true"/><span style={{fontSize:10.5,fontWeight:600,color:c.txt}}>{t(e.l)}</span><span className="v-num" style={{fontSize:10,color:e.cl,fontWeight:700}}>{e.n}</span></button>)}
        </div>
      </div>
      <BottomNav active="home" onNav={onNav}/>
    </div>
  );
};

export default HomeDashboard;

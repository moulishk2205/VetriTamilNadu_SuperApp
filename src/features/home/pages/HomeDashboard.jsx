import { useState } from "react";
import { ChevronRight, Search, Bell, Mic, User, Phone, AlertTriangle, HeartPulse, Car, Wheat, FileCheck, BadgeCheck, Siren, Flame, Timer, Sparkles, QrCode } from "lucide-react";
import { Seal, StatusBar, BottomNav, Card, Sec, SearchModal } from "@/components/ui";
import { useApp, useT, useC } from "@/hooks/useUi";

const HomeDashboard = ({onNav}) => { const c=useC(); const t=useT(); const {anim,dark}=useApp();
  const [searchOpen,setSearchOpen]=useState(false);
  // Each shortcut deep-links straight into its own workflow — no intermediate
  // Services page. Service shortcuts route to /service/:slug; the rest to their tab.
  const qa=[{icon:Car,l:"Driving License",cl:"#2563EB",bg:"#EFF6FF",nav:"service/svc_dl"},{icon:Wheat,l:"Ration Card",cl:"#059669",bg:"#ECFDF5",nav:"service/svc_ration"},{icon:FileCheck,l:"Birth Certificate",cl:"#7C3AED",bg:"#F5F3FF",nav:"service/svc_birth"},{icon:AlertTriangle,l:"Complaints",cl:"#DC2626",bg:"#FEF2F2",nav:"complaint"},{icon:Timer,l:"Track Service",cl:"#D97706",bg:"#FFFBEB",nav:"tracker"},{icon:Sparkles,l:"Schemes",cl:"#0891B2",bg:"#ECFEFF",nav:"schemes"}];
  const apps=[{title:"Income Certificate",status:"In Progress",officer:"Tahsildar, Mylapore",days:3,total:7,cl:c.warn},{title:"DL Renewal",status:"Approved",officer:"RTO Chennai South",days:0,total:5,cl:c.ok}];
  return (
    <div style={{minHeight:"100vh",background:c.bgAlt,paddingBottom:90}}>
      {searchOpen&&<SearchModal onClose={()=>setSearchOpen(false)} onNav={onNav}/>}
      <div style={{background:`linear-gradient(135deg,${c.pri} 0%,${c.acc} 100%)`,borderRadius:"0 0 28px 28px",padding:"0 20px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        {/* Official Tamil Nadu State Emblem — large monochrome watermark centered behind the
            header, partially hidden by the Citizen Card below for depth. Reuses the Seal asset. */}
        <div aria-hidden="true" style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",width:260,height:260,opacity:0.1,filter:"grayscale(1) brightness(1.7)",pointerEvents:"none",zIndex:0}}><Seal size={260}/></div>
        <div style={{position:"relative",zIndex:1}}>
        <StatusBar/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:8}}>
          <div><p style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>வணக்கம்</p><h1 style={{fontSize:22,fontWeight:800,color:"#fff",marginTop:2}}>Chandy</h1></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setSearchOpen(true)} style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Search size={18} color="#fff"/></button>
            <button onClick={()=>onNav("notifications")} style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}><Bell size={18} color="#fff"/><div style={{position:"absolute",top:6,right:6,width:10,height:10,borderRadius:"50%",background:c.sec,border:"2px solid "+c.pri}}/></button>
            <button onClick={()=>onNav("ai")} style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${c.sec},${c.secDk})`,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Mic size={18} color="#fff"/></button>
          </div>
        </div>
        <div style={{marginTop:16,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",borderRadius:20,padding:"16px 18px",border:"1px solid rgba(255,255,255,0.15)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><p style={{fontSize:10,color:"rgba(255,255,255,0.6)",letterSpacing:1.5,textTransform:"uppercase"}}>CITIZEN ID</p><p style={{fontSize:16,fontWeight:700,color:"#fff",marginTop:2,letterSpacing:1}}>TN-2024-XXXX-8842</p></div><Seal size={40}/></div>
          <div style={{display:"flex",gap:16,marginTop:10}}><div><p style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>District</p><p style={{fontSize:12,color:"#fff",fontWeight:500}}>Chennai</p></div><div><p style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>{t("Verified")}</p><p style={{fontSize:12,color:c.sec,fontWeight:500}}>Aadhaar + DigiLocker</p></div></div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button style={{flex:1,padding:"6px 0",borderRadius:8,background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><QrCode size={13}/>{t("QR Verify")}</button>
            <button onClick={()=>onNav("profile")} style={{flex:1,padding:"6px 0",borderRadius:8,background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><User size={13}/>{t("View Profile")}</button>
          </div>
        </div>
        </div>
      </div>
      <div style={{padding:"20px 20px 0"}}>
        <Sec title="Quick Access"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:24}}>
          {qa.map((a,i)=><div key={i} onClick={()=>onNav(a.nav)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 4px",background:dark?`${a.cl}22`:a.bg,border:dark?`1px solid ${a.cl}40`:"none",borderRadius:16,cursor:"pointer",animation:anim?`fadeIn 0.4s ease-out ${i*0.05}s both`:"none"}}><a.icon size={24} color={a.cl} strokeWidth={1.8}/><span style={{fontSize:11,fontWeight:600,textAlign:"center",lineHeight:1.2,color:c.txt}}>{t(a.l)}</span></div>)}
        </div>
        <Sec title="My Applications" subtitle="Right to Service Tracker" action="View All" onAction={()=>onNav("tracker")}/>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {apps.map((a,i)=><Card key={i} onClick={()=>onNav("tracker")}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><p style={{fontSize:14,fontWeight:600,color:c.txt}}>{a.title}</p><p style={{fontSize:11,color:c.txt2,marginTop:2}}>{a.officer}</p></div><span style={{fontSize:11,fontWeight:600,color:a.cl,padding:"4px 10px",background:`${a.cl}15`,borderRadius:9999}}>{t(a.status)}</span></div><div style={{marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:c.txt3}}>Progress</span><span style={{fontSize:10,fontWeight:600,color:c.txt}}>{a.days===0?t("Complete"):`${a.days} days`}</span></div><div style={{height:4,background:c.bdr,borderRadius:2}}><div style={{height:"100%",background:a.cl,borderRadius:2,width:`${((a.total-a.days)/a.total)*100}%`}}/></div></div></Card>)}
        </div>
        <Sec title="My Complaints" action="File New" onAction={()=>onNav("complaint")}/>
        <Card style={{marginBottom:24}} onClick={()=>onNav("tracker")}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:44,height:44,borderRadius:12,background:`${c.warn}10`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertTriangle size={20} color={c.warn}/></div><div style={{flex:1}}><p style={{fontSize:14,fontWeight:600,color:c.txt}}>Road Damage - TTK Road</p><div style={{display:"flex",gap:8,marginTop:4}}><span style={{fontSize:11,color:c.txt2}}>CMP-TN-000452</span><span style={{fontSize:11,fontWeight:600,color:c.warn}}>{t("In Progress")}</span></div></div><ChevronRight size={16} color={c.txt3}/></div></Card>
        <Sec title="Documents" action="Open Wallet" onAction={()=>onNav("wallet")}/>
        <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,marginBottom:24,scrollSnapType:"x mandatory"}}>
          {[{n:"Driving License",id:"DL-TN-2024-XXXX",v:"2029",cl:"#2563EB"},{n:"Ration Card",id:"RC-TN-XXXX-4421",v:"Active",cl:"#059669"},{n:"Birth Certificate",id:"BC-2002-XXXX",v:"Lifetime",cl:"#7C3AED"}].map((d,i)=><div key={i} onClick={()=>onNav("wallet")} style={{minWidth:200,background:`linear-gradient(135deg,${d.cl},${d.cl}CC)`,borderRadius:20,padding:16,cursor:"pointer",scrollSnapAlign:"start",color:"#fff"}}><div style={{display:"flex",justifyContent:"space-between"}}><p style={{fontSize:13,fontWeight:700}}>{t(d.n)}</p><BadgeCheck size={16} color={c.sec}/></div><p style={{fontSize:11,opacity:0.7,marginTop:4,fontFamily:"monospace"}}>{d.id}</p><p style={{fontSize:10,opacity:0.6,marginTop:8}}>Valid: {d.v}</p></div>)}
        </div>
        <Card style={{marginBottom:24,background:`linear-gradient(135deg,${c.sec}10,${c.sec}05)`,border:`1px solid ${c.sec}20`}} onClick={()=>onNav("schemes")}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:40,height:40,borderRadius:12,background:`${c.sec}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Sparkles size={18} color={c.secDk}/></div><div style={{flex:1}}><p style={{fontSize:13,fontWeight:600,color:c.txt}}>{t("Eligible Schemes")}</p><p style={{fontSize:11,color:c.txt2}}>3 {t("found for you")}</p></div><span style={{fontSize:12,fontWeight:700,color:c.sec}}>{t("View")}</span><ChevronRight size={14} color={c.sec}/></div></Card>
        <Sec title="Emergency"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:8,marginBottom:24}}>
          {[{icon:Phone,l:"Police",n:"100",cl:"#DC2626"},{icon:HeartPulse,l:"Ambulance",n:"108",cl:"#059669"},{icon:Flame,l:"Fire",n:"101",cl:"#EA580C"},{icon:Siren,l:"Emergency",n:"112",cl:"#2563EB"}].map((e,i)=><div key={i} onClick={()=>onNav("emergency")} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 4px",background:`${e.cl}08`,borderRadius:16,border:`1px solid ${e.cl}15`,cursor:"pointer"}}><e.icon size={22} color={e.cl}/><span style={{fontSize:10,fontWeight:600,color:c.txt}}>{t(e.l)}</span><span style={{fontSize:9,color:e.cl,fontWeight:700}}>{e.n}</span></div>)}
        </div>
      </div>
      <BottomNav active="home" onNav={onNav}/>
    </div>
  );
};

// SERVICES + WALLET + COMPLAINT + AI (themed, abbreviated for space — same logic as V3)

export default HomeDashboard;

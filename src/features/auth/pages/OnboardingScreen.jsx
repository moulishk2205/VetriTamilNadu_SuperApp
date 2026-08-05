import { useState } from "react";
import { Shield, Eye, BadgeCheck, Layers } from "lucide-react";
import { StatusBar, Btn } from "@/components/ui";
import { useApp, useT, useC } from "@/hooks/useUi";

const OnboardingScreen = ({onDone}) => { const c=useC(); const t=useT(); const {anim}=useApp();
  const [pg,setPg]=useState(0);
  const pages=[{icon:BadgeCheck,title:"One Citizen Identity",tm:"ஒரே குடிமகன் அடையாளம்",desc:"Your single digital identity for all government services.",cl:c.pri},{icon:Layers,title:"Every Service, One Tap",tm:"அனைத்து சேவைகளும்",desc:"Certificates, licenses, welfare — everything in one place.",cl:c.info},{icon:Eye,title:"Track Everything",tm:"அனைத்தையும் கண்காணியுங்கள்",desc:"Real-time tracking of every application.",cl:c.ok},{icon:Shield,title:"No Middlemen",tm:"இடைத்தரகர்கள் இல்லை",desc:"Direct access. Transparent timelines. Officer accountability.",cl:c.sec}];
  const p=pages[pg];
  return (
    <div style={{height:"100vh",background:c.bg,display:"flex",flexDirection:"column"}}><StatusBar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"0 24px"}}>
        <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 0"}}><button onClick={onDone} style={{background:"none",border:"none",color:c.txt2,fontSize:14,fontWeight:500,cursor:"pointer"}}>{t("Skip")}</button></div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div key={pg} style={{animation:anim?"fadeIn 0.5s":"none",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:120,height:120,borderRadius:32,background:`${p.cl}10`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:40}}><div style={{width:80,height:80,borderRadius:24,background:`${p.cl}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><p.icon size={40} color={p.cl} strokeWidth={1.5}/></div></div>
            <h2 style={{fontSize:26,fontWeight:800,color:c.txt,textAlign:"center"}}>{p.title}</h2>
            <p style={{fontSize:14,color:p.cl,fontFamily:"'Noto Sans Tamil',sans-serif",marginTop:6,opacity:0.8}}>{p.tm}</p>
            <p style={{fontSize:15,color:c.txt2,textAlign:"center",lineHeight:1.6,marginTop:16,maxWidth:300}}>{p.desc}</p>
          </div>
        </div>
        <div style={{paddingBottom:48}}>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>{pages.map((_,i)=><div key={i} style={{width:i===pg?24:8,height:8,borderRadius:4,background:i===pg?c.pri:c.bdr,transition:"all 0.3s"}}/>)}</div>
          <Btn full variant={pg===3?"gold":"primary"} size="lg" onClick={()=>pg<3?setPg(pg+1):onDone()}>{pg===3?t("Get Started"):t("Continue")}</Btn>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;

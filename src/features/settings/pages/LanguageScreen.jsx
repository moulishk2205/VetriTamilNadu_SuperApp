import { CheckCircle, Languages } from "lucide-react";
import { StatusBar, Card, Header } from "@/components/ui";
import { useApp, useC } from "@/hooks/useUi";

const LanguageScreen=({goBack})=>{const c=useC();const{lang,setLang}=useApp();
  const langs=[{id:"en",name:"English",native:"English",flag:"🇬🇧"},{id:"ta",name:"Tamil",native:"தமிழ்",flag:"🇮🇳"}];
  return(<div style={{minHeight:"100vh",paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Language" onBack={goBack}/><p style={{fontSize:13,color:c.txt2,marginBottom:20,lineHeight:1.5}}>Choose your preferred language. The entire app interface will update.</p>{langs.map((l,i)=><Card key={i} onClick={()=>setLang(l.id)} style={{marginBottom:10,cursor:"pointer",border:`1.5px solid ${lang===l.id?c.pri:c.bdr}`}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:28}}>{l.flag}</span><div style={{flex:1}}><p style={{fontSize:15,fontWeight:600,color:c.txt}}>{l.name}</p><p style={{fontSize:13,color:c.txt2}}>{l.native}</p></div>{lang===l.id&&<CheckCircle size={22} color={c.pri}/>}</div></Card>)}<Card style={{marginTop:16,background:`${c.info}06`,border:`1px solid ${c.info}15`}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><Languages size={18} color={c.info} style={{flexShrink:0,marginTop:2}}/><p style={{fontSize:12,color:c.txt2,lineHeight:1.5}}>More languages including Telugu, Hindi, and Malayalam will be available soon through AI-powered translation.</p></div></Card></div></div>);
};

// DARK MODE SETTINGS

export default LanguageScreen;

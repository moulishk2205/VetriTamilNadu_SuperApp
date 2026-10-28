import { CheckCircle, Moon, Sun } from "lucide-react";
import { StatusBar, Card, Header } from "@/components/ui";
import { useApp, useC } from "@/hooks/useUi";

const DarkModeScreen=({goBack})=>{const c=useC();const{dark,setDark}=useApp();
  return(<div style={{minHeight:"100vh",background:c.bgAlt,paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Dark Mode" onBack={goBack}/><div style={{display:"flex",gap:12,marginBottom:20}}>{[{id:false,icon:Sun,l:"Light",desc:"Default bright theme"},{id:true,icon:Moon,l:"Dark",desc:"Easy on the eyes"}].map(m=><Card key={String(m.id)} onClick={()=>setDark(m.id)} style={{flex:1,cursor:"pointer",border:`1.5px solid ${dark===m.id?c.pri:c.bdr}`,textAlign:"center",padding:20}}><m.icon size={28} color={dark===m.id?c.pri:c.txt3} style={{margin:"0 auto 8px"}}/><p style={{fontSize:14,fontWeight:600,color:c.txt}}>{m.l}</p><p style={{fontSize:11,color:c.txt2,marginTop:4}}>{m.desc}</p>{dark===m.id&&<div style={{width:20,height:20,borderRadius:"50%",background:c.pri,display:"flex",alignItems:"center",justifyContent:"center",margin:"10px auto 0"}}><CheckCircle size={12} color="#fff"/></div>}</Card>)}</div></div></div>);
};

// PROFILE — fully functional, no Coming Soon

export default DarkModeScreen;

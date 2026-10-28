import { ZapOff, Contrast } from "lucide-react";
import { StatusBar, Card, Sec, Header, Toggle } from "@/components/ui";
import { useApp, useC } from "@/hooks/useUi";

const AccessibilityScreen=({goBack})=>{const c=useC();const{textSize,setTextSize,highContrast,setHighContrast,anim,setAnim}=useApp();
  return(<div style={{minHeight:"100vh",paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Accessibility" onBack={goBack}/><Sec title="Text Size"/><Card style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:12,color:c.txt2}}>A</span><span style={{fontSize:20,fontWeight:700,color:c.txt}}>A</span></div><div style={{display:"flex",gap:8}}>{["sm","md","lg","xl"].map(s=><button key={s} onClick={()=>setTextSize(s)} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`1.5px solid ${textSize===s?c.pri:c.bdr}`,background:textSize===s?`${c.pri}08`:c.card,cursor:"pointer",fontSize:s==="sm"?11:s==="md"?13:s==="lg"?15:17,fontWeight:textSize===s?600:400,color:textSize===s?c.pri:c.txt}}>{s==="sm"?"Small":s==="md"?"Medium":s==="lg"?"Large":"XL"}</button>)}</div></Card><Sec title="Display"/><Card style={{marginBottom:16,padding:0}}><div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${c.bdr}`}}><Contrast size={20} color={c.pri}/><span style={{flex:1,fontSize:14,fontWeight:500,color:c.txt}}>High Contrast</span><Toggle value={highContrast} onChange={setHighContrast}/></div><div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}><ZapOff size={20} color={c.pri}/><span style={{flex:1,fontSize:14,fontWeight:500,color:c.txt}}>Reduced Motion</span><Toggle value={!anim} onChange={v=>setAnim(!v)}/></div></Card><Card><p style={{fontSize:12,color:c.txt2,lineHeight:1.5}}>These settings help make the app more comfortable for all users. Text size affects all content. High contrast improves readability. Reduced motion disables animations.</p></Card></div></div>);
};

// PERSONAL DETAILS

export default AccessibilityScreen;

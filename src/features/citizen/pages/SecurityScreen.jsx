import { Fingerprint, Smartphone, ScanFace } from "lucide-react";
import { StatusBar, Card, Sec, Header, Toggle } from "@/components/ui";
import { useC } from "@/hooks/useUi";

const SecurityScreen=({goBack})=>{const c=useC();
  return(<div style={{minHeight:"100vh",paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Security & Privacy" onBack={goBack}/><Sec title="Login Methods"/><Card style={{marginBottom:16,padding:0}}>{[{l:"Mobile OTP",icon:Smartphone,active:true},{l:"Aadhaar Auth",icon:Fingerprint,active:true},{l:"Biometric (Face/Touch)",icon:ScanFace,active:true}].map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<2?`1px solid ${c.bdr}`:"none"}}><m.icon size={20} color={c.pri}/><span style={{flex:1,fontSize:14,fontWeight:500,color:c.txt}}>{m.l}</span><span style={{fontSize:11,fontWeight:600,color:c.ok,padding:"3px 8px",background:`${c.ok}15`,borderRadius:9999}}>Active</span></div>)}</Card><Sec title="Session Info"/><Card style={{marginBottom:16}}>{[{l:"Last Login",v:"21 Jun 2026, 09:41 AM"},{l:"Device",v:"iPhone 15 Pro - Safari"},{l:"IP Address",v:"103.XXX.XX.42"},{l:"Location",v:"Chennai, Tamil Nadu"}].map((f,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:i<3?10:0}}><span style={{fontSize:12,color:c.txt2}}>{f.l}</span><span style={{fontSize:12,fontWeight:500,color:c.txt}}>{f.v}</span></div>)}</Card><Sec title="Privacy"/><Card style={{padding:0}}>{[{l:"Data Sharing Consent",v:true},{l:"Analytics",v:false},{l:"Location Access",v:true}].map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<2?`1px solid ${c.bdr}`:"none"}}><span style={{flex:1,fontSize:14,fontWeight:500,color:c.txt}}>{p.l}</span><Toggle value={p.v} onChange={()=>{}}/></div>)}</Card></div></div>);
};

// LANGUAGE SETTINGS

export default SecurityScreen;

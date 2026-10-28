import { BadgeCheck } from "lucide-react";
import { StatusBar, Card, Header } from "@/components/ui";
import { useC } from "@/hooks/useUi";

const PersonalDetailsScreen=({goBack})=>{const c=useC();
  const fields=[{l:"Full Name",v:"Chandramoulishwarar K"},{l:"Citizen ID",v:"TN-2024-XXXX-8842"},{l:"Date of Birth",v:"22 May 2002"},{l:"Gender",v:"Male"},{l:"Mobile",v:"+91 98XXX XXXXX"},{l:"Email",v:"chandy@email.com"},{l:"Aadhaar",v:"XXXX XXXX 8842"},{l:"District",v:"Chennai"},{l:"Taluk",v:"Mylapore"},{l:"State",v:"Tamil Nadu"}];
  return(<div style={{minHeight:"100vh",background:c.bgAlt,paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Personal Details" onBack={goBack}/><div style={{textAlign:"center",marginBottom:24}}><div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${c.pri},${c.acc})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28,fontWeight:800,color:"#fff"}}>C</span></div><p style={{fontSize:16,fontWeight:700,marginTop:12,color:c.txt}}>Chandramoulishwarar K</p><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:4}}><BadgeCheck size={14} color={c.ok}/><span style={{fontSize:12,color:c.ok}}>Verified Citizen</span></div></div><Card style={{padding:0}}>{fields.map((f,i)=><div key={i} style={{padding:"14px 16px",borderBottom:i<fields.length-1?`1px solid ${c.bdr}`:"none"}}><p style={{fontSize:11,color:c.txt3,marginBottom:2}}>{f.l}</p><p style={{fontSize:14,fontWeight:500,color:c.txt}}>{f.v}</p></div>)}</Card><p style={{fontSize:11,color:c.txt3,textAlign:"center",marginTop:16}}>Contact your nearest e-Sevai centre to update details</p></div></div>);
};

// ADDRESS

export default PersonalDetailsScreen;

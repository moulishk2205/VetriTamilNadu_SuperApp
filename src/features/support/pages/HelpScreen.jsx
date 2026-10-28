import { useState } from "react";
import { ChevronDown, Search, Phone, HelpCircle, ChevronUp } from "lucide-react";
import { StatusBar, Btn, Card, Header } from "@/components/ui";
import { useC } from "@/hooks/useUi";

const HelpScreen=({goBack})=>{const c=useC();const[open,setOpen]=useState(null);
  const faqs=[
    {q:"How do I apply for a Birth Certificate?",a:"Go to Services > Certificates > Birth Certificate. Fill in the required details, upload supporting documents, and submit. You can track progress in the Service Tracker."},
    {q:"How do I file a complaint?",a:"Tap Complaints from Quick Access on Home, or go to Services > File Complaint. Select a category, describe the issue, upload evidence, and submit. GPS location is auto-detected."},
    {q:"How do I download my documents?",a:"Go to Documents (bottom nav) to open your Digital Wallet. Tap any document card to expand it, then tap the Download button. QR verification is also available."},
    {q:"How do I check my service status?",a:"Go to Track Service from Quick Access, or tap any active application on the Home dashboard. The tracker shows real-time status with Right to Service deadline countdown."},
    {q:"How do I switch to Tamil?",a:"Go to Profile > Preferences > Language and select Tamil. The entire app interface will switch to Tamil language."},
    {q:"How do I enable Dark Mode?",a:"Go to Profile > Preferences > Dark Mode and toggle it on. You can also change it from the Settings section."},
    {q:"What is the Right to Service deadline?",a:"Under the Tamil Nadu Right to Service Act, every government service has a mandatory deadline. If the deadline is breached, the application is auto-escalated to a senior officer."},
    {q:"How do I contact my MLA?",a:"Go to Profile > Government Transparency > MLA Dashboard. It shows your constituency MLA, budget allocation, local projects, and complaint resolution rates."},
  ];
  return(<div style={{minHeight:"100vh",paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Help & FAQ" onBack={goBack}/><div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:c.card,borderRadius:16,marginBottom:20,border:`1px solid ${c.bdr}`}}><Search size={18} color={c.txt3}/><input placeholder="Search help topics..." style={{border:"none",background:"transparent",flex:1,fontSize:14,fontFamily:"inherit",outline:"none",color:c.txt}}/></div>{faqs.map((f,i)=><Card key={i} style={{marginBottom:8,padding:0,cursor:"pointer"}} onClick={()=>setOpen(open===i?null:i)}><div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}><HelpCircle size={18} color={c.pri}/><p style={{flex:1,fontSize:14,fontWeight:500,color:c.txt}}>{f.q}</p>{open===i?<ChevronUp size={18} color={c.txt3}/>:<ChevronDown size={18} color={c.txt3}/>}</div>{open===i&&<div style={{padding:"0 16px 16px",borderTop:`1px solid ${c.bdr}`,paddingTop:12}}><p style={{fontSize:13,color:c.txt2,lineHeight:1.6}}>{f.a}</p></div>}</Card>)}<Card style={{marginTop:12,textAlign:"center"}}><p style={{fontSize:13,color:c.txt2}}>Still need help?</p><Btn variant="secondary" size="sm" style={{marginTop:8}} icon={Phone}>Contact Support</Btn></Card></div></div>);
};

// ACCESSIBILITY

export default HelpScreen;

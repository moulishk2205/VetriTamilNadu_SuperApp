import { useState, useRef } from "react";
import { Shield, Send, Fingerprint, Smartphone, Lock, BadgeCheck, ScanFace } from "lucide-react";
import { Seal, StatusBar, Btn } from "@/components/ui";
import { useT, useC } from "@/hooks/useUi";
import { useAuth } from "@/features/auth/hooks/useAuth";

const LoginScreen = ({onDone}) => { const c=useC(); const t=useT(); const { login, requestOtp } = useAuth();
  const [method,setMethod]=useState("otp"); const [phone,setPhone]=useState(""); const [aadhaar,setAadhaar]=useState("");
  const [otp,setOtp]=useState(["","","","","",""]); const [step,setStep]=useState(0);
  const [err,setErr]=useState(""); const [otpErr,setOtpErr]=useState(""); const otpRefs=useRef([]);
  const reset=(id)=>{setMethod(id);setPhone("");setAadhaar("");setOtp(["","","","","",""]);setStep(0);setErr("");setOtpErr("");};
  const sendOTP=()=>{if(phone.length<10){setErr("Enter valid 10-digit number");return;}setErr("");requestOtp(phone,"otp").catch(()=>{});setStep(1);};
  const sendAadhaar=()=>{if(aadhaar.replace(/\s/g,"").length<12){setErr("Enter valid 12-digit Aadhaar");return;}setErr("");requestOtp(aadhaar.replace(/\s/g,""),"aadhaar").catch(()=>{});setStep(1);};
  const verify=()=>{if(otp.join("").length!==6){setOtpErr("Enter complete 6-digit OTP");return;}setOtpErr("");setStep(2);login({method,identifier:method==="otp"?phone:aadhaar.replace(/\s/g,""),otp:otp.join("")}).then(()=>onDone()).catch(()=>{setStep(1);setOtpErr("Verification failed. Please try again.");});};
  const otpC=(v,i)=>{const a=[...otp];a[i]=v.replace(/\D/,"");setOtp(a);setOtpErr("");if(v&&i<5)otpRefs.current[i+1]?.focus();};
  const otpK=(e,i)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)otpRefs.current[i-1]?.focus();};
  return (
    <div style={{minHeight:"100vh",background:c.bg}}><StatusBar/>
      <div style={{padding:"16px 24px"}}>
        <div style={{textAlign:"center",marginTop:20,marginBottom:32}}><Seal size={72}/><h1 style={{fontSize:24,fontWeight:800,marginTop:16,color:c.txt}}>{t("Welcome to Vetri TN")}</h1><p style={{fontSize:14,color:c.txt2,marginTop:6}}>Secure citizen login</p></div>
        <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:28}}>
          {[{icon:Shield,l:"Encrypted"},{icon:Lock,l:"Aadhaar"},{icon:BadgeCheck,l:"Certified"}].map((x,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><x.icon size={18} color={c.ok}/><span style={{fontSize:9,color:c.txt2}}>{x.l}</span></div>)}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:24,background:c.bgAlt,borderRadius:16,padding:4}}>
          {[{id:"otp",l:"Mobile OTP",icon:Smartphone},{id:"aadhaar",l:"Aadhaar",icon:Fingerprint},{id:"biometric",l:"Biometric",icon:ScanFace}].map(m=>(
            <button key={m.id} onClick={()=>reset(m.id)} style={{flex:1,padding:"10px 8px",border:"none",borderRadius:12,background:method===m.id?c.card:"transparent",boxShadow:method===m.id?"0 1px 3px rgba(0,0,0,0.08)":"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <m.icon size={18} color={method===m.id?c.pri:c.txt3}/><span style={{fontSize:11,fontWeight:method===m.id?600:400,color:method===m.id?c.pri:c.txt2}}>{m.l}</span>
            </button>))}
        </div>
        {method==="otp"&&step===0&&<div style={{animation:"fadeIn 0.3s"}}><label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:8,color:c.txt}}>Mobile Number</label><div style={{display:"flex",border:`1.5px solid ${err?c.err:phone.length>=10?c.ok:c.bdr}`,borderRadius:16,overflow:"hidden"}}><div style={{padding:"14px 12px",background:c.bgAlt,borderRight:`1px solid ${c.bdr}`,fontSize:14,fontWeight:600,color:c.txt}}>+91</div><input value={phone} onChange={e=>{setPhone(e.target.value.replace(/\D/g,"").slice(0,10));setErr("");}} placeholder="Enter 10-digit number" style={{flex:1,border:"none",padding:"14px 16px",fontSize:16,fontFamily:"inherit",outline:"none",letterSpacing:1,background:c.bg,color:c.txt}}/></div>{err&&<p style={{fontSize:12,color:c.err,marginTop:6}}>{err}</p>}<Btn full variant="primary" size="lg" onClick={sendOTP} style={{marginTop:20}} icon={Send} disabled={phone.length<10}>{t("Send OTP")}</Btn></div>}
        {method==="aadhaar"&&step===0&&<div style={{animation:"fadeIn 0.3s"}}><label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:8,color:c.txt}}>Aadhaar Number</label><div style={{display:"flex",border:`1.5px solid ${err?c.err:aadhaar.replace(/\s/g,"").length>=12?c.ok:c.bdr}`,borderRadius:16,overflow:"hidden"}}><div style={{padding:"14px 12px",background:c.bgAlt,borderRight:`1px solid ${c.bdr}`}}><Fingerprint size={18} color={c.pri}/></div><input value={aadhaar} onChange={e=>{const r=e.target.value.replace(/\D/g,"").slice(0,12);setAadhaar(r.replace(/(\d{4})(?=\d)/g,"$1 "));setErr("");}} placeholder="XXXX XXXX XXXX" style={{flex:1,border:"none",padding:"14px 16px",fontSize:18,fontFamily:"monospace",outline:"none",letterSpacing:2,background:c.bg,color:c.txt}}/></div>{err&&<p style={{fontSize:12,color:c.err,marginTop:6}}>{err}</p>}<Btn full variant="primary" size="lg" onClick={sendAadhaar} style={{marginTop:20}} icon={Send} disabled={aadhaar.replace(/\s/g,"").length<12}>Verify Aadhaar</Btn></div>}
        {method==="biometric"&&step===0&&<div style={{animation:"fadeIn 0.3s",textAlign:"center"}}><div style={{width:120,height:120,borderRadius:"50%",background:`${c.pri}08`,border:`2px dashed ${c.pri}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"24px auto"}}><ScanFace size={52} color={c.pri} strokeWidth={1.2}/></div><p style={{fontSize:16,fontWeight:600,color:c.txt}}>Face ID / Fingerprint</p><Btn full variant="primary" size="lg" style={{marginTop:24}} icon={Fingerprint} onClick={()=>{setStep(2);login({method:"biometric"}).then(()=>onDone()).catch(()=>{setStep(0);setErr("Biometric sign-in needs a registered device. Use Mobile OTP.");});}}>Authenticate</Btn>{err&&<p style={{fontSize:12,color:c.err,marginTop:12}}>{err}</p>}<button onClick={()=>reset("otp")} style={{display:"block",margin:"16px auto",background:"none",border:"none",color:c.pri,fontSize:13,cursor:"pointer"}}>Use OTP instead</button></div>}
        {(method==="otp"||method==="aadhaar")&&step===1&&<div style={{animation:"fadeIn 0.3s"}}><p style={{fontSize:13,color:c.txt2,marginBottom:4}}>OTP sent to {method==="otp"?`+91 ${phone}`:"Aadhaar mobile"}</p><button onClick={()=>{setStep(0);setOtp(["","","","","",""]);}} style={{background:"none",border:"none",color:c.pri,fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:16,padding:0}}>Change {method==="otp"?"number":"Aadhaar"}</button><div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>{otp.map((d,i)=><input key={i} ref={el=>otpRefs.current[i]=el} maxLength={1} value={d} onChange={e=>otpC(e.target.value,i)} onKeyDown={e=>otpK(e,i)} style={{width:48,height:56,textAlign:"center",fontSize:22,fontWeight:700,border:`2px solid ${otpErr?c.err:d?c.pri:c.bdr}`,borderRadius:12,outline:"none",fontFamily:"inherit",background:c.bg,color:c.txt}}/>)}</div>{otpErr&&<p style={{fontSize:12,color:c.err,textAlign:"center",marginBottom:8}}>{otpErr}</p>}<Btn full variant="primary" size="lg" onClick={verify} style={{marginTop:12}} disabled={otp.join("").length<6}>{t("Verify & Continue")}</Btn></div>}
        {step===2&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{width:56,height:56,border:`3px solid ${c.bdr}`,borderTopColor:c.pri,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><p style={{fontSize:15,fontWeight:600,color:c.txt}}>Verifying...</p></div>}
      </div>
    </div>
  );
};

// HOME DASHBOARD

export default LoginScreen;

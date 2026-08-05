import { useState, useEffect, useRef } from "react";
import { Seal } from "@/components/ui";
import { useC } from "@/hooks/useUi";

const SplashScreen = ({onDone}) => {
  const [p,setP]=useState(0); const c=useC();
  // Keep the latest onDone in a ref (updated in an effect, never during render)
  // so the one-shot timers below never re-run if the parent passes a new callback
  // identity. Behavior is identical to before; satisfies react-hooks rules.
  const onDoneRef = useRef(onDone);
  useEffect(()=>{onDoneRef.current=onDone;},[onDone]);
  useEffect(()=>{const t=[setTimeout(()=>setP(1),400),setTimeout(()=>setP(2),1200),setTimeout(()=>setP(3),2000),setTimeout(()=>onDoneRef.current(),3200)];return()=>t.forEach(clearTimeout);},[]);
  return (
    <div style={{height:"100vh",background:`linear-gradient(180deg,${c.pri} 0%,${c.acc} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 30%,rgba(212,168,67,0.08) 0%,transparent 60%)"}}/>
      <div style={{opacity:p>=1?1:0,transform:p>=1?"scale(1)":"scale(0.7)",transition:"all 0.8s cubic-bezier(0.34,1.56,0.64,1)",animation:p>=2?"emblemGlow 2s ease-in-out infinite":"none"}}><Seal size={100}/></div>
      <div style={{marginTop:24,opacity:p>=2?1:0,transform:p>=2?"translateY(0)":"translateY(16px)",transition:"all 0.6s"}}><h1 style={{fontSize:28,fontWeight:800,color:"#fff",textAlign:"center"}}>Vetri Tamil Nadu</h1><p style={{fontSize:12,color:"rgba(255,255,255,0.7)",letterSpacing:3,textTransform:"uppercase",textAlign:"center",marginTop:6}}>Government Super App</p></div>
      <p style={{marginTop:16,fontSize:14,color:c.sec,fontFamily:"'Noto Sans Tamil',sans-serif",opacity:p>=2?0.9:0,transition:"opacity 0.6s ease-out 0.3s"}}>வெற்றி தமிழ்நாடு</p>
      <div style={{position:"absolute",bottom:80,opacity:p>=3?1:0,transition:"opacity 0.4s"}}><div style={{width:120,height:3,background:"rgba(255,255,255,0.2)",borderRadius:2,overflow:"hidden"}}><div style={{width:"100%",height:"100%",background:c.sec,borderRadius:2,animation:"shimmer 1.5s linear infinite",backgroundSize:"200% 100%",backgroundImage:`linear-gradient(90deg,${c.sec} 0%,${c.secLt} 50%,${c.sec} 100%)`}}/></div></div>
    </div>
  );
};

export default SplashScreen;

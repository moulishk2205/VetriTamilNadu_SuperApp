import { useState } from "react";
import { ChevronRight, Search, Clock } from "lucide-react";
import { StatusBar, BottomNav, Card, Empty, Header } from "@/components/ui";
import { useT, useC } from "@/hooks/useUi";
import { useServiceCategoriesView, useServiceCatalogView } from '@/features/services/hooks/useServices';

const ServicesHub = ({onNav,goBack}) => { const c=useC();const t=useT();const[search,setSearch]=useState("");const[cat,setCat]=useState("all");
  const all=useServiceCatalogView();
  // Only surface categories that actually contain services (plus "All"), so the
  // user never taps an empty category. New categories appear automatically once
  // a service is mapped to them.
  const cats=useServiceCategoriesView().filter(x=>x.id==="all"||all.some(s=>s.cat===x.id));
  const f=all.filter(s=>(cat==="all"||s.cat===cat)&&(!search||s.n.toLowerCase().includes(search.toLowerCase())));
  return(<div style={{minHeight:"100vh",background:c.bg,paddingBottom:90}}><StatusBar/><div style={{padding:"8px 20px 0"}}><Header title="Services" onBack={goBack}/><div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:c.bgAlt,borderRadius:16,marginBottom:16}}><Search size={18} color={c.txt3}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search services, documents...")} style={{border:"none",background:"transparent",flex:1,fontSize:14,fontFamily:"inherit",outline:"none",color:c.txt}}/></div><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:16}}>{cats.map(x=><button key={x.id} onClick={()=>setCat(x.id)} style={{padding:"8px 16px",borderRadius:9999,border:"none",background:cat===x.id?c.pri:c.bgAlt,color:cat===x.id?"#fff":c.txt,fontSize:12,fontWeight:600,whiteSpace:"nowrap",cursor:"pointer"}}>{x.l}</button>)}</div>{f.length===0?<Empty icon={Search} title="No services found" desc="Try different search"/>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{f.map((s,i)=><Card key={i} onClick={()=>onNav(`service/${s.id}`)}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:44,height:44,borderRadius:12,background:`${c.pri}08`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><s.icon size={20} color={c.pri}/></div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6}}><p style={{fontSize:14,fontWeight:600,color:c.txt}}>{s.n}</p>{s.pop&&<span style={{fontSize:9,fontWeight:600,color:c.sec,padding:"2px 6px",background:`${c.sec}15`,borderRadius:4}}>Popular</span>}</div><div style={{display:"flex",gap:12,marginTop:4}}><span style={{fontSize:11,color:c.txt2,display:"flex",alignItems:"center",gap:3}}><Clock size={11}/>{s.time}</span><span style={{fontSize:11,color:c.txt2}}>{s.fee}</span></div></div><ChevronRight size={18} color={c.txt3}/></div></Card>)}</div>}</div><BottomNav active="services" onNav={onNav}/></div>);
};

export default ServicesHub;

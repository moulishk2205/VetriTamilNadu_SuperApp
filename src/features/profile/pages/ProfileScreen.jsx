import { ChevronRight, Bell, FileText, User, Shield, AlertTriangle, Eye, BadgeCheck, BarChart3, Landmark, Timer, Languages, Moon, Sun, HelpCircle, LogOut, MapPinned, History, MonitorSmartphone } from "lucide-react";
import { Seal, StatusBar, BottomNav, Card } from "@/components/ui";
import { useApp, useT, useC } from "@/hooks/useUi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePlatformStore } from "@/store/platformStore";

const ProfileScreen=({onNav})=>{const c=useC();const t=useT();const{dark}=useApp();const{logout}=useAuth();const switchExperience=usePlatformStore(s=>s.resetPlatform);const handleLogout=async()=>{await logout();onNav("login");};
  return(<div style={{minHeight:"100vh",paddingBottom:90}}><StatusBar/><div style={{padding:"8px 20px"}}><h1 style={{fontSize:23,fontWeight:700,letterSpacing:"-0.02em",marginBottom:20,color:c.txt}}>{t("Profile")}</h1><Card style={{marginBottom:16}}><div style={{display:"flex",gap:14,alignItems:"center"}}><div style={{width:56,height:56,borderRadius:16,background:c.pri,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22,fontWeight:800,color:"#fff"}}>C</span></div><div style={{flex:1}}><p style={{fontSize:17,fontWeight:700,color:c.txt}}>Chandy</p><p style={{fontSize:12,color:c.txt2}}>TN-2024-XXXX-8842</p><div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}><BadgeCheck size={14} color={c.ok}/><span style={{fontSize:11,color:c.ok}}>{t("Verified")}</span></div></div><Seal size={36}/></div></Card>
    {[
      {sec:"My Activity",items:[{icon:Timer,l:"My Applications",nav:"tracker"},{icon:AlertTriangle,l:"My Complaints",nav:"complaint"},{icon:FileText,l:"My Documents",nav:"wallet"},{icon:History,l:"Digital Timeline",nav:"timeline"},{icon:Bell,l:"Notifications",nav:"notifications"}]},
      {sec:"Government Transparency",items:[{icon:Landmark,l:"MLA Dashboard",nav:"mla"},{icon:BarChart3,l:"District Scorecard",nav:"district"}]},
      {sec:"Account",items:[{icon:User,l:"Personal Details",nav:"personal"},{icon:MapPinned,l:"Address",nav:"address"},{icon:Shield,l:"Security & Privacy",nav:"security"}]},
      {sec:"Preferences",items:[{icon:Languages,l:"Language",nav:"language"},{icon:dark?Sun:Moon,l:"Dark Mode",nav:"darkmode"},{icon:Eye,l:"Accessibility",nav:"accessibility"},{icon:MonitorSmartphone,l:"Switch Experience",action:switchExperience},{icon:HelpCircle,l:"Help & FAQ",nav:"help"}]},
      {sec:"",items:[{icon:LogOut,l:"Log Out",danger:true,logout:true}]},
    ].map((s,si)=><div key={si} style={{marginBottom:16}}>{s.sec&&<p style={{fontSize:12,fontWeight:600,color:c.txt3,marginBottom:8,letterSpacing:0.5,textTransform:"uppercase"}}>{t(s.sec)}</p>}<Card style={{padding:0}}>{s.items.map((item,i)=><div key={i} onClick={()=>item.logout?handleLogout():item.action?item.action():item.nav&&onNav(item.nav)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:i<s.items.length-1?`1px solid ${c.bdr}`:"none",cursor:(item.nav||item.logout||item.action)?"pointer":"default"}}><item.icon size={20} color={item.danger?c.err:c.pri}/><span style={{flex:1,fontSize:14,fontWeight:500,color:item.danger?c.err:c.txt}}>{t(item.l)}</span><ChevronRight size={16} color={c.txt3}/></div>)}</Card></div>)}
  </div><BottomNav active="profile" onNav={onNav}/></div>);
};

// ═══════════════ MAIN APP ═══════════════

export default ProfileScreen;

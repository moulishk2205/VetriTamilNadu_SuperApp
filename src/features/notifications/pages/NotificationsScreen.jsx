import { StatusBar, Card, Header } from "@/components/ui";
import { useC } from "@/hooks/useUi";
import { useNotificationCards } from '@/features/notifications/hooks/useNotifications';

const NotificationsScreen=({goBack})=>{const c=useC();
  const notifs=useNotificationCards();
  return(<div style={{minHeight:"100vh",paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Notifications" onBack={goBack}/><p style={{fontSize:12,color:c.txt2,marginBottom:16}}>{notifs.filter(n=>!n.read).length} unread</p>{notifs.map((n,i)=><Card key={i} style={{marginBottom:10}}><div style={{display:"flex",gap:12}}><div style={{width:40,height:40,borderRadius:12,background:`${n.cl}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><n.icon size={18} color={n.cl}/></div><div style={{flex:1}}><p style={{fontSize:14,fontWeight:n.read?500:600,color:c.txt}}>{n.title}{!n.read&&<span style={{display:"inline-flex",alignItems:"center",gap:5,marginLeft:8,padding:"2px 8px 2px 7px",borderRadius:20,background:`${c.warn}14`,color:c.warn,fontSize:10.5,fontWeight:700,verticalAlign:2}}><span style={{width:6,height:6,borderRadius:"50%",background:c.warn}}/>New</span>}</p><p style={{fontSize:12,color:c.txt2,marginTop:4,lineHeight:1.4}}>{n.desc}</p><p style={{fontSize:10,color:c.txt3,marginTop:6}}>{n.time}</p></div></div></Card>)}</div></div>);
};

// HELP & FAQ

export default NotificationsScreen;

import { StatusBar, Card, Header } from "@/components/ui";
import { useC } from "@/hooks/useUi";
import { useNotificationCards } from '@/features/notifications/hooks/useNotifications';

const NotificationsScreen=({goBack})=>{const c=useC();
  const notifs=useNotificationCards();
  return(<div style={{minHeight:"100vh",background:c.bgAlt,paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Notifications" onBack={goBack}/><p style={{fontSize:12,color:c.txt2,marginBottom:16}}>{notifs.filter(n=>!n.read).length} unread</p>{notifs.map((n,i)=><Card key={i} style={{marginBottom:10,borderLeft:!n.read?`3px solid ${n.cl}`:"none"}}><div style={{display:"flex",gap:12}}><div style={{width:40,height:40,borderRadius:12,background:`${n.cl}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><n.icon size={18} color={n.cl}/></div><div style={{flex:1}}><p style={{fontSize:14,fontWeight:n.read?500:600,color:c.txt}}>{n.title}</p><p style={{fontSize:12,color:c.txt2,marginTop:4,lineHeight:1.4}}>{n.desc}</p><p style={{fontSize:10,color:c.txt3,marginTop:6}}>{n.time}</p></div></div></Card>)}</div></div>);
};

// HELP & FAQ

export default NotificationsScreen;

import { StatusBar, Card, Sec, Header } from "@/components/ui";
import { useC } from "@/hooks/useUi";

const AddressScreen=({goBack})=>{const c=useC();
  return(<div style={{minHeight:"100vh",paddingBottom:40}}><StatusBar/><div style={{padding:"8px 20px"}}><Header title="Address" onBack={goBack}/><Sec title="Current Address"/><Card style={{marginBottom:16}}>{[{l:"Address Line",v:"12/3, TTK Road, Alwarpet"},{l:"Area",v:"Mylapore"},{l:"District",v:"Chennai"},{l:"State",v:"Tamil Nadu"},{l:"Pincode",v:"600018"}].map((f,i)=><div key={i} style={{marginBottom:i<4?12:0}}><p style={{fontSize:11,color:c.txt3,marginBottom:2}}>{f.l}</p><p style={{fontSize:14,fontWeight:500,color:c.txt}}>{f.v}</p></div>)}</Card><Sec title="Permanent Address"/><Card>{[{l:"Address Line",v:"45, Gandhi Nagar"},{l:"Area",v:"Srirangam"},{l:"District",v:"Tiruchirappalli"},{l:"State",v:"Tamil Nadu"},{l:"Pincode",v:"620006"}].map((f,i)=><div key={i} style={{marginBottom:i<4?12:0}}><p style={{fontSize:11,color:c.txt3,marginBottom:2}}>{f.l}</p><p style={{fontSize:14,fontWeight:500,color:c.txt}}>{f.v}</p></div>)}</Card></div></div>);
};

// SECURITY

export default AddressScreen;

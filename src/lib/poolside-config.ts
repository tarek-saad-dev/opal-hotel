import { apiOrigin,type Gateway } from "@/lib/opal-api";

// Server-only consumers: pass only the validated public origin to client components.
export function poolsideConfig():{enabled:boolean;origin:string;gateway:Gateway}{
  const enabled=process.env.OPAL_BOOKING_ENABLED==="true";
  const gateway=process.env.OPAL_PAYMENT_GATEWAY==="mock"?"mock":"paymob";
  let origin="";
  try{origin=apiOrigin(process.env.OPAL_API_BASE_URL||process.env.NEXT_PUBLIC_OPAL_API_BASE_URL||"");}catch{}
  if(origin){
    const local=["localhost","127.0.0.1","[::1]"].includes(new URL(origin).hostname);
    if((gateway==="mock"&&!local)||(!local&&!origin.startsWith("https://")))origin="";
  }
  return {enabled,origin,gateway};
}

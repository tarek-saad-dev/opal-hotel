import { poolsideConnection,type Gateway } from "@/lib/opal-api";

// Server-only consumers: pass only the validated public origin to client components.
export function poolsideConfig():{enabled:boolean;origin:string;gateway:Gateway}{
  return {enabled:process.env.OPAL_BOOKING_ENABLED==="true",...poolsideConnection(process.env.OPAL_API_BASE_URL||process.env.NEXT_PUBLIC_OPAL_API_BASE_URL||"",process.env.OPAL_PAYMENT_GATEWAY)};
}

import type { Accommodation,Availability,Booking,BookingInput,DayUse } from "@/lib/opal-api";
export type AgencyIdentity={agency:{id:number;name:string;email?:string;is_active:boolean};actor:{type:string;id:number;name:string};capabilities:Record<string,unknown>};
export type AgencyBooking=Booking&{can_pay?:boolean};
export type AgencyPage={rows:AgencyBooking[];page:number;lastPage:number|null};
export class AgencyError extends Error{constructor(public status:number){super("Agency request failed");}}
export function agencyApi(locale:"en"|"ar"){
 async function envelope<T>(path:string,body?:unknown):Promise<{data:T;meta?:unknown;links?:unknown}>{
  const res=await fetch("/api/agency/"+path,{method:body===undefined?"GET":"POST",headers:{Accept:"application/json","Accept-Language":locale,...(body===undefined?{}:{"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",credentials:"same-origin"});
  const json=await res.json().catch(()=>null);
  if(!res.ok||json?.success!==true)throw new AgencyError(res.ok?502:res.status);
  return json;
 }
 async function request<T>(path:string,body?:unknown):Promise<T>{return (await envelope<T>(path,body)).data;}
 const esc=encodeURIComponent;
 return {
  login:(email:string,password:string)=>request<AgencyIdentity>("login",{email,password}),
  me:()=>request<AgencyIdentity>("me"),logout:()=>request<null>("logout",{}),
  days:()=>request<DayUse[]>("day-use"),stays:()=>request<Accommodation[]>("accommodations"),
  availability:(slug:string,checkIn:string,checkOut:string,guests:number)=>request<Availability>("accommodations/"+esc(slug)+"/availability?"+new URLSearchParams({check_in:checkIn,check_out:checkOut,guests:String(guests)})),
  list:async(status="",product="",page=1):Promise<AgencyPage>=>{
    const result=await envelope<AgencyBooking[]|{data:AgencyBooking[];current_page?:number;last_page?:number}>("bookings?"+new URLSearchParams({status,product_type:product,page:String(page)}));
    const data=result.data;
    const rows=Array.isArray(data)?data:data?.data;
    if(!Array.isArray(rows))throw new AgencyError(502);
    const meta=(result.meta&&typeof result.meta==="object"?result.meta:!Array.isArray(data)?data:{}) as Record<string,unknown>;
    const current=Number(meta.current_page),last=Number(meta.last_page);
    return {rows,page:Number.isSafeInteger(current)&&current>0?current:page,lastPage:Number.isSafeInteger(last)&&last>=1?last:null};
  },
  booking:(ref:string)=>request<AgencyBooking>("bookings/"+esc(ref)),
  create:(input:BookingInput)=>request<AgencyBooking>("bookings",input),
  pay:(ref:string)=>request<{payment_url:string}>("bookings/"+esc(ref)+"/pay",{})
 };
}

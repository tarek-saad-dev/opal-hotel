/** Public Laravel booking contract, baseline 30b96ba. No privileged endpoints. */
export type OpalLocale = "en" | "ar";
export type Gateway = "paymob" | "mock";
export type DayUse = { id:number; slug:string; name_en:string; name_ar:string; description_en:string|null; description_ar:string|null; price_per_guest:string; currency:string; is_active:boolean };
export type Bubble = { id:number; code:string; name_en?:string; name_ar?:string; status:string; accommodation_type_id:number };
export type Accommodation = { id:number; slug_en:string; slug_ar:string; name_en:string; name_ar:string; description_en:string|null; description_ar:string|null; max_guests:number; price_per_night:string; currency:string; is_active:boolean; bubbles?:Bubble[] };
export type Availability = { availability:boolean; available_bubbles:number; price_per_night:string; total_estimate:string; currency:string; bubbles:Bubble[] };
export type Guest = { guest_name:string; guest_email:string; guest_phone:string };
export type Allocation = { accommodation_type_id:number; bubble_id:number|null; guests:number };
export type BookingInput = Guest & ({ product_type:"day_use"; guests:number; visit_date:string; day_use_product_id:number } | { product_type:"bubble_stay"; guests:number; check_in:string; check_out:string; random_assignment:boolean; bubbles:Allocation[] });
export type BookingStatus = "pending_payment"|"paid"|"confirmed"|"checked_in"|"pending_check_out"|"checked_out"|"completed"|"failed"|"cancelled"|"expired"|"no_show";
export type Booking = { booking_reference:string; booking_code:string; product_type:"day_use"|"bubble_stay"; status:BookingStatus; total:string; currency:string; guests:number; hold_expires_at:string|null; payment_expires_at:string|null; operational_status?:string; payment?:{status:string}|null; tickets_count?:number; tickets?:{ticket_code:string; type:string; title:string; valid_from:string; valid_to:string}[] };
export type Ticket = { booking_reference:string; booking_code:string; status:BookingStatus; guest_name:string; product_type:Booking["product_type"] };
export class OpalApiError extends Error {
  constructor(public status:number, public fields:Record<string,string[]>, public retryAfter:number|null, public traceId:string|null) { super("Opal API request failed"); }
}
function record(x:unknown): x is Record<string,unknown> { return typeof x==="object" && x!==null && !Array.isArray(x); }
export function apiOrigin(value:string):string {
  const u=new URL(value);
  if(!["https:","http:"].includes(u.protocol)||u.username||u.password||u.pathname!=="/"||u.search||u.hash) throw new Error("OPAL API URL must be an HTTP(S) origin");
  return u.origin;
}
export function poolsideConnection(rawOrigin:string,rawGateway:string|undefined):{origin:string;gateway:Gateway}{
  const gateway:Gateway=rawGateway==="mock"?"mock":"paymob";
  if(rawGateway!==undefined&&rawGateway!==""&&rawGateway!=="mock"&&rawGateway!=="paymob")return {origin:"",gateway};
  try{
    const origin=apiOrigin(rawOrigin);
    const hostname=new URL(origin).hostname;
    const local=["localhost","127.0.0.1","[::1]"].includes(hostname);
    if(hostname.endsWith(".example")||hostname==="example.com"||(!local&&(!origin.startsWith("https://")||gateway==="mock")))return {origin:"",gateway};
    return {origin,gateway};
  }catch{return {origin:"",gateway};}
}
export function paymentDestination(value:string,gateway:Gateway,origin:string):string {
  const url=new URL(value);
  if(url.username||url.password|| (gateway==="mock" ? url.origin!==apiOrigin(origin)||!["http:","https:"].includes(url.protocol) : url.protocol!=="https:")) throw new Error("Invalid payment URL");
  return url.href;
}
export const confirmedStatuses:readonly BookingStatus[]=["confirmed","checked_in","pending_check_out","checked_out","completed"];
export const unsuccessfulStatuses:readonly BookingStatus[]=["failed","cancelled","expired","no_show"];
export function isConfirmed(status:BookingStatus){return confirmedStatuses.includes(status);}
export function shouldPoll(status:BookingStatus){return status==="pending_payment"||status==="paid";}
export function makeOpalApi(origin:string,locale:OpalLocale) {
  const base=apiOrigin(origin)+"/api/v1";
  async function request<T>(path:string, options:{method?:"GET"|"POST";body?:unknown;signal?:AbortSignal}={}):Promise<T>{
    const controller=new AbortController();
    const abort=()=>controller.abort();
    if(options.signal?.aborted) abort();
    options.signal?.addEventListener("abort",abort,{once:true});
    const timeout=setTimeout(abort,15000);
    try{
      const res=await fetch(base+path,{method:options.method??"GET",headers:{Accept:"application/json","Accept-Language":locale,...(options.body===undefined?{}:{"Content-Type":"application/json"})},body:options.body===undefined?undefined:JSON.stringify(options.body),cache:"no-store",credentials:"omit",redirect:"error",signal:controller.signal});
      const payload:unknown=await res.json().catch(()=>null);
      if(!res.ok||!record(payload)||payload.success!==true||!("data" in payload)){
        const obj=record(payload)?payload:{};
        const fields:Record<string,string[]>={};
        if(record(obj.errors)) for(const [key,val] of Object.entries(obj.errors)){
          if(typeof val==="string") fields[key]=[val];
          else if(Array.isArray(val)) fields[key]=val.filter((x):x is string=>typeof x==="string");
        }
        const retry=res.headers.get("Retry-After");
        const seconds=retry===null?NaN:Number(retry);
        const delay=Number.isFinite(seconds)?seconds:retry?Math.ceil((Date.parse(retry)-Date.now())/1000):NaN;
        throw new OpalApiError(res.ok?502:res.status,fields,Number.isFinite(delay)?Math.max(1,delay):null,typeof obj.trace_id==="string"?obj.trace_id:null);
      }
      return payload.data as T;
    }catch(e){if(e instanceof OpalApiError)throw e;throw new OpalApiError(0,{},null,null);}
    finally{clearTimeout(timeout);options.signal?.removeEventListener("abort",abort);}
  }
  const esc=encodeURIComponent;
  return {
    ping:()=>request<unknown>("/ping"),
    dayUse:(signal?:AbortSignal)=>request<DayUse[]>("/day-use",{signal}),
    accommodations:(signal?:AbortSignal)=>request<Accommodation[]>("/accommodations",{signal}),
    accommodation:(slug:string,signal?:AbortSignal)=>request<Accommodation>("/accommodations/"+esc(slug),{signal}),
    availability:(slug:string,checkIn:string,checkOut:string,guests:number,signal?:AbortSignal)=>request<Availability>("/accommodations/"+esc(slug)+"/availability?"+new URLSearchParams({check_in:checkIn,check_out:checkOut,guests:String(guests)}),{signal}),
    create:(body:BookingInput)=>request<Booking>("/bookings",{method:"POST",body}),
    booking:(reference:string,signal?:AbortSignal)=>request<Booking>("/bookings/"+esc(reference),{signal}),
    pay:(reference:string,gateway:Gateway)=>request<{payment_url:string}>("/bookings/"+esc(reference)+"/pay",{method:"POST",body:{gateway}}),
    ticket:(code:string)=>request<Ticket>("/tickets/"+esc(code)),
  };
}

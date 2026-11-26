import { NextRequest,NextResponse } from "next/server";
import { apiOrigin,poolsideConnection } from "@/lib/opal-api";
const cookie="opal_agency_session";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
const fail=(status:number)=>reply({success:false,message:"Agency request unavailable"},status);
const safeReference=/^[A-Za-z0-9._~-]{1,256}$/;
const referenceValid=(value:string)=>safeReference.test(value)&&value!=="."&&value!=="..";
const slug=/^[a-z0-9][a-z0-9-]{0,159}$/;
function route(path:string[],method:string){
 const [a,b,c]=path;
 if(path.length===1){
  if(method==="POST"&&["login","logout","bookings"].includes(a))return a;
  if(method==="GET"&&["me","day-use","accommodations","bookings"].includes(a))return a;
 }
 if(a==="accommodations"&&b&&slug.test(b)&&method==="GET"&&(path.length===2||path.length===3&&c==="availability"))return path.map(encodeURIComponent).join("/");
 if(a==="bookings"&&b&&referenceValid(b)&&(path.length===2&&method==="GET"||path.length===3&&c==="pay"&&method==="POST"))return path.map(encodeURIComponent).join("/");
 return null;
}
async function handle(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 if(process.env.OPAL_AGENCY_ENABLED!=="true")return fail(404);
 const {path}=await params,method=req.method;
 const endpoint=route(path,method);
 if(!endpoint)return fail(404);
 const connection=poolsideConnection(process.env.OPAL_API_BASE_URL||"",process.env.OPAL_PAYMENT_GATEWAY);
 if(!connection.origin)return fail(503);
 const origin=connection.origin;
 let publicOrigin:string;
 try{
  publicOrigin=apiOrigin(process.env.OPAL_AGENCY_PUBLIC_ORIGIN||"");
  if(!publicOrigin.startsWith("https://")&&!["127.0.0.1","localhost","[::1]"].includes(new URL(publicOrigin).hostname))throw Error();
 }catch{return fail(503);}
 if(method==="POST"&&req.headers.get("origin")!==publicOrigin)return fail(403);
 const token=req.cookies.get(cookie)?.value;
 const cookieOptions={httpOnly:true,secure:publicOrigin.startsWith("https://"),sameSite:"lax" as const,path:"/api/agency",maxAge:3600};
 const clear=(res:NextResponse)=>{res.cookies.set(cookie,"",{...cookieOptions,maxAge:0});return res;};
 if(endpoint!=="login"&&!token)return fail(401);
 const q=new URLSearchParams();
 const keys=endpoint==="bookings"&&method==="GET"?["status","product_type","page"]:endpoint.endsWith("/availability")?["check_in","check_out","guests"]:[];
 for(const key of keys){const v=req.nextUrl.searchParams.get(key);if(v!==null&&v.length<=80)q.set(key,v);}
 let body:unknown;
 if(method==="POST"){
  if(!req.headers.get("content-type")?.startsWith("application/json"))return fail(415);
  try{const raw=await req.text();if(raw.length>20000)return fail(413);body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))return fail(422);}catch{return fail(400);}
  if(endpoint==="login"){
   const v=body as Record<string,unknown>;
   if(typeof v.email!=="string"||typeof v.password!=="string"||v.email.length>254||v.password.length>512)return fail(422);
   body={email:v.email,password:v.password};
  }
  if(endpoint==="bookings"){
   const v=body as Record<string,unknown>;
   const common=["product_type","guests","guest_name","guest_email","guest_phone"];
   const allowed=new Set([...common,...(v.product_type==="day_use"?["visit_date","day_use_product_id"]:v.product_type==="bubble_stay"?["check_in","check_out","random_assignment","bubbles"]:[])]);
   if(!["day_use","bubble_stay"].includes(String(v.product_type))||Object.keys(v).some(k=>!allowed.has(k)))return fail(422);
   if(v.product_type==="bubble_stay"&&(!Array.isArray(v.bubbles)||v.bubbles.length<1||v.bubbles.length>6||v.bubbles.some(u=>!u||typeof u!=="object"||Array.isArray(u)||Object.keys(u).some(k=>!["accommodation_type_id","bubble_id","guests"].includes(k)))))return fail(422);
  }
  if(endpoint.endsWith("/pay")){
   // Production gateway selection belongs to the server, never the client.
   body={gateway:connection.gateway};
  }
 }
 try{
  const upstream=await fetch(origin+"/api/v1/agency/"+endpoint+(q.size?"?"+q:""),{method,headers:{Accept:"application/json","Accept-Language":req.headers.get("accept-language")==="ar"?"ar":"en",...(endpoint!=="login"&&token?{Authorization:"Bearer "+token}:{}),...(method==="POST"?{"Content-Type":"application/json"}:{})},body:method==="POST"?JSON.stringify(body):undefined,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
  if(endpoint==="logout")return clear(upstream.ok?reply({success:true,data:null}):fail(upstream.status));
  if(upstream.status===401)return clear(fail(401));
  const data=await upstream.json();
  if(endpoint==="login"){
   if(!upstream.ok||data.success!==true)return fail(upstream.status>=400?upstream.status:502);
   const issued=data.data?.token;
   if(typeof issued!=="string"||!issued||issued.length>2048)return fail(502);
   const res=reply({success:true,data:{agency:data.data.agency,actor:data.data.actor,capabilities:data.data.capabilities}});
   res.cookies.set(cookie,issued,cookieOptions);return res;
  }
  return reply(data,upstream.status);
 }catch{return endpoint==="logout"?clear(fail(502)):fail(502);}
}
export const GET=handle;
export const POST=handle;

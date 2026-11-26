// Read-only staging preflight. No credentials, booking creation, payment or webhook calls.
import { pathToFileURL } from "node:url";
export const expectedDay=["zalina-luxor-day-experience","zalina-arabian-village-night-experience"];
export const expectedStay=["one-bed-bubble","two-bed-bubble","three-bed-bubble"];
export function checkedOrigin(value){
 const url=new URL(value);
 if(url.username||url.password||url.pathname!=="/"||url.search||url.hash||!["https:","http:"].includes(url.protocol))throw Error("Use an HTTP(S) origin only");
 const local=["localhost","127.0.0.1","[::1]"].includes(url.hostname);
 if(!local&&(url.protocol!=="https:"||url.hostname.endsWith(".example")||url.hostname==="example.com"))throw Error("Use the actual HTTPS environment, not a placeholder");
 return url.origin;
}
const decimal=v=>typeof v==="string"&&/^\d+\.\d{2}$/.test(v);
export function catalogIssues(data,kind){
 const issues=[];
 if(!Array.isArray(data))return ["Catalog is not an array"];
 const day=kind==="day",key=day?"slug":"slug_en",price=day?"price_per_guest":"price_per_night";
 const active=data.filter(p=>p?.is_active===true);
 for(const slug of day?expectedDay:expectedStay){
  const item=active.find(p=>p[key]===slug);
  if(!item){issues.push("Missing active slug: "+slug);continue;}
  if(!Number.isSafeInteger(item.id)||item.id<1||!decimal(item[price])||typeof item.currency!=="string"||!item.name_en||!item.name_ar)issues.push("Invalid product contract: "+slug);
  if(!day&&(!Number.isSafeInteger(item.max_guests)||item.max_guests<1))issues.push("Invalid capacity: "+slug);
  if(["cover_image","gallery","media"].some(k=>k in item))issues.push("Unexpected media fields: "+slug);
 }
 return issues;
}
export function availabilityIssues(data,type){
 const issues=[];
 if(!data||typeof data!=="object")return ["Missing availability response"];
 if(typeof data.availability!=="boolean"||!Number.isSafeInteger(data.available_bubbles)||data.available_bubbles<0)issues.push("Invalid availability/count");
 if(!decimal(data.price_per_night)||!decimal(data.total_estimate)||data.currency!==type.currency)issues.push("Invalid availability pricing");
 if(!Array.isArray(data.bubbles))issues.push("Missing physical units array");
 else{
  const ids=new Set();
  for(const b of data.bubbles){
   if(!Number.isSafeInteger(b?.id)||b.id<1||ids.has(b.id)||b.accommodation_type_id!==type.id||typeof b.code!=="string")issues.push("Invalid or duplicate physical unit");
   ids.add(b?.id);
  }
 }
 return issues;
}
export function futureWindow(now=new Date()){
 const cairo=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const midnight=Date.parse(cairo+"T00:00:00Z");
 if(!Number.isFinite(midnight))throw Error("Cannot determine Cairo date");
 const stamp=offset=>new Date(midnight+offset*86400000).toISOString().slice(0,10);
 return {check_in:stamp(7),check_out:stamp(8),guests:"1"};
}
function cors(response,frontend){const v=response.headers.get("access-control-allow-origin");return v==="*"||v===frontend;}
async function main(){
 const [rawApi,rawFrontend]=process.argv.slice(2);
 if(!rawApi||!rawFrontend)throw Error("Usage: node scripts/poolside-preflight.mjs <Laravel origin> <Next.js origin>");
 const api=checkedOrigin(rawApi),frontend=checkedOrigin(rawFrontend);
 const rows=[];
 const window=futureWindow();
 let stayCatalog=[];
 async function check(name,fn){try{await fn();rows.push({check:name,result:"PASS"});}catch(e){rows.push({check:name,result:"FAIL",detail:e instanceof Error?e.message:"request failed"});}}
 async function get(path,locale){
  const response=await fetch(api+"/api/v1/"+path,{headers:{Accept:"application/json","Accept-Language":locale,Origin:frontend},redirect:"error",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error("HTTP "+response.status);
  const json=await response.json();if(json?.success!==true||!("data" in json))throw Error("Invalid success envelope");
  if(!cors(response,frontend))throw Error("Missing matching CORS header");
  if(response.headers.get("content-language")?.toLowerCase()!==locale)throw Error("Content-Language mismatch");
  return json.data;
 }
 for(const locale of ["en","ar"]){
  await check("Ping "+locale,()=>get("ping",locale));
  await check("Day Use "+locale,async()=>{const issues=catalogIssues(await get("day-use",locale),"day");if(issues.length)throw Error(issues.join("; "));});
  await check("Accommodation "+locale,async()=>{const data=await get("accommodations",locale);const issues=catalogIssues(data,"stay");if(issues.length)throw Error(issues.join("; "));if(locale==="en")stayCatalog=data;});
  for(const slug of expectedStay){
   const type=stayCatalog.find(p=>p.slug_en===slug&&p.is_active);
   if(!type){rows.push({check:"Detail and availability "+slug+" "+locale,result:"SKIP",detail:"English catalog validation failed"});continue;}
   await check("Detail "+slug+" "+locale,async()=>{
    const data=await get("accommodations/"+encodeURIComponent(slug),locale);
    if(!data||data.id!==type.id||data.slug_en!==slug||data.price_per_night!==type.price_per_night||data.currency!==type.currency||data.max_guests!==type.max_guests)throw Error("Detail does not match catalog contract");
   });
   await check("Availability "+slug+" "+locale,async()=>{
    const data=await get("accommodations/"+encodeURIComponent(slug)+"/availability?"+new URLSearchParams(window),locale);
    const issues=availabilityIssues(data,type);if(issues.length)throw Error(issues.join("; "));
   });
  }
 }
 await check("Booking POST preflight (OPTIONS only)",async()=>{
  const res=await fetch(api+"/api/v1/bookings",{method:"OPTIONS",headers:{Origin:frontend,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type,accept-language"},redirect:"error",signal:AbortSignal.timeout(15000)});
  const methods=(res.headers.get("access-control-allow-methods")||"").toUpperCase().split(/\s*,\s*/);
  const headers=(res.headers.get("access-control-allow-headers")||"").toLowerCase().split(/\s*,\s*/);
  if(!res.ok||!cors(res,frontend)||!methods.some(x=>x==="POST"||x==="*")||!["content-type","accept-language"].every(x=>headers.includes(x)||headers.includes("*")))throw Error("CORS preflight rejected");
 });
 console.log(JSON.stringify({environment:api,frontend,mode:"READ_ONLY",availabilityWindow:window,checks:rows,releaseAcceptance:"NOT_VERIFIED"},null,2));
 if(rows.some(r=>r.result!=="PASS"))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});

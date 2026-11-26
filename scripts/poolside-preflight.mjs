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
function cors(response,frontend){const v=response.headers.get("access-control-allow-origin");return v==="*"||v===frontend;}
async function main(){
 const [rawApi,rawFrontend]=process.argv.slice(2);
 if(!rawApi||!rawFrontend)throw Error("Usage: node scripts/poolside-preflight.mjs <Laravel origin> <Next.js origin>");
 const api=checkedOrigin(rawApi),frontend=checkedOrigin(rawFrontend);
 const rows=[];
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
  await check("Accommodation "+locale,async()=>{const issues=catalogIssues(await get("accommodations",locale),"stay");if(issues.length)throw Error(issues.join("; "));});
 }
 await check("Booking POST preflight (OPTIONS only)",async()=>{
  const res=await fetch(api+"/api/v1/bookings",{method:"OPTIONS",headers:{Origin:frontend,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type,accept-language"},redirect:"error",signal:AbortSignal.timeout(15000)});
  const methods=(res.headers.get("access-control-allow-methods")||"").toUpperCase().split(/\s*,\s*/);
  const headers=(res.headers.get("access-control-allow-headers")||"").toLowerCase().split(/\s*,\s*/);
  if(!res.ok||!cors(res,frontend)||!methods.some(x=>x==="POST"||x==="*")||!["content-type","accept-language"].every(x=>headers.includes(x)||headers.includes("*")))throw Error("CORS preflight rejected");
 });
 console.log(JSON.stringify({environment:api,frontend,mode:"READ_ONLY",checks:rows,releaseAcceptance:"NOT_VERIFIED"},null,2));
 if(rows.some(r=>r.result==="FAIL"))process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});

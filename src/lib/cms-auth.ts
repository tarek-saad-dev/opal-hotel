import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const cookieName="opal_cms_session";
const sessionSeconds=60*60*12;
const failures=new Map<string,{count:number;until:number}>();
function settings(){
  const password=process.env.OPAL_CMS_ADMIN_PASSWORD||"";
  const secret=process.env.OPAL_CMS_SESSION_SECRET||"";
  const origin=process.env.OPAL_CMS_PUBLIC_ORIGIN||"";
  return {password,secret,origin,ready:password.length>=16&&secret.length>=40};
}
function fingerprint(password:string):string{
  return createHash("sha256").update(password,"utf8").digest("hex").slice(0,16);
}
function sign(payload:string,secret:string):string{
  return createHmac("sha256",secret).update(payload).digest("base64url");
}
export function isAuthConfigured():boolean{return settings().ready;}
export async function isCmsAuthenticated():Promise<boolean>{
  const cfg=settings();
  if(!cfg.ready)return false;
  const token=(await cookies()).get(cookieName)?.value||"";
  const [payload,signature]=token.split(".");
  if(!payload||!signature)return false;
  const expected=sign(payload,cfg.secret);
  const a=Buffer.from(signature),b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b))return false;
  try{
    const decoded=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as {
      v:number;exp:number;pwd:string;
    };
    return decoded.v===1&&Number.isFinite(decoded.exp)&&decoded.exp>Date.now()
      &&decoded.pwd===fingerprint(cfg.password);
  }catch{return false;}
}
export async function issueCmsSession():Promise<void>{
  const cfg=settings();
  if(!cfg.ready)throw new Error("CMS_ADMIN_NOT_CONFIGURED");
  const payload=Buffer.from(JSON.stringify({
    v:1,exp:Date.now()+sessionSeconds*1000,pwd:fingerprint(cfg.password),
    nonce:randomBytes(8).toString("hex")
  })).toString("base64url");
  (await cookies()).set(cookieName,payload+"."+sign(payload,cfg.secret),{
    httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",
    path:"/",maxAge:sessionSeconds,priority:"high"
  });
}
export async function expireCmsSession():Promise<void>{
  (await cookies()).set(cookieName,"",{httpOnly:true,sameSite:"strict",
    secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
}
export function verifyCmsPassword(candidate:string):boolean{
  const cfg=settings();
  if(!cfg.ready||typeof candidate!=="string")return false;
  const a=createHash("sha256").update(candidate).digest();
  const b=createHash("sha256").update(cfg.password).digest();
  return timingSafeEqual(a,b);
}
function requestIp(request:NextRequest):string {
  // Nginx sets X-Real-IP itself, even if the client supplied a forged value.
  const raw=request.headers.get("x-real-ip")||"unknown";
  return raw.slice(0,80);
}
export function canAttemptLogin(request:NextRequest):boolean{
  const ip=requestIp(request),entry=failures.get(ip);
  if(!entry)return true;
  if(entry.until<Date.now()){failures.delete(ip);return true;}
  return entry.count<5;
}
export function recordLoginFailure(request:NextRequest):void {
  const ip=requestIp(request),now=Date.now();
  const old=failures.get(ip);
  const entry=old&&old.until>now?old:{count:0,until:now+15*60*1000};
  entry.count++;failures.set(ip,entry);
  if(failures.size>1500)for(const [key,value] of failures){
    if(value.until<now)failures.delete(key);
  }
}
export function clearLoginFailures(request:NextRequest):void{failures.delete(requestIp(request));}
export function validCmsMutationOrigin(request:NextRequest):boolean {
  const origin=request.headers.get("origin");
  if(!origin)return false;
  const cfg=settings();
  // The trusted public origin MUST be configured on production; never accept
  // attacker-selected Host headers as the only CSRF authority.
  const expected=cfg.origin||(process.env.NODE_ENV!=="production"
    ? new URL(request.url).origin:"");
  if(!expected)return false;
  try{return new URL(origin).origin===new URL(expected).origin;}
  catch{return false;}
}
export const noStoreHeaders={"Cache-Control":"private, no-store"};

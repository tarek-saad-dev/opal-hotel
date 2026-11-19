import { NextRequest, NextResponse } from "next/server";
import { canAttemptLogin, clearLoginFailures, isAuthConfigured, issueCmsSession, noStoreHeaders, recordLoginFailure, validCmsMutationOrigin, verifyCmsPassword } from "@/lib/cms-auth";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  if(!validCmsMutationOrigin(request))return NextResponse.json({error:"Invalid request origin"},{status:403,headers:noStoreHeaders});
  if(!isAuthConfigured())return NextResponse.json({error:"CMS_NOT_CONFIGURED"},{status:503,headers:noStoreHeaders});
  if(!canAttemptLogin(request))return NextResponse.json({error:"TOO_MANY_ATTEMPTS"},{status:429,headers:{...noStoreHeaders,"Retry-After":"900"}});
  if(Number(request.headers.get("content-length")||0)>2048)return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
  let body:unknown;
  try{body=await request.json();}catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  const pass=(body&&typeof body==="object"&&(body as {password?:unknown}).password)||"";
  if(typeof pass!=="string"||!verifyCmsPassword(pass)){
    recordLoginFailure(request);
    return NextResponse.json({error:"INVALID_CREDENTIALS"},{status:401,headers:noStoreHeaders});
  }
  clearLoginFailures(request);
  await issueCmsSession();
  return NextResponse.json({ok:true},{headers:noStoreHeaders});
}

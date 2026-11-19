import { NextRequest,NextResponse } from "next/server";
import { isCmsAuthenticated, noStoreHeaders, validCmsMutationOrigin } from "@/lib/cms-auth";
import { readCmsVersions,saveDraft } from "@/lib/cms-store";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
  return NextResponse.json(await readCmsVersions(),{headers:noStoreHeaders});
}
export async function PUT(request:NextRequest){
  if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
  if(!validCmsMutationOrigin(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStoreHeaders});
  if(Number(request.headers.get("content-length")||0)>250000)return NextResponse.json({error:"TOO_LARGE"},{status:413});
  try{
    const body=await request.json() as {document?:unknown;expectedRevision?:number};
    if(!Number.isSafeInteger(body.expectedRevision))return NextResponse.json({error:"BAD_REVISION"},{status:400});
    const draft=await saveDraft(body.document,body.expectedRevision!);
    return NextResponse.json({draft},{headers:noStoreHeaders});
  }catch(err){
    const message=err instanceof Error?err.message:"UNKNOWN_ERROR";
    return NextResponse.json({error:message},{status:message==="REVISION_CONFLICT"?409:400,headers:noStoreHeaders});
  }
}

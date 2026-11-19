import { NextRequest,NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isCmsAuthenticated,noStoreHeaders,validCmsMutationOrigin } from "@/lib/cms-auth";
import { publishDraft } from "@/lib/cms-store";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
  if(!validCmsMutationOrigin(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const data=await request.json() as {expectedRevision?:number};
    if(!Number.isSafeInteger(data.expectedRevision))return NextResponse.json({error:"BAD_REVISION"},{status:400});
    const result=await publishDraft(data.expectedRevision!);
    // Invalidate both localized homepage routes after the atomic CMS publish.
    revalidatePath("/en");
    revalidatePath("/ar");
    return NextResponse.json(result,{headers:noStoreHeaders});
  }catch(err){
    const error=err instanceof Error?err.message:"UNKNOWN_ERROR";
    return NextResponse.json({error},{status:error==="REVISION_CONFLICT"?409:400,headers:noStoreHeaders});
  }
}

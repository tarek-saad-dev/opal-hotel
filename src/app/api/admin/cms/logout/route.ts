import { NextRequest,NextResponse } from "next/server";
import { expireCmsSession, noStoreHeaders, validCmsMutationOrigin } from "@/lib/cms-auth";
export const runtime="nodejs";
export async function POST(request:NextRequest){
  if(!validCmsMutationOrigin(request))return NextResponse.json({error:"Invalid request origin"},{status:403});
  await expireCmsSession();
  return NextResponse.json({ok:true},{headers:noStoreHeaders});
}

import { NextResponse } from "next/server";
import { isCmsAuthenticated,noStoreHeaders } from "@/lib/cms-auth";
import { getHistory } from "@/lib/cms-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
  return NextResponse.json({history:await getHistory()},{headers:noStoreHeaders});
}

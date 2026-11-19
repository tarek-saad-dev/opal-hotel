import { NextResponse } from "next/server";
import { isAuthConfigured, isCmsAuthenticated, noStoreHeaders } from "@/lib/cms-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  return NextResponse.json({authenticated:await isCmsAuthenticated(),configured:isAuthConfigured()},{headers:noStoreHeaders});
}

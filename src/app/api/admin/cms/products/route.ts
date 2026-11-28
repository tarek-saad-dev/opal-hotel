import { NextResponse } from "next/server";
import { isCmsAuthenticated,noStoreHeaders } from "@/lib/cms-auth";
import { makeOpalApi,poolsideConnection } from "@/lib/opal-api";
import { validLiveProductSlug,poolsideMediaKey,type PoolsideMediaKind } from "@/lib/room-concepts";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
 const {origin}=poolsideConnection(process.env.OPAL_API_BASE_URL||"",process.env.OPAL_PAYMENT_GATEWAY);
 if(!origin)return NextResponse.json({error:"API_NOT_CONFIGURED"},{status:503,headers:noStoreHeaders});
 try{
  const api=makeOpalApi(origin,"en");
  const [day,stay]=await Promise.all([api.dayUse(),api.accommodations()]);
  if(!Array.isArray(day)||!Array.isArray(stay))throw Error();
  const products=[...day.map(p=>({kind:"day_use" as const,slug:p.slug,nameEn:p.name_en,nameAr:p.name_ar,active:p.is_active})),...stay.map(p=>({kind:"bubble_stay" as const,slug:p.slug_en,nameEn:p.name_en,nameAr:p.name_ar,active:p.is_active}))];
  const result=products.filter(p=>p.active===true&&typeof p.slug==="string"&&validLiveProductSlug(p.slug)&&typeof p.nameEn==="string"&&typeof p.nameAr==="string").map(p=>({kind:p.kind,slug:p.slug,key:poolsideMediaKey(p.kind as PoolsideMediaKind,p.slug),nameEn:p.nameEn,nameAr:p.nameAr}));
  return NextResponse.json({products:result},{headers:noStoreHeaders});
 }catch{return NextResponse.json({error:"CATALOG_UNAVAILABLE"},{status:502,headers:noStoreHeaders});}
}

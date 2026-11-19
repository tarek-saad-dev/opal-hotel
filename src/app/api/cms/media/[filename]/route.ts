import { NextResponse } from "next/server";
import { getUploadedImage,isPublishedCmsImage } from "@/lib/cms-store";
import { isCmsAuthenticated } from "@/lib/cms-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}){
  const {filename}=await params;
  const published=await isPublishedCmsImage(filename);
  if(!published&&!await isCmsAuthenticated())return new NextResponse(null,{status:404,headers:{"Cache-Control":"no-store"}});
  const image=await getUploadedImage(filename);
  if(!image)return new NextResponse(null,{status:404,headers:{"Cache-Control":"no-store"}});
  return new NextResponse(new Uint8Array(image.data),{headers:{
    "Content-Type":image.type,
    "Cache-Control":published?"public, max-age=600":"private, no-store",
    "Vary":"Cookie",
    "X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; sandbox"
  }});
}

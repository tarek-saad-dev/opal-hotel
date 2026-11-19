import { NextResponse } from "next/server";
import { getUploadedImage } from "@/lib/cms-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}){
  const {filename}=await params;
  const image=await getUploadedImage(filename);
  if(!image)return new NextResponse(null,{status:404,headers:{"Cache-Control":"no-store"}});
  return new NextResponse(new Uint8Array(image.data),{headers:{
    "Content-Type":image.type,
    "Cache-Control":"public, max-age=31536000, immutable",
    "X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; sandbox"
  }});
}

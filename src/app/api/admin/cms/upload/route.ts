import { NextRequest,NextResponse } from "next/server";
import { isCmsAuthenticated,noStoreHeaders,validCmsMutationOrigin } from "@/lib/cms-auth";
import { saveUploadedImage } from "@/lib/cms-store";
export const runtime="nodejs";
function detectImage(buffer:Buffer):"png"|"jpg"|"webp"|null{
  if(buffer.length<32)return null;
  if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "png";
  if(buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return "jpg";
  if(buffer.toString("ascii",0,4)==="RIFF"&&buffer.toString("ascii",8,12)==="WEBP")return "webp";
  return null;
}
export async function POST(request:NextRequest){
  if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
  if(!validCmsMutationOrigin(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  if(Number(request.headers.get("content-length")||0)>6*1024*1024)
    return NextResponse.json({error:"IMAGE_TOO_LARGE"},{status:413});
  try{
    const data=await request.formData();
    const image=data.get("image");
    if(!(image instanceof File)||image.size===0||image.size>4*1024*1024)
      return NextResponse.json({error:"Choose an image under 4 MB"},{status:400});
    const buffer=Buffer.from(await image.arrayBuffer());
    const ext=detectImage(buffer);
    if(!ext)return NextResponse.json({error:"JPEG, PNG or WebP images only"},{status:415});
    const src=await saveUploadedImage(buffer,ext);
    return NextResponse.json({src},{headers:noStoreHeaders});
  }catch{
    return NextResponse.json({error:"Upload failed"},{status:400,headers:noStoreHeaders});
  }
}

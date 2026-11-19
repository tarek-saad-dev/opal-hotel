import { NextRequest,NextResponse } from "next/server";
import { isCmsAuthenticated,noStoreHeaders,validCmsMutationOrigin } from "@/lib/cms-auth";
import { saveUploadedVideo } from "@/lib/cms-store";
export const runtime="nodejs";

// A 4-minute owner film is accepted on demand. Short Hero assets have tight budgets.
const limits={desktop:6*1024*1024,mobile:4*1024*1024,film:50*1024*1024,gallery:50*1024*1024} as const;
export async function POST(request:NextRequest){
  if(!await isCmsAuthenticated())return NextResponse.json({error:"UNAUTHORIZED"},{status:401,headers:noStoreHeaders});
  if(!validCmsMutationOrigin(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStoreHeaders});
  if(Number(request.headers.get("content-length")||0)>52*1024*1024)
    return NextResponse.json({error:"VIDEO_TOO_LARGE"},{status:413,headers:noStoreHeaders});
  try{
    const data=await request.formData();
    const role=data.get("role");
    const video=data.get("video");
    if(role!=="desktop"&&role!=="mobile"&&role!=="film"&&role!=="gallery")
      return NextResponse.json({error:"INVALID_VIDEO_ROLE"},{status:400,headers:noStoreHeaders});
    if(!(video instanceof File)||!video.size||video.size>limits[role])
      return NextResponse.json({error:"VIDEO_TOO_LARGE"},{status:413,headers:noStoreHeaders});
    if(!video.name.toLowerCase().endsWith(".mp4"))
      return NextResponse.json({error:"MP4_ONLY"},{status:415,headers:noStoreHeaders});
    const buffer=Buffer.from(await video.arrayBuffer());
    // Confirm ISO Base Media File Format instead of trusting upload filename/MIME.
    // Transcode offline to H.264 + faststart before upload.
    if(buffer.length<32||buffer.toString("ascii",4,8)!=="ftyp")
      return NextResponse.json({error:"INVALID_MP4_CONTAINER"},{status:415,headers:noStoreHeaders});
    const src=await saveUploadedVideo(buffer);
    return NextResponse.json({src},{headers:noStoreHeaders});
  }catch{
    return NextResponse.json({error:"UPLOAD_FAILED"},{status:400,headers:noStoreHeaders});
  }
}

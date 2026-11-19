import { NextRequest } from "next/server";
import { isCmsAuthenticated } from "@/lib/cms-auth";
import { getCmsVideoStat,getCmsVideoStream,isPublishedCmsVideo } from "@/lib/cms-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:NextRequest,{params}:{params:Promise<{filename:string}>}){
  const {filename}=await params;
  if(!/^[0-9a-f]{32}\.mp4$/.test(filename))return new Response(null,{status:404});
  const published=await isPublishedCmsVideo(filename);
  if(!published&&!await isCmsAuthenticated())
    return new Response(null,{status:404,headers:{"Cache-Control":"private, no-store"}});
  const size=await getCmsVideoStat(filename);
  if(size===null)return new Response(null,{status:404});
  const headers=new Headers({
    "Content-Type":"video/mp4",
    "Accept-Ranges":"bytes",
    "X-Content-Type-Options":"nosniff",
    "Cache-Control":published?"public, max-age=600":"private, no-store",
    "Vary":"Cookie"
  });
  const range=request.headers.get("range");
  let start=0,end=size-1;
  if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if(!match||(!match[1]&&!match[2])){
      headers.set("Content-Range",`bytes */${size}`);
      return new Response(null,{status:416,headers});
    }
    if(!match[1]){ // suffix range: last N bytes
      const suffix=Number(match[2]);
      if(!Number.isSafeInteger(suffix)||suffix===0){
        headers.set("Content-Range",`bytes */${size}`);
        return new Response(null,{status:416,headers});
      }
      start=Math.max(size-suffix,0);
    }else{
      start=Number(match[1]);
      end=match[2]?Number(match[2]):size-1;
    }
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start){
      headers.set("Content-Range",`bytes */${size}`);
      return new Response(null,{status:416,headers});
    }
    end=Math.min(end,size-1);
    headers.set("Content-Range",`bytes ${start}-${end}/${size}`);
  }
  headers.set("Content-Length",String(end-start+1));
  return new Response(getCmsVideoStream(filename,start,end),{
    status:range?206:200,headers
  });
}

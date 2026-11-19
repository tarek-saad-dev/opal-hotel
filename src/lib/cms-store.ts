import { promises as fs,createReadStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { defaultCmsSite, hasApprovedCmsLogo, hasApprovedCmsHeroVideo, hasApprovedCmsFullFilm, hasCompleteCmsMedia, isManagedImagePath, isManagedVideoPath, mediaRoles, validateCmsSite, type CmsSite } from "@/lib/cms-schema";

const root=()=>process.env.OPAL_CMS_DATA_DIR||
  (process.env.NODE_ENV==="production"?"/var/lib/opal-hotel-cms":path.join(process.cwd(),".cms-data"));
const docPath=(name:"draft"|"published")=>path.join(root(),name+".json");
const mediaDir=()=>path.join(root(),"media");
const videoDir=()=>path.join(root(),"videos");
const historyDir=()=>path.join(root(),"history");
const clean=(text:string)=>text.replace(/[^a-z0-9-]/g,"").slice(0,42);
let pending:Promise<unknown>=Promise.resolve();
function serialized<T>(fn:()=>Promise<T>):Promise<T>{
  const task=pending.then(fn,fn);
  pending=task.then(()=>undefined,()=>undefined);
  return task;
}
async function readJson(filename:string):Promise<CmsSite|null>{
  try{
    const parsed:unknown=JSON.parse(await fs.readFile(filename,"utf8"));
    return validateCmsSite(parsed);
  }catch(err){
    if((err as NodeJS.ErrnoException).code==="ENOENT")return null;
    throw err; // malformed persisted content must never be silently overwritten
  }
}
async function atomicJson(filename:string,value:unknown):Promise<void>{
  await fs.mkdir(path.dirname(filename),{recursive:true,mode:0o700});
  const temp=filename+"."+randomUUID()+".tmp";
  try{
    await fs.writeFile(temp,JSON.stringify(value,null,2)+"\n",{flag:"wx",mode:0o600});
    await fs.rename(temp,filename);
  }finally{await fs.rm(temp,{force:true}).catch(()=>{});}
}
export async function readPublished():Promise<CmsSite>{
  return await readJson(docPath("published"))||defaultCmsSite();
}
export async function readDraft():Promise<CmsSite>{
  return await readJson(docPath("draft"))||await readPublished();
}
export async function readCmsVersions():Promise<{draft:CmsSite;published:CmsSite}>{
  const [draft,published]=await Promise.all([readDraft(),readPublished()]);
  return {draft,published};
}
async function assertMediaFiles(doc:CmsSite):Promise<void>{
  const sources=[doc.media.logo,doc.media.video.posterSrc,...mediaRoles.map(role=>doc.media.photos[role].src)].filter(Boolean);
  for(const src of sources){
    if(!isManagedImagePath(src))throw new Error("Only managed images can be published");
    const filename=src.split("/").at(-1)!;
    try{
      const stat=await fs.stat(path.join(mediaDir(),filename));
      if(!stat.isFile())throw new Error("Not an image file");
    }catch{throw new Error("CMS media file missing: "+filename);}
  }
  for(const src of [doc.media.video.desktopSrc,doc.media.video.mobileSrc,doc.media.video.fullFilmSrc].filter(Boolean)){
    if(!isManagedVideoPath(src))throw new Error("Only uploaded CMS videos can be published");
    const filename=src.split("/").at(-1)!;
    const stat=await fs.stat(path.join(videoDir(),filename)).catch(()=>null);
    if(!stat?.isFile())throw new Error("CMS video file missing: "+filename);
  }
}
export async function saveDraft(input:unknown,expectedRevision:number):Promise<CmsSite>{
  return serialized(async()=>{
    const current=await readDraft();
    if(current.revision!==expectedRevision)throw new Error("REVISION_CONFLICT");
    const verified=validateCmsSite(input);
    const value:CmsSite={...verified,revision:current.revision+1,updatedAt:new Date().toISOString()};
    await assertMediaFiles(value);
    await atomicJson(docPath("draft"),value);
    return value;
  });
}
export async function publishDraft(expectedRevision:number):Promise<{published:CmsSite;mediaReady:boolean}>{
  return serialized(async()=>{
    const draft=await readDraft();
    if(draft.revision!==expectedRevision)throw new Error("REVISION_CONFLICT");
    const published=await readPublished();
    await assertMediaFiles(draft);
    const next:CmsSite={...draft,revision:Math.max(draft.revision,published.revision)+1,
      updatedAt:new Date().toISOString()};
    if(published.revision>0){
      await atomicJson(path.join(historyDir(),clean(String(published.revision))+".json"),published);
    }
    // Persist the new published snapshot first. Draft tracks its revision so
    // subsequent edits cannot overwrite current state without conflict checks.
    await atomicJson(docPath("published"),next);
    await atomicJson(docPath("draft"),next);
    return {published:next,mediaReady:hasCompleteCmsMedia(next)};
  });
}
export async function getHistory():Promise<{revision:number;updatedAt:string}[]>{
  let names:string[];
  try{names=await fs.readdir(historyDir());}
  catch(err){if((err as NodeJS.ErrnoException).code==="ENOENT")return [];throw err;}
  const docs=await Promise.all(names.filter(x=>/^\d+\.json$/.test(x)).map(async x=>{
    const value=await readJson(path.join(historyDir(),x));
    return value?{revision:value.revision,updatedAt:value.updatedAt}:null;
  }));
  return docs.filter((d):d is {revision:number;updatedAt:string}=>d!==null)
    .sort((a,b)=>b.revision-a.revision).slice(0,30);
}
export async function restoreAsDraft(revision:number,expectedRevision:number):Promise<CmsSite>{
  return serialized(async()=>{
    const current=await readDraft();
    if(current.revision!==expectedRevision)throw new Error("REVISION_CONFLICT");
    const old=await readJson(path.join(historyDir(),clean(String(revision))+".json"));
    if(!old)throw new Error("VERSION_NOT_FOUND");
    await assertMediaFiles(old);
    const doc:CmsSite={...old,revision:current.revision+1,updatedAt:new Date().toISOString()};
    await atomicJson(docPath("draft"),doc);
    return doc;
  });
}
/** Draft files remain private. A separately approved logo is public immediately
 * after publishing; gallery photos still require the entire approved set. */
export async function isPublishedCmsImage(filename:string):Promise<boolean>{
  if(!/^[0-9a-f]{32}\.(?:webp|jpg|png)$/.test(filename))return false;
  const published=await readPublished();
  const src="/api/cms/media/"+filename;
  if(hasApprovedCmsLogo(published)&&published.media.logo===src)return true;
  if(hasApprovedCmsHeroVideo(published)&&published.media.video.posterSrc===src)return true;
  return hasCompleteCmsMedia(published)
    &&mediaRoles.some(role=>published.media.photos[role].src===src);
}
export async function saveUploadedImage(buffer:Buffer,ext:"png"|"jpg"|"webp"):Promise<string>{
  await fs.mkdir(mediaDir(),{recursive:true,mode:0o700});
  const name=randomUUID().replaceAll("-","")+"."+ext;
  const dest=path.join(mediaDir(),name);
  await fs.writeFile(dest,buffer,{mode:0o600,flag:"wx"});
  return "/api/cms/media/"+name;
}
export async function getUploadedImage(name:string):Promise<{data:Buffer;type:string}|null>{
  if(!/^[0-9a-f]{32}\.(?:webp|jpg|png)$/.test(name))return null;
  try{
    const data=await fs.readFile(path.join(mediaDir(),name));
    const ext=name.split(".").at(-1)!;
    return {data,type:ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg"};
  }catch(err){
    if((err as NodeJS.ErrnoException).code==="ENOENT")return null;
    throw err;
  }
}

/** Film uploads live outside Git. Paths are generated by the server, never user-supplied. */
export async function saveUploadedVideo(buffer:Buffer):Promise<string>{
  await fs.mkdir(videoDir(),{recursive:true,mode:0o700});
  const filename=randomUUID().replaceAll("-","")+".mp4";
  await fs.writeFile(path.join(videoDir(),filename),buffer,{mode:0o600,flag:"wx"});
  return "/api/cms/video/"+filename;
}
export async function isPublishedCmsVideo(filename:string):Promise<boolean>{
  if(!/^[0-9a-f]{32}\.mp4$/.test(filename))return false;
  const doc=await readPublished();
  const src="/api/cms/video/"+filename;
  const v=doc.media.video;
  return (hasApprovedCmsHeroVideo(doc)&&(v.desktopSrc===src||v.mobileSrc===src))
    ||(hasApprovedCmsFullFilm(doc)&&v.fullFilmSrc===src);
}
export async function getCmsVideoStat(filename:string):Promise<number|null>{
  if(!/^[0-9a-f]{32}\.mp4$/.test(filename))return null;
  const stat=await fs.stat(path.join(videoDir(),filename)).catch(()=>null);
  return stat?.isFile()?stat.size:null;
}
export function getCmsVideoStream(filename:string,start:number,end:number):ReadableStream<Uint8Array>{
  // Caller validates and authorizes the fixed-format filename and byte range.
  return Readable.toWeb(createReadStream(path.join(videoDir(),filename),{start,end})) as unknown as ReadableStream<Uint8Array>;
}

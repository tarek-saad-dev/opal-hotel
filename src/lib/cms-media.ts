import { roomConcepts } from "@/lib/room-concepts";

/** Published images/videos must be explicitly assigned, approved and stored
 * under generated CMS paths. A draft upload by itself is never public. */
export const visualCategories=[
  "exterior","pool","rooms","restaurant","facilities","location","events","garden","other"
] as const;
export type VisualCategory=typeof visualCategories[number];
export type VisualKind="image"|"video";
export type VisualAsset={
  src:string;
  kind:VisualKind;
  title:string;
  category:VisualCategory;
  altEn:string;
  altAr:string;
  approved:boolean;
  poster:string;
};
export type VisualRoom={cover:string;gallery:string[];video:string};
export type VisualPlacements={
  hero:string[];
  overviewMain:string;
  overviewInset:string;
  facilities:string;
  location:string;
  gallery:string[];
  rooms:Record<string,VisualRoom>;
};
export type CmsVisualLibrary={assets:VisualAsset[];placements:VisualPlacements};
export const visualImagePath=(src:string)=>/^\/api\/cms\/media\/[0-9a-f]{32}\.(?:jpg|png|webp)$/.test(src);
export const visualVideoPath=(src:string)=>/^\/api\/cms\/video\/[0-9a-f]{32}\.mp4$/.test(src);
export function defaultVisualLibrary():CmsVisualLibrary{
  return {assets:[],placements:{
    hero:[],overviewMain:"",overviewInset:"",facilities:"",location:"",
    gallery:[],rooms:Object.fromEntries(roomConcepts.map(room=>[room.slug,{cover:"",gallery:[],video:""}]))
  }};
}
const text=(raw:unknown,max:number,name:string,empty=false):string=>{
  if(typeof raw!=="string"||raw.length>max||(!empty&&!raw.trim()))
    throw new Error(name+": invalid text");
  if(/[\u0000-\u001f]/.test(raw))throw new Error(name+": control characters not allowed");
  return raw.trim();
};
const verifiedRefs=(value:unknown,name:string,max:number,allowed:Set<string>,kind?:VisualKind):string[]=>{
  if(!Array.isArray(value)||value.length>max)throw new Error(name+": invalid media list");
  const seen=new Set<string>();
  return value.map((raw,i)=>{
    const src=text(raw,100,name+"."+i);
    if(!allowed.has(src)||seen.has(src))throw new Error(name+": invalid or duplicate asset");
    if(kind&&((kind==="image"&&!visualImagePath(src))||(kind==="video"&&!visualVideoPath(src))))
      throw new Error(name+": wrong asset type");
    seen.add(src);return src;
  });
};
export function normalizeVisualLibrary(raw:unknown):CmsVisualLibrary{
  // Existing V1 content remains valid and is never silently reset.
  if(raw===undefined)return defaultVisualLibrary();
  if(!raw||typeof raw!=="object")throw new Error("Invalid visual library");
  const input=raw as Record<string,unknown>;
  if(!Array.isArray(input.assets)||input.assets.length>160)throw new Error("Too many visual assets");
  const seen=new Set<string>();
  const assets:VisualAsset[]=input.assets.map((raw,i)=>{
    if(!raw||typeof raw!=="object")throw new Error("Invalid asset");
    const a=raw as Record<string,unknown>;
    const src=text(a.src,100,"asset.src");
    if(seen.has(src))throw new Error("Duplicate asset");
    seen.add(src);
    if(a.kind!=="image"&&a.kind!=="video")throw new Error("Invalid media type");
    const kind=a.kind as VisualKind;
    if(kind==="image"?!visualImagePath(src):!visualVideoPath(src))
      throw new Error("Asset must be an uploaded CMS media path");
    if(!visualCategories.includes(a.category as VisualCategory))
      throw new Error("Invalid media category");
    if(typeof a.approved!=="boolean")throw new Error("Invalid asset approval");
    const poster=a.poster===undefined?"":text(a.poster,100,"asset.poster",true);
    if(poster&&(!visualImagePath(poster)||kind!=="video"))
      throw new Error("Invalid video poster");
    return {
      src,kind,poster,approved:a.approved as boolean,
      title:text(a.title,100,"asset.title"),
      category:a.category as VisualCategory,
      altEn:text(a.altEn,160,"asset.altEn",true),
      altAr:text(a.altAr,160,"asset.altAr",true)
    };
  });
  const p=input.placements;
  if(!p||typeof p!=="object")throw new Error("Missing visual assignments");
  const placements=p as Record<string,unknown>;
  const allowed=new Set(assets.map(a=>a.src));
  const images=new Set(assets.filter(a=>a.kind==="image").map(a=>a.src));
  const videos=new Set(assets.filter(a=>a.kind==="video").map(a=>a.src));
  const single=(raw:unknown,name:string,kind:"image"|"video"="image")=>{
    const src=text(raw,100,name,true);
    if(src&&!(kind==="image"?images:videos).has(src))
      throw new Error(name+": choose a library "+kind);
    return src;
  };
  const roomMap=placements.rooms;
  if(!roomMap||typeof roomMap!=="object"||Array.isArray(roomMap))
    throw new Error("Invalid room media mapping");
  const rm=roomMap as Record<string,unknown>;
  const validSlugs=new Set(roomConcepts.map(x=>x.slug));
  if(Object.keys(rm).some(x=>!validSlugs.has(x)))throw new Error("Unknown room media key");
  const rooms:Record<string,VisualRoom>={};
  for(const concept of roomConcepts){
    const raw=rm[concept.slug]??{cover:"",gallery:[],video:""};
    if(!raw||typeof raw!=="object")throw new Error("Invalid room media");
    const entry=raw as Record<string,unknown>;
    rooms[concept.slug]={
      cover:single(entry.cover,"room.cover"),
      gallery:verifiedRefs(entry.gallery,"room.gallery",16,images,"image"),
      video:single(entry.video,"room.video","video")
    };
  }
  return {assets,placements:{
    hero:verifiedRefs(placements.hero,"hero",6,images,"image"),
    overviewMain:single(placements.overviewMain,"overview.main"),
    overviewInset:single(placements.overviewInset,"overview.inset"),
    facilities:single(placements.facilities,"facilities"),
    location:single(placements.location,"location"),
    gallery:verifiedRefs(placements.gallery,"gallery",100,allowed),
    rooms
  }};
}
export function approvedAsset(visual:CmsVisualLibrary,src:string):VisualAsset|undefined{
  const asset=visual.assets.find(item=>item.src===src);
  if(!asset?.approved||!asset.altEn||!asset.altAr)return undefined;
  return asset;
}
/** Exactly which referenced media is public, including posters for assigned videos. */
export function approvedPublishedPaths(visual:CmsVisualLibrary):Set<string>{
  const p=visual.placements;
  const refs=[
    ...p.hero,p.overviewMain,p.overviewInset,p.facilities,p.location,...p.gallery,
    ...Object.values(p.rooms).flatMap(r=>[r.cover,...r.gallery,r.video])
  ];
  const out=new Set<string>();
  for(const src of refs){
    const a=approvedAsset(visual,src);
    if(!a)continue;
    out.add(src);
    if(a.kind==="video"&&a.poster)out.add(a.poster);
  }
  return out;
}

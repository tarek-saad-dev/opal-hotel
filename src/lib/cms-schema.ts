import { getContent, type FacilityGroup, type Locale } from "@/lib/hotel-content";
import { defaultVisualLibrary,normalizeVisualLibrary,type CmsVisualLibrary } from "@/lib/cms-media";

export const cmsSectionIds=["overview","facilities","location","rooms","gallery","reviews","contact"] as const;
export type CmsSectionId=typeof cmsSectionIds[number];
export const mediaRoles=["exterior","garden","roomMain","roomSecondary","architecture","roomDetail"] as const;
export type CmsMediaRole=typeof mediaRoles[number];

export type CmsHeading={kicker:string;title:string;accent:string;description:string};
export type CmsLocale={
  hotelName:string;
  metaDescription:string;
  address:string;
  hero:CmsHeading;
  headings:Record<CmsSectionId,CmsHeading>;
  overview:string[];
  quick:string[];
  facilities:FacilityGroup[];
  attractions:{name:string;distance:string}[];
};
export type CmsPhoto={src:string;altEn:string;altAr:string;rightsConfirmed:boolean};
export type CmsHeroVideo={
  enabled:boolean;
  desktopSrc:string;
  mobileSrc:string;
  posterSrc:string;
  fullFilmSrc:string;
  heroApproved:boolean;
  filmApproved:boolean;
};
export const emptyCmsHeroVideo=():CmsHeroVideo=>({
  enabled:false,desktopSrc:"",mobileSrc:"",posterSrc:"",fullFilmSrc:"",
  heroApproved:false,filmApproved:false
});
export const isManagedVideoPath=(src:string):boolean=>
  /^\/api\/cms\/video\/[0-9a-f]{32}\.mp4$/.test(src);
export const hasApprovedCmsHeroVideo=(doc:CmsSite):boolean=>{
  const v=doc.media.video;
  return v.enabled&&v.heroApproved&&isManagedVideoPath(v.desktopSrc)
    &&isManagedImagePath(v.posterSrc)&&(!v.mobileSrc||isManagedVideoPath(v.mobileSrc));
};
export const hasApprovedCmsFullFilm=(doc:CmsSite):boolean=>
  doc.media.video.filmApproved&&isManagedVideoPath(doc.media.video.fullFilmSrc);
export type CmsSite={
  revision:number;
  updatedAt:string;
  locales:Record<Locale,CmsLocale>;
  sections:{id:CmsSectionId;visible:boolean}[];
  media:{logo:string;logoApproved:boolean;photos:Record<CmsMediaRole,CmsPhoto>;video:CmsHeroVideo;visual:CmsVisualLibrary};
};
const defaultHeadings:Record<Locale,Record<CmsSectionId,CmsHeading>>={
  en:{
    overview:{kicker:"THE OPAL EXPERIENCE",title:"Beyond a stay,",accent:"a feeling.",description:"A place to discover more slowly. Inspired by the textures, light and timeless atmosphere of Luxor."},
    facilities:{kicker:"CONSIDERED COMFORTS",title:"Little details.",accent:"Lasting impressions.",description:"Thoughtful touches and room to slow down."},
    location:{kicker:"A SENSE OF PLACE",title:"Rooted in",accent:"Luxor.",description:"Every journey begins somewhere. Discover the hotel's location."},
    rooms:{kicker:"THE ART OF REST",title:"Rooms to slow down.",accent:"Moments to stay.",description:"Editorial room concepts. Not confirmed inventory."},
    gallery:{kicker:"VISUAL JOURNAL",title:"A closer look.",accent:"Every angle.",description:"Illustrative visual inspiration until hotel assets are approved."},
    reviews:{kicker:"THE GUEST JOURNAL",title:"Some memories",accent:"deserve a story.",description:"A space to share memories. Reviews are not yet submitted."},
    contact:{kicker:"LET'S TALK",title:"Have a question?",accent:"Let's connect.",description:"Explore the future contact experience. Messages are not delivered."},
  },
  ar:{
    overview:{kicker:"تجربة أوبال",title:"وراء كل إقامة",accent:"حكاية.",description:"هنا تلتقي تفاصيل المكان بروح الأقصر."},
    facilities:{kicker:"راحة في كل تفصيلة",title:"تفاصيل بسيطة.",accent:"تفرق كتير.",description:"الراحة تبدأ من التفاصيل."},
    location:{kicker:"الموقع",title:"في قلب",accent:"الحكاية.",description:"اكتشف موقع الفندق وما حوله من معالم."},
    rooms:{kicker:"تجربة الغرف",title:"غرف للراحة.",accent:"لحظات بتفضل.",description:"تصورات تصميمية وليست مخزون غرف متاح للحجز."},
    gallery:{kicker:"نظرة أقرب",title:"جمال التفاصيل.",accent:"من كل زاوية.",description:"صور للإلهام البصري لحين اعتماد الصور الحقيقية."},
    reviews:{kicker:"كلمات تترك أثرًا",title:"بعض الذكريات",accent:"تستحق الحكاية.",description:"معاينة فقط، لم يتم تفعيل إرسال التقييمات."},
    contact:{kicker:"تواصل مع المكان",title:"عندك سؤال؟",accent:"خلّينا نتكلم.",description:"معاينة لتجربة التواصل ولم يتم تفعيل الإرسال."},
  }
};
const defaultHero:Record<Locale,CmsHeading>={
  en:{kicker:"A BOUTIQUE RETREAT IN THE HEART OF LUXOR",title:"Some places",accent:"stay with you.",description:"An intimate escape inspired by the warmth, texture and timeless spirit of Luxor."},
  ar:{kicker:"تجربة بوتيك مختلفة في قلب الأقصر",title:"لحظات تعيشها،",accent:"وحكايات تبقى.",description:"اكتشف هدوء المكان وروح العمارة المصرية في تجربة إقامة ذات طابع خاص."}
};
export function defaultCmsSite():CmsSite {
  const locale=(code:Locale):CmsLocale=>{
    const c=getContent(code);
    return {
      hotelName:c.hotelName,metaDescription:c.metaDescription,address:c.address,
      hero:{...defaultHero[code]},
      headings:Object.fromEntries(cmsSectionIds.map(id=>[id,{...defaultHeadings[code][id]}])) as Record<CmsSectionId,CmsHeading>,
      overview:[...c.overview],quick:[...c.quick],
      facilities:c.facilities.map(group=>({title:group.title,items:[...group.items]})),
      attractions:c.attractions.map(item=>({...item})),
    };
  };
  return {
    revision:0,updatedAt:"",locales:{en:locale("en"),ar:locale("ar")},
    sections:cmsSectionIds.map(id=>({id,visible:true})),
    media:{
      logo:"",logoApproved:false,video:emptyCmsHeroVideo(),visual:defaultVisualLibrary(),
      photos:Object.fromEntries(mediaRoles.map(id=>[id,{src:"",altEn:"",altAr:"",rightsConfirmed:false}])) as Record<CmsMediaRole,CmsPhoto>
    }
  };
}
/** The owner's verified logo may go live independently of the six-photo gate. */
export function hasApprovedCmsLogo(doc:CmsSite):boolean {
  return isManagedImagePath(doc.media.logo)&&doc.media.logoApproved;
}
export function hasCompleteCmsMedia(doc:CmsSite):boolean{
  return isManagedImagePath(doc.media.logo)&&doc.media.logoApproved&&mediaRoles.every(role=>{
    const p=doc.media.photos[role];
    return isManagedImagePath(p.src)&&p.rightsConfirmed&&Boolean(p.altEn.trim())&&Boolean(p.altAr.trim());
  });
}
export function isManagedImagePath(src:string):boolean {
  return /^\/api\/cms\/media\/[0-9a-f]{32}\.(?:webp|png|jpe?g)$/.test(src);
}
function cleanText(value:unknown,name:string,max:number,allowEmpty=false):string {
  if(typeof value!=="string")throw new Error(name+": expected text");
  const out=value.trim();
  if(out.length>max||(!allowEmpty&&!out))throw new Error(name+": text length is invalid");
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(out))throw new Error(name+": unsupported characters");
  return out;
}
function cleanArray(value:unknown,name:string,maxItems:number,maxChars:number):string[]{
  if(!Array.isArray(value)||value.length>maxItems)throw new Error(name+": invalid list");
  return value.map((item,i)=>cleanText(item,name+" "+i,maxChars));
}
function heading(value:unknown,name:string):CmsHeading {
  if(!value||typeof value!=="object")throw new Error(name+": missing heading");
  const h=value as Record<string,unknown>;
  return {
    kicker:cleanText(h.kicker,name+".kicker",110),
    title:cleanText(h.title,name+".title",110),
    accent:cleanText(h.accent,name+".accent",110),
    description:cleanText(h.description,name+".description",1000,true)
  };
}
/** Strict field-based validation prevents prototype surprises, HTML insertion
 * and adding reservation/URL fields outside the agreed CMS scope. */
export function validateCmsSite(input:unknown):CmsSite{
  if(!input||typeof input!=="object")throw new Error("Invalid CMS document");
  const d=input as Record<string,unknown>;
  if(!Number.isSafeInteger(d.revision)||Number(d.revision)<0)throw new Error("Invalid document revision");
  const locales=d.locales as Record<Locale,Record<string,unknown>>;
  if(!locales||typeof locales!=="object")throw new Error("Missing languages");
  const cleaned={} as Record<Locale,CmsLocale>;
  for(const code of ["en","ar"] as const){
    const c=locales[code];
    if(!c||typeof c!=="object")throw new Error(code+": missing content");
    const headings=c.headings as Record<CmsSectionId,unknown>;
    if(!headings||typeof headings!=="object")throw new Error(code+": missing section headings");
    const verifiedHeadings={} as Record<CmsSectionId,CmsHeading>;
    for(const id of cmsSectionIds)verifiedHeadings[id]=heading(headings[id],code+"."+id);
    if(!Array.isArray(c.facilities)||c.facilities.length>16)throw new Error(code+": invalid facilities");
    const facilities=c.facilities.map((group,i)=>{
      if(!group||typeof group!=="object")throw new Error("Invalid facility group");
      const g=group as Record<string,unknown>;
      return {title:cleanText(g.title,code+".facility"+i,100),items:cleanArray(g.items,code+".facility.items",35,100)};
    });
    if(!Array.isArray(c.attractions)||c.attractions.length>20)throw new Error(code+": invalid attractions");
    const attractions=c.attractions.map((item,i)=>{
      if(!item||typeof item!=="object")throw new Error("Invalid attraction");
      const a=item as Record<string,unknown>;
      return {name:cleanText(a.name,code+".attraction"+i,100),distance:cleanText(a.distance,code+".distance"+i,50)};
    });
    cleaned[code]={
      hotelName:cleanText(c.hotelName,code+".hotelName",130),
      metaDescription:cleanText(c.metaDescription,code+".metaDescription",300),
      address:cleanText(c.address,code+".address",260),
      hero:heading(c.hero,code+".hero"),headings:verifiedHeadings,
      overview:cleanArray(c.overview,code+".overview",8,1200),
      quick:cleanArray(c.quick,code+".quick",32,100),
      facilities,attractions
    };
  }
  if(!Array.isArray(d.sections)||d.sections.length!==cmsSectionIds.length)throw new Error("Invalid sections");
  const seen=new Set<string>();
  const sections=d.sections.map(item=>{
    if(!item||typeof item!=="object")throw new Error("Invalid section");
    const s=item as Record<string,unknown>;
    if(!cmsSectionIds.includes(s.id as CmsSectionId)||seen.has(s.id as string)||typeof s.visible!=="boolean")
      throw new Error("Invalid section ID or visibility");
    seen.add(s.id as string);
    return {id:s.id as CmsSectionId,visible:s.visible};
  });
  const media=d.media as Record<string,unknown>;
  if(!media||typeof media!=="object")throw new Error("Invalid media");
  const logo=cleanText(media.logo,"logo",100,true);
  if(logo&&!isManagedImagePath(logo))throw new Error("Logo must be a previously uploaded CMS image");
  if(typeof media.logoApproved!=="boolean")throw new Error("Invalid logo rights approval");
  const photosRaw=media.photos as Record<CmsMediaRole,Record<string,unknown>>;
  if(!photosRaw||typeof photosRaw!=="object")throw new Error("Invalid media photo slots");
  const photos={} as Record<CmsMediaRole,CmsPhoto>;
  for(const role of mediaRoles){
    const photo=photosRaw[role];
    if(!photo||typeof photo!=="object")throw new Error("Missing photo role "+role);
    const src=cleanText(photo.src,role+".src",100,true);
    if(src&&!isManagedImagePath(src))throw new Error(role+": not an uploaded CMS file");
    if(typeof photo.rightsConfirmed!=="boolean")throw new Error(role+": invalid rights status");
    photos[role]={src,altEn:cleanText(photo.altEn,role+".altEn",160,true),
      altAr:cleanText(photo.altAr,role+".altAr",160,true),rightsConfirmed:photo.rightsConfirmed};
  }
  // Older stored CMS snapshots have no video field. Load them safely without
  // migrating or resetting any existing owner content.
  const videoRaw=media.video===undefined?emptyCmsHeroVideo():media.video;
  if(!videoRaw||typeof videoRaw!=="object")throw new Error("Invalid hero video settings");
  const v=videoRaw as Record<string,unknown>;
  const desktopSrc=cleanText(v.desktopSrc,"video.desktopSrc",100,true);
  const mobileSrc=cleanText(v.mobileSrc,"video.mobileSrc",100,true);
  const posterSrc=cleanText(v.posterSrc,"video.posterSrc",100,true);
  const fullFilmSrc=cleanText(v.fullFilmSrc,"video.fullFilmSrc",100,true);
  if(desktopSrc&&!isManagedVideoPath(desktopSrc))throw new Error("Hero video must be an uploaded MP4");
  if(mobileSrc&&!isManagedVideoPath(mobileSrc))throw new Error("Mobile hero video must be an uploaded MP4");
  if(fullFilmSrc&&!isManagedVideoPath(fullFilmSrc))throw new Error("Full film must be an uploaded MP4");
  if(posterSrc&&!isManagedImagePath(posterSrc))throw new Error("Hero poster must be an uploaded image");
  if(typeof v.enabled!=="boolean"||typeof v.heroApproved!=="boolean"||typeof v.filmApproved!=="boolean")
    throw new Error("Invalid hero video approval");
  const video:CmsHeroVideo={enabled:v.enabled,desktopSrc,mobileSrc,posterSrc,fullFilmSrc,
    heroApproved:v.heroApproved,filmApproved:v.filmApproved};
  const visual=normalizeVisualLibrary(media.visual);
  return {revision:Number(d.revision),updatedAt:typeof d.updatedAt==="string"?d.updatedAt.slice(0,50):"",
    locales:cleaned,sections,media:{logo,logoApproved:media.logoApproved as boolean,photos,video,visual}};
}

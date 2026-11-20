"use client";

import { createContext,useContext,useMemo,type ReactNode } from "react";
import { defaultCmsSite,hasApprovedCmsLogo,hasCompleteCmsMedia,mediaRoles,type CmsSite } from "@/lib/cms-schema";
import { galleryImages,hotelBrand,officialMediaActive,type HotelImage } from "@/lib/gallery";
import { approvedAsset,visualAssetAlt } from "@/lib/cms-media";
import { roomConcepts } from "@/lib/room-concepts";
import { getContent,type HotelContent,type Locale } from "@/lib/hotel-content";

const CmsContext=createContext<CmsSite|null>(null);
const CmsPreviewContext=createContext(false);
export function CmsProvider({value,children,preview=false}:{value:CmsSite;children:ReactNode;preview?:boolean}){
  return <CmsPreviewContext.Provider value={preview}>
    <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
  </CmsPreviewContext.Provider>;
}
export function useCmsSite():CmsSite{
  return useContext(CmsContext)||defaultCmsSite();
}
export function useCmsContent(locale:Locale):HotelContent{
  const cms=useCmsSite();
  return useMemo(()=>{
    const old=getContent(locale),data=cms.locales[locale];
    return {...old,hotelName:data.hotelName,metaDescription:data.metaDescription,
      address:data.address,overview:data.overview,quick:data.quick,
      facilities:data.facilities,attractions:data.attractions};
  },[cms,locale]);
}
export function useHotelMedia(){
  const cms=useCmsSite();
  const preview=useContext(CmsPreviewContext);
  return useMemo(()=>{
    const ready=hasCompleteCmsMedia(cms);
    const images:HotelImage[]=ready
      ? mediaRoles.map(role=>{
          const p=cms.media.photos[role];
          return {src:p.src,alt:p.altEn,altAr:p.altAr,origin:"hotel-approved" as const};
        })
      :[...galleryImages];
    const categories=["exterior","pool","rooms","rooms","exterior","rooms"];
    const visual=cms.media.visual;
    const placed=visual.placements;
    // Private owner preview may inspect draft selections before public rights
    // confirmation. Uploaded bytes remain protected by the authenticated API.
    const lookup=(src:string)=>preview
      ?visual.assets.find(item=>item.src===src):approvedAsset(visual,src);
    const indexOf=(src:string):number|null=>{
      const asset=lookup(src);
      if(!asset||asset.kind!=="image")return null;
      const existing=images.findIndex(x=>x.src===src);
      if(existing>=0)return existing;
      images.push({src:asset.src,alt:visualAssetAlt(asset,"en"),altAr:visualAssetAlt(asset,"ar"),origin:"hotel-approved"});
      categories.push(asset.category);
      return images.length-1;
    };
    const resolve=(src:string,fallback:number):number=>indexOf(src)??fallback;
    const heroIndices=placed.hero.map(indexOf).filter((n):n is number=>n!==null);
    const galleryImagesIndices=placed.gallery.filter(src=>lookup(src)?.kind==="image")
      .map(indexOf).filter((n):n is number=>n!==null);
    const galleryVideos=placed.gallery.map(lookup)
      .filter((asset):asset is NonNullable<typeof asset>=>Boolean(asset&&asset.kind==="video"))
      .map(asset=>({
        src:asset.src,poster:asset.poster,title:asset.title,
        alt:visualAssetAlt(asset,"en"),altAr:visualAssetAlt(asset,"ar"),category:asset.category
      }));
    const overviewMovie=lookup(placed.overviewVideo);
    const overviewFilm=overviewMovie?.kind==="video" ? {
      src:overviewMovie.src,
      title:overviewMovie.title,
      poster:(overviewMovie.poster&&lookup(overviewMovie.poster)?.kind==="image")
        ?overviewMovie.poster:images[resolve(placed.overviewMain,4)]?.src||""
    }:null;
    const roomMedia=Object.fromEntries(roomConcepts.map(room=>{
      const assigned=placed.rooms[room.slug];
      const overrides=assigned?.gallery.map(indexOf).filter((n):n is number=>n!==null)??[];
      const cover=resolve(assigned?.cover||"",room.imageIndices[0]);
      const gallery=overrides.length?Array.from(new Set([cover,...overrides])):[...room.imageIndices];
      const movie=lookup(assigned?.video||"");
      return [room.slug,{cover,gallery,video:movie?.kind==="video"?movie:undefined}];
    })) as Record<string,{cover:number;gallery:number[];video?:ReturnType<typeof lookup>}>;
    return {
      images,
      imageCategories:categories,
      logoSrc:hasApprovedCmsLogo(cms)?cms.media.logo:hotelBrand.officialLogoSrc,
      approved:ready||officialMediaActive,
      overviewApproved:Boolean(placed.overviewMain&&placed.overviewInset
        &&approvedAsset(visual,placed.overviewMain)
        &&approvedAsset(visual,placed.overviewInset)),
      heroIndices:heroIndices.length?heroIndices:[0,1,2],
      // Only real hotel photos appear in the gallery; brand panels never do.
      galleryIndices:galleryImagesIndices.length||galleryVideos.length
        ?galleryImagesIndices
        :images.map((_,i)=>i).filter(i=>images[i].origin==="hotel-approved"),
      isReal:(index:number)=>images[index]?.origin==="hotel-approved",
      galleryVideos,
      overviewVideo:overviewFilm,
      overviewMain:resolve(placed.overviewMain,4),
      overviewInset:resolve(placed.overviewInset,1),
      facilitiesImage:indexOf(placed.facilities),
      locationImage:indexOf(placed.location),
      roomMedia
    };
  },[cms,preview]);
}

/** Published, visible sections that actually have something to show.
 * The gallery stays hidden until the hotel's own photos or films are placed. */
export function useVisibleSections(){
  const cms=useCmsSite();
  const media=useHotelMedia();
  const hasGallery=media.galleryIndices.some(index=>media.isReal(index))||media.galleryVideos.length>0;
  return cms.sections.filter(item=>item.visible&&(item.id!=="gallery"||hasGallery)).map(item=>item.id);
}

"use client";

import { createContext,useContext,useMemo,type ReactNode } from "react";
import { defaultCmsSite,hasApprovedCmsLogo,hasCompleteCmsMedia,mediaRoles,type CmsSite } from "@/lib/cms-schema";
import { galleryImages,hotelBrand,officialMediaActive,type HotelImage } from "@/lib/gallery";
import { getContent,type HotelContent,type Locale } from "@/lib/hotel-content";

const CmsContext=createContext<CmsSite|null>(null);
export function CmsProvider({value,children}:{value:CmsSite;children:ReactNode}){
  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
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
  return useMemo(()=>{
    const ready=hasCompleteCmsMedia(cms);
    const images:HotelImage[]=ready
      ? mediaRoles.map(role=>{
          const p=cms.media.photos[role];
          return {src:p.src,alt:p.altEn,altAr:p.altAr,origin:"hotel-approved" as const};
        })
      :galleryImages;
    return {
      images,logoSrc:hasApprovedCmsLogo(cms)?cms.media.logo:hotelBrand.officialLogoSrc,
      approved:ready||officialMediaActive,
    };
  },[cms]);
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isCmsAuthenticated } from "@/lib/cms-auth";
import { readDraft } from "@/lib/cms-store";
import { isLocale,getContent } from "@/lib/hotel-content";
import { CmsProvider } from "@/components/CmsProvider";
import { HotelExperience } from "@/components/HotelExperience";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Private CMS Preview | Opal Legacy",robots:{index:false,follow:false}};
export default async function PrivateCmsPreview({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(!isLocale(locale)||!await isCmsAuthenticated())notFound();
  const draft=await readDraft();
  return <CmsProvider value={draft}>
    <HotelExperience locale={locale} content={getContent(locale)}/>
  </CmsProvider>;
}

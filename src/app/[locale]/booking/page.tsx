import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingExperience } from "@/components/BookingExperience";
import { bookingCopy, parsePreviewParams } from "@/lib/booking-preview";
import { isLocale } from "@/lib/hotel-content";
import { readPublished } from "@/lib/cms-store";
import { CmsProvider } from "@/components/CmsProvider";
export const dynamic="force-dynamic";

type PageProps={
  params:Promise<{locale:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
};

export function generateStaticParams(){return [{locale:"en"},{locale:"ar"}];}

export async function generateMetadata({params}:Pick<PageProps,"params">):Promise<Metadata>{
  const {locale}=await params;
  if(!isLocale(locale))return {};
  const t=bookingCopy(locale);
  return {
    title:locale==="ar"?"معاينة رحلة الحجز | أوبال ليجاسي":"Booking Journey Preview | Opal Legacy",
    description:t.intro,
    alternates:{languages:{en:"/en/booking",ar:"/ar/booking"}},
    robots:{index:false,follow:false},
  };
}

export default async function BookingPage({params,searchParams}:PageProps){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  const input=parsePreviewParams(await searchParams);
  const published=await readPublished();
  return <CmsProvider value={published}><BookingExperience locale={locale} initial={input}/></CmsProvider>;
}

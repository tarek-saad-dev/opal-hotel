import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoolsideBooking } from "@/components/PoolsideBooking";
import { poolsideConfig } from "@/lib/poolside-config";
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
    title:locale==="ar"?"احجز إقامتك":"Book your stay",
    description:process.env.OPAL_BOOKING_ENABLED==="true"?(locale==="ar"?"احجز تجربتك في أوبال بولسايد":"Book your Opal Poolside experience"):t.intro,
    referrer:"no-referrer",
    alternates:{languages:{en:"/en/booking",ar:"/ar/booking"}},
    robots:{index:false,follow:false},
  };
}

export default async function BookingPage({params,searchParams}:PageProps){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  const query=await searchParams;
  const input=parsePreviewParams(query);
  const published=await readPublished();
  const {enabled,origin,gateway}=poolsideConfig();
  // Production cutover must not fall through to the retired booking-request API.
  if(process.env.OPAL_BOOKING_MAINTENANCE==="true")return <main className="opal-book-page"><div className="opal-book-summary"><span className="opal-book-eyebrow">OPAL POOLSIDE</span><h1>{locale==="ar"?"الحجز الإلكتروني غير متاح حاليًا":"Online booking is temporarily unavailable"}</h1><p>{locale==="ar"?"نعمل على تجهيز تجربة الحجز. يمكنك الرجوع للموقع والتواصل مع الفندق.":"We are preparing our online booking experience. Return to the website to contact the hotel."}</p><a className="opal-book-primary" href={`/${locale}#contact`}>{locale==="ar"?"تواصل مع الفندق":"Contact the hotel"}</a><a className="opal-book-back" href={`/${locale}`}>{locale==="ar"?"العودة للرئيسية":"Back to homepage"}</a></div></main>;
  if(enabled){
    if(!origin)return <main className="opal-book-page"><h1>{locale==="ar"?"الحجز غير متاح مؤقتًا":"Booking temporarily unavailable"}</h1><a href={`/${locale}`}>{locale==="ar"?"الرئيسية":"Home"}</a></main>;
    const reference=typeof query.reference==="string"?query.reference:"";
    return <CmsProvider value={published}><PoolsideBooking locale={locale} origin={origin} gateway={gateway} initial={input} reference={reference} product={query.product==="day_use"?"day_use":"bubble_stay"} slug={typeof query.slug==="string"?query.slug.slice(0,160):""}/></CmsProvider>;
  }
  return <CmsProvider value={published}><BookingExperience locale={locale} initial={input}/></CmsProvider>;
}

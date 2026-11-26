import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoolsideBooking } from "@/components/PoolsideBooking";
import { apiOrigin } from "@/lib/opal-api";
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
  if(process.env.OPAL_BOOKING_ENABLED==="true"){
    const raw=process.env.OPAL_API_BASE_URL||process.env.NEXT_PUBLIC_OPAL_API_BASE_URL||"";
    let origin="";
    try{origin=apiOrigin(raw);}catch{}
    const gateway=process.env.OPAL_PAYMENT_GATEWAY==="mock"?"mock":"paymob";
    // Mock is deliberately restricted to a loopback backend.
    const valid=origin&&(gateway!=="mock"||["localhost","127.0.0.1","[::1]"].includes(new URL(origin).hostname));
    if(!valid)return <main className="opal-book-page"><h1>{locale==="ar"?"الحجز غير متاح مؤقتًا":"Booking temporarily unavailable"}</h1><a href={`/${locale}`}>{locale==="ar"?"الرئيسية":"Home"}</a></main>;
    const reference=typeof query.reference==="string"?query.reference:"";
    return <CmsProvider value={published}><PoolsideBooking locale={locale} origin={origin} gateway={gateway} initial={input} reference={reference}/></CmsProvider>;
  }
  return <CmsProvider value={published}><BookingExperience locale={locale} initial={input}/></CmsProvider>;
}

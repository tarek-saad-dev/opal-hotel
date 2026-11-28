import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/hotel-content";
import { AgencyPortal } from "@/components/AgencyPortal";
import { CmsProvider } from "@/components/CmsProvider";
import { readPublished } from "@/lib/cms-store";
import { poolsideConnection } from "@/lib/opal-api";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Opal Poolside · Travel Agencies",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params;
 if(!isLocale(locale)||process.env.OPAL_AGENCY_ENABLED!=="true")notFound();
 const query=await searchParams;
 const reference=typeof query.reference==="string"?query.reference.slice(0,257):"";
 const {origin,gateway}=poolsideConnection(process.env.OPAL_API_BASE_URL||"",process.env.OPAL_PAYMENT_GATEWAY);
 if(!origin)return <main className="opal-book-page"><h1>{locale==="ar"?"بوابة الشركات غير متاحة مؤقتًا":"Agency portal temporarily unavailable"}</h1><a href={`/${locale}`}>{locale==="ar"?"الرئيسية":"Home"}</a></main>;
 return <CmsProvider value={await readPublished()}><AgencyPortal returnReference={reference} locale={locale} origin={origin} gateway={gateway}/></CmsProvider>;
}

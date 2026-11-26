import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/hotel-content";
import { AgencyPortal } from "@/components/AgencyPortal";
import { CmsProvider } from "@/components/CmsProvider";
import { readPublished } from "@/lib/cms-store";
import { apiOrigin } from "@/lib/opal-api";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Opal Poolside · Travel Agencies",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!isLocale(locale)||process.env.OPAL_AGENCY_ENABLED!=="true")notFound();
 let origin="";try{origin=apiOrigin(process.env.OPAL_API_BASE_URL||"");}catch{}
 return <CmsProvider value={await readPublished()}><AgencyPortal locale={locale} origin={origin} gateway={process.env.OPAL_PAYMENT_GATEWAY==="mock"&&origin&&["localhost","127.0.0.1","[::1]"].includes(new URL(origin).hostname)?"mock":"paymob"}/></CmsProvider>;
}

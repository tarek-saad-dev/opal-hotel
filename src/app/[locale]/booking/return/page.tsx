import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/hotel-content";
import { poolsideConfig } from "@/lib/poolside-config";
import { PoolsidePaymentReturn } from "@/components/PoolsidePaymentReturn";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Booking payment return",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale}=await params;
 if(!isLocale(locale)||!poolsideConfig().enabled)notFound();
 const query=await searchParams;
 return <PoolsidePaymentReturn locale={locale} reference={typeof query.reference==="string"?query.reference.slice(0,257):""}/>;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoolsideProductDetail } from "@/components/PoolsideProductDetail";
import { CmsProvider } from "@/components/CmsProvider";
import { isLocale } from "@/lib/hotel-content";
import { readPublished } from "@/lib/cms-store";
import { poolsideConfig } from "@/lib/poolside-config";
import { validProductSlug,productPath } from "@/lib/poolside-products";

export const dynamic="force-dynamic";
type Props={params:Promise<{locale:string;kind:string;slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {locale,kind,slug}=await params;
  if(!isLocale(locale)||!validProductSlug(slug)||!["day-use","overnight"].includes(kind))return {};
  const type=kind==="day-use"?"day_use":"bubble_stay";
  return {title:locale==="ar"?"تجارب أوبال بولسايد":"Opal Poolside experiences",alternates:{languages:{en:productPath("en",type,slug),ar:productPath("ar",type,slug)}},robots:{index:false,follow:true}};
}
export default async function Page({params}:Props){
  const {locale,kind,slug}=await params;
  const config=poolsideConfig();
  if(!isLocale(locale)||!config.enabled||!validProductSlug(slug)||!["day-use","overnight"].includes(kind))notFound();
  return <CmsProvider value={await readPublished()}><PoolsideProductDetail locale={locale} kind={kind==="day-use"?"day_use":"bubble_stay"} slug={slug} origin={config.origin}/></CmsProvider>;
}

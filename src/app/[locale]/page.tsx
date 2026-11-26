import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { poolsideConfig } from "@/lib/poolside-config";
import { HotelExperience } from "@/components/HotelExperience";
import { getContent, isLocale } from "@/lib/hotel-content";
import { readPublished } from "@/lib/cms-store";
import { CmsProvider } from "@/components/CmsProvider";
export const dynamic="force-dynamic";

export function generateStaticParams() { return [{ locale: "en" }, { locale: "ar" }]; }

export async function generateMetadata({params}: {params: Promise<{locale:string}>}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  const c = (await readPublished()).locales[locale];
  return { title: c.hotelName, description: c.metaDescription, alternates: { languages: {en:"/en", ar:"/ar"} } };
}

export default async function HotelPage({params}: {params: Promise<{locale:string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const published=await readPublished();
  return <CmsProvider value={published}><HotelExperience locale={locale} content={getContent(locale)} poolside={poolsideConfig()} /></CmsProvider>;
}

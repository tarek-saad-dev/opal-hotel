import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HotelExperience } from "@/components/HotelExperience";
import { getContent, isLocale } from "@/lib/hotel-content";
import { readPublished } from "@/lib/cms-store";

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
  return <HotelExperience locale={locale} content={getContent(locale)} />;
}

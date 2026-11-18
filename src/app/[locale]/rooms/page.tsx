import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomCollection } from "@/components/RoomsExperience";
import { isLocale } from "@/lib/hotel-content";
import { roomUI } from "@/lib/room-concepts";

type Props={params:Promise<{locale:string}>};
export function generateStaticParams(){return [{locale:"en"},{locale:"ar"}];}

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {locale}=await params;
  if(!isLocale(locale))return {};
  const t=roomUI(locale);
  return {
    title:locale==="ar"?"تصورات الغرف | أوبال ليجاسي":"Room Design Concepts | Opal Legacy",
    description:t.introduction,
    alternates:{languages:{en:"/en/rooms",ar:"/ar/rooms"}},
    robots:{index:false,follow:false},
  };
}

export default async function RoomsPage({params}:Props){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  return <RoomCollection locale={locale}/>;
}

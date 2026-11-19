import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomDetail } from "@/components/RoomsExperience";
import { isLocale } from "@/lib/hotel-content";
import { roomConcepts, getRoomConcept } from "@/lib/room-concepts";

type Props={params:Promise<{locale:string;slug:string}>};
// Unknown concept slugs must be rejected by routing itself with HTTP 404,
// not streamed as a soft-404 response after the dynamic CMS layout starts.
export const dynamicParams=false;
export function generateStaticParams(){
  return (["en","ar"] as const).flatMap(locale=>
    roomConcepts.map(concept=>({locale,slug:concept.slug})));
}

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {locale,slug}=await params;
  if(!isLocale(locale))return {};
  const concept=getRoomConcept(slug);
  if(!concept)return {};
  return {
    title:`${concept.name[locale]} | ${locale==="ar"?"تصور تصميمي":"Room Design Concept"} | Opal Legacy`,
    description:concept.introduction[locale],
    alternates:{languages:{en:`/en/rooms/${slug}`,ar:`/ar/rooms/${slug}`}},
    robots:{index:false,follow:false},
  };
}

export default async function RoomConceptPage({params}:Props){
  const {locale,slug}=await params;
  if(!isLocale(locale))notFound();
  const concept=getRoomConcept(slug);
  if(!concept)notFound();
  return <RoomDetail locale={locale} concept={concept}/>;
}

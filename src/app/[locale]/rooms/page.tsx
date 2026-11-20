import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/lib/hotel-content";

type Props={params:Promise<{locale:string}>};

/** Rooms are presented on the homepage; older links land on that section. */
export default async function RoomsPage({params}:Props){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  permanentRedirect(`/${locale}#rooms`);
}

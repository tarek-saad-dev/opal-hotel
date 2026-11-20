import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/lib/hotel-content";

type Props={params:Promise<{locale:string;slug:string}>};

/** The former room "concept" pages were retired; keep old links working. */
export default async function RoomConceptPage({params}:Props){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  permanentRedirect(`/${locale}#rooms`);
}

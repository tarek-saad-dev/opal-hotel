"use client";

import { usePathname } from "next/navigation";
import { OpalLoadingVisual } from "@/components/OpalLoadingVisual";

/** Next.js route suspense fallback uses the same premium animation as
 * the navigation indicator — no separate skeleton or forced timer. */
export default function LocaleLoading(){
  const pathname=usePathname();
  return <OpalLoadingVisual locale={pathname?.startsWith("/ar")?"ar":"en"}/>;
}

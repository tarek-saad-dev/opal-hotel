"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LocaleNotFound() {
  const path=usePathname();
  const locale=path?.startsWith("/ar")?"ar":"en";
  const ar=locale==="ar";
  return <main className="opal-recovery" id="recovery-main" dir={ar?"rtl":"ltr"} lang={locale}>
    <div className="opal-recovery-top"><span className="opal-recovery-brand">OPAL LEGACY</span><small>LUXOR · EGYPT</small></div>
    <div className="opal-recovery-body">
      <p className="opal-recovery-index">404 / {ar?"الصفحة غير موجودة":"PAGE NOT FOUND"}</p>
      <h1>{ar?"المكان ده":"This page"} <em>{ar?"مش موجود.":"isn't here."}</em></h1>
      <p>{ar?"العنوان اللي فتحته مش متاح. تقدر ترجع للرئيسية أو تحجز إقامتك.":"We couldn't find that address. Return to the homepage or book your stay."}</p>
      <div className="opal-recovery-actions">
        <Link href={`/${locale}`}>{ar?"العودة للرئيسية":"Back to homepage"} <span aria-hidden="true">↗</span></Link>
        <Link href={`/${locale}/booking`} className="is-secondary">{ar?"احجز إقامتك":"Book your stay"} <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
    <div className="opal-recovery-foot">OPAL LEGACY · LUXOR</div>
  </main>;
}

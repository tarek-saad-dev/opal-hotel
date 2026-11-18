"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LocaleError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  const path=usePathname();
  const locale=path?.startsWith("/ar")?"ar":"en";
  const ar=locale==="ar";
  return <main className="opal-recovery" id="recovery-main" dir={ar?"rtl":"ltr"} lang={locale}>
    <div className="opal-recovery-top"><span className="opal-recovery-brand">OPAL LEGACY</span><small>LUXOR · EGYPT</small></div>
    <div className="opal-recovery-body">
      <p className="opal-recovery-index">{ar?"تعذر تحميل الصفحة":"A TEMPORARY INTERRUPTION"}</p>
      <h1>{ar?"حصل خطأ":"Something"} <em>{ar?"غير متوقع.":"went wrong."}</em></h1>
      <p>{ar?"مقدرناش نعرض الصفحة دلوقتي. جرّب مرة تانية أو ارجع للرئيسية.":"We couldn't load this page. You can retry or return to the homepage."}</p>
      <div className="opal-recovery-actions">
        <button type="button" onClick={reset}>{ar?"إعادة المحاولة":"Try again"} <span aria-hidden="true">↗</span></button>
        <Link href={`/${locale}`} className="is-secondary">{ar?"العودة للرئيسية":"Back to homepage"} <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
    <div className="opal-recovery-foot">{ar?"لم يتم إرسال أو إنشاء أي حجز.":"No reservation has been submitted or created."}</div>
  </main>;
}

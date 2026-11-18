"use client";

import { usePathname } from "next/navigation";

export default function LocaleLoading() {
  const path=usePathname();
  const ar=path?.startsWith("/ar");
  return <div className="opal-route-loading" role="status" aria-live="polite" aria-busy="true">
    <div className="opal-route-loading-top">
      <span className="opal-route-loading-mark" aria-hidden="true">O</span>
      <span className="opal-route-loading-brand">OPAL LEGACY <small>LUXOR · EGYPT</small></span>
    </div>
    <div className="opal-route-loading-body">
      <div className="opal-route-loading-lines" aria-hidden="true"><span/><span/><span/></div>
      <span className="opal-route-loading-orbit" aria-hidden="true"/>
      <p>{ar?"جاري تجهيز التجربة…":"Preparing your experience…"}</p>
    </div>
  </div>;
}

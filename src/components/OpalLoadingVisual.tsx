"use client";

type Props={locale:"ar"|"en";overlay?:boolean};

/** Calm brand interlude for slow guest navigation and Next.js suspense.
 * No external images/fonts, fake progress numbers or artificial wait. */
export function OpalLoadingVisual({locale,overlay=false}:Props){
  const ar=locale==="ar";
  return <div
    className={`opal-route-loading${overlay?" is-overlay":""}`}
    role="status" aria-live="polite" aria-busy="true"
    aria-label={ar?"جاري فتح الصفحة":"Opening your page"}
    lang={ar?"ar":"en"} dir={ar?"rtl":"ltr"}>
    <div className="opal-loader-content">
      <div className="opal-loader-wordmark" aria-hidden="true" dir="ltr">OPAL LEGACY</div>
      <div className="opal-loader-place" aria-hidden="true" dir="ltr">LUXOR <span>·</span> EGYPT</div>
      <div className="opal-loader-progress" aria-hidden="true"><span/></div>
      <p className="opal-loader-message" aria-hidden="true">
        {ar?"جاري الانتقال…":"Just a moment…"}
      </p>
    </div>
  </div>;
}

"use client";

type Props={locale:"ar"|"en";overlay?:boolean};

/** One lightweight, image-free brand loader for route suspense and navigations.
 * Accessible name stays stable while the decorative lettering moves. */
export function OpalLoadingVisual({locale,overlay=false}:Props){
  const words=["OPAL","LEGACY"];
  const ar=locale==="ar";
  return <div
    className={`opal-route-loading${overlay?" is-overlay":""}`}
    role="status" aria-live="polite" aria-busy="true"
    aria-label={ar?"جاري فتح الصفحة":"Opening your page"}
    lang={ar?"ar":"en"} dir={ar?"rtl":"ltr"}>
    <div className="opal-loader-atmosphere" aria-hidden="true"/>
    <div className="opal-loader-content">
      <div className="opal-loader-emblem" aria-hidden="true">
        <span className="opal-loader-emblem-outline"/>
        <span className="opal-loader-emblem-letter">O</span>
      </div>
      <div className="opal-loader-wordmark" aria-hidden="true" dir="ltr">
        {words.map((word,wordIndex)=><span className="opal-loader-word" key={word}>
          {Array.from(word).map((character,index)=><span
            className="opal-loader-letter" key={`${word}-${index}`}
            style={{animationDelay:`${70+wordIndex*210+index*48}ms`}}>
            {character}
          </span>)}
        </span>)}
      </div>
      <div className="opal-loader-place" aria-hidden="true">LUXOR <span>✦</span> EGYPT</div>
      <div className="opal-loader-progress" aria-hidden="true"><span/></div>
      <p className="opal-loader-message" aria-hidden="true">
        {ar?"نجهّز لك تجربة أوبال":"Preparing your experience"}
        <span className="opal-loader-dots">…</span>
      </p>
    </div>
    <div className="opal-loader-corner opal-loader-corner-first" aria-hidden="true">OPAL LEGACY</div>
    <div className="opal-loader-corner opal-loader-corner-last" aria-hidden="true">A PLACE TO REMEMBER</div>
  </div>;
}

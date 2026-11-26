"use client";

import Link from "next/link";
import { useEffect,useState } from "react";
import { useHotelMedia } from "@/components/CmsProvider";
import { makeOpalApi,type DayUse,type Accommodation } from "@/lib/opal-api";
import type { Locale } from "@/lib/hotel-content";
import styles from "./poolside-catalog.module.css";

type Props={locale:Locale;origin:string;onOpenPhoto:(index:number)=>void};
export function PoolsideCatalog({locale,origin,onOpenPhoto}:Props){
  const ar=locale==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
  const media=useHotelMedia();
  const [days,setDays]=useState<DayUse[]>([]);
  const [stays,setStays]=useState<Accommodation[]>([]);
  const [state,setState]=useState<"loading"|"ready"|"error">("loading");
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!origin){setState("error");return;}
    const controller=new AbortController();
    setState("loading");
    const api=makeOpalApi(origin,locale);
    Promise.all([api.dayUse(controller.signal),api.accommodations(controller.signal)]).then(([d,s])=>{
      if(controller.signal.aborted)return;
      if(!Array.isArray(d)||!Array.isArray(s))throw new Error("Invalid catalog");
      setDays(d.filter(p=>p.is_active));setStays(s.filter(p=>p.is_active));setState("ready");
    }).catch(()=>{if(!controller.signal.aborted)setState("error");});
    return()=>controller.abort();
  },[locale,origin,retry]);
  const renderGroup=(kind:"day_use"|"bubble_stay",products:(DayUse|Accommodation)[])=>{
    const day=kind==="day_use";
    return <div className={styles.group}>
      <h3>{day?t("Day Use","الاستخدام اليومي"):t("Overnight Stay","إقامة ليلية")}</h3>
      {!products.length?<p>{t("No experiences available right now.","لا توجد تجارب متاحة حاليًا.")}</p>:<div className={styles.grid}>
        {products.map(p=>{
          const slug="slug" in p?p.slug:p.slug_en;
          const mapping=media.roomMedia[slug];
          const gallery=mapping?Array.from(new Set([mapping.cover,...mapping.gallery])).filter(i=>media.isReal(i)):[];
          const cover=gallery[0];
          const movie=mapping?.video;
          const title=ar?p.name_ar:p.name_en;
          const price="price_per_guest" in p?p.price_per_guest:p.price_per_night;
          const href=`/${locale}/booking?`+new URLSearchParams({product:kind,slug});
          return <article className={styles.card} key={slug}>
            {cover!==undefined?<button type="button" className={styles.photo} onClick={()=>onOpenPhoto(cover)} aria-label={t("View photo: ","عرض صورة: ")+title}>
              <img src={media.images[cover].src} alt={ar?media.images[cover].altAr:media.images[cover].alt} loading="lazy" width={640} height={400} onError={e=>{e.currentTarget.hidden=true;}}/>
            </button>:<div className={styles.placeholder} aria-hidden="true">OPAL <span>POOLSIDE</span></div>}
            <div className={styles.body}>
              <span className={styles.kicker}>{day?t("DAY EXPERIENCE","تجربة يومية"):t("OVERNIGHT EXPERIENCE","تجربة إقامة")}</span>
              <h4>{title}</h4>
              <p>{ar?p.description_ar:p.description_en}</p>
              {"max_guests" in p&&<p className={styles.capacity}>{t("Up to","حتى")} <b dir="ltr">{p.max_guests}</b> {t("guests per unit","ضيوف لكل وحدة")}</p>}
              {gallery.length>1&&<div className={styles.thumbs}>{gallery.slice(1,5).map(i=><button type="button" key={i} onClick={()=>onOpenPhoto(i)} aria-label={t("View photo","عرض الصورة")}><img loading="lazy" src={media.images[i].src} alt={ar?media.images[i].altAr:media.images[i].alt}/></button>)}</div>}
              {movie&&<video className={styles.video} src={movie.src} controls playsInline preload="none" aria-label={t("Experience video: ","فيديو التجربة: ")+title}/>}
              <div className={styles.bottom}><div><strong dir="ltr">{p.currency} {price}</strong><small>{day?t("per guest","للفرد"):t("per night","لليلة")}</small></div>
              <Link href={href} className={styles.cta}>{t("Book now","احجز الآن")} <span aria-hidden="true">↗</span></Link></div>
            </div>
          </article>;
        })}
      </div>}
    </div>;
  };
  return <div className={styles.wrap}>
    <span className={styles.kicker}>OPAL POOLSIDE · EXPERIENCES</span>
    <h2>{t("Make it your escape.","اختار تجربتك في أوبال.")}</h2>
    <p className={styles.intro}>{t("Spend the day or stay overnight. Explore current experiences and rates.","اقضِ يومك أو اختار إقامة ليلية. اكتشف التجارب والأسعار الحالية.")}</p>
    {state==="loading"?<p role="status">{t("Loading experiences…","جارٍ تحميل التجارب…")}</p>:state==="error"?<div role="alert"><p>{t("Experiences are temporarily unavailable. Please try again.","التجارب غير متاحة مؤقتًا. حاول مرة أخرى.")}</p><button type="button" className={styles.cta} onClick={()=>setRetry(v=>v+1)}>{t("Retry","إعادة المحاولة")}</button></div>:<>{renderGroup("day_use",days)}{renderGroup("bubble_stay",stays)}</>}
  </div>;
}

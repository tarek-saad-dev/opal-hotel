"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { useHotelMedia } from "@/components/CmsProvider";
import { makeOpalApi,OpalApiError } from "@/lib/opal-api";
import { bookingPath,productPath,productSlug,type ProductKind,type PoolsideProduct } from "@/lib/poolside-products";
import styles from "./poolside-detail.module.css";

export function PoolsideProductDetail({locale,kind,slug,origin}:{locale:"ar"|"en";kind:ProductKind;slug:string;origin:string}){
  const ar=locale==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
  const media=useHotelMedia();
  const [product,setProduct]=useState<PoolsideProduct|null>(null);
  const [state,setState]=useState<"loading"|"ready"|"missing"|"error">("loading");
  const [retry,setRetry]=useState(0);
  const [active,setActive]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setProduct(null);setState("loading");setActive(0);
    if(!origin){setState("error");return;}
    const api=makeOpalApi(origin,locale);
    // Day Use has no single-product endpoint. Resolve the exact stable slug
    // from the catalog, never from an assumed or translated identifier.
    const load=kind==="day_use"?api.dayUse(controller.signal).then(items=>items.find(p=>p.slug===slug)):api.accommodation(slug,controller.signal);
    load.then(item=>{
      if(controller.signal.aborted)return;
      if(!item?.is_active||productSlug(item)!==slug){setState("missing");return;}
      setProduct(item);setState("ready");
    }).catch(e=>{if(!controller.signal.aborted)setState(e instanceof OpalApiError&&e.status===404?"missing":"error");});
    return()=>controller.abort();
  },[locale,kind,slug,origin,retry]);
  const mapping=media.roomMedia[slug];
  const gallery=mapping?Array.from(new Set([mapping.cover,...mapping.gallery])).filter(i=>media.isReal(i)):[];
  const selected=gallery[active]??gallery[0];
  const day=kind==="day_use";
  return <div className={styles.page} dir={ar?"rtl":"ltr"} lang={locale}>
    <header className={styles.header}><Link href={`/${locale}`} className={styles.brand}>{media.logoSrc&&<img src={media.logoSrc} width={48} height={48} alt=""/>}<span>OPAL <small>POOLSIDE</small></span></Link><nav><Link href={`/${locale}#rooms`}>{t("All experiences","كل التجارب")}</Link><Link href={productPath(ar?"en":"ar",kind,slug)}>{ar?"English":"العربية"}</Link></nav></header>
    <main className={styles.main}>
      <Link className={styles.back} href={`/${locale}#rooms`}>{ar?"→":"←"} {t("Explore all experiences","استعرض كل التجارب")}</Link>
      {state==="loading"?<div className={styles.message} role="status">{t("Loading experience…","جارٍ تحميل التجربة…")}</div>:state==="missing"?<div className={styles.message}><h1>{t("Experience unavailable","التجربة غير متاحة")}</h1><p>{t("This experience is no longer available. Explore another option.","هذه التجربة غير متاحة حاليًا. اختر تجربة أخرى.")}</p></div>:state==="error"?<div className={styles.message} role="alert"><h1>{t("Unable to load experience","تعذر تحميل التجربة")}</h1><button className={styles.cta} type="button" onClick={()=>setRetry(v=>v+1)}>{t("Try again","حاول مرة أخرى")}</button></div>:product&&<>
        <div className={styles.hero}>
          <div className={styles.media}>
            {selected!==undefined?<img className={styles.cover} src={media.images[selected].src} alt={ar?media.images[selected].altAr:media.images[selected].alt} width={960} height={640} onError={e=>{e.currentTarget.hidden=true;}}/>:<div className={styles.brandPanel} aria-hidden="true">OPAL <small>POOLSIDE</small></div>}
            {gallery.length>1&&<div className={styles.thumbs}>{gallery.map((i,j)=><button key={i} type="button" aria-pressed={active===j} aria-label={t("Photo ","صورة ")+(j+1)} onClick={()=>setActive(j)}><img src={media.images[i].src} alt={ar?media.images[i].altAr:media.images[i].alt} loading="lazy" width={100} height={70}/></button>)}</div>}
          </div>
          <section className={styles.info}>
            <span className={styles.kicker}>{day?t("DAY EXPERIENCE","تجربة يومية"):t("OVERNIGHT STAY","إقامة ليلية")} · OPAL POOLSIDE</span>
            <h1>{ar?product.name_ar:product.name_en}</h1>
            <p>{ar?product.description_ar:product.description_en}</p>
            {"max_guests" in product&&<dl className={styles.spec}><div><dt>{t("Maximum guests per unit","الحد الأقصى للضيوف لكل وحدة")}</dt><dd dir="ltr">{product.max_guests}</dd></div></dl>}
            <div className={styles.rate}><span>{t("Current rate","السعر الحالي")}</span><strong dir="ltr">{product.currency} {"price_per_guest" in product?product.price_per_guest:product.price_per_night}</strong><small>{day?t("per guest","للفرد"):t("per unit, per night","للوحدة في الليلة")}</small></div>
            <Link className={styles.cta} href={bookingPath(locale,kind,slug)}>{t("Book this experience","احجز التجربة")} <span aria-hidden="true">↗</span></Link>
            <p className={styles.note}>{t("Final availability and total are confirmed during booking.","يتم تأكيد التوافر والإجمالي النهائي أثناء الحجز.")}</p>
          </section>
        </div>
        {mapping?.video&&<section className={styles.film}><h2>{t("Discover the experience","اكتشف التجربة")}</h2><video controls playsInline preload="none" src={mapping.video.src} aria-label={t("Experience video","فيديو التجربة")}/></section>}
      </>}
    </main>
    <footer className={styles.footer}>OPAL POOLSIDE · LUXOR, EGYPT</footer>
  </div>;
}

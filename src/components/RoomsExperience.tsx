"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import type { Locale } from "@/lib/hotel-content";
import { galleryImages, hotelBrand, responsivePhotoSrcSet } from "@/lib/gallery";
import { type RoomConcept, roomConcepts, roomUI } from "@/lib/room-concepts";

type ShellProps = { locale: Locale };

function ConceptPhoto({ index, eager = false, sizes = "(max-width: 700px) 100vw, 50vw" }: {
  index: number; eager?: boolean; sizes?: string;
}) {
  const photo = galleryImages[index];
  const handleFail = (event:SyntheticEvent<HTMLImageElement>) => {
    const img=event.currentTarget;
    if(img.dataset.placeholder==="true")return;
    img.dataset.placeholder="true";
    img.removeAttribute("srcset");
    img.src="/media/photo-placeholder.svg";
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="room-exp-image" src={photo.src} srcSet={responsivePhotoSrcSet(photo.src)}
      sizes={sizes} width={1400} height={1050} alt={photo.alt}
      decoding="async" loading={eager?"eager":"lazy"}
      fetchPriority={eager?"high":"auto"} onError={handleFail}/>
  );
}

function RoomHeader({locale}:ShellProps) {
  const t=roomUI(locale);
  return <header className="room-exp-header">
    <div className="room-exp-header-inner">
      <Link href={`/${locale}`} className="room-exp-brand" aria-label={t.backHome}>
        {hotelBrand.officialLogoSrc
          ? <ConceptBrandLogo src={hotelBrand.officialLogoSrc}/>
          : <span className="room-exp-monogram" aria-hidden="true">O</span>}
        <span><strong>OPAL LEGACY</strong><small>LUXOR · EGYPT</small></span>
      </Link>
      <nav className="room-exp-header-nav" aria-label={t.collection}>
        <Link href={`/${locale}/rooms`}>{t.all}</Link>
        <Link href={`/${locale}#booking`} className="room-exp-header-cta">{t.book}<span aria-hidden="true">↗</span></Link>
        <Link href={locale==="ar"?"/en/rooms":"/ar/rooms"} lang={locale==="ar"?"en":"ar"} hrefLang={locale==="ar"?"en":"ar"}
          className="room-exp-language">{t.language}</Link>
      </nav>
    </div>
  </header>;
}

function ConceptBrandLogo({src}:{src:string}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="room-exp-official-logo" src={src} alt="" width={48} height={48}/>;
}

function RoomFooter({locale}:ShellProps) {
  const t=roomUI(locale);
  return <footer className="room-exp-footer">
    <div className="room-exp-footer-inner">
      <div><strong>OPAL LEGACY</strong><span> LUXOR · EGYPT</span></div>
      <p>{t.notice}</p>
      <Link href={`/${locale}`}>{t.backHome}<span aria-hidden="true">↗</span></Link>
    </div>
  </footer>;
}

function ConceptBadge({locale}:ShellProps) {
  return <span className="room-exp-concept-badge">
    <span aria-hidden="true">✳</span>{locale==="ar"?"معاينة تصميمية فقط":"DESIGN CONCEPT ONLY"}
  </span>;
}

export function RoomCollection({locale}:ShellProps) {
  const t=roomUI(locale);
  return <>
    <a href="#room-main" className="opal-skip-link">{t.skip}</a>
    <RoomHeader locale={locale}/>
    <main className="room-exp-page room-exp-collection" id="room-main">
      <section className="room-exp-collection-hero">
        <div className="room-exp-hero-copy">
          <span className="room-exp-kicker">{t.collection} <span> / 03</span></span>
          <h1>{t.headline}<em>{t.italic}</em></h1>
          <p>{t.introduction}</p>
          <div className="room-exp-hero-bottom">
            <ConceptBadge locale={locale}/>
            <Link className="room-exp-back-link" href={`/${locale}`}>{t.backHome} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="room-exp-hero-media"><ConceptPhoto index={2} eager sizes="(max-width: 700px) 100vw, 48vw"/>
          <span className="room-exp-photo-number">01 / 03</span>
        </div>
      </section>
      <section className="room-exp-catalogue-section" aria-label={t.collection}>
        <div className="room-exp-section-top">
          <p className="room-exp-kicker">{t.preface}</p><span>01 — 03</span>
        </div>
        <div className="room-exp-catalogue-grid">
          {roomConcepts.map((concept,i)=><article className="room-exp-catalogue-card" key={concept.slug}>
            <Link href={`/${locale}/rooms/${concept.slug}`} className="room-exp-card-visual" aria-label={`${t.explore}: ${concept.name[locale]}`}>
              <ConceptPhoto index={concept.imageIndices[0]}/>
              <span className="room-exp-card-pill">{concept.label[locale]}</span>
              <span className="room-exp-card-arrow" aria-hidden="true">↗</span>
            </Link>
            <div className="room-exp-card-text">
              <span className="room-exp-card-index">{String(i+1).padStart(2,"0")} / 03</span>
              <h2><Link href={`/${locale}/rooms/${concept.slug}`}>{concept.name[locale]}</Link></h2>
              <p>{concept.introduction[locale]}</p>
              <Link href={`/${locale}/rooms/${concept.slug}`} className="room-exp-card-link">
                {t.explore} <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>)}
        </div>
      </section>
      <div className="room-exp-truth-note" role="note">
        <span className="room-exp-note-index">✳</span>
        <div><h2>{t.noteHeading}</h2><p>{t.notice}</p></div>
        <Link href={`/${locale}#booking`} className="room-exp-secondary-cta">{t.book} <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
    <RoomFooter locale={locale}/>
  </>;
}

function RoomPhotoExplorer({concept,locale}:{concept:RoomConcept;locale:Locale}) {
  const t=roomUI(locale);
  const [selected,setSelected]=useState(0);
  const [zoom,setZoom]=useState(false);
  const opener=useRef<HTMLButtonElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const total=concept.imageIndices.length;
  const move=(delta:number)=>setSelected(index=>(index+delta+total)%total);

  useEffect(()=>{
    if(!zoom)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus({preventScroll:true});
    const onKey=(e:globalThis.KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();setZoom(false);}
      else if(e.key==="ArrowRight"){e.preventDefault();move(1);}
      else if(e.key==="ArrowLeft"){e.preventDefault();move(-1);}
      else if(e.key==="Tab"){
        const elements=Array.from(document.querySelectorAll<HTMLButtonElement>(".room-exp-lightbox button"));
        const first=elements[0];const last=elements[elements.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    window.addEventListener("keydown",onKey);
    return()=>{
      document.body.style.overflow=previous;
      window.removeEventListener("keydown",onKey);
      opener.current?.focus({preventScroll:true});
    };
  },[zoom,total]);

  const onGalleryKey=(event:KeyboardEvent<HTMLDivElement>)=>{
    if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
    event.preventDefault();
    const next=(selected+(event.key==="ArrowRight"?1:-1)+total)%total;
    setSelected(next);
    const element=document.getElementById(`room-thumb-${concept.slug}-${next}`);
    element?.focus();
  };
  return <div className="room-exp-gallery">
    <div className="room-exp-gallery-main">
      <button className="room-exp-gallery-open" type="button" ref={opener}
        onClick={()=>setZoom(true)} aria-label={t.image+" "+(selected+1)+" "+t.of+" "+total}>
        <ConceptPhoto index={concept.imageIndices[selected]} eager sizes="(max-width: 800px) 100vw, 60vw"/>
        <span className="room-exp-gallery-zoom" aria-hidden="true">↗</span>
      </button>
      <div className="room-exp-gallery-counter" dir="ltr" aria-live="polite">{String(selected+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</div>
    </div>
    <div className="room-exp-gallery-bottom">
      <span className="room-exp-gallery-label">{t.perspectives}</span>
      <div className="room-exp-gallery-controls" role="group" aria-label={t.perspectives} onKeyDown={onGalleryKey}>
        {concept.imageIndices.map((image,index)=><button type="button" key={index}
          id={`room-thumb-${concept.slug}-${index}`} aria-label={`${t.image} ${index+1}`}
          aria-pressed={selected===index} className={selected===index?"is-selected":""}
          onClick={()=>setSelected(index)}><ConceptPhoto index={image}/></button>)}
      </div>
      <div className="room-exp-gallery-arrows">
        <button type="button" onClick={()=>move(-1)} aria-label={t.previous}>‹</button>
        <button type="button" onClick={()=>move(1)} aria-label={t.next}>›</button>
      </div>
    </div>
    {zoom&&<div className="room-exp-lightbox" role="dialog" aria-modal="true" aria-label={t.perspectives}>
      <button type="button" className="room-exp-lightbox-close" ref={closeRef}
        aria-label={locale==="ar"?"إغلاق الصورة":"Close image"} onClick={()=>setZoom(false)}>×</button>
      <button type="button" className="room-exp-lightbox-prev" aria-label={t.previous} onClick={()=>move(-1)}>‹</button>
      <div className="room-exp-lightbox-image"><ConceptPhoto index={concept.imageIndices[selected]} eager sizes="100vw"/>
        <p dir="ltr" aria-live="polite">{selected+1} / {total}</p></div>
      <button type="button" className="room-exp-lightbox-next" aria-label={t.next} onClick={()=>move(1)}>›</button>
    </div>}
  </div>;
}

export function RoomDetail({locale,concept}:{locale:Locale;concept:RoomConcept}) {
  const t=roomUI(locale);
  const others=roomConcepts.filter(item=>item.slug!==concept.slug);
  return <>
    <a href="#room-main" className="opal-skip-link">{t.skip}</a>
    <RoomHeader locale={locale}/>
    <main className="room-exp-page room-exp-detail" id="room-main">
      <nav className="room-exp-breadcrumb" aria-label={locale==="ar"?"مسار التنقل":"Breadcrumb"}>
        <Link href={`/${locale}`}>{t.brand}</Link><span aria-hidden="true">/</span>
        <Link href={`/${locale}/rooms`}>{t.collection}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{concept.name[locale]}</span>
      </nav>
      <section className="room-exp-detail-hero">
        <div className="room-exp-detail-heading">
          <p className="room-exp-kicker">{concept.label[locale]}</p>
          <h1>{concept.name[locale]}</h1>
          <p>{concept.introduction[locale]}</p>
          <ConceptBadge locale={locale}/>
        </div>
        <RoomPhotoExplorer concept={concept} locale={locale}/>
      </section>
      <section className="room-exp-detail-story" aria-labelledby="room-story-heading">
        <div>
          <span className="room-exp-kicker">{t.detail}</span>
          <h2 id="room-story-heading">{t.ideas}</h2>
        </div>
        <div className="room-exp-story-body">
          <p>{concept.story[locale]}</p>
          <ul>{concept.highlights[locale].map(item=><li key={item}><span aria-hidden="true">✳</span>{item}</li>)}</ul>
        </div>
      </section>
      <section className="room-exp-truth-note" role="note" aria-label={t.noteHeading}>
        <span className="room-exp-note-index">✳</span>
        <div><h2>{t.noteHeading}</h2><p>{t.notice}</p><p>{t.bookNote}</p></div>
        <Link href={`/${locale}#booking`} className="room-exp-secondary-cta">{t.book}<span aria-hidden="true">↗</span></Link>
      </section>
      <section className="room-exp-related">
        <div className="room-exp-related-heading"><h2>{t.other}</h2><Link href={`/${locale}/rooms`}>{t.all} <span aria-hidden="true">↗</span></Link></div>
        <div className="room-exp-related-grid">
          {others.map(room=><Link href={`/${locale}/rooms/${room.slug}`} className="room-exp-related-card" key={room.slug}>
            <div><ConceptPhoto index={room.imageIndices[0]}/></div>
            <span>{room.label[locale]}</span>
            <strong>{room.name[locale]}</strong>
            <span className="room-exp-related-arrow" aria-hidden="true">↗</span>
          </Link>)}
        </div>
      </section>
      <Link href={`/${locale}/rooms`} className="room-exp-back-bottom">← {t.back}</Link>
    </main>
    <RoomFooter locale={locale}/>
  </>;
}

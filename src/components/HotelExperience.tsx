"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRouteLoading } from "@/components/RouteLoadingProvider";
import type { SyntheticEvent } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { responsivePhotoSrcSet } from "@/lib/gallery";
import { useCmsSite,useCmsContent,useHotelMedia,useVisibleSections } from "@/components/CmsProvider";
import type { CmsSectionId } from "@/lib/cms-schema";
import { PremiumMasthead } from "@/components/PremiumMasthead";
import { PremiumStory, PremiumFacilities, PremiumLocation, PremiumRooms, PremiumGallery } from "@/components/PremiumSections";
import { PremiumReviews, PremiumContact, PremiumFooter } from "@/components/PremiumClosing";

type Props={locale:Locale;content:HotelContent};
function handleImageError(event:SyntheticEvent<HTMLImageElement>) {
  const img=event.currentTarget;
  if(img.dataset.placeholder==="true") return;
  // Don't show the browser broken-image glyph while the hotel's approved assets are pending.
  img.dataset.placeholder="true";
  img.removeAttribute("srcset");
  img.src="/media/photo-placeholder.svg";
}
export function HotelExperience({locale,content:baseContent}:Props) {
  const router=useRouter();
  const {startNavigation}=useRouteLoading();
  const c=useCmsContent(locale);
  const cms=useCmsSite();
  const media=useHotelMedia();
  const galleryImages=media.images;
  const visibleSections=new Set(useVisibleSections());
  // The lightbox only steps through the hotel's real photos.
  const realPhotos=galleryImages.map((_,i)=>i).filter(i=>media.isReal(i));
  const step=(from:number,delta:number)=>{
    const at=realPhotos.indexOf(from);
    if(at<0||!realPhotos.length)return from;
    return realPhotos[(at+delta+realPhotos.length)%realPhotos.length];
  };
  const [photo,setPhoto]=useState<number|null>(null);
  const focusBeforePhoto=useRef<HTMLElement|null>(null);
  const photoWasOpen=useRef(false);
  const lightboxRef=useRef<HTMLDivElement>(null);
  const openPhoto=(index:number)=>{
    if(!media.isReal(index))return;
    focusBeforePhoto.current=document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPhoto(index);
  };

  useEffect(() => {
    // SSR images may fail before React hydration attaches onError handlers.
    // Catch those missed failures to prevent broken-image icons in any viewport.
    const swapFailedImages = () => {
      document.querySelectorAll<HTMLImageElement>('.opal-story-media img,.opal-gallery-mosaic img,.opal-room-photo img,.lightbox-body img')
        .forEach(img => {
          if(img.complete && img.naturalWidth===0 && img.dataset.placeholder!=="true") {
            img.dataset.placeholder="true";
            img.removeAttribute("srcset");
            img.src="/media/photo-placeholder.svg";
          }
        });
    };
    swapFailedImages();
    const watcher = new MutationObserver(swapFailedImages);
    watcher.observe(document.body,{childList:true,subtree:true});
    return () => watcher.disconnect();
  }, []);

  useEffect(() => {
    // Progressive enhancement: without JS every section remains fully visible.
    // Observe for subtle, one-time entrance effects. No hidden default state.
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    document.querySelectorAll(".opal-reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(()=>{
    if (photo===null && photoWasOpen.current) {
      focusBeforePhoto.current?.focus({preventScroll:true});
      photoWasOpen.current=false;
    } else if(photo!==null) {
      photoWasOpen.current=true;
    }
  },[photo]);

  useEffect(()=>{
    if(photo===null)return;
    const handler=(e:KeyboardEvent)=>{
      if(e.key==="Escape")setPhoto(null);
      else if(e.key==="Tab"){
        const buttons=Array.from(lightboxRef.current?.querySelectorAll<HTMLButtonElement>("button") || []);
        const current=buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (buttons.length>0) {
          if (e.shiftKey && (current===0 || current===-1)){
            e.preventDefault();
            buttons[buttons.length-1].focus();
          }else if (!e.shiftKey && current===buttons.length-1){
            e.preventDefault();
            buttons[0].focus();
          }
        }
      }
      else if(e.key==="ArrowRight")setPhoto(v=>v===null?null:step(v,1));
      else if(e.key==="ArrowLeft")setPhoto(v=>v===null?null:step(v,-1));
    };
    window.addEventListener("keydown",handler);
    const old=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{window.removeEventListener("keydown",handler);document.body.style.overflow=old;};
  },[photo]);


  return (
    <>
      <PremiumMasthead locale={locale} content={c}
        onOpenGallery={() => { if(realPhotos.length)openPhoto(realPhotos[0]); }}
        onAvailability={({checkin,checkout,adults,children}) => {
          const params=new URLSearchParams({
            checkin, checkout, adults:String(adults), children:String(children),
          });
          startNavigation();
          router.push(`/${locale}/booking?${params.toString()}`);
        }}
      />
      <main>
        {cms.sections.filter(section=>visibleSections.has(section.id)).map(section=>{
          const id:CmsSectionId=section.id;
          if(id==="overview")return <section key={id} className="opal-stage-section opal-stage-story" id="overview" aria-label={c.labels.overviewTitle}>
            <PremiumStory locale={locale} content={c} onOpenPhoto={openPhoto}/>
          </section>;
          if(id==="facilities")return <section key={id} className="opal-stage-section opal-stage-facilities" id="facilities" aria-label={c.labels.facilitiesTitle}>
            <PremiumFacilities locale={locale} content={c}/>
          </section>;
          if(id==="location")return <section key={id} className="opal-stage-section opal-stage-location" id="location" aria-label={c.labels.locationTitle}>
            <PremiumLocation locale={locale} content={c}/>
          </section>;
          if(id==="rooms")return <section key={id} className="opal-stage-section opal-stage-rooms" id="rooms" aria-label={c.labels.roomsTitle}>
            <PremiumRooms locale={locale} content={c} onOpenPhoto={openPhoto}/>
          </section>;
          if(id==="gallery")return <section key={id} className="opal-stage-section opal-stage-gallery" id="gallery" aria-label={c.nav.gallery}>
            <PremiumGallery locale={locale} content={c} onOpenPhoto={openPhoto}/>
          </section>;
          if(id==="reviews")return <section key={id} className="opal-stage-section opal-stage-reviews" id="reviews" aria-labelledby="reviews-heading">
            <PremiumReviews locale={locale} content={c}/>
          </section>;
          return <section key={id} className="opal-stage-section opal-stage-contact" id="contact" aria-labelledby="contact-heading">
            <PremiumContact locale={locale} content={c}/>
          </section>;
        })}
      </main>

      <footer className="opal-end-footer">
        <PremiumFooter locale={locale} content={c}/>
      </footer>

      {photo!==null&&<div className="lightbox" ref={lightboxRef} role="dialog" aria-modal="true" aria-label={c.nav.gallery} onClick={()=>setPhoto(null)}>
        <button type="button" className="lightbox-close" autoFocus onClick={()=>setPhoto(null)} aria-label={c.labels.close}><span aria-hidden="true">×</span></button>
        <button type="button" className="lightbox-prev" onClick={e=>{e.stopPropagation();setPhoto(step(photo,-1))}} aria-label={c.labels.previous}>‹</button>
        <div className="lightbox-body" onClick={e=>e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryImages[photo].src} srcSet={responsivePhotoSrcSet(galleryImages[photo].src)}
            sizes="100vw" width={1200} height={900} decoding="async"
            alt={locale==="ar"?galleryImages[photo].altAr:galleryImages[photo].alt} onError={handleImageError}/>
          <p className="lightbox-counter" dir="ltr">{realPhotos.indexOf(photo)+1} / {realPhotos.length}</p>
        </div>
        <button type="button" className="lightbox-next" onClick={e=>{e.stopPropagation();setPhoto(step(photo,1))}} aria-label={c.labels.next}>›</button>
      </div>}
    </>
  );
}

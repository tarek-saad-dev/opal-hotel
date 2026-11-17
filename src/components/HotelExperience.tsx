"use client";

import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { galleryImages } from "@/lib/gallery";
import { PremiumMasthead } from "@/components/PremiumMasthead";
import { PremiumStory, PremiumFacilities, PremiumLocation, PremiumRooms, PremiumGallery } from "@/components/PremiumSections";
import { PremiumReviews, PremiumContact, PremiumFooter } from "@/components/PremiumClosing";

type Props={locale:Locale;content:HotelContent};
function handleImageError(event:SyntheticEvent<HTMLImageElement>) {
  const img=event.currentTarget;
  if(img.dataset.placeholder==="true") return;
  // Don't show the browser broken-image glyph while the hotel's approved assets are pending.
  img.dataset.placeholder="true";
  img.src="/media/photo-placeholder.svg";
}
export function HotelExperience({locale,content:c}:Props) {
  const [photo,setPhoto]=useState<number|null>(null);
  const [checkin,setCheckin]=useState("");
  const [checkout,setCheckout]=useState("");
  const [attemptedBooking,setAttemptedBooking]=useState(false);

  useEffect(() => {
    // SSR images may fail before React hydration attaches onError handlers.
    // Catch those missed failures to prevent broken-image icons in any viewport.
    const swapFailedImages = () => {
      document.querySelectorAll<HTMLImageElement>('.opal-story-media img,.opal-gallery-mosaic img,.opal-room-photo img,.lightbox-body img')
        .forEach(img => {
          if(img.complete && img.naturalWidth===0 && img.dataset.placeholder!=="true") {
            img.dataset.placeholder="true";
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
    if(photo===null)return;
    const handler=(e:KeyboardEvent)=>{
      if(e.key==="Escape")setPhoto(null);
      else if(e.key==="ArrowRight")setPhoto(v=>v===null?null:(v+1)%galleryImages.length);
      else if(e.key==="ArrowLeft")setPhoto(v=>v===null?null:(v-1+galleryImages.length)%galleryImages.length);
    };
    window.addEventListener("keydown",handler);
    const old=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{window.removeEventListener("keydown",handler);document.body.style.overflow=old;};
  },[photo]);


  return (
    <>
      <PremiumMasthead locale={locale} content={c}
        onOpenGallery={() => setPhoto(0)}
        onAvailability={({checkin,checkout}) => {
          setCheckin(checkin);
          setCheckout(checkout);
          setAttemptedBooking(true);
          document.getElementById("rooms")?.scrollIntoView({behavior:"smooth"});
        }}
      />
      <main>
        <section className="opal-stage-section opal-stage-story" id="overview" aria-label={c.labels.overviewTitle}>
          <PremiumStory locale={locale} content={c} onOpenPhoto={setPhoto}/>
        </section>
        <section className="opal-stage-section opal-stage-facilities" id="facilities" aria-label={c.labels.facilitiesTitle}>
          <PremiumFacilities locale={locale} content={c}/>
        </section>
        <section className="opal-stage-section opal-stage-location" id="location" aria-label={c.labels.locationTitle}>
          <PremiumLocation locale={locale} content={c}/>
        </section>
        <section className="opal-stage-section opal-stage-rooms" id="rooms" aria-label={c.labels.roomsTitle}>
          <PremiumRooms locale={locale} content={c} onOpenPhoto={setPhoto}
            attemptedBooking={attemptedBooking} checkin={checkin} checkout={checkout}/>
        </section>
        <section className="opal-stage-section opal-stage-gallery" id="gallery" aria-label={c.nav.gallery}>
          <PremiumGallery locale={locale} content={c} onOpenPhoto={setPhoto}/>
        </section>

        <section className="opal-stage-section opal-stage-reviews" id="reviews" aria-labelledby="reviews-heading">
          <PremiumReviews locale={locale} content={c}/>
        </section>
        <section className="opal-stage-section opal-stage-contact" id="contact" aria-labelledby="contact-heading">
          <PremiumContact locale={locale} content={c}/>
        </section>
      </main>

      <footer className="opal-end-footer">
        <PremiumFooter locale={locale} content={c}/>
      </footer>

      {photo!==null&&<div className="lightbox" role="dialog" aria-modal="true" aria-label={c.nav.gallery} onClick={()=>setPhoto(null)}>
        <button type="button" className="lightbox-close" autoFocus onClick={()=>setPhoto(null)} aria-label={c.labels.close}><Icon name="close"/></button>
        <button type="button" className="lightbox-prev" onClick={e=>{e.stopPropagation();setPhoto((photo-1+galleryImages.length)%galleryImages.length)}} aria-label={c.labels.previous}>‹</button>
        <div className="lightbox-body" onClick={e=>e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryImages[photo].src} alt={galleryImages[photo].alt} onError={handleImageError}/>
          <p className="lightbox-counter" dir="ltr">{photo+1} / {galleryImages.length}</p>
        </div>
        <button type="button" className="lightbox-next" onClick={e=>{e.stopPropagation();setPhoto((photo+1)%galleryImages.length)}} aria-label={c.labels.next}>›</button>
      </div>}
    </>
  );
}

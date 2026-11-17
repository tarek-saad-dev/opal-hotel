"use client";

import { useEffect, useState } from "react";
import type { FormEvent, SyntheticEvent } from "react";
import Link from "next/link";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { galleryImages } from "@/lib/gallery";

type Props={locale:Locale;content:HotelContent};
function handleImageError(event:SyntheticEvent<HTMLImageElement>) {
  const img=event.currentTarget;
  if(img.dataset.placeholder==="true") return;
  // Don't show the browser broken-image glyph while the hotel's approved assets are pending.
  img.dataset.placeholder="true";
  img.src="/media/photo-placeholder.svg";
}
const anchors=["overview","facilities","location","rooms","gallery","reviews","contact"] as const;
type Anchor=(typeof anchors)[number];

function isoDate(d:Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function tomorrow() {
  const d=new Date();d.setDate(d.getDate()+1);return isoDate(d);
}
function nextDay(value:string) {
  const [y,m,d]=value.split("-").map(Number);
  const v=new Date(y,m-1,d);v.setDate(v.getDate()+1);return isoDate(v);
}
function Icon({name}:{name:"map"|"arrow"|"close"|"menu"|"calendar"|"image"}) {
  const icons={
    map:<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></>,
    arrow:<><path d="m5 12 14 0m-6-6 6 6-6 6"/></>,
    close:<><path d="M5 5 19 19M19 5 5 19"/></>,
    menu:<><path d="M3 6h18M3 12h18M3 18h18"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    image:<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden="true">{icons[name]}</svg>;
}

export function HotelExperience({locale,content:c}:Props) {
  const [menuOpen,setMenuOpen]=useState(false);
  const [photo,setPhoto]=useState<number|null>(null);
  const [checkin,setCheckin]=useState("");
  const [checkout,setCheckout]=useState("");
  const [dateWarning,setDateWarning]=useState(false);
  const [attemptedBooking,setAttemptedBooking]=useState(false);
  const [formStatus,setFormStatus]=useState<""|"contact"|"review">("");
  const [rating,setRating]=useState("8");
  const [today,setToday]=useState("");

  useEffect(()=> {
    const initial=tomorrow();
    setToday(isoDate(new Date()));
    setCheckin(v=>v||initial);
    setCheckout(v=>v||nextDay(initial));
  },[]);

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

  const search=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    setDateWarning(!checkin||!checkout||checkout<=checkin);
    setAttemptedBooking(Boolean(checkin&&checkout&&checkout>checkin));
    if(checkin&&checkout&&checkout>checkin)document.getElementById("rooms")?.scrollIntoView({behavior:"smooth"});
  };

  const navEntries=anchors.map(id=>({id,label:c.nav[id]}));
  const booking=<form className="booking-form" onSubmit={search}>
    <div className="date-field">
      <label htmlFor="arrival">{c.labels.checkin}</label>
      <div className="date-input-wrap"><Icon name="calendar"/>
        <input required id="arrival" type="date" min={today||undefined} value={checkin} onChange={e=>{
          const value=e.target.value;setCheckin(value);setDateWarning(false);setAttemptedBooking(false);
          if(checkout&&checkout<=value)setCheckout(nextDay(value));
        }}/>
      </div>
    </div>
    <div className="date-field">
      <label htmlFor="departure">{c.labels.checkout}</label>
      <div className="date-input-wrap"><Icon name="calendar"/>
        <input required id="departure" type="date" min={checkin?nextDay(checkin):today||undefined} value={checkout}
          onChange={e=>{setCheckout(e.target.value);setDateWarning(false);setAttemptedBooking(false);}}/>
      </div>
    </div>
    <button className="primary-button" type="submit">{c.labels.availability}<Icon name="arrow"/></button>
    {dateWarning&&<p className="form-warning" role="alert">{c.labels.dateError}</p>}
  </form>;

  return (
    <>
      <header className="site-header" id="top">
        <div className="header-inner container">
          <Link href={`/${locale}`} className="wordmark" aria-label="Opal Legacy Hotel home">
            <span className="wordmark-small">HOTEL</span><span>OPAL LEGACY</span>
          </Link>
          <div className="header-actions">
            <nav className="desktop-nav" aria-label={c.labels.menu}>
              {navEntries.slice(0,5).map(n=><a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
            </nav>
            <span className="currency" title="Currency selection available after booking integration">GBP</span>
            <Link className="language-toggle" href={locale==="en"?"/ar":"/en"} lang={locale==="en"?"ar":"en"} hrefLang={locale==="en"?"ar":"en"}>{locale==="en"?"العربية":"English"}</Link>
            <button type="button" aria-label={menuOpen?c.labels.close:c.labels.menu} aria-expanded={menuOpen}
              aria-controls="mobile-navigation" className="menu-button" onClick={()=>setMenuOpen(v=>!v)}>
              <Icon name={menuOpen?"close":"menu"}/><span>{menuOpen?c.labels.close:c.labels.menu}</span>
            </button>
          </div>
        </div>
        {menuOpen&&<nav className="mobile-navigation" id="mobile-navigation" aria-label={c.labels.menu}>
          {navEntries.map(n=><a href={`#${n.id}`} key={n.id} onClick={()=>setMenuOpen(false)}>{n.label}</a>)}
        </nav>}
      </header>

      <main>
        <section className="hotel-intro container" aria-labelledby="hotel-name">
          <div className="hotel-heading">
            <div><p className="eyebrow">{locale==="ar"?"الأقصر، مصر":"LUXOR · EGYPT"}</p>
              <h1 id="hotel-name">{c.hotelName}</h1>
              <p className="address"><Icon name="map"/>{c.address}
                <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=Opal+Legacy+Luxor+Hotel">{c.labels.map}</a></p>
            </div>
          </div>

          <div className="hero-gallery" aria-label={c.nav.gallery}>
            {galleryImages.slice(0,5).map((img,index)=><button type="button" key={img.src}
              className={index===0?"hero-image hero-main":"hero-image"}
              aria-label={`${c.labels.galleryView} ${index+1}`} onClick={()=>setPhoto(index)}>
              {/* External reference photos must be replaced with approved hotel-owned assets before production. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} loading={index===0?"eager":"lazy"} onError={handleImageError}/>
              {index===4&&<span className="image-count">{c.labels.viewAll} · {galleryImages.length}</span>}
            </button>)}
          </div>
        </section>

        <section className="booking-band" aria-labelledby="booking-heading">
          <div className="container">
            <h2 id="booking-heading" className="booking-heading">{c.labels.bookingTitle}</h2>
            {booking}
          </div>
        </section>

        <section className="content-section container" id="overview" aria-labelledby="overview-heading">
          <h2 id="overview-heading">{c.labels.overviewTitle}</h2>
          <div className="quick-facilities">
            {c.quick.map((item,index)=><div className="quick-item" key={item}>
              <span className="quick-dot" aria-hidden="true">{["⌁","◷","↗","♞","✈","◌","♧","♿"][index]}</span>{item}
            </div>)}
          </div>
          <div className="overview-copy">{c.overview.map(p=><p key={p}>{p}</p>)}</div>
        </section>

        <section className="content-section muted-section" id="facilities" aria-labelledby="facilities-heading">
          <div className="container">
            <h2 id="facilities-heading">{c.labels.facilitiesTitle}</h2>
            <div className="facility-grid">
              {c.facilities.map(group=><div key={group.title} className="facility-group">
                <h3>{group.title}</h3><ul>{group.items.map(item=><li key={item}>{item}</li>)}</ul>
              </div>)}
            </div>
            <div className="policies"><h3>{c.labels.important}</h3><p>{c.labels.checkinPolicy}</p><p>{c.labels.checkoutPolicy}</p></div>
          </div>
        </section>

        <section className="content-section container" id="location" aria-labelledby="location-heading">
          <h2 id="location-heading">{c.labels.locationTitle}</h2>
          <div className="location-grid">
            <div className="location-map">
              <iframe title={c.labels.locationTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Opal%20Legacy%20Luxor%20Hotel&output=embed"/>
              <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=Opal+Legacy+Luxor+Hotel">{c.labels.map} ↗</a>
            </div>
            <div className="attractions"><h3>{c.labels.nearby}</h3><ul>
              {c.attractions.map(a=><li key={a.name}><span>{a.name}</span><strong>{a.distance}</strong></li>)}
            </ul></div>
          </div>
        </section>

        <section className="content-section muted-section" id="rooms" aria-labelledby="rooms-heading">
          <div className="container">
            <h2 id="rooms-heading">{c.labels.roomsTitle}</h2>
            <div className="rooms-empty">
              <Icon name="calendar"/>
              <p>{attemptedBooking?c.labels.noBooking:c.labels.noDates}</p>
              {attemptedBooking&&<p className="selected-dates" dir="ltr">{checkin} — {checkout}</p>}
            </div>
          </div>
        </section>

        <section className="content-section container" id="gallery" aria-labelledby="gallery-heading">
          <h2 id="gallery-heading">{c.nav.gallery}</h2>
          <div className="gallery-grid">
            {galleryImages.map((img,index)=><button type="button" className="gallery-tile" key={img.src}
              onClick={()=>setPhoto(index)} aria-label={`${c.labels.galleryView} ${index+1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} loading="lazy" onError={handleImageError}/>
            </button>)}
          </div>
        </section>

        <section className="content-section muted-section" id="reviews" aria-labelledby="reviews-heading">
          <div className="container form-section">
            <h2 id="reviews-heading">{c.labels.reviewsTitle}</h2>
            <form className="simple-form" onSubmit={e=>{e.preventDefault();setFormStatus("review");}}>
              <div className="form-row">
                <label>{c.labels.name}<input required name="guestName" autoComplete="name"/></label>
                <label>{c.labels.email}<input required type="email" name="guestEmail" autoComplete="email"/></label>
              </div>
              <div className="form-row">
                <label>{c.labels.visit}<input type="month" name="visitedAt"/></label>
                <label>{c.labels.rating}<select value={rating} onChange={e=>setRating(e.target.value)} name="rating">
                  {Array.from({length:10},(_,i)=>i+1).map(n=><option value={n} key={n}>{n}/10</option>)}
                </select></label>
              </div>
              <label>{c.labels.pros}<textarea name="pros" rows={3}/></label>
              <label>{c.labels.cons}<textarea name="cons" rows={3}/></label>
              <button type="submit" className="outline-button">{c.labels.submitReview}</button>
              {formStatus==="review"&&<p role="status" className="form-warning">{c.labels.noBackend}</p>}
            </form>
          </div>
        </section>

        <section className="content-section container form-section" id="contact" aria-labelledby="contact-heading">
          <h2 id="contact-heading">{c.labels.contactTitle}</h2>
          <form className="simple-form" onSubmit={e=>{e.preventDefault();setFormStatus("contact");}}>
            <div className="form-row">
              <label>{c.labels.name}<input required name="name" autoComplete="name"/></label>
              <label>{c.labels.email}<input required type="email" name="email" autoComplete="email"/></label>
            </div>
            <label>{c.labels.subject}<input required name="subject"/></label>
            <label>{c.labels.message}<textarea required name="message" rows={5}/></label>
            <button type="submit" className="primary-button">{c.labels.send}<Icon name="arrow"/></button>
            {formStatus==="contact"&&<p role="status" className="form-warning">{c.labels.noBackend}</p>}
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div><p className="footer-logo">OPAL LEGACY</p><p>{c.address}</p>
            <p className="footer-disclaimer">{c.labels.footerNote}</p></div>
          <nav aria-label="Footer navigation">{navEntries.map(n=><a key={n.id} href={`#${n.id}`}>{n.label}</a>)}</nav>
        </div>
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

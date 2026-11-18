"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, SyntheticEvent } from "react";
import type { Locale } from "@/lib/hotel-content";
import { galleryImages, hotelBrand, officialMediaActive, photoAlt, responsivePhotoSrcSet } from "@/lib/gallery";
import { roomConcepts } from "@/lib/room-concepts";
import {
  type BookingPreviewInput, bookingCopy, nightsBetween, nextDay, parseDateStamp, todayLocal,
} from "@/lib/booking-preview";

type Props={locale:Locale;initial:BookingPreviewInput};
type Step=1|2|3;

function PreviewPhoto({index,locale}:{index:number;locale:Locale}) {
  const image=galleryImages[index];
  const fallback=(e:SyntheticEvent<HTMLImageElement>)=>{
    const img=e.currentTarget;
    if(img.dataset.placeholder==="true")return;
    img.dataset.placeholder="true";
    img.removeAttribute("srcset");
    img.src="/media/photo-placeholder.svg";
  };
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="opal-book-photo" data-media-origin={image.origin} src={image.src}
    srcSet={responsivePhotoSrcSet(image.src)} sizes="(max-width: 700px) 100vw, 40vw"
    width={900} height={650} alt={photoAlt(index,locale)} loading="lazy" decoding="async" onError={fallback}/>;
}

function StepNumber({number,step,label,onNavigate}:{number:Step;step:Step;label:string;onNavigate:(step:Step)=>void}) {
  const visited=number<step,active=number===step;
  return <li className={`opal-book-step${active?" is-current":""}${visited?" is-done":""}`}>
    <button type="button" aria-current={active?"step":undefined}
      disabled={number>step} onClick={()=>onNavigate(number)}>
      <span className="opal-book-step-index">{String(number).padStart(2,"0")}</span>
      <span>{label}</span>
      <span aria-hidden="true" className="opal-book-step-state">{visited?"✓":active?"—":""}</span>
    </button>
  </li>;
}

function Counter({label,value,min,max,update}:{
  label:string;value:number;min:number;max:number;update:(value:number)=>void
}) {
  return <div className="opal-book-counter">
    <span>{label}</span>
    <div className="opal-book-counter-controls">
      <button type="button" disabled={value<=min} onClick={()=>update(Math.max(min,value-1))}
        aria-label={`${label} -1`}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" disabled={value>=max} onClick={()=>update(Math.min(max,value+1))}
        aria-label={`${label} +1`}>+</button>
    </div>
  </div>;
}

export function BookingExperience({locale,initial}:Props) {
  const ar=locale==="ar";
  const t=bookingCopy(locale);
  const [step,setStep]=useState<Step>(1);
  const [today,setToday]=useState("");
  const [checkin,setCheckin]=useState(initial.checkin);
  const [checkout,setCheckout]=useState(initial.checkout);
  const [adults,setAdults]=useState(initial.adults);
  const [children,setChildren]=useState(initial.children);
  const [selectedRoom,setSelectedRoom]=useState(initial.room);
  const [error,setError]=useState("");
  const nights=nightsBetween(checkin,checkout);
  const chosen=roomConcepts.find(room=>room.slug===selectedRoom);
  const validDates=Boolean(parseDateStamp(checkin)!==null&&parseDateStamp(checkout)!==null
    &&nights>0&&(!today||checkin>=today));
  const guestCount=adults+children;

  useEffect(()=>{
    // Local calendar dates avoid UTC drift when launched in Egypt or abroad.
    const current=todayLocal();
    setToday(current);
    setCheckin(old=>parseDateStamp(old)!==null&&old>=current?old:current);
    setCheckout(old=>{
      const start=initial.checkin&&initial.checkin>=current&&parseDateStamp(initial.checkin)!==null
        ? initial.checkin:current;
      return parseDateStamp(old)!==null&&old>start?old:nextDay(start);
    });
  },[initial.checkin]);

  const query=new URLSearchParams({
    checkin,checkout,adults:String(adults),children:String(children),
    ...(selectedRoom?{room:selectedRoom}:{}),
  }).toString();

  function continueStay(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!validDates) {
      setError(t.dateError);
      return;
    }
    setError("");
    setStep(2);
    window.scrollTo({top:0,behavior:"instant"});
  }

  function continueRoom() {
    if(!chosen)return;
    setStep(3);
    window.scrollTo({top:0,behavior:"instant"});
  }

  function navigateTo(newStep:Step) {
    if(newStep>step)return;
    setError("");
    setStep(newStep);
    window.scrollTo({top:0,behavior:"instant"});
  }

  const steps=[t.stepOne,t.stepTwo,t.stepThree] as const;
  const title=step===1?t.helperOne:step===2?t.helperTwo:t.helperThree;
  return <>
    <a className="opal-skip-link" href="#booking-main">{ar?"انتقل للمحتوى":"Skip to main content"}</a>
    <header className="opal-book-header">
      <div className="opal-book-header-inner">
        <Link href={`/${locale}`} className="opal-book-brand" aria-label={t.home}>
          {hotelBrand.officialLogoSrc
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={hotelBrand.officialLogoSrc} alt="" width={43} height={43}/>
            : <span className="opal-book-mark" aria-hidden="true">O</span>}
          <strong>OPAL LEGACY</strong>
          <small>LUXOR · EGYPT</small>
        </Link>
        <nav className="opal-book-header-links" aria-label={t.breadcrumb}>
          <Link href={`/${locale}/rooms`}>{t.exploreRooms}</Link>
          <Link href={`/${ar?"en":"ar"}/booking?${query}`}
            lang={ar?"en":"ar"} hrefLang={ar?"en":"ar"} className="opal-book-lang">{t.language}</Link>
        </nav>
      </div>
    </header>
    <main className="opal-book-page" id="booking-main">
      <div className="opal-book-introduction">
        <div className="opal-book-introduction-main">
          <span className="opal-book-eyebrow">{t.eyebrow}</span>
          <h1>{t.headline} <em>{t.emphasis}</em></h1>
          <p>{t.intro}</p>
        </div>
        <span className="opal-book-preview-label"><span aria-hidden="true">✳</span>{t.status}</span>
      </div>
      <div className="opal-book-stepbar">
        <ol>{([1,2,3] as Step[]).map(number=><StepNumber key={number}
          number={number} step={step} label={steps[number-1]} onNavigate={navigateTo}/>)}</ol>
        <span className="opal-book-step-counter" dir="ltr">{step} / 03</span>
      </div>
      <div className="opal-book-layout">
        <div className="opal-book-workspace">
          <div className="opal-book-workspace-title">
            <span className="opal-book-eyebrow">{t.step} {String(step).padStart(2,"0")} {t.of} 03</span>
            <h2>{title}</h2>
          </div>
          {step===1&&<form className="opal-book-dates" onSubmit={continueStay} noValidate>
            <div className="opal-book-date-grid">
              <label>{t.checkin}
                <input type="date" required name="checkin" value={checkin} min={today||undefined}
                  onChange={e=>{
                    const day=e.target.value;
                    setCheckin(day);
                    if(checkout&&checkout<=day)setCheckout(nextDay(day));
                    setError("");
                  }}/>
              </label>
              <label>{t.checkout}
                <input type="date" required name="checkout" value={checkout}
                  min={checkin?nextDay(checkin):today||undefined}
                  onChange={e=>{setCheckout(e.target.value);setError("");}}/>
              </label>
            </div>
            <div className="opal-book-guests">
              <div className="opal-book-guests-top">
                <h3>{t.guests}</h3><span>{t.total}: <strong>{guestCount}</strong></span>
              </div>
              <Counter label={t.adults} value={adults} min={1} max={8} update={setAdults}/>
              <Counter label={t.children} value={children} min={0} max={6} update={setChildren}/>
            </div>
            <p className="opal-book-helper">{t.note}</p>
            {error&&<p role="alert" className="opal-book-error">{error}</p>}
            <button className="opal-book-primary" type="submit">{t.continue}<span aria-hidden="true">↗</span></button>
          </form>}
          {step===2&&<div className="opal-book-choose">
            <p className="opal-book-section-notice">{t.selectionHint}</p>
            <div className="opal-book-room-grid" role="group" aria-label={t.available}>
              {roomConcepts.map((room,i)=><article className={`opal-book-room${selectedRoom===room.slug?" is-selected":""}`} key={room.slug}>
                <button type="button" className="opal-book-room-select"
                  aria-pressed={selectedRoom===room.slug}
                  aria-label={`${t.choose}: ${room.name[locale]}`}
                  onClick={()=>setSelectedRoom(room.slug)}>
                  <div className="opal-book-room-media">
                    <PreviewPhoto locale={locale} index={room.imageIndices[0]}/>
                    <span className="opal-book-room-index">{String(i+1).padStart(2,"0")} / 03</span>
                    <span className="opal-book-room-check" aria-hidden="true">{selectedRoom===room.slug?"✓":"+"}</span>
                  </div>
                  <span className="opal-book-room-text">
                    <small>{room.label[locale]}</small>
                    <strong>{room.name[locale]}</strong>
                    <span>{room.introduction[locale]}</span>
                  </span>
                </button>
                <Link className="opal-book-room-more" href={`/${locale}/rooms/${room.slug}`}>
                  {t.view}<span aria-hidden="true">↗</span>
                </Link>
              </article>)}
            </div>
            <div className="opal-book-actions">
              <button type="button" className="opal-book-back" onClick={()=>navigateTo(1)}>{t.previous}</button>
              <button type="button" className="opal-book-primary" onClick={continueRoom}
                disabled={!chosen}>{t.review}<span aria-hidden="true">↗</span></button>
            </div>
          </div>}
          {step===3&&<div className="opal-book-review">
            <div className="opal-book-review-heading">
              <span className="opal-book-eyebrow">{t.reviewHeading}</span>
              <strong>{t.status}</strong>
            </div>
            <div className="opal-book-review-lines">
              <div>
                <span>{t.checkin} / {t.checkout}</span>
                <strong dir="ltr">{checkin} — {checkout}</strong>
                <button type="button" onClick={()=>navigateTo(1)}>{t.editDates}<span aria-hidden="true">↗</span></button>
              </div>
              <div>
                <span>{t.stay}</span>
                <strong>{nights} {t.night}</strong>
              </div>
              <div>
                <span>{t.guests}</span>
                <strong>{guestCount} ({adults} {t.adults} · {children} {t.children})</strong>
              </div>
              <div>
                <span>{t.selected}</span>
                <strong>{chosen?.name[locale]}</strong>
                <button type="button" onClick={()=>navigateTo(2)}>{t.editRoom}<span aria-hidden="true">↗</span></button>
              </div>
            </div>
            <div className="opal-book-final-note" role="status">
              <span className="opal-book-final-symbol" aria-hidden="true">✳</span>
              <div><h3>{t.done}</h3><p>{t.reviewNotice}</p><strong>{t.noBooking}</strong></div>
            </div>
            <div className="opal-book-actions">
              <button type="button" className="opal-book-back" onClick={()=>navigateTo(2)}>{t.previous}</button>
              <Link href={`/${locale}/rooms`} className="opal-book-primary">{t.exploreRooms}<span aria-hidden="true">↗</span></Link>
            </div>
          </div>}
        </div>
        <aside className="opal-book-summary" aria-label={t.reviewHeading}>
          <div className="opal-book-summary-top">
            <span className="opal-book-eyebrow">{t.breadcrumb}</span>
            <span className="opal-book-summary-ornament" aria-hidden="true">✳</span>
          </div>
          <div className="opal-book-summary-image">
            <PreviewPhoto locale={locale} index={chosen?chosen.imageIndices[0]:2}/>
            <span>{officialMediaActive ? (ar?"صور الفندق المعتمدة":"HOTEL-APPROVED PHOTOS") : t.source}</span>
          </div>
          <h2>{chosen?chosen.name[locale]:t.datePlaceholder}</h2>
          <p className="opal-book-summary-room">{chosen?chosen.introduction[locale]:t.selectionHint}</p>
          <div className="opal-book-summary-rows">
            <div><span>{t.checkin}</span><strong dir="ltr">{validDates?checkin:"—"}</strong></div>
            <div><span>{t.checkout}</span><strong dir="ltr">{validDates?checkout:"—"}</strong></div>
            <div><span>{t.stay}</span><strong>{validDates?nights:"—"}</strong></div>
            <div><span>{t.total}</span><strong>{guestCount}</strong></div>
          </div>
          <div className="opal-book-unavailable">
            <span aria-hidden="true">✳</span>
            <p><strong>{t.noAvailability}</strong>{t.help}</p>
          </div>
        </aside>
      </div>
      <div className="opal-book-bottom-note">{t.note}</div>
    </main>
    <footer className="opal-book-footer">
      <strong>OPAL LEGACY</strong>
      <p>{t.noBooking}</p>
      <Link href={`/${locale}`}>{t.home}<span aria-hidden="true">↗</span></Link>
    </footer>
  </>;
}

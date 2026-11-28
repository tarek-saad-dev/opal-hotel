"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, SyntheticEvent } from "react";
import type { Locale } from "@/lib/hotel-content";
import { hotelBrand, responsivePhotoSrcSet } from "@/lib/gallery";
import { useHotelMedia } from "@/components/CmsProvider";
import {
  type BookingPreviewInput, bookingCopy, nightsBetween, nextDay, parseDateStamp, todayLocal,
} from "@/lib/booking-preview";
import { apiErrorMessage, submitBookingRequest } from "@/lib/api-client";
import { getRoomType, roomTypes } from "@/lib/room-types";
import { DateRangePicker } from "@/components/DateRangePicker";
import { formatLong, nightsLabel } from "@/lib/date-range";

type Props={locale:Locale;initial:BookingPreviewInput};
type Step=1|2|3;
type Guest={fullName:string;email:string;phone:string;country:string;arrivalTime:string;notes:string};

function SummaryPhoto({locale}:{locale:Locale}) {
  const media=useHotelMedia();
  const index=media.images.findIndex(image=>image.origin==="hotel-approved");
  const image=index>=0?media.images[index]:media.images[0];
  const fallback=(e:SyntheticEvent<HTMLImageElement>)=>{
    const img=e.currentTarget;
    if(img.dataset.placeholder==="true")return;
    img.dataset.placeholder="true";
    img.removeAttribute("srcset");
    img.src="/media/brand-panel.svg";
  };
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="opal-book-photo" data-media-origin={image.origin} src={image.src}
    srcSet={responsivePhotoSrcSet(image.src)} sizes="(max-width: 700px) 100vw, 40vw"
    width={900} height={650} alt={image.origin==="placeholder"?"":locale==="ar"?image.altAr:image.alt}
    loading="lazy" decoding="async" onError={fallback}/>;
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

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern=/^[+()\d\s-]{7,20}$/;

export function BookingExperience({locale,initial}:Props) {
  const media=useHotelMedia();
  const logoSrc=media.logoSrc??hotelBrand.officialLogoSrc;
  const ar=locale==="ar";
  const t=bookingCopy(locale);
  const [step,setStep]=useState<Step>(1);
  const [today,setToday]=useState("");
  const [checkin,setCheckin]=useState(initial.checkin);
  const [checkout,setCheckout]=useState(initial.checkout);
  const [adults,setAdults]=useState(initial.adults);
  const [children,setChildren]=useState(initial.children);
  const [roomType,setRoomType]=useState(initial.room);
  const [rooms,setRooms]=useState(1);
  const [guest,setGuest]=useState<Guest>({fullName:"",email:"",phone:"",country:"",arrivalTime:"",notes:""});
  const [error,setError]=useState("");
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState<{reference:string|null}|null>(null);
  const nights=nightsBetween(checkin,checkout);
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
    // Guests arriving from the homepage form already chose dates and party:
    // go straight to their details instead of asking for the same data again.
    if(parseDateStamp(initial.checkin)!==null&&parseDateStamp(initial.checkout)!==null
      &&initial.checkin>=current&&initial.checkout>initial.checkin) setStep(2);
  },[initial.checkin,initial.checkout]);

  // Same format as the date picker: weekday, Western digits in both languages.
  const formatDate=(stamp:string)=>formatLong(stamp,locale)||stamp;

  const query=new URLSearchParams({
    checkin,checkout,adults:String(adults),children:String(children),
    ...(roomType?{room:roomType}:{}),
  }).toString();

  const goTo=(next:Step)=>{
    setError("");
    setStep(next);
    window.scrollTo({top:0,behavior:"instant"});
  };

  function continueStay(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!validDates) { setError(t.dateError); return; }
    goTo(2);
  }

  const detailsValid=guest.fullName.trim().length>=2&&emailPattern.test(guest.email.trim())
    &&phonePattern.test(guest.phone.trim());
  function continueDetails(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!detailsValid) { setError(t.detailsError); return; }
    goTo(3);
  }

  async function send() {
    if(sending||!validDates||!detailsValid)return;
    setSending(true);
    setError("");
    const result=await submitBookingRequest({
      locale,checkin,checkout,adults,children,rooms,roomType,
      guest:{fullName:guest.fullName.trim(),email:guest.email.trim(),phone:guest.phone.trim(),country:guest.country.trim()},
      arrivalTime:guest.arrivalTime.trim(),notes:guest.notes.trim(),
    });
    setSending(false);
    if(result.ok) {
      setSent({reference:result.reference});
      window.scrollTo({top:0,behavior:"instant"});
    } else {
      setError(apiErrorMessage(result.error,locale));
    }
  }

  function navigateTo(newStep:Step) {
    if(newStep>step||sending)return;
    goTo(newStep);
  }

  const update=(key:keyof Guest)=>(e:{target:{value:string}})=>{
    setGuest(old=>({...old,[key]:e.target.value}));
    setError("");
  };

  const steps=[t.stepOne,t.stepTwo,t.stepThree] as const;
  const title=step===1?t.helperOne:step===2?t.helperTwo:t.helperThree;
  return <>
    <a className="opal-skip-link" href="#booking-main">{ar?"انتقل للمحتوى":"Skip to main content"}</a>
    <header className="opal-book-header">
      <div className="opal-book-header-inner">
        <Link href={`/${locale}`} className="opal-book-brand" aria-label={t.home}>
          {logoSrc
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logoSrc} alt="" width={43} height={43}/>
            : <span className="opal-book-mark" aria-hidden="true">O</span>}
          <strong>OPAL POOLSIDE</strong>
          <small>LUXOR · EGYPT</small>
        </Link>
        <nav className="opal-book-header-links" aria-label={t.breadcrumb}>
          <Link href={`/${locale}`} className="opal-header-home">{ar?"الرئيسية":"Home"}</Link>
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
      </div>
      {sent ? <div className="opal-book-sent" role="status">
        <span className="opal-book-final-symbol" aria-hidden="true">✓</span>
        <h2>{t.sentTitle}</h2>
        <p>{t.sentBody}</p>
        {sent.reference&&<p className="opal-book-reference">{t.reference}: <strong dir="ltr">{sent.reference}</strong></p>}
        <dl className="opal-book-sent-lines">
          <div><dt>{t.checkin} / {t.checkout}</dt><dd>{formatDate(checkin)} — {formatDate(checkout)}</dd></div>
          <div><dt>{t.guests}</dt><dd>{guestCount} ({adults} {t.adults} · {children} {t.children})</dd></div>
        </dl>
        <Link href={`/${locale}`} className="opal-book-primary">{t.backHome}<span aria-hidden="true">→</span></Link>
      </div> : <>
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
              <DateRangePicker variant="page" locale={locale} checkin={checkin} checkout={checkout} min={today}
                labels={{checkin:t.checkin,checkout:t.checkout}} named
                onChange={range=>{setCheckin(range.checkin);setCheckout(range.checkout);setError("");}}/>
            </div>
            <div className="opal-book-guests">
              <div className="opal-book-guests-top">
                <h3>{t.guests}</h3><span>{t.total}: <strong>{guestCount}</strong></span>
              </div>
              <Counter label={t.adults} value={adults} min={1} max={8} update={setAdults}/>
              <Counter label={t.children} value={children} min={0} max={6} update={setChildren}/>
              <Counter label={t.roomsCount} value={rooms} min={1} max={2} update={setRooms}/>
              <p className="opal-book-helper">{t.groupNote} <a href={`/${locale}#contact`}>{t.groupLink}</a></p>
            </div>
            <label className="opal-book-room-type">{t.roomType}
              <select name="roomType" value={roomType} onChange={e=>setRoomType(e.target.value)}>
                <option value="">{t.anyRoom}</option>
                {roomTypes.map(room=><option key={room.slug} value={room.slug}>
                  {room.name[locale]} · {room.sizeM2} {ar?"م²":"m²"}</option>)}
              </select>
            </label>
            {error&&<p role="alert" className="opal-book-error">{error}</p>}
            <button className="opal-book-primary" type="submit">{t.continue}<span aria-hidden="true">→</span></button>
          </form>}
          {step===2&&<form className="opal-book-details" onSubmit={continueDetails} noValidate>
            <div className="opal-book-field-grid">
              <label>{t.fullName}<span className="opal-required-mark" aria-hidden="true"> *</span>
                <input name="fullName" required autoComplete="name" maxLength={120}
                  value={guest.fullName} onChange={update("fullName")}/>
              </label>
              <label>{t.email}<span className="opal-required-mark" aria-hidden="true"> *</span>
                <input name="email" type="email" required autoComplete="email" maxLength={254} dir="ltr"
                  value={guest.email} onChange={update("email")}/>
              </label>
              <label>{t.phone}<span className="opal-required-mark" aria-hidden="true"> *</span>
                <input name="phone" type="tel" required autoComplete="tel" maxLength={20} dir="ltr"
                  value={guest.phone} onChange={update("phone")}/>
              </label>
              <label>{t.country}
                <input name="country" autoComplete="country-name" maxLength={80}
                  value={guest.country} onChange={update("country")}/>
              </label>
              <label>{t.arrival}
                <input name="arrivalTime" maxLength={40} placeholder={t.arrivalHint}
                  value={guest.arrivalTime} onChange={update("arrivalTime")}/>
              </label>
            </div>
            <label className="opal-book-notes">{t.notes}
              <textarea name="notes" rows={4} maxLength={1000} placeholder={t.notesHint}
                value={guest.notes} onChange={update("notes")}/>
            </label>
            <p className="opal-book-helper">{t.privacy}</p>
            {error&&<p role="alert" className="opal-book-error">{error}</p>}
            <div className="opal-book-actions">
              <button type="button" className="opal-book-back" onClick={()=>navigateTo(1)}>{t.previous}</button>
              <button className="opal-book-primary" type="submit">{t.review}<span aria-hidden="true">→</span></button>
            </div>
          </form>}
          {step===3&&<div className="opal-book-review">
            <div className="opal-book-review-lines">
              <div>
                <span>{t.checkin} / {t.checkout}</span>
                <strong>{formatDate(checkin)} — {formatDate(checkout)}</strong>
                <button type="button" onClick={()=>navigateTo(1)}>{t.editDates}</button>
              </div>
              <div>
                <span>{t.stay}</span>
                <strong>{nightsLabel(nights,locale)}</strong>
              </div>
              <div>
                <span>{t.guests}</span>
                <strong>{guestCount} ({adults} {t.adults} · {children} {t.children})</strong>
              </div>
              <div>
                <span>{t.roomType}</span>
                <strong>{getRoomType(roomType)?.name[locale]??t.anyRoom} · {rooms} {t.roomsCount}</strong>
              </div>
              <div>
                <span>{t.fullName}</span>
                <strong>{guest.fullName}</strong>
                <button type="button" onClick={()=>navigateTo(2)}>{t.editDetails}</button>
              </div>
              <div><span>{t.email}</span><strong dir="ltr">{guest.email}</strong></div>
              <div><span>{t.phone}</span><strong dir="ltr">{guest.phone}</strong></div>
              {guest.country&&<div><span>{t.country}</span><strong>{guest.country}</strong></div>}
              {guest.arrivalTime&&<div><span>{t.arrival}</span><strong>{guest.arrivalTime}</strong></div>}
              {guest.notes&&<div><span>{t.notes}</span><strong>{guest.notes}</strong></div>}
            </div>
            <p className="opal-book-helper">{t.confirmNote}</p>
            {error&&<p role="alert" className="opal-book-error">{error}</p>}
            <div className="opal-book-actions">
              <button type="button" className="opal-book-back" onClick={()=>navigateTo(2)} disabled={sending}>{t.previous}</button>
              <button type="button" className="opal-book-primary" onClick={()=>void send()}
                disabled={sending} aria-busy={sending}>{sending?t.sending:t.send}<span aria-hidden="true">→</span></button>
            </div>
          </div>}
        </div>
        <aside className="opal-book-summary" aria-label={t.summary}>
          <div className="opal-book-summary-top">
            <span className="opal-book-eyebrow">{t.summary}</span>
            <span className="opal-book-summary-ornament" aria-hidden="true">✳</span>
          </div>
          <div className="opal-book-summary-image"><SummaryPhoto locale={locale}/></div>
          <h2>{getRoomType(roomType)?.name[locale]??"Opal Poolside Luxor"}</h2>
          <div className="opal-book-summary-rows">
            <div><span>{t.checkin}</span><strong>{validDates?formatDate(checkin):"—"}</strong></div>
            <div><span>{t.checkout}</span><strong>{validDates?formatDate(checkout):"—"}</strong></div>
            <div><span>{t.stay}</span><strong>{validDates?nightsLabel(nights,locale):"—"}</strong></div>
            <div><span>{t.total}</span><strong>{guestCount}</strong></div>
            <div><span>{t.roomsCount}</span><strong>{rooms}</strong></div>
          </div>
          <div className="opal-book-unavailable">
            <span aria-hidden="true">✳</span>
            <p><strong>{t.checkinTime}</strong>{t.checkoutTime}</p>
          </div>
        </aside>
      </div>
      </>}
    </main>
    <footer className="opal-book-footer">
      <strong>OPAL POOLSIDE</strong>
      <p>Rd Lead To Esna, Luxor, Egypt</p>
      <Link href={`/${locale}`}>{t.home}<span aria-hidden="true">→</span></Link>
    </footer>
  </>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { hotelBrand } from "@/lib/gallery";
import { useCmsSite,useHotelMedia } from "@/components/CmsProvider";

type Props = { locale: Locale; content: HotelContent };
const mapUrl = (address:string) => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(address);

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      viewBox="0 0 24 24" aria-hidden="true">
    {diagonal ? <><path d="M6 18 18 6M7 6h11v11"/></> : <><path d="M4 12h16m-7-7 7 7-7 7"/></>}
  </svg>;
}

function Eyebrow({number,children}: {number:string;children:ReactNode}) {
  return <p className="opal-end-eyebrow"><span>{number}</span>{children}</p>;
}

export function PremiumReviews({locale,content:c}:Props) {
  const heading=useCmsSite().locales[locale].headings.reviews;
  const ar=locale==="ar";
  const [rating,setRating]=useState(8);
  const [submitted,setSubmitted]=useState(false);
  const t=ar ? {
    kicker:"كلمات تترك أثرًا",
    heading:"بعض الذكريات", accent:"تستحق الحكاية.",
    lead:"كل تجربة إقامة لها تفاصيل خاصة. ودي مساحة مصممة علشان تشارك انطباعك بالطريقة اللي تحبها.",
    note:"هذا نموذج تصميمي فقط. لا يتم تخزين أي بيانات أو إرسال تقييمات حاليًا.",
    cardKicker:"مذكرات الضيوف",
    cardTitle:"احكي لنا تجربتك",
    score:"تقييم تجربتك",
    outOf:"من 10",
    name:"اسمك", nameExample:"الاسم كما تحب أن يظهر",
    visit:"موعد الزيارة",
    story:"إيه أكتر حاجة فضلت في ذاكرتك؟",
    storyPlaceholder:"اكتب انطباعك هنا...",
    action:"معاينة التقييم",
    preview:"نسخة عرض فقط",
  } : {
    kicker:"THE GUEST JOURNAL",
    heading:"Some memories", accent:"deserve a story.",
    lead:"Every stay has its own little moments. A considered space to share what made yours memorable.",
    note:"This is a visual preview only. Reviews are not stored, published or sent.",
    cardKicker:"YOUR PERSPECTIVE",
    cardTitle:"Share your story",
    score:"Your experience",
    outOf:"out of 10",
    name:"Your name", nameExample:"How would you like to be known?",
    visit:"When did you visit?",
    story:"What stayed with you?",
    storyPlaceholder:"The moment you'll remember...",
    action:"Preview your review",
    preview:"DESIGN PREVIEW ONLY",
  };
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    // UI-only interaction. No network request, storage, or review publication.
    setSubmitted(true);
  };

  return <div className="opal-end-review-layout">
    <div className="opal-end-review-story opal-reveal">
      <Eyebrow number="06">{heading.kicker}</Eyebrow>
      <h2 id="reviews-heading">{heading.title} <em>{heading.accent}</em></h2>
      <p className="opal-end-lead">{heading.description}</p>
      <div className="opal-end-quote-decoration" aria-hidden="true">“</div>
      <div className="opal-end-review-line"><span />{t.preview}</div>
    </div>
    <div className="opal-end-review-paper opal-reveal">
      <div className="opal-end-paper-top">
        <span>{t.cardKicker}</span>
        <span className="opal-end-paper-ornament" aria-hidden="true">✳</span>
      </div>
      <h3>{t.cardTitle}</h3>
      <form className="opal-end-form" onSubmit={submit} aria-label={c.labels.reviewsTitle}>
        <div className="opal-end-score-row">
          <span>{t.score}</span>
          <strong aria-live="polite" dir="ltr"><span>{String(rating).padStart(2,"0")}</span> / 10</strong>
        </div>
        <fieldset className="opal-end-rating" aria-label={t.score}>
          <legend className="opal-sr-only">{t.score}</legend>
          {Array.from({length:10},(_,i)=>i+1).map(value=>
            <label key={value} className={rating===value?"is-selected":""}>
              <input type="radio" name="rating" value={value} checked={rating===value}
                onChange={()=>{setRating(value);setSubmitted(false);}}/>
              <span>{value}</span>
            </label>
          )}
        </fieldset>
        <div className="opal-end-form-two">
          <label>{t.name}
            <input required name="reviewName" type="text" autoComplete="name" maxLength={100}
              onChange={()=>setSubmitted(false)} placeholder={t.nameExample}/>
          </label>
          <label>{t.visit}
            <input name="visitDate" type="month" onChange={()=>setSubmitted(false)}/>
          </label>
        </div>
        <label>{t.story}
          <textarea name="reviewStory" rows={3} maxLength={1200} required
            onChange={()=>setSubmitted(false)} placeholder={t.storyPlaceholder}/>
        </label>
        <div className="opal-end-form-submit">
          <button type="submit">{t.action}<Arrow /></button>
          <span className="opal-end-preview-pill">{t.preview}</span>
        </div>
        {submitted&&<p role="status" className="opal-end-status">{c.labels.noBackend}</p>}
        <p className="opal-end-form-hint">{t.note}</p>
      </form>
    </div>
  </div>;
}

export function PremiumContact({locale,content:c}:Props) {
  const heading=useCmsSite().locales[locale].headings.contact;
  const ar=locale==="ar";
  const [submitted,setSubmitted]=useState(false);
  const t=ar ? {
    kicker:"تواصل مع المكان",
    heading:"عندك سؤال؟", accent:"خلّينا نتكلم.",
    intro:"فيه تفاصيل بتحب تعرفها عن الإقامة؟ هنا تقدر تستكشف شكل تجربة التواصل قبل تفعيلها.",
    location:"مكاننا", place:"الأقصر، مصر",
    map:"شوف المكان على الخريطة",
    note:"للتوضيح: نموذج التواصل غير مفعل حاليًا، ولا تُرسل منه أي رسائل.",
    formKicker:"ابدأ المحادثة",
    formTitle:"اكتب لنا رسالة",
    nameExample:"الاسم بالكامل",
    emailExample:"name@example.com",
    subjectExample:"موضوع الاستفسار",
    messageExample:"حابب تعرف إيه؟",
    action:"معاينة الرسالة",
    foot:"المعاينة فقط — لا تُحفظ البيانات ولا تُرسل.",
    email:"البريد الإلكتروني",
  } : {
    kicker:"LET'S TALK",
    heading:"Have a question?", accent:"Let's connect.",
    intro:"Questions about your stay, or just curious about the experience? A first look at how contacting Opal will feel.",
    location:"FIND US IN", place:"LUXOR, EGYPT",
    map:"FIND US ON THE MAP",
    note:"This contact form is not connected yet. Messages are not delivered.",
    formKicker:"A PERSONAL NOTE",
    formTitle:"Write to us",
    nameExample:"Your full name",
    emailExample:"name@example.com",
    subjectExample:"What is this about?",
    messageExample:"Tell us what you're looking for...",
    action:"Preview your message",
    foot:"PREVIEW ONLY — DETAILS ARE NOT SAVED OR SENT",
    email:"Email address",
  };
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    // Explicitly no network, delivery, or persistence until real contact is approved.
    setSubmitted(true);
  };
  return <div className="opal-end-contact-layout">
    <div className="opal-end-contact-intro opal-reveal">
      <Eyebrow number="07">{heading.kicker}</Eyebrow>
      <h2 id="contact-heading">{heading.title} <em>{heading.accent}</em></h2>
      <p>{heading.description}</p>
      <div className="opal-end-contact-place">
        <span className="opal-end-contact-place-mark" aria-hidden="true">⌖</span>
        <div><small>{t.location}</small><strong>{t.place}</strong><span>{c.address}</span></div>
      </div>
      <a className="opal-end-map-link" href={mapUrl(c.address)} rel="noopener noreferrer" target="_blank">
        {t.map}<Arrow diagonal/>
      </a>
      <p className="opal-end-contact-footnote">{t.note}</p>
      <span className="opal-end-contact-watermark" aria-hidden="true">OPAL</span>
    </div>
    <div className="opal-end-contact-paper opal-reveal">
      <span className="opal-end-card-kicker">{t.formKicker}</span>
      <h3>{t.formTitle}</h3>
      <form className="opal-end-form opal-end-contact-form" onSubmit={submit} aria-label={c.labels.contactTitle}>
        <div className="opal-end-form-two">
          <label>{c.labels.name}
            <input name="contactName" type="text" autoComplete="name" required maxLength={100}
              placeholder={t.nameExample} onChange={()=>setSubmitted(false)}/>
          </label>
          <label>{t.email}
            <input name="contactEmail" type="email" autoComplete="email" required maxLength={254}
              placeholder={t.emailExample} onChange={()=>setSubmitted(false)}/>
          </label>
        </div>
        <label>{c.labels.subject}
          <input name="contactSubject" type="text" required maxLength={160}
            placeholder={t.subjectExample} onChange={()=>setSubmitted(false)}/>
        </label>
        <label>{c.labels.message}
          <textarea name="contactMessage" rows={5} required maxLength={2000}
            placeholder={t.messageExample} onChange={()=>setSubmitted(false)}/>
        </label>
        <button className="opal-end-contact-submit" type="submit">{t.action}<Arrow /></button>
        {submitted&&<p role="status" className="opal-end-status">{c.labels.noBackend}</p>}
        <p className="opal-end-form-hint">{t.foot}</p>
      </form>
    </div>
  </div>;
}

export function PremiumFooter({locale,content:c}:Props) {
  const cms=useCmsSite();
  const visible=new Set(cms.sections.filter(item=>item.visible).map(item=>item.id));
  const media=useHotelMedia();
  const logoSrc=media.logoSrc??hotelBrand.officialLogoSrc;
  const ar=locale==="ar";
  const t=ar ? {
    top:"ارجع لبداية الحكاية",
    kicker:"اكتشف الأقصر بطريقة مختلفة",
    title:"الحكايات الجميلة", accent:"بتبدأ من هنا.",
    pre:"فندق أوبال ليجاسي", discover:"اكتشف", connect:"روابط سريعة",
    next:"مستعد تكتشف أكثر؟", map:"شوف الموقع", language:"English",
    demo:media.approved ? "صور الفندق معتمدة؛ الحجز والتواصل الإلكتروني غير مفعلين بعد." : "نسخة العرض — الصور التوضيحية لا تمثل الفندق، والحجز والتواصل غير مفعلين.",
    credits:"صُمم بهدوء ليبقى في الذاكرة",
  } : {
    top:"BACK TO THE TOP",
    kicker:"A NEW WAY TO FEEL LUXOR",
    title:"Beautiful stories", accent:"begin here.",
    pre:"Opal Legacy Hotel", discover:"EXPLORE", connect:"DISCOVER",
    next:"READY FOR YOUR NEXT STORY?", map:"FIND US ON THE MAP", language:"العربية",
    demo:media.approved ? "Approved hotel imagery. Booking and online contact remain disabled." : "Design preview. Imagery is illustrative; bookings and contact delivery are not enabled.",
    credits:"CONSIDERED DETAILS. LASTING FEELINGS.",
  };
  const explore=(["overview","facilities","rooms","gallery"] as const);
  const other=(["location","reviews","contact"] as const);
  return <div className="opal-end-footer-inner">
    <div className="opal-end-footer-heading">
      <div><span className="opal-end-footer-kicker">{t.kicker}</span>
        <h2>{t.title} <em>{t.accent}</em></h2></div>
      <a href="#top" className="opal-end-backtop">{t.top}<Arrow diagonal/></a>
    </div>
    <div className="opal-end-footer-columns">
      <div className="opal-end-footer-brand">
        {logoSrc
          ? <img src={logoSrc} className="opal-end-brand-official" alt="" width={54} height={54} loading="lazy"/>
          : <span className="opal-end-brand-emblem" aria-hidden="true">O</span>}
        <strong>OPAL LEGACY</strong>
        <span>L U X O R &nbsp; · &nbsp; E G Y P T</span>
        <p>{c.address}</p>
      </div>
      <nav aria-label={t.discover}>
        <h3>{t.discover}</h3>
        {explore.filter(key=>visible.has(key)).map(key=><a href={`#${key}`} key={key}>{c.nav[key]}</a>)}
      </nav>
      <nav aria-label={t.connect}>
        <h3>{t.connect}</h3>
        {other.filter(key=>visible.has(key)).map(key=><a href={`#${key}`} key={key}>{c.nav[key]}</a>)}
      </nav>
      <div className="opal-end-footer-last">
        <span>{t.next}</span>
        <a href={mapUrl(c.address)} rel="noopener noreferrer" target="_blank">{t.map}<Arrow diagonal/></a>
        <Link href={ar?"/en":"/ar"} lang={ar?"en":"ar"} hrefLang={ar?"en":"ar"}>{t.language}</Link>
      </div>
    </div>
    <div className="opal-end-footer-bottom">
      <span>© OPAL LEGACY · LUXOR</span><p>{t.demo}</p><span>{t.credits}</span>
    </div>
  </div>;
}

"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { hotelMapUrl, type HotelContent, type Locale } from "@/lib/hotel-content";
import { hotelBrand } from "@/lib/gallery";
import { useCmsSite,useHotelMedia,useVisibleSections } from "@/components/CmsProvider";
import { apiErrorMessage, contactSubjects, submitContactMessage, submitReview, type ApiResult, type ContactSubject } from "@/lib/api-client";

type SendState={state:"idle"}|{state:"sending"}|{state:"sent"}|{state:"error";message:string};
/** Shared submit lifecycle: one request at a time, honest success/error states. */
function useSend(locale:Locale){
  const [status,setStatus]=useState<SendState>({state:"idle"});
  const run=async(request:()=>Promise<ApiResult>,onSuccess:()=>void)=>{
    if(status.state==="sending")return;
    setStatus({state:"sending"});
    const result=await request();
    if(result.ok){setStatus({state:"sent"});onSuccess();}
    else setStatus({state:"error",message:apiErrorMessage(result.error,locale)});
  };
  const reset=()=>{if(status.state!=="sending")setStatus({state:"idle"});};
  return {status,run,reset};
}
function FormStatus({status,sent}:{status:SendState;sent:string}){
  if(status.state==="sent")return <p role="status" className="opal-end-status is-success">{sent}</p>;
  if(status.state==="error")return <p role="alert" className="opal-end-status is-error">{status.message}</p>;
  return null;
}
const field=(form:HTMLFormElement,name:string)=>String(new FormData(form).get(name)??"").trim();

type Props = { locale: Locale; content: HotelContent };

function Arrow({ diagonal = false, up = false }: { diagonal?: boolean; up?: boolean }) {
  return <svg width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      viewBox="0 0 24 24" aria-hidden="true">
    {up ? <><path d="M12 20V4m-7 7 7-7 7 7"/></>
      : diagonal ? <><path d="M6 18 18 6M7 6h11v11"/></> : <><path d="M4 12h16m-7-7 7 7-7 7"/></>}
  </svg>;
}

function RequiredMark() {
  return <span className="opal-required-mark" aria-hidden="true"> *</span>;
}

function Eyebrow({number,children}: {number:string;children:ReactNode}) {
  return <p className="opal-end-eyebrow"><span>{number}</span>{children}</p>;
}

export function PremiumReviews({locale,content:c}:Props) {
  const heading=useCmsSite().locales[locale].headings.reviews;
  const ar=locale==="ar";
  // No preselected score: a default value nudges the guest's rating.
  const [rating,setRating]=useState<number|null>(null);
  const {status,run,reset}=useSend(locale);
  const [thisMonth,setThisMonth]=useState("");
  useEffect(()=>{
    const now=new Date();
    setThisMonth(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  },[]);
  const t=ar ? {
    kicker:"كلمات تترك أثرًا",
    heading:"بعض الذكريات", accent:"تستحق الحكاية.",
    lead:"كل تجربة إقامة لها تفاصيل خاصة. شاركنا انطباعك.",
    note:"يراجع فريق الفندق التقييمات قبل نشرها.",
    sent:"شكرًا لك! تم إرسال تقييمك وسيظهر بعد مراجعته.",
    cardKicker:"مذكرات الضيوف",
    cardTitle:"احكي لنا تجربتك",
    score:"تقييم تجربتك",
    outOf:"من 10",
    name:"اسمك", nameExample:"الاسم كما تحب أن يظهر",
    visit:"موعد الزيارة",
    story:"إيه أكتر حاجة فضلت في ذاكرتك؟",
    storyPlaceholder:"اكتب انطباعك هنا...",
    action:"أرسل التقييم", sending:"جارٍ الإرسال…",
    email:"البريد الإلكتروني (لن يُنشر)", pros:"الإيجابيات", cons:"السلبيات",
  } : {
    kicker:"THE GUEST JOURNAL",
    heading:"Some memories", accent:"deserve a story.",
    lead:"Every stay has its own little moments. A considered space to share what made yours memorable.",
    note:"Reviews are checked by the hotel team before they are published.",
    sent:"Thank you! Your review was sent and will appear once it has been checked.",
    cardKicker:"YOUR PERSPECTIVE",
    cardTitle:"Share your story",
    score:"Your experience",
    outOf:"out of 10",
    name:"Your name", nameExample:"How would you like to be known?",
    visit:"When did you visit?",
    story:"What stayed with you?",
    storyPlaceholder:"The moment you'll remember...",
    action:"Send your review", sending:"Sending…",
    email:"Email (not published)", pros:"Pros", cons:"Cons",
  };
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(rating===null)return;
    void run(()=>submitReview({
      locale,rating,name:field(form,"reviewName"),email:field(form,"reviewEmail"),
      visitMonth:field(form,"visitDate"),story:field(form,"reviewStory"),
      pros:field(form,"reviewPros"),cons:field(form,"reviewCons"),
    }),()=>{form.reset();setRating(null);});
  };

  return <div className="opal-end-review-layout">
    <div className="opal-end-review-story opal-reveal">
      <Eyebrow number="06">{heading.kicker}</Eyebrow>
      <h2 id="reviews-heading">{heading.title} <em>{heading.accent}</em></h2>
      <p className="opal-end-lead">{heading.description}</p>
      <div className="opal-end-quote-decoration" aria-hidden="true">“</div>
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
          <strong aria-live="polite" dir="ltr"><span>{rating===null?"—":String(rating).padStart(2,"0")}</span> / 10</strong>
        </div>
        <fieldset className="opal-end-rating" aria-label={t.score}>
          <legend className="opal-sr-only">{t.score}</legend>
          {Array.from({length:10},(_,i)=>i+1).map(value=>
            <label key={value} className={rating===value?"is-selected":""}>
              <input type="radio" name="rating" value={value} checked={rating===value} required
                onChange={()=>{setRating(value);reset();}}/>
              <span>{value}</span>
            </label>
          )}
        </fieldset>
        <div className="opal-end-form-two">
          <label>{t.name}<RequiredMark/>
            <input required name="reviewName" type="text" autoComplete="name" maxLength={100}
              onChange={reset} placeholder={t.nameExample}/>
          </label>
          <label>{t.email}<RequiredMark/>
            <input required name="reviewEmail" type="email" autoComplete="email" maxLength={254} dir="ltr"
              onChange={reset} placeholder="name@example.com"/>
          </label>
        </div>
        <label>{t.visit}
          <input name="visitDate" type="month" max={thisMonth||undefined} onChange={reset}/>
        </label>
        <label>{t.story}<RequiredMark/>
          <textarea name="reviewStory" rows={3} maxLength={1200} required
            onChange={reset} placeholder={t.storyPlaceholder}/>
        </label>
        <div className="opal-end-form-two">
          <label>{t.pros}
            <textarea name="reviewPros" rows={2} maxLength={600} onChange={reset}/>
          </label>
          <label>{t.cons}
            <textarea name="reviewCons" rows={2} maxLength={600} onChange={reset}/>
          </label>
        </div>
        <div className="opal-end-form-submit">
          <button type="submit" disabled={status.state==="sending"} aria-busy={status.state==="sending"}>
            {status.state==="sending"?t.sending:t.action}<Arrow /></button>
        </div>
        <FormStatus status={status} sent={t.sent}/>
        <p className="opal-end-form-hint">{t.note}</p>
      </form>
    </div>
  </div>;
}

export function PremiumContact({locale,content:c}:Props) {
  const heading=useCmsSite().locales[locale].headings.contact;
  const ar=locale==="ar";
  const {status,run,reset}=useSend(locale);
  const t=ar ? {
    kicker:"تواصل مع المكان",
    heading:"عندك سؤال؟", accent:"خلّينا نتكلم.",
    intro:"عندك سؤال عن الإقامة أو الخدمات؟ اكتب لنا وسيرد عليك فريق الفندق.",
    location:"مكاننا", place:"الأقصر، مصر",
    map:"شوف المكان على الخريطة",
    sent:"شكرًا لك! وصلتنا رسالتك وسنرد عليك عبر البريد الإلكتروني.",
    formKicker:"ابدأ المحادثة",
    formTitle:"اكتب لنا رسالة",
    nameExample:"الاسم بالكامل",
    emailExample:"name@example.com",
    subjectExample:"اختر موضوعًا",
    subjects:{booking_question:"الأسعار والإتاحة",change_booking:"تعديل حجز",cancel_booking:"إلغاء حجز",
      hotel_info:"معلومات عن الفندق",group_booking:"حجز مجموعة (أكثر من غرفتين)",other:"أخرى"} as Record<ContactSubject,string>,
    messageExample:"حابب تعرف إيه؟",
    action:"أرسل الرسالة", sending:"جارٍ الإرسال…",
    foot:"نستخدم بياناتك للرد على رسالتك فقط.",
    email:"البريد الإلكتروني",
  } : {
    kicker:"LET'S TALK",
    heading:"Have a question?", accent:"Let's connect.",
    intro:"Questions about your stay or our services? Write to us and the hotel team will reply.",
    location:"FIND US IN", place:"LUXOR, EGYPT",
    map:"FIND US ON THE MAP",
    sent:"Thank you! We received your message and will reply by email.",
    formKicker:"A PERSONAL NOTE",
    formTitle:"Write to us",
    nameExample:"Your full name",
    emailExample:"name@example.com",
    subjectExample:"Choose a subject",
    subjects:{booking_question:"Rates and availability",change_booking:"Change a booking",cancel_booking:"Cancel a booking",
      hotel_info:"Hotel information",group_booking:"Group booking (more than 2 rooms)",other:"Other"} as Record<ContactSubject,string>,
    messageExample:"Tell us what you're looking for...",
    action:"Send message", sending:"Sending…",
    foot:"We only use your details to reply to your message.",
    email:"Email address",
  };
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const form=event.currentTarget;
    void run(()=>submitContactMessage({
      locale,name:field(form,"contactName"),email:field(form,"contactEmail"),
      subject:field(form,"contactSubject") as ContactSubject,message:field(form,"contactMessage"),
    }),()=>form.reset());
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
      <a className="opal-end-map-link" href={hotelMapUrl} rel="noopener noreferrer" target="_blank">
        {t.map}<Arrow diagonal/>
      </a>
      <span className="opal-end-contact-watermark" aria-hidden="true">OPAL</span>
    </div>
    <div className="opal-end-contact-paper opal-reveal">
      <span className="opal-end-card-kicker">{t.formKicker}</span>
      <h3>{t.formTitle}</h3>
      <form className="opal-end-form opal-end-contact-form" onSubmit={submit} aria-label={c.labels.contactTitle}>
        <div className="opal-end-form-two">
          <label>{c.labels.name}<RequiredMark/>
            <input name="contactName" type="text" autoComplete="name" required maxLength={100}
              placeholder={t.nameExample} onChange={reset}/>
          </label>
          <label>{t.email}<RequiredMark/>
            <input name="contactEmail" type="email" autoComplete="email" required maxLength={254}
              placeholder={t.emailExample} onChange={reset}/>
          </label>
        </div>
        <label>{c.labels.subject}<RequiredMark/>
          <select name="contactSubject" required defaultValue="" onChange={reset}>
            <option value="" disabled>{t.subjectExample}</option>
            {contactSubjects.map(key=><option key={key} value={key}>{t.subjects[key]}</option>)}
          </select>
        </label>
        <label>{c.labels.message}<RequiredMark/>
          <textarea name="contactMessage" rows={5} required maxLength={2000}
            placeholder={t.messageExample} onChange={reset}/>
        </label>
        <button className="opal-end-contact-submit" type="submit" disabled={status.state==="sending"}
          aria-busy={status.state==="sending"}>{status.state==="sending"?t.sending:t.action}<Arrow /></button>
        <FormStatus status={status} sent={t.sent}/>
        <p className="opal-end-form-hint">{t.foot}</p>
      </form>
    </div>
  </div>;
}

export function PremiumFooter({locale,content:c}:Props) {
  const media=useHotelMedia();
  const logoSrc=media.logoSrc??hotelBrand.officialLogoSrc;
  const ar=locale==="ar";
  const t=ar ? {
    top:"ارجع لبداية الحكاية",
    kicker:"اكتشف الأقصر بطريقة مختلفة",
    title:"الحكايات الجميلة", accent:"بتبدأ من هنا.",
    pre:"فندق أوبال ليجاسي", discover:"اكتشف", connect:"روابط سريعة",
    next:"مستعد تكتشف أكثر؟", plan:"خطط لإقامتك", map:"شوف الموقع", language:"English",
    demo:"جميع الحقوق محفوظة",
    credits:"صُمم بهدوء ليبقى في الذاكرة",
  } : {
    top:"BACK TO THE TOP",
    kicker:"A NEW WAY TO FEEL LUXOR",
    title:"Beautiful stories", accent:"begin here.",
    pre:"Opal Legacy Hotel", discover:"EXPLORE", connect:"DISCOVER",
    next:"READY FOR YOUR NEXT STORY?", plan:"PLAN YOUR STAY", map:"FIND US ON THE MAP", language:"العربية",
    demo:"All rights reserved",
    credits:"CONSIDERED DETAILS. LASTING FEELINGS.",
  };
  // Same order as the page sections (and the header menu).
  const ordered=useVisibleSections();
  const explore=ordered.filter((id):id is "overview"|"facilities"|"location"|"rooms"|"gallery"=>
    ["overview","facilities","location","rooms","gallery"].includes(id));
  const other=ordered.filter((id):id is "reviews"|"contact"=>id==="reviews"||id==="contact");
  return <div className="opal-end-footer-inner">
    <div className="opal-end-footer-heading">
      <div><span className="opal-end-footer-kicker">{t.kicker}</span>
        <h2>{t.title} <em>{t.accent}</em></h2></div>
      <a href="#top" className="opal-end-backtop">{t.top}<Arrow up/></a>
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
        {explore.map(key=><a href={`#${key}`} key={key}>{c.nav[key]}</a>)}
      </nav>
      <nav aria-label={t.connect}>
        <h3>{t.connect}</h3>
        {other.map(key=><a href={`#${key}`} key={key}>{c.nav[key]}</a>)}
      </nav>
      <div className="opal-end-footer-last">
        <span>{t.next}</span>
        <a href="#booking">{t.plan}<Arrow/></a>
        <a href={hotelMapUrl} rel="noopener noreferrer" target="_blank">{t.map}<Arrow diagonal/></a>
        <a href={ar?"/en":"/ar"} lang={ar?"en":"ar"} hrefLang={ar?"en":"ar"}>{t.language}</a>
      </div>
    </div>
    <div className="opal-end-footer-bottom">
      <span suppressHydrationWarning>© {new Date().getFullYear()} OPAL LEGACY · LUXOR</span><p>{t.demo}</p><span>{t.credits}</span>
    </div>
  </div>;
}

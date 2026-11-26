"use client";

import Link from "next/link";
import { useEffect,useMemo,useRef,useState,type FormEvent } from "react";
import { useHotelMedia } from "@/components/CmsProvider";
import { DateRangePicker } from "@/components/DateRangePicker";
import { makeOpalApi,OpalApiError,isConfirmed,shouldPoll,paymentDestination,type Gateway,type DayUse,type Accommodation,type Availability,type Booking,type BookingInput,type Guest } from "@/lib/opal-api";
import { nextDay,parseDateStamp,type BookingPreviewInput } from "@/lib/booking-preview";

type Props={locale:"en"|"ar";origin:string;gateway:Gateway;initial:BookingPreviewInput;reference:string};
const sessionKey="opal.active-booking-reference";
const referenceValid=(value:string)=>value.length>0&&value.length<=256&&!/[\x00-\x20\x7f/]/.test(value);
function storeReference(reference:string){try{sessionStorage.setItem(sessionKey,reference);}catch{}}
function savedReference(){try{return sessionStorage.getItem(sessionKey)||"";}catch{return "";}}
function errorText(error:unknown,ar:boolean){
  const status=error instanceof OpalApiError?error.status:0;
  const messages:Record<number,[string,string]>={
    401:["Authentication required.","يلزم تسجيل الدخول."],403:["This action is not permitted.","هذا الإجراء غير متاح."],
    404:["Booking or product not found.","الحجز أو المنتج غير موجود."],
    409:["Availability or payment state changed. Refresh before continuing.","تغير التوافر أو حالة الدفع. حدّث البيانات قبل المتابعة."],
    422:["Check the details and current booking state.","راجع البيانات وحالة الحجز الحالية."],
    429:["Too many requests. Please wait before trying again.","طلبات كثيرة. يرجى الانتظار قبل المحاولة مجددًا."],
    500:["Service temporarily unavailable.","الخدمة غير متاحة مؤقتًا."],
  };
  return (messages[status]??["Unable to verify the request. Please try again later.","تعذر التحقق من الطلب. حاول لاحقًا."])[ar?1:0];
}
function money(value:string,currency:string,ar:boolean){
  // Preserve the API decimal string rather than converting money to floating point.
  return ar?value+" "+currency:currency+" "+value;
}
export function PoolsideBooking({locale,origin,gateway,initial,reference:initialRef}:Props){
  const ar=locale==="ar", t=(en:string,arabic:string)=>ar?arabic:en;
  const media=useHotelMedia();
  const api=useMemo(()=>makeOpalApi(origin,locale),[origin,locale]);
  const [mode,setMode]=useState<"day_use"|"bubble_stay">("bubble_stay");
  const [days,setDays]=useState<DayUse[]>([]);
  const [stays,setStays]=useState<Accommodation[]>([]);
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [catalogError,setCatalogError]=useState("");
  const [catalogVersion,setCatalogVersion]=useState(0);
  const [dayId,setDayId]=useState<number|null>(null);
  const [typeId,setTypeId]=useState<number|null>(null);
  const [today,setToday]=useState("");
  const [checkIn,setCheckIn]=useState(initial.checkin);
  const [checkOut,setCheckOut]=useState(initial.checkout);
  const [visit,setVisit]=useState(initial.checkin);
  const [guests,setGuests]=useState(Math.max(1,initial.adults+initial.children));
  const [availability,setAvailability]=useState<Availability|null>(null);
  const [availabilityKey,setAvailabilityKey]=useState("");
  const [bubble,setBubble]=useState<number|null>(null);
  const [availabilityLoading,setAvailabilityLoading]=useState(false);
  const [guest,setGuest]=useState<Guest>({guest_name:"",guest_email:"",guest_phone:""});
  const [fields,setFields]=useState<Record<string,string[]>>({});
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const lock=useRef(false);
  const [reference,setReference]=useState(referenceValid(initialRef)?initialRef:"");
  const [lookup,setLookup]=useState("");
  const [booking,setBooking]=useState<Booking|null>(null);
  const [pollError,setPollError]=useState("");
  const [pollVersion,setPollVersion]=useState(0);
  const [now,setNow]=useState(0);
  const [unknownCreate,setUnknownCreate]=useState(false);
  const day=days.find(x=>x.id===dayId);
  const stay=stays.find(x=>x.id===typeId);
  const selectionKey=JSON.stringify([typeId,checkIn,checkOut,guests]);
  const availabilityCurrent=availabilityKey===selectionKey&&availability?.availability===true;
  const validStay=Boolean(today&&parseDateStamp(checkIn)!==null&&parseDateStamp(checkOut)!==null&&checkIn>=today&&checkOut>checkIn&&stay&&guests<=stay.max_guests&&Number.isInteger(guests)&&guests>=1);
  useEffect(()=>{
    const current=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());setToday(current);setNow(Date.now());
    setVisit(v=>parseDateStamp(v)!==null&&v>=current?v:current);
    const start=parseDateStamp(initial.checkin)!==null&&initial.checkin>=current?initial.checkin:current;
    setCheckIn(start);setCheckOut(v=>parseDateStamp(v)!==null&&v>start?v:nextDay(start));
    if(!reference){const saved=savedReference();if(referenceValid(saved))setLookup(saved);}
    const tick=setInterval(()=>setNow(Date.now()),1000);
    return()=>clearInterval(tick);
    // Only initialize once; an entered reference is never replaced by storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    if(reference)return;
    const controller=new AbortController();
    setCatalogLoading(true);setCatalogError("");
    Promise.all([api.dayUse(controller.signal),api.accommodations(controller.signal)]).then(([d,s])=>{
      if(controller.signal.aborted)return;
      if(!Array.isArray(d)||!Array.isArray(s))throw new Error("Invalid catalog");
      setDays(d.filter(p=>p.is_active));setStays(s.filter(p=>p.is_active));
      setDayId(old=>d.some(p=>p.id===old&&p.is_active)?old:d.find(p=>p.is_active)?.id??null);
      setTypeId(old=>s.some(p=>p.id===old&&p.is_active)?old:s.find(p=>p.is_active)?.id??null);
    }).catch(e=>{if(!controller.signal.aborted)setCatalogError(errorText(e,ar));}).finally(()=>{if(!controller.signal.aborted)setCatalogLoading(false);});
    return()=>controller.abort();
  },[api,ar,reference,catalogVersion]);
  useEffect(()=>{
    setAvailability(null);setAvailabilityKey("");setBubble(null);setAvailabilityLoading(false);
    if(reference||mode!=="bubble_stay"||!stay||!validStay)return;
    const controller=new AbortController();
    setAvailabilityLoading(true);setError("");
    const timer=setTimeout(()=>{
      api.availability(stay.slug_en,checkIn,checkOut,guests,controller.signal).then(result=>{
        if(controller.signal.aborted)return;setAvailability(result);setAvailabilityKey(selectionKey);
      }).catch(e=>{if(!controller.signal.aborted)setError(errorText(e,ar));}).finally(()=>{if(!controller.signal.aborted)setAvailabilityLoading(false);});
    },400);
    return()=>{clearTimeout(timer);controller.abort();};
  },[api,ar,reference,mode,stay,validStay,checkIn,checkOut,guests,selectionKey]);
  useEffect(()=>{
    if(!reference)return;
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>|undefined, attempts=0;
    const poll=async()=>{
      try{
        const b=await api.booking(reference,controller.signal);
        if(controller.signal.aborted)return;
        setBooking(b);setPollError("");attempts++;
        if(shouldPoll(b.status)&&attempts<60)timer=setTimeout(poll,5000);
        else if(shouldPoll(b.status))setPollError(ar?"التحقق مستمر لدى الفندق. يمكنك تحديث الحالة.":"Verification is still pending. You can refresh the status.");
      }catch(e){
        if(controller.signal.aborted)return;
        setPollError(errorText(e,ar));attempts++;
        if(attempts<60&&(!(e instanceof OpalApiError)||![401,403,404,422].includes(e.status))){
          const delay=e instanceof OpalApiError&&e.retryAfter?Math.max(5000,e.retryAfter*1000):10000;
          timer=setTimeout(poll,delay);
        }
      }
    };
    void poll();
    return()=>{controller.abort();if(timer)clearTimeout(timer);};
  },[api,ar,reference,pollVersion]);
  function openReference(value:string){
    const clean=value.trim();if(!referenceValid(clean))return;
    setReference(clean);setBooking(null);setPollError("");storeReference(clean);
    const url=new URL(window.location.href);url.searchParams.set("reference",clean);window.history.replaceState(null,"",url);
  }
  function reset(){
    setReference("");setBooking(null);setPollError("");setError("");setLookup("");setUnknownCreate(false);
    try{sessionStorage.removeItem(sessionKey);}catch{}
    const url=new URL(window.location.href);url.searchParams.delete("reference");window.history.replaceState(null,"",url);
  }
  async function create(e:FormEvent){
    e.preventDefault();if(lock.current||unknownCreate||catalogLoading||catalogError)return;
    let input:BookingInput;
    if(!Number.isInteger(guests)||guests<1)return;
    const details={guest_name:guest.guest_name.trim(),guest_email:guest.guest_email.trim(),guest_phone:guest.guest_phone.trim()};
    if(!details.guest_name||!details.guest_email||!details.guest_phone)return;
    if(mode==="day_use"){
      if(!day||!today||parseDateStamp(visit)===null||visit<today)return;
      input={...details,product_type:"day_use",guests,visit_date:visit,day_use_product_id:day.id};
    }else{
      if(!stay||!validStay||!availabilityCurrent||!availability|| (bubble!==null&&!availability.bubbles.some(b=>b.id===bubble)))return;
      input={...details,product_type:"bubble_stay",guests,check_in:checkIn,check_out:checkOut,random_assignment:bubble===null,bubbles:[{accommodation_type_id:stay.id,bubble_id:bubble,guests}]};
    }
    lock.current=true;setBusy(true);setError("");setFields({});
    try{
      const created=await api.create(input);
      if(!referenceValid(created.booking_reference))throw new Error("Missing reference");
      openReference(created.booking_reference);setBooking(created);setGuest({guest_name:"",guest_email:"",guest_phone:""});
    }catch(e){
      setError(errorText(e,ar));if(e instanceof OpalApiError)setFields(e.fields);
      if(!(e instanceof OpalApiError)||e.status===0||e.status>=500)setUnknownCreate(true);
      if(e instanceof OpalApiError&&e.status===409){setAvailability(null);setAvailabilityKey("");setCatalogVersion(v=>v+1);}
    }finally{lock.current=false;setBusy(false);}
  }
  async function pay(){
    if(lock.current||!booking||booking.status!=="pending_payment"||!reference||expired)return;
    lock.current=true;setBusy(true);setError("");
    try{
      const data=await api.pay(reference,gateway);
      storeReference(reference);
      window.location.assign(paymentDestination(data.payment_url,gateway,origin));
    }catch(e){setError(errorText(e,ar));setPollVersion(v=>v+1);}
    finally{lock.current=false;setBusy(false);}
  }
  const expires=booking?.payment_expires_at?Date.parse(booking.payment_expires_at):NaN;
  const remaining=Number.isFinite(expires)&&now?Math.max(0,Math.ceil((expires-now)/1000)):null;
  const expired=remaining===0;
  const statusNames:Record<string,[string,string]>={
    pending_payment:["Awaiting payment","في انتظار الدفع"],paid:["Payment under verification","جارٍ التحقق من الدفع"],
    confirmed:["Booking confirmed","تم تأكيد الحجز"],checked_in:["Checked in","تم تسجيل الوصول"],
    pending_check_out:["Awaiting check-out","في انتظار المغادرة"],checked_out:["Checked out","تم تسجيل المغادرة"],completed:["Completed","مكتمل"],
    failed:["Payment failed","فشل الدفع"],cancelled:["Cancelled","ملغي"],expired:["Expired","منتهي"],no_show:["No show","لم يحضر الضيف"]
  };
  const fieldLabels:Record<string,string>={guest_name:t("Full name","الاسم الكامل"),guest_email:t("Email","البريد الإلكتروني"),guest_phone:t("Phone","رقم الهاتف")};
  const langQuery=new URLSearchParams(); if(reference)langQuery.set("reference",reference);
  return <>
    <header className="opal-book-header"><div className="opal-book-header-inner">
      <Link href={`/${locale}`} className="opal-book-brand">{media.logoSrc?<img src={media.logoSrc} alt="" width={43} height={43}/>:<span className="opal-book-mark">O</span>}<strong>OPAL POOLSIDE</strong><small>LUXOR · EGYPT</small></Link>
      <nav className="opal-book-header-links"><Link href={`/${locale}`} className="opal-header-home">{t("Home","الرئيسية")}</Link><Link className="opal-book-lang" href={`/${ar?"en":"ar"}/booking?${langQuery}`}>{ar?"English":"العربية"}</Link></nav>
    </div></header>
    <main className="opal-book-page" id="booking-main">
      <div className="opal-book-introduction"><div className="opal-book-introduction-main"><span className="opal-book-eyebrow">OPAL POOLSIDE</span><h1>{reference?t("Your booking","حجزك"):t("Book your experience","احجز تجربتك")}</h1><p>{t("Choose your experience and complete secure payment.","اختر تجربتك وأكمل الدفع الآمن.")}</p></div></div>
      {reference?<div className="opal-book-workspace">
        <p className="opal-book-helper">{t("Booking reference","مرجع الحجز")}: <strong dir="ltr">{reference}</strong></p>
        {booking?<><h2 role="status">{statusNames[booking.status]?.[ar?1:0]??booking.status}</h2>
          <div className="opal-book-review-lines"><div><span>{t("Booking code","كود الحجز")}</span><strong dir="ltr">{booking.booking_code}</strong></div><div><span>{t("Total","الإجمالي")}</span><strong dir="ltr">{money(booking.total,booking.currency,ar)}</strong></div></div>
          {booking.status==="pending_payment"&&<><p>{remaining!==null?(expired?t("Payment window ended; refresh status.","انتهت مهلة الدفع؛ حدّث الحالة."):t("Payment time remaining: ","الوقت المتبقي للدفع: ")+Math.floor(remaining/60)+":"+String(remaining%60).padStart(2,"0")):t("Awaiting payment","في انتظار الدفع")}</p>
            <button className="opal-book-primary" type="button" disabled={busy||expired||!!pollError} onClick={()=>void pay()}>{busy?t("Opening payment…","جارٍ فتح الدفع…"):t("Continue to payment","المتابعة للدفع")}</button></>}
          {booking.status==="paid"&&<p>{t("Payment is being verified. Do not pay again.","الدفع قيد التحقق. لا تدفع مرة أخرى.")}</p>}
          {isConfirmed(booking.status)&&<><p>{t("Show your booking code at arrival. The hotel sends the booking pass by email.","اعرض كود الحجز عند الوصول. يرسل الفندق بطاقة الحجز بالبريد الإلكتروني.")}</p>{booking.tickets?.map(ticket=><p key={ticket.ticket_code} dir="ltr">{ticket.ticket_code}</p>)}</>}
        </>:<p role="status">{t("Checking booking status…","جارٍ التحقق من حالة الحجز…")}</p>}
        {pollError&&<p className="opal-book-error" role="alert">{pollError}</p>}{error&&<p className="opal-book-error" role="alert">{error}</p>}
        <div className="opal-book-actions"><button className="opal-book-back" type="button" disabled={busy} onClick={()=>setPollVersion(v=>v+1)}>{t("Refresh status","تحديث الحالة")}</button>{((booking&&!shouldPoll(booking.status))||(!booking&&!!pollError))&&<button className="opal-book-back" type="button" onClick={reset}>{t("New booking","حجز جديد")}</button>}</div>
      </div>:<>
      <form className="opal-book-details" onSubmit={e=>{e.preventDefault();openReference(lookup);}}><label>{t("Already have a booking? Enter reference","عندك حجز؟ أدخل المرجع")}<input dir="ltr" value={lookup} onChange={e=>setLookup(e.target.value)} maxLength={256}/></label><button className="opal-book-back" type="submit" disabled={!referenceValid(lookup.trim())}>{t("Find booking","عرض الحجز")}</button></form>
      {catalogLoading?<p role="status">{t("Loading experiences…","جارٍ تحميل التجارب…")}</p>:catalogError?<div role="alert"><p>{catalogError}</p><button className="opal-book-back" onClick={()=>setCatalogVersion(v=>v+1)}>{t("Retry","حاول مرة أخرى")}</button></div>:
      <div className="opal-book-layout"><form className="opal-book-workspace opal-book-details" onSubmit={create}>
        <fieldset disabled={busy||unknownCreate} style={{border:0,padding:0,margin:0,minWidth:0}}>
        <div className="opal-book-actions"><button className="opal-book-back" aria-pressed={mode==="day_use"} type="button" onClick={()=>{setMode("day_use");setError("");setFields({});}}>{t("Day Use","استخدام يومي")}</button><button className="opal-book-back" aria-pressed={mode==="bubble_stay"} type="button" onClick={()=>{setMode("bubble_stay");setError("");setFields({});}}>{t("Overnight Stay","إقامة ليلية")}</button></div>
        <div className="opal-book-field-grid">
          {mode==="day_use"?<><label>{t("Experience","التجربة")}<select value={dayId??""} onChange={e=>setDayId(Number(e.target.value))}>{days.map(p=><option value={p.id} key={p.id}>{ar?p.name_ar:p.name_en}</option>)}</select></label><label>{t("Visit date","تاريخ الزيارة")}<input type="date" min={today} required value={visit} onChange={e=>setVisit(e.target.value)}/></label></>:
          <><label>{t("Accommodation","نوع الإقامة")}<select value={typeId??""} onChange={e=>setTypeId(Number(e.target.value))}>{stays.map(p=><option key={p.id} value={p.id}>{ar?p.name_ar:p.name_en}</option>)}</select></label></>}
          <label>{t("Guests","عدد الضيوف")}<input type="number" min={1} max={mode==="bubble_stay"?stay?.max_guests:undefined} step={1} required value={guests} onChange={e=>setGuests(Number(e.target.value))}/></label>
        </div>
        {mode==="bubble_stay"&&<><DateRangePicker variant="page" locale={locale} checkin={checkIn} checkout={checkOut} min={today} labels={{checkin:t("Check-in","الوصول"),checkout:t("Check-out","المغادرة")}} onChange={r=>{setCheckIn(r.checkin);setCheckOut(r.checkout);}}/>
          {availabilityLoading?<p role="status">{t("Checking availability…","جارٍ التحقق من التوافر…")}</p>:availabilityCurrent&&availability?<><p role="status">{t("Available units","الوحدات المتاحة")}: {availability.available_bubbles}</p><label>{t("Bubble assignment","اختيار الوحدة")}<select value={bubble??""} onChange={e=>setBubble(e.target.value?Number(e.target.value):null)}><option value="">{t("Automatically assign a unit","اختيار تلقائي")}</option>{availability.bubbles.map(b=><option value={b.id} key={b.id}>{b.code}</option>)}</select></label></>:<p role="status">{t("Select valid dates and guest count to check availability.","اختر تواريخ وعدد ضيوف مناسبًا للتحقق من التوافر.")}</p>}
          <p className="opal-book-helper">{t("One accommodation unit per online booking in this initial release.","الحجز الإلكتروني في هذه المرحلة لوحدة إقامة واحدة.")}</p></>}
        <div className="opal-book-field-grid">{(Object.keys(guest) as (keyof Guest)[]).map(key=><label key={key}>{fieldLabels[key]}<input required name={key} type={key==="guest_email"?"email":key==="guest_phone"?"tel":"text"} autoComplete={key==="guest_name"?"name":key==="guest_email"?"email":"tel"} value={guest[key]} onChange={e=>{setGuest(v=>({...v,[key]:e.target.value}));setFields(v=>({...v,[key]:[]}));}} aria-invalid={!!fields[key]?.length}/>{fields[key]?.map((message,i)=><span key={i} className="opal-book-error">{message}</span>)}</label>)}</div>
        </fieldset>
        {Object.entries(fields).filter(([key])=>!(key in guest)).map(([key,errors])=><p className="opal-book-error" key={key}>{key}: {errors.join(" · ")}</p>)}
        {error&&<p role="alert" className="opal-book-error">{error}</p>}
        {unknownCreate&&<p role="alert">{t("The booking result is uncertain. Do not submit again; contact the hotel to verify.","نتيجة إنشاء الحجز غير مؤكدة. لا تكرر الطلب؛ تواصل مع الفندق للتحقق.")}</p>}
        <button className="opal-book-primary" type="submit" disabled={busy||unknownCreate||!today||guests<1||!Number.isInteger(guests)||(mode==="day_use"?(!day||parseDateStamp(visit)===null||visit<today):(!validStay||!availabilityCurrent))}>{busy?t("Creating booking…","جارٍ إنشاء الحجز…"):t("Create booking & review total","إنشاء الحجز ومراجعة الإجمالي")}</button>
      </form><aside className="opal-book-summary"><div className="opal-book-summary-top"><span className="opal-book-eyebrow">{t("Your experience","تجربتك")}</span></div>
        <h2>{mode==="day_use"?(ar?day?.name_ar:day?.name_en):(ar?stay?.name_ar:stay?.name_en)}</h2>
        <p>{mode==="day_use"?(ar?day?.description_ar:day?.description_en):(ar?stay?.description_ar:stay?.description_en)}</p>
        <div className="opal-book-summary-rows">{mode==="day_use"&&day?<div><span>{t("Per guest","للفرد")}</span><strong dir="ltr">{money(day.price_per_guest,day.currency,ar)}</strong></div>:stay?<div><span>{t("Per night","لليلة")}</span><strong dir="ltr">{money(stay.price_per_night,stay.currency,ar)}</strong></div>:null}
        {mode==="bubble_stay"&&availabilityCurrent&&availability&&<div><span>{t("Estimated total","الإجمالي المتوقع")}</span><strong dir="ltr">{money(availability.total_estimate,availability.currency,ar)}</strong></div>}</div>
        <p className="opal-book-helper">{t("The final price is calculated by the booking system before payment.","يحدد نظام الحجز السعر النهائي قبل الدفع.")}</p>
      </aside></div>}
      </>}
    </main>
  </>;
}

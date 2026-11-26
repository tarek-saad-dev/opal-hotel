"use client";

import Link from "next/link";
import { useEffect,useMemo,useRef,useState,type FormEvent } from "react";
import { useHotelMedia } from "@/components/CmsProvider";
import "./poolside-booking.css";
import { bookingStatusCopy } from "@/lib/poolside-status";
import { PoolsidePass } from "@/components/PoolsidePass";
import { DateRangePicker } from "@/components/DateRangePicker";
import { makeOpalApi,OpalApiError,isConfirmed,shouldPoll,paymentDestination,type Gateway,type DayUse,type Accommodation,type Availability,type Booking,type BookingInput,type Guest } from "@/lib/opal-api";
import { allocations,validUnits,MAX_ONLINE_UNITS,type UnitSelection,type UnitAvailability } from "@/lib/poolside-allocation";
import { nextDay,parseDateStamp,type BookingPreviewInput } from "@/lib/booking-preview";

type Props={locale:"en"|"ar";origin:string;gateway:Gateway;initial:BookingPreviewInput;reference:string;product?:"day_use"|"bubble_stay";slug?:string};
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
export function PoolsideBooking({locale,origin,gateway,initial,reference:initialRef,product="bubble_stay",slug=""}:Props){
  const ar=locale==="ar", t=(en:string,arabic:string)=>ar?arabic:en;
  const media=useHotelMedia();
  const api=useMemo(()=>makeOpalApi(origin,locale),[origin,locale]);
  const [mode,setMode]=useState<"day_use"|"bubble_stay">(product);
  const [days,setDays]=useState<DayUse[]>([]);
  const [stays,setStays]=useState<Accommodation[]>([]);
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [catalogError,setCatalogError]=useState("");
  const [catalogVersion,setCatalogVersion]=useState(0);
  const [dayId,setDayId]=useState<number|null>(null);
  const [units,setUnits]=useState<UnitSelection[]>([{key:1,typeId:null,guests:Math.max(1,initial.adults+initial.children),bubbleId:null}]);
  const nextUnitKey=useRef(2);
  const [automatic,setAutomatic]=useState(true);
  const [selectionNotice,setSelectionNotice]=useState("");
  const initialSelection=useRef(true);
  const [today,setToday]=useState("");
  const [checkIn,setCheckIn]=useState(initial.checkin);
  const [checkOut,setCheckOut]=useState(initial.checkout);
  const [visit,setVisit]=useState(initial.checkin);
  const [guests,setGuests]=useState(Math.max(1,initial.adults+initial.children));
  const [availability,setAvailability]=useState<UnitAvailability>({});
  const [availabilityKey,setAvailabilityKey]=useState("");
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
  const stay=stays.find(x=>x.id===units[0]?.typeId);
  const stayGuests=units.reduce((sum,u)=>sum+u.guests,0);
  const selectionKey=JSON.stringify([checkIn,checkOut,units.map(({key,typeId,guests})=>({key,typeId,guests}))]);
  const selectedAllocations=availabilityKey===selectionKey?allocations(units,availability,automatic):null;
  const availabilityCurrent=selectedAllocations!==null;
  const validStay=Boolean(today&&parseDateStamp(checkIn)!==null&&parseDateStamp(checkOut)!==null&&checkIn>=today&&checkOut>checkIn&&validUnits(units,stays));
  function editUnit(key:number,patch:Partial<Omit<UnitSelection,"key">>){
    setUnits(old=>old.map(u=>u.key===key?{...u,...patch,...("typeId" in patch||"guests" in patch?{bubbleId:null}:{})}:u));
    setSelectionNotice("");setError("");setFields({});
  }
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
      const requested=initialSelection.current;
      initialSelection.current=false;
      const selectedDay=requested&&product==="day_use"&&slug?d.find(p=>p.slug===slug&&p.is_active):undefined;
      const selectedStay=requested&&product==="bubble_stay"&&slug?s.find(p=>p.slug_en===slug&&p.is_active):undefined;
      const missingDay=requested&&product==="day_use"&&!!slug&&!selectedDay;
      const missingStay=requested&&product==="bubble_stay"&&!!slug&&!selectedStay;
      if(missingDay||missingStay)setSelectionNotice(ar?"التجربة المختارة غير متاحة حاليًا. اختر تجربة أخرى.":"The selected experience is unavailable. Please choose another.");
      setDayId(old=>missingDay?null:selectedDay?.id??(d.some(p=>p.id===old&&p.is_active)?old:d.find(p=>p.is_active)?.id??null));
      setUnits(old=>old.map((u,i)=>({...u,typeId:i===0&&missingStay?null:(i===0?selectedStay?.id:undefined)??(s.some(p=>p.id===u.typeId&&p.is_active)?u.typeId:requested?s.find(p=>p.is_active)?.id??null:null),bubbleId:null})));
    }).catch(e=>{if(!controller.signal.aborted)setCatalogError(errorText(e,ar));}).finally(()=>{if(!controller.signal.aborted)setCatalogLoading(false);});
    return()=>controller.abort();
  },[api,ar,reference,catalogVersion,product,slug]);
  useEffect(()=>{
    setAvailability({});setAvailabilityKey("");setAvailabilityLoading(false);
    setUnits(old=>old.map(u=>u.bubbleId===null?u:{...u,bubbleId:null}));
    if(reference||mode!=="bubble_stay"||!validStay)return;
    const controller=new AbortController();
    const [, , requested]=JSON.parse(selectionKey) as [string,string,Pick<UnitSelection,"key"|"typeId"|"guests">[]];
    setAvailabilityLoading(true);
    const timer=setTimeout(()=>{
      const requests=new Map<string,Promise<Availability>>();
      Promise.all(requested.map(async u=>{
        const type=stays.find(p=>p.id===u.typeId)!;
        const key=type.slug_en+":"+u.guests;
        if(!requests.has(key))requests.set(key,api.availability(type.slug_en,checkIn,checkOut,u.guests,controller.signal));
        return [u.key,await requests.get(key)!] as const;
      })).then(results=>{
        if(controller.signal.aborted)return;
        setAvailability(Object.fromEntries(results));setAvailabilityKey(selectionKey);
      }).catch(e=>{if(!controller.signal.aborted)setError(errorText(e,ar));}).finally(()=>{if(!controller.signal.aborted)setAvailabilityLoading(false);});
    },400);
    return()=>{clearTimeout(timer);controller.abort();};
  },[api,ar,reference,mode,stays,validStay,checkIn,checkOut,selectionKey,catalogVersion]);
  useEffect(()=>{
    if(!reference)return;
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>|undefined, attempts=0;
    const poll=async()=>{
      try{
        const b=await api.booking(reference,controller.signal);
        if(controller.signal.aborted)return;
        setBooking(b);setPollError("");storeReference(reference);attempts++;
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
    setReference(clean);setBooking(null);setPollError("");
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
    if(mode==="day_use"&&(!Number.isInteger(guests)||guests<1))return;
    const details={guest_name:guest.guest_name.trim(),guest_email:guest.guest_email.trim(),guest_phone:guest.guest_phone.trim()};
    if(!details.guest_name||!details.guest_email||!details.guest_phone)return;
    if(mode==="day_use"){
      if(!day||!today||parseDateStamp(visit)===null||visit<today)return;
      input={...details,product_type:"day_use",guests,visit_date:visit,day_use_product_id:day.id};
    }else{
      if(!validStay||!selectedAllocations)return;
      input={...details,product_type:"bubble_stay",guests:stayGuests,check_in:checkIn,check_out:checkOut,random_assignment:automatic,bubbles:selectedAllocations};
    }
    lock.current=true;setBusy(true);setError("");setFields({});
    try{
      const created=await api.create(input);
      if(!referenceValid(created.booking_reference))throw new Error("Missing reference");
      openReference(created.booking_reference);storeReference(created.booking_reference);setBooking(created);setGuest({guest_name:"",guest_email:"",guest_phone:""});
    }catch(e){
      setError(errorText(e,ar));if(e instanceof OpalApiError)setFields(e.fields);
      if(!(e instanceof OpalApiError)||e.status===0||e.status>=500)setUnknownCreate(true);
      if(e instanceof OpalApiError&&e.status===409){setAvailability({});setAvailabilityKey("");setCatalogVersion(v=>v+1);}
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
  const status=booking?bookingStatusCopy[booking.status]:undefined;
  const countdown=remaining===null?null:Math.floor(remaining/60)+":"+String(remaining%60).padStart(2,"0");
  const fieldLabels:Record<string,string>={guest_name:t("Full name","الاسم الكامل"),guest_email:t("Email","البريد الإلكتروني"),guest_phone:t("Phone","رقم الهاتف")};
  const langQuery=new URLSearchParams(); if(reference)langQuery.set("reference",reference);
  else {langQuery.set("product",mode);const selectedSlug=mode==="day_use"?day?.slug:stay?.slug_en;if(selectedSlug)langQuery.set("slug",selectedSlug);langQuery.set("checkin",mode==="day_use"?visit:checkIn);langQuery.set("checkout",checkOut);langQuery.set("adults",String(mode==="day_use"?guests:units[0]?.guests??1));}
  const selectedSlug=mode==="day_use"?day?.slug:stay?.slug_en;
  const productMedia=selectedSlug?media.roomMedia[selectedSlug]:undefined;
  const cover=productMedia?[productMedia.cover,...productMedia.gallery].find(i=>media.isReal(i)):undefined;
  return <>
    <header className="opal-book-header"><div className="opal-book-header-inner">
      <Link href={`/${locale}`} className="opal-book-brand">{media.logoSrc?<img src={media.logoSrc} alt="" width={43} height={43}/>:<span className="opal-book-mark">O</span>}<strong>OPAL POOLSIDE</strong><small>LUXOR · EGYPT</small></Link>
      <nav className="opal-book-header-links"><Link href={`/${locale}`} className="opal-header-home">{t("Home","الرئيسية")}</Link><Link className="opal-book-lang" href={`/${ar?"en":"ar"}/booking?${langQuery}`}>{ar?"English":"العربية"}</Link></nav>
    </div></header>
    <main className="opal-book-page" id="booking-main">
      <div className="opal-book-introduction"><div className="opal-book-introduction-main"><span className="opal-book-eyebrow">OPAL POOLSIDE</span><h1>{reference?t("Your booking","حجزك"):t("Book your experience","احجز تجربتك")}</h1><p>{t("Choose your experience and complete secure payment.","اختر تجربتك وأكمل الدفع الآمن.")}</p></div></div>
      <ol className="opal-pool-step" aria-label={t("Booking progress","مراحل الحجز")}><li aria-current={!reference?"step":undefined}>{t("1. Choose experience","١. اختيار التجربة")}</li><li aria-current={reference&&!isConfirmed(booking?.status??"pending_payment")?"step":undefined}>{t("2. Review & pay","٢. مراجعة ودفع")}</li><li aria-current={booking&&isConfirmed(booking.status)?"step":undefined}>{t("3. Booking pass","٣. بطاقة الحجز")}</li></ol>
      {reference?<div className="opal-book-workspace">
        <p className="opal-book-helper">{t("Booking reference","مرجع الحجز")}: <strong dir="ltr">{reference}</strong></p>
        {booking?<><div className="opal-pool-status" data-tone={status?.tone??"waiting"} role="status"><span className="opal-pool-status-mark" aria-hidden="true">{status?.tone==="success"?"✓":status?.tone==="error"?"!":status?.tone==="closed"?"—":"◷"}</span><div><span className="opal-book-eyebrow">{t("BOOKING STATUS","حالة الحجز")}</span><h2>{status?.title[ar?1:0]??t("Status unavailable","الحالة غير متاحة")}</h2><p>{status?.message[ar?1:0]??t("Refresh to verify the booking state.","حدّث الحالة للتحقق من الحجز.")}</p></div></div>
          <div className="opal-book-review-lines"><div><span>{t("Guests","الضيوف")}</span><strong dir="ltr">{booking.guests}</strong></div><div><span>{t("Booking code","كود الحجز")}</span><strong dir="ltr">{booking.booking_code}</strong></div><div><span>{t("Total","الإجمالي")}</span><strong dir="ltr">{money(booking.total,booking.currency,ar)}</strong></div></div>
          {booking.status==="pending_payment"&&<><div className="opal-pool-payment-clock"><div><strong>{expired?t("Payment window ended","انتهت مهلة الدفع"):t("Payment window","مهلة الدفع")}</strong><p>{expired?t("Refresh to verify the final state before making a new booking.","حدّث الحالة للتحقق قبل حجز جديد."):t("The total below is calculated by the hotel system.","الإجمالي محسوب من نظام حجوزات الفندق.")}</p></div>{countdown!==null&&<strong className="opal-pool-countdown" dir="ltr">{countdown}</strong>}</div>
            <button className="opal-book-primary" type="button" disabled={busy||expired||!!pollError} onClick={()=>void pay()}>{busy?t("Opening payment…","جارٍ فتح الدفع…"):t("Continue to payment","المتابعة للدفع")}</button></>}
          
          {isConfirmed(booking.status)&&<PoolsidePass booking={booking} origin={origin} locale={locale}/>}
        </>:<div className="opal-pool-status" data-tone="waiting" role="status"><span className="opal-pool-status-mark" aria-hidden="true">◷</span><div><h2>{t("Checking booking status…","جارٍ التحقق من حالة الحجز…")}</h2><p>{t("Only the hotel system can confirm payment.","تأكيد الدفع يتم من نظام الفندق فقط.")}</p></div></div>}
        {pollError&&<p className="opal-book-error" role="alert">{pollError}</p>}{error&&<p className="opal-book-error" role="alert">{error}</p>}
        <div className="opal-book-actions"><button className="opal-book-back" type="button" disabled={busy} onClick={()=>setPollVersion(v=>v+1)}>{t("Refresh status","تحديث الحالة")}</button>{((booking&&!shouldPoll(booking.status))||(!booking&&!!pollError))&&<button className="opal-book-back" type="button" onClick={reset}>{t("New booking","حجز جديد")}</button>}</div>
      </div>:<>
      <form className="opal-book-details opal-pool-recovery" onSubmit={e=>{e.preventDefault();openReference(lookup);}}><label>{t("Already have a booking? Enter reference","عندك حجز؟ أدخل المرجع")}<input dir="ltr" value={lookup} onChange={e=>setLookup(e.target.value)} maxLength={256}/></label><button className="opal-book-back" type="submit" disabled={!referenceValid(lookup.trim())}>{t("Find booking","عرض الحجز")}</button></form>
      {catalogLoading?<p role="status">{t("Loading experiences…","جارٍ تحميل التجارب…")}</p>:catalogError?<div role="alert"><p>{catalogError}</p><button className="opal-book-back" onClick={()=>setCatalogVersion(v=>v+1)}>{t("Retry","حاول مرة أخرى")}</button></div>:
      <div className="opal-book-layout"><form className="opal-book-workspace opal-book-details" onSubmit={create}>
        <fieldset disabled={busy||unknownCreate} style={{border:0,padding:0,margin:0,minWidth:0}}>
        <div className="opal-book-actions"><button className="opal-book-back" aria-pressed={mode==="day_use"} type="button" onClick={()=>{setMode("day_use");setError("");setFields({});}}>{t("Day Use","استخدام يومي")}</button><button className="opal-book-back" aria-pressed={mode==="bubble_stay"} type="button" onClick={()=>{setMode("bubble_stay");setError("");setFields({});}}>{t("Overnight Stay","إقامة ليلية")}</button></div>
        {selectionNotice&&<p role="alert" className="opal-book-error">{selectionNotice}</p>}
        <div className="opal-book-field-grid">
          {mode==="day_use"?<><label>{t("Experience","التجربة")}<select value={dayId??""} onChange={e=>{setDayId(e.target.value?Number(e.target.value):null);setSelectionNotice("");}}><option value="">{t("Choose experience","اختر التجربة")}</option>{days.map(p=><option value={p.id} key={p.id}>{ar?p.name_ar:p.name_en}</option>)}</select></label><label>{t("Visit date","تاريخ الزيارة")}<input type="date" min={today} required value={visit} onChange={e=>setVisit(e.target.value)}/></label></>:
          null}
          {mode==="day_use"&&<label>{t("Guests","عدد الضيوف")}<input type="number" min={1} step={1} required value={guests} onChange={e=>setGuests(Number(e.target.value))}/></label>}
        </div>
        {mode==="bubble_stay"&&<>
          <DateRangePicker variant="page" locale={locale} checkin={checkIn} checkout={checkOut} min={today} labels={{checkin:t("Check-in","الوصول"),checkout:t("Check-out","المغادرة")}} onChange={r=>{setCheckIn(r.checkin);setCheckOut(r.checkout);}}/>
          <div className="opal-pool-units">
            <h2>{t("Your accommodation units","وحدات الإقامة")}</h2>
            <label className="opal-pool-assignment"><input type="checkbox" checked={automatic} onChange={e=>{setAutomatic(e.target.checked);setUnits(old=>old.map(u=>({...u,bubbleId:null})));}}/>{t("Automatically assign all units","اختيار كل الوحدات تلقائيًا")}</label>
            {units.map((u,i)=>{
              const type=stays.find(p=>p.id===u.typeId);
              const result=availabilityKey===selectionKey?availability[u.key]:undefined;
              return <section className="opal-pool-unit" key={u.key} aria-label={t("Unit ","الوحدة ")+(i+1)}>
                <div className="opal-pool-unit-head"><strong>{t("Unit","وحدة")} {i+1}</strong>{units.length>1&&<button type="button" className="opal-book-back" onClick={()=>setUnits(old=>old.filter(x=>x.key!==u.key))}>{t("Remove","حذف")}</button>}</div>
                <div className="opal-book-field-grid">
                  <label>{t("Accommodation","نوع الإقامة")}<select value={u.typeId??""} onChange={e=>editUnit(u.key,{typeId:e.target.value?Number(e.target.value):null})}><option value="">{t("Choose accommodation","اختر نوع الإقامة")}</option>{stays.map(p=><option key={p.id} value={p.id}>{ar?p.name_ar:p.name_en}</option>)}</select></label>
                  <label>{t("Guests in this unit","ضيوف الوحدة")}<input type="number" min={1} max={type?.max_guests} step={1} required value={u.guests} onChange={e=>editUnit(u.key,{guests:Number(e.target.value)})}/></label>
                </div>
                {result&&<p role="status">{result.availability?t("Available units of this type: ","الوحدات المتاحة من النوع: ")+result.available_bubbles:t("No availability for this selection.","لا يوجد توافر لهذا الاختيار.")}</p>}
                {!automatic&&result?.availability&&<label>{t("Choose physical unit","اختر الوحدة الفعلية")}<select required value={u.bubbleId??""} onChange={e=>editUnit(u.key,{bubbleId:e.target.value?Number(e.target.value):null})}><option value="">{t("Choose unit","اختر الوحدة")}</option>{result.bubbles.filter(b=>b.accommodation_type_id===u.typeId).map(b=><option key={b.id} value={b.id} disabled={units.some(x=>x.key!==u.key&&x.bubbleId===b.id)}>{b.code}</option>)}</select></label>}
              </section>;
            })}
            <button type="button" className="opal-book-back" disabled={units.length>=MAX_ONLINE_UNITS} onClick={()=>{const key=nextUnitKey.current++;setUnits(old=>[...old,{key,typeId:old[0]?.typeId??null,guests:1,bubbleId:null}]);}}>{t("+ Add accommodation unit","+ إضافة وحدة إقامة")}</button>
            <p className="opal-book-helper">{t("Total guests","إجمالي الضيوف")}: <b dir="ltr">{stayGuests}</b> · {t("Online limit: 6 units","الحد الإلكتروني: ٦ وحدات")}</p>
            {availabilityLoading?<p role="status">{t("Checking availability…","جارٍ التحقق من التوافر…")}</p>:validStay&&availabilityKey===selectionKey&&!availabilityCurrent?<p role="status">{t("Not enough distinct units, or a manual assignment is missing. Adjust your selection.","الوحدات المختلفة المتاحة غير كافية أو لم يتم اختيار وحدة يدويًا. عدّل الاختيار.")}</p>:!validStay?<p role="status">{t("Select valid dates and guest counts for each unit.","اختر تواريخ وعدد ضيوف مناسبًا لكل وحدة.")}</p>:null}
          </div>
        </>}
        <div className="opal-book-field-grid">{(Object.keys(guest) as (keyof Guest)[]).map(key=><label key={key}>{fieldLabels[key]}<input required name={key} type={key==="guest_email"?"email":key==="guest_phone"?"tel":"text"} autoComplete={key==="guest_name"?"name":key==="guest_email"?"email":"tel"} value={guest[key]} onChange={e=>{setGuest(v=>({...v,[key]:e.target.value}));setFields(v=>({...v,[key]:[]}));}} aria-invalid={!!fields[key]?.length}/>{fields[key]?.map((message,i)=><span key={i} className="opal-book-error">{message}</span>)}</label>)}</div>
        </fieldset>
        {Object.entries(fields).filter(([key])=>!(key in guest)).map(([key,errors])=><p className="opal-book-error" key={key}>{key}: {errors.join(" · ")}</p>)}
        {error&&<p role="alert" className="opal-book-error">{error}</p>}
        {unknownCreate&&<p role="alert">{t("The booking result is uncertain. Do not submit again; contact the hotel to verify.","نتيجة إنشاء الحجز غير مؤكدة. لا تكرر الطلب؛ تواصل مع الفندق للتحقق.")}</p>}
        <button className="opal-book-primary" type="submit" disabled={busy||unknownCreate||!today||(mode==="day_use"?(!Number.isInteger(guests)||guests<1||!day||parseDateStamp(visit)===null||visit<today):(!validStay||!availabilityCurrent))}>{busy?t("Creating booking…","جارٍ إنشاء الحجز…"):t("Create booking & review total","إنشاء الحجز ومراجعة الإجمالي")}</button>
      </form><aside className="opal-book-summary"><div className="opal-book-summary-top"><span className="opal-book-eyebrow">{t("Your experience","تجربتك")}</span></div>
        {cover!==undefined&&<div className="opal-book-summary-image"><img className="opal-book-photo" src={media.images[cover].src} alt={ar?media.images[cover].altAr:media.images[cover].alt} width={640} height={400} onError={e=>{e.currentTarget.hidden=true;}}/></div>}
        <h2>{mode==="day_use"?(ar?day?.name_ar:day?.name_en):(ar?stay?.name_ar:stay?.name_en)}</h2>
        <p>{mode==="day_use"?(ar?day?.description_ar:day?.description_en):(ar?stay?.description_ar:stay?.description_en)}</p>
        <div className="opal-book-summary-rows">{mode==="day_use"&&day?<div><span>{t("Per guest","للفرد")}</span><strong dir="ltr">{money(day.price_per_guest,day.currency,ar)}</strong></div>:stay?<div><span>{t("Per night","لليلة")}</span><strong dir="ltr">{money(stay.price_per_night,stay.currency,ar)}</strong></div>:null}
        {mode==="bubble_stay"&&availabilityKey===selectionKey&&units.map((u,i)=>availability[u.key]?.availability&&<div key={u.key}><span>{t("Unit estimate","تقدير الوحدة")} {i+1}</span><strong dir="ltr">{money(availability[u.key].total_estimate,availability[u.key].currency,ar)}</strong></div>)}</div>
        <p className="opal-book-helper">{t("The final price is calculated by the booking system before payment.","يحدد نظام الحجز السعر النهائي قبل الدفع.")}</p>
      </aside></div>}
      </>}
    </main>
  </>;
}

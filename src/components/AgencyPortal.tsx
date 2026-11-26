"use client";
import Link from "next/link";
import { useEffect,useMemo,useRef,useState,type FormEvent } from "react";
import { agencyApi,AgencyError,type AgencyIdentity,type AgencyBooking } from "@/lib/agency-client";
import { paymentDestination,shouldPoll,type Accommodation,type DayUse,type Availability,type Gateway,type Guest,type BookingInput } from "@/lib/opal-api";
import { bookingStatusCopy } from "@/lib/poolside-status";
import { useHotelMedia } from "@/components/CmsProvider";
import { nextDay,parseDateStamp } from "@/lib/booking-preview";
import styles from "./agency-portal.module.css";

export function AgencyPortal({locale,origin,gateway}:{locale:"en"|"ar";origin:string;gateway:Gateway}){
 const ar=locale==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
 const api=useMemo(()=>agencyApi(locale),[locale]);
 const media=useHotelMedia();
 const [identity,setIdentity]=useState<AgencyIdentity|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [tab,setTab]=useState<"dashboard"|"bookings"|"create">("dashboard");
 const [bookings,setBookings]=useState<AgencyBooking[]>([]),[selected,setSelected]=useState<AgencyBooking|null>(null);
 const [status,setStatus]=useState(""),[filter,setFilter]=useState(""),[version,setVersion]=useState(0);
 const [days,setDays]=useState<DayUse[]>([]),[stays,setStays]=useState<Accommodation[]>([]);
 const [catalogReady,setCatalogReady]=useState(false);
 const [kind,setKind]=useState<"day_use"|"bubble_stay">("day_use"),[product,setProduct]=useState("");
 const [date,setDate]=useState(""),[out,setOut]=useState(""),[guests,setGuests]=useState(1);
 const [today,setToday]=useState("");
 const [guest,setGuest]=useState<Guest>({guest_name:"",guest_email:"",guest_phone:""});
 const [available,setAvailable]=useState<{key:string;data:Availability}|null>(null),[checking,setChecking]=useState(false);
 const [unknownCreate,setUnknownCreate]=useState(false);
 const created=useRef(new Set<string>()),lock=useRef(false);
 const chosen=kind==="day_use"?days.find(p=>String(p.id)===product):stays.find(p=>String(p.id)===product);
 const stay=kind==="bubble_stay"?stays.find(p=>String(p.id)===product):undefined;
 const dateValid=!!today&&parseDateStamp(date)!==null&&date>=today;
 const stayValid=!!stay&&dateValid&&parseDateStamp(out)!==null&&out>date&&Number.isInteger(guests)&&guests>0&&guests<=stay.max_guests;
 const availabilityKey=JSON.stringify([product,date,out,guests]);
 const validAvailability=available?.key===availabilityKey&&available.data.availability===true;
 const valid=!!chosen&&Number.isInteger(guests)&&guests>0&&dateValid&&(kind==="day_use"||stayValid&&validAvailability);
 function clearSession(){setIdentity(null);setBookings([]);setSelected(null);setDays([]);setStays([]);setCatalogReady(false);setGuest({guest_name:"",guest_email:"",guest_phone:""});created.current.clear();setTab("dashboard");setUnknownCreate(false);}
 function report(e:unknown){
  if(e instanceof AgencyError&&e.status===401){clearSession();setError(t("Sign in again to continue.","سجل الدخول مرة أخرى."));return;}
  setError(e instanceof AgencyError&&e.status===403?t("This action is not permitted for your account.","هذا الإجراء غير مسموح لحسابك."):e instanceof AgencyError&&e.status===409?t("Availability or booking state changed. Refresh and try again.","تغير التوافر أو حالة الحجز. حدّث البيانات."):e instanceof AgencyError&&e.status===429?t("Too many requests. Try later.","طلبات كثيرة. حاول لاحقًا."):t("The request could not be completed. Verify details and try again.","تعذر إكمال الطلب. راجع البيانات وحاول مرة أخرى."));
 }
 useEffect(()=>{
  const d=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());setToday(d);setDate(d);setOut(nextDay(d));
  let active=true;
  api.me().then(v=>{if(active)setIdentity(v);}).catch(e=>{if(active&&(!(e instanceof AgencyError)||e.status!==401))report(e);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[api]);
 useEffect(()=>{
  if(!identity)return;
  let active=true;
  api.list(status,filter).then(rows=>{if(active)setBookings(rows);}).catch(e=>{if(active)report(e);});
  return()=>{active=false;};
 },[api,identity,status,filter,version]);
 useEffect(()=>{
  if(!identity)return;
  let active=true;setCatalogReady(false);
  Promise.all([api.days(),api.stays()]).then(([d,s])=>{if(active){setDays(d.filter(p=>p.is_active&&p.price_per_guest!=null));setStays(s.filter(p=>p.is_active&&p.price_per_night!=null));setCatalogReady(true);}}).catch(e=>{if(active)report(e);});
  return()=>{active=false;};
 },[api,identity,version]);
 useEffect(()=>{
  setAvailable(null);setChecking(false);
  if(!identity||tab!=="create"||!stayValid||!stay)return;
  let active=true;setChecking(true);
  const timer=setTimeout(()=>{api.availability(stay.slug_en,date,out,guests).then(data=>{if(active)setAvailable({key:availabilityKey,data});}).catch(e=>{if(active)report(e);}).finally(()=>{if(active)setChecking(false);});},400);
  return()=>{active=false;clearTimeout(timer);};
 },[api,identity,tab,stayValid,stay,date,out,guests,availabilityKey]);
 const selectedRef=selected?.booking_reference;
 const selectedStatus=selected?.status;
 useEffect(()=>{
  if(!identity||!selectedRef||!selectedStatus||!shouldPoll(selectedStatus))return;
  let active=true;
  let timer:ReturnType<typeof setTimeout>;let attempts=0;
  const poll=async()=>{try{const b=await api.booking(selectedRef);if(active)setSelected(b);}catch(e){if(active)report(e);}finally{if(active&&++attempts<60)timer=setTimeout(poll,5000);}};
  timer=setTimeout(poll,5000);
  return()=>{active=false;clearTimeout(timer);};
 },[api,identity,selectedRef,selectedStatus]);
 async function action(fn:()=>Promise<void>){
  if(lock.current)return;lock.current=true;setBusy(true);setError("");
  try{await fn();}catch(e){report(e);}finally{lock.current=false;setBusy(false);}
 }
 function signIn(e:FormEvent){e.preventDefault();void action(async()=>{try{const session=await api.login(email.trim(),password);setIdentity(session);setVersion(v=>v+1);}finally{setPassword("");}});}
 function logout(){void action(async()=>{try{await api.logout();}finally{clearSession();}});}
 function create(e:FormEvent){
  e.preventDefault();if(!valid||!chosen||unknownCreate)return;
  void action(async()=>{
   const details={guest_name:guest.guest_name.trim(),guest_email:guest.guest_email.trim(),guest_phone:guest.guest_phone.trim()};
   if(Object.values(details).some(v=>!v))return;
   const input:BookingInput=kind==="day_use"?{...details,product_type:kind,guests,visit_date:date,day_use_product_id:chosen.id}:{...details,product_type:kind,guests,check_in:date,check_out:out,random_assignment:true,bubbles:[{accommodation_type_id:chosen.id,bubble_id:null,guests}]};
   try{
    const b=await api.create(input);if(!b.booking_reference)throw Error("Missing reference");
    created.current.add(b.booking_reference);setSelected(b);setGuest({guest_name:"",guest_email:"",guest_phone:""});setTab("bookings");setVersion(v=>v+1);
   }catch(e){if(!(e instanceof AgencyError)||e.status>=500)setUnknownCreate(true);if(e instanceof AgencyError&&e.status===409)setVersion(v=>v+1);throw e;}
  });
 }
 const canPay=!!selected&&selected.status==="pending_payment"&&selected.can_pay!==false&&(selected.can_pay===true||created.current.has(selected.booking_reference));
 function openBooking(ref:string){void action(async()=>{setSelected(await api.booking(ref));});}
 function pay(){if(!selected||!canPay)return;void action(async()=>{const p=await api.pay(selected.booking_reference);window.location.assign(paymentDestination(p.payment_url,gateway,origin));});}
 const label=(b:AgencyBooking)=>bookingStatusCopy[b.status]?.title[ar?1:0]??t("Unknown status","حالة غير معروفة");
 return <div className={styles.page}><header className={styles.header}><Link href={`/${locale}`} className={styles.brand}>{media.logoSrc&&<img src={media.logoSrc} width={42} height={42} alt=""/>} OPAL POOLSIDE</Link><span>{t("AGENCY PARTNERS","شركاء السياحة")}</span><Link href={`/${ar?"en":"ar"}/agency`}>{ar?"English":"العربية"}</Link>{identity&&<button onClick={logout} disabled={busy}>{t("Sign out","خروج")}</button>}</header>
 <main className={styles.main}>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 {loading?<p role="status">{t("Checking session…","جارٍ التحقق من الجلسة…")}</p>:!identity?<form className={styles.login} onSubmit={signIn}><span className={styles.eyebrow}>OPAL · B2B</span><h1>{t("Travel agency access","دخول شركات السياحة")}</h1><p>{t("Sign in with your hotel-issued agency account.","سجل الدخول بحساب شركتك المعتمد لدى الفندق.")}</p><label>{t("Email","البريد الإلكتروني")}<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>{t("Password","كلمة المرور")}<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} className={styles.primary}>{busy?t("Signing in…","جارٍ الدخول…"):t("Sign in","دخول")}</button></form>:<>
 <div className={styles.heading}><div><span className={styles.eyebrow}>{t("PARTNER WORKSPACE","مساحة الشركاء")}</span><h1>{identity.agency.name}</h1><p>{identity.actor.name}</p></div><button className={styles.primary} onClick={()=>{setTab("create");setSelected(null);}}>{t("New booking","حجز جديد")}</button></div>
 <nav className={styles.tabs} aria-label={t("Agency navigation","تنقل الشركات")}>{(["dashboard","bookings","create"] as const).map(k=><button key={k} aria-pressed={tab===k} onClick={()=>{setTab(k);setSelected(null);setError("");}}>{k==="dashboard"?t("Overview","الرئيسية"):k==="bookings"?t("Bookings","الحجوزات"):t("New booking","حجز جديد")}</button>)}</nav>
 {tab==="dashboard"&&<><div className={styles.metrics}><article><span>{t("Visible bookings (loaded)","الحجوزات الظاهرة (المحملة)")}</span><strong>{bookings.length}</strong></article><article><span>{t("Day use products","التجارب اليومية")}</span><strong>{catalogReady?days.length:"—"}</strong></article><article><span>{t("Overnight types","أنواع الإقامة")}</span><strong>{catalogReady?stays.length:"—"}</strong></article></div><h2>{t("Agency rates","أسعار الشركات")}</h2><div className={styles.metrics}>{[...days,...stays].map(p=><article key={("slug" in p?"day":"stay")+p.id}><span>{ar?p.name_ar:p.name_en}</span><strong dir="ltr">{p.currency} {"price_per_guest" in p?p.price_per_guest:p.price_per_night}</strong><small>{"price_per_guest" in p?t("Per guest","للفرد"):t("Per unit / night","للوحدة / الليلة")}</small></article>)}</div></>}
 {tab==="bookings"&&<><div className={styles.filters}><label>{t("Status","الحالة")}<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{t("All","الكل")}</option>{Object.entries(bookingStatusCopy).map(([key,value])=><option key={key} value={key}>{value.title[ar?1:0]}</option>)}</select></label><label>{t("Product","المنتج")}<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">{t("All","الكل")}</option><option value="day_use">{t("Day use","استخدام يومي")}</option><option value="bubble_stay">{t("Overnight","إقامة ليلية")}</option></select></label><button onClick={()=>setVersion(v=>v+1)}>{t("Refresh","تحديث")}</button></div>
 <div className={styles.rows}>{bookings.map(b=><button key={b.booking_reference} onClick={()=>openBooking(b.booking_reference)} disabled={busy}><strong dir="ltr">{b.booking_code}</strong><span>{label(b)}</span><span dir="ltr">{b.currency} {b.total}</span></button>)}{!bookings.length&&<p>{t("No bookings in this list.","لا توجد حجوزات في القائمة.")}</p>}</div>
 {selected&&<section className={styles.panel}><h2>{label(selected)}</h2><p dir="ltr">{selected.booking_code}</p><p>{t("Guests","الضيوف")}: {selected.guests}</p><p dir="ltr">{selected.currency} {selected.total}</p>{selected.tickets?.map(ticket=><p key={ticket.ticket_code} dir="ltr">{ticket.ticket_code}</p>)}<button disabled={busy} onClick={()=>openBooking(selected.booking_reference)}>{t("Refresh status","تحديث الحالة")}</button>{canPay?<button className={styles.primary} disabled={busy} onClick={pay}>{t("Continue to payment","المتابعة للدفع")}</button>:selected.status==="pending_payment"&&<p>{t("Payment is available only to the booking creator with verified permission.","الدفع متاح لمنشئ الحجز وفق الصلاحية المؤكدة فقط.")}</p>}</section>}</>}
 {tab==="create"&&<form className={styles.panel} onSubmit={create}><h2>{t("Create agency booking","إنشاء حجز شركة")}</h2><fieldset disabled={busy||unknownCreate||!catalogReady}><label>{t("Experience type","نوع التجربة")}<select value={kind} onChange={e=>{setKind(e.target.value==="day_use"?"day_use":"bubble_stay");setProduct("");}}><option value="day_use">{t("Day use","استخدام يومي")}</option><option value="bubble_stay">{t("Overnight","إقامة ليلية")}</option></select></label><label>{t("Product","المنتج")}<select required value={product} onChange={e=>setProduct(e.target.value)}><option value="">{t("Choose","اختر")}</option>{(kind==="day_use"?days:stays).map(p=><option key={p.id} value={p.id}>{ar?p.name_ar:p.name_en}</option>)}</select></label><div className={styles.filters}><label>{kind==="day_use"?t("Visit date","تاريخ الزيارة"):t("Check in","الوصول")}<input required type="date" min={today} value={date} onChange={e=>{setDate(e.target.value);if(out<=e.target.value)setOut(nextDay(e.target.value));}}/></label>{kind==="bubble_stay"&&<label>{t("Check out","المغادرة")}<input required type="date" min={nextDay(date)} value={out} onChange={e=>setOut(e.target.value)}/></label>}<label>{t("Guests","الضيوف")}<input required type="number" min={1} max={stay?.max_guests} value={guests} onChange={e=>setGuests(Number(e.target.value))}/></label></div>
 {kind==="bubble_stay"&&<p role="status">{checking?t("Checking availability…","جارٍ التحقق من التوافر…"):validAvailability?t("One unit available for automatic assignment.","وحدة متاحة للتخصيص التلقائي."):t("Select dates and check availability.","اختر التواريخ وتحقق من التوافر.")}</p>}
 {chosen&&<p dir="ltr">{chosen.currency} {"price_per_guest" in chosen?chosen.price_per_guest:chosen.price_per_night} {t("unit rate","سعر الوحدة")}</p>}
 {(["guest_name","guest_email","guest_phone"] as const).map(k=><label key={k}>{k==="guest_name"?t("Guest name","اسم الضيف"):k==="guest_email"?t("Guest email","بريد الضيف"):t("Guest phone","هاتف الضيف")}<input required type={k==="guest_email"?"email":k==="guest_phone"?"tel":"text"} value={guest[k]} onChange={e=>setGuest(v=>({...v,[k]:e.target.value}))}/></label>)}</fieldset>
 {unknownCreate&&<p role="alert">{t("The result is uncertain. Check existing bookings before submitting again.","نتيجة الطلب غير مؤكدة. راجع الحجوزات قبل تكرار الطلب.")}</p>}<button className={styles.primary} disabled={busy||!valid||unknownCreate||!catalogReady}>{t("Create and review total","إنشاء ومراجعة الإجمالي")}</button></form>}
 </>}
 </main></div>;
}

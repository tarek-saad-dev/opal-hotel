import type { Locale } from "@/lib/hotel-content";

/** Stay details passed from the homepage booking bar (no personal data in the URL). */
export type BookingPreviewInput = {
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
};

function onlyString(value:string|string[]|undefined):string {
  return typeof value==="string" ? value : "";
}
function boundedInteger(raw:string,minimum:number,maximum:number,defaultValue:number) {
  if (!/^[0-9]+$/.test(raw)) return defaultValue;
  const parsed=Number(raw);
  return Number.isSafeInteger(parsed)&&parsed>=minimum&&parsed<=maximum ? parsed : defaultValue;
}
export function parsePreviewParams(
  input:Record<string,string|string[]|undefined>
):BookingPreviewInput {
  return {
    checkin:onlyString(input.checkin).slice(0,10),
    checkout:onlyString(input.checkout).slice(0,10),
    adults:boundedInteger(onlyString(input.adults),1,8,2),
    children:boundedInteger(onlyString(input.children),0,6,0),
  };
}

export function parseDateStamp(value:string):number|null {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split("-").map(Number);
  const stamp=Date.UTC(year,month-1,day);
  const date=new Date(stamp);
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return stamp;
}
export function nightsBetween(checkin:string,checkout:string):number {
  const a=parseDateStamp(checkin),b=parseDateStamp(checkout);
  return a===null||b===null?0:Math.max(0,Math.round((b-a)/86400000));
}
export function todayLocal():string {
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
export function nextDay(day:string):string {
  const date=parseDateStamp(day);
  return date===null?"":new Date(date+86400000).toISOString().slice(0,10);
}

export const bookingCopy=(locale:Locale) => locale==="ar" ? {
  eyebrow:"احجز إقامتك",headline:"كل رحلة",emphasis:"لها بداية.",
  intro:"أرسل طلب الحجز في ثلاث خطوات، وسيؤكد لك فريق الفندق الإتاحة والسعر عبر البريد الإلكتروني.",
  stepOne:"تفاصيل الإقامة",stepTwo:"بياناتك",stepThree:"المراجعة والإرسال",
  helperOne:"متى تصل ومن معك؟",helperTwo:"كيف نتواصل معك؟",helperThree:"راجع طلبك قبل الإرسال.",
  previous:"الرجوع",continue:"متابعة",review:"راجع الطلب",send:"أرسل طلب الحجز",sending:"جارٍ الإرسال…",
  checkin:"تاريخ الوصول",checkout:"تاريخ المغادرة",adults:"البالغون",children:"الأطفال",guests:"الضيوف",
  stay:"عدد الليالي",night:"ليلة",total:"إجمالي الضيوف",dateError:"اختر تاريخ وصول صحيحًا وتاريخ مغادرة بعده.",
  fullName:"الاسم بالكامل",email:"البريد الإلكتروني",phone:"رقم الهاتف (واتساب إن أمكن)",country:"الدولة",
  arrival:"موعد الوصول المتوقع",arrivalHint:"مثال: 10:00 صباحًا",notes:"طلبات خاصة",notesHint:"سرير أطفال، نقل من المطار، احتياجات غذائية…",
  detailsError:"من فضلك أكمل الاسم والبريد الإلكتروني ورقم الهاتف بشكل صحيح.",
  summary:"ملخص الطلب",editDates:"تعديل الإقامة",editDetails:"تعديل البيانات",
  sentTitle:"تم إرسال طلبك",sentBody:"شكرًا لك! سيتواصل معك فريق الفندق عبر البريد الإلكتروني لتأكيد الإتاحة والسعر.",
  reference:"رقم الطلب",backHome:"العودة للرئيسية",
  confirmNote:"إرسال الطلب لا يعني تأكيد الحجز؛ يؤكد الفندق الحجز بعد مراجعة الإتاحة.",
  checkinTime:"تسجيل الوصول: من 08:00 حتى 12:00",checkoutTime:"تسجيل المغادرة: حتى 10:00",
  privacy:"نستخدم بياناتك لمعالجة طلب الحجز فقط.",
  home:"الصفحة الرئيسية",language:"English",breadcrumb:"طلب حجز",step:"خطوة",of:"من",
} : {
  eyebrow:"BOOK YOUR STAY",headline:"Your stay",emphasis:"starts here.",
  intro:"Send a booking request in three steps. The hotel team will confirm availability and the rate by email.",
  stepOne:"Your stay",stepTwo:"Your details",stepThree:"Review & send",
  helperOne:"When are you arriving, and who is coming?",helperTwo:"How can we reach you?",helperThree:"Check your request before sending.",
  previous:"Back",continue:"Continue",review:"Review request",send:"Send booking request",sending:"Sending…",
  checkin:"Check-in date",checkout:"Check-out date",adults:"Adults",children:"Children",guests:"Guests",
  stay:"Nights",night:"nights",total:"Total guests",dateError:"Choose valid dates, with check-out after check-in.",
  fullName:"Full name",email:"Email",phone:"Phone (WhatsApp if possible)",country:"Country",
  arrival:"Expected arrival time",arrivalHint:"e.g. 10:00 am",notes:"Special requests",notesHint:"Cot, airport shuttle, dietary needs…",
  detailsError:"Please enter your full name, a valid email and a phone number.",
  summary:"Your request",editDates:"Edit stay",editDetails:"Edit details",
  sentTitle:"Request sent",sentBody:"Thank you! The hotel team will email you to confirm availability and the rate.",
  reference:"Request reference",backHome:"Back to homepage",
  confirmNote:"Sending a request does not confirm a reservation; the hotel confirms after checking availability.",
  checkinTime:"Check-in: from 08:00 until 12:00",checkoutTime:"Check-out: until 10:00",
  privacy:"We only use your details to handle your booking request.",
  home:"Back to homepage",language:"العربية",breadcrumb:"Booking request",step:"STEP",of:"OF",
};

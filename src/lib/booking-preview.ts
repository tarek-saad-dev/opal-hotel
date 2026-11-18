import type { Locale } from "@/lib/hotel-content";
import { roomConcepts } from "@/lib/room-concepts";

/** Public, NON-PERSONAL design-preview inputs only. No room IDs, prices or availability. */
export type BookingPreviewInput = {
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  room: string;
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
  const room=onlyString(input.room);
  return {
    checkin:onlyString(input.checkin).slice(0,10),
    checkout:onlyString(input.checkout).slice(0,10),
    adults:boundedInteger(onlyString(input.adults),1,8,2),
    children:boundedInteger(onlyString(input.children),0,6,0),
    room:roomConcepts.some(item=>item.slug===room)?room:"",
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
  eyebrow:"خطط لإقامتك",headline:"كل رحلة",emphasis:"ليها بداية.",
  intro:"رحلة حجز تفاعلية لمعاينة تجربة الموقع. استكشف الخطوات واختار تصور الغرفة، من غير إرسال بيانات أو إنشاء حجز.",
  stepOne:"تفاصيل الإقامة",stepTwo:"اختيار التصور",stepThree:"مراجعة التفاصيل",
  helperOne:"خلّي البداية على مزاجك.",helperTwo:"المساحات التي تلهمك.",helperThree:"كل التفاصيل في مكان واحد.",
  next:"التالي",previous:"الرجوع",continue:"متابعة إلى التصورات",review:"راجع اختيارك",
  checkin:"تاريخ الوصول",checkout:"تاريخ المغادرة",adults:"البالغون",children:"الأطفال",guests:"الضيوف",
  stay:"ليالي الإقامة",night:"ليلة",total:"إجمالي الضيوف",dateError:"اختار تاريخ وصول صحيح وتاريخ مغادرة بعده.",
  selected:"التصور المختار",change:"تعديل",choose:"اختار التصور",view:"شوف تفاصيل التصور",
  available:"تصورات للمعاينة",selectedLabel:"تم الاختيار",selectionHint:"دي تصورات بصرية وليست غرف فعلية ولا يوجد فحص للإتاحة.",
  source:"صور توضيحية فقط",datePlaceholder:"حدد المواعيد",
  reviewHeading:"ملخص المعاينة",reviewNotice:"دي معاينة لتصميم رحلة الحجز فقط. لا يوجد سعر أو رقم حجز، ومفيش طلب اتبعت للفندق.",
  noBooking:"لم يتم إنشاء أو تأكيد أي حجز.",noAvailability:"الإتاحة والأسعار غير متصلين بعد.",
  done:"انتهت المعاينة",editDates:"تعديل التواريخ",editRoom:"تغيير التصور",
  exploreRooms:"استكشف تصورات الغرف",home:"الصفحة الرئيسية",
  language:"English",status:"DESIGN PREVIEW",help:"أولوياتنا التصميم وسهولة الاستخدام. الحجز الفعلي هيتم تفعيله بعد اعتماد البيانات وربط النظام.",
  note:"لا نطلب اسمًا أو بريدًا إلكترونيًا أو بيانات دفع في النسخة دي.",
  breadcrumb:"معاينة الحجز",roomDesign:"تصور تصميمي",brand:"OPAL LEGACY",step:"خطوة",of:"من",
} : {
  eyebrow:"A CONSIDERED JOURNEY",headline:"Your stay",emphasis:"starts here.",
  intro:"A beautifully simple look at a future booking journey. Explore dates and room concepts, without sending information or creating a reservation.",
  stepOne:"Stay details",stepTwo:"Select a concept",stepThree:"Review your preview",
  helperOne:"Begin with the days that matter.",helperTwo:"A mood worth exploring.",helperThree:"Everything in one place.",
  next:"Next",previous:"Back",continue:"Explore room concepts",review:"Review your preview",
  checkin:"Check-in date",checkout:"Check-out date",adults:"Adults",children:"Children",guests:"Guests",
  stay:"Nights",night:"nights",total:"Total guests",dateError:"Choose valid dates, with check-out after check-in.",
  selected:"Selected concept",change:"Edit",choose:"Choose this concept",view:"View concept details",
  available:"Concepts to explore",selectedLabel:"Selected",selectionHint:"These are editorial concepts only, not real available rooms.",
  source:"ILLUSTRATIVE IMAGERY",datePlaceholder:"Choose your dates",
  reviewHeading:"Your preview at a glance",reviewNotice:"This is a design preview of a future booking flow only. No prices, availability or booking reference are available. Nothing has been sent to the hotel.",
  noBooking:"No reservation has been created or confirmed.",noAvailability:"Rates and live availability are not connected.",
  done:"Preview complete",editDates:"Edit stay dates",editRoom:"Change concept",
  exploreRooms:"Explore room concepts",home:"Back to homepage",
  language:"العربية",status:"DESIGN PREVIEW",help:"This preview focuses on clarity and ease of use. Real reservations require approved hotel inventory and a booking backend.",
  note:"We do not collect names, emails or payment information in this preview.",
  breadcrumb:"Booking preview",roomDesign:"DESIGN CONCEPT",brand:"OPAL LEGACY",step:"STEP",of:"OF",
};

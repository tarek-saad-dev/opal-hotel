"use client";
import { useMemo,useState } from "react";
import qrcode from "qrcode-generator";
import { apiOrigin,isConfirmed,type Booking } from "@/lib/opal-api";

export function PoolsidePass({booking,origin,locale}:{booking:Booking;origin:string;locale:"ar"|"en"}){
  const ar=locale==="ar",t=(en:string,arabic:string)=>ar?arabic:en;
  const ticket=booking.tickets?.[0];
  const [copied,setCopied]=useState(false);
  const qr=useMemo(()=>{
    if(!isConfirmed(booking.status)||!ticket||!/^OPL-[A-Z0-9]+-[A-Z0-9]+$/i.test(booking.booking_code))return null;
    try{
      const payload=apiOrigin(origin)+"/api/v1/tickets/"+encodeURIComponent(booking.booking_code);
      const code=qrcode(0,"M");code.addData(payload,"Byte");code.make();
      const size=code.getModuleCount();
      let path="";
      for(let row=0;row<size;row++)for(let col=0;col<size;col++)if(code.isDark(row,col))path+="M"+(col+4)+" "+(row+4)+"h1v1h-1z";
      return {size:size+8,path};
    }catch{return null;}
  },[booking.status,booking.booking_code,origin,ticket]);
  if(!isConfirmed(booking.status))return null;
  const active=booking.status==="confirmed"||booking.status==="checked_in";
  return <article className="opal-pool-pass">
    <span className="opal-book-eyebrow">OPAL POOLSIDE · BOOKING PASS</span>
    <h2>{active?t("Your booking pass","بطاقة حجزك"):t("Booking record","سجل الحجز")}</h2>
    {qr&&<svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" role="img" aria-label={t("Booking QR code for hotel staff","رمز الحجز لموظفي الفندق")}><rect width={qr.size} height={qr.size} fill="white"/><path d={qr.path} fill="black"/></svg>}
    <strong className="opal-pool-pass-code" dir="ltr">{booking.booking_code}</strong>
    <dl><div><dt>{t("Experience","التجربة")}</dt><dd>{booking.product_type==="day_use"?t("Day Use","استخدام يومي"):t("Overnight Stay","إقامة ليلية")}</dd></div><div><dt>{t("Guests","الضيوف")}</dt><dd dir="ltr">{booking.guests}</dd></div>
      {ticket&&<><div><dt>{t("Valid from","صالح من")}</dt><dd dir="ltr">{ticket.valid_from}</dd></div><div><dt>{t("Valid to","صالح حتى")}</dt><dd dir="ltr">{ticket.valid_to}</dd></div><div><dt>{t("Ticket code","كود التذكرة")}</dt><dd dir="ltr">{ticket.ticket_code}</dd></div></>}
    </dl>
    <p>{!ticket?t("The ticket has not been returned yet. Refresh the booking status.","التذكرة لم تظهر بعد. حدّث حالة الحجز."):active?t("Show this code to hotel staff. Entry is verified by the hotel.","اعرض الكود لموظفي الفندق؛ يتم التحقق من الدخول بواسطة الفندق."):t("Keep this record for your reference. It does not authorize a new entry.","احتفظ بالسجل للرجوع إليه. لا يسمح بدخول جديد.")}</p>
    <div className="opal-book-actions"><button type="button" className="opal-book-back" onClick={()=>window.print()}>{t("Print / save as PDF","طباعة / حفظ PDF")}</button><button type="button" className="opal-book-back" onClick={async()=>{try{await navigator.clipboard.writeText(booking.booking_code);setCopied(true);}catch{setCopied(false);}}}>{copied?t("Copied","تم النسخ"):t("Copy code","نسخ الكود")}</button></div>
    <p className="opal-book-helper">{t("The official confirmation email and PDF are issued by the hotel booking system.","رسالة التأكيد وملف PDF الرسمي يصدران من نظام حجوزات الفندق.")}</p>
  </article>;
}

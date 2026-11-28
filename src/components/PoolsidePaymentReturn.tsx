"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validBookingReference,bookingSessionKey } from "@/lib/poolside-recovery";
export function PoolsidePaymentReturn({locale,reference}:{locale:"en"|"ar";reference:string}){
 const router=useRouter(),ar=locale==="ar";
 useEffect(()=>{
   let ref=reference;
   if(!validBookingReference(ref)){
     try{ref=sessionStorage.getItem(bookingSessionKey)||"";}catch{ref="";}
   }
   // Provider success/failure query fields are ignored. Only the booking API
   // may establish the state. Remove provider fields from browser history.
   const path="/"+locale+"/booking"+(validBookingReference(ref)?"?"+new URLSearchParams({reference:ref}):"");
   router.replace(path);
 },[locale,reference,router]);
 return <main className="opal-book-page"><h1>{ar?"جارٍ استعادة الحجز":"Restoring your booking"}</h1><p role="status">{ar?"سيتم التحقق من حالة الحجز لدى الفندق.":"Your booking status will be verified with the hotel."}</p><Link href={`/${locale}/booking`}>{ar?"متابعة":"Continue"}</Link></main>;
}

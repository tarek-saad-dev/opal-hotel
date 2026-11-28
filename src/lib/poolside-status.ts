import type { BookingStatus } from "@/lib/opal-api";
export type StatusTone="waiting"|"success"|"closed"|"error";
export type StatusCopy={tone:StatusTone;title:[string,string];message:[string,string]};
export const bookingStatusCopy:Record<BookingStatus,StatusCopy>={
 pending_payment:{tone:"waiting",title:["Complete your payment","أكمل الدفع"],message:["Your booking is awaiting payment. Review the total before continuing.","حجزك في انتظار الدفع. راجع الإجمالي قبل المتابعة."]},
 paid:{tone:"waiting",title:["Payment verification","جارٍ التحقق من الدفع"],message:["The booking system is verifying your payment. Do not pay again.","يتحقق نظام الحجز من الدفع. لا تدفع مرة أخرى."]},
 confirmed:{tone:"success",title:["Your booking is confirmed","تم تأكيد حجزك"],message:["Your booking is confirmed by the hotel. Keep your booking code for arrival.","تم تأكيد الحجز من الفندق. احتفظ بكود الحجز عند الوصول."]},
 checked_in:{tone:"success",title:["Checked in","تم تسجيل الوصول"],message:["Your arrival has been recorded by the hotel.","سجل الفندق وصولك."]},
 pending_check_out:{tone:"waiting",title:["Awaiting check-out","في انتظار المغادرة"],message:["The hotel is processing your departure.","الفندق يتابع إجراءات المغادرة."]},
 checked_out:{tone:"closed",title:["Checked out","تم تسجيل المغادرة"],message:["Your departure has been recorded.","تم تسجيل مغادرتك."]},
 completed:{tone:"closed",title:["Stay completed","اكتملت التجربة"],message:["Your booking is complete. Keep the record for reference.","حجزك مكتمل. احتفظ بالسجل للرجوع إليه."]},
 failed:{tone:"error",title:["Payment failed","لم يكتمل الدفع"],message:["The hotel system reports a failed booking. If you were charged, contact the hotel before making another payment.","نظام الفندق أفاد بفشل الحجز. لو تم خصم مبلغ، تواصل مع الفندق قبل دفع أي مبلغ آخر."]},
 cancelled:{tone:"closed",title:["Booking cancelled","تم إلغاء الحجز"],message:["This booking has been cancelled. Contact the hotel about any payment questions.","تم إلغاء الحجز. تواصل مع الفندق لأي استفسار عن الدفع."]},
 expired:{tone:"closed",title:["Booking expired","انتهت صلاحية الحجز"],message:["The hotel system reports that the reservation has expired. Check any previous payment before starting a new booking.","أفاد نظام الفندق بانتهاء صلاحية الحجز. تحقق من أي دفعة سابقة قبل حجز جديد."]},
 no_show:{tone:"closed",title:["No show","لم يحضر الضيف"],message:["The hotel recorded this booking as a no show. Contact the hotel for assistance.","سجل الفندق الحجز كعدم حضور. تواصل مع الفندق للمساعدة."]}
};

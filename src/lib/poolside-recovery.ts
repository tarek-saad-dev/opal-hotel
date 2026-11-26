export const bookingSessionKey="opal.active-booking-reference";
export const validBookingReference=(value:string)=>value!=="."&&value!==".."&&value.length>0&&value.length<=256&&!/[\x00-\x20\x7f/]/.test(value);

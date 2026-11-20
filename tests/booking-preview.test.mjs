import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("Booking V2 exists as an EN/AR non-indexed preview route",()=>{
  const route=read("src/app/[locale]/booking/page.tsx");
  assert.ok(route.includes("BookingExperience"));
  assert.ok(route.includes("generateStaticParams"));
  assert.ok(route.includes('locale:"en"'));
  assert.ok(route.includes('locale:"ar"'));
  assert.ok(route.includes("robots:{index:false,follow:false}"));
  assert.ok(route.includes("parsePreviewParams"));
  assert.ok(route.includes("alternates"));
});

test("Booking request flow: stay, guest details, review, then API submission",()=>{
  const ui=read("src/components/BookingExperience.tsx");
  assert.ok(ui.includes("const [step,setStep]=useState<Step>(1)"));
  assert.ok(ui.includes("goTo(2)")&&ui.includes("goTo(3)"));
  assert.ok(ui.includes("submitBookingRequest("));
  // Success screen only after the API answers ok.
  assert.ok(ui.includes("if(result.ok)"));
  assert.ok(ui.includes("setSent({reference:result.reference})"));
  assert.ok(ui.includes("apiErrorMessage(result.error,locale)"));
  // Guests coming from the homepage skip re-entering dates.
  assert.ok(ui.includes("initial.checkout>initial.checkin) setStep(2)"));
  assert.ok(!ui.includes("roomConcepts"));
});

test("Bilingual copy says a request is not a confirmed reservation; no preview wording",()=>{
  const src=read("src/lib/booking-preview.ts");
  assert.ok(src.includes("Sending a request does not confirm a reservation"));
  assert.ok(src.includes("إرسال الطلب لا يعني تأكيد الحجز"));
  assert.ok(!/preview|illustrative|DESIGN PREVIEW/i.test(src.slice(src.indexOf("export const bookingCopy"))));
});

test("Guest details are validated before review and sent only through the API client",()=>{
  const ui=read("src/components/BookingExperience.tsx");
  assert.ok(ui.includes("emailPattern.test(guest.email.trim())"));
  assert.ok(ui.includes("phonePattern.test(guest.phone.trim())"));
  assert.ok(ui.includes('autoComplete="email"'));
  assert.ok(ui.includes('autoComplete="tel"'));
  assert.ok(!ui.includes("fetch("));
  const api=read("src/lib/api-client.ts");
  assert.ok(api.includes('post("/booking-requests", payload)'));
  assert.ok(api.includes("NEXT_PUBLIC_API_BASE_URL"));
});

test("Booking controls remain keyboard friendly",()=>{
  const ui=read("src/components/BookingExperience.tsx");
  assert.ok(ui.includes('aria-current={active?"step":undefined}'));
  assert.ok(ui.includes("aria-busy={sending}"));
  assert.ok(ui.includes('role="alert"'));
});

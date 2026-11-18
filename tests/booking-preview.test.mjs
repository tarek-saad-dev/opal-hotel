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

test("Booking flow has real progressive UI states, but no backend or false confirmation",()=>{
  const ui=read("src/components/BookingExperience.tsx");
  assert.ok(ui.includes("const [step,setStep]=useState<Step>(1)"));
  assert.ok(ui.includes("setStep(2)"));
  assert.ok(ui.includes("setStep(3)"));
  assert.ok(ui.includes("step===1"));
  assert.ok(ui.includes("step===2"));
  assert.ok(ui.includes("step===3"));
  assert.ok(ui.includes("t.noBooking"));
  assert.ok(ui.includes("t.reviewNotice"));
  assert.ok(!ui.includes("fetch("));
  assert.ok(!ui.includes("axios"));
  assert.ok(!ui.includes("localStorage"));
  assert.ok(!ui.includes("PaymentIntent"));
  assert.ok(!ui.includes("/api/booking"));
});

test("Bilingual content explicitly says no reservation, rates or availability",()=>{
  const src=read("src/lib/booking-preview.ts");
  assert.ok(src.includes("No reservation has been created or confirmed."));
  assert.ok(src.includes("لم يتم إنشاء أو تأكيد أي حجز."));
  assert.ok(src.includes("Rates and live availability are not connected."));
  assert.ok(src.includes("لا نطلب اسمًا أو بريدًا إلكترونيًا أو بيانات دفع"));
  assert.ok(src.includes("parseDateStamp"));
  assert.ok(src.includes("nightsBetween"));
  assert.ok(src.includes("boundedInteger"));
});

test("Hero and room stories handoff to booking preview without claiming inventory",()=>{
  const home=read("src/components/HotelExperience.tsx");
  const hero=read("src/components/PremiumMasthead.tsx");
  const rooms=read("src/components/RoomsExperience.tsx");
  assert.ok(home.includes("router.push("));
  assert.ok(home.includes("adults:String(adults)"));
  assert.ok(home.includes("children:String(children)"));
  assert.ok(hero.includes("guests: adults + children, adults, children"));
  assert.ok(rooms.includes('booking?room=${concept.slug}'));
  assert.ok(rooms.includes("room-exp-header-cta"));
  assert.ok(rooms.includes("/booking"));
});

test("Controls are keyboard friendly and preview displays no fake room price",()=>{
  const ui=read("src/components/BookingExperience.tsx");
  assert.ok(ui.includes('aria-current={active?"step":undefined}'));
  assert.ok(ui.includes('aria-pressed={selectedRoom===room.slug}'));
  assert.ok(ui.includes('role="alert"'));
  assert.ok(ui.includes('type="date"'));
  assert.ok(ui.includes("validDates"));
  assert.ok(!ui.includes("EGP"));
  assert.ok(!ui.includes("nightlyRate"));
});

test("Booking preview has narrow-mobile and Arabic layouts with reduced-motion support",()=>{
  const css=read("src/app/booking-experience.css");
  assert.ok(css.includes("@media(max-width:600px)"));
  assert.ok(css.includes("@media(max-width:360px)"));
  assert.ok(css.includes('[dir="rtl"]'));
  assert.ok(css.includes("prefers-reduced-motion:reduce"));
});

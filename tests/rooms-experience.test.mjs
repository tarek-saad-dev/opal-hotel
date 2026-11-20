import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Room concept catalogue and details exist as real bilingual routes",()=>{
  const index=read("src/app/[locale]/rooms/page.tsx");
  const detail=read("src/app/[locale]/rooms/[slug]/page.tsx");
  assert.ok(index.includes("RoomCollection"));
  assert.ok(detail.includes("RoomDetail"));
  assert.ok(index.includes("generateStaticParams"));
  assert.ok(detail.includes("roomConcepts.map"));
  assert.ok(detail.includes("notFound()"));
});

test("Concept manifest is deliberately illustrative and never claims real inventory",()=>{
  const src=read("src/lib/room-concepts.ts");
  assert.ok(src.includes("Design-only"));
  assert.ok(src.includes("roomConcepts"));
  assert.ok(src.includes('slug: "light-and-stillness"'));
  assert.ok(src.includes('slug: "quiet-comforts"'));
  assert.ok(src.includes('slug: "slow-mornings"'));
  assert.ok(src.includes("not confirmed or bookable hotel rooms"));
  assert.ok(src.includes("Room types, amenities, capacity, rates and availability have not been confirmed"));
  assert.ok(!src.includes("pricePerNight"));
  assert.ok(!src.includes("availabilityApi"));
});

test("Homepage cards link to room routes without breaking gallery",()=>{
  const src=read("src/components/PremiumSections.tsx");
  assert.ok(src.includes("roomConcepts[i].slug"));
  assert.ok(src.includes("opal-room-details-link"));
  assert.ok(src.includes("opal-rooms-collection-link"));
  assert.ok(src.includes("onOpenPhoto(roomPhoto(i))"));
  assert.ok(src.includes("Not actual room types or bookable inventory"));
});

test("Detail gallery offers keyboard-accessible thumbnails, modal and controls",()=>{
  const src=read("src/components/RoomsExperience.tsx");
  assert.ok(src.includes('aria-pressed={selected===index}'));
  assert.ok(src.includes('aria-modal="true"'));
  assert.ok(src.includes("event.key===\"ArrowRight\""));
  assert.ok(src.includes('e.key==="Escape"'));
  assert.ok(src.includes("opener.current?.focus"));
  assert.ok(src.includes("room-exp-lightbox"));
  assert.ok(src.includes("responsivePhotoSrcSet(photo.src)"));
});

test("Lang switch preserves room slug and both routes remain not indexed",()=>{
  const component=read("src/components/RoomsExperience.tsx");
  const details=read("src/app/[locale]/rooms/[slug]/page.tsx");
  const index=read("src/app/[locale]/rooms/page.tsx");
  assert.ok(component.includes('slug?"/"+slug:""'));
  assert.ok(details.includes("robots:{index:false,follow:false}"));
  assert.ok(index.includes("robots:{index:false,follow:false}"));
  assert.ok(details.includes("alternates"));
});

test("Responsive styles support mobile including RTL and reduced motion",()=>{
  const css=read("src/app/rooms-experience.css");
  assert.ok(css.includes("@media(max-width:600px)"));
  assert.ok(css.includes("@media(max-width:360px)"));
  assert.ok(css.includes('[dir="rtl"]'));
  assert.ok(css.includes("prefers-reduced-motion:reduce"));
});

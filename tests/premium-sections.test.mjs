import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("Premium phases are integrated in the correct visual narrative", () => {
  const shell=read("src/components/HotelExperience.tsx");
  const names=["PremiumStory","PremiumFacilities","PremiumLocation","PremiumRooms","PremiumGallery"];
  const order=names.map(name=>shell.indexOf("<"+name));
  assert.ok(order.every((x,i)=>x>=0 && (i===0||x>order[i-1])));
  assert.ok(shell.includes('id="gallery"'));
  assert.ok(shell.includes('id="rooms"'));
  assert.ok(shell.includes("onOpenPhoto={openPhoto}"));
});

test("Rooms are clearly concepts, with no fake inventory or rates", () => {
  const src=read("src/components/PremiumSections.tsx");
  assert.ok(src.includes("Not actual room types or bookable inventory"));
  assert.ok(src.includes("c.labels.noBooking"));
  assert.ok(src.includes("attemptedBooking"));
  assert.ok(!src.includes("booking confirmed"));
  assert.ok(!src.includes("/api/booking"));
});

test("Premium gallery has interactive filters and opens the existing lightbox", () => {
  const src=read("src/components/PremiumSections.tsx");
  for(const key of ['"all"','"spaces"','"moments"'])assert.ok(src.includes(key));
  assert.ok(src.includes('aria-pressed={filter===key}'));
  assert.ok(src.includes('onOpenPhoto(img.index)'));
});

test("Facilities remain available without overloading first-screen UI", () => {
  const src=read("src/components/PremiumSections.tsx");
  assert.ok(src.includes('<details className="opal-amenity-details"'));
  assert.ok(src.includes("<summary>"));
  assert.ok(src.includes("c.facilities.map"));
});

test("Desktop, mobile, RTL and reduced motion styles exist", () => {
  const css=read("src/app/premium-sections.css");
  assert.ok(css.includes("max-width:600px"));
  assert.ok(css.includes("max-width:800px"));
  assert.ok(css.includes('[dir="rtl"]'));
  assert.ok(css.includes("prefers-reduced-motion:reduce"));
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("premium masthead is wired into the hotel homepage", () => {
  const page = read("src/components/HotelExperience.tsx");
  const head = read("src/components/PremiumMasthead.tsx");
  assert.ok(page.includes("<PremiumMasthead"), "page must use approved premium component");
  assert.ok(head.includes('id="hotel-name"'));
  assert.ok(head.includes('id="booking"'));
  assert.ok(head.includes('id="premium-arrival"'));
  assert.ok(head.includes('id="premium-departure"'));
});

test("all premium visual controls are intentional interactions", () => {
  const head = read("src/components/PremiumMasthead.tsx");
  assert.ok(head.includes("setMenuOpen"));
  assert.ok(head.includes("moveSlide"));
  assert.ok(head.includes("setGuestsOpen"));
  assert.ok(head.includes("onAvailability"));
  assert.ok(head.includes('type="date"'));
  assert.ok(head.includes("checkout <= checkin"));
  assert.ok(head.includes("aria-expanded"));
});

test("imagery is explicitly declared illustrative, not owned inventory", () => {
  const head = read("src/components/PremiumMasthead.tsx");
  const gallery = read("src/lib/gallery.ts");
  assert.ok(head.includes("illustrative photography"));
  assert.ok(gallery.includes('origin:"design-demo"'));
  assert.ok(gallery.includes("not Opal Legacy"));
  assert.ok(gallery.includes("referencePhotoUrls"));
});

test("art direction preserves restrained motion and RTL", () => {
  const css = read("src/app/premium.css");
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes('[dir="rtl"]'));
  assert.ok(css.includes(".premium-hero"));
  assert.ok(css.includes(".premium-booking-form"));
});

test("there is no simulated booking success from the premium form", () => {
  const head = read("src/components/PremiumMasthead.tsx");
  assert.ok(!head.includes("fetch("));
  assert.ok(!head.includes("/api/bookings"));
  assert.ok(head.includes("Dates are for preview only"));
});

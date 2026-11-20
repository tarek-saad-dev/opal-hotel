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

test("no stock imagery and no preview disclaimers in the hero", () => {
  const head = read("src/components/PremiumMasthead.tsx");
  const gallery = read("src/lib/gallery.ts");
  assert.ok(!/illustrative|design preview|not yet enabled|coming soon/i.test(head));
  assert.ok(!head.includes("premium-photo-disclaimer"));
  assert.ok(gallery.includes('origin:"placeholder" as const'));
  assert.ok(gallery.includes("referencePhotoUrls"));
  // Gallery button only when the hotel's own photos exist.
  assert.ok(head.includes("{hasRealPhotos&&<button"));
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
  // The homepage form only hands the stay details to the booking request page.
  assert.ok(head.includes("onAvailability({ checkin, checkout, guests: adults + children, adults, children })"));
});

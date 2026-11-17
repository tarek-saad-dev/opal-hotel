import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("premium closing sections replace generic review and contact forms",()=>{
  const shell=read("src/components/HotelExperience.tsx");
  for(const component of ["PremiumReviews","PremiumContact","PremiumFooter"])
    assert.ok(shell.includes("<"+component),component+" should be integrated");
  const positions=["reviews","contact"].map(x=>shell.indexOf('id="'+x+'"'));
  assert.ok(positions.every((x,i)=>x>=0&&(i===0||x>positions[i-1])));
  assert.ok(shell.includes('className="opal-end-footer"'));
});

test("review and contact remain preview-only, no fake success or network request",()=>{
  const closing=read("src/components/PremiumClosing.tsx");
  assert.ok(closing.includes("c.labels.noBackend"));
  assert.ok(closing.includes("Reviews are not stored, published or sent"));
  assert.ok(closing.includes("Messages are not delivered"));
  assert.ok(closing.includes("No network request, storage, or review publication"));
  assert.ok(!closing.includes("fetch("));
  assert.ok(!closing.includes("bookingConfirmed"));
});

test("guest rating has real keyboard-accessible radio inputs",()=>{
  const closing=read("src/components/PremiumClosing.tsx");
  assert.ok(closing.includes('type="radio"'));
  assert.ok(closing.includes('name="rating"'));
  assert.ok(closing.includes('checked={rating===value}'));
  assert.ok(closing.includes('aria-live="polite"'));
  assert.ok(closing.includes('role="status"'));
});

test("footer has navigation, language switch and genuine map link",()=>{
  const closing=read("src/components/PremiumClosing.tsx");
  assert.ok(closing.includes("PremiumFooter"));
  assert.ok(closing.includes('href="#top"'));
  assert.ok(closing.includes("hrefLang"));
  assert.ok(closing.includes("google.com/maps/search"));
  assert.ok(closing.includes('rel="noopener noreferrer"'));
});

test("closing UI remains accessible, responsive, RTL-aware and motion-safe",()=>{
  const css=read("src/app/premium-closing.css");
  assert.ok(css.includes('max-width:540px'));
  assert.ok(css.includes('max-width:820px'));
  assert.ok(css.includes('[dir="rtl"]'));
  assert.ok(css.includes("prefers-reduced-motion:reduce"));
  assert.ok(css.includes(".opal-end-rating input:focus-visible+span"));
  const shell=read("src/components/HotelExperience.tsx");
  assert.ok(shell.includes("IntersectionObserver"));
});

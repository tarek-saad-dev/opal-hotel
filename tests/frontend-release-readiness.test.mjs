import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("Homepage no longer loads the full room/booking CSS payload",()=>{
  const root=read("src/app/layout.tsx");
  const rooms=read("src/app/[locale]/rooms/layout.tsx");
  const booking=read("src/app/[locale]/booking/layout.tsx");
  const homepage=read("src/app/premium-sections.css");
  assert.ok(!root.includes('import "./rooms-experience.css"'));
  assert.ok(!root.includes('import "./booking-experience.css"'));
  assert.ok(rooms.includes('import "../../rooms-experience.css"'));
  assert.ok(booking.includes('import "../../booking-experience.css"'));
  assert.ok(homepage.includes(".opal-room-details-link"));
  assert.ok(homepage.includes(".opal-rooms-collection-link"));
});

test("HTML assistive language direction updates across English/Arabic navigation",()=>{
  const loc=read("src/components/LocaleDocumentSync.tsx");
  const layout=read("src/app/[locale]/layout.tsx");
  assert.ok(loc.includes("document.documentElement.lang=locale"));
  assert.ok(loc.includes('document.documentElement.dir=locale==="ar"?"rtl":"ltr"'));
  assert.ok(layout.includes("<LocaleDocumentSync locale={locale}>"));
  assert.ok(layout.includes("dir={locale === \"ar\" ? \"rtl\" : \"ltr\"}"));
});

test("Route transitions remain readable and honor reduced motion",()=>{
  const tpl=read("src/app/[locale]/template.tsx");
  const css=read("src/app/route-polish.css");
  assert.ok(tpl.includes("opal-route-transition"));
  assert.ok(css.includes("@media(prefers-reduced-motion:no-preference)"));
  assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
  assert.ok(css.includes("opal-route-arrive"));
});

test("Resilient page loading, 404 and error states provide meaningful actions",()=>{
  const loading=read("src/app/[locale]/loading.tsx");
  const missing=read("src/app/[locale]/not-found.tsx");
  const error=read("src/app/[locale]/error.tsx");
  assert.ok(loading.includes('role="status"'));
  assert.ok(loading.includes('aria-busy="true"'));
  assert.ok(missing.includes("404 /"));
  assert.ok(missing.includes("Back to homepage"));
  assert.ok(missing.includes("Explore room concepts"));
  assert.ok(missing.includes("العودة للرئيسية"));
  assert.ok(error.includes("reset"));
  assert.ok(error.includes("Try again"));
  assert.ok(error.includes("إعادة المحاولة"));
  assert.ok(error.includes("No reservation has been submitted or created."));
});

test("No reservation/backend functionality added by release readiness work",()=>{
  for(const file of [
    "src/app/[locale]/loading.tsx",
    "src/app/[locale]/error.tsx",
    "src/app/[locale]/not-found.tsx",
    "src/app/[locale]/template.tsx",
    "src/components/LocaleDocumentSync.tsx",
  ]) {
    const src=read(file);
    assert.ok(!src.includes("fetch("),`No network submission permitted in ${file}`);
    assert.ok(!src.includes("/api/booking"),`No booking backend permitted in ${file}`);
  }
});

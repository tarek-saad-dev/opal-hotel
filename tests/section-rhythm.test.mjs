import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("All seven homepage editorial sections retain independent content-aware sizing",()=>{
  const css=read("src/app/section-rhythm.css");
  const home=read("src/components/HotelExperience.tsx");
  const layout=read("src/app/layout.tsx");
  for(const selector of [".premium-hero",".opal-stage-story",".opal-stage-facilities",
    ".opal-stage-location",".opal-stage-rooms",".opal-stage-gallery",
    ".opal-stage-reviews",".opal-stage-contact",".opal-end-footer"]){
    assert.ok(css.includes(selector),"Missing rhythm policy for "+selector);
  }
  assert.match(css,/min-height:100svh/);
  assert.match(css,/\.premium-hero\s*\{\s*height:auto;/);
  assert.match(css,/\.opal-stage-gallery\s*\{\s*min-height:0;/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/max-height:720px/);
  assert.match(layout,/import "\.\/section-rhythm\.css"/);
  for(const id of ["overview","facilities","location","rooms","gallery","reviews","contact"])
    assert.ok(home.includes('id="'+id+'"'),"Missing homepage section "+id);
  assert.ok(!css.includes("scroll-snap-type:"),"Do not force section scrolling");
});

test("Room pages and booking flow expand based on content on short and mobile screens",()=>{
  const rooms=read("src/app/rooms-experience.css");
  const booking=read("src/app/booking-experience.css");
  for(const selector of [".room-exp-collection-hero",".room-exp-catalogue-section",
    ".room-exp-detail-hero",".room-exp-detail-story",".room-exp-related"])
    assert.ok(rooms.includes(selector),selector);
  assert.match(rooms,/\.room-exp-detail-hero\{min-height:0;/);
  assert.match(rooms,/\.room-exp-gallery-open\{height:clamp/);
  assert.match(booking,/\.opal-book-page\{min-height:calc\(100svh/);
  assert.match(booking,/\.opal-book-summary\{position:static\}/);
  assert.match(booking,/\.opal-book-layout\{\s*min-height:0;/);
});

test("Every live public guest route and RTL locale is measured with real browser geometry",()=>{
  const audit=read("scripts/audit-section-heights.mjs");
  const workflow=read(".github/workflows/frontend-visual-preview.yml");
  const pkg=read("package.json");
  for(const term of ["light-and-stillness","quiet-comforts","slow-mornings",
    "opal-book-introduction","room-exp-catalogue-section","premium-hero",
    "document.documentElement.scrollWidth","heroCopyFits","short-laptop","small-mobile"])
    assert.ok(audit.includes(term),term);
  assert.match(audit,/for\(const locale of \["en","ar"\]\)/);
  assert.match(audit,/path\.join\(directory,"report\.md"\)/);
  assert.match(audit,/127\\\.0\\\.0\\\.1/);
  assert.match(workflow,/npm run audit:sections/);
  assert.match(pkg,/"audit:sections": "node scripts\/audit-section-heights.mjs"/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read = path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Retired room concept routes redirect to the homepage rooms section",()=>{
  for(const file of ["src/app/[locale]/rooms/page.tsx","src/app/[locale]/rooms/[slug]/page.tsx"]){
    const src=read(file);
    assert.ok(src.includes("permanentRedirect(`/${locale}#rooms`)"));
  }
  assert.ok(!existsSync(new URL("../src/components/RoomsExperience.tsx",import.meta.url)));
});

test("Room slots are storage keys only, not invented room types",()=>{
  const src=read("src/lib/room-concepts.ts");
  assert.ok(src.includes("They are not room types"));
  assert.ok(!src.includes("introduction"));
  for(const slug of ["light-and-stillness","quiet-comforts","slow-mornings"])assert.ok(src.includes(slug));
});

test("Homepage rooms section shows the hotel's real room facts and only real photos",()=>{
  const src=read("src/components/PremiumSections.tsx");
  assert.ok(src.includes("c.roomFacts.count"));
  assert.ok(src.includes("c.roomFacts.features"));
  assert.ok(src.includes("filter(index=>media.isReal(index))"));
  assert.ok(src.includes('href="#booking"'));
  const content=read("src/lib/hotel-content.ts");
  assert.ok(content.includes('count: "40 rooms"'));
  assert.ok(content.includes('count:"40 غرفة"'));
});

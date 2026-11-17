import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";

const read = (p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("EN and AR entry points are preserved",()=>{
  const c=read("src/lib/hotel-content.ts");
  assert.match(c,/const en: HotelContent/);
  assert.match(c,/const ar: HotelContent/);
  assert.match(c,/hotelName:/);
});
test("Reference order and booking integration gate are preserved",()=>{
  const p=read("src/components/HotelExperience.tsx");
  const ids=["overview","facilities","location","rooms","gallery","reviews","contact"];
  const positions=ids.map(x=>p.indexOf('id="'+x+'"'));
  assert.ok(positions.every(x=>x>=0),"all approved reference sections must exist");
  assert.ok(positions.every((x,i)=>i===0||x>positions[i-1]),"reference sections must preserve order");
  assert.match(p,/not connected yet/i);
  assert.doesNotMatch(p,/booking confirmed/i);
});
test("Legacy photos are labelled temporary reference sources",()=>{
  const p=read("src/lib/gallery.ts");
  assert.match(p,/third-party-reference/);
  assert.match(p,/Replace with owned, local copies/);
});

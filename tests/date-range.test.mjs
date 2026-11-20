import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const d=await import("../src/lib/date-range.ts");

test("calendar grid starts on Sunday in Arabic and Monday in English",()=>{
  // 1 Nov 2026 is a Sunday.
  assert.equal(d.monthGrid("2026-11-01","ar")[0][0],"2026-11-01");
  assert.deepEqual(d.monthGrid("2026-11-01","en")[0].slice(5),["","2026-11-01"]);
  assert.ok(d.monthGrid("2026-02-01","en").every(row=>row.length===7));
});

test("picking a range: arrival, then departure; an earlier click restarts it",()=>{
  let r={checkin:"",checkout:"",picking:"checkin"};
  r=d.pickDay(r,"2026-11-21");
  assert.deepEqual(r,{checkin:"2026-11-21",checkout:"",picking:"checkout"});
  r=d.pickDay(r,"2026-11-25");
  assert.deepEqual(r,{checkin:"2026-11-21",checkout:"2026-11-25",picking:"checkin"});
  assert.equal(d.nightsCount(r.checkin,r.checkout),4);
  assert.deepEqual(d.pickDay({checkin:"2026-11-21",checkout:"",picking:"checkout"},"2026-11-20"),
    {checkin:"2026-11-20",checkout:"",picking:"checkout"});
  // Changing the arrival keeps a later departure.
  assert.deepEqual(d.pickDay({checkin:"2026-11-21",checkout:"2026-11-28",picking:"checkin"},"2026-11-23"),
    {checkin:"2026-11-23",checkout:"2026-11-28",picking:"checkout"});
});

test("dates use Western digits in both languages and Arabic nights read naturally",()=>{
  assert.match(d.formatLong("2026-11-21","ar"),/21/);
  assert.match(d.formatLong("2026-11-21","ar"),/نوفمبر/);
  assert.equal(d.formatLong("2026-11-21","en"),"Sat, 21 Nov 2026");
  assert.equal(d.nightsLabel(1,"ar"),"ليلة واحدة");
  assert.equal(d.nightsLabel(2,"ar"),"ليلتان");
  assert.equal(d.nightsLabel(4,"ar"),"4 ليالٍ");
  assert.equal(d.nightsLabel(14,"ar"),"14 ليلة");
  assert.equal(d.nightsLabel(1,"en"),"1 night");
});

test("month moves clamp to the last day and survive DST",()=>{
  assert.equal(d.shiftMonthDay("2026-01-31",1),"2026-02-28");
  assert.equal(d.addMonths("2026-12-01",1),"2027-01-01");
  assert.equal(d.addDays("2026-03-28",2),"2026-03-30");
});

test("both booking forms use the shared range picker",()=>{
  const head=read("src/components/PremiumMasthead.tsx");
  const page=read("src/components/BookingExperience.tsx");
  const picker=read("src/components/DateRangePicker.tsx");
  assert.ok(head.includes('<DateRangePicker variant="ribbon"'));
  assert.ok(page.includes('<DateRangePicker variant="page"'));
  assert.ok(!page.includes('type="date"')&&!head.includes('type="date"'));
  assert.ok(picker.includes('role="dialog"')&&picker.includes("aria-pressed"));
  assert.ok(picker.includes("createPortal"),"phone sheet must render on body");
});

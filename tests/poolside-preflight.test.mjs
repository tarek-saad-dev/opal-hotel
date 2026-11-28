import test from "node:test";
import assert from "node:assert/strict";
import { checkedOrigin,catalogIssues,expectedDay,expectedStay,availabilityIssues,futureWindow } from "../scripts/poolside-preflight.mjs";
test("requires actual origins, rejects placeholders, paths and insecure remote origins",()=>{
 assert.equal(checkedOrigin("http://127.0.0.1:8000"),"http://127.0.0.1:8000");
 assert.throws(()=>checkedOrigin("https://YOUR-STAGING-HOST.example"));
 assert.throws(()=>checkedOrigin("https://hotel.example.org/api/v1"));
 assert.throws(()=>checkedOrigin("http://hotel.example.org"));
});
test("checks stable slugs and decimal money without inventing media",()=>{
 const day=expectedDay.map((slug,i)=>({id:i+1,slug,is_active:true,name_en:"Day",name_ar:"يوم",price_per_guest:"250.00",currency:"EGP"}));
 const stays=expectedStay.map((slug_en,i)=>({id:i+1,slug_en,is_active:true,name_en:"Stay",name_ar:"إقامة",price_per_night:"700.00",max_guests:2,currency:"EGP"}));
 assert.deepEqual(catalogIssues(day,"day"),[]);
 assert.deepEqual(catalogIssues(stays,"stay"),[]);
 assert.ok(catalogIssues(day.slice(1),"day",{requireHistoricalSlugs:true}).length);
 assert.deepEqual(catalogIssues([{...day[0],slug:"opal-day-experience"}],"day"),[]);
 assert.ok(catalogIssues([],"day").length);
 assert.ok(catalogIssues([day[0],day[0]],"day").length);
 assert.ok(catalogIssues([{...day[0],price_per_guest:250},day[1]],"day").length);
 assert.ok(catalogIssues([{...stays[0],media:[]},...stays.slice(1)],"stay").length);
});

test("read-only availability validates contract without requiring vacant inventory",()=>{
 const type={id:1,currency:"EGP"};
 const base={availability:false,available_bubbles:0,price_per_night:"700.00",total_estimate:"700.00",currency:"EGP",bubbles:[]};
 assert.deepEqual(availabilityIssues(base,type),[]);
 const bubble={id:8,code:"B8",accommodation_type_id:1};
 assert.deepEqual(availabilityIssues({...base,availability:true,available_bubbles:1,bubbles:[bubble]},type),[]);
 assert.ok(availabilityIssues({...base,bubbles:[bubble,bubble]},type).length);
 assert.ok(availabilityIssues({...base,bubbles:[{...bubble,accommodation_type_id:2}]},type).length);
 assert.ok(availabilityIssues({...base,currency:"USD"},type).length);
});
test("availability window uses future Cairo dates across midnight and month boundaries",()=>{
 assert.deepEqual(futureWindow(new Date("2026-11-30T23:30:00Z")),{check_in:"2026-12-08",check_out:"2026-12-09",guests:"1"});
});

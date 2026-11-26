import test from "node:test";
import assert from "node:assert/strict";
import { checkedOrigin,catalogIssues,expectedDay,expectedStay } from "../scripts/poolside-preflight.mjs";
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
 assert.ok(catalogIssues(day.slice(1),"day").length);
 assert.ok(catalogIssues([{...day[0],price_per_guest:250},day[1]],"day").length);
 assert.ok(catalogIssues([{...stays[0],media:[]},...stays.slice(1)],"stay").length);
});

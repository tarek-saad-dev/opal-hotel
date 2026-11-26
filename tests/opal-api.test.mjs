import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source=readFileSync(new URL("../src/lib/opal-api.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {apiOrigin,makeOpalApi,OpalApiError,paymentDestination,poolsideConnection,isConfirmed,shouldPoll}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const origin="http://127.0.0.1:8000";

test("origin and payment URL restrictions",()=>{
  assert.equal(apiOrigin(origin+"/"),origin);
  assert.throws(()=>apiOrigin(origin+"/api/v1"));
  assert.throws(()=>apiOrigin("https://user:pass@example.com"));
  assert.throws(()=>paymentDestination("javascript:alert(1)","paymob",origin));
  assert.throws(()=>paymentDestination("http://example.com/pay","mock",origin));
  assert.throws(()=>paymentDestination("https://example.com/pay","mock",origin));
  assert.throws(()=>paymentDestination("http://example.com/pay","paymob",origin));
  assert.throws(()=>paymentDestination("https://user:pass@example.com/pay","paymob",origin));
  assert.equal(paymentDestination(origin+"/mock-pay?txn=test","mock",origin),origin+"/mock-pay?txn=test");
});
test("payment status is not confirmation",()=>{
  assert.equal(isConfirmed("paid"),false);
  assert.equal(shouldPoll("paid"),true);
  assert.equal(isConfirmed("confirmed"),true);
  assert.equal(shouldPoll("expired"),false);
});
test("request routes, locale, payload and no caching",async()=>{
  const old=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({success:true,data:{}});};
  try{
    const api=makeOpalApi(origin,"ar");
    const body={product_type:"day_use",guests:2,guest_name:"Example",guest_email:"guest@example.com",guest_phone:"12345678",visit_date:"2026-12-01",day_use_product_id:7};
    await api.create(body);await api.availability("two-bed-bubble","2026-12-01","2026-12-03",2);await api.pay("opaque/ref","mock");
    assert.equal(calls[0].url,origin+"/api/v1/bookings");
    assert.deepEqual(JSON.parse(calls[0].options.body),body);
    assert.equal(calls[0].options.headers["Accept-Language"],"ar");
    assert.equal(calls[0].options.cache,"no-store");
    assert.equal(calls[1].url,origin+"/api/v1/accommodations/two-bed-bubble/availability?check_in=2026-12-01&check_out=2026-12-03&guests=2");
    assert.equal(calls[2].url,origin+"/api/v1/bookings/opaque%2Fref/pay");
    assert.deepEqual(JSON.parse(calls[2].options.body),{gateway:"mock"});
  }finally{globalThis.fetch=old;}
});
test("error envelopes and rate limits remain distinguishable",async()=>{
  const old=globalThis.fetch;
  try{
    globalThis.fetch=async()=>Response.json({success:false,message:"Validation failed.",errors:{guest_email:["Invalid email"]}},{status:422});
    await assert.rejects(makeOpalApi(origin,"en").ping(),e=>e instanceof OpalApiError&&e.status===422&&e.fields.guest_email[0]==="Invalid email");
    globalThis.fetch=async()=>Response.json({success:false},{status:429,headers:{"Retry-After":"12"}});
    await assert.rejects(makeOpalApi(origin,"en").ping(),e=>e.status===429&&e.retryAfter===12);
    globalThis.fetch=async()=>Response.json({success:false});
    await assert.rejects(makeOpalApi(origin,"en").ping(),e=>e.status===502);
  }finally{globalThis.fetch=old;}
});

test("invalid gateway settings fail closed for both public and agency callers",()=>{
 assert.deepEqual(poolsideConnection(origin,"mock"),{origin,gateway:"mock"});
 assert.deepEqual(poolsideConnection("https://api.hotel.example.org","paymob"),{origin:"https://api.hotel.example.org",gateway:"paymob"});
 assert.equal(poolsideConnection("https://api.hotel.example.org","mock").origin,"");
 assert.equal(poolsideConnection("https://api.hotel.example.org","typo").origin,"");
 assert.equal(poolsideConnection("https://YOUR-STAGING-HOST.example","paymob").origin,"");
 assert.equal(poolsideConnection("http://api.hotel.example.org","paymob").origin,"");
});

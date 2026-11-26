import assert from "node:assert/strict";
import { chromium } from "playwright";
const base=process.env.OPAL_TEST_FRONTEND||"http://127.0.0.1:3001";
const api=process.env.OPAL_API_BASE_URL||"http://127.0.0.1:8000";
assert.match(api,/^http:\/\/127\.0\.0\.1:\d+$/,"Only an isolated loopback API may be mocked");
const browser=await chromium.launch({headless:true});
const day={id:1,slug:"zalina-luxor-day-experience",name_en:"Day Experience",name_ar:"التجربة النهارية",description_en:"Day visit",description_ar:"زيارة يومية",price_per_guest:"250.00",currency:"EGP",is_active:true};
const stay={id:2,slug_en:"one-bed-bubble",slug_ar:"فقاعة",name_en:"One Bed Bubble",name_ar:"فقاعة سرير واحد",description_en:"Stay overnight",description_ar:"إقامة ليلية",max_guests:2,price_per_night:"700.00",currency:"EGP",is_active:true};
const reference="isolated-test-reference";
let status="pending_payment",creates=0,pays=0;
const booking=()=>({booking_reference:reference,booking_code:"OPL-TEST-1234",product_type:"day_use",status,total:"500.00",currency:"EGP",guests:2,payment_expires_at:new Date(Date.now()+900000).toISOString(),hold_expires_at:null,tickets:status==="confirmed"?[{ticket_code:"TICKET-TEST",type:"day_use",title:"Day",valid_from:"2026-12-01",valid_to:"2026-12-01"}]:[]});
try{
 for(const locale of ["en","ar"]){
  status="pending_payment";
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.route(api+"/api/v1/**",async route=>{
    const req=route.request(),url=new URL(req.url());
    const headers={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,accept,accept-language","access-control-allow-methods":"GET,POST,OPTIONS"};
    if(req.method()==="OPTIONS"){await route.fulfill({status:204,headers});return;}
    let data;
    if(url.pathname==="/api/v1/day-use")data=[day];
    else if(url.pathname==="/api/v1/accommodations")data=[stay];
    else if(url.pathname==="/api/v1/accommodations/"+stay.slug_en)data=stay;
    else if(url.pathname==="/api/v1/bookings"&&req.method()==="POST"){
      const body=req.postDataJSON();
      assert.equal(body.product_type,"day_use");assert.equal(body.day_use_product_id,1);assert.equal(body.guests,2);creates++;data=booking();
    }else if(url.pathname==="/api/v1/bookings/"+reference)data=booking();
    else if(url.pathname.endsWith("/pay")){pays++;data={payment_url:api+"/mock-payment"};}
    else {await route.fulfill({status:404,headers,json:{success:false,message:"not found"}});return;}
    await route.fulfill({status:200,headers,json:{success:true,message:"ok",data}});
  });
  await page.goto(base+"/"+locale+"/experiences/day-use/"+day.slug);
  await page.getByRole("heading",{name:locale==="ar"?day.name_ar:day.name_en,exact:true}).waitFor();
  await page.getByRole("link",{name:locale==="ar"?"احجز التجربة":"Book this experience"}).click();
  await page.waitForURL("**/booking?*");
  await page.locator('select').filter({has:page.locator('option[value="1"]')}).waitFor();
  assert.equal(await page.locator('select').first().inputValue(),"1");
  await page.locator('input[name="guest_name"]').fill("Test Guest");
  await page.locator('input[name="guest_email"]').fill("guest@example.invalid");
  await page.locator('input[name="guest_phone"]').fill("+201000000000");
  await page.getByRole("button",{name:locale==="ar"?"إنشاء الحجز ومراجعة الإجمالي":"Create booking & review total"}).click();
  await page.locator('.opal-pool-status[data-tone="waiting"]').waitFor();
  await page.getByRole("button",{name:locale==="ar"?"المتابعة للدفع":"Continue to payment"}).waitFor();
  status="paid";
  await page.getByRole("button",{name:locale==="ar"?"تحديث الحالة":"Refresh status"}).click();
  await page.getByRole("heading",{name:locale==="ar"?"جارٍ التحقق من الدفع":"Payment verification"}).waitFor();
  assert.equal(await page.locator(".opal-pool-pass").count(),0);
  status="confirmed";
  await page.getByRole("button",{name:locale==="ar"?"تحديث الحالة":"Refresh status"}).click();
  await page.locator(".opal-pool-pass svg").waitFor();
  assert.equal(await page.locator(".opal-pool-pass").count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.reload();
  await page.locator(".opal-pool-pass svg").waitFor();
  status="failed";
  await page.getByRole("button",{name:locale==="ar"?"تحديث الحالة":"Refresh status"}).click();
  await page.locator('.opal-pool-status[data-tone="error"]').waitFor();
  assert.equal(await page.locator(".opal-pool-pass").count(),0);
  await context.close();
 }
 assert.equal(creates,2);assert.equal(pays,0);
 console.log("Poolside isolated bilingual detail / booking / status flow passed");
}finally{await browser.close();}

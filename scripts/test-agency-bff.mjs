import assert from "node:assert/strict";
import { createServer } from "node:http";
import { chromium } from "playwright";
const base=process.env.OPAL_TEST_FRONTEND||"http://127.0.0.1:3001";
const upstream=process.env.OPAL_API_BASE_URL||"http://127.0.0.1:8000";
assert.match(upstream,/^http:\/\/127\.0\.0\.1:\d+$/);
const token="test-only-sanctum-token";
let payCalls=0,logoutCalls=0,createCalls=0;
const identity={agency:{id:1,name:"Test agency",is_active:true},actor:{type:"agency",id:1,name:"Test owner"},capabilities:{}};
const booking={booking_reference:"child-reference",booking_code:"OPL-TEST-CHLD",product_type:"day_use",status:"pending_payment",total:"200.00",currency:"EGP",guests:1,can_pay:false};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,upstream).pathname;
 const send=(status,data)=>{res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data));};
 const ok=data=>send(200,{success:true,data});
 if(path==="/api/v1/agency/login"){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString());
  if(body.email!=="agency@example.invalid"||body.password!=="isolated-test")return send(401,{success:false});
  return ok({...identity,token});
 }
 if(req.headers.authorization!=="Bearer "+token)return send(401,{success:false});
 if(path==="/api/v1/agency/me")return ok(identity);
 if(path==="/api/v1/agency/day-use")return ok([{id:1,slug:"day-test",name_en:"Day test",name_ar:"تجربة يومية",is_active:true,price_per_guest:"100.00",currency:"EGP"}]);
 if(path==="/api/v1/agency/accommodations")return ok([{id:1,slug_en:"one-bed-bubble",name_en:"One Bed Bubble",name_ar:"فقاعة سرير واحد",is_active:true,max_guests:2,price_per_night:"200.00",currency:"EGP"}]);
 if(path==="/api/v1/agency/accommodations/one-bed-bubble/availability")return ok({availability:true,available_bubbles:2,price_per_night:"200.00",total_estimate:"200.00",currency:"EGP",bubbles:[10,11].map(id=>({id,code:"B"+id,accommodation_type_id:1,status:"available"}))});
 if(path==="/api/v1/agency/bookings/confirmed-reference")return ok({...booking,booking_reference:"confirmed-reference",booking_code:"OPL-TEST-1234",status:"confirmed",tickets:[{ticket_code:"TICKET-TEST",type:"day_use",title:"Day",valid_from:"2026-12-01",valid_to:"2026-12-01"}]});
 if(path==="/api/v1/agency/bookings"&&req.method==="POST"){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(body.product_type,"bubble_stay");assert.equal(body.guests,3);
  assert.deepEqual(body.bubbles,[{accommodation_type_id:1,bubble_id:10,guests:1},{accommodation_type_id:1,bubble_id:11,guests:2}]);
  createCalls++;return ok({...booking,booking_reference:"own-reference",product_type:"bubble_stay",can_pay:true});
 }
 if(path==="/api/v1/agency/bookings"){
  const page=Number(new URL(req.url,upstream).searchParams.get("page")||1);
  return send(200,{success:true,data:[booking],meta:{current_page:page,last_page:2}});
 }
 if(path==="/api/v1/agency/bookings/child-reference")return ok(booking);
 if(path==="/api/v1/agency/bookings/child-reference/pay"){payCalls++;return send(403,{success:false});}
 if(path==="/api/v1/agency/logout"){logoutCalls++;return ok(null);}
 return send(404,{success:false});
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(Number(new URL(upstream).port),"127.0.0.1",resolve);});
try{
 const request=(path,options={})=>fetch(base+"/api/agency/"+path,{redirect:"manual",...options});
 const post=(path,body,cookie,origin=base)=>request(path,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 assert.equal((await request("me")).status,401);
 assert.equal((await post("login",{email:"agency@example.invalid",password:"isolated-test"},null,"https://invalid.example")).status,403);
 const login=await post("login",{email:"agency@example.invalid",password:"isolated-test"});
 assert.equal(login.status,200);
 const raw=await login.text();assert.equal(raw.includes(token),false);
 const cookie=login.headers.get("set-cookie");assert.ok(cookie?.includes("HttpOnly"));assert.ok(cookie?.includes("Path=/api/agency"));assert.ok(cookie?.toLowerCase().includes("samesite=lax"));
 const session=cookie.split(";")[0];
 const me=await request("me",{headers:{Cookie:session}});assert.equal(me.status,200);
 assert.equal(me.headers.get("cache-control"),"private, no-store");
 const list=await request("bookings",{headers:{Cookie:session}});assert.equal((await list.json()).data[0].can_pay,false);
 assert.equal((await request("admin",{headers:{Cookie:session}})).status,404);
 assert.equal((await post("bookings",{product_type:"day_use",agency_id:123},session)).status,422);
 const stay={product_type:"bubble_stay",guests:3,guest_name:"Test",guest_email:"test@example.invalid",guest_phone:"+201000000000",check_in:"2026-12-01",check_out:"2026-12-02",random_assignment:false,bubbles:[{accommodation_type_id:1,bubble_id:10,guests:1},{accommodation_type_id:1,bubble_id:11,guests:2}]};
 assert.equal((await post("bookings",{...stay,bubbles:[{...stay.bubbles[0],agency_id:123}]},session)).status,422);
 assert.equal((await post("bookings",stay,session)).status,200);assert.equal(createCalls,1);
 const second=await request("bookings?page=2",{headers:{Cookie:session}});assert.equal((await second.json()).meta.current_page,2);
 const child=await request("bookings/child-reference",{headers:{Cookie:session}});assert.equal((await child.json()).data.can_pay,false);
 assert.equal((await post("bookings/child-reference/pay",{},session)).status,403);assert.equal(payCalls,1);
 const logout=await post("logout",{},session);assert.equal(logout.status,200);assert.match(logout.headers.get("set-cookie"),/Max-Age=0/i);assert.equal(logoutCalls,1);
 const browser=await chromium.launch({headless:true});
 try{
  for(const locale of ["en","ar"]){
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage();
   const t=(en,ar)=>locale==="ar"?ar:en;
   await page.goto(base+"/"+locale+"/agency?reference=child-reference&success=true");
   await page.getByLabel(t("Email","البريد الإلكتروني"),{exact:true}).fill("agency@example.invalid");
   await page.getByLabel(t("Password","كلمة المرور"),{exact:true}).fill("isolated-test");
   await page.getByRole("button",{name:t("Sign in","دخول"),exact:true}).click();
   await page.getByRole("heading",{name:t("Complete your payment","أكمل الدفع"),exact:true}).waitFor();
   assert.equal(await page.getByRole("button",{name:t("Continue to payment","المتابعة للدفع"),exact:true}).count(),0);
   await page.goto(base+"/"+locale+"/agency?reference=confirmed-reference");
   await page.locator(".opal-pool-pass svg").waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.getByRole("button",{name:t("New booking","حجز جديد"),exact:true}).first().click();
   await page.getByLabel(t("Experience type","نوع التجربة"),{exact:true}).selectOption("bubble_stay");
   await page.getByLabel(t("Accommodation","نوع الإقامة"),{exact:true}).selectOption("1");
   await page.getByRole("button",{name:t("+ Add unit","+ إضافة وحدة"),exact:true}).click();
   await page.getByLabel(t("Guests in unit","ضيوف الوحدة"),{exact:true}).nth(1).fill("2");
   await page.getByLabel(t("Automatically assign all units","تخصيص كل الوحدات تلقائيًا")).uncheck();
   await page.getByLabel(t("Physical unit","الوحدة الفعلية"),{exact:true}).first().selectOption("10");
   await page.getByLabel(t("Physical unit","الوحدة الفعلية"),{exact:true}).nth(1).selectOption("11");
   await page.getByLabel(t("Guest name","اسم الضيف"),{exact:true}).fill("Test");
   await page.getByLabel(t("Guest email","بريد الضيف"),{exact:true}).fill("test@example.invalid");
   await page.getByLabel(t("Guest phone","هاتف الضيف"),{exact:true}).fill("+201000000000");
   await page.getByRole("button",{name:t("Create and review total","إنشاء ومراجعة الإجمالي"),exact:true}).click();
   await page.getByRole("button",{name:t("Continue to payment","المتابعة للدفع"),exact:true}).waitFor();
   await context.close();
  }
  assert.equal(createCalls,3);
 }finally{await browser.close();}
 console.log("Agency isolated BFF and bilingual browser flows passed");
}finally{await new Promise(resolve=>server.close(resolve));}

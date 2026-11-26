import assert from "node:assert/strict";
import { createServer } from "node:http";
const base=process.env.OPAL_TEST_FRONTEND||"http://127.0.0.1:3001";
const upstream=process.env.OPAL_API_BASE_URL||"http://127.0.0.1:8000";
assert.match(upstream,/^http:\/\/127\.0\.0\.1:\d+$/);
const token="test-only-sanctum-token";
let payCalls=0,logoutCalls=0;
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
 if(path==="/api/v1/agency/bookings")return ok([booking]);
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
 assert.equal((await post("bookings/child-reference/pay",{},session)).status,403);assert.equal(payCalls,1);
 const logout=await post("logout",{},session);assert.equal(logout.status,200);assert.match(logout.headers.get("set-cookie"),/Max-Age=0/i);assert.equal(logoutCalls,1);
 console.log("Agency isolated BFF auth, origin, allowlist, creator scope and logout passed");
}finally{await new Promise(resolve=>server.close(resolve));}

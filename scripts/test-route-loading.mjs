/** Browser QA for the Opal route loader. Only local test servers allowed. */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const origin=process.env.OPAL_PREVIEW_URL||"http://127.0.0.1:3000";
if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))
  throw new Error("Route-loader browser test only accepts a local server");
const dir=path.resolve("artifacts/frontend-preview/route-loading");
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
let count=0;
try{
  for(const locale of ["en","ar"]){
    for(const size of [{name:"desktop",width:1440,height:900},
      {name:"mobile",width:390,height:844}]){
      const ctx=await browser.newContext({
        viewport:{width:size.width,height:size.height},
        reducedMotion:"no-preference",locale:locale==="ar"?"ar-EG":"en-US"
      });
      const page=await ctx.newPage();
      try{
        const response=await page.goto(origin+"/"+locale,{waitUntil:"domcontentloaded"});
        if(response?.status()!==200)throw new Error("Homepage returned "+response?.status());
        await page.locator(".premium-booking-submit").waitFor({state:"visible"});

        // In-page hash navigation must never display a route overlay.
        await page.locator('.premium-desktop-nav a[href="#overview"]').first()
          .evaluate(el=>el.click());
        await page.waitForTimeout(260);
        if(await page.locator(".opal-route-loading.is-overlay").count()!==0)
          throw new Error("In-page anchor triggered a full page loader");

        // Hold just the *real* booking server-component response. This test
        // never delays the production website or changes navigation logic.
        let delayed=0;
        await page.route(`**/${locale}/booking?**`,async route=>{
          const request=route.request();
          if(request.resourceType()==="fetch"){
            delayed++;
            await new Promise(resolve=>setTimeout(resolve,1050));
          }
          await route.continue();
        });
        await page.locator(".premium-booking-submit").click();
        const overlay=page.locator(".opal-route-loading.is-overlay");
        await overlay.waitFor({state:"visible",timeout:3500});
        if(!delayed)throw new Error("Booking navigation was not delayed by browser fixture");
        const letters=(await overlay.locator(".opal-loader-wordmark").innerText()).replace(/\s/g,"");
        if(letters!=="OPALLEGACY")throw new Error("Hotel name missing: "+letters);
        const expectedLabel=locale==="ar"?"جاري فتح الصفحة":"Opening your page";
        if(await overlay.getAttribute("aria-label")!==expectedLabel)
          throw new Error("Missing localized accessible loading status");
        const animation=await overlay.locator(".opal-loader-wordmark")
          .evaluate(el=>getComputedStyle(el).animationName);
        if(!animation.includes("opal-loader-name-enter"))
          throw new Error("Wordmark should have a quiet one-time entrance animation");
        const dims=await overlay.evaluate(el=>({
          width:el.getBoundingClientRect().width,viewport:innerWidth
        }));
        if(dims.width>dims.viewport+2)throw new Error("Loading overlay has horizontal overflow");
        await page.screenshot({path:path.join(dir,`${locale}-${size.name}.png`),animations:"allow"});
        await page.locator(".opal-book-step.is-current").waitFor({state:"visible",timeout:12000});
        await overlay.waitFor({state:"detached",timeout:5000});
        count++;
      }finally{await ctx.close();}
    }
  }

  // Accessibility: when the guest asks for reduced motion, the brand remains
  // readable and all decorative animations stop.
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  try{
    const page=await ctx.newPage();
    await page.goto(origin+"/en",{waitUntil:"domcontentloaded"});
    // DOMContentLoaded precedes hydration: wait for the booking state effect
    // before using the React submit handler in reduced-motion mode.
    await page.waitForFunction(()=>{
      const input=document.querySelector('input[name="checkin"]');
      return input instanceof HTMLInputElement&&/^\\d{4}-\\d{2}-\\d{2}$/.test(input.value);
    },null,{timeout:8000});
    await page.route("**/en/booking?**",async route=>{
      if(route.request().resourceType()==="fetch")
        await new Promise(resolve=>setTimeout(resolve,900));
      await route.continue();
    });
    await page.locator(".premium-booking-submit").click();
    const overlay=page.locator(".opal-route-loading.is-overlay");
    await overlay.waitFor({state:"visible",timeout:3500});
    const letter=overlay.locator(".opal-loader-wordmark");
    const reduced=await letter.evaluate(el=>({
      opacity:getComputedStyle(el).opacity,
      animation:getComputedStyle(el).animationName
    }));
    if(reduced.opacity!=="1"||reduced.animation!=="none")
      throw new Error("Reduced-motion fallback must be static and readable");
    await overlay.screenshot({path:path.join(dir,"reduced-motion.png"),animations:"disabled"});
    await page.locator(".opal-book-step.is-current").waitFor({state:"visible",timeout:12000});
    await overlay.waitFor({state:"detached",timeout:5000});
    count++;
  }finally{await ctx.close();}
}finally{await browser.close();}
console.log("Opal route-loading transitions passed: "+count+" real-browser cases");

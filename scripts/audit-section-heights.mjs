/** Opal Legacy: per-route / per-section viewport sizing audit.
 * Runs against a dedicated local Next.js server, never edits production CMS.
 * Reports proportions rather than forcing all content into 100vh.
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const origin=process.env.OPAL_PREVIEW_URL||"http://127.0.0.1:3000";
if(!/^(?:http:\/\/127\.0\.0\.1|http:\/\/localhost)(?::\d+)?$/.test(origin))
  throw new Error("Viewport audit only runs against a local test server");
const viewports=[
  {name:"desktop",width:1440,height:900},
  {name:"short-laptop",width:1440,height:650},
  {name:"tablet",width:768,height:1024},
  {name:"mobile",width:390,height:844},
  {name:"small-mobile",width:320,height:640}
];
const routes=[
  // #gallery is hidden until the hotel's own photos are published, so it is
  // not part of the fixed list measured on a fresh CMS.
  {path:"",selectors:[
    ".premium-hero",".premium-booking-zone","#overview","#facilities","#location","#rooms",
    "#reviews","#contact",".opal-end-footer"]},
  {path:"booking",selectors:[
    ".opal-book-introduction",".opal-book-stepbar",".opal-book-layout",".opal-book-footer"]}
];
const directory=path.resolve("artifacts/frontend-preview/section-rhythm");
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
const errors=[];
try{
  for(const locale of ["en","ar"]){
    for(const viewport of viewports){
      const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
        locale:locale==="ar"?"ar-EG":"en-US",reducedMotion:"reduce",deviceScaleFactor:1});
      const page=await context.newPage();
      page.setDefaultTimeout(10000);
      try{
        for(const route of routes){
          // Each route has its own live CMS/locale content. No screenshots
          // or metrics are fabricated from static source estimates.
          const name="/"+locale+(route.path?"/"+route.path:"");
          const response=await page.goto(origin+name,{waitUntil:"domcontentloaded",timeout:15000});
          if(response?.status()!==200){
            errors.push(name+" ("+viewport.name+"): HTTP "+response?.status());
            continue;
          }
          await page.locator(route.selectors[0]).waitFor({state:"visible"});
          const values=await page.evaluate(selectors=>{
            const geometry=selectors.map(selector=>{
              const node=document.querySelector(selector);
              if(!node)return {selector,missing:true};
              const rect=node.getBoundingClientRect();
              const style=getComputedStyle(node);
              return {
                selector,
                height:Math.round(rect.height),
                viewportPct:Number((100*rect.height/innerHeight).toFixed(1)),
                width:Math.round(rect.width),
                hidden:style.display==="none"||style.visibility==="hidden",
                scrollHeight:node.scrollHeight,
                clientHeight:node.clientHeight,
                overflowY:style.overflowY
              };
            });
            const hero=document.querySelector(".premium-hero");
            const copy=document.querySelector(".premium-hero-copy");
            const heroRect=hero?.getBoundingClientRect();
            const copyRect=copy?.getBoundingClientRect();
            return {
              viewportHeight:innerHeight,
              documentWidth:document.documentElement.scrollWidth,
              viewportWidth:innerWidth,
              sections:geometry,
              heroCopyFits:!!(heroRect&&copyRect&&copyRect.top>=heroRect.top-2
                &&copyRect.bottom<=heroRect.bottom+2)
            };
          },route.selectors);
          report.push({locale,viewport:viewport.name,route:name,...values});
          // Only actual usability invariants are blocking. A gallery or
          // CMS-expanded section can legitimately exceed one viewport.
          if(values.documentWidth>values.viewportWidth+3)
            errors.push(name+" "+viewport.name+": horizontal overflow "+values.documentWidth+" > "+values.viewportWidth);
          for(const section of values.sections){
            if(section.missing||section.hidden)
              errors.push(name+" "+viewport.name+": missing or hidden section "+section.selector);
            else if(section.height<24)
              errors.push(name+" "+viewport.name+": zero-height section "+section.selector);
          }
          if(route.path===""&&(
            values.sections[0].height<values.viewportHeight*.95||!values.heroCopyFits
          ))errors.push(name+" "+viewport.name+": Hero must fill viewport without clipping copy");
        }
      }catch(error){
        errors.push(locale+" "+viewport.name+": "+String(error).slice(0,300));
      }finally{await context.close();}
    }
  }
}finally{await browser.close();}
await fs.writeFile(path.join(directory,"audit.json"),JSON.stringify({
  generatedAt:new Date().toISOString(),records:report,errors
},null,2));
const rows=[
  "# Opal Legacy: viewport section audit",
  "",
  "All measurements come from a real local browser run, at each route/locale/viewport.",
  "Values are % of the viewport height. >100% can be correct for galleries, forms and long text.",
  "",
  "| Language | Viewport | Route | Section | Height px | Viewport % |",
  "|---|---|---|---|---:|---:|",
  ...report.flatMap(r=>r.sections.map(s=>
    "| "+r.locale+" | "+r.viewport+" | "+r.route+" | "+s.selector+
    " | "+(s.height??"—")+" | "+(s.viewportPct??"—")+"% |"
  )),
  "",
  "## Blocking issues",
  "",
  ...(errors.length?errors.map(e=>"- "+e):["None."])
];
await fs.writeFile(path.join(directory,"report.md"),rows.join("\n")+"\n");
console.log("Audited "+report.length+" localized route/viewport combinations and "+
  report.reduce((n,r)=>n+r.sections.length,0)+" sections; blocking issues: "+errors.length);
if(errors.length){
  console.error(errors.slice(0,25).join("\n"));
  process.exitCode=1;
}

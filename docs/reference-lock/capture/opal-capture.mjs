/**
 * Opal Legacy Reference Lock — non-destructive capture.
 * Run from a machine able to load https://opal-legacy.luxor-hotels-eg.com
 *
 * npm install && npx playwright install chromium && npm run capture
 *
 * This script does not submit any form, book any room, or create reviews.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = 'https://opal-legacy.luxor-hotels-eg.com';
const out = path.resolve('output');
const views = [
  {name:'desktop-1440', width:1440, height:900},
  {name:'desktop-1280', width:1280, height:800},
  {name:'tablet-768', width:768, height:1024},
  {name:'mobile-390', width:390, height:844},
  {name:'mobile-375', width:375, height:812},
];
const locales = ['en','ar'];

function clean(name){ return name.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,70); }
async function writeJson(file,data){ await fs.writeFile(file,JSON.stringify(data,null,2),'utf8'); }

async function captureFragment(page, locator, file){
  try {
    const node = locator.first();
    if (await node.count() && await node.isVisible({timeout:1000})) {
      await node.screenshot({path:file,timeout:13000,animations:'disabled'});
      return true;
    }
  } catch { /* optional component may not be on-screen / may be hidden */ }
  return false;
}

async function loadPage(page, url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(1300);
  try { await page.evaluate(async() => { await Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise(r=>setTimeout(r,1800)),
  ]); }); } catch {}
  // Trigger lazy images through natural scrolling, without submitting anything.
  await page.evaluate(async () => {
    let y=0;
    const max=Math.min(document.documentElement.scrollHeight,30000);
    while(y<max){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,85)); y+=650; }
    window.scrollTo(0,0);
  });
  await page.waitForTimeout(850);
}

async function auditDom(page){
  return page.evaluate(() => {
    const css = node => {
      if(!node) return null;
      const s=getComputedStyle(node); const r=node.getBoundingClientRect();
      return {
        tag:node.tagName.toLowerCase(),text:(node.innerText||'').trim().slice(0,180),
        rect:{x:+r.x.toFixed(2),y:+r.y.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2)},
        style:{fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,
          color:s.color,backgroundColor:s.backgroundColor,padding:s.padding,margin:s.margin,
          borderRadius:s.borderRadius,boxShadow:s.boxShadow,position:s.position,
          display:s.display,gap:s.gap,objectFit:s.objectFit,objectPosition:s.objectPosition},
      };
    };
    const sections = Array.from(document.querySelectorAll('h1,h2,h3'));
    const selectors=['body','header','nav','main','footer','h1','h2','h3','button','input','select','textarea'];
    const samples=Object.fromEntries(selectors.map(sel=>[sel,css(document.querySelector(sel))]));
    const headingNodes=sections.map(n=>({level:n.tagName,text:(n.textContent||'').trim(),css:css(n)}));
    const images=Array.from(document.querySelectorAll('img')).map((n,i)=>({
      index:i, alt:n.alt,src:n.getAttribute('src'),currentSrc:n.currentSrc,
      srcset:n.getAttribute('srcset'),dataSrc:n.getAttribute('data-src'),
      naturalWidth:n.naturalWidth,naturalHeight:n.naturalHeight,css:css(n),
    }));
    const links=Array.from(document.querySelectorAll('a')).map((n,i)=>({index:i,text:(n.innerText||'').trim().slice(0,150),href:n.href}));
    const controls=Array.from(document.querySelectorAll('input,select,textarea,button')).map((n,i)=>({
      index:i,tag:n.tagName.toLowerCase(),type:n.getAttribute('type'),name:n.getAttribute('name'),
      id:n.id,ariaLabel:n.getAttribute('aria-label'),placeholder:n.getAttribute('placeholder'),
      value:n.tagName==='INPUT'?n.getAttribute('value'):null,text:(n.innerText||'').trim().slice(0,90),css:css(n),
    }));
    const styleFreq = {};
    for(const n of Array.from(document.querySelectorAll('body,header,nav,main,footer,h1,h2,h3,p,a,button,input')).slice(0,500)){
      const s=getComputedStyle(n);
      for(const [key,value] of [['fg',s.color],['bg',s.backgroundColor],['font',s.fontFamily]]){
        const k=key+':'+value; styleFreq[k]=(styleFreq[k]||0)+1;
      }
    }
    return {
      url:location.href,title:document.title,htmlLang:document.documentElement.lang,
      htmlDir:document.documentElement.dir,viewport:{width:innerWidth,height:innerHeight},
      body:{scrollWidth:document.body.scrollWidth,scrollHeight:document.body.scrollHeight},
      document:{scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},
      samples,headings:headingNodes,images,links,controls,styleFrequency:styleFreq,
    };
  });
}

const browser=await chromium.launch({headless:true});
let failed=0; const summary=[];
for(const lang of locales){
  for(const vp of views){
    const folder=path.join(out,lang,vp.name);
    await fs.mkdir(folder,{recursive:true});
    const context=await browser.newContext({
      viewport:{width:vp.width,height:vp.height},
      locale:lang==='ar'?'ar-EG':'en-US',
      deviceScaleFactor:1,
      reducedMotion:'reduce',
      isMobile:vp.name.startsWith('mobile'),
      hasTouch:vp.name.startsWith('mobile'),
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push({kind:'pageerror',message:String(err.message).slice(0,450)}));
    page.on('requestfailed',req=>errors.push({kind:'requestfailed',url:req.url(),reason:req.failure()?.errorText}));
    const target=`${base}/${lang}/`;
    try {
      console.log(`CAPTURE ${lang} ${vp.name} ${target}`);
      await loadPage(page,target);
      await page.screenshot({path:path.join(folder,'full.png'),fullPage:true,timeout:45000,animations:'disabled'});
      const audit=await auditDom(page);
      await writeJson(path.join(folder,'dom-audit.json'),audit);
      await captureFragment(page,page.locator('header'),path.join(folder,'header.png'));
      await captureFragment(page,page.locator('h1'),path.join(folder,'hotel-title.png'));
      // These screenshots capture the heading block, NOT assumed entire sections.
      const sectionNames=lang==='ar'
        ?['مرافق الفندق','الموقع','الغرف والإتاحة','معرض الصور','اكتب تعليق','اتصل بنا']
        :['Facilities','Location','Rooms & Availability','Gallery','Write a review','Contact Us'];
      for(const label of sectionNames){
        const heading=page.getByRole('heading',{name:label,exact:false});
        if(await heading.count()) {
          const file=path.join(folder,`heading-${clean(label)}.png`);
          await captureFragment(page,heading,file);
        }
      }
      const menu=page.getByText(lang==='ar'?'القائمة':'Menu',{exact:true});
      try{
        if(await menu.count() && await menu.first().isVisible({timeout:900})){
          await menu.first().click({timeout:3500});
          await page.screenshot({path:path.join(folder,'menu-open.png'),timeout:30000,animations:'disabled'});
          await page.keyboard.press('Escape');
        }
      }catch(err){errors.push({kind:'menuCapture',message:err.message.slice(0,200)});}
      const checkIn = page.locator('input[type="date"],input[name*="checkin" i],input[name*="check_in" i]').first();
      try{
        if(await checkIn.count() && await checkIn.isVisible({timeout:700})){
          await checkIn.click({timeout:2500});
          await page.screenshot({path:path.join(folder,'date-control-open.png'),timeout:30000,animations:'disabled'});
          await page.keyboard.press('Escape');
        }
      }catch(err){errors.push({kind:'dateCapture',message:err.message.slice(0,200)});}
      await writeJson(path.join(folder,'capture-status.json'),{success:true,lang,viewport:vp,target,errors,screenshot:true,measured:true,
        notice:'Menu/date screenshots are opportunistic; examine and verify their real UI state. Forms were not submitted.'});
      summary.push({lang,viewport:vp.name,success:true,imageCount:audit.images.length,headingCount:audit.headings.length,errors:errors.length});
    }catch(err){
      failed++;
      await writeJson(path.join(folder,'capture-status.json'),{success:false,lang,viewport:vp,target,
        error:String(err.stack||err).slice(0,1400),errors});
      summary.push({lang,viewport:vp.name,success:false,error:String(err.message).slice(0,190)});
      console.error(`FAILED ${lang} ${vp.name}: ${err.message}`);
    }finally {await context.close();}
  }
}
await browser.close();
await fs.mkdir(out,{recursive:true});
await writeJson(path.join(out,'summary.json'),{capturedAt:new Date().toISOString(),results:summary,failed});
console.log(JSON.stringify({failed,results:summary},null,2));
if(failed)process.exitCode=1;

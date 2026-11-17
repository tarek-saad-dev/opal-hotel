/**
 * Visual QA of our own Next.js frontend, not the restricted hotel reference.
 * Requires the development/production server to be running on OPAL_PREVIEW_URL
 * (default http://127.0.0.1:3000).
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.OPAL_PREVIEW_URL || 'http://127.0.0.1:3000';
const out = path.resolve('artifacts/frontend-preview');
const screens = [
  {id:'desktop-1440',width:1440,height:900,isMobile:false},
  {id:'mobile-390',width:390,height:844,isMobile:true},
  {id:'tablet-768',width:768,height:1024,isMobile:false},
];
const langs = ['en','ar'];
const browser = await chromium.launch({headless:true});
let failures=0;
const records=[];

async function load(page,url) {
  let error;
  for(let i=0;i<18;i++){
    try {
      const result=await page.goto(url,{timeout:8000,waitUntil:'domcontentloaded'});
      if(result?.status()===200)return result;
      error=new Error('Unexpected HTTP '+result?.status());
    }catch(err){error=err;}
    await new Promise(resolve=>setTimeout(resolve,900));
  }
  throw error||new Error('Cannot load local preview');
}

for(const lang of langs)for(const screen of screens){
  const dir=path.join(out,lang,screen.id);
  await fs.mkdir(dir,{recursive:true});
  const ctx=await browser.newContext({
    viewport:{width:screen.width,height:screen.height},
    isMobile:screen.isMobile,hasTouch:screen.isMobile,
    reducedMotion:'reduce',deviceScaleFactor:1,locale:lang==='ar'?'ar-EG':'en-US'
  });
  // This job tests our frontend; do not repeatedly request the rate-limited reference host.
  await ctx.route('https://opal-legacy.luxor-hotels-eg.com/**', route=>route.abort('blockedbyclient'));
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push({type:'pageerror',message:String(err.message).slice(0,200)}));
  const url=`${origin}/${lang}`;
  try{
    await load(page,url);
    await page.waitForTimeout(1500);
    // Collect DOM state before any screenshot failure.
    const audit=await page.evaluate(()=>{
      const doc=document.documentElement;
      const images=Array.from(document.images).map(i=>({
        src:i.currentSrc,complete:i.complete,naturalWidth:i.naturalWidth,
        placeholder:i.dataset.placeholder==='true'
      }));
      const headings=Array.from(document.querySelectorAll('h1,h2')).map(n=>n.textContent?.trim());
      const ids=['overview','facilities','location','rooms','gallery','reviews','contact'];
      return {
        title:document.title,lang:doc.lang,dir:document.querySelector('[dir]')?.getAttribute('dir'),
        viewport:{width:innerWidth,height:innerHeight},document:{width:doc.scrollWidth,height:doc.scrollHeight},
        body:{width:document.body.scrollWidth,height:document.body.scrollHeight},
        headings,anchors:Object.fromEntries(ids.map(id=>[id,Boolean(document.getElementById(id))])),
        images,buttons:document.querySelectorAll('button').length,
        formCount:document.querySelectorAll('form').length,
      };
    });
    await fs.writeFile(path.join(dir,'audit.json'),JSON.stringify(audit,null,2));
    await page.screenshot({path:path.join(dir,'full.png'),fullPage:true,timeout:60000,animations:'disabled'});
    const header=page.locator('.site-header');
    if(await header.count())await header.screenshot({path:path.join(dir,'header.png'),timeout:12000});
    const hero=page.locator('.hero-gallery');
    if(await hero.count())await hero.screenshot({path:path.join(dir,'hero.png'),timeout:12000});
    const validHeadings=audit.headings.some(h=>/opal legacy/i.test(h||''));
    const validAnchors=Object.values(audit.anchors).every(Boolean);
    const overflow=audit.document.width > screen.width+2;
    const passed=validHeadings&&validAnchors&&!overflow&&errors.length===0
      &&audit.images.every(i=>i.naturalWidth>0);
    if(!passed)failures++;
    const result={lang,screen:screen.id,passed,validHeadings,validAnchors,overflow,
      failedImages:audit.images.filter(i=>!i.naturalWidth).length,
      placeholderImages:audit.images.filter(i=>i.placeholder).length,
      totalImages:audit.images.length,errors};
    records.push(result);
    console.log(JSON.stringify(result));
  }catch(err){
    failures++;
    records.push({lang,screen:screen.id,passed:false,error:String(err.message).slice(0,400)});
    console.error('Failed '+lang+' '+screen.id+': '+err.message);
  }finally{await ctx.close();}
}
await browser.close();
await fs.writeFile(path.join(out,'summary.json'),JSON.stringify({failures,records},null,2));
if(failures)process.exitCode=1;

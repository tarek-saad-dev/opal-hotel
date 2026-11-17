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
  {id:'small-mobile-320',width:320,height:740,isMobile:true},
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
    await page.waitForTimeout(900);
    // Exercise lazily loaded image elements before measuring fallback status.
    await page.evaluate(async()=>{
      const doc=document.documentElement;
      for(let y=0;y<doc.scrollHeight;y+=650){
        scrollTo(0,y);
        await new Promise(resolve=>setTimeout(resolve,55));
      }
      scrollTo(0,0);
    });
    await page.waitForTimeout(650);
    // Collect DOM state before any screenshot failure.
    const audit=await page.evaluate(()=>{
      const doc=document.documentElement;
      const images=Array.from(document.images).map(i=>({
        src:i.currentSrc,srcSet:!!i.getAttribute('srcset'),complete:i.complete,naturalWidth:i.naturalWidth,
        placeholder:i.dataset.placeholder==='true',
        visible:i.getClientRects().length>0 && getComputedStyle(i).visibility!=='hidden'
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
    const header=page.locator('.premium-header');
    if(await header.count())await header.screenshot({path:path.join(dir,'header.png'),timeout:12000});
    const hero=page.locator('.premium-hero');
    if(await hero.count())await hero.screenshot({path:path.join(dir,'hero.png'),timeout:12000});
    // Sticky header is still visible in the full-page screenshot above. Hide it
    // only for section crops, so headings aren't covered by screenshot scrolling.
    if(await header.count()) await header.evaluate(element => element.style.visibility='hidden');
    // Section-level images make the design review actionable, not just pass/fail.
    for (const key of ['overview','facilities','location','rooms','gallery','reviews','contact']) {
      const section=page.locator('#'+key);
      if(await section.count()) {
        await section.screenshot({
          path:path.join(dir,key+'.png'),timeout:30000,animations:'disabled'
        });
      }
    }
    const footer=page.locator('.opal-end-footer');
    if(await footer.count()) await footer.screenshot({path:path.join(dir,'footer.png'),timeout:30000,animations:'disabled'});
    if(await header.count()) await header.evaluate(element => element.style.visibility='');
    // Exercise actual UI interactions after the pristine visual screenshots.
    const interactions={slides:false,guests:false,menu:false,booking:false,
      amenities:false,galleryFilter:false,galleryLightbox:false,rooms:false,
      review:false,contact:false,footer:false,
      responsiveMedia:false,dock:false,lightboxFocus:false,menuFocus:false};
    try{
      const scene=page.locator('.premium-scene-number');
      const before=await scene.innerText();
      await page.locator('.premium-hero-scene-navigation button').last().click();
      interactions.slides=(await scene.innerText())!==before;

      await page.locator('.premium-guest-trigger').click();
      const counter=page.locator('.premium-guest-row').first().locator('output');
      const initial=Number(await counter.innerText());
      await page.locator('.premium-guest-row').first().locator('button').last().click();
      interactions.guests=Number(await counter.innerText())===initial+1;
      await page.keyboard.press('Escape');

      if(screen.width<=1040){
        await page.locator('.premium-hamburger').click();
        interactions.menu=await page.locator('.premium-menu-surface').isVisible();
        const firstLink=page.locator('.premium-menu-surface nav a').first();
        interactions.menuFocus=await firstLink.evaluate(el=>el===document.activeElement);
        await page.keyboard.press('Shift+Tab');
        interactions.menuFocus=interactions.menuFocus
          &&await page.locator('.premium-hamburger').evaluate(el=>el===document.activeElement);
        await page.keyboard.press('Escape');
        interactions.menu=interactions.menu && (await page.locator('.premium-menu-surface').count())===0;
        interactions.menuFocus=interactions.menuFocus
          &&await page.locator('.premium-hamburger').evaluate(el=>el===document.activeElement);
      } else {
        interactions.menu=true;
        interactions.menuFocus=true;
      }

      await page.locator('.premium-booking-submit').click();
      const rooms=await page.locator('#rooms').innerText();
      interactions.booking=/not connected|غير متصل|لم يُربط|لم يتم إرسال/.test(rooms);

      interactions.rooms=(await page.locator('.opal-room-card').count())===3;
      const detail=page.locator('.opal-amenity-details').first();
      await detail.locator('summary').click();
      interactions.amenities=(await detail.getAttribute('open'))!==null
        &&(await detail.locator('li').count())>0;
      await detail.locator('summary').click();

      const galleryTabs=page.locator('.opal-gallery-tabs button');
      await galleryTabs.nth(1).click();
      const spacesCount=await page.locator('.opal-gallery-item').count();
      await galleryTabs.nth(2).click();
      const momentsCount=await page.locator('.opal-gallery-item').count();
      await galleryTabs.nth(0).click();
      const allCount=await page.locator('.opal-gallery-item').count();
      interactions.galleryFilter=spacesCount===4&&momentsCount===2&&allCount===6;
      await page.locator('.opal-gallery-item').first().click();
      await page.locator('.lightbox').waitFor({state:'visible',timeout:3000});
      await page.keyboard.press('Escape');
      await page.locator('.lightbox').waitFor({state:'detached',timeout:3000});
      interactions.galleryLightbox=true;
      interactions.lightboxFocus=await page.locator('.opal-gallery-item').first().evaluate(el=>el===document.activeElement);

      await page.locator('.opal-end-rating input[value="9"]').check();
      await page.locator('input[name="reviewName"]').fill('Preview Guest');
      await page.locator('textarea[name="reviewStory"]').fill('Sample UI-only review. Nothing is sent.');
      await page.locator('.opal-end-review-paper button[type="submit"]').click();
      interactions.review=(await page.locator('.opal-end-review-paper [role="status"]').count())===1
        && (await page.locator('.opal-end-score-row strong').innerText()).includes('09');

      await page.locator('input[name="contactName"]').fill('Preview Guest');
      await page.locator('input[name="contactEmail"]').fill('preview@example.org');
      await page.locator('input[name="contactSubject"]').fill('UI preview');
      await page.locator('textarea[name="contactMessage"]').fill('Design preview only; do not send.');
      await page.locator('.opal-end-contact-submit').click();
      interactions.contact=(await page.locator('.opal-end-contact-paper [role="status"]').count())===1;

      interactions.footer=(await page.locator('.opal-end-footer nav a').count())===7
        &&(await page.locator('.opal-end-backtop').getAttribute('href'))==='#top'
        &&(await page.locator('.opal-end-footer a[hreflang]').count())===1;

      interactions.responsiveMedia=(await page.locator('img[srcset]').count())>=8;

      if(screen.width<=800){
        await page.locator('#rooms').scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        interactions.dock=await page.locator('.opal-stay-dock.is-visible').isVisible();
        if(interactions.dock){
          await page.locator('.opal-stay-dock.is-visible').screenshot({
            path:path.join(dir,'mobile-stay-dock.png'),timeout:12000
          });
        }
      }else{
        interactions.dock=!(await page.locator('.opal-stay-dock').isVisible());
      }
    }catch(e){
      errors.push({type:'interaction',message:String(e.message).slice(0,320)});
    }
    const validHeadings=audit.headings.some(h=>/opal legacy/i.test(h||''));
    const validAnchors=Object.values(audit.anchors).every(Boolean);
    const overflow=audit.document.width > screen.width+2;
    const passed=validHeadings&&validAnchors&&!overflow&&errors.length===0
      &&Object.values(interactions).every(Boolean)
      &&audit.images.filter(i=>i.visible).every(i=>i.naturalWidth>0);
    if(!passed)failures++;
    const result={lang,screen:screen.id,passed,validHeadings,validAnchors,overflow,interactions,
      failedImages:audit.images.filter(i=>i.visible&&!i.naturalWidth).length,
      placeholderImages:audit.images.filter(i=>i.visible&&i.placeholder).length,
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

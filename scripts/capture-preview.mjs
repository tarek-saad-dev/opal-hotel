/**
 * Visual QA of our own Next.js frontend, not the restricted hotel reference.
 * Requires the development/production server to be running on OPAL_PREVIEW_URL
 * (default http://127.0.0.1:3000).
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.OPAL_PREVIEW_URL || 'http://127.0.0.1:3000';
const mediaConfig=JSON.parse(await fs.readFile('src/config/hotel-media.json','utf8'));
const expectedPhotoOrigin=mediaConfig.mode==='official'?'hotel-approved':'design-demo';
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
        origin:i.dataset.mediaOrigin||null,
        alt:i.alt,
        visible:i.getClientRects().length>0 && getComputedStyle(i).visibility!=='hidden'
      }));
      const headings=Array.from(document.querySelectorAll('h1,h2')).map(n=>n.textContent?.trim());
      const ids=['overview','facilities','location','rooms','gallery','reviews','contact'];
      return {
        title:document.title,lang:doc.lang,dir:doc.dir,
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
      responsiveMedia:false,dock:false,lightboxFocus:false,menuFocus:false,
      menuGeometry:false,menuScrollLock:false,menuNavigate:false};
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
        // Regression: the old menu was fixed *inside* the blurred sticky header,
        // which made it header-sized on Safari/Chrome while scrolled.
        await page.locator('#gallery').scrollIntoViewIfNeeded();
        await page.locator('.premium-hamburger').click();
        const surface=page.locator('.premium-menu-surface');
        interactions.menu=await surface.isVisible();
        const layout=await surface.evaluate(el => {
          const rect=el.getBoundingClientRect();
          const head=document.querySelector('.premium-header');
          return {
            left:rect.left,top:rect.top,width:rect.width,height:rect.height,
            viewportWidth:innerWidth,viewportHeight:innerHeight,
            portal:el.parentElement===document.body,
            aboveHeader:Number(getComputedStyle(el).zIndex)>Number(getComputedStyle(head).zIndex),
            direction:el.getAttribute('dir'),
            locked:document.body.style.position==='fixed',
          };
        });
        interactions.menuGeometry=layout.portal&&layout.aboveHeader
          &&layout.top>=-1&&layout.top<=1&&layout.left>=-1&&layout.left<=1
          &&layout.width>=layout.viewportWidth-2
          &&layout.height>=layout.viewportHeight-2
          &&layout.direction===(lang==='ar'?'rtl':'ltr');
        interactions.menuScrollLock=layout.locked;
        await page.screenshot({path:path.join(dir,'mobile-navigation-open.png'),animations:'disabled'});

        interactions.menuFocus=await page.locator('.premium-menu-close')
          .evaluate(el=>el===document.activeElement);
        await page.keyboard.press('Shift+Tab');
        interactions.menuFocus=interactions.menuFocus
          &&await page.locator('.premium-menu-lang').evaluate(el=>el===document.activeElement);
        await page.keyboard.press('Escape');
        await surface.waitFor({state:'detached',timeout:3000});
        interactions.menuFocus=interactions.menuFocus
          &&await page.locator('.premium-hamburger').evaluate(el=>el===document.activeElement);
        interactions.menuScrollLock=interactions.menuScrollLock
          &&await page.evaluate(()=>document.body.style.position!=='fixed');

        // Verify long Arabic/English navigation scrolls and actually navigates.
        await page.locator('.premium-hamburger').click();
        await page.locator('.premium-menu-surface nav a').last().click();
        await page.waitForFunction(
          ()=>window.location.hash==='#contact'&&!document.querySelector('.premium-menu-surface'),
          null,{timeout:3000}
        );
        interactions.menuNavigate=(await page.locator('#contact').count())===1;
        await page.locator('.premium-hamburger').click();
        await page.locator('.premium-menu-booking').click();
        await page.waitForFunction(
          ()=>window.location.hash==='#booking'&&!document.querySelector('.premium-menu-surface'),
          null,{timeout:3000}
        );
        interactions.menuNavigate=interactions.menuNavigate
          &&(await page.locator('#booking').count())===1;
        interactions.menu=interactions.menu
          &&(await page.locator('.premium-menu-surface').count())===0;
      } else {
        interactions.menu=true;
        interactions.menuFocus=true;
        interactions.menuGeometry=true;
        interactions.menuScrollLock=true;
        interactions.menuNavigate=true;
      }

      await page.locator('.premium-booking-submit').click();
      await page.waitForURL(`**/${lang}/booking?*`,{timeout:8000});
      // Route loading.tsx now deliberately shows a loading state until the
      // booking UI is ready. A URL change is NOT proof hydration completed.
      await page.locator('.opal-book-step.is-current').waitFor({
        state:'visible',timeout:8000
      });
      const homepageHandoff=new URL(page.url());
      interactions.booking=homepageHandoff.pathname===`/${lang}/booking`
        &&homepageHandoff.searchParams.has('checkin')
        &&homepageHandoff.searchParams.has('checkout')
        &&homepageHandoff.searchParams.has('adults')
        &&(await page.locator('.opal-book-step.is-current').count())===1;
      // Continue the existing homepage checks on a fresh page after handoff.
      await load(page,url);

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
      // V2 categorizes the gallery by actual hotel scene, not the old
      // hardcoded "spaces" (4) / "moments" (2) demo-image buckets.
      interactions.galleryFilter=(await galleryTabs.count())>=3
        &&spacesCount>0&&momentsCount>0
        &&spacesCount<allCount&&momentsCount<allCount&&allCount>=6;
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
    // Validate both new bilingual Rooms V2 routes with a browser, not just
    // source assertions. These paths are concept previews, never inventory.
    const roomsQA={collection:false,detail:false,thumbnails:false,lightbox:false,
      language:false,navigation:false,previewOnly:false,noOverflow:false,
      imagesReady:false};
    try{
      await load(page,`${origin}/${lang}/rooms`);
      await page.waitForTimeout(450);
      roomsQA.collection=(await page.locator('.room-exp-catalogue-card').count())===3
        &&(await page.locator('.room-exp-concept-badge').count())>=1;
      // Eagerly load the gallery/catalgoue images for screenshot fidelity.
      // When the user navigates quickly, remote images may still be loading
      // even though the route itself has rendered.
      await page.evaluate(()=>document.querySelectorAll('.room-exp-page img').forEach(img=>{
        img.loading='eager';
      }));
      await page.waitForFunction(()=>[...document.querySelectorAll('.room-exp-page img')]
        .every(img=>img.complete&&img.naturalWidth>0),null,{timeout:15000});
      const catalogueMetrics=await page.evaluate(()=>({
        width:document.documentElement.scrollWidth,
        viewport:innerWidth,
      }));
      roomsQA.noOverflow=catalogueMetrics.width<=screen.width+2;
      await page.screenshot({path:path.join(dir,'rooms-collection.png'),
        fullPage:true,animations:'disabled',timeout:60000});

      await page.locator('.room-exp-card-visual').first().click();
      await page.waitForURL(`**/${lang}/rooms/light-and-stillness`,{timeout:8000});
      roomsQA.detail=(await page.locator('.room-exp-detail-heading h1').count())===1
        &&(await page.locator('.room-exp-related-card').count())===2;
      await page.evaluate(()=>document.querySelectorAll('.room-exp-page img').forEach(img=>{
        img.loading='eager';
      }));
      await page.waitForFunction(()=>[...document.querySelectorAll('.room-exp-page img')]
        .every(img=>img.complete&&img.naturalWidth>0),null,{timeout:15000});
      roomsQA.imagesReady=await page.locator('.room-exp-gallery-open img')
        .evaluate(img=>img.complete&&img.naturalWidth>0);
      await page.screenshot({path:path.join(dir,'room-detail.png'),
        fullPage:true,animations:'disabled',timeout:60000});
      await page.locator('.room-exp-gallery-controls button').nth(1).click();
      roomsQA.thumbnails=await page.locator('.room-exp-gallery-controls button').nth(1)
        .getAttribute('aria-pressed')==='true';
      const beforeZoom=await page.locator('.room-exp-gallery-counter').innerText();
      roomsQA.thumbnails=roomsQA.thumbnails&&beforeZoom.includes('02');
      await page.locator('.room-exp-gallery-open').click();
      await page.locator('.room-exp-lightbox').waitFor({state:'visible',timeout:3000});
      await page.keyboard.press('ArrowRight');
      const zoomCounter=await page.locator('.room-exp-lightbox-image p').innerText();
      await page.keyboard.press('Escape');
      await page.locator('.room-exp-lightbox').waitFor({state:'detached',timeout:3000});
      const zoomFocus=await page.locator('.room-exp-gallery-open')
        .evaluate(el=>el===document.activeElement);
      roomsQA.lightbox=zoomCounter.includes('3 / 3')&&zoomFocus;

      const notice=await page.locator('.room-exp-truth-note').innerText();
      roomsQA.previewOnly=lang==='ar'
        ? notice.includes('نموذج UI')&&notice.includes('لا توجد أسعار')
        : notice.includes('Design preview only')&&notice.includes('rates');
      const detailMetrics=await page.evaluate(()=>({
        width:document.documentElement.scrollWidth,viewport:innerWidth
      }));
      roomsQA.noOverflow=roomsQA.noOverflow&&detailMetrics.width<=screen.width+2;

      const targetLang=lang==='en'?'ar':'en';
      roomsQA.language=(await page.locator('.room-exp-language').getAttribute('href'))
        ===`/${targetLang}/rooms/light-and-stillness`;
      await page.locator('.room-exp-related-card').first().click();
      await page.waitForURL(`**/${lang}/rooms/quiet-comforts`,{timeout:8000});
      roomsQA.navigation=(await page.locator('.room-exp-detail-heading h1').count())===1;
      await page.locator('.room-exp-breadcrumb a').nth(1).click();
      await page.waitForURL(`**/${lang}/rooms`,{timeout:8000});
      roomsQA.navigation=roomsQA.navigation
        &&(await page.locator('.room-exp-catalogue-card').count())===3;
    }catch(err){
      errors.push({type:'rooms-v2',message:String(err.message).slice(0,320)});
    }
    // Full client-side Booking UI V2 progression. This verifies no payment,
    // booking confirmation or inventory claim is presented at any step.
    const bookingQA={start:false,guests:false,dates:false,rooms:false,selection:false,
      review:false,edit:false,locale:false,noReservation:false,noOverflow:false};
    try{
      await load(page,`${origin}/${lang}/booking`);
      await page.waitForFunction(()=>
        !!document.querySelector('input[name="checkin"]')?.value
        &&!!document.querySelector('input[name="checkout"]')?.value,
        null,{timeout:5000});
      bookingQA.start=(await page.locator('.opal-book-step').count())===3
        &&(await page.locator('.opal-book-step.is-current').count())===1
        &&(await page.locator('.opal-book-preview-label').count())===1;
      const initialAdults=Number(await page.locator('.opal-book-counter').first().locator('output').innerText());
      await page.locator('.opal-book-counter').first().locator('button').last().click();
      bookingQA.guests=Number(await page.locator('.opal-book-counter').first().locator('output').innerText())
        ===initialAdults+1;
      bookingQA.dates=(await page.locator('input[name="checkin"]').inputValue()).length===10
        &&(await page.locator('input[name="checkout"]').inputValue()).length===10;
      const initialBookingMetrics=await page.evaluate(()=>
        ({width:document.documentElement.scrollWidth,viewport:innerWidth}));
      bookingQA.noOverflow=initialBookingMetrics.width<=screen.width+2;
      await page.screenshot({path:path.join(dir,'booking-step-1.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      await page.locator('.opal-book-dates button[type="submit"]').click();
      bookingQA.rooms=(await page.locator('.opal-book-room-select').count())===3
        &&(await page.locator('.opal-book-step.is-current').count())===1;
      await page.locator('.opal-book-room-select').nth(1).click();
      bookingQA.selection=(await page.locator('.opal-book-room-select').nth(1)
        .getAttribute('aria-pressed'))==='true';
      // Required media is loaded before the screenshot is captured.
      await page.evaluate(()=>document.querySelectorAll('.opal-book-page img').forEach(img=>{
        img.loading='eager';
      }));
      await page.waitForFunction(()=>[...document.querySelectorAll('.opal-book-page img')]
        .every(img=>img.complete&&img.naturalWidth>0),null,{timeout:16000});
      await page.screenshot({path:path.join(dir,'booking-step-2.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      await page.locator('.opal-book-choose .opal-book-primary').click();
      bookingQA.review=(await page.locator('.opal-book-review').count())===1
        &&(await page.locator('.opal-book-step.is-current').count())===1;
      const reviewNote=await page.locator('.opal-book-final-note').innerText();
      bookingQA.noReservation=lang==='ar'
        ? reviewNote.includes('لم يتم إنشاء أو تأكيد أي حجز')
        : reviewNote.includes('No reservation has been created or confirmed');
      await page.screenshot({path:path.join(dir,'booking-step-3.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      const otherLocale=lang==='en'?'ar':'en';
      bookingQA.locale=(await page.locator('.opal-book-lang').getAttribute('href'))
        .startsWith(`/${otherLocale}/booking?`);
      const finalMetrics=await page.evaluate(()=>
        ({width:document.documentElement.scrollWidth,viewport:innerWidth}));
      bookingQA.noOverflow=bookingQA.noOverflow&&finalMetrics.width<=screen.width+2;
      await page.locator('.opal-book-review-lines button').first().click();
      bookingQA.edit=(await page.locator('input[name="checkin"]').count())===1
        &&(await page.locator('.opal-book-step.is-current').count())===1;
    }catch(err){
      errors.push({type:'booking-v2',message:String(err.message).slice(0,320)});
    }
    const routeQA={language:false,missing:false,recovery:false,noOverflow:false};
    try {
      // Verify the top-level HTML language/direction, not just a nested RTL
      // container. This matters for screen readers and browser translation.
      await load(page,`${origin}/${lang}/rooms`);
      await page.waitForFunction((loc)=>document.documentElement.lang===loc
        &&document.documentElement.dir===(loc==='ar'?'rtl':'ltr'),
        lang,{timeout:5000});
      routeQA.language=await page.evaluate(loc=>
        document.documentElement.lang===loc
        &&document.documentElement.dir===(loc==='ar'?'rtl':'ltr'),lang);

      // An unknown concept must return an actual 404 and expose localized,
      // keyboard-accessible recovery actions rather than a broken room page.
      const response=await page.goto(`${origin}/${lang}/rooms/not-an-opal-room`,
        {waitUntil:'domcontentloaded',timeout:12000});
      await page.locator('.opal-recovery').waitFor({state:'visible',timeout:5000});
      routeQA.missing=response?.status()===404
        &&(await page.locator('.opal-recovery h1').count())===1;
      routeQA.recovery=(await page.locator('.opal-recovery-actions a').count())===2
        &&(await page.locator('.opal-recovery-actions a').first().getAttribute('href'))===`/${lang}`;
      routeQA.noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2);
      await page.screenshot({path:path.join(dir,'not-found-recovery.png'),
        fullPage:true,animations:'disabled',timeout:30000});
    } catch(err) {
      errors.push({type:'route-recovery',message:String(err.message).slice(0,320)});
    }
    const validHeadings=audit.headings.some(h=>/opal legacy/i.test(h||''));
    const validAnchors=Object.values(audit.anchors).every(Boolean);
    const overflow=audit.document.width > screen.width+2;
    const provenancePhotos=audit.images.filter(i=>i.origin!==null);
    const mediaQA={
      sameOrigin:provenancePhotos.length>=5
        &&provenancePhotos.every(i=>i.origin===expectedPhotoOrigin),
      localizedHero:lang==='ar'
        ? audit.images.some(i=>i.origin===expectedPhotoOrigin
            &&[...i.alt].some(char=>char.charCodeAt(0)>=0x600&&char.charCodeAt(0)<=0x6ff))
        : audit.images.some(i=>i.origin===expectedPhotoOrigin&&i.alt.length>10),
    };
    const passed=validHeadings&&validAnchors&&!overflow&&errors.length===0
      &&Object.values(mediaQA).every(Boolean)
      &&audit.lang===lang&&audit.dir===(lang==='ar'?'rtl':'ltr')
      &&Object.values(interactions).every(Boolean)&&Object.values(roomsQA).every(Boolean)
      &&Object.values(bookingQA).every(Boolean)&&Object.values(routeQA).every(Boolean)
      &&audit.images.filter(i=>i.visible).every(i=>i.naturalWidth>0);
    if(!passed)failures++;
    const result={lang,screen:screen.id,passed,validHeadings,validAnchors,overflow,interactions,
      failedImages:audit.images.filter(i=>i.visible&&!i.naturalWidth).length,
      placeholderImages:audit.images.filter(i=>i.visible&&i.placeholder).length,
      totalImages:audit.images.length,roomsQA,bookingQA,routeQA,mediaQA,errors};
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

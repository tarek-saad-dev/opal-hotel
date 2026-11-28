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
// A fresh CMS has no hotel photos yet: every slot is a decorative brand panel.
const expectedPhotoOrigin=mediaConfig.mode==='official'?'hotel-approved':'placeholder';
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
  // Stand-in for the future backend (docs/BACKEND_API.md): record payloads and
  // answer 201, so the forms' success paths are exercised end to end.
  const apiCalls=[];
  await ctx.route('**/api/v1/**', async route=>{
    const request=route.request();
    apiCalls.push({path:new URL(request.url()).pathname,body:request.postDataJSON()});
    await route.fulfill({status:201,contentType:'application/json',
      body:JSON.stringify({reference:'OPL-TEST-001'})});
  });
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
      // #gallery is intentionally absent until hotel photos are published.
      const ids=['overview','facilities','location','rooms','reviews','contact'];
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
      amenities:false,galleryHidden:false,rooms:false,policies:false,
      review:false,contact:false,footer:false,
      decorativePanels:false,noPreviewCopy:false,dock:false,menuFocus:false,
      menuGeometry:false,menuScrollLock:false,menuNavigate:false,datePicker:false};
    try{
      // Slide controls only exist once there are several real hero photos.
      const sceneNav=page.locator('.premium-hero-scene-navigation');
      if(await sceneNav.count()){
        const scene=page.locator('.premium-scene-number');
        const before=await scene.innerText();
        await sceneNav.locator('button').last().click();
        interactions.slides=(await scene.innerText())!==before;
      } else interactions.slides=true;

      await page.locator('.premium-guest-trigger').click();
      const counter=page.locator('.premium-guest-row').first().locator('output');
      const initial=Number(await counter.innerText());
      await page.locator('.premium-guest-row').first().locator('button').last().click();
      interactions.guests=Number(await counter.innerText())===initial+1;
      await page.keyboard.press('Escape');

      if(screen.width<=1040){
        // Regression: the old menu was fixed *inside* the blurred sticky header,
        // which made it header-sized on Safari/Chrome while scrolled.
        await page.locator('#rooms').scrollIntoViewIfNeeded();
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

      // Range picker: one calendar for both dates, nights shown, closes on departure.
      await page.locator('#premium-arrival').click();
      const pickerPanel=page.locator('.opal-dp-panel');
      await pickerPanel.waitFor({state:'visible',timeout:5000});
      const pickable=pickerPanel.locator('[data-day]:not([disabled])');
      // On compact calendars the current month may have fewer than eight future days.
      // Advance to the next month instead of assuming the test runs early in a month.
      for(let i=0;i<2&&(await pickable.count())<8;i++){
        await pickerPanel.locator('.opal-dp-nav.is-next').click();
      }
      if((await pickable.count())<8)throw new Error('Calendar has fewer than eight selectable dates after advancing');
      const pickIn=await pickable.nth(3).getAttribute('data-day');
      const pickOut=await pickable.nth(7).getAttribute('data-day');
      await pickable.nth(3).click();
      await pickerPanel.locator(`[data-day="${pickOut}"]`).hover();
      const previewNights=/\d/.test(await pickerPanel.locator('.opal-dp-summary strong').innerText());
      await page.screenshot({path:path.join(dir,'date-picker.png'),animations:'disabled',timeout:20000});
      await pickerPanel.locator(`[data-day="${pickOut}"]`).click();
      await pickerPanel.waitFor({state:'detached',timeout:5000});
      await page.locator('.premium-booking-submit').click();
      await page.waitForURL(`**/${lang}/booking?*`,{timeout:8000});
      {
        const handoff=new URL(page.url());
        interactions.datePicker=previewNights&&handoff.searchParams.get('checkin')===pickIn
          &&handoff.searchParams.get('checkout')===pickOut;
      }
      // Route loading.tsx now deliberately shows a loading state until the
      // booking UI is ready. A URL change is NOT proof hydration completed.
      await page.locator('.opal-book-step.is-current').waitFor({
        state:'visible',timeout:8000
      });
      const homepageHandoff=new URL(page.url());
      // Dates and party come from the homepage, so the flow opens on step 2.
      await page.locator('input[name="fullName"]').waitFor({state:'visible',timeout:8000});
      interactions.booking=homepageHandoff.pathname===`/${lang}/booking`
        &&homepageHandoff.searchParams.has('checkin')
        &&homepageHandoff.searchParams.has('checkout')
        &&homepageHandoff.searchParams.has('adults')
        &&(await page.locator('.opal-book-step.is-current').count())===1;
      // Continue the existing homepage checks on a fresh page after handoff.
      await load(page,url);

      interactions.rooms=(await page.locator('.opal-rooms-info').count())===1
        &&(await page.locator('.opal-rooms-features li').count())>=10
        &&(await page.locator('.opal-room-type').count())===6
        &&(await page.locator('.opal-room-type-cta').first().getAttribute('href'))===`/${lang}/booking?room=single-garden-view`
        &&(await page.locator('.opal-location-map iframe').count())===1;
      interactions.policies=(await page.locator('.opal-policies li').count())>=4;
      const detail=page.locator('.opal-amenity-details').first();
      await detail.locator('summary').click();
      interactions.amenities=(await detail.getAttribute('open'))!==null
        &&(await detail.locator('li').count())>0;
      await detail.locator('summary').click();

      // No hotel photos on a fresh CMS: the gallery and its nav link stay hidden.
      interactions.galleryHidden=(await page.locator('#gallery').count())===0
        &&(await page.locator('a[href="#gallery"]').count())===0
        &&(await page.locator('.opal-hero-gallery').count())===0;

      await page.locator('.opal-end-rating input[value="9"]').check();
      await page.locator('input[name="reviewName"]').fill('Preview Guest');
      await page.locator('input[name="reviewEmail"]').fill('guest@example.org');
      await page.locator('textarea[name="reviewPros"]').fill('Quiet garden');
      await page.locator('textarea[name="reviewStory"]').fill('Sample UI-only review. Nothing is sent.');
      await page.locator('.opal-end-review-paper button[type="submit"]').click();
      await page.locator('.opal-end-review-paper .opal-end-status.is-success').waitFor({timeout:5000});
      const reviewCall=apiCalls.find(call=>call.path==='/api/v1/reviews');
      interactions.review=Boolean(reviewCall)&&reviewCall.body.rating===9
        &&reviewCall.body.pros==='Quiet garden'&&reviewCall.body.email==='guest@example.org'
        &&reviewCall.body.locale===lang;

      await page.locator('input[name="contactName"]').fill('Preview Guest');
      await page.locator('input[name="contactEmail"]').fill('preview@example.org');
      await page.locator('select[name="contactSubject"]').selectOption('group_booking');
      await page.locator('textarea[name="contactMessage"]').fill('Design preview only; do not send.');
      await page.locator('.opal-end-contact-submit').click();
      await page.locator('.opal-end-contact-paper .opal-end-status.is-success').waitFor({timeout:5000});
      const contactCall=apiCalls.find(call=>call.path==='/api/v1/contact-messages');
      interactions.contact=Boolean(contactCall)&&contactCall.body.email==='preview@example.org'
        &&contactCall.body.subject==='group_booking';

      interactions.footer=(await page.locator('.opal-end-footer nav a').count())===6
        &&(await page.locator('.opal-end-backtop').getAttribute('href'))==='#top'
        &&(await page.locator('.opal-end-footer a[hreflang]').count())===1;

      interactions.decorativePanels=await page.evaluate(()=>
        [...document.querySelectorAll('img[data-media-origin="placeholder"]')].every(img=>img.alt===''));
      interactions.noPreviewCopy=await page.evaluate(()=>
        !/design preview|illustrative|not (yet )?(enabled|connected|delivered)|preview only|نسخة (العرض|تجريبية)|توضيحية|غير مفعل/i
          .test(document.body.innerText));

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
    // Retired room concept URLs must land on the homepage Rooms section.
    const roomsQA={redirect:false,slugRedirect:false};
    try{
      await load(page,`${origin}/${lang}/rooms`);
      roomsQA.redirect=new URL(page.url()).pathname===`/${lang}`
        &&(await page.locator('#rooms').count())===1;
      await load(page,`${origin}/${lang}/rooms/light-and-stillness`);
      roomsQA.slugRedirect=new URL(page.url()).pathname===`/${lang}`;
    }catch(err){
      errors.push({type:'rooms-redirect',message:String(err.message).slice(0,320)});
    }
    // Booking request flow: stay → details (validated) → review → API → sent.
    const bookingQA={start:false,guests:false,dates:false,validation:false,details:false,
      review:false,edit:false,locale:false,sent:false,noOverflow:false};
    try{
      await load(page,`${origin}/${lang}/booking`);
      await page.waitForFunction(()=>
        !!document.querySelector('input[name="checkin"]')?.value
        &&!!document.querySelector('input[name="checkout"]')?.value,
        null,{timeout:5000});
      bookingQA.start=(await page.locator('.opal-book-step').count())===3
        &&(await page.locator('.opal-book-step.is-current').count())===1;
      const initialAdults=Number(await page.locator('.opal-book-counter').first().locator('output').innerText());
      await page.locator('.opal-book-counter').first().locator('button').last().click();
      bookingQA.guests=Number(await page.locator('.opal-book-counter').first().locator('output').innerText())
        ===initialAdults+1;
      bookingQA.dates=(await page.locator('input[name="checkin"]').inputValue()).length===10
        &&(await page.locator('input[name="checkout"]').inputValue()).length===10;
      const initialBookingMetrics=await page.evaluate(()=>
        ({width:document.documentElement.scrollWidth,viewport:innerWidth}));
      bookingQA.noOverflow=initialBookingMetrics.width<=screen.width+2;
      await page.locator('select[name="roomType"]').selectOption('family-suite');
      await page.screenshot({path:path.join(dir,'booking-step-1.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      await page.locator('.opal-book-dates button[type="submit"]').click();
      await page.locator('input[name="fullName"]').waitFor({state:'visible',timeout:5000});
      // Empty details must be rejected before the review step.
      await page.locator('.opal-book-details button[type="submit"]').click();
      bookingQA.validation=(await page.locator('.opal-book-error').count())===1
        &&(await page.locator('.opal-book-review').count())===0;
      await page.locator('input[name="fullName"]').fill('Preview Guest');
      await page.locator('input[name="email"]').fill('guest@example.org');
      await page.locator('input[name="phone"]').fill('+20 100 000 0000');
      await page.locator('input[name="country"]').fill('Egypt');
      bookingQA.details=(await page.locator('.opal-book-error').count())===0;
      await page.screenshot({path:path.join(dir,'booking-step-2.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      await page.locator('.opal-book-details button[type="submit"]').click();
      await page.locator('.opal-book-review').waitFor({state:'visible',timeout:5000});
      bookingQA.review=(await page.locator('.opal-book-review-lines>div').count())>=6
        &&(await page.locator('.opal-book-step.is-current').count())===1;
      await page.screenshot({path:path.join(dir,'booking-step-3.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      const otherLocale=lang==='en'?'ar':'en';
      bookingQA.locale=(await page.locator('.opal-book-lang').getAttribute('href'))
        .startsWith(`/${otherLocale}/booking?`);
      await page.locator('.opal-book-review-lines button').first().click();
      bookingQA.edit=(await page.locator('input[name="checkin"]').count())===1;
      // Back through to review and send.
      await page.locator('.opal-book-dates button[type="submit"]').click();
      await page.locator('.opal-book-details button[type="submit"]').click();
      await page.locator('.opal-book-review .opal-book-primary').click();
      await page.locator('.opal-book-sent').waitFor({state:'visible',timeout:5000});
      const bookingCall=apiCalls.find(call=>call.path==='/api/v1/booking-requests');
      bookingQA.sent=Boolean(bookingCall)&&bookingCall.body.guest.email==='guest@example.org'
        &&bookingCall.body.adults===initialAdults+1
        &&bookingCall.body.roomType==='family-suite'&&bookingCall.body.rooms===1
        &&(await page.locator('.opal-book-reference').innerText()).includes('OPL-TEST-001');
      await page.screenshot({path:path.join(dir,'booking-sent.png'),fullPage:true,
        animations:'disabled',timeout:60000});
      const finalMetrics=await page.evaluate(()=>
        ({width:document.documentElement.scrollWidth,viewport:innerWidth}));
      bookingQA.noOverflow=bookingQA.noOverflow&&finalMetrics.width<=screen.width+2;
    }catch(err){
      errors.push({type:'booking-request',message:String(err.message).slice(0,320)});
    }
    const routeQA={language:false,missing:false,recovery:false,noOverflow:false};
    try {
      // Verify the top-level HTML language/direction, not just a nested RTL
      // container. This matters for screen readers and browser translation.
      await load(page,`${origin}/${lang}/booking`);
      await page.waitForFunction((loc)=>document.documentElement.lang===loc
        &&document.documentElement.dir===(loc==='ar'?'rtl':'ltr'),
        lang,{timeout:5000});
      routeQA.language=await page.evaluate(loc=>
        document.documentElement.lang===loc
        &&document.documentElement.dir===(loc==='ar'?'rtl':'ltr'),lang);

      // An unknown concept must return an actual 404 and expose localized,
      // keyboard-accessible recovery actions rather than a broken room page.
      const response=await page.goto(`${origin}/${lang}/not-an-opal-page`,
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
    const validHeadings=audit.headings.some(h=>/opal poolside/i.test(h||''));
    const validAnchors=Object.values(audit.anchors).every(Boolean);
    const overflow=audit.document.width > screen.width+2;
    const provenancePhotos=audit.images.filter(i=>i.origin!==null);
    const mediaQA={
      sameOrigin:provenancePhotos.length>=3
        &&provenancePhotos.every(i=>i.origin===expectedPhotoOrigin),
      // Real photos need a localized description; brand panels are decorative.
      localizedHero:expectedPhotoOrigin==='placeholder'
        ? provenancePhotos.every(i=>i.alt==='')
        : lang==='ar'
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

/** End-to-end owner CMS integration against a dedicated local Next server only.
 * Requires OPAL_CMS_ADMIN_PASSWORD and isolated OPAL_CMS_DATA_DIR.
 * Never point this suite at production: it saves and publishes test content.
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const origin=process.env.OPAL_PREVIEW_URL||"http://127.0.0.1:3000";
const password=process.env.OPAL_CMS_ADMIN_PASSWORD;
if(!password||!origin.includes("127.0.0.1")){
  throw new Error("CMS integration must run against local 127.0.0.1 with test credentials");
}
const dir=path.resolve("artifacts/frontend-preview/cms-integration");
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:"ar-EG"});
const page=await context.newPage();
const errors=[];
page.on("pageerror",e=>errors.push(e.message));
const check=(condition,message)=>{if(!condition)throw new Error(message);};
try{
  let response=await page.goto(origin+"/admin",{waitUntil:"domcontentloaded"});
  check(response?.status()===200,"Admin UI route must exist");
  await page.getByRole("heading",{name:"إدارة محتوى الفندق"}).waitFor();
  const unauth=await context.request.get(origin+"/api/admin/cms");
  check(unauth.status()===401,"CMS private endpoint must reject visitors");
  const forbidden=await context.request.get(origin+"/ar/preview");
  const unauthorizedHtml=await forbidden.text();
  // Next.js may stream a not-found boundary as an HTTP 200 "soft 404".
  // The security invariant is that no private preview UI/data renders.
  check(forbidden.status()===404||
    (!unauthorizedHtml.includes('class="premium-hero"')
      &&(unauthorizedHtml.includes("opal-recovery")||unauthorizedHtml.includes("404"))),
    "Unauthorized visitors must not receive the private draft preview");

  const rawPublic=await page.goto(origin+"/en",{waitUntil:"domcontentloaded"});
  check(rawPublic?.status()===200,"Public homepage not found");
  const before=await page.locator("#hotel-name").innerText();
  await page.goto(origin+"/admin",{waitUntil:"domcontentloaded"});
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button",{name:/دخول لوحة الإدارة/}).click();
  await page.getByRole("heading",{name:"المحتوى والنصوص"}).waitFor();
  await page.screenshot({path:path.join(dir,"owner-dashboard.png"),fullPage:true,animations:"disabled"});

  // Editing a draft must not mutate the public hotel until an explicit publish.
  await page.getByRole("button",{name:"English"}).click();
  const hero=page.locator(".opal-cms-editor-card").nth(1);
  await hero.locator("input").nth(1).fill("An owner-managed Luxor story");
  await page.getByRole("button",{name:"حفظ المسودة"}).click();
  await page.getByText("تم حفظ المسودة بنجاح.",{exact:false}).waitFor();

  const publicBeforePublish=await context.newPage();
  await publicBeforePublish.goto(origin+"/en",{waitUntil:"domcontentloaded"});
  check((await publicBeforePublish.locator("#hotel-name").innerText())===before,
    "Draft leaked to public homepage before publish");
  await publicBeforePublish.close();

  const preview=await context.newPage();
  response=await preview.goto(origin+"/en/preview",{waitUntil:"domcontentloaded"});
  check(response?.status()===200,"Private preview should render for owner");
  await preview.locator("#hotel-name").getByText("An owner-managed Luxor story").waitFor();
  await preview.screenshot({path:path.join(dir,"private-preview.png"),fullPage:true,animations:"disabled"});
  await preview.close();

  page.once("dialog",dialog=>void dialog.accept());
  await page.getByRole("button",{name:/نشر على الموقع/}).click();
  await page.getByText("تم النشر بنجاح.",{exact:false}).waitFor();
  const published=await context.newPage();
  await published.goto(origin+"/en",{waitUntil:"domcontentloaded"});
  await published.locator("#hotel-name").getByText("An owner-managed Luxor story").waitFor();
  check(await published.locator('meta[name="robots"]').getAttribute("content")!==null,
    "Noindex SEO safety must remain after CMS publication");
  await published.close();

  // Owner can hide a section and change order without touching source files.
  await page.getByRole("button",{name:/الأقسام والترتيب/}).click();
  const gallery=page.locator(".opal-cms-editor-card").filter({has:page.locator("h3",{hasText:"Gallery"})});
  const currentGallery=gallery.count();
  check(await currentGallery===1,"Section controls missing");
  await gallery.locator('input[type="checkbox"]').uncheck();
  await page.getByRole("button",{name:"حفظ المسودة"}).click();
  await page.getByText("تم حفظ المسودة بنجاح.",{exact:false}).waitFor();
  page.once("dialog",dialog=>void dialog.accept());
  await page.getByRole("button",{name:/نشر على الموقع/}).click();
  await page.getByText("تم النشر بنجاح.",{exact:false}).waitFor();
  const hidden=await context.newPage();
  await hidden.goto(origin+"/en",{waitUntil:"domcontentloaded"});
  check(await hidden.locator("#gallery").count()===0,"Hidden section still renders");
  check(await hidden.locator('.premium-desktop-nav a[href="#gallery"]').count()===0,"Hidden navigation anchor still renders");
  await hidden.close();

  const historyResponse=await context.request.get(origin+"/api/admin/cms/history");
  const history=await historyResponse.json();
  check(Array.isArray(history.history)&&history.history.length>=1,"Version history not persisted");

  // A failed upload must not change approved public media.
  const invalid=await context.request.post(origin+"/api/admin/cms/upload",{
    headers:{Origin:origin},multipart:{image:{name:"unsafe.svg",mimeType:"image/svg+xml",
      buffer:Buffer.from('<svg><script>alert(1)</script></svg>')}}
  });
  check(invalid.status()===415,"SVG/script upload should be rejected");
  // A freshly uploaded valid image is visible to its owner but not to an
  // anonymous visitor until it belongs to a fully approved published set.
  const tinyPng=Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9lJ9sAAAAASUVORK5CYII=",
    "base64");
  const valid=await context.request.post(origin+"/api/admin/cms/upload",{
    headers:{Origin:origin},multipart:{image:{name:"test.png",mimeType:"image/png",buffer:tinyPng}}
  });
  check(valid.status()===200,"Owner should be able to upload a valid PNG");
  const uploaded=await valid.json();
  check(/^\/api\/cms\/media\/[0-9a-f]{32}\.png$/.test(uploaded.src),
    "CMS image upload must return a managed path");
  const ownerImage=await context.request.get(origin+uploaded.src);
  check(ownerImage.status()===200,"Authenticated owner must be able to preview draft image");
  const anonymous=await browser.newContext();
  try {
    const leaked=await anonymous.request.get(origin+uploaded.src);
    check(leaked.status()===404,"Unpublished draft image must not be publicly accessible");
  } finally { await anonymous.close(); }

  // An owner-approved logo must activate independently from the still-
  // incomplete six-photo library, but only after Save Draft + Publish.
  const ownerCms=await context.request.get(origin+"/api/admin/cms");
  check(ownerCms.status()===200,"Owner CMS snapshot must be readable");
  const ownerDoc=(await ownerCms.json()).draft;
  ownerDoc.media.logo=uploaded.src;
  ownerDoc.media.logoApproved=true;
  const saveLogo=await context.request.put(origin+"/api/admin/cms",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{document:ownerDoc,expectedRevision:ownerDoc.revision}
  });
  check(saveLogo.status()===200,"Approved logo draft should save");
  const savedLogo=(await saveLogo.json()).draft;
  const privateLogoPreview=await context.newPage();
  try {
    await privateLogoPreview.goto(origin+"/en/preview",{waitUntil:"domcontentloaded"});
    await privateLogoPreview.locator(".premium-mark img.premium-mark-official").waitFor();
    check(await privateLogoPreview.locator(".premium-mark img.premium-mark-official").getAttribute("src")===uploaded.src,
      "Private preview should use owner-approved logo before public release");
  } finally { await privateLogoPreview.close(); }

  const anonBeforeLogo=await browser.newContext();
  try {
    const stillPrivate=await anonBeforeLogo.request.get(origin+uploaded.src);
    check(stillPrivate.status()===404,"Saved draft logo must remain private before Publish");
  } finally { await anonBeforeLogo.close(); }

  const publishLogo=await context.request.post(origin+"/api/admin/cms/publish",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{expectedRevision:savedLogo.revision}
  });
  check(publishLogo.status()===200,"Owner logo publish should succeed");
  check((await publishLogo.json()).mediaReady===false,
    "Single approved logo must not prematurely approve demo photo replacements");
  const publicLogoContext=await browser.newContext({viewport:{width:390,height:844}});
  try {
    check((await publicLogoContext.request.get(origin+uploaded.src)).status()===200,
      "Published approved logo image must be readable without an owner session");
    const publicLogo=await publicLogoContext.newPage();
    await publicLogo.goto(origin+"/en",{waitUntil:"domcontentloaded"});
    await publicLogo.locator(".premium-mark img.premium-mark-official").waitFor();
    check(await publicLogo.locator(".premium-mark img.premium-mark-official").getAttribute("src")===uploaded.src,
      "Published CMS logo must replace O emblem on mobile and desktop header");
    check(await publicLogo.locator(".premium-hero-photo").getAttribute("data-media-origin")==="design-demo",
      "Published logo must not activate unapproved hotel photos");
    await publicLogo.locator(".premium-hamburger").click();
    check(await publicLogo.locator(".premium-menu-brand img.premium-mark-official").getAttribute("src")===uploaded.src,
      "Mobile navigation must use the same published CMS logo");
    await publicLogo.locator(".premium-menu-close").click();

    // A published asset must be consistent on both languages, on cold loads
    // and after an actual locale toggle that fetches fresh CMS content.
    for(const locale of ["ar","en"]) {
      await publicLogo.goto(origin+"/"+locale,{waitUntil:"domcontentloaded"});
      await publicLogo.locator(".premium-mark img.premium-mark-official").waitFor();
      check(await publicLogo.locator(".premium-mark img.premium-mark-official").getAttribute("src")===uploaded.src,
        "Owner logo must render on a fresh "+locale+" homepage visit");
    }
    await publicLogo.goto(origin+"/ar",{waitUntil:"domcontentloaded"});
    await publicLogo.locator(".premium-locale").click();
    await publicLogo.waitForURL("**/en");
    check(await publicLogo.locator(".premium-mark img.premium-mark-official").getAttribute("src")===uploaded.src,
      "Switching from Arabic to English must retain the latest published logo");
    await publicLogo.locator(".opal-end-footer a[hreflang]").click();
    await publicLogo.waitForURL("**/ar");
    check(await publicLogo.locator(".premium-mark img.premium-mark-official").getAttribute("src")===uploaded.src,
      "Switching from English to Arabic via footer must retain the latest logo");
    await publicLogo.setViewportSize({width:1440,height:900});
    await publicLogo.goto(origin+"/en",{waitUntil:"domcontentloaded"});
    check(await publicLogo.locator(".premium-mark img.premium-mark-official").getAttribute("src")===uploaded.src,
      "Desktop English header must use the published logo");
    await publicLogo.close();
  } finally { await publicLogoContext.close(); }


  // Video & poster are uploaded to the private owner library first; the public
  // media URLs must remain inaccessible until the explicit Publish action.
  const posterUpload=await context.request.post(origin+"/api/admin/cms/upload",{
    headers:{Origin:origin},multipart:{image:{name:"hero-poster.png",mimeType:"image/png",buffer:tinyPng}}
  });
  check(posterUpload.status()===200,"Owner should be able to upload a poster");
  const posterSrc=(await posterUpload.json()).src;
  // Tiny structurally-valid ISO MP4 headers are sufficient for upload/range
  // tests; no browser decoding claim is made for this synthetic fixture.
  const mp4Fixture=Buffer.alloc(128);
  Buffer.from("ftypisom").copy(mp4Fixture,4);
  const uploadMovie=async role=>{
    const response=await context.request.post(origin+"/api/admin/cms/upload-video",{
      headers:{Origin:origin},multipart:{
        role,
        video:{name:"opal-test.mp4",mimeType:"video/mp4",buffer:mp4Fixture}
      }
    });
    check(response.status()===200,"Owner "+role+" video should upload");
    return (await response.json()).src;
  };
  const heroSrc=await uploadMovie("desktop");
  const filmSrc=await uploadMovie("film");
  const stranger=await browser.newContext();
  try{
    for(const src of [posterSrc,heroSrc,filmSrc]){
      check((await stranger.request.get(origin+src)).status()===404,
        "Draft poster/video must not leak to anonymous visitors");
    }
    check((await stranger.request.post(origin+"/api/admin/cms/upload-video",{
      headers:{Origin:origin},multipart:{
        role:"desktop",video:{name:"unauthorized.mp4",mimeType:"video/mp4",buffer:mp4Fixture}
      }
    })).status()===401,"Video uploading must be owner-only");
  }finally{await stranger.close();}
  const currentCms=await context.request.get(origin+"/api/admin/cms");
  const videoDoc=(await currentCms.json()).draft;
  videoDoc.media.video={
    enabled:true,desktopSrc:heroSrc,mobileSrc:"",posterSrc,
    fullFilmSrc:filmSrc,heroApproved:true,filmApproved:true
  };
  const savedMovieResponse=await context.request.put(origin+"/api/admin/cms",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{document:videoDoc,expectedRevision:videoDoc.revision}
  });
  check(savedMovieResponse.status()===200,"Hero video draft must save");
  const savedMovie=(await savedMovieResponse.json()).draft;
  const privateMovie=await context.newPage();
  try{
    await privateMovie.goto(origin+"/ar/preview",{waitUntil:"domcontentloaded"});
    check(await privateMovie.locator('[data-hero-mode="video"]').count()===1,
      "Owner must preview video background before publication");
    check(await privateMovie.locator(".opal-hero-video-poster").getAttribute("src")===posterSrc,
      "Hero preview must use uploaded poster");
    const beforePublication=await browser.newContext();
    try{
      const beforePage=await beforePublication.newPage();
      await beforePage.goto(origin+"/en",{waitUntil:"domcontentloaded"});
      check(await beforePage.locator('[data-hero-mode="video"]').count()===0,
        "Unsaved/unpublished video must not appear publicly");
    }finally{await beforePublication.close();}
  }finally{await privateMovie.close();}
  const publishMovie=await context.request.post(origin+"/api/admin/cms/publish",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{expectedRevision:savedMovie.revision}
  });
  check(publishMovie.status()===200,"Owner should publish approved video");
  check((await publishMovie.json()).mediaReady===false,
    "Independent hero publishing must not auto-approve six hotel photographs");
  const visitor=await browser.newContext();
  try{
    for(const src of [posterSrc,heroSrc,filmSrc]){
      check((await visitor.request.get(origin+src)).status()===200,
        "Approved video and poster should become publicly readable");
    }
    const partial=await visitor.request.get(origin+filmSrc,{headers:{Range:"bytes=0-15"}});
    check(partial.status()===206,"Full film byte-range request should return 206");
    check((await partial.body()).length===16,"Byte-range response must not read whole film");
    check(partial.headers()["content-range"]==="bytes 0-15/128",
      "Full film response must contain a correct Content-Range");
    check((await visitor.request.get(origin+filmSrc,{headers:{Range:"bytes=200-300"}})).status()===416,
      "Unsatisfiable film ranges should be rejected");
    for(const code of ["ar","en"]){
      const vpage=await visitor.newPage();
      await vpage.goto(origin+"/"+code,{waitUntil:"domcontentloaded"});
      check(await vpage.locator('[data-hero-mode="video"]').count()===1,
        "Published video background should appear in "+code);
      check(await vpage.locator(".opal-hero-video-poster").getAttribute("src")===posterSrc,
        "Poster must match published media in "+code);
      check(await vpage.locator(".premium-hero-scene-navigation").count()===0,
        "Still-photo carousel should be hidden when video is active");
      const film=vpage.locator(".opal-hero-watch");
      check(await film.count()===1,"Full film must have an explicit watch button");
      check(await vpage.locator("#opal-hotel-film-dialog").count()===0,
        "Four-minute film modal must not preload at page load");
      await film.click();
      await vpage.locator("#opal-hotel-film-dialog video[controls]").waitFor();
      await vpage.locator(".opal-film-top button").click();
      await vpage.close();
    }
  }finally{await visitor.close();}

  // Media-first V2: owner chooses independent real media per section and room.
  // Merely uploading or assigning an unapproved image must not expose it publicly.
  const v2PhotoResponse=await context.request.post(origin+"/api/admin/cms/upload",{
    headers:{Origin:origin},multipart:{
      image:{name:"real-hotel-photo.png",mimeType:"image/png",buffer:tinyPng}
    }
  });
  check(v2PhotoResponse.status()===200,"V2 owner library image should upload");
  const v2Photo=(await v2PhotoResponse.json()).src;
  const v2Photo2Response=await context.request.post(origin+"/api/admin/cms/upload",{
    headers:{Origin:origin},multipart:{
      image:{name:"pool-photo.png",mimeType:"image/png",buffer:tinyPng}
    }
  });
  check(v2Photo2Response.status()===200,"V2 secondary library image should upload");
  const v2Photo2=(await v2Photo2Response.json()).src;
  const galleryFilmSrc=await uploadMovie("gallery");
  const freshDocResponse=await context.request.get(origin+"/api/admin/cms");
  const v2Doc=(await freshDocResponse.json()).draft;
  v2Doc.media.video.enabled=false; // test photo Hero independently from V1 movie
  v2Doc.media.visual.assets=[
    {src:v2Photo,kind:"image",title:"Opal overview",category:"exterior",
      altEn:"Real hotel exterior",altAr:"صورة حقيقية لواجهة الفندق",approved:false,poster:""},
    {src:v2Photo2,kind:"image",title:"Opal pool",category:"pool",
      altEn:"Real hotel pool",altAr:"مسبح الفندق الحقيقي",approved:true,poster:""},
    {src:galleryFilmSrc,kind:"video",title:"Hotel pool film",category:"pool",
      altEn:"Hotel pool video",altAr:"فيديو مسبح الفندق",approved:true,poster:v2Photo2}
  ];
  v2Doc.media.visual.placements.hero=[v2Photo,v2Photo2];
  v2Doc.media.visual.placements.overviewMain=v2Photo;
  v2Doc.media.visual.placements.overviewInset=v2Photo2;
  v2Doc.media.visual.placements.facilities=v2Photo2;
  v2Doc.media.visual.placements.location=v2Photo;
  v2Doc.media.visual.placements.gallery=[v2Photo2,galleryFilmSrc];
  v2Doc.media.visual.placements.rooms["light-and-stillness"]={
    cover:v2Photo,gallery:[v2Photo,v2Photo2],video:galleryFilmSrc
  };
  const saveVisual=await context.request.put(origin+"/api/admin/cms",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{document:v2Doc,expectedRevision:v2Doc.revision}
  });
  check(saveVisual.status()===200,"V2 library and section assignments should save");
  const unapprovedDraft=(await saveVisual.json()).draft;
  const previewVisual=await context.newPage();
  await previewVisual.goto(origin+"/ar/preview",{waitUntil:"domcontentloaded"});
  check(await previewVisual.locator(".opal-story-main-photo img").getAttribute("src")!==v2Photo,
    "Unapproved assigned photo must not render even to owner as final published media");
  await previewVisual.close();
  const publishPartial=await context.request.post(origin+"/api/admin/cms/publish",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{expectedRevision:unapprovedDraft.revision}
  });
  check(publishPartial.status()===200,"Partially approved V2 collection should publish safely");
  const partialVisitor=await browser.newContext();
  try {
    check((await partialVisitor.request.get(origin+v2Photo)).status()===404,
      "Assigned but unapproved image must not be public");
    check((await partialVisitor.request.get(origin+v2Photo2)).status()===200,
      "Approved published gallery image should be public");
  }finally{await partialVisitor.close();}
  const afterPartial=await context.request.get(origin+"/api/admin/cms");
  const approvedDoc=(await afterPartial.json()).draft;
  approvedDoc.media.visual.assets.find(a=>a.src===v2Photo).approved=true;
  const saveFinal=await context.request.put(origin+"/api/admin/cms",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{document:approvedDoc,expectedRevision:approvedDoc.revision}
  });
  check(saveFinal.status()===200,"Owner should approve previously private photo");
  const afterSave=(await saveFinal.json()).draft;
  const finalVisual=await context.request.post(origin+"/api/admin/cms/publish",{
    headers:{Origin:origin,"Content-Type":"application/json"},
    data:{expectedRevision:afterSave.revision}
  });
  check(finalVisual.status()===200,"Approved V2 mapping should publish without deploying code");
  const approvedVisitor=await browser.newContext();
  try{
    check((await approvedVisitor.request.get(origin+v2Photo)).status()===200,
      "Approved assigned overview image should become public");
    check((await approvedVisitor.request.get(origin+galleryFilmSrc,{headers:{Range:"bytes=0-15"}})).status()===206,
      "Approved gallery film must stream on demand");
    for(const code of ["en","ar"]){
      const vpage=await approvedVisitor.newPage();
      await vpage.goto(origin+"/"+code,{waitUntil:"domcontentloaded"});
      check(await vpage.locator(".opal-story-main-photo img").getAttribute("src")===v2Photo,
        "Independent real overview main image must render in "+code);
      check(await vpage.locator(".opal-story-small-photo img").getAttribute("src")===v2Photo2,
        "Independent real overview inset image must render in "+code);
      check(await vpage.locator(".premium-hero-photo").getAttribute("src")===v2Photo,
        "Owner selected first still hero should render in "+code);
      check(await vpage.locator(".opal-gallery-film video").count()===1,
        "Gallery should show the approved video in "+code);
      check(await vpage.locator(".opal-gallery-mosaic img").count()===1,
        "Gallery should use only selected images, not six old demos in "+code);
      check(await vpage.locator(".opal-media-section-figure img").count()===2,
        "Location and facilities section images should render in "+code);
      await vpage.close();
      const room=await approvedVisitor.newPage();
      await room.goto(origin+"/"+code+"/rooms/light-and-stillness",{waitUntil:"domcontentloaded"});
      check(await room.locator(".room-exp-gallery-main img").getAttribute("src")===v2Photo,
        "Room gallery should use its own cover image in "+code);
      check(await room.locator(".room-exp-feature-film video").getAttribute("src")===galleryFilmSrc,
        "Room detail should use its assigned hotel film in "+code);
      await room.close();
    }
  }finally{await approvedVisitor.close();}

  await page.screenshot({path:path.join(dir,"owner-sections.png"),fullPage:true,animations:"disabled"});

  await page.getByRole("button",{name:/تسجيل الخروج/}).click();
  // Logout clears the HttpOnly cookie asynchronously; the login screen is
  // rendered only after the server has acknowledged cookie expiry.
  await page.getByRole("heading",{name:"إدارة محتوى الفندق"}).waitFor();
  const logout=await context.request.get(origin+"/api/admin/cms");
  check(logout.status()===401,"Logout must revoke private content access");
  check(errors.length===0,"Browser errors: "+errors.join("; "));
  console.log(JSON.stringify({cmsPassed:true,publicStableBeforePublish:true,
    draftPreview:true,publishedInstantly:true,sectionControl:true,history:true,uploadSecurity:true,logoLocales:true,heroFilm:true,filmRange:true,mediaV2:true,logout:true}));
}catch(error){
  console.error("CMS integration failed:",error);
  process.exitCode=1;
}finally{
  await browser.close();
}

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
    await publicLogo.close();
  } finally { await publicLogoContext.close(); }

  await page.screenshot({path:path.join(dir,"owner-sections.png"),fullPage:true,animations:"disabled"});

  await page.getByRole("button",{name:/تسجيل الخروج/}).click();
  // Logout clears the HttpOnly cookie asynchronously; the login screen is
  // rendered only after the server has acknowledged cookie expiry.
  await page.getByRole("heading",{name:"إدارة محتوى الفندق"}).waitFor();
  const logout=await context.request.get(origin+"/api/admin/cms");
  check(logout.status()===401,"Logout must revoke private content access");
  check(errors.length===0,"Browser errors: "+errors.join("; "));
  console.log(JSON.stringify({cmsPassed:true,publicStableBeforePublish:true,
    draftPreview:true,publishedInstantly:true,sectionControl:true,history:true,uploadSecurity:true,logout:true}));
}catch(error){
  console.error("CMS integration failed:",error);
  process.exitCode=1;
}finally{
  await browser.close();
}

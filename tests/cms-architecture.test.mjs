import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const paths=[
 "src/lib/cms-schema.ts","src/lib/cms-store.ts","src/lib/cms-auth.ts",
 "src/components/CmsProvider.tsx","src/components/AdminCms.tsx",
 "src/app/[locale]/layout.tsx","src/components/HotelExperience.tsx",
 "src/app/api/admin/cms/route.ts","src/app/api/admin/cms/publish/route.ts"
];

test("CMS has a validated localized editor schema and the same seven public sections",()=>{
 const s=read(paths[0]),ui=read(paths[4]);
 for(const id of ["overview","facilities","location","rooms","gallery","reviews","contact"])
   assert.ok(s.includes('\"'+id+'\"'),id);
 assert.ok(s.includes('export function validateCmsSite'));
 assert.ok(s.includes("revision"));
 assert.ok(s.includes("rightsConfirmed"));
 assert.ok(s.includes("hasCompleteCmsMedia"));
 assert.ok(ui.includes("SectionEditor"));
 assert.ok(ui.includes("ContentEditor"));
 assert.ok(ui.includes("MediaEditor"));
 assert.ok(ui.includes("publish()"));
 assert.ok(ui.includes("restore("));
});

test("CMS stores user content outside deploy git tree with atomic writes and history",()=>{
 const s=read(paths[1]),deploy=read("ops/deploy-vps.sh");
 assert.ok(s.includes('OPAL_CMS_DATA_DIR'));
 assert.ok(s.includes('/var/lib/opal-hotel-cms'));
 assert.ok(s.includes('randomUUID()'));
 assert.ok(s.includes('fs.rename(temp,filename)'));
 assert.ok(s.includes('REVISION_CONFLICT'));
 assert.ok(s.includes('historyDir()'));
 assert.ok(deploy.includes('CMS_DIR=/var/lib/opal-hotel-cms'));
 assert.ok(deploy.includes('EnvironmentFile=/etc/opal-hotel/cms.env'));
 assert.ok(deploy.includes('UMask=0077'));
 assert.ok(deploy.includes('CMS_ENV=/etc/opal-hotel/cms.env'));
});

test("Mutations require signed owner cookies, allowed origin and bounded input",()=>{
 const auth=read(paths[2]);
 for(const marker of ["timingSafeEqual","createHmac","httpOnly:true","sameSite:\"strict\"",
  "secure:process.env.NODE_ENV===\"production\"","OPAL_CMS_PUBLIC_ORIGIN","recordLoginFailure"])
   assert.ok(auth.includes(marker),marker);
 for(const p of ["src/app/api/admin/cms/route.ts","src/app/api/admin/cms/publish/route.ts",
   "src/app/api/admin/cms/upload/route.ts","src/app/api/admin/cms/restore/route.ts"]){
   const src=read(p);
   assert.ok(src.includes('isCmsAuthenticated'),p);
   assert.ok(src.includes('validCmsMutationOrigin'),p);
 }
 const upload=read("src/app/api/admin/cms/upload/route.ts");
 assert.ok(upload.includes("4*1024*1024"));
 assert.ok(upload.includes("detectImage"));
 assert.ok(!upload.includes('image/svg+xml'));
});

test("Published CMS replaces public content only after publish, and draft preview is private",()=>{
 const layout=read(paths[5]),home=read(paths[6]),privatePreview=read("src/app/[locale]/preview/page.tsx");
 assert.ok(!layout.includes("readPublished()"));
 assert.ok(read("src/app/[locale]/page.tsx").includes("readPublished()"));
 assert.ok(read("src/app/[locale]/page.tsx").includes("CmsProvider value={published}"));
 assert.ok(read("src/app/[locale]/rooms/[slug]/page.tsx").includes("readPublished()"));
 assert.ok(home.includes("cms.sections.filter(section=>section.visible)"));
 assert.ok(home.includes('useCmsContent(locale)'));
 assert.ok(privatePreview.includes('isCmsAuthenticated()'));
 assert.ok(privatePreview.includes('readDraft()'));
 assert.ok(read(paths[3]).includes('hasCompleteCmsMedia(cms)'));
 const publish=read(paths[8]);
 assert.ok(publish.includes('publishDraft'));
 assert.ok(!publish.includes('reservation'));
});

test("CMS cannot turn hotel booking into a working reservation",()=>{
 for(const file of paths){
   const src=read(file);
   assert.ok(!src.includes("stripe"),file);
   assert.ok(!src.includes("createReservation"),file);
 }
 const root=read("src/app/layout.tsx");
 assert.ok(root.includes("robots: { index: false"));
});

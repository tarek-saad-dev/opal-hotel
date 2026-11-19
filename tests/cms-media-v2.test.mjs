import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Media library is backwards-compatible, bounded and only permits managed media paths",()=>{
  const schema=read("src/lib/cms-schema.ts");
  const media=read("src/lib/cms-media.ts");
  assert.match(schema,/normalizeVisualLibrary\(media\.visual\)/);
  assert.match(media,/if\(raw===undefined\)return defaultVisualLibrary\(\)/);
  assert.match(media,/input\.assets\.length>160/);
  assert.match(media,/visualImagePath/);
  assert.match(media,/visualVideoPath/);
  assert.match(media,/Duplicate asset/);
  assert.match(media,/Unknown room media key/);
  assert.match(media,/approvedAsset\(visual,src\)/);
  assert.match(media,/approvedPublishedPaths/);
});

test("Upload and publication gates apply independently to every approved and assigned asset",()=>{
  const store=read("src/lib/cms-store.ts");
  const uploadVideo=read("src/app/api/admin/cms/upload-video/route.ts");
  assert.match(store,/approvedPublishedPaths\(published\.media\.visual\)/);
  assert.match(store,/approvedPublishedPaths\(doc\.media\.visual\)/);
  assert.match(store,/visual\.filter\(a=>a\.kind==="video"\)/);
  assert.match(store,/visual\.flatMap\(a=>a\.kind==="image"/);
  assert.match(uploadVideo,/role!=="gallery"/);
  assert.match(uploadVideo,/validCmsMutationOrigin/);
  assert.match(uploadVideo,/isCmsAuthenticated/);
});

test("Hero, gallery, overview and rooms use owner assignments with safe legacy fallbacks",()=>{
  const provider=read("src/components/CmsProvider.tsx");
  const masthead=read("src/components/PremiumMasthead.tsx");
  const sections=read("src/components/PremiumSections.tsx");
  const rooms=read("src/components/RoomsExperience.tsx");
  for(const needle of ["overviewMain","overviewInset","heroIndices","galleryIndices","galleryVideos","roomMedia","locationImage","facilitiesImage"])
    assert.ok(provider.includes(needle),needle);
  assert.match(masthead,/media\.heroIndices\.map/);
  assert.match(sections,/media\.overviewMain/);
  assert.match(sections,/media\.overviewInset/);
  assert.match(sections,/media\.galleryVideos/);
  assert.match(rooms,/media\.roomMedia\[concept\.slug\]/);
  assert.match(rooms,/preload="none"/);
});

test("Owner studio allows bulk optimized uploads and safe order/room management",()=>{
  const studio=read("src/components/MediaStudio.tsx");
  const admin=read("src/components/AdminCms.tsx");
  for(const term of ["optimizeMediaPhoto","createImageBitmap","toBlob","multiple","approved",
    "onDragStart","onDrop","removeRefs","roomConcepts","visual.placements"])
    assert.ok(studio.includes(term),term);
  assert.match(admin,/tab==="visual"&&<MediaStudio/);
  assert.match(admin,/async function uploadLibrary/);
  assert.match(admin,/"\/api\/admin\/cms\/upload-video"/);
  assert.match(admin,/"\/api\/admin\/cms\/upload"/);
});


test("Media assignments use thumbnail dialogs instead of unreadable filename dropdowns",()=>{
  const studio=read("src/components/MediaStudio.tsx");
  const picker=read("src/components/MediaPicker.tsx");
  const css=read("src/app/media-studio.css");
  assert.ok(!studio.includes('className="opal-media-select"'),"No native filename selects in assignment editor");
  assert.match(studio,/label="إضافة صور للـHero"/);
  assert.match(studio,/label="إضافة صور وفيديوهات للجاليري"/);
  assert.match(studio,/label="صورة بوستر للفيديو"/);
  assert.match(studio,/selected={mapping.gallery}/);
  assert.match(studio,/value={visual.placements\[slot\]}/);
  assert.match(picker,/createPortal/);
  assert.match(picker,/className="opal-picker-grid"/);
  assert.match(picker,/className="opal-picker-preview"/);
  assert.match(picker,/loading="lazy"/);
  assert.match(picker,/preload="none"/);
  assert.match(picker,/aria-modal="true"/);
  assert.match(picker,/aria-pressed={picked}/);
  assert.match(picker,/Escape/);
  assert.match(picker,/selectedSet.has/);
  assert.match(css,/max-width:600px/);
  assert.match(css,/opal-picker-tile.is-selected/);
  assert.match(css,/opal-picker-backdrop/);
});


test("Assigned media must be rights-approved and bilingual before public image resolution",()=>{
  const gate=read("src/lib/cms-media.ts");
  const provider=read("src/components/CmsProvider.tsx");
  assert.match(gate,/export function visualAssetIssues/);
  assert.match(gate,/!asset\.altAr\.trim\(\)/);
  assert.match(gate,/!asset\.altEn\.trim\(\)/);
  assert.match(gate,/!asset\.approved/);
  assert.match(gate,/export function unreadyVisualPlacements/);
  assert.match(gate,/visualAssetIssues\(visual,src\)\.length>0/);
  assert.match(provider,/const lookup=\(src:string\)=>approvedAsset\(visual,src\)/);
  assert.match(provider,/overviewMain:resolve\(placed\.overviewMain,4\)/);
});

test("Owner sees why selected images remain old, and can jump to approval and publish",()=>{
  const studio=read("src/components/MediaStudio.tsx");
  const picker=read("src/components/MediaPicker.tsx");
  const admin=read("src/components/AdminCms.tsx");
  for(const needle of ["unreadyVisualPlacements","visualAssetIssues",
    "renderReadiness(visual.placements[slot],slot)","prepareAsset",
    "استكمال بيانات الصورة واعتماد النشر","الوصف العربي ناقص","selected"])
    assert.ok((studio+read("src/lib/cms-media.ts")).includes(needle),needle);
  assert.match(studio,/detailsRef\.current\?\.scrollIntoView/);
  assert.match(studio,/published:CmsSite\|null/);
  assert.match(studio,/if\(issues\.length===0\)/);
  assert.match(picker,/غير جاهز للنشر/);
  assert.match(picker,/تأكيد حق النشر/);
  assert.match(admin,/unreadyVisualPlacements\(saved\.media\.visual\)/);
  assert.match(admin,/unreadyVisualPlacements\(data\.published\.media\.visual\)/);
  assert.match(admin,/setMessage\("تم نشر النسخة الجديدة/);
  assert.match(admin,/unpublished\?"● المسودة محفوظة لكن لسه مش منشورة"/);
  assert.match(admin,/published={published}/);
});

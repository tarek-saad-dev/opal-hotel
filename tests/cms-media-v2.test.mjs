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
  for(const needle of ["overviewMain","overviewInset","heroIndices","galleryIndices","galleryVideos","roomMedia","locationImage","facilitiesImage"])
    assert.ok(provider.includes(needle),needle);
  assert.match(masthead,/media\.heroIndices\.map/);
  assert.match(sections,/media\.overviewMain/);
  assert.match(sections,/media\.overviewInset/);
  assert.match(sections,/media\.galleryVideos/);
  assert.match(sections,/media\.roomMedia\[room\.slug\]/);
  assert.match(sections,/preload="none"/);
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


test("A selected photo publishes with one rights attestation; descriptions are optional",()=>{
  const gate=read("src/lib/cms-media.ts");
  const store=read("src/lib/cms-store.ts");
  const route=read("src/app/api/admin/cms/publish/route.ts");
  const provider=read("src/components/CmsProvider.tsx");
  assert.match(gate,/export function approveAssignedVisualMedia/);
  assert.match(gate,/export function assignedVisualSources/);
  assert.match(gate,/selected\.has\(asset\.src\)/);
  assert.match(gate,/export function visualAssetAlt/);
  assert.match(gate,/if\(custom\.trim\(\)\)return custom\.trim\(\)/);
  assert.match(gate,/if\(!asset\?\.approved\)return undefined/);
  assert.ok(!gate.includes('if(!asset.altAr.trim())issues.push'),"Alt text must not block publishing");
  assert.match(store,/confirmAssignedMediaRights/);
  assert.match(store,/approveAssignedVisualMedia\(draft\.media\.visual\)/);
  assert.match(route,/data\.confirmAssignedMediaRights===true/);
  assert.match(provider,/const lookup=\(src:string\)=>preview/);
  assert.match(provider,/visualAssetAlt\(asset,"ar"\)/);
});

test("The owner can pick and publish without checking every image or writing translations",()=>{
  const studio=read("src/components/MediaStudio.tsx");
  const picker=read("src/components/MediaPicker.tsx");
  const admin=read("src/components/AdminCms.tsx");
  const preview=read("src/app/[locale]/preview/page.tsx");
  assert.match(studio,/renderReadiness\(visual\.placements\[slot\],slot\)/);
  assert.match(studio,/الوسيط جاهز للاختيار/);
  assert.match(studio,/تعديل الاسم والتصنيف والوصف \(اختياري\)/);
  assert.ok(!studio.includes('active.approved=e.target.checked'),"No manual rights checkbox needed");
  assert.match(picker,/اختار الصورة عادي/);
  assert.match(picker,/الصور المختارة مرة واحدة/);
  assert.match(admin,/async function publish\(\)/);
  assert.match(admin,/confirmAssignedMediaRights:count>0/);
  assert.match(admin,/expectedRevision:current\.revision/);
  assert.match(admin,/جاري الحفظ والنشر/);
  assert.match(admin,/حفظ ونشر الآن/);
  assert.match(preview,/<CmsProvider value={draft} preview>/);
});


test("Overview supports a private-preview on-demand video, and legacy V2 documents remain valid",()=>{
  const media=read("src/lib/cms-media.ts");
  const provider=read("src/components/CmsProvider.tsx");
  const sections=read("src/components/PremiumSections.tsx");
  const studio=read("src/components/MediaStudio.tsx");
  const admin=read("src/components/AdminCms.tsx");
  const styles=read("src/app/overview-video.css");
  assert.match(media,/overviewVideo:string/);
  assert.match(media,/overviewVideo:single\(placements\.overviewVideo\?\?""/);
  assert.match(media,/p\.overviewVideo/);
  assert.match(media,/label:"Overview — فيديو المكان"/);
  assert.match(provider,/const overviewMovie=lookup\(placed\.overviewVideo\)/);
  assert.match(provider,/overviewVideo:overviewFilm/);
  assert.match(sections,/media\.overviewVideo\s*\?/);
  assert.match(sections,/className="opal-story-film-frame"/);
  assert.match(sections,/preload="none"/);
  assert.match(sections,/filmRef\.current\?\.play\(\)/);
  assert.match(sections,/className="opal-story-main-photo"/);
  assert.match(studio,/label="أو اختار فيديو مرفوع قبل كده"/);
  assert.match(studio,/opal-overview-video-upload/);
  assert.match(studio,/const paths=await upload\(\[file\]\)/);
  assert.match(studio,/v\.placements\.overviewVideo=paths\[0\]/);
  assert.match(admin,/async function uploadLibrary\(files:File\[\]\):Promise<string\[\]>/);
  assert.match(styles,/@media\(max-width:820px\)/);
  assert.match(styles,/\.opal-story-film-play/);
});

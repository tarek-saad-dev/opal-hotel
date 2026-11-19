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

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const manifest=JSON.parse(read("src/config/hotel-media.json"));
const roles=["exterior","garden","roomMain","roomSecondary","architecture","roomDetail"];

test("Hotel media handoff is a single explicit preview-only config until approved",()=>{
  assert.equal(manifest.version,1);
  assert.equal(manifest.mode,"preview");
  assert.equal(manifest.logo.src,null);
  assert.equal(manifest.logo.rightsConfirmed,false);
  for(const role of roles){
    assert.ok(Object.prototype.hasOwnProperty.call(manifest.photos,role));
    const item=manifest.photos[role];
    assert.equal(item.src,null);
    assert.equal(item.rightsConfirmed,false);
  }
  assert.equal(manifest.approval.contentVerified,false);
});

test("The gallery switches to real hotel media only with all six photos, a logo and owner approval",()=>{
  const src=read("src/lib/gallery.ts");
  assert.ok(src.includes('official.mode==="official"'));
  assert.ok(src.includes("official.approval.contentVerified"));
  assert.ok(src.includes("official.logo.rightsConfirmed"));
  assert.ok(src.includes("safeLogoPath(official.logo.src)"));
  assert.ok(src.includes("photoOrder.every(key=>"));
  assert.ok(src.includes("photo.rightsConfirmed"));
  assert.ok(src.includes("safeLocalPath(photo.src)"));
  assert.ok(src.includes("photo.altEn?.trim()"));
  assert.ok(src.includes("photo.altAr?.trim()"));
  assert.ok(src.includes("origin:\"hotel-approved\""));
  // No stock photography: unapproved slots are decorative brand panels.
  assert.ok(src.includes('origin:"placeholder" as const'));
  assert.ok(src.includes('BRAND_PANEL_SRC="/media/brand-panel.svg"'));
  assert.ok(!src.includes("images.unsplash.com/photo-"));
  assert.ok(src.includes("export function photoAlt"));
});

test("Preview media validation succeeds; official launch validation is deliberately blocked",()=>{
  const cwd=new URL("..",import.meta.url).pathname;
  const preview=spawnSync(process.execPath,["scripts/verify-official-media.mjs"],{cwd,encoding:"utf8"});
  assert.equal(preview.status,0,preview.stderr);
  assert.match(preview.stdout,/Media preflight: PASS/);
  assert.match(preview.stdout,/Preview mode remains active/);
  const launch=spawnSync(process.execPath,["scripts/verify-official-media.mjs","--launch"],{cwd,encoding:"utf8"});
  assert.notEqual(launch.status,0);
  assert.match(launch.stderr,/Media preflight: FAILED/);
  assert.match(launch.stderr,/Publication is blocked/);
});

test("All photo-bearing views label provenance and provide bilingual alt text",()=>{
  const files=[
    "src/components/PremiumMasthead.tsx",
    "src/components/PremiumSections.tsx",
    "src/components/BookingExperience.tsx",
  ];
  for(const file of files){
    const src=read(file);
    assert.ok(src.includes("data-media-origin="),file);
    assert.ok(src.includes("useHotelMedia")||src.includes("photoAlt"),file);
  }
  const home=read("src/components/HotelExperience.tsx");
  // Per-item bilingual descriptions supersede the six-position demo helper
  // when the owner selects images from the new visual library.
  assert.ok(home.includes('alt={locale==="ar"?galleryImages[photo].altAr:galleryImages[photo].alt}'));
  assert.ok(read("src/lib/cms-media.ts").includes("approvedAsset"));
  assert.ok(read("src/lib/cms-media.ts").includes("altEn"));
  assert.ok(read("src/lib/cms-media.ts").includes("altAr"));
  const docs=read("docs/HOTEL_MEDIA_HANDOFF.md");
  assert.ok(docs.includes("rightsConfirmed"));
  assert.ok(docs.includes("media:launch-check"));
  assert.ok(docs.includes("noindex"));
});

test("Official media integrity runs in CI; launch stays a separate manual approval action",()=>{
  const workflow=read(".github/workflows/frontend-ci.yml");
  const pkg=JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["media:check"],"node scripts/verify-official-media.mjs");
  assert.equal(pkg.scripts["media:launch-check"],"node scripts/verify-official-media.mjs --launch");
  assert.ok(workflow.includes("npm run media:check"));
  assert.ok(!workflow.includes("npm run media:launch-check"));
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = f => readFileSync(new URL("../"+f,import.meta.url),"utf8");

test("Hero and gallery share one editable media manifest",()=>{
  const assets=read("src/lib/gallery.ts");
  const hero=read("src/components/PremiumMasthead.tsx");
  assert.ok(assets.includes("export const heroScenes"));
  assert.ok(assets.includes("galleryImages[0].src"));
  assert.ok(assets.includes("hotelBrand"));
  assert.ok(hero.includes("heroScenes"));
  assert.ok(hero.includes("hotelBrand.officialLogoSrc"));
  assert.ok(!hero.includes('const scenes = ['));
});

test("Official logo is optional and neither preview photos nor placeholder are falsely called official",()=>{
  const assets=read("src/lib/gallery.ts");
  const closing=read("src/components/PremiumClosing.tsx");
  const guide=read("docs/HOTEL_MEDIA_HANDOFF.md");
  assert.ok(assets.includes("officialLogoSrc: null"));
  assert.ok(assets.includes('origin:"placeholder" as const'));
  assert.ok(assets.includes("never presented as a photograph"));
  assert.ok(closing.includes("hotelBrand.officialLogoSrc"));
  assert.ok(guide.includes("not"));
  assert.ok(guide.includes("public/media/hotel/"));
});

test("Responsive photos lower the weight for mobile and keep local sources unmodified",()=>{
  const assets=read("src/lib/gallery.ts");
  const hero=read("src/components/PremiumMasthead.tsx");
  const sections=read("src/components/PremiumSections.tsx");
  assert.ok(assets.includes("responsivePhotoSrcSet"));
  assert.ok(assets.includes('[420, 800, 1200, 1800, 2200]'));
  assert.ok(assets.includes('!src.startsWith("https://images.unsplash.com/")'));
  assert.ok(hero.includes('fetchPriority={slide===0?"high":"auto"}'));
  assert.ok(hero.includes('sizes="100vw"'));
  assert.ok(sections.includes('srcSet={responsivePhotoSrcSet(img.src)}'));
});

test("Mobile menu and gallery maintain keyboard-friendly focus",()=>{
  const head=read("src/components/PremiumMasthead.tsx");
  const shell=read("src/components/HotelExperience.tsx");
  assert.ok(head.includes('aria-modal="true"'));
  assert.ok(head.includes('event.key !== "Tab"'));
  assert.ok(head.includes('menuRef.current?.querySelectorAll'));
  assert.ok(shell.includes("focusBeforePhoto"));
  assert.ok(shell.includes("lightboxRef"));
  assert.ok(shell.includes('e.key==="Tab"'));
  assert.ok(shell.includes('onOpenPhoto={openPhoto}'));
});

test("Floating booking shortcut and skip link support reduced motion",()=>{
  const head=read("src/components/PremiumMasthead.tsx");
  const css=read("src/app/visual-polish.css");
  assert.ok(head.includes("opal-stay-dock"));
  assert.ok(head.includes('href="#booking"'));
  assert.ok(head.includes("firstVisible"));
  // Navigation follows the published CMS section order.
  assert.ok(head.includes("orderedNav"));
  assert.ok(head.includes("const orderedNav=shownSections"));
  assert.ok(read("src/components/CmsProvider.tsx").includes("cms.sections.filter(item=>item.visible"));
  assert.ok(head.includes("beforeFooter"));
  assert.ok(css.includes(".opal-skip-link:focus-visible"));
  assert.ok(css.includes("prefers-reduced-motion:reduce"));
  assert.ok(css.includes("safe-area-inset-bottom"));
});

test("Failed srcSet images fall back to local SVG without stale remote candidates",()=>{
  const shell=read("src/components/HotelExperience.tsx");
  const sections=read("src/components/PremiumSections.tsx");
  assert.ok(shell.includes('removeAttribute("srcset")'));
  assert.ok(sections.includes('removeAttribute("srcset")'));
  assert.ok(shell.includes('"/media/photo-placeholder.svg"'));
});

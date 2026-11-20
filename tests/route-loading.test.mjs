import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("Route suspense and guest navigation share the same quiet Opal identity",()=>{
  const visual=read("src/components/OpalLoadingVisual.tsx");
  const boundary=read("src/app/[locale]/loading.tsx");
  const provider=read("src/components/RouteLoadingProvider.tsx");
  const root=read("src/app/layout.tsx");
  const page=read("src/components/HotelExperience.tsx");
  for(const term of ["OPAL LEGACY","opal-loader-wordmark","opal-loader-place",
    "opal-loader-progress",'role="status"','aria-live="polite"','aria-busy="true"'])
    assert.ok(visual.includes(term),term);
  assert.ok(!visual.includes("opal-loader-emblem"),"No rotating monogram in editorial loader");
  assert.ok(!visual.includes("opal-loader-corner"),"Avoid redundant corner slogans");
  assert.match(boundary,/OpalLoadingVisual/);
  assert.match(provider,/OpalLoadingVisual locale={locale} overlay/);
  assert.match(root,/RouteLoadingProvider/);
  assert.match(root,/route-loading-motion\.css/);
  assert.match(page,/startNavigation\(\);\s*router\.push/);
});

test("No fake delay: fast routes don't flash and cancelled ones cannot block the guest",()=>{
  const provider=read("src/components/RouteLoadingProvider.tsx");
  assert.match(provider,/setVisible\(true\)/);
  assert.match(provider,/setVisible\(false\)/);
  assert.match(provider,/6500/);
  assert.match(provider,/220/);
  assert.match(provider,/next\.pathname===current\.pathname&&next\.search===current\.search/);
  assert.match(provider,/next\.origin!==window\.location\.origin/);
  assert.match(provider,/anchor\.hasAttribute\("download"\)/);
  assert.match(provider,/event\.metaKey\|\|event\.ctrlKey/);
  assert.match(provider,/window\.addEventListener\("pageshow"/);
  assert.match(provider,/window\.addEventListener\("popstate"/);
  assert.ok(!provider.includes("window.location.reload()"));
});

test("Minimal luxury styling: gentle one-time type entrance, simple progress, no spinner",()=>{
  const css=read("src/app/route-loading-motion.css");
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/opal-loader-name-enter/);
  assert.match(css,/opal-loader-sweep/);
  assert.match(css,/\.opal-route-loading\.is-overlay/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.ok(!/@import|url\(/.test(css),"Loader must not fetch external media");
  assert.ok(!css.includes("@keyframes opal-loader-orbit")
    &&!css.includes("transform:rotate(")&&!css.includes(".opal-loader-emblem"),
    "No spinners or decorative orbit motion");
  assert.match(css,/\.opal-loader-wordmark,\.opal-loader-place,/);
  assert.match(css,/animation:none!important/);
  assert.match(css,/opacity:1;transform:none/);
});

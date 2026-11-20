import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("Route suspense and actual navigation use the same animated OPAL LEGACY identity",()=>{
  const visual=read("src/components/OpalLoadingVisual.tsx");
  const boundary=read("src/app/[locale]/loading.tsx");
  const provider=read("src/components/RouteLoadingProvider.tsx");
  const root=read("src/app/layout.tsx");
  const page=read("src/components/HotelExperience.tsx");
  for(const term of ["OPAL","LEGACY","opal-loader-emblem","opal-loader-letter",
    "opal-loader-progress","aria-live=\"polite\"","aria-busy=\"true\""])
    assert.ok(visual.includes(term),term);
  assert.match(boundary,/OpalLoadingVisual/);
  assert.match(provider,/OpalLoadingVisual locale={locale} overlay/);
  assert.match(root,/RouteLoadingProvider/);
  assert.match(root,/route-loading-motion\.css/);
  assert.match(page,/startNavigation\(\);\s*router\.push/);
});

test("No artificial wait; route loading remains safe on instant and cancelled navigation",()=>{
  const provider=read("src/components/RouteLoadingProvider.tsx");
  assert.match(provider,/setVisible\(true\)/);
  assert.match(provider,/setVisible\(false\)/);
  assert.match(provider,/6500/);
  assert.match(provider,/150/);
  assert.match(provider,/next\.pathname===current\.pathname&&next\.search===current\.search/);
  assert.match(provider,/next\.origin!==window\.location\.origin/);
  assert.match(provider,/anchor\.hasAttribute\("download"\)/);
  assert.match(provider,/event\.metaKey\|\|event\.ctrlKey/);
  assert.match(provider,/window\.addEventListener\("pageshow"/);
  assert.match(provider,/window\.addEventListener\("popstate"/);
  assert.ok(!provider.includes("window.location.reload()"));
});

test("Animation respects reduced motion and avoids media/network resources",()=>{
  const css=read("src/app/route-loading-motion.css");
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/opal-loader-letter-enter/);
  assert.match(css,/opal-loader-orbit/);
  assert.match(css,/\.opal-route-loading\.is-overlay/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.ok(!/@import|url\(/.test(css),"Loader should have no external background assets");
  assert.match(css,/\.opal-loader-letter\{opacity:1;transform:none;filter:none\}/);
});

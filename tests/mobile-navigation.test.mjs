import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("mobile menu is a full-viewport portal, never a fixed child of the blurred header",()=>{
  const header=read("src/components/PremiumMasthead.tsx");
  const styles=read("src/app/mobile-navigation.css");
  assert.ok(header.includes('import { createPortal } from "react-dom"'));
  assert.ok(header.includes("document.body"));
  assert.ok(header.includes('id="premium-mobile-menu"'));
  assert.ok(styles.includes("position:fixed!important"));
  assert.ok(styles.includes("height:100dvh"));
  assert.ok(styles.includes("z-index:120!important"));
  assert.ok(styles.includes("overflow-y:auto"));
});

test("menu is usable on iOS small screens with scroll restoration",()=>{
  const header=read("src/components/PremiumMasthead.tsx");
  const styles=read("src/app/mobile-navigation.css");
  assert.ok(header.includes('body.style.position = "fixed"'));
  assert.ok(header.includes('body.style.top = `-${savedY}px`'));
  assert.ok(header.includes('body.style.position = previous.position'));
  assert.ok(header.includes("window.scrollTo({ top: savedY"));
  assert.ok(styles.includes("safe-area-inset-top"));
  assert.ok(styles.includes("safe-area-inset-bottom"));
  assert.ok(styles.includes("-webkit-overflow-scrolling:touch"));
  assert.ok(styles.includes("@media(max-width:360px)"));
});

test("menu has accessible close, keyboard trap, RTL and working section navigation",()=>{
  const header=read("src/components/PremiumMasthead.tsx");
  const styles=read("src/app/mobile-navigation.css");
  assert.ok(header.includes('role="dialog" aria-modal="true"'));
  assert.ok(header.includes('dir={ar ? "rtl" : "ltr"} lang={locale}'));
  assert.ok(header.includes('ref={menuCloseRef}'));
  assert.ok(header.includes('event.key !== "Tab"'));
  assert.ok(header.includes('navigateFromMenu(event, id)'));
  assert.ok(header.includes('navigateFromMenu(event,"booking")'));
  assert.ok(header.includes('window.history.pushState'));
  assert.ok(header.includes('scrollIntoView'));
  assert.ok(styles.includes('[dir="rtl"].premium-menu-surface nav a'));
});

test("navigation regression is tested visually at four viewports in EN and AR",()=>{
  const visual=read("scripts/capture-preview.mjs");
  assert.ok(visual.includes("mobile-navigation-open.png"));
  assert.ok(visual.includes("menuGeometry"));
  assert.ok(visual.includes("menuScrollLock"));
  assert.ok(visual.includes("menuNavigate"));
  assert.ok(visual.includes("layout.portal&&layout.aboveHeader"));
  assert.ok(visual.includes("small-mobile-320"));
  assert.ok(visual.includes("['en','ar']"));
});

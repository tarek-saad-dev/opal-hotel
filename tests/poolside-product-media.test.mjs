import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire=createRequire(import.meta.url);
const cache=new Map();
function load(path){
  if(cache.has(path))return cache.get(path).exports;
  const module={exports:{}};
  cache.set(path,module);
  const source=readFileSync(new URL("../src/"+path+".ts",import.meta.url),"utf8");
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function("require","module","exports",js)(name=>name.startsWith("@/")?load(name.slice(2)):nativeRequire(name),module,module.exports);
  return module.exports;
}
const {poolsideProductSlots}=load("lib/room-concepts");
const {defaultVisualLibrary,normalizeVisualLibrary,approvedPublishedPaths,approveAssignedVisualMedia}=load("lib/cms-media");
const slugs=["zalina-luxor-day-experience","zalina-arabian-village-night-experience","one-bed-bubble","two-bed-bubble","three-bed-bubble"];
const photo="/api/cms/media/"+"a".repeat(32)+".jpg";
const makeAsset=()=>({src:photo,kind:"image",title:"Approved photo",category:"pool",altEn:"Pool",altAr:"المسبح",approved:false,poster:""});
test("all five backend keys are distinct and have empty media by default",()=>{
  assert.deepEqual(poolsideProductSlots.map(p=>p.slug),slugs);
  for(const p of poolsideProductSlots){
    assert.deepEqual(p.imageIndices,[]);
    assert.deepEqual(defaultVisualLibrary().placements.rooms[p.slug],{cover:"",gallery:[],video:""});
  }
});
test("old CMS snapshots gain product slots without losing legacy assignments",()=>{
  const old=defaultVisualLibrary();
  old.assets.push(makeAsset());
  old.placements.rooms["light-and-stillness"].cover=photo;
  for(const slug of slugs)delete old.placements.rooms[slug];
  const restored=normalizeVisualLibrary(old);
  assert.equal(restored.placements.rooms["light-and-stillness"].cover,photo);
  for(const slug of slugs)assert.equal(restored.placements.rooms[slug].cover,"");
});
test("assigned product media is private until approved and validated",()=>{
  const visual=defaultVisualLibrary();
  visual.assets.push(makeAsset());
  visual.placements.rooms[slugs[0]].cover=photo;
  const validated=normalizeVisualLibrary(visual);
  assert.equal(approvedPublishedPaths(validated).has(photo),false);
  const published=approveAssignedVisualMedia(validated);
  assert.equal(approvedPublishedPaths(published).has(photo),true);
  visual.placements.rooms[slugs[1]].cover="/untrusted.jpg";
  assert.throws(()=>normalizeVisualLibrary(visual));
});

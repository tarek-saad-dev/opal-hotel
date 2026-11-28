import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../src/",import.meta.url));
function* walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())yield* walk(p);else yield p;}}
test("Official brand is used throughout all live frontend source",()=>{
  const retired=/\bopal\s+legacy\b|(?:أوبال|اوبال)\s+(?:ليجاسي|ليغاسي|ليجاسى|ليغاسى)/i;
  for(const file of walk(root)){
    if(!/\.(tsx?|css|json)$/.test(file)||file.endsWith("cms-legacy.ts"))continue;
    assert.doesNotMatch(readFileSync(file,"utf8"),retired,path.relative(root,file));
  }
});
test("CMS validates saved text with the official-brand normalizer",()=>{
  const schema=readFileSync(path.join(root,"lib/cms-schema.ts"),"utf8");
  assert.match(schema,/const out=normalizeHotelBrandText\(value\.trim\(\)\)/);
  assert.match(schema,/normalizeHotelBrandText\(JSON\.stringify\(a\)\)/);
});

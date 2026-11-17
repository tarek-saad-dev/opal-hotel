import test from "node:test";
import assert from "node:assert/strict";
import {validateCapture} from "./validate-reference.mjs";

const valid = {httpStatus:200,title:"Hotel Opal Legacy Luxor",bodyTextSnippet:"Hotel details and gallery",
  headings:[{text:"Hotel Opal Legacy Luxor"}],
  images:[{src:"a"},{src:"b"},{src:"c"},{src:"d"}],body:{scrollHeight:1500}};
test("accepts a normal hotel gallery page",()=>assert.equal(validateCapture(valid).valid,true));
test("rejects the observed misleading rate-limit HTML",()=>{
  assert.equal(validateCapture({...valid,title:"",bodyTextSnippet:"Rate limit exceeded",
    headings:[],images:[],body:{scrollHeight:15}}).valid,false);
});
test("rejects HTTP 429",()=>assert.equal(validateCapture({...valid,httpStatus:429}).valid,false));
test("rejects missing hotel headings",()=>assert.equal(validateCapture({...valid,headings:[]}).valid,false));
test("rejects image-free capture",()=>assert.equal(validateCapture({...valid,images:[]}).valid,false));

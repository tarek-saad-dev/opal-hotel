import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source=readFileSync(new URL("../src/lib/poolside-allocation.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {allocations,validUnits,MAX_ONLINE_UNITS}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
const unit=(key,typeId,guests=1,bubbleId=null)=>({key,typeId,guests,bubbleId});
const result=(typeId,ids,count=ids.length)=>({availability:ids.length>0,available_bubbles:count,bubbles:ids.map(id=>({id,accommodation_type_id:typeId,code:String(id),status:"available"}))});
const types=[{id:1,is_active:true,max_guests:2},{id:2,is_active:true,max_guests:4},{id:3,is_active:false,max_guests:8}];
test("validates per-unit capacity, active types and online limit",()=>{
  assert.equal(validUnits([unit(1,1,2),unit(2,2,4)],types),true);
  assert.equal(validUnits([unit(1,1,3)],types),false);
  assert.equal(validUnits([unit(1,3)],types),false);
  assert.equal(validUnits([unit(1,1),unit(1,2)],types),false);
  assert.equal(validUnits(Array.from({length:MAX_ONLINE_UNITS+1},(_,i)=>unit(i,1)),types),false);
});
test("automatic allocation preserves guests and uses null IDs",()=>{
  const u=[unit(1,1,2),unit(2,2,4)];
  assert.deepEqual(allocations(u,{1:result(1,[10]),2:result(2,[20])},true),[
    {accommodation_type_id:1,bubble_id:null,guests:2},{accommodation_type_id:2,bubble_id:null,guests:4}
  ]);
});
test("rejects insufficient inventory or duplicate manual selection",()=>{
  const u=[unit(1,1,1,10),unit(2,1,2,10)];
  assert.equal(allocations(u,{1:result(1,[10]),2:result(1,[10])},true),null);
  assert.equal(allocations(u,{1:result(1,[10,11]),2:result(1,[10,11])},false),null);
  assert.equal(allocations(u,{1:result(1,[10,11],1),2:result(1,[10,11],1)},true),null);
  assert.deepEqual(allocations([u[0],{...u[1],bubbleId:11}],{1:result(1,[10,11]),2:result(1,[10,11])},false),[
    {accommodation_type_id:1,bubble_id:10,guests:1},{accommodation_type_id:1,bubble_id:11,guests:2}
  ]);
});
test("rejects missing responses and units of another type",()=>{
  assert.equal(allocations([unit(1,1)],{},true),null);
  assert.equal(allocations([unit(1,1)],{1:result(2,[20])},true),null);
});

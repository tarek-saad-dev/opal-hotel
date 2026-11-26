import type { Accommodation,Allocation,Availability } from "./opal-api";

export const MAX_ONLINE_UNITS=6;
export type UnitSelection={key:number;typeId:number|null;guests:number;bubbleId:number|null};
export type UnitAvailability=Record<number,Availability>;
export function validUnits(units:UnitSelection[],types:Accommodation[]):boolean{
  return units.length>=1&&units.length<=MAX_ONLINE_UNITS&&new Set(units.map(u=>u.key)).size===units.length&&units.every(u=>{
    const type=types.find(t=>t.id===u.typeId&&t.is_active);
    return !!type&&Number.isInteger(u.guests)&&u.guests>=1&&u.guests<=type.max_guests;
  });
}
// A matching check avoids counting the same physical bubble twice, including
// automatic allocation across different per-unit guest counts.
export function allocations(units:UnitSelection[],results:UnitAvailability,automatic:boolean):Allocation[]|null{
  const candidates=units.map(u=>{
    const result=results[u.key];
    if(!result?.availability||!Array.isArray(result.bubbles))return [];
    const ids=Array.from(new Set(result.bubbles.filter(b=>b.accommodation_type_id===u.typeId).map(b=>b.id)));
    return automatic?ids:ids.filter(id=>id===u.bubbleId);
  });
  if(candidates.some(ids=>!ids.length)||units.some(u=>u.typeId===null))return null;
  const owner=new Map<number,number>();
  function match(index:number,seen:Set<number>):boolean{
    for(const id of candidates[index]){
      if(seen.has(id))continue;
      seen.add(id);
      const previous=owner.get(id);
      if(previous===undefined||match(previous,seen)){owner.set(id,index);return true;}
    }
    return false;
  }
  if(!units.every((_,i)=>match(i,new Set())))return null;
  // Each endpoint reports available stock; also respect the lowest reported
  // count for each type. Laravel still makes the final atomic allocation.
  for(const typeId of new Set(units.map(u=>u.typeId))){
    const group=units.filter(u=>u.typeId===typeId);
    if(group.length>Math.min(...group.map(u=>results[u.key].available_bubbles)))return null;
  }
  return units.map(u=>({accommodation_type_id:u.typeId!,bubble_id:automatic?null:u.bubbleId,guests:u.guests}));
}

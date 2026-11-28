import type { Locale } from "@/lib/hotel-content";
import { roomTypes } from "@/lib/room-types";

/**
 * Room photo slots managed in the CMS media studio.
 *
 * The first three slugs are storage keys kept from earlier releases so existing
 * published media assignments stay valid. They are not room types; the real
 * room types (room-types.ts) each get their own slot after them.
 *
 * imageIndices are fallback slots in the media manifest (brand panels until the
 * hotel's photos are uploaded).
 */
export type RoomConcept = {
  slug: string;
  name: Record<Locale,string>;
  imageIndices: readonly number[];
};

// Historical handoff keys retained for existing CMS snapshots only. They do not define the live catalog.
export const poolsideProductSlots = [
  {slug:"zalina-luxor-day-experience",name:{en:"Day Experience",ar:"التجربة النهارية"},imageIndices:[]},
  {slug:"zalina-arabian-village-night-experience",name:{en:"Night Experience",ar:"التجربة المسائية"},imageIndices:[]},
  {slug:"one-bed-bubble",name:{en:"One Bed Bubble",ar:"فقاعة سرير واحد"},imageIndices:[]},
  {slug:"two-bed-bubble",name:{en:"Two Bed Bubble",ar:"فقاعة سريرين"},imageIndices:[]},
  {slug:"three-bed-bubble",name:{en:"Three Bed Bubble",ar:"فقاعة ثلاثة أسرّة"},imageIndices:[]},
] as const satisfies readonly RoomConcept[];
export const isPoolsideProductSlot=(slug:string)=>poolsideProductSlots.some(p=>p.slug===slug);

export const roomConcepts: readonly RoomConcept[] = [
  // General room photos (storage keys from earlier releases, kept so existing
  // published assignments stay valid). Shown in the Rooms section photo strip.
  { slug: "light-and-stillness", name: { en: "Room photos 1", ar: "صور الغرف 1" }, imageIndices: [2, 3, 5] },
  { slug: "quiet-comforts", name: { en: "Room photos 2", ar: "صور الغرف 2" }, imageIndices: [5, 2, 3] },
  { slug: "slow-mornings", name: { en: "Room photos 3", ar: "صور الغرف 3" }, imageIndices: [3, 5, 2] },
  // One slot per real room type: cover + gallery shown on that room's card.
  ...roomTypes.map(room=>({ slug: room.slug, name: room.name, imageIndices: [2] as const })),
  ...poolsideProductSlots,
];

export const generalRoomSlots = ["light-and-stillness","quiet-comforts","slow-mornings"] as const;

export type PoolsideMediaKind="day_use"|"bubble_stay";
export const validLiveProductSlug=(slug:string)=>/^[a-z0-9][a-z0-9-]{0,159}$/.test(slug);
export function poolsideMediaKey(kind:PoolsideMediaKind,slug:string):string{
  if(!validLiveProductSlug(slug)||!(kind==="day_use"||kind==="bubble_stay"))throw new Error("Invalid product media key");
  return "poolside:"+kind+":"+slug;
}
export const isLiveProductMediaKey=(key:string)=>/^poolside:(day_use|bubble_stay):[a-z0-9][a-z0-9-]{0,159}$/.test(key);
export function mediaConcepts(keys:string[]):readonly RoomConcept[]{
  return [...roomConcepts,...keys.filter(isLiveProductMediaKey).map(key=>({slug:key,name:{en:key.split(":")[2],ar:key.split(":")[2]},imageIndices:[]}))];
}
// Exact historical fallback only. Never reuse a legacy hotel room's media.
export function resolvePoolsideMedia<T>(media:Record<string,T>,kind:PoolsideMediaKind,slug:string):T|undefined{
  if(!validLiveProductSlug(slug))return undefined;
  const key=poolsideMediaKey(kind,slug);
  if(Object.hasOwn(media,key))return media[key];
  const historical=poolsideProductSlots.find(p=>p.slug===slug);
  const historicalKind=slug.startsWith("zalina-")?"day_use":"bubble_stay";
  return historical&&historicalKind===kind&&Object.hasOwn(media,slug)?media[slug]:undefined;
}

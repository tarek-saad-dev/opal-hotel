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

export const roomConcepts: readonly RoomConcept[] = [
  // General room photos (storage keys from earlier releases, kept so existing
  // published assignments stay valid). Shown in the Rooms section photo strip.
  { slug: "light-and-stillness", name: { en: "Room photos 1", ar: "صور الغرف 1" }, imageIndices: [2, 3, 5] },
  { slug: "quiet-comforts", name: { en: "Room photos 2", ar: "صور الغرف 2" }, imageIndices: [5, 2, 3] },
  { slug: "slow-mornings", name: { en: "Room photos 3", ar: "صور الغرف 3" }, imageIndices: [3, 5, 2] },
  // One slot per real room type: cover + gallery shown on that room's card.
  ...roomTypes.map(room=>({ slug: room.slug, name: room.name, imageIndices: [2] as const })),
];

export const generalRoomSlots = ["light-and-stillness","quiet-comforts","slow-mornings"] as const;

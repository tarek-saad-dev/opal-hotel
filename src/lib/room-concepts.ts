import type { Locale } from "@/lib/hotel-content";

/**
 * Room photo slots managed in the CMS media studio.
 *
 * The slugs are storage keys kept from earlier releases so existing published
 * media assignments stay valid. They are not room types: the website presents
 * the rooms from the hotel's facts (see roomFacts in hotel-content.ts) and shows
 * every photo placed in these slots in the Rooms section.
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
  { slug: "light-and-stillness", name: { en: "Room photos 1", ar: "صور الغرف 1" }, imageIndices: [2, 3, 5] },
  { slug: "quiet-comforts", name: { en: "Room photos 2", ar: "صور الغرف 2" }, imageIndices: [5, 2, 3] },
  { slug: "slow-mornings", name: { en: "Room photos 3", ar: "صور الغرف 3" }, imageIndices: [3, 5, 2] },
];

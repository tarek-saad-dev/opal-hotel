import type { Locale } from "@/lib/hotel-content";

/**
 * The hotel's six room types, from the Rooms tab of the hotel listing
 * (opal-legacy.luxor-hotels-eg.com, Nov 2026), written in our own words.
 * Rates and live availability are not part of the listing and are not shown.
 *
 * `photoRefs` are the listing's photo IDs for each room (for the photo
 * handoff, see docs/HOTEL_MEDIA_HANDOFF.md); the site never loads them.
 */
export type RoomType = {
  slug: string;
  name: Record<Locale, string>;
  beds: Record<Locale, string>;
  sizeM2: number;
  description: Record<Locale, string>;
  /** Features on top of the shared list in `roomAmenities`. */
  extras: Record<Locale, readonly string[]>;
  photoRefs: readonly string[];
};

const commonExtras = {
  en: ["Hair dryer", "Free toiletries", "Lift access", "Wake-up service"],
  ar: ["مجفف شعر", "مستلزمات حمام مجانية", "الوصول بالمصعد", "خدمة الإيقاظ"],
} as const;

export const roomTypes: readonly RoomType[] = [
  {
    slug: "single-garden-view",
    name: { en: "Single Room · Garden View", ar: "غرفة مفردة بإطلالة على الحديقة" },
    beds: { en: "1 single bed or 1 double bed", ar: "سرير مفرد واحد أو سرير مزدوج واحد" },
    sizeM2: 25,
    description: {
      en: "An air-conditioned room with a minibar, a terrace overlooking the garden and a private bathroom with a bath.",
      ar: "غرفة مكيفة بها ميني بار وتراس يطل على الحديقة وحمام خاص بحوض استحمام.",
    },
    extras: commonExtras,
    photoRefs: ["1749037857", "1749064276", "1749064297", "1749064242", "1749064301"],
  },
  {
    slug: "double-private-bathroom",
    name: { en: "Double Room · Private Bathroom", ar: "غرفة مزدوجة بحمام خاص" },
    beds: { en: "1 king-size bed", ar: "سرير كبير (كينج)" },
    sizeM2: 19,
    description: {
      en: "A double room with air conditioning, a minibar, a garden-view terrace and a private bathroom with a bath.",
      ar: "غرفة مزدوجة مكيفة بها ميني بار وتراس بإطلالة على الحديقة وحمام خاص بحوض استحمام.",
    },
    extras: {
      en: [...commonExtras.en, "Heating", "Outdoor dining area"],
      ar: [...commonExtras.ar, "تدفئة", "منطقة طعام خارجية"],
    },
    photoRefs: ["1749064297", "1749064242", "1749064301", "1749064306", "1749108501"],
  },
  {
    slug: "deluxe-double-twin",
    name: { en: "Deluxe Double or Twin · Garden View", ar: "غرفة ديلوكس مزدوجة أو بسريرين بإطلالة على الحديقة" },
    beds: { en: "2 single beds", ar: "سريران مفردان" },
    sizeM2: 44,
    description: {
      en: "A spacious double or twin room with a seating area, flat-screen TV, desk, terrace and a private bathroom.",
      ar: "غرفة واسعة مزدوجة أو بسريرين، بها منطقة جلوس وتلفزيون بشاشة مسطحة ومكتب وتراس وحمام خاص.",
    },
    extras: { en: ["Bathrobe", "Bidet"], ar: ["روب حمام", "شطّاف"] },
    photoRefs: ["1749037692", "1749037685", "1749037693", "1749037687", "1749037711"],
  },
  {
    slug: "triple-garden-view",
    name: { en: "Triple Room · Garden View", ar: "غرفة ثلاثية بإطلالة على الحديقة" },
    beds: { en: "3 single beds", ar: "3 أسرّة مفردة" },
    sizeM2: 60,
    description: {
      en: "A spacious room for three with air conditioning, a minibar, a garden-view terrace and a private bathroom with a bath.",
      ar: "غرفة واسعة لثلاثة أشخاص، مكيفة وبها ميني بار وتراس بإطلالة على الحديقة وحمام خاص بحوض استحمام.",
    },
    extras: {
      en: [...commonExtras.en, "Bathrobe", "Bidet"],
      ar: [...commonExtras.ar, "روب حمام", "شطّاف"],
    },
    photoRefs: ["1749037857", "1749064276", "1749064278", "1749064280", "1749064282"],
  },
  {
    slug: "one-bedroom-suite",
    name: { en: "One-Bedroom Suite", ar: "جناح بغرفة نوم واحدة" },
    beds: { en: "2 single beds", ar: "سريران مفردان" },
    sizeM2: 39,
    description: {
      en: "A living room, a separate bedroom and a bathroom with a bath and free toiletries; air-conditioned, with a flat-screen TV, minibar, tea and coffee maker, seating area and garden views.",
      ar: "غرفة معيشة وغرفة نوم منفصلة وحمام بحوض استحمام ومستلزمات مجانية؛ الجناح مكيف وبه تلفزيون بشاشة مسطحة وميني بار وماكينة شاي وقهوة ومنطقة جلوس وإطلالة على الحديقة.",
    },
    extras: {
      en: [...commonExtras.en, "Heating", "Patio"],
      ar: [...commonExtras.ar, "تدفئة", "فناء"],
    },
    photoRefs: ["1749037687", "1749037711", "1749037742", "1749037748", "1749037791"],
  },
  {
    slug: "family-suite",
    name: { en: "Family Suite", ar: "جناح عائلي" },
    beds: { en: "1 queen-size bed and 2 double beds", ar: "سرير كوين وسريران مزدوجان" },
    sizeM2: 60,
    description: {
      en: "A spacious suite with a living room, a separate bedroom and a bathroom with a bath and free toiletries; air-conditioned, with a flat-screen TV, minibar, tea and coffee maker, seating area and garden views.",
      ar: "جناح واسع به غرفة معيشة وغرفة نوم منفصلة وحمام بحوض استحمام ومستلزمات مجانية؛ مكيف وبه تلفزيون بشاشة مسطحة وميني بار وماكينة شاي وقهوة ومنطقة جلوس وإطلالة على الحديقة.",
    },
    extras: commonExtras,
    photoRefs: ["1749064278", "1749064280", "1749064282", "1749064315", "1749064273"],
  },
];

/** Features listed for every room type. */
export const roomAmenities: Record<Locale, readonly string[]> = {
  en: ["Air conditioning", "Terrace", "Garden views", "Seating area", "Work desk", "Wardrobe", "Fan",
    "Safe deposit box", "Flat-screen TV", "Mini-bar", "Tea and coffee maker", "Dining area", "Fruit",
    "Private bathroom", "Bath or shower", "Towels and linen", "Shampoo, conditioner and body soap",
    "Shower cap", "Cots available", "Wheelchair-accessible unit"],
  ar: ["تكييف", "تراس", "إطلالة على الحديقة", "منطقة جلوس", "مكتب عمل", "خزانة ملابس", "مروحة",
    "صندوق أمانات", "تلفزيون بشاشة مسطحة", "ميني بار", "ماكينة شاي وقهوة", "منطقة طعام", "فواكه",
    "حمام خاص", "حوض استحمام أو دش", "مناشف وبياضات أسرّة", "شامبو وبلسم وصابون",
    "غطاء شعر للاستحمام", "أسرّة أطفال متاحة", "الوحدة مهيأة للكراسي المتحركة"],
};

export const getRoomType = (slug: string): RoomType | undefined =>
  roomTypes.find(room => room.slug === slug);

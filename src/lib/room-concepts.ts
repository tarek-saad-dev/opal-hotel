import type { Locale } from "@/lib/hotel-content";
import { officialMediaActive } from "@/lib/gallery";

/**
 * Design-only mood stories. These are NOT actual named or bookable room types
 * at Opal Legacy, and they MUST be replaced with approved room inventory
 * before any live availability, prices or guest-capacity claims appear.
 *
 * Every photo index points into the illustrative gallery manifest.
 */
export type RoomConcept = {
  slug: string;
  label: Record<Locale,string>;
  name: Record<Locale,string>;
  introduction: Record<Locale,string>;
  story: Record<Locale,string>;
  highlights: Record<Locale,readonly string[]>;
  imageIndices: readonly number[];
};

export const roomConcepts: readonly RoomConcept[] = [
  {
    slug: "light-and-stillness",
    label: { en: "EDITORIAL CONCEPT 01", ar: "تصور تصميمي ٠١" },
    name: { en: "Light & Stillness", ar: "نور وهدوء" },
    introduction: {
      en: "An exploration of soft light, timeless textures and space to slow down.",
      ar: "تصور بصري للنور الهادئ والخامات الدافئة ومساحات تديك فرصة تبطّأ.",
    },
    story: {
      en: "This mood board imagines the gentle side of a Luxor escape: quiet mornings, subtle layers and warm natural tones. It is a visual direction, not a description of an available room.",
      ar: "لوحة إلهام بتتخيّل جانب هادي من الإقامة في الأقصر: صباحات خفيفة ودرجات طبيعية دافئة وتفاصيل بسيطة. ده تصور تصميمي مش وصف لغرفة متاحة.",
    },
    highlights: {
      en: ["Warm natural tones", "Gentle daylight", "A quieter visual rhythm"],
      ar: ["ألوان طبيعية دافئة", "إضاءة نهارية ناعمة", "إيقاع بصري هادئ"],
    },
    imageIndices: [2,5,3],
  },
  {
    slug: "quiet-comforts",
    label: { en: "EDITORIAL CONCEPT 02", ar: "تصور تصميمي ٠٢" },
    name: { en: "Quiet Comforts", ar: "تفاصيل مريحة" },
    introduction: {
      en: "A visual study in considered details and a softer sense of comfort.",
      ar: "دراسة بصرية للتفاصيل البسيطة اللي بتخلق إحساس بالراحة.",
    },
    story: {
      en: "Imagine a carefully composed retreat, where each texture and detail contributes to a feeling of ease. This is inspiration for the website's room storytelling, not verified hotel inventory.",
      ar: "تخيل مكان كل تفصيلة فيه بتكمل إحساس الراحة. الفكرة هنا إننا نوضح أسلوب عرض تجربة الغرف على الموقع، مش نعرض مخزون غرف تم تأكيده.",
    },
    highlights: {
      en: ["Considered details", "Layered textures", "Warm editorial composition"],
      ar: ["تفاصيل مدروسة", "خامات متعددة", "تكوين بصري دافئ"],
    },
    imageIndices: [5,2,3],
  },
  {
    slug: "slow-mornings",
    label: { en: "EDITORIAL CONCEPT 03", ar: "تصور تصميمي ٠٣" },
    name: { en: "Slow Mornings", ar: "صباح مختلف" },
    introduction: {
      en: "An invitation to picture unhurried mornings and a calmer pace.",
      ar: "تصور لصباحات على مهل وإيقاع أهدى.",
    },
    story: {
      en: "A study of morning light, generous breathing room and simple rituals. This mood story is not a confirmed room category.",
      ar: "فكرة بصرية عن نور الصباح ومساحات تنفّس وعادات يومية بسيطة. التصور ده مش نوع غرفة مؤكّد أو متاح للحجز.",
    },
    highlights: {
      en: ["A softer start", "Calm composition", "Natural visual warmth"],
      ar: ["بداية أهدى", "تنسيق بسيط", "دفء ألوان طبيعي"],
    },
    imageIndices: [3,2,5],
  },
] as const;

export const getRoomConcept = (slug: string): RoomConcept | undefined =>
  roomConcepts.find(room => room.slug === slug);

export const roomUI = (locale: Locale) => {
  const copy = locale === "ar" ? {
  collection: "تصورات الغرف",
  preface: "استكشف أسلوب التصميم",
  headline: "كل مساحة", italic: "ليها حكاية.",
  introduction: "دي تجربة استعراضية لتصميم صفحات الغرف. الأسماء والصور والأوصاف توضيحية وليست أنواع غرف معتمدة أو متاحة للحجز.",
  backHome: "العودة للرئيسية",
  all: "كل التصورات",
  explore: "استكشف التصور",
  detail: "تفاصيل التصور",
  image: "الصورة",
  of: "من",
  perspectives: "زوايا مختلفة",
  ideas: "ملامح التصميم",
  noteHeading: "تنويه مهم",
  notice: "الصفحة دي نموذج UI فقط، والصور لا تمثل غرف الفندق المؤكدة. لا توجد أسعار أو سعات أو إتاحة للحجز. هنستبدل المحتوى بعد اعتماد إدارة الفندق.",
  book: "معاينة تخطيط الإقامة",
  bookNote: "مفيش حجز فعلي متصل حاليًا.",
  previous: "الصورة السابقة",
  next: "الصورة التالية",
  language: "English",
  brand: "أوبال ليجاسي",
  back: "رجوع لتصورات الغرف",
  other: "اكتشف تصورات تانية",
  skip: "انتقل للمحتوى",
} : {
  collection: "THE ROOM JOURNAL",
  preface: "EXPLORE THE DESIGN DIRECTION",
  headline: "A room for", italic: "every feeling.",
  introduction: "This is a visual exploration of the future room-detail experience. Names, photography and stories are concepts, not confirmed or bookable hotel rooms.",
  backHome: "Back to homepage",
  all: "All concepts",
  explore: "Explore concept",
  detail: "Inside the concept",
  image: "Image",
  of: "of",
  perspectives: "A few perspectives",
  ideas: "The visual language",
  noteHeading: "A NOTE ABOUT THIS PREVIEW",
  notice: "Design preview only. These photographs do not represent verified rooms at Opal Legacy. Room types, amenities, capacity, rates and availability have not been confirmed.",
  book: "Preview your stay",
  bookNote: "Live reservations are not connected.",
  previous: "Previous image",
  next: "Next image",
  language: "العربية",
  brand: "Opal Legacy",
  back: "Back to room concepts",
  other: "Explore another story",
  skip: "Skip to content",
};
  if (!officialMediaActive) return copy;
  return {
    ...copy,
    introduction: locale==="ar"
      ? "صور الفندق معتمدة، لكن أسماء تصورات الغرف والحكايات دي للعرض البصري فقط وليست أنواع غرف مؤكدة أو متاحة للحجز."
      : "The photography is hotel-approved. The room mood stories and names are design concepts, not verified or bookable inventory.",
    notice: locale==="ar"
      ? "صور الفندق الرسمية معتمدة، لكن السعة والمرافق وأنواع الغرف والأسعار والإتاحة تحتاج اعتمادًا منفصلًا."
      : "Approved property photography. Room categories, capacity, amenities, rates and availability remain unverified.",
  };
};

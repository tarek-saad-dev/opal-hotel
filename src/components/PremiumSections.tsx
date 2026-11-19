"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode, SyntheticEvent } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { photoAlt, responsivePhotoSrcSet } from "@/lib/gallery";
import { useCmsSite,useHotelMedia } from "@/components/CmsProvider";
import { roomConcepts } from "@/lib/room-concepts";

type SharedProps = { locale: Locale; content: HotelContent };
type StoryProps = SharedProps & { onOpenPhoto: (index: number) => void };
type RoomsProps = StoryProps & { attemptedBooking: boolean; checkin: string; checkout: string };
const A = ({ children }: { children: ReactNode }) => <span className="opal-index">{children}</span>;

function demoImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.placeholder === "true") return;
  img.dataset.placeholder = "true";
  img.removeAttribute("srcset");
  img.src = "/media/photo-placeholder.svg";
}
function PreviewImage({ index, locale, eager = false }: { index: number; locale: Locale; eager?: boolean }) {
  const img = useHotelMedia().images[index];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="opal-editorial-photo" data-media-origin={img.origin} src={img.src} alt={img.origin==="hotel-approved"?(locale==="ar"?img.altAr:img.alt):photoAlt(index,locale)}
      srcSet={responsivePhotoSrcSet(img.src)} sizes="(max-width: 600px) 100vw, (max-width: 900px) 65vw, 42vw"
      width={1200} height={900} decoding="async" loading={eager ? "eager" : "lazy"} onError={demoImageError}/>
  );
}
function Header({ number, kicker, title, italic, note }: {
  number: string; kicker: string; title: string; italic?: string; note?: string;
}) {
  return <div className="opal-section-heading">
    <div className="opal-heading-kicker"><A>{number}</A><span>{kicker}</span></div>
    <div className="opal-heading-bottom"><h2>{title} {italic && <em>{italic}</em>}</h2>{note && <p>{note}</p>}</div>
  </div>;
}

export function PremiumStory({ locale, content: c, onOpenPhoto }: StoryProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.overview;
  const media=useHotelMedia();
  const ar = locale === "ar";
  const t = ar ? {
    kicker: "تجربة أوبال", top: "وراء كل إقامة", italic: "حكاية.",
    lead: "هنا تلتقي تفاصيل المكان بروح الأقصر؛ وتتحوّل أبسط اللحظات إلى ذكريات تستحق البقاء.",
    slow: "مساحة للإحساس بالمكان", secondary: "تجربة تكتشفها على مهل",
    photo: "استكشف الصور", line: "اكتشف التفاصيل",
    art: media.approved ? "صور حقيقية معتمدة من إدارة الفندق" : "صور توضيحية · سيتم استبدالها بصور الفندق المعتمدة",
  } : {
    kicker: "THE OPAL EXPERIENCE", top: "Beyond a stay,", italic: "a feeling.",
    lead: "A place to discover more slowly. Inspired by the textures, light and timeless atmosphere of Luxor.",
    slow: "THE BEAUTY OF SLOWING DOWN", secondary: "STORIES IN EVERY DETAIL",
    photo: "Explore the images", line: "DISCOVER THE DETAILS",
    art: media.approved ? "Hotel-approved property photography" : "Illustrative imagery · not photos of Opal Legacy",
  };
  return <div className="opal-story-wrap">
    <div className="opal-story-copy">
      <div className="opal-heading-kicker"><A>01</A><span>{heading.kicker}</span></div>
      <h2>{heading.title} <em>{heading.accent}</em></h2>
      <p className="opal-story-lead">{heading.description}</p>
      <p className="opal-story-detail">{c.overview[0]}</p>
      <a className="opal-text-link" href={`#${cms.sections.find(x=>x.id!=="overview"&&x.visible)?.id||"booking"}`}>{t.line}<span aria-hidden="true">↗</span></a>
      <div className="opal-story-signature"><span className="opal-signature-line"/><span>{t.slow}</span></div>
    </div>
    <div className="opal-story-media">
      <button className="opal-story-main-photo" type="button" onClick={() => onOpenPhoto(4)} aria-label={t.photo}>
        <PreviewImage locale={locale} index={4} eager/>
        <span className="opal-media-hover" aria-hidden="true">↗</span>
      </button>
      <div className="opal-story-inset">
        <button type="button" className="opal-story-small-photo" onClick={() => onOpenPhoto(1)} aria-label={t.photo}>
          <PreviewImage locale={locale} index={1} />
        </button>
        <span className="opal-story-side-note">{t.secondary}</span>
      </div>
      <p className="opal-photo-credit">{t.art}</p>
    </div>
  </div>;
}

export function PremiumFacilities({ locale, content: c }: SharedProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.facilities;
  const media=useHotelMedia();
  const ar = locale === "ar";
  const t = ar ? {
    kicker: "راحة في كل تفصيلة", title: "تفاصيل بسيطة.", italic: "تفرق كتير.",
    note: "من لحظات الهدوء إلى احتياجاتك اليومية، كل شيء يبدأ من الاهتمام بالتفاصيل.",
    items: [
      { number: "01", title: "مساحتك للراحة", text: "أجواء مريحة ومساحات هادئة للاستمتاع بالوقت." },
      { number: "02", title: "لحظات تستحقها", text: "استمتع باستراحة مختلفة خلال زيارتك للأقصر." },
      { number: "03", title: "تفاصيل يومك", text: "تعرّف على الخدمات والمرافق المدرجة للفندق." },
    ],
    full: "كل المرافق والخدمات", all: "عرض التفاصيل",
    foot: "المرافق والمواعيد المعروضة من المرجع السابق، وتحتاج تأكيد إدارة الفندق قبل الإطلاق.",
  } : {
    kicker: "CONSIDERED COMFORTS", title: "Little details.", italic: "Lasting impressions.",
    note: "Thoughtful touches and room to slow down, all presented with a quieter sense of luxury.",
    items: [
      { number: "01", title: "Space to unwind", text: "Rest, reset, and enjoy the rhythm of a slower day." },
      { number: "02", title: "Moments to enjoy", text: "A relaxed backdrop for time spent in Luxor." },
      { number: "03", title: "The everyday essentials", text: "Explore the facilities and services listed for the property." },
    ],
    full: "Explore all the amenities", all: "VIEW DETAILS",
    foot: "Amenities and policies are based on the previous listing and require hotel verification before launch.",
  };
  return <div className="opal-facilities-layout">
    <Header number="02" kicker={heading.kicker} title={heading.title} italic={heading.accent} note={heading.description}/>
    <div className="opal-facility-features">
      {t.items.map((item, i) => <article className="opal-feature" key={item.number}>
        <span className="opal-feature-number">{item.number} / 03</span>
        <span className={`opal-feature-symbol opal-feature-symbol-${i + 1}`} aria-hidden="true">
          {i === 0 ? "✳" : i === 1 ? "☼" : "⌁"}
        </span>
        <h3>{item.title}</h3><p>{item.text}</p>
        <span className="opal-feature-rule" aria-hidden="true"/>
      </article>)}
    </div>
    <div className="opal-amenities-panel">
      <div className="opal-amenities-heading">
        <span className="opal-label-mini">{t.all}</span><h3>{t.full}</h3>
      </div>
      <div className="opal-amenities-list">
        {c.facilities.map((group, i) => <details className="opal-amenity-details" key={group.title}>
          <summary><span className="opal-amenity-number">{String(i + 1).padStart(2, "0")}</span><strong>{group.title}</strong>
            <span className="opal-amenity-count">{group.items.length}</span>
            <span className="opal-amenity-toggle" aria-hidden="true">+</span>
          </summary>
          <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul>
        </details>)}
      </div>
      <p className="opal-verification-note">{t.foot}</p>
    </div>
  </div>;
}

export function PremiumLocation({ locale, content: c }: SharedProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.location;
  const media=useHotelMedia();
  const ar = locale === "ar";
  const t = ar ? {
    kicker: "الموقع", title: "في قلب", italic: "الحكاية.",
    subtitle: "الأقصر، مصر", intro: "كل رحلة لها مكان تبدأ منه. اكتشف موقع Opal Legacy وما حوله من معالم.",
    explore: "افتح الموقع على خرائط Google", nearby: "بالقرب منك",
    notice: "المسافات تقريبية ومأخوذة من المرجع السابق، وتحتاج إلى مراجعة.",
  } : {
    kicker: "A SENSE OF PLACE", title: "Rooted in", italic: "Luxor.",
    subtitle: "LUXOR, EGYPT", intro: "Every journey begins somewhere. Discover the hotel's location and a selection of nearby points of interest.",
    explore: "OPEN IN GOOGLE MAPS", nearby: "IN THE NEIGHBOURHOOD",
    notice: "Distances are indicative and sourced from the prior listing. Verify before publication.",
  };
  const map = "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(c.address);
  return <div className="opal-location-layout">
    <div className="opal-location-copy">
      <div className="opal-heading-kicker"><A>03</A><span>{heading.kicker}</span></div>
      <h2>{heading.title} <em>{heading.accent}</em></h2>
      <p className="opal-location-intro">{heading.description}</p>
      <div className="opal-location-address"><span className="opal-location-pin" aria-hidden="true">⌖</span>
        <div><span>{t.subtitle}</span><strong>{c.address}</strong></div>
      </div>
      <a className="opal-location-map-cta" href={map} target="_blank" rel="noopener noreferrer">
        {t.explore}<span aria-hidden="true">↗</span>
      </a>
    </div>
    <div className="opal-location-nearby">
      <div className="opal-location-nearby-head"><span className="opal-label-mini">{t.nearby}</span><span>↗</span></div>
      <ol>{c.attractions.map((attraction,i)=><li key={attraction.name}>
        <span className="opal-nearby-index">{String(i+1).padStart(2, "0")}</span>
        <span className="opal-nearby-name">{attraction.name}</span>
        <strong>{attraction.distance}</strong>
      </li>)}</ol>
      <p className="opal-verification-note">{t.notice}</p>
    </div>
  </div>;
}

const roomPhotos = [2,5,3] as const;

export function PremiumRooms({ locale, content: c, onOpenPhoto, attemptedBooking, checkin, checkout }: RoomsProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.rooms;
  const media=useHotelMedia();
  const ar = locale === "ar";
  const t = ar ? {
    kicker:"مساحات للإلهام", title:"أماكن تهدأ فيها.", italic:"وتستمتع بكل لحظة.",
    note:media.approved ? "صور الفندق معتمدة، لكن تصورات الغرف والأوصاف ليست أنواعًا مؤكدة أو متاحة للحجز." : "معاينة لأسلوب عرض الغرف في الموقع الجديد؛ الصور والأوصاف توضيحية وليست أنواع غرف مؤكدة.",
    stories:[
      {label:"فكرة تصميمية 01",name:"نور وهدوء",text:"مساحات هادئة وخامات دافئة."},
      {label:"فكرة تصميمية 02",name:"تفاصيل مريحة",text:"تصميم يجعل الراحة جزءًا من التجربة."},
      {label:"فكرة تصميمية 03",name:"صباح مختلف",text:"استمتع بإيقاع أبطأ ولحظات أجمل."},
    ],
    view:"عرض الصور", warning:"تصور مبدئي للغرف — ليس عرض حجز أو قائمة غرف فعلية",
    plan:"حالتك الحالية", noDates:"اختار تواريخ الإقامة من الأعلى لمعاينة تجربة الحجز.",
    details:"استكشف التفاصيل", allConcepts:"شوف كل التصورات",
  } : {
    kicker:"THE ART OF REST", title:"Rooms to slow down.", italic:"Moments to stay.",
    note:media.approved ? "Approved hotel photography. Room concepts and descriptions remain illustrative, not confirmed inventory." : "An editorial preview of how the room experience could look. Photography and concepts are illustrative, not confirmed hotel inventory.",
    stories:[
      {label:"DESIGN STORY 01",name:"Light & stillness",text:"A softer rhythm and warm material details."},
      {label:"DESIGN STORY 02",name:"Quiet comforts",text:"The thoughtful details that make a stay feel personal."},
      {label:"DESIGN STORY 03",name:"Slow mornings",text:"Time to pause, breathe and feel at ease."},
    ],
    view:"EXPLORE IMAGES", warning:media.approved ? "Hotel photography approved · Concepts are not actual room types or bookable inventory" : "Concept room imagery only · Not actual room types or bookable inventory",
    plan:"YOUR STAY PREVIEW", noDates:"Select your dates above to preview the booking journey.",
    details:"EXPLORE THE CONCEPT", allConcepts:"VIEW ALL ROOM STORIES",
  };
  return <div className="opal-rooms-wrap">
    <Header number="04" kicker={heading.kicker} title={heading.title} italic={heading.accent} note={media.approved?"Owner-approved images · room types remain concepts.":t.note}/>
    <div className="opal-room-cards">
      {t.stories.map((story, i) => <article className="opal-room-card" key={story.label}>
        <button type="button" className="opal-room-photo" onClick={() => onOpenPhoto(roomPhotos[i])}
          aria-label={`${t.view}: ${story.name}`}>
          <PreviewImage locale={locale} index={roomPhotos[i]}/>
          <span className="opal-room-photo-arrow" aria-hidden="true">↗</span>
          <span className="opal-room-image-badge">{story.label}</span>
        </button>
        <div className="opal-room-card-footer">
          <div><h3>{story.name}</h3><p>{story.text}</p>
            <Link className="opal-room-details-link" href={`/${locale}/rooms/${roomConcepts[i].slug}`}>
              {t.details}<span aria-hidden="true">↗</span>
            </Link>
          </div>
          <button className="opal-room-view" type="button" onClick={() => onOpenPhoto(roomPhotos[i])} aria-label={`${t.view}: ${story.name}`}>↗</button>
        </div>
      </article>)}
    </div>
    <Link className="opal-rooms-collection-link" href={`/${locale}/rooms`}>
      {t.allConcepts}<span aria-hidden="true">↗</span>
    </Link>
    <div className="opal-rooms-action">
      <p className="opal-rooms-disclaimer">{t.warning}</p>
      <div className="opal-rooms-availability" role="status" aria-live="polite">
        <span className="opal-label-mini">{t.plan}</span>
        <p>{attemptedBooking ? c.labels.noBooking : t.noDates}</p>
        {attemptedBooking && <strong dir="ltr">{checkin} — {checkout}</strong>}
      </div>
    </div>
  </div>;
}

type GalleryProps = SharedProps & { onOpenPhoto: (index:number)=>void };
const categories = ["all","spaces","moments"] as const;
type Category = (typeof categories)[number];
const categoryPhotos: Record<Exclude<Category,"all">,number[]> = {
  spaces:[0,2,4,5], moments:[1,3],
};
export function PremiumGallery({ locale, onOpenPhoto }: GalleryProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.gallery;
  const media=useHotelMedia();
  const ar = locale === "ar";
  const galleryImages=media.images;
  const [filter,setFilter] = useState<Category>("all");
  const t = ar ? {
    kicker:"نظرة أقرب",title:"جمال التفاصيل.",italic:"من كل زاوية.",
    note:media.approved ? "صور الفندق الرسمية والمعتمدة من إدارة الفندق." : "صور للإلهام البصري فقط؛ سيتم استبدالها بالصور الرسمية للفندق.",
    filters:{all:"كل الصور",spaces:"المساحات",moments:"اللحظات"},
    footer:media.approved ? "الصور من الفندق ومعتمدة للاستخدام؛ تفاصيل الغرف والإتاحة تحتاج اعتماد منفصل." : "الصور المعروضة توضيحية ولا تمثل غرف أو مرافق فندق Opal Legacy.",
    photo:"افتح الصورة",count:"صور معروضة",
  } : {
    kicker:"VISUAL JOURNAL",title:"A closer look.",italic:"Every angle.",
    note:media.approved ? "Explore hotel-approved property photography." : "Explore the visual direction. These photographs are illustrative until approved hotel imagery is provided.",
    filters:{all:"All images",spaces:"Spaces",moments:"Moments"},
    footer:media.approved ? "Approved property photography. Room inventory and live booking remain unverified." : "Illustrative photography for the UI concept. Not photographs of Opal Legacy Hotel.",
    photo:"Open photo",count:"images on view",
  };
  const visible = galleryImages.map((img,i)=>({...img,index:i}))
    .filter(img=>filter==="all" || categoryPhotos[filter].includes(img.index));
  return <div className="opal-gallery-wrap">
    <Header number="05" kicker={heading.kicker} title={heading.title} italic={heading.accent} note={media.approved?"Owner-approved hotel imagery":t.note}/>
    <div className="opal-gallery-toolbar">
      <div className="opal-gallery-tabs" role="group" aria-label={ar?"نوع الصور":"Image category"}>
        {categories.map(key=><button key={key} type="button" aria-pressed={filter===key}
          className={filter===key?"is-active":""} onClick={()=>setFilter(key)}>{t.filters[key]}</button>)}
      </div>
      <span className="opal-gallery-count">{String(visible.length).padStart(2,"0")} / {t.count}</span>
    </div>
    <div className={`opal-gallery-mosaic ${filter==="all"?"opal-gallery-full":"opal-gallery-filtered"}`}>
      {visible.map((img,i)=><button type="button" className={`opal-gallery-item opal-gallery-item-${i}`} key={img.src}
        onClick={()=>onOpenPhoto(img.index)} aria-label={`${t.photo} ${img.index+1}`}>
        <PreviewImage locale={locale} index={img.index}/>
        <span className="opal-gallery-hover" aria-hidden="true">↗</span>
        <span className="opal-gallery-item-number">{String(img.index+1).padStart(2,"0")}</span>
      </button>)}
    </div>
    <p className="opal-gallery-disclaimer">{t.footer}</p>
  </div>;
}

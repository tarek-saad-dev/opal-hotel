"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode, SyntheticEvent } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { responsivePhotoSrcSet } from "@/lib/gallery";
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
    <img className="opal-editorial-photo" data-media-origin={img.origin} src={img.src} alt={locale==="ar"?img.altAr:img.alt}
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
    art: media.overviewApproved||media.approved ? "صور حقيقية معتمدة من إدارة الفندق" : "صور توضيحية · سيتم استبدالها بصور الفندق المعتمدة",
  } : {
    kicker: "THE OPAL EXPERIENCE", top: "Beyond a stay,", italic: "a feeling.",
    lead: "A place to discover more slowly. Inspired by the textures, light and timeless atmosphere of Luxor.",
    slow: "THE BEAUTY OF SLOWING DOWN", secondary: "STORIES IN EVERY DETAIL",
    photo: "Explore the images", line: "DISCOVER THE DETAILS",
    art: media.overviewApproved||media.approved ? "Hotel-approved property photography" : "Illustrative imagery · not photos of Opal Legacy",
  };
  return <div className="opal-story-wrap">
    <div className="opal-story-copy">
      <div className="opal-heading-kicker"><A>01</A><span>{heading.kicker}</span></div>
      <h2>{heading.title} <em>{heading.accent}</em></h2>
      <p className="opal-story-lead">{heading.description}</p>
      <p className="opal-story-detail">{c.overview[0]}</p>
      {c.overview.length>1&&<details className="opal-cms-more-story">
        <summary>{ar?"تعرف على المكان أكثر":"More about the property"}</summary>
        {c.overview.slice(1).map((paragraph,i)=><p key={i}>{paragraph}</p>)}
      </details>}
      <a className="opal-text-link" href={`#${cms.sections.find(x=>x.id!=="overview"&&x.visible)?.id||"booking"}`}>{t.line}<span aria-hidden="true">↗</span></a>
      <div className="opal-story-signature"><span className="opal-signature-line"/><span>{t.slow}</span></div>
    </div>
    <div className="opal-story-media">
      <button className="opal-story-main-photo" type="button" onClick={() => onOpenPhoto(media.overviewMain)} aria-label={t.photo}>
        <PreviewImage locale={locale} index={media.overviewMain} eager/>
        <span className="opal-media-hover" aria-hidden="true">↗</span>
      </button>
      <div className="opal-story-inset">
        <button type="button" className="opal-story-small-photo" onClick={() => onOpenPhoto(media.overviewInset)} aria-label={t.photo}>
          <PreviewImage locale={locale} index={media.overviewInset} />
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
    {c.quick.length>0&&<ul className="opal-cms-quick-facts">
      {c.quick.map((item,i)=><li key={i}>{item}</li>)}
    </ul>}
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
      {media.facilitiesImage!==null&&<figure className="opal-media-section-figure">
        <PreviewImage locale={locale} index={media.facilitiesImage}/>
      </figure>}
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
      {media.locationImage!==null&&<figure className="opal-media-section-figure">
        <PreviewImage locale={locale} index={media.locationImage}/>
      </figure>}
    </div>
  </div>;
}

const roomPhotos = [2,5,3] as const; // Fallback until owner publishes room covers.

export function PremiumRooms({ locale, content: c, onOpenPhoto, attemptedBooking, checkin, checkout }: RoomsProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.rooms;
  const media=useHotelMedia();
  const roomPhoto=(i:number)=>media.roomMedia[roomConcepts[i].slug]?.cover??roomPhotos[i];
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
        <button type="button" className="opal-room-photo" onClick={() => onOpenPhoto(roomPhoto(i))}
          aria-label={`${t.view}: ${story.name}`}>
          <PreviewImage locale={locale} index={roomPhoto(i)}/>
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
const galleryCategoryLabels:Record<string,{en:string;ar:string}>={
  all:{en:"All media",ar:"كل الوسائط"},
  exterior:{en:"Exterior",ar:"الواجهة"},
  pool:{en:"Pool",ar:"المسبح"},
  rooms:{en:"Rooms",ar:"الغرف"},
  restaurant:{en:"Dining",ar:"المطعم"},
  facilities:{en:"Facilities",ar:"المرافق"},
  location:{en:"Location",ar:"الموقع"},
  events:{en:"Events",ar:"الفعاليات"},
  garden:{en:"Garden",ar:"الحديقة"},
  other:{en:"Other",ar:"أخرى"}
};
export function PremiumGallery({ locale, onOpenPhoto }: GalleryProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.gallery;
  const media=useHotelMedia();
  const ar=locale==="ar";
  const [filter,setFilter]=useState("all");
  const pictures=media.galleryIndices.map(index=>({
    ...media.images[index],index,category:media.imageCategories[index]||"other"
  }));
  const movies=media.galleryVideos;
  const filters=["all",...Array.from(new Set([
    ...pictures.map(x=>x.category),...movies.map(x=>x.category)
  ]))];
  const visible=pictures.filter(item=>filter==="all"||item.category===filter);
  const visibleFilms=movies.filter(item=>filter==="all"||item.category===filter);
  const count=visible.length+visibleFilms.length;
  return <div className="opal-gallery-wrap">
    <Header number="05" kicker={heading.kicker} title={heading.title} italic={heading.accent}
      note={ar?"صور وفيديوهات الفندق المختارة من الإدارة":"Selected photographs and films from the owner"}/>
    <div className="opal-gallery-toolbar">
      <div className="opal-gallery-tabs" role="group" aria-label={ar?"نوع الوسائط":"Media category"}>
        {filters.map(key=><button key={key} type="button" aria-pressed={filter===key}
          className={filter===key?"is-active":""} onClick={()=>setFilter(key)}>
            {galleryCategoryLabels[key]?.[locale]||key}
          </button>)}
      </div>
      <span className="opal-gallery-count">{String(count).padStart(2,"0")} / {ar?"وسائط معروضة":"items on view"}</span>
    </div>
    <div className={`opal-gallery-mosaic ${filter==="all"?"opal-gallery-full":"opal-gallery-filtered"}`}>
      {visible.map((img,i)=><button type="button" className={`opal-gallery-item opal-gallery-item-${i}`} key={img.src}
        onClick={()=>onOpenPhoto(img.index)} aria-label={ar?"افتح الصورة":"Open photo"}>
        <PreviewImage locale={locale} index={img.index}/>
        <span className="opal-gallery-hover" aria-hidden="true">↗</span>
        <span className="opal-gallery-item-number">{String(i+1).padStart(2,"0")}</span>
      </button>)}
    </div>
    {visibleFilms.length>0&&<div className="opal-gallery-films" aria-label={ar?"فيديوهات الفندق":"Hotel videos"}>
      {visibleFilms.map(item=><figure className="opal-gallery-film" key={item.src}>
        <video src={item.src} poster={item.poster||undefined} controls playsInline preload="none"
          aria-label={ar?item.altAr:item.alt}/>
        <figcaption>{item.title}</figcaption>
      </figure>)}
    </div>}
    <p className="opal-gallery-disclaimer">{ar
      ?"الوسائط الحقيقية المعتمدة تُعرض عند نشرها من لوحة الإدارة؛ بيانات الحجز تحتاج مراجعة منفصلة."
      :"Approved hotel media appears after owner publication; booking details remain subject to separate verification."}</p>
  </div>;
}

"use client";

import { useRef,useState } from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { hotelGeo, hotelMapUrl, type HotelContent, type Locale } from "@/lib/hotel-content";
import { responsivePhotoSrcSet } from "@/lib/gallery";
import { useCmsSite,useHotelMedia } from "@/components/CmsProvider";
import Link from "next/link";
import { generalRoomSlots } from "@/lib/room-concepts";
import { roomAmenities, roomTypes } from "@/lib/room-types";

type SharedProps = { locale: Locale; content: HotelContent };
type StoryProps = SharedProps & { onOpenPhoto: (index: number) => void };
type RoomsProps = StoryProps;
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
    <img className="opal-editorial-photo" data-media-origin={img.origin} src={img.src} alt={img.origin==="placeholder"?"":locale==="ar"?img.altAr:img.alt}
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
  const filmRef=useRef<HTMLVideoElement>(null);
  const [filmStarted,setFilmStarted]=useState(false);
  const startFilm=()=>{
    // This runs from the visitor's own click. The network request for the
    // MP4 begins only now; no cinematic video autoplay or initial transfer.
    setFilmStarted(true);
    void filmRef.current?.play().catch(()=>{ /* native controls remain available */ });
  };
  const ar = locale === "ar";
  const t = ar ? {
    kicker: "تجربة أوبال", top: "وراء كل إقامة", italic: "حكاية.",
    lead: "هنا تلتقي تفاصيل المكان بروح الأقصر؛ وتتحوّل أبسط اللحظات إلى ذكريات تستحق البقاء.",
    slow: "مساحة للإحساس بالمكان", secondary: "تجربة تكتشفها على مهل",
    photo: "استكشف الصور", line: "اكتشف التفاصيل",
  } : {
    kicker: "THE OPAL EXPERIENCE", top: "Beyond a stay,", italic: "a feeling.",
    lead: "A place to discover more slowly. Inspired by the textures, light and timeless atmosphere of Luxor.",
    slow: "THE BEAUTY OF SLOWING DOWN", secondary: "STORIES IN EVERY DETAIL",
    photo: "Explore the images", line: "DISCOVER THE DETAILS",
  };
  return <div className={`opal-story-wrap${media.overviewVideo?" is-film-layout":""}`}>
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
    <div className={"opal-story-media"+(media.overviewVideo?" is-video":"")}>
      {media.overviewVideo ? <div className="opal-story-film">
        <div className="opal-story-film-topline">
          <span>{ar?"استكشف أوبال":"DISCOVER OPAL"}</span>
          <span>01 / FILM</span>
        </div>
        <div className="opal-story-film-frame">
          <video ref={filmRef} src={media.overviewVideo.src}
            poster={media.overviewVideo.poster||undefined} preload="none"
            playsInline controls={filmStarted}
            aria-label={ar?"شاهد فيديو الفندق":"Watch the hotel film"}/>
          {!filmStarted&&<button type="button" className="opal-story-film-start" onClick={startFilm}
            aria-label={ar?"شغّل فيديو الفندق":"Play hotel film"}>
            <span className="opal-story-film-play" aria-hidden="true">▶</span>
            <span className="opal-story-film-start-label">{ar?"شاهد المكان":"WATCH THE FILM"}</span>
          </button>}
        </div>
        <div className="opal-story-film-bottomline">
          <span>{ar?"الفندق بعدسة حقيقية":"THE PLACE, IN MOTION"}</span>
          <span>{ar?"شغّل الفيديو وقت ما تحب":"PLAY WHEN YOU'RE READY"}</span>
        </div>
      </div> : <>
        <button className="opal-story-main-photo" type="button" disabled={!media.isReal(media.overviewMain)}
          onClick={() => onOpenPhoto(media.overviewMain)} aria-label={t.photo}>
          <PreviewImage locale={locale} index={media.overviewMain} eager/>
          <span className="opal-media-hover" aria-hidden="true">↗</span>
        </button>
        <div className="opal-story-inset">
          <button type="button" className="opal-story-small-photo" disabled={!media.isReal(media.overviewInset)}
            onClick={() => onOpenPhoto(media.overviewInset)} aria-label={t.photo}>
            <PreviewImage locale={locale} index={media.overviewInset}/>
          </button>
          <span className="opal-story-side-note">{t.secondary}</span>
        </div>
      </>}
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
      { number: "01", title: "مطعم أوبال والبار", text: "مأكولات عالمية في مطعم أوبال، وبار خارجي، وإفطار في الغرفة عند الطلب." },
      { number: "02", title: "ركوب الخيل والدراجات", text: "يرتب الفريق جولات ركوب الخيل وركوب الدراجات، والمساعدة في الرحلات والتذاكر." },
      { number: "03", title: "التراس والحديقة", text: "تراس للتشمس، وحديقة ومنطقة نزهات وشواء، وأمسيات في الملهى الليلي." },
    ],
    full: "كل المرافق والخدمات", all: "عرض التفاصيل", important: "معلومات مهمة",
  } : {
    kicker: "CONSIDERED COMFORTS", title: "Little details.", italic: "Lasting impressions.",
    note: "Thoughtful touches and room to slow down, all presented with a quieter sense of luxury.",
    items: [
      { number: "01", title: "The Opal restaurant & bar", text: "International cuisine at the Opal restaurant, an outdoor bar and in-room breakfast." },
      { number: "02", title: "Horseback riding & cycling", text: "The team arranges horseback-riding tours and cycling, plus help with tours and tickets." },
      { number: "03", title: "Sun terrace & gardens", text: "A sun terrace, garden, picnic and BBQ areas, and evenings at the nightclub." },
    ],
    full: "Explore all the amenities", all: "VIEW DETAILS", important: "IMPORTANT INFORMATION",
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
      {c.policies.length>0&&<div className="opal-policies">
        <span className="opal-label-mini">{t.important}</span>
        <ul>{c.policies.map(item=><li key={item}>{item}</li>)}</ul>
      </div>}
    </div>
  </div>;
}

// "1.5 km" / "1.5 كم" / "١٫٥ كم" → 1.5; unknown values sort last.
function distanceValue(text:string) {
  const western=text.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace("٫",".");
  const value=parseFloat(western.replace(/[^0-9.]/g,""));
  return Number.isFinite(value)?value:Number.POSITIVE_INFINITY;
}

export function PremiumLocation({ locale, content: c }: SharedProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.location;
  const media=useHotelMedia();
  const ar = locale === "ar";
  const t = ar ? {
    kicker: "الموقع", title: "في قلب", italic: "الحكاية.",
    subtitle: "الأقصر، مصر", intro: "كل رحلة لها مكان تبدأ منه. اكتشف موقع Opal Poolside وما حوله من معالم.",
    explore: "افتح الموقع على خرائط Google", nearby: "بالقرب منك",
    notice: "المسافات تقريبية.",
  } : {
    kicker: "A SENSE OF PLACE", title: "Rooted in", italic: "Luxor.",
    subtitle: "LUXOR, EGYPT", intro: "Every journey begins somewhere. Discover the hotel's location and a selection of nearby points of interest.",
    explore: "OPEN IN GOOGLE MAPS", nearby: "IN THE NEIGHBOURHOOD",
    notice: "Distances are approximate.",
  };
  const map = hotelMapUrl;
  // OpenStreetMap embed centred on the hotel's exact pin (no API key, no cookies).
  const d=0.012;
  const embed=`https://www.openstreetmap.org/export/embed.html?bbox=${hotelGeo.lng-d}%2C${hotelGeo.lat-d*0.7}%2C${hotelGeo.lng+d}%2C${hotelGeo.lat+d*0.7}&layer=mapnik&marker=${hotelGeo.lat}%2C${hotelGeo.lng}`;
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
      <div className="opal-location-map">
        <iframe title={ar?"خريطة موقع الفندق":"Map of the hotel location"} src={embed}
          loading="lazy" referrerPolicy="no-referrer"/>
      </div>
    </div>
    <div className="opal-location-nearby">
      <div className="opal-location-nearby-head"><span className="opal-label-mini">{t.nearby}</span><span>↗</span></div>
      <ol>{[...c.attractions].sort((a,b)=>distanceValue(a.distance)-distanceValue(b.distance)).map((attraction,i)=><li key={attraction.name}>
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

export function PremiumRooms({ locale, content: c, onOpenPhoto }: RoomsProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.rooms;
  const media=useHotelMedia();
  const ar = locale === "ar";
  // General room photos (the three legacy slots), real photos only.
  const photos=Array.from(new Set(generalRoomSlots.flatMap(slug=>{
    const m=media.roomMedia[slug];
    return m?[m.cover,...m.gallery]:[];
  }))).filter(index=>media.isReal(index)).slice(0,5);
  const t = ar ? {
    rooms:"غرف الفندق", features:"في كل الغرف", plan:"خطط لإقامتك", view:"عرض صورة الغرفة",
    types:"أنواع الغرف", beds:"الأسرّة", size:"المساحة", sqm:"م²", request:"اطلب هذه الغرفة",
    also:"وأيضًا",
  } : {
    rooms:"THE ROOMS", features:"IN EVERY ROOM", plan:"Plan your stay", view:"View room photo",
    types:"ROOM TYPES", beds:"Beds", size:"Size", sqm:"m²", request:"Request this room",
    also:"Also",
  };
  const [checkinRule,checkoutRule]=c.policies;
  return <div className="opal-rooms-wrap">
    <Header number="04" kicker={heading.kicker} title={heading.title} italic={heading.accent} note={heading.description}/>
    <div className={`opal-rooms-info${photos.length?" has-photos":""}`}>
      <div className="opal-rooms-facts">
        <span className="opal-label-mini">{t.rooms}</span>
        <p className="opal-rooms-count">{c.roomFacts.count}</p>
        <p className="opal-rooms-summary">{c.roomFacts.summary}</p>
        <span className="opal-label-mini">{t.features}</span>
        <ul className="opal-rooms-features">{roomAmenities[locale].map(item=><li key={item}>{item}</li>)}</ul>
        <div className="opal-rooms-times">
          {checkinRule&&<p>{checkinRule}</p>}
          {checkoutRule&&<p>{checkoutRule}</p>}
        </div>
      </div>
      {photos.length>0&&<div className={`opal-rooms-photos opal-rooms-photos-${photos.length}`}>
        {photos.map(index=><button type="button" key={index} className="opal-rooms-photo"
          onClick={()=>onOpenPhoto(index)} aria-label={t.view}>
          <PreviewImage locale={locale} index={index}/>
        </button>)}
      </div>}
    </div>
    <span className="opal-label-mini opal-room-types-label">{t.types}</span>
    <div className="opal-room-types">
      {roomTypes.map(room=>{
        const m=media.roomMedia[room.slug];
        const cover=m&&media.isReal(m.cover)?m.cover:null;
        return <article className={`opal-room-type${cover!==null?" has-photo":""}`} key={room.slug} id={"room-"+room.slug}>
          {cover!==null&&<button type="button" className="opal-room-type-photo" onClick={()=>onOpenPhoto(cover)}
            aria-label={`${t.view}: ${room.name[locale]}`}>
            <PreviewImage locale={locale} index={cover}/>
          </button>}
          <div className="opal-room-type-body">
            <h3>{room.name[locale]}</h3>
            <dl className="opal-room-type-specs">
              <div><dt>{t.beds}</dt><dd>{room.beds[locale]}</dd></div>
              <div><dt>{t.size}</dt><dd><span dir="ltr">{room.sizeM2}</span> {t.sqm}</dd></div>
            </dl>
            <p>{room.description[locale]}</p>
            {room.extras[locale].length>0&&<ul className="opal-room-type-extras" aria-label={t.also}>
              {room.extras[locale].map(item=><li key={item}>{item}</li>)}
            </ul>}
            <Link className="opal-room-type-cta" href={`/${locale}/booking?room=${room.slug}`}>
              {t.request}<span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>;
      })}
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
/** How many photos the section shows before "View all" opens the lightbox. */
const GALLERY_PREVIEW_COUNT=8;
export function PremiumGallery({ locale, onOpenPhoto }: GalleryProps) {
  const cms=useCmsSite();
  const heading=cms.locales[locale].headings.gallery;
  const media=useHotelMedia();
  const ar=locale==="ar";
  const [filter,setFilter]=useState("all");
  const pictures=media.galleryIndices.filter(index=>media.isReal(index)).map(index=>({
    ...media.images[index],index,category:media.imageCategories[index]||"other"
  }));
  const movies=media.galleryVideos;
  const filters=["all",...Array.from(new Set([
    ...pictures.map(x=>x.category),...movies.map(x=>x.category)
  ]))];
  const matching=pictures.filter(item=>filter==="all"||item.category===filter);
  const visible=matching.slice(0,GALLERY_PREVIEW_COUNT);
  const visibleFilms=movies.filter(item=>filter==="all"||item.category===filter).slice(0,2);
  const hidden=matching.length-visible.length;
  return <div className="opal-gallery-wrap">
    <Header number="05" kicker={heading.kicker} title={heading.title} italic={heading.accent} note={heading.description}/>
    {filters.length>2&&<div className="opal-gallery-toolbar">
      <div className="opal-gallery-tabs" role="group" aria-label={ar?"نوع الصور":"Photo category"}>
        {filters.map(key=><button key={key} type="button" aria-pressed={filter===key}
          className={filter===key?"is-active":""} onClick={()=>setFilter(key)}>
            {galleryCategoryLabels[key]?.[locale]||key}
          </button>)}
      </div>
    </div>}
    {/* Natural aspect ratios: every photo is shown whole, never cropped. */}
    <div className="opal-gallery-grid">
      {visible.map((img,i)=><button type="button" className="opal-gallery-tile" key={img.src}
        onClick={()=>onOpenPhoto(img.index)} aria-label={(ar?"افتح الصورة ":"Open photo ")+(i+1)}>
        <PreviewImage locale={locale} index={img.index}/>
      </button>)}
    </div>
    {hidden>0&&<button type="button" className="opal-gallery-more" onClick={()=>onOpenPhoto(matching[0].index)}>
      {ar?`عرض كل الصور (${matching.length})`:`View all ${matching.length} photos`}<span aria-hidden="true">→</span>
    </button>}
    {visibleFilms.length>0&&<div className="opal-gallery-films" aria-label={ar?"فيديوهات الفندق":"Hotel videos"}>
      {visibleFilms.map(item=><figure className="opal-gallery-film" key={item.src}>
        <video src={item.src} poster={item.poster||undefined} controls playsInline preload="none"
          aria-label={ar?item.altAr:item.alt}/>
        <figcaption>{item.title}</figcaption>
      </figure>)}
    </div>}
  </div>;
}

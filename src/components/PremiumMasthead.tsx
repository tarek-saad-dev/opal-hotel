"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, SVGProps, MouseEvent as ReactMouseEvent } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { hotelBrand, responsivePhotoSrcSet } from "@/lib/gallery";
import { useCmsSite,useHotelMedia,useVisibleSections } from "@/components/CmsProvider";
import { hasApprovedCmsHeroVideo,hasApprovedCmsFullFilm } from "@/lib/cms-schema";
import { HeroVideoBackground,FullHotelFilm } from "@/components/HeroVideo";
import { DateRangePicker } from "@/components/DateRangePicker";

type Props = {
  locale: Locale;
  poolside?: boolean;
  content: HotelContent;
  onAvailability: (range: { checkin: string; checkout: string; guests: number; adults: number; children: number }) => void;
  onOpenGallery: () => void;
};

type GlyphName = "arrow" | "menu" | "close" | "calendar" | "users" | "chevron" | "pin" | "plus" | "minus" | "sun" | "camera" | "play";

function Glyph({ name, ...props }: SVGProps<SVGSVGElement> & { name: GlyphName }) {
  const drawings: Record<GlyphName, React.ReactNode> = {
    arrow: <><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></>,
    menu: <><path d="M3.5 7h17" /><path d="M3.5 12h17" /><path d="M3.5 17h17" /></>,
    close: <><path d="m5 5 14 14" /><path d="M19 5 5 19" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="1.5" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 19v-2a6 6 0 0 1 12 0v2" /><path d="M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></>,
    camera: <><path d="M4 7h4l2-2h4l2 2h4v12H4z" /><circle cx="12" cy="13" r="3.5" /></>,
    play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />,
  };
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.55"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true" {...props}>{drawings[name]}</svg>;
}

const navItems = ["overview", "rooms", "facilities", "gallery", "location", "reviews", "contact"] as const;

function dateStamp(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dayAfter(input: string) {
  const parts = input.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + 1);
  return dateStamp(d);
}

export function PremiumMasthead({ locale, content: c, onAvailability, onOpenGallery, poolside }: Props) {
  const cms=useCmsSite();
  const media=useHotelMedia();
  const showVideo=hasApprovedCmsHeroVideo(cms);
  const fullFilmSrc=hasApprovedCmsFullFilm(cms)?cms.media.video.fullFilmSrc:"";
  const [filmOpen,setFilmOpen]=useState(false);
  const filmTriggerRef=useRef<HTMLButtonElement>(null);
  const closeFilm=()=>{
    setFilmOpen(false);
    requestAnimationFrame(()=>filmTriggerRef.current?.focus({preventScroll:true}));
  };
  const heroScenes=media.heroIndices.map((index,i)=>({...media.images[index],label:String(i+1).padStart(2,"0")}));
  const logoSrc=media.logoSrc??hotelBrand.officialLogoSrc;
  const heroCopy=cms.locales[locale].hero;
  const shownSections=useVisibleSections();
  const firstVisible=shownSections[0]||"booking";
  // The hero's main action goes to the rooms, the section visitors look for first.
  const roomsTarget=shownSections.includes("rooms")?"rooms":firstVisible;
  const hasRealPhotos=media.images.some(image=>image.origin==="hotel-approved");
  // Follow the published section order so the menu matches the page top-to-bottom.
  const orderedNav=shownSections
    .filter((id):id is typeof navItems[number]=>(navItems as readonly string[]).includes(id));
  const desktopNav=orderedNav.filter(id=>id!=="reviews"&&id!=="contact").slice(0,5);
  const ar = locale === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [slide, setSlide] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [today, setToday] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dockVisible, setDockVisible] = useState(false);
  const guestRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const restoreMenuFocus = useRef(false);

  useEffect(() => {
    const now = dateStamp(new Date());
    setToday(now);
    setCheckin(now);
    setCheckout(dayAfter(now));
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        restoreMenuFocus.current = true;
        setMenuOpen(false);
        setGuestsOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    // Full-screen mobile navigation lives in a body portal. A fixed child of
    // the old blurred/sticky header was constrained by its backdrop-filter
    // containing block, so the menu could be cut off or only 70px tall.
    const body = document.body;
    const root = document.documentElement;
    const savedY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      overscroll: root.style.overscrollBehavior,
    };
    // Lock the page behind the menu, including Safari/iOS rubber-band scroll.
    body.style.position = "fixed";
    body.style.top = `-${savedY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    menuCloseRef.current?.focus({ preventScroll: true });

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href]:not([aria-hidden="true"]), button:not([disabled])'
      ) || []);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!menuRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        menuCloseRef.current?.focus();
      }
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 1040) {
        restoreMenuFocus.current = false;
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", trapFocus);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      root.style.overscrollBehavior = previous.overscroll;
      document.removeEventListener("keydown", trapFocus);
      window.removeEventListener("resize", closeOnDesktop);
      window.scrollTo({ top: savedY, left: 0, behavior: "instant" });
      if (restoreMenuFocus.current) menuTriggerRef.current?.focus({ preventScroll: true });
      restoreMenuFocus.current = false;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!guestsOpen) return;
    function closeOutside(e: PointerEvent) {
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) setGuestsOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [guestsOpen]);

  useEffect(() => {
    // Scroll-spy: the active item is the last section whose top has passed
    // 35% of the viewport. More reliable than a thin IntersectionObserver band,
    // which lagged behind on tall sections and short ones.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const id of navItems) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = id;
      }
      setActiveSection(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    // Small-screen booking shortcut while exploring. Never cover the footer.
    const updateDock = () => {
      const booking = document.getElementById("booking");
      const footer = document.querySelector(".opal-end-footer");
      const pastBooking = booking ? booking.getBoundingClientRect().bottom < 0 : false;
      const beforeFooter = footer ? footer.getBoundingClientRect().top > innerHeight : true;
      setDockVisible(innerWidth <= 800 && scrollY > 550 && pastBooking && beforeFooter);
    };
    updateDock();
    window.addEventListener("scroll", updateDock, { passive: true });
    window.addEventListener("resize", updateDock);
    return () => {
      window.removeEventListener("scroll", updateDock);
      window.removeEventListener("resize", updateDock);
    };
  }, []);

  function navigateFromMenu(event: ReactMouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    restoreMenuFocus.current = false;
    setMenuOpen(false);
    // Wait until the body lock is released before scrolling to an anchor.
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;
      window.history.pushState(null, "", `#${id}`);
      target.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    });
  }

  function moveSlide(delta: number) {
    setImageFailed(false);
    setSlide(current => (current + delta + heroScenes.length) % heroScenes.length);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!checkin || !checkout || (today && checkin < today) || checkout <= checkin) {
      setError(c.labels.dateError);
      return;
    }
    setError("");
    setGuestsOpen(false);
    onAvailability({ checkin, checkout, guests: adults + children, adults, children });
  }

  const t = ar ? {
    home: "الصفحة الرئيسية", label: "إقامة تستحق أن تُروى", destination: "الأقصر، مصر",
    kicker: "تجربة بوتيك مختلفة في قلب الأقصر", first: "لحظات تعيشها،",
    second: "وحكايات تبقى.", description: "اكتشف هدوء المكان وروح العمارة المصرية في تجربة إقامة ذات طابع خاص.",
    photos: "استعرض الصور", film: "شاهد فيلم الفندق", scroll: "اكتشف المزيد",
    reserve: "خطط لإقامتك", nights: "إقامة لا تُنسى تبدأ هنا", guests: "الضيوف",
    guestPlural: "ضيف", adult: "البالغون", child: "الأطفال", plan: "احجز إقامتك",
    menuTitle: "اكتشف أوبال",
    guestsHint: "عدد الضيوف", rooms: "شاهد الغرف",
  } : {
    home: "Home", label: "STAY SOMEWHERE MEANINGFUL", destination: "LUXOR, EGYPT",
    kicker: "A BOUTIQUE RETREAT IN THE HEART OF LUXOR", first: "Some places",
    second: "stay with you.", description: "An intimate escape inspired by the warmth, texture and timeless spirit of Luxor.",
    photos: "View the gallery", film: "Watch our film", scroll: "SCROLL TO EXPLORE",
    reserve: "Plan your stay", nights: "YOUR LUXOR STORY STARTS HERE", guests: "Guests",
    guestPlural: "guests", adult: "Adults", child: "Children", plan: "Book your stay",
    menuTitle: "Explore Opal",
    guestsHint: "Your party", rooms: "View the rooms",
  };

  return (
    <>
      <a className="opal-skip-link" href="#overview">{ar ? "انتقل إلى المحتوى" : "Skip to main content"}</a>
      <header className={`premium-header${scrolled || menuOpen ? " is-scrolled" : ""}`} id="top">
        <div className="premium-header-inner">
          <Link className="premium-mark" href={`/${locale}`} aria-label={t.home}>
            {logoSrc
              ? <img className="premium-mark-official" src={logoSrc} alt="" width={56} height={56} />
              : <span className="premium-mark-symbol" aria-hidden="true">O</span>}
            <span className="premium-mark-words"><strong>{hotelBrand.wordmark}</strong><small>L U X O R&nbsp; · &nbsp;E G Y P T</small></span>
          </Link>
          <nav className="premium-desktop-nav" aria-label={c.labels.menu}>
            {desktopNav.map(id =>
              <a key={id} href={`#${id}`} aria-current={activeSection===id?"location":undefined}>{poolside&&id==="rooms"?(ar?"التجارب":"Experiences"):c.nav[id]}</a>
            )}
          </nav>
          <div className="premium-header-controls">
            {/* Full document navigation reads the latest published CMS snapshot in either locale. */}
            <a href={ar ? "/en" : "/ar"} className="premium-locale" lang={ar ? "en" : "ar"} hrefLang={ar ? "en" : "ar"}
              aria-label={ar ? "English" : "العربية"}>
              <span className="premium-locale-full">{ar ? "English" : "العربية"}</span>
              <span className="premium-locale-short" aria-hidden="true">{ar ? "EN" : "ع"}</span>
            </a>
            <a className="premium-header-cta" href="#booking">{t.reserve}<Glyph name="arrow" /></a>
            <button className="premium-hamburger" type="button" ref={menuTriggerRef}
              aria-controls="premium-mobile-menu" aria-expanded={menuOpen}
              aria-label={menuOpen ? c.labels.close : c.labels.menu}
              onClick={() => setMenuOpen(v => !v)}>
              <Glyph name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

      </header>
      {menuOpen && typeof document !== "undefined" && createPortal(
        <div className="premium-menu-surface" id="premium-mobile-menu" dir={ar ? "rtl" : "ltr"} lang={locale}
          role="dialog" aria-modal="true" aria-label={t.menuTitle} ref={menuRef}>
          <div className="premium-menu-top">
            <span className="premium-menu-brand" aria-label={hotelBrand.wordmark}>
              {logoSrc
                ? <img className="premium-mark-official" src={logoSrc} alt="" width={48} height={48}/>
                : <span className="premium-menu-brand-symbol" aria-hidden="true">O</span>}
              <span className="premium-menu-brand-wordmark"><strong>{hotelBrand.wordmark}</strong><small>LUXOR · EGYPT</small></span>
            </span>
            <div className="premium-menu-top-controls">
              <a href={ar ? "/en" : "/ar"} className="premium-menu-lang" lang={ar ? "en" : "ar"}
                hrefLang={ar ? "en" : "ar"}>{ar ? "English" : "العربية"}</a>
              <button type="button" className="premium-menu-close" ref={menuCloseRef}
                onClick={() => { restoreMenuFocus.current = true; setMenuOpen(false); }}
                aria-label={c.labels.close}><Glyph name="close"/></button>
            </div>
          </div>
          <div className="premium-menu-content">
            <p className="premium-menu-eyebrow">{t.menuTitle}</p>
            <nav aria-label={c.labels.menu}>
              {orderedNav.map((id, i) =>
                <a href={`#${id}`} key={id} aria-current={activeSection===id?"location":undefined}
                  onClick={event => navigateFromMenu(event, id)}>
                  <span className="premium-menu-number">{String(i + 1).padStart(2, "0")}</span>
                  <span className="premium-menu-link-text">{poolside&&id==="rooms"?(ar?"التجارب":"Experiences"):c.nav[id]}</span>
                  <Glyph name="arrow" />
                </a>
              )}
            </nav>
            <div className="premium-menu-bottom">
              <div className="premium-menu-foot"><Glyph name="pin" />{c.address}</div>
              <a className="premium-menu-booking" href="#booking"
                onClick={event => navigateFromMenu(event,"booking")}>
                <span>{t.reserve}</span><Glyph name="arrow"/>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}


      <section className="premium-hero" aria-labelledby="hotel-name">
        <div className="premium-hero-visual">
          {showVideo
            ? <HeroVideoBackground desktop={cms.media.video.desktopSrc}
                mobile={cms.media.video.mobileSrc} poster={cms.media.video.posterSrc} locale={locale}/>
            : !imageFailed
              ? <img key={slide} className="premium-hero-photo" data-media-origin={heroScenes[slide].origin} src={heroScenes[slide].src}
                  srcSet={responsivePhotoSrcSet(heroScenes[slide].src)} sizes="100vw"
                  width={1920} height={1080} loading="eager" decoding="async" fetchPriority={slide===0?"high":"auto"}
                  alt={heroScenes[slide].origin==="placeholder" ? "" : ar ? heroScenes[slide].altAr : heroScenes[slide].alt} onError={() => setImageFailed(true)} />
              : <div className="premium-hero-fallback" role="img" aria-label="Decorative boutique architecture illustration">
                  <span className="arch arch-one"/><span className="arch arch-two"/><span className="arch arch-three"/>
                </div>}
        </div>
        <div className="premium-hero-shade" />
        <div className="premium-hero-layout">
          <div className="premium-hero-copy">
            <p className="premium-eyebrow"><span className="premium-eyebrow-line" />{heroCopy.kicker}</p>
            <h1 id="hotel-name"><span className="opal-visually-hidden">{c.hotelName}: </span><span>{heroCopy.title}</span><em>{heroCopy.accent}</em></h1>
            <p className="premium-hero-description">{heroCopy.description}</p>
            <div className="premium-hero-actions">
              <a href={`#${roomsTarget}`} className="premium-hero-button">{poolside?(ar?"اكتشف التجارب":"Explore experiences"):t.rooms}<Glyph name="arrow" /></a>
              {fullFilmSrc&&<button type="button" className="premium-photo-button opal-hero-watch" ref={filmTriggerRef}
                onClick={()=>setFilmOpen(true)}>
                <span><Glyph name="play"/></span>{t.film}
              </button>}
              {hasRealPhotos&&<button type="button" className="premium-photo-button opal-hero-gallery" onClick={onOpenGallery}>
                <span><Glyph name="camera"/></span>{t.photos}
              </button>}
            </div>
          </div>
        </div>
        <div className="premium-hero-bottom">
          <a href={`#${firstVisible}`} className="premium-scroll-cue">
            <span className="premium-scroll-mark" /><span>{t.scroll}</span>
          </a>
          {!showVideo&&hasRealPhotos&&heroScenes.length>1&&<div className="premium-hero-scene-navigation">
            <span className="premium-scene-number" aria-label={ar ? `الصورة ${slide+1} من ${heroScenes.length}` : `Image ${slide + 1} of ${heroScenes.length}`}>
              {heroScenes[slide].label} <i/> 0{heroScenes.length}
            </span>
            <button type="button" aria-label={c.labels.previous} onClick={() => moveSlide(-1)}><Glyph name="arrow" /></button>
            <button type="button" aria-label={c.labels.next} onClick={() => moveSlide(1)}><Glyph name="arrow" /></button>
          </div>}
        </div>
      </section>
      {filmOpen&&fullFilmSrc&&<FullHotelFilm src={fullFilmSrc} locale={locale} onClose={closeFilm}/>}

      <section className="premium-booking-zone" id="booking" aria-labelledby="booking-heading">
        <div className="premium-booking-container">
          <div className="premium-booking-heading">
            <p className="premium-section-kicker">{t.nights}</p>
            <h2 id="booking-heading">{t.reserve}</h2>
          </div>
          <form className="premium-booking-form" onSubmit={submit}>
            <DateRangePicker variant="ribbon" locale={locale} checkin={checkin} checkout={checkout} min={today}
              labels={{ checkin: c.labels.checkin, checkout: c.labels.checkout }}
              ids={{ checkin: "premium-arrival", checkout: "premium-departure" }}
              onChange={range => { setCheckin(range.checkin); setCheckout(range.checkout); setError(""); setGuestsOpen(false); }} />
            <div className="premium-guest-field" ref={guestRef}>
              <button className="premium-guest-trigger" type="button" aria-haspopup="dialog"
                aria-expanded={guestsOpen} aria-controls="premium-guest-menu"
                onClick={() => setGuestsOpen(v => !v)}>
                <span className="premium-field-icon"><Glyph name="users"/></span>
                <span className="premium-field-copy">
                  <span className="premium-field-label">{t.guestsHint}</span>
                  <strong>{adults + children} {t.guestPlural}</strong>
                </span>
                <Glyph name="chevron" className={guestsOpen ? "chevron-up" : ""} />
              </button>
              {guestsOpen && <div id="premium-guest-menu" role="dialog" aria-label={t.guests} className="premium-guest-menu">
                {([{ name: t.adult, count: adults, update: setAdults, min: 1 },
                   { name: t.child, count: children, update: setChildren, min: 0 }] as const).map(item =>
                  <div className="premium-guest-row" key={item.name}>
                    <span>{item.name}</span>
                    <div className="premium-stepper">
                      <button type="button" onClick={() => item.update(v => Math.max(item.min, v - 1))}
                        disabled={item.count <= item.min} aria-label={`${item.name} - 1`}><Glyph name="minus" /></button>
                      <output>{item.count}</output>
                      <button type="button" onClick={() => item.update(v => Math.min(10, v + 1))}
                        disabled={item.count >= 10} aria-label={`${item.name} + 1`}><Glyph name="plus" /></button>
                    </div>
                  </div>)}
              </div>}
            </div>
            <button type="submit" className="premium-booking-submit">{t.plan}<Glyph name="arrow" /></button>
            {error && <p role="alert" className="premium-booking-error">{error}</p>}
          </form>
        </div>
      </section>
      <a className={`opal-stay-dock${dockVisible&&!menuOpen?" is-visible":""}`}
        href="#booking" aria-hidden={!dockVisible||menuOpen}
        tabIndex={dockVisible&&!menuOpen?0:-1}>
        <span>{t.reserve}</span><Glyph name="arrow"/>
      </a>
    </>
  );
}

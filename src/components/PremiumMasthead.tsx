"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, SVGProps, MouseEvent as ReactMouseEvent } from "react";
import type { HotelContent, Locale } from "@/lib/hotel-content";
import { heroScenes, hotelBrand, responsivePhotoSrcSet } from "@/lib/gallery";

type Props = {
  locale: Locale;
  content: HotelContent;
  onAvailability: (range: { checkin: string; checkout: string; guests: number }) => void;
  onOpenGallery: () => void;
};

type GlyphName = "arrow" | "menu" | "close" | "calendar" | "users" | "chevron" | "pin" | "plus" | "minus" | "sun" | "camera";

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

export function PremiumMasthead({ locale, content: c, onAvailability, onOpenGallery }: Props) {
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
    if (typeof IntersectionObserver === "undefined") return;
    const targets = navItems.map(id => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      }
    }, { rootMargin: "-25% 0px -58% 0px", threshold: 0 });
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
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
    onAvailability({ checkin, checkout, guests: adults + children });
  }

  const t = ar ? {
    home: "الصفحة الرئيسية", label: "إقامة تستحق أن تُروى", destination: "الأقصر، مصر",
    kicker: "تجربة بوتيك مختلفة في قلب الأقصر", first: "لحظات تعيشها،",
    second: "وحكايات تبقى.", description: "اكتشف هدوء المكان وروح العمارة المصرية في تجربة إقامة ذات طابع خاص.",
    discover: "اكتشف المكان", photos: "استعرض الصور", scroll: "اكتشف المزيد", aesthetic: "تفاصيل تصنع الفرق",
    reserve: "خطط لإقامتك", nights: "إقامة لا تُنسى تبدأ هنا", guests: "الضيوف",
    guestPlural: "ضيف", adult: "البالغون", child: "الأطفال", plan: "استعرض الإقامة",
    preview: "عرض تصميمي — الصور توضيحية لحين اعتماد صور الفندق",
    menuTitle: "اكتشف أوبال", helper: "تواريخك للعرض فقط؛ الحجز الفعلي غير مفعل بعد.",
    guestsHint: "عدد الضيوف", rooms: "تعرف على الغرف",
  } : {
    home: "Home", label: "STAY SOMEWHERE MEANINGFUL", destination: "LUXOR, EGYPT",
    kicker: "A BOUTIQUE RETREAT IN THE HEART OF LUXOR", first: "Some places",
    second: "stay with you.", description: "An intimate escape inspired by the warmth, texture and timeless spirit of Luxor.",
    discover: "Discover our story", photos: "Explore the gallery", scroll: "SCROLL TO EXPLORE", aesthetic: "THE ART OF FEELING AT HOME",
    reserve: "Plan your stay", nights: "YOUR LUXOR STORY STARTS HERE", guests: "Guests",
    guestPlural: "guests", adult: "Adults", child: "Children", plan: "Explore your stay",
    preview: "Design preview · illustrative photography until hotel assets are approved",
    menuTitle: "Explore Opal", helper: "Dates are for preview only. Live reservations are not yet enabled.",
    guestsHint: "Your party", rooms: "Explore the rooms",
  };

  return (
    <>
      <a className="opal-skip-link" href="#overview">{ar ? "انتقل إلى المحتوى" : "Skip to main content"}</a>
      <header className={`premium-header${scrolled || menuOpen ? " is-scrolled" : ""}`} id="top">
        <div className="premium-header-inner">
          <Link className="premium-mark" href={`/${locale}`} aria-label={t.home}>
            {hotelBrand.officialLogoSrc
              ? <img className="premium-mark-official" src={hotelBrand.officialLogoSrc} alt="" width={56} height={56} />
              : <span className="premium-mark-symbol" aria-hidden="true">O</span>}
            <span className="premium-mark-words"><strong>{hotelBrand.wordmark}</strong><small>L U X O R&nbsp; · &nbsp;E G Y P T</small></span>
          </Link>
          <nav className="premium-desktop-nav" aria-label={c.labels.menu}>
            {navItems.slice(0, 5).map(id =>
              <a key={id} href={`#${id}`} aria-current={activeSection===id?"location":undefined}>{c.nav[id]}</a>
            )}
          </nav>
          <div className="premium-header-controls">
            <Link href={ar ? "/en" : "/ar"} className="premium-locale" lang={ar ? "en" : "ar"} hrefLang={ar ? "en" : "ar"}>
              {ar ? "EN" : "عربي"}
            </Link>
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
        <div className="premium-menu-surface" id="premium-mobile-menu"
          role="dialog" aria-modal="true" aria-label={t.menuTitle} ref={menuRef}>
          <div className="premium-menu-top">
            <span className="premium-menu-brand" aria-label={hotelBrand.wordmark}>
              {hotelBrand.officialLogoSrc
                ? <img className="premium-mark-official" src={hotelBrand.officialLogoSrc} alt="" width={48} height={48}/>
                : <span className="premium-menu-brand-symbol" aria-hidden="true">O</span>}
              <span className="premium-menu-brand-wordmark"><strong>OPAL LEGACY</strong><small>LUXOR · EGYPT</small></span>
            </span>
            <div className="premium-menu-top-controls">
              <Link href={ar ? "/en" : "/ar"} className="premium-menu-lang" lang={ar ? "en" : "ar"}
                hrefLang={ar ? "en" : "ar"}>{ar ? "EN" : "عربي"}</Link>
              <button type="button" className="premium-menu-close" ref={menuCloseRef}
                onClick={() => { restoreMenuFocus.current = true; setMenuOpen(false); }}
                aria-label={c.labels.close}><Glyph name="close"/></button>
            </div>
          </div>
          <div className="premium-menu-content">
            <p className="premium-menu-eyebrow">{t.menuTitle}</p>
            <nav aria-label={c.labels.menu}>
              {navItems.map((id, i) =>
                <a href={`#${id}`} key={id} aria-current={activeSection===id?"location":undefined}
                  onClick={event => navigateFromMenu(event, id)}>
                  <span className="premium-menu-number">{String(i + 1).padStart(2, "0")}</span>
                  <span className="premium-menu-link-text">{c.nav[id]}</span>
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
          {!imageFailed
            ? <img key={slide} className="premium-hero-photo" src={heroScenes[slide].src}
              srcSet={responsivePhotoSrcSet(heroScenes[slide].src)} sizes="100vw"
              width={1920} height={1080} loading="eager" decoding="async" fetchPriority={slide===0?"high":"auto"}
              alt={heroScenes[slide].alt} onError={() => setImageFailed(true)} />
            : <div className="premium-hero-fallback" role="img" aria-label="Decorative boutique architecture illustration">
                <span className="arch arch-one"/><span className="arch arch-two"/><span className="arch arch-three"/>
              </div>}
        </div>
        <div className="premium-hero-shade" />
        <div className="premium-hero-layout">
          <div className="premium-hero-copy">
            <p className="premium-eyebrow"><span className="premium-eyebrow-line" />{t.kicker}</p>
            <h1 id="hotel-name"><span className="opal-visually-hidden">{c.hotelName}: </span><span>{t.first}</span><em>{t.second}</em></h1>
            <p className="premium-hero-description">{t.description}</p>
            <div className="premium-hero-actions">
              <a href="#overview" className="premium-hero-button">{t.discover}<Glyph name="arrow" /></a>
              <button type="button" className="premium-photo-button" onClick={onOpenGallery}>
                <span><Glyph name="camera"/></span>{t.photos}
              </button>
            </div>
          </div>
          <div className="premium-hero-aside" aria-hidden="true">
            <span className="premium-aside-line"/>
            <span>{t.aesthetic}</span>
          </div>
        </div>
        <div className="premium-hero-bottom">
          <a href="#overview" className="premium-scroll-cue">
            <span className="premium-scroll-mark" /><span>{t.scroll}</span>
          </a>
          <div className="premium-hero-scene-navigation">
            <span className="premium-scene-number" aria-label={ar ? `الصورة ${slide+1} من ${heroScenes.length}` : `Image ${slide + 1} of ${heroScenes.length}`}>
              {heroScenes[slide].label} <i/> 0{heroScenes.length}
            </span>
            <button type="button" aria-label={c.labels.previous} onClick={() => moveSlide(-1)}><Glyph name="arrow" /></button>
            <button type="button" aria-label={c.labels.next} onClick={() => moveSlide(1)}><Glyph name="arrow" /></button>
          </div>
        </div>
        <p className="premium-photo-disclaimer">{t.preview}</p>
      </section>

      <section className="premium-booking-zone" id="booking" aria-labelledby="booking-heading">
        <div className="premium-booking-container">
          <div className="premium-booking-heading">
            <p className="premium-section-kicker">{t.nights}</p>
            <h2 id="booking-heading">{t.reserve}</h2>
          </div>
          <form className="premium-booking-form" onSubmit={submit}>
            <label className="premium-date-cell" htmlFor="premium-arrival">
              <span className="premium-field-icon"><Glyph name="calendar" /></span>
              <span className="premium-field-copy">
                <span className="premium-field-label">{c.labels.checkin}</span>
                <input id="premium-arrival" aria-label={c.labels.checkin} required type="date" min={today || undefined}
                  value={checkin} onChange={e => {
                    const value = e.target.value;
                    setCheckin(value); setError("");
                    if (checkout && checkout <= value) setCheckout(dayAfter(value));
                  }} />
              </span>
            </label>
            <label className="premium-date-cell" htmlFor="premium-departure">
              <span className="premium-field-icon"><Glyph name="calendar" /></span>
              <span className="premium-field-copy">
                <span className="premium-field-label">{c.labels.checkout}</span>
                <input id="premium-departure" aria-label={c.labels.checkout} required type="date"
                  min={checkin ? dayAfter(checkin) : today || undefined} value={checkout}
                  onChange={e => { setCheckout(e.target.value); setError(""); }} />
              </span>
            </label>
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
          <p className="premium-booking-note">{t.helper}</p>
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

# OPAL LEGACY — Frontend Master Specification

**Version:** 1.0 (Reference Lock — structural baseline)  
**Date:** 17 نوفمبر 2026  
**Reference EN:** https://opal-legacy.luxor-hotels-eg.com/en/  
**Reference AR:** https://opal-legacy.luxor-hotels-eg.com/ar/  
**Design decision:** High-fidelity replication + **small, approved** improvements only.  
**Status:** Structure locked from live page text; visual and interaction measurements await live-browser capture.

---

## 0) المبادئ غير القابلة للتغيير

1. لا إعادة تصميم ولا تغيير للشخصية البصرية بلا موافقة صريحة.
2. نبني الصفحة من أعلى لأسفل وبنفس ترتيب المكونات المرجعية.
3. تُفصل المعلومات الظاهرة عن المكونات المتحكمة في الحجز والـAPI.
4. لا نختلق لونًا أو حجم خط أو Breakpoint ونصفه بأنه «مأخوذ من الموقع»؛ القيم المرئية يتم قياسها من المتصفح أولًا.
5. ننفذ إصلاحات بسيطة في الحركة والحالات التفاعلية وإمكانية الوصول والأداء دون تغيير هوية الواجهة.
6. أي تغيير في Hero layout، حجم المعرض، شريط التصفح، ترتيب الأقسام، الخط، الألوان أو عرض الحجز = **Approval required**.
7. العلامات التجارية والروابط الخاصة بشبكة luxor-hotels-eg.com لا تُنسخ باعتبارها أصلًا مملوكًا للفندق.

## 1) Evidence & certainty legend

- **Confirmed (C):** عنصر أو نص أو رابط موجود في النسخة الإنجليزية/العربية للنص المستخرج من الصفحة بتاريخ المراجعة.
- **Observed link/photo (P):** رابط مباشر تم فتحه بصورته الأصلية.
- **Proposed (D):** اختيار هندسي يمكن تعديله أثناء مرحلة المطابقة؛ لا يدعي أنه نفس CSS المرجعي.
- **Unverified (U):** لا يُحسم قبل Screenshots/DOM أو اتصال حقيقي بالحجز/موافقة الفندق.

### Baseline المصدر

- الإنجلش: Headline «Hotel Opal Legacy Luxor»؛ العنوان «Rd Lead To Esna, Luxor, Egypt»؛ قسم Online Reservation؛ five facility groups؛ Booking/Rooms؛ Gallery؛ Review؛ Contact؛ footer. **C**
- العربي: «فندق Opal Legacy Luxor» واتجاه اللغة العربية وإصدارات أسماء الأقسام. **C**
- صورة أصلية معروفة: `/data/Photos/OriginalPhoto/17490/1749064/1749064282/luxor-opal-legacy-luxor-photo-22.JPEG`، أظهرت سقفًا طوبيًا مقوسًا وثلاثة أسرة. **P**
- كود الألوان، مقياس الـgrid، طول الصفحة، العروض البكسلية، sticky states، ترتيب الصور المعروض فعليًا، hover states: **U**.

## 2) Page route & information architecture

**Primary routes:** `/en/`, `/ar/`؛ internal section links/anchors are visible. Other languages exist in source but not automatically part of V1 requirements.

**Confirmed order from accessible source:**

1. Network-level masthead/menu, currency and languages
2. Hotel name, address, map link
3. Primary cluster of hotel images
4. Online Reservation: Check-in / Check-out / Check availability
5. Hotel Overview: quick features + multi-paragraph description
6. Facilities with five groups
7. Important information: check-in/check-out policies
8. Location: nearby attractions, airport, train station
9. Rooms & Availability + loading/empty text
10. Gallery
11. Write a review
12. Contact Us
13. Footer / section navigation / address / externally branded links

**Note:** source text order is not proof of actual visual positioning or overlay/sticky treatment. The browser capture will lock it.

## 3) Detailed component contracts

### 3.1 `SiteHeader`

**Source content (C):** Luxor Hotels/network text, Menu, review/contact links, support/navigation, GBP selector with multiple currencies, language selector with English, Arabic and other locales.

**Visual contract:** reproduce the actual desktop header height, spacing, icon placement, dropdown appearance, menu and responsive behavior once measured. Replace third-party branding with authorized hotel identity, keeping a similar information layout unless otherwise approved.

**Behavior contract:** accessible keyboard navigation, menu close via Escape / outside click, currently selected locale, valid internal links; no pretend currency conversion.

**Unknown:** exact styling, sticky behavior, menu mechanics, mobile drawer width and breakpoint.

### 3.2 `HotelIdentity`

**Source content (C):** H1 `Hotel Opal Legacy Luxor`; address `Rd Lead To Esna, Luxor, Egypt`; `Map` anchor.

**Contract:** preserve name/address/map hierarchy. One semantic H1. Map should navigate to verified hotel map location; do not infer GPS from text.

### 3.3 `PrimaryGallery`

**Source content (C):** large set of hotel image links appears before the Online Reservation section in source text. Number of hero-range image anchors in text = 100 (links 15–114, **not verified as 100 unique photo assets**).

**Contract:** match the desktop image composition, crop, order, count exposed above fold and mobile presentation from screenshots. Preserve authentic architecture in photos; do not invent photos or recolor aggressively. For accessibility, use meaningful alternative text, keyboard-accessible lightbox and focus restoration.

**Implementation:** local/authorized CDN images with `width`/`height`, suitable `sizes` and responsive format; lightbox may prefetch adjacent photos only.

**Unknown:** number of images visible in the gallery grid at once, exact layout, lightbox transitions, lazy loading and underlying photo URLs.

### 3.4 `BookingSearch`

**Source content (C):** `Online Reservation`, `Check-in date:`, `Check-out date:`, `Check availability`. At 2026-11-17 the indexed page displayed 2026-11-18 & 2026-11-19 (snapshot, not hardcoded spec).

**State machine (D):**
- idle -> calendar-open -> date-selected -> valid-range -> submitting -> available | unavailable | error.
- Check-out strictly after Check-in; date filters and restrictions consistent with actual booking policy.
- Never show success or booking confirmation without real system acknowledgement.
- Use error text that distinguishes connection failure vs no availability.

**UI contract:** replicate actual label/button position, input sizes, colors, border and shadows from capture. Avoid introducing guests dropdown or payment UI before verification.

**Unknown:** booking endpoint, server pricing, accommodation types, availability/room card appearance, redirected checkout flow, time zone/currency logic.

### 3.5 `HotelOverview`

**Source content (C):** hotel name title; a quick feature strip/list; descriptive paragraphs mentioning 40 rooms, restaurant, garden views, horseback riding, Colossi of Memnon, Luxor Temple, local attractions and airport.

**Contract:** preserve content hierarchy and paragraph/block density as seen in real browser. Quick feature headings include Wi-Fi, 24-hour services, sports, shuttle, dining, meetings, child-friendly, wheelchair access.

**Data validity:** room count and claims are third-party site copy; hotel team must approve before production.

### 3.6 `HotelFacilities`

**Source groups (C):**
1. General — 19 items (Wi-Fi, parking, safe, 24h reception, pets, wheelchair access etc.)
2. Dining — 10 items (restaurant, in-room breakfast, snack bar etc.)
3. Leisure & Sports — 11 items (sun terrace, garden, cycling, fishing, horseback riding etc.)
4. Services — 11 items (airport shuttle, housekeeping, laundry, tour assistance etc.)
5. Room Amenities — 19 items (AC, mini-bar, TV, terrace, cots etc.)

**Contract:** maintain group order, iconography and item wrapping according to screenshots. Collapse controls on mobile **only if accepted or shown in reference**.

### 3.7 `ImportantInformation`

**Source content (C):** Check-in from 08:00 until 12:00; Check-out until 10:00.

**Contract:** preserve placement and text labels while marking policy facts pending confirmation from hotel management.

### 3.8 `HotelLocation`

**Source content (C):** current location and list of attractions/distances, airport and rail distances. The page descriptions vary internally (e.g. airport text says 5 km while Location section says 14 km; train 4.3 vs 4.5 km). The Arabic list also differs from the English one.

**Contract:** match map/list geometry and labels from visual reference; never present coordinates or route distances without verification.

**Unknown:** actual map implementation/provider, geocoordinates, responsive layout and marker behavior.

### 3.9 `RoomsAvailability`

**Source content (C):** `Rooms & Availability`, input elements, placeholder `Please, select dates to see available rooms.`, searching rooms/hotels text.

**Contract:** preserve section presence, empty and loading states. Design actual available-room result only after reference capture/booking integration. Do not invent prices, room names or photos.

### 3.10 `FullGallery`

**Source content (C):** Gallery followed by many repeated image entries.

**Contract:** visual lock needed for grid size, number of columns, item aspect ratios, image modal and overlay. Main and secondary galleries may share asset data while retaining their own presentation.

### 3.11 `ReviewForm`

**Source content (C):** Name, Email, When did you travel? selectors, 1–10 scale (`Very bad` -> `Excellent`), Pros and Cons.

**Contract:** preserve field order and labels; include inline errors, accessible rating radio group, submission acknowledgement only after real success. Do not surface fabricated ratings or reviews.

### 3.12 `ContactForm`

**Source content (C):** Group booking note for requests above two rooms, Name, Email, Subject select, Message.

**Contract:** preserve field sequence, labels, responsive widths. Add validation and network feedback; do not submit test data to source site.

### 3.13 `SiteFooter`

**Source content (C):** section overview links, address, contact, network copyright and popular-hotel advertisements.

**Contract:** preserve rough hierarchy and density but remove irrelevant external network ads/brand, and use hotel-owned information after verification. This is an **approved scope exception** to literal replication.

## 4) Localization

- Phase 1: `/en` and `/ar` per source; preserve correct RTL text direction and icon semantics.
- Translation keys for nav, overview, facilities, forms, loading/errors and policies.
- Use local formatting for dates, but avoid changing stored ISO dates across locales.
- At the visual lock: record English font family and Arabic font/spacing separately; no assumed font until computed CSS is available.

## 5) Suggested implementation architecture (D)

- Next.js App Router + React + TypeScript.
- CSS tokens and scoped component styles or Tailwind; styling must reproduce source, not a UI kit's defaults.
- `next-intl` for localization; React Hook Form + Zod for forms; typed booking adapter.
- Segregate presentation, content records, state machines and remote data. Mock adapters only in development.

Proposed structure:

```text
src/
  app/[locale]/page.tsx
  components/layout/{SiteHeader,SiteFooter}.tsx
  components/hotel/{HotelIdentity,PrimaryGallery,HotelOverview,HotelFacilities,ImportantInformation,HotelLocation,RoomsAvailability,FullGallery,ReviewForm,ContactForm}.tsx
  components/booking/{BookingSearch,DateRangePicker}.tsx
  content/{hotel.en.json,hotel.ar.json}
  lib/booking/{types,adapter}.ts
  styles/{tokens,global}.css
  tests/visual/
```

### Type contracts (D)

```ts
type Locale = 'en' | 'ar';
type HotelPhoto = {
  id: string; src: string; thumbnailSrc?: string;
  width: number; height: number; alt: Record<Locale,string>;
  sortOrder: number;
};
type FacilityGroup = { id: string; title: Record<Locale,string>; items: {id:string; name: Record<Locale,string>}[] };
type AvailabilityQuery = { checkIn: string; checkOut: string; adults?: number; children?: number };
type AvailabilityResult =
  | { state: 'available'; rooms: RoomOffer[] }
  | { state: 'unavailable'; rooms: [] }
  | { state: 'error'; code: string; message: string };
type RoomOffer = { id:string; name:Record<Locale,string>; price?:{amount:number;currency:string}; photos:HotelPhoto[] };
```

## 6) Visual design tokens (TBD pending capture)

**Not yet confirmed:**

```text
--color-background: PENDING_MEASUREMENT
--color-text-primary: PENDING_MEASUREMENT
--color-text-muted: PENDING_MEASUREMENT
--color-accent: PENDING_MEASUREMENT
--font-family-en: PENDING_MEASUREMENT
--font-family-ar: PENDING_MEASUREMENT
--container-max-width: PENDING_MEASUREMENT
--header-height-desktop: PENDING_MEASUREMENT
--header-height-mobile: PENDING_MEASUREMENT
--gallery-layout: PENDING_SCREENSHOT
--booking-input-height: PENDING_MEASUREMENT
--section-spacing: PENDING_MEASUREMENT
--radius-button: PENDING_MEASUREMENT
--breakpoints: PENDING_BROWSER_TEST
```

**Suggested QA test widths:** 375, 390, 768, 1280, 1440px. These are *test points*, not claimed original CSS breakpoints.

## 7) UI state & interaction checklist

- Header menu: default, open, active, dismissal, mobile.
- Languages/currency: open/closed, selected state, keyboard focus.
- Gallery: unopened, open, previous, next, keyboard escape, count if present.
- Booking: calendar open, date range valid/invalid, loading, results/empty/error.
- Rooms: initial and network states.
- Review: invalid and valid inputs, selected rating, successful send.
- Contact: invalid and valid inputs, loading, success and failure.
- RTL: all of the above tested in Arabic.

## 8) Responsiveness

- Match the source at captured viewport sizes; do not impose redesign-based breakpoints.
- Keep content order, image crop intent, reading sequence and booking reachability.
- Use a single semantic H1, logical heading order, keyboard/touch controls and correct focus management.
- Support `prefers-reduced-motion` in non-essential motion.

## 9) Performance & SEO targets (proposed, not source test results)

- Core Web Vitals target: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 for suitable real-user datasets.
- Avoid downloading full-quality 100+ images before needed; preserve aspect ratio and reserve space.
- Correct H1, `lang`/`dir`, canonical, `hreflang` for EN/AR, descriptive image alt and valid Hotel structured data using verified facts.

## 10) Approval matrix

| Change | Allowed automatically? | Rationale |
|---|---|---|
| Fix form accessibility, keyboard focus and typo | Yes, with visual parity | Low visual impact |
| Improve image loading/compression | Yes, no visible crop change | Performance |
| Add loading/error/empty states in existing UI | Yes, source-compatible | Functional |
| Replace network-owned logos, cross-hotel ads and network copyright | Yes, hotel-owned equivalent approved | Ownership scope |
| Change overall font palette, typography, spacing substantially | **No** | Affects fidelity |
| Move major sections, gallery layout or booking position | **No** | Changes site structure |
| Add animation hero, new booking flow, chatbot, new room pages | **No** | Out of scope |

## 11) Open decisions & missing evidence

**Must resolve before claiming pixel-perfect parity:**

1. Full-page screenshots of EN/AR at desktop/tablet/mobile.
2. Measured header CSS, colors, typography, container and spacing values.
3. Responsive menu, photo gallery and datepicker screenshots/states.
4. Map actual behavior and coordinates.
5. Booking result and payment/confirmation UX, including backend ownership.
6. Authorized logo set and original hotel photos usage rights.
7. Hotel validation of the 40-room claim, actual policies, facility list, and location distances.
8. Live contact/review endpoints and privacy/storage policy.

## 12) Implementation phases & done criteria

**Phase 1 — Reference Lock (now):** page inventory + browser captures + tokens + approval. *Structure documented; visual pending.*

**Phase 2 — Foundation:** init app, set locale routing, source-derived tokens, image management, typed data, CI.

**Phase 3 — Desktop parity:** build top-to-bottom components, capture and compare at 1440/1280px.

**Phase 4 — Mobile parity:** compare at 390/375/768px, complete RTL.

**Phase 5 — Interactions:** lightbox, forms, booking search, error/loading states. No false booking confirmations.

**Phase 6 — QA/release readiness:** visual regression, WCAG checks, responsive checks, SEO, performance, content validation, user sign-off before deploy.

### Definition of Done — Reference Lock

- Approved screenshot baselines for EN/AR at representative sizes.
- Computed layout/typography/color token spreadsheet or JSON from real DOM.
- Every section mapped to component with confirmed order and visual behavior.
- All uncertain interactions listed and clarified, particularly booking.
- Design change control approved (no redesign).

---

*Evidence notes: live indexed page consulted on 2026-11-17 at `/en/` and `/ar/`. Machine-readable content lives in `CONTENT_AND_REFERENCE_INVENTORY.json`. Screenshots were unavailable from the current headless environment; this document intentionally marks all unknown CSS/visual measurements as pending.*
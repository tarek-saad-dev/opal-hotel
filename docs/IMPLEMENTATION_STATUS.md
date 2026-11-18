# Opal Legacy — implementation status

Date: 2026-11-17

## Completed in repository
- Documentation and business-approved high-fidelity Reference Lock specification.
- Next.js 16 + React + TypeScript source structure for `/en` and `/ar`.
- Provisional responsive CSS, header, galleries, overview, facilities, location, rooms, review and contact sections.
- Interactive photo lightbox (escape and arrow keys), mobile menu and booking date-range validation.
- Reference image URL manifest for UI prototyping.
- CI workflow that attempts TypeScript and Next.js build on GitHub Actions.

## Not yet complete / NOT claimed
- Live reference screenshot and computed-style capture (current execution environment cannot access external host directly).
- Pixel-by-pixel visual match, exact font and design tokens, real room cards, mobile interaction tests.
- Booking inventory, pricing, reservation confirmation, payment and transactional emails.
- Contact form and review submission backends: UI does not claim to send data.
- Brand/photo redistribution permissions, hotel-owned logo and image assets.
- SEO production readiness: public indexing intentionally disabled.
- Production deployment.

## Local development
```bash
npm install
npm run dev
# http://localhost:3000/en
# http://localhost:3000/ar
npm run typecheck
npm run build
npm test
```

## Reference capture
```bash
cd docs/reference-lock/capture
npm install
npx playwright install chromium
npm run capture
```
Review output for failed captures, layout differences and image licensing before importing any reference photos into production.

## Development constraints
- All visuals are a provisional implementation, not the exact measured original CSS.
- Keep the approved original page section order.
- No real reservation booking is activated.
- Do not copy third-party network identity/ownership details into hotel branding.
- Confirm actual review policies, opening times and distances with management.

## QA evidence (2026-11-17)
- GitHub PR #1 Frontend CI passed source tests, TypeScript and Next.js production build on commit `04f0cd7888935405f121c2b15157e5af3697e399`.
- Reference Capture ran but **returned a rate-limit response** from the third-party hotel site (body: `Rate limit exceeded`; 0 images, 0 headings). Its original green status was a false positive.
- Validity checks have been added to prevent blocked pages from being recorded as reference screenshots.
- Automatic requests to the restricted reference site have been disabled. Reference capture is now manual-only and defaults to smoke mode; do not repeatedly request this origin.
- Pixel-accurate alignment remains blocked until owner-supplied screenshots or authorized capture is available.


## Premium frontend direction — approved 2026-11-17
Owner updated visual scope: **professional boutique luxury site inspired by, but not constrained to, the original UI**. All heavy business data and backend functionality deferred.

Branch `feat/premium-editorial-frontend` introduces:
- New bilingual premium navigation, immersive editorial hero, calm photo transitions and responsive mobile menu;
- Refined type/cream/forest/sand design tokens and more polished underlying sections;
- Floating reservation panel with UI date validation + demo guest selector (no server bookings);
- Clearly labelled illustrative photo placeholders and a resilient architectural fallback.

Quality gate: GitHub Actions build/typecheck/tests + EN/AR desktop/tablet/mobile screenshots before merging. Production assets and booking are still pending.


## Premium UI phase 2 — 2026-11-17
- Built a new editorial storytelling layout, compact amenities highlights with expandable full lists, refined location, concept-only rooms and an interactive filtered gallery.
- Continued EN/AR RTL support, responsive layouts at 1440/768/390 and full-photo/section screenshot QA.
- Room concepts and photographs are **illustrative only** and are not actual Opal Legacy inventory. No prices or booking confirmation.
- This update has no backend, payment, inquiry delivery or deployment changes. It must be built and redeployed on the VPS after merge if the production URL is already active.
- Outstanding: official property photos and logo, full content verification, final visual refinements and production web integration.


## Premium UI phase 3 — guest journal, contact and footer (2026-11-17)
- Redesigned the bottom of the one-page website to match the established Heritage Luxury × Modern Editorial styling.
- Replaced generic review/contact forms with bilingual, keyboard-friendly, deliberately non-sending **visual previews**.
- Review preview provides a real interactive 1–10 rating control, visitor name, visit month and memory note; it does not store or publish reviews.
- Contact preview offers basic fields, visible non-delivery explanation, known location and a map link; no messages are delivered and no contact database was introduced.
- New deep-green editorial footer with clear section navigation, language switch, map and back-to-top action.
- One-time, subtle IntersectionObserver entrance motion for closing sections. Content remains visible with JS disabled; animations are disabled for reduced-motion preferences.
- Extend Playwright screenshots for reviews/contact/footer and verify rating, forms and footer interactions in EN/AR across 1440/768/390.
- Real hotel photos, logo, verified contact details and functional integrations remain open; frontend-only update is not an automatic VPS deployment.


## Final Visual Polish & Asset Handoff — 2026-11-17
- Consolidated hero scenes and the full gallery into one reference manifest in `src/lib/gallery.ts`; official logo path is optional (currently unset; temporary typographic O remains).
- Added responsive `srcSet` downloads for concept photography and preconnect hints, without guessing optimized file names for future owner-supplied photos.
- Improved accessible navigation: skip-to-content, visible current-section marker, focus handling for the full-screen mobile menu and gallery lightbox, and focus return on close.
- Added a small mobile-only booking-preview shortcut while scrolling, hidden at the actual booking panel and footer. Booking remains **UI-only**.
- Expanded visual smoke QA to 320/390/768/1440px in both languages, with mobile menu/keyboard focus, lightbox focus return, responsive images and booking dock checks.
- The user-approved site images and official logo are **not available yet**. Exact owner-asset handoff and release checks are in `docs/HOTEL_MEDIA_HANDOFF.md`. Do not remove the preview disclaimer until official photos and verified content are approved.
- Production site update is NOT automatic after merge; run the existing VPS script manually from the server.

## Mobile Navigation reliability — 2026-11-17
- Found a concrete full-screen menu layout hazard: the fixed navigation panel was nested inside the sticky header, which acquires `backdrop-filter` whenever the menu opens. A filtered ancestor establishes a containing block for fixed descendants, so the mobile drawer may be clipped to header dimensions and fail to cover the screen on some browsers.
- Moved the menu to a React portal mounted directly under `document.body` with an explicit viewport-sized design (`100dvh`), dedicated close button, and separate scrollable content.
- Added an iOS-friendly background scroll lock that restores previous scroll position when closed; menu supports safe-area insets and landscape/short-height screens.
- Preserved active-section styling and improved Arabic RTL semantics in the portaled overlay, including readable typography and back/forward navigation.
- Verified target behavior includes open/close/ESC, restored focus, menu navigation to an actual section, booking-preview link, no behind-menu scrolling, and full viewport geometry at 320/390/768 px.
- Automated visual workflow now captures open-menu screenshots and explicitly checks portal position/geometry rather than merely checking the modal is visible.
- Frontend-only; no production deployment or backend changes. User updates production VPS via the existing `ops/deploy-vps.sh` command after merge.

## Rooms Experience V2 — 2026-11-18
- Created fully navigable bilingual room **concept** routes: `/en/rooms`, `/ar/rooms` and per-design-story routes `/{locale}/rooms/{slug}`.
- Three design stories are centralized in `src/lib/room-concepts.ts`; these are editorial mood boards **not confirmed hotel rooms**, and there is no capacity, pricing or availability claim.
- Added room catalogue with premium visual cards, an immersive room-detail layout, thumbnail switching, keyboard-supported photo viewer, related concept navigation, language preservation on detail routes, and navigation back to the homepage.
- Home page room cards now link to corresponding detail concept pages while keeping the existing image lightbox.
- Room details are marked noindex and retain a clear disclaimer before booking UI integration.
- The new `src/app/rooms-experience.css` stylesheet is responsive and RTL-aware.
- Visual preview QA now visits the listing and details in both EN/AR at 1440/768/390/320px, checks URL navigation, gallery actions, lightbox focus, missing inventory guard and overflow, and exports screenshots.
- Official room photographs, approved inventory names, occupancy, verified room-specific amenities, room IDs, rates, booking data integration and ownership approval remain prerequisites for any real room availability.
- No backend or live booking changed; deploying a merged commit still requires the existing VPS deployment script.

## Booking UI V2 — 2026-11-18
- Added a branded, fully responsive bilingual **3-stage design-preview booking journey** at `/{locale}/booking`, with all states client-side and no real reservation API.
- Stage 1 collects only preview check-in/check-out dates and adult/child counts. Dates are validated client-side and the selected values flow from the homepage through safe, non-personal query parameters.
- Stage 2 lets users choose one of three clearly **illustrative concept stories**, never actual room inventory. Concept detail pages may pass their slug into the preview, but no price, room capacity or real availability is shown.
- Stage 3 is an honest summary of the preview with editing paths. **No booking confirmation, reference number, payment, guest PII or form submission** occurs. There is no real booking CTA until an approved backend is connected.
- Refined an editorial split-layout on desktop and accessible stacked mobile experience; RTL Arabic, EN, responsive 320/390/768/1440px, reduced-motion and keyboard/focus interactions.
- New route is `noindex`. Home booking form now navigates into preview preserving selected check-in/check-out and guest counts; room pages link to preview as well.
- Added `src/lib/booking-preview.ts` for bounded/sanitized query parameters, robust date math and bilingual labels.
- Browser QA covers homepage handoff, stage progression, guest counter, room selection, review, edit/back action, non-booking disclosure, no overflow, and real screenshots for each stage on 8 locale/device combinations.
- Go-live gates: hotel-owned room photos, actual inventory and capacity, approved pricing and conditions, availability source, booking API, customer data consent/security, and payment/confirmation flows after separate approval. None are claimed in this phase.
- No automatic VPS deployment. Merge only after CI + browser QA; user runs the existing VPS deploy script when ready.

## Frontend Release Readiness V1 — 2026-11-18
- Optimized App Router stylesheet loading: `rooms-experience.css` is now imported only by `/{locale}/rooms/**`; `booking-experience.css` only by `/{locale}/booking`. Shared homepage room-card link styles were moved into `premium-sections.css` to avoid homepage regressions.
- Introduced a reduced-motion-safe route transition through `src/app/[locale]/template.tsx` and `src/app/route-polish.css`.
- Added bilingual, luxury-themed route loading skeleton (`loading.tsx`), error retry fallback (`error.tsx`) and page-not-found recovery (`not-found.tsx`) for missing room concepts or invalid pages.
- Added `LocaleDocumentSync`: sets top-level HTML `lang`/`dir` after hydration/cross-locale client navigation, while `[locale]/layout.tsx` still provides server-side localized wrapper semantics. The initial no-JS root HTML still declares English pending a separate root-layout refactor.
- Extended browser QA across EN/AR at 320/390/768/1440 px to assert top-level document language/direction, actual 404 HTTP response, localized recovery actions and overflow-free fallback pages. Existing rooms/booking/hero functional QA remains intact.
- No real booking, payment, availability or content assertions added. This is a reliability + UI performance pass; hotel-owned media and verified hotel details remain blockers to public indexed launch.
- VPS is not automatically deployed by GitHub merge; deploy the approved main branch on the VPS using `ops/deploy-vps.sh`.

## Official Media and Brand Activation Gate — 2026-11-18

- `src/config/hotel-media.json` is the single reviewable source of truth for the six owned property photographs, official logo, localized image descriptions, and documented rights/content approval. It defaults to `mode: preview`; no owner-supplied assets are assumed to exist.
- The display manifest in `src/lib/gallery.ts` activates the actual official image set *atomically*, only after complete photo, logo, content and rights sign-offs. Partial uploads continue to display clearly labelled demo imagery; no mixture can silently appear.
- Hero, story, gallery, room catalogue, room details and booking preview now use bilingual image alt text and verified-vs-design photo provenance markers, with labels that update only after full official activation.
- `scripts/verify-official-media.mjs` checks safe local paths, file types, actual image headers, dimensions, size budget and approval fields; CI runs `npm run media:check`. The separate `npm run media:launch-check` intentionally blocks while photo/logo/license/content approval is pending.
- Documentation lives in `docs/HOTEL_MEDIA_HANDOFF.md` and `public/media/hotel/README.md`, including privacy-safe instructions and handoff roles. No unauthorized hotel logo or property photograph has been created or uploaded.
- All website robots remain noindex. Room inventory, rates, live availability, booking and contact delivery remain preview-only regardless of whether actual hotel imagery is eventually approved. A separate management go-live decision is still required.

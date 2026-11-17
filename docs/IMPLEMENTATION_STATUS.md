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

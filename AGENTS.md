# Opal Poolside — Repository Instructions

## Official brand (owner decision, 2026-11-28)
Use **Opal Poolside** / **OPAL POOLSIDE** / **أوبال بول سايد** consistently in all public and admin surfaces, SEO, translations and CMS content. The former name is retired; historical reference URLs and migration fixtures may retain it.

## CURRENT APPROVED DESIGN DIRECTION (updated 2026-11-17)
The owner has approved **Premium Frontend First**: a luxury/boutique hotel website inspired by Opal Poolside's original visuals, **not a literal replica**. Implement **Heritage Luxury × Modern Editorial**; add restrained premium refinements while retaining the hotel's character and recognizable reference content. Heavy content, real booking and backend features are deferred.

Read `docs/PREMIUM_UI_DIRECTION.md` for tokens, component scope and acceptance.

## Owner decision — production content (2026-11-20)
The owner asked to remove every "preview / illustrative / not enabled" message from the public site and to use the hotel's real information.
- Facts come from the hotel listing (opal-legacy.luxor-hotels-eg.com), rewritten in our own words, in `src/lib/hotel-content.ts`.
- No stock photography. Until the hotel's own photos are uploaded through the CMS, photo slots show a neutral brand panel (`/media/brand-panel.svg`, decorative, empty alt) and the gallery section is hidden.
- Forms (booking request, contact, review) post to the backend API (`src/lib/api-client.ts`, contract in `docs/BACKEND_API.md`). They show success only on a 2xx response and an honest error otherwise. A booking request is not a confirmed reservation and the UI says so.
- This supersedes the earlier "label illustrative imagery / forms must say they are not sent" rules below.

## Design and code rules
- Optimize first for excellent visual craft on desktop, tablet and mobile (EN + AR RTL).
- The previous `docs/reference-lock` inventory remains a *historical reference*, not the binding visual mandate after this new decision.
- Avoid heavy external UI libraries, repetitive card designs, generic gradients and flashy animation.
- Make photography the centerpiece; use clearly labelled illustrative imagery until the hotel owner supplies licensed photos and official logo. Never claim demo photos depict Opal Poolside.
- Treat CSS values as proposed design tokens, not measurements from the former website.
- Preserve functional accessibility (keyboard, aria labels, reduced motion, readable contrast).
- Booking selects dates and party size for visual demonstration only: **no live rates, inventory, confirmation or payments**. Contact/review forms must never claim messages were sent.
- Do not deploy or enable search indexing until authorized site assets, real details and integration are approved.

## Quality
Before merging changes, run or verify GitHub CI: `npm test`, `npm run typecheck`, `npm run build`, and `Frontend Visual Preview`. Inspect EN/AR 1440/768/390 screenshots for overflow and obvious defects; fix failures and report any unresolved limitations.

## Documents
- `docs/PREMIUM_UI_DIRECTION.md` — current creative direction and scope.
- `docs/IMPLEMENTATION_STATUS.md` — current implementation status.
- `docs/reference-lock/` — archived original website evidence (not exact design constraint).

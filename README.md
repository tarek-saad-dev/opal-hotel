# Opal Poolside Hotel — Frontend

A premium, visual-first Next.js frontend concept for Opal Poolside Luxor Hotel.

> **Approved design direction (updated 2026-11-17):** Heritage Luxury × Modern Editorial, inspired by the original hotel's atmosphere, with substantial UI refinement. This is a frontend concept, not a live booking system.

## Approved creative direction\n- [Premium UI art direction, tokens and scope](docs/PREMIUM_UI_DIRECTION.md)\n\n## Historic reference
- English: https://opal-legacy.luxor-hotels-eg.com/en/
- Arabic: https://opal-legacy.luxor-hotels-eg.com/ar/
- [Reference Lock documents](docs/reference-lock/README.md)
- [Frontend Master Specification](docs/reference-lock/FRONTEND_MASTER_SPEC_AR.md)
- [Current implementation status and limitations](docs/IMPLEMENTATION_STATUS.md)

## Direct production hosting on VPS

The project can be served from the existing Ubuntu VPS as a **single isolated production deployment**: Next.js + systemd + Nginx, no staging environment and no database. See [one-command deployment instructions](ops/README.md). A real owned domain and access to the VPS root shell are required; GitHub source changes alone do not publish the site.

## Run locally

Prerequisite: Node.js 22+ and npm.

```bash
npm install
npm run dev
# http://localhost:3000/en
# http://localhost:3000/ar
```

## Checks

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions runs the checks on `main` and pull requests. Build results must be confirmed before merging new features.

## Implemented in prototype
- EN/AR pages, LTR/RTL wrapper and responsive layout.
- Hotel identity, menu, temporary gallery/lightbox, booking date validation.
- Overview, grouped facilities, location/map reference, rooms empty state.
- Reviews and contact form UI with explicit unsent/error state.

## Important: not live / not production ready
- **Bookings, prices, room availability, contacts and review submissions are not connected to a server.**
- **Current design photos are illustrative Unsplash placeholders, not Opal Poolside's actual photographs.** Replace with owner-authorized, locally hosted hotel photos before production.
- Photos, hotel facts, currency support, services and check-in policies need hotel verification.
- Current CSS values are **provisional**; complete visual lock requires real browser capture.
- Search-engine indexing is disabled in this prototype.
- The production-hosting installer is prepared, but the app is not live until run on the VPS with the intended domain and HTTPS configured.

## Browser reference capture

```bash
cd docs/reference-lock/capture
npm install
npx playwright install chromium
npm run capture
```

The remote reference site rate-limited the GitHub runner on 2026-11-17. Capture is **manual-only** to avoid repeated requests. The validator rejects rate-limited screenshots; prefer owner-supplied screenshots or authorized browser capture.

Inspect `docs/reference-lock/capture/output/` (ignored by Git) and review valid screenshots/DOM measurements before approving a pixel-perfect style baseline.

## Workflow
Document each visual decision; do not redesign the approved reference without explicit approval.


## Visual polish and hotel assets

- [Official photo/logo handoff checklist](docs/HOTEL_MEDIA_HANDOFF.md) — images are still illustrative; the hotel must approve authentic media.
- The Hero, gallery and footer/nav branding share the centralized manifest in `src/lib/gallery.ts`.
- Accessibility refinements include skip-to-content, keyboard-friendly overlays, an active-section nav indicator and a mobile stay-preview shortcut.
- Full visual QA checks 320, 390, 768 and 1440 px in English and Arabic, including interactive controls.
- After each merge, production on the VPS must be updated by running `ops/deploy-vps.sh` from the VPS shell. GitHub changes do not automatically restart the server.

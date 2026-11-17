# Opal Legacy Hotel — Frontend

A reference-led Next.js frontend for Opal Legacy Luxor Hotel.

> **Approved design direction:** high-fidelity replication of the current hotel listing with only small professional improvements. This is an early prototype, not a verified pixel match or a live booking system.

## Reference
- English: https://opal-legacy.luxor-hotels-eg.com/en/
- Arabic: https://opal-legacy.luxor-hotels-eg.com/ar/
- [Reference Lock documents](docs/reference-lock/README.md)
- [Frontend Master Specification](docs/reference-lock/FRONTEND_MASTER_SPEC_AR.md)
- [Current implementation status and limitations](docs/IMPLEMENTATION_STATUS.md)

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
- **Reference photos are remote temporary URLs from a third-party listing**; replace with owner-authorized, locally hosted images before production.
- Photos, hotel facts, currency support, services and check-in policies need hotel verification.
- Current CSS values are **provisional**; complete visual lock requires real browser capture.
- Search-engine indexing is disabled in this prototype.
- No preview deployment configured.

## Browser reference capture

```bash
cd docs/reference-lock/capture
npm install
npx playwright install chromium
npm run capture
```

Inspect `docs/reference-lock/capture/output/` (ignored by Git) and review screenshots/DOM measurements before approving a pixel-perfect style baseline.

## Workflow
Document each visual decision; do not redesign the approved reference without explicit approval.

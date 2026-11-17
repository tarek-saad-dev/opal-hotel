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

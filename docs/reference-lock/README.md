# OPAL LEGACY — Reference Lock v1.0

**Decision:** High-fidelity replication of the existing Opal Legacy website, with only small, approved professional improvements. No unsolicited redesign.

**Reference:** https://opal-legacy.luxor-hotels-eg.com/en/  
**Arabic reference:** https://opal-legacy.luxor-hotels-eg.com/ar/  
**Prepared:** 2026-11-17

## Current gate status

- **Structure & content baseline: DOCUMENTED** — source page examined through indexed live text, links, and a reference photo.
- **Pixel-accurate visual lock: PENDING** — the reference site could not be fetched from the available headless browser environment (DNS/network restricted). No screenshots, computed CSS, breakpoints, DOM node dimensions, or interactive booking test are falsely claimed.
- **Owner content validation: PENDING** — policies, distances, rooms count, facility names, and booking capabilities need hotel confirmation.
- **Implementation handoff: READY FOR FOUNDATION WORK**, but visual-critical elements are subject to the pending screenshot lock.

## Package contents

1. `FRONTEND_MASTER_SPEC_AR.md` — detailed, implementable specifications in Arabic.
2. `CONTENT_AND_REFERENCE_INVENTORY.json` — machine-readable content, component and question inventory.
3. `VISUAL_QA_CHECKLIST.md` — screenshot matrix, comparison checks, and acceptance gates.
4. `capture/opal-capture.mjs` — a Playwright capture/audit script for use on a machine that can reach the website.
5. `capture/package.json` — Node script package.
6. `reference/REFERENCE_LINKS.md` — known source URLs and source limitations.

## Capture instructions (on a machine with live website access)

```bash
cd capture
npm install
npx playwright install chromium
npm run capture
```

Captured images and DOM measurements will be written to `capture/output/`.

The screenshot capture does **not** submit the booking, contact, or review forms; it only records pages and non-destructive visible UI states.

## Scope principles

- Match existing hierarchy, density, whitespace, imagery and order before polishing.
- Keep old site copy and third-party network chrome distinguishable; replace external network branding with Opal's own authorized branding.
- Do not rehost original images without confirming usage rights.
- Require explicit approval for any change larger than visual cleanup or accessibility fixes.
- No fake room availability, fabricated prices or reviews.

## How to complete the lock

1. Execute capture script successfully on desktop-capable machine with internet.
2. Validate `capture/output/**/{full.png,dom-audit.json,header.png,menu-open.png}` for both locales and all sizes.
3. Record actual font names, hex color values, sizes, image positioning, spacing, header behavior and navigation drawer states in `VISUAL_QA_CHECKLIST.md`.
4. Approve reference screenshots as immutable source-of-truth for implementation.
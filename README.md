# Opal Legacy Hotel — Frontend

Official project repository for the new Opal Legacy Hotel website.

## Approved direction
**High-fidelity replication** of the existing website, with small professional improvements only. Keep the reference layout, section order, content hierarchy, galleries, and booking presentation. Do not redesign without explicit approval.

- Reference (EN): https://opal-legacy.luxor-hotels-eg.com/en/
- Reference (AR): https://opal-legacy.luxor-hotels-eg.com/ar/

## Project documentation
The foundational files live in [docs/reference-lock](docs/reference-lock/README.md):

- [Frontend Master Specification (Arabic)](docs/reference-lock/FRONTEND_MASTER_SPEC_AR.md)
- [Content & Reference Inventory](docs/reference-lock/CONTENT_AND_REFERENCE_INVENTORY.json)
- [Visual Reference & QA Checklist](docs/reference-lock/VISUAL_QA_CHECKLIST.md)
- [Source Links](docs/reference-lock/reference/REFERENCE_LINKS.md)
- [Playwright capture utility](docs/reference-lock/capture/opal-capture.mjs)

## Status (2026-11-17)
- Reference structure and content inventory: **documented**.
- Visual/pixel-accurate lock: **pending live screenshot and CSS capture**.
- Booking integration, production frontend and deployment: **not yet implemented**.
- Hotel-owned content and permissions: **pending confirmation**.

## Workflow
1. Capture the reference on desktop/mobile and in English/Arabic.
2. Approve the precise visual baseline before changing visual-critical components.
3. Implement components against the approved spec; retain source/design decisions.
4. Run visual regression, functional and accessibility checks.
5. Add only approved improvements.

**No production booking or hotel data is implied by this documentation.**

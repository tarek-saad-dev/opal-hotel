# Opal Legacy — Repository Rules

These instructions apply to all future changes in this repository.

## Product decision (approved 2026-11-17)
Rebuild the Opal Legacy hotel website as a **high-fidelity replication** of the existing site, with only small, approved professional improvements. **Do not redesign it** or introduce a new visual language without owner approval.

Reference: https://opal-legacy.luxor-hotels-eg.com/en/

## Source of truth
1. `docs/reference-lock/README.md` — evidence status and capture instructions.
2. `docs/reference-lock/FRONTEND_MASTER_SPEC_AR.md` — component and interaction requirements.
3. `docs/reference-lock/CONTENT_AND_REFERENCE_INVENTORY.json` — documented structure and provisional source content.
4. `docs/reference-lock/VISUAL_QA_CHECKLIST.md` — visual acceptance criteria.
5. Screenshots and computed styles from the capture toolkit, **only after they are successfully generated and reviewed**.

## Non-negotiables
- Keep the reference section order, visual hierarchy, image experience, booking presentation, responsive behavior, and content density.
- No broad UI rewrites, decorative additions, or replacing the design system with an unrelated component library.
- Visual tokens (font, color, spacing, breakpoints) are **TBD**, not confirmed originals, until actual browser measurement.
- Keep changes to the existing reference strictly separated from proposed improvements; seek approval for each material change.
- Build EN + AR support, including RTL where appropriate.
- Do not publish made-up rates, availability, room inventory, policies, reviews, or contact data.
- Do not treat third-party hotel-network branding or assets as owned by Opal. Validate photo/brand usage rights.
- Never expose credentials or integrate a live payment/booking workflow without a real approved backend.

## Implementation workflow
1. Read the reference-lock docs before UI work.
2. Capture real screenshots/DOM measurements from EN/AR for desktop, tablet, and mobile; record unresolved states.
3. Implement components incrementally and compare against approved screenshots at matched viewport widths.
4. Test accessibility, keyboard navigation, responsive overflow, loading/error states, and form validation.
5. Report what changed, what remains unverified, and whether the visual baseline was preserved.

## Development state
This repository starts as a **documentation-only foundation**. No application or booking integration should be claimed as complete merely because these reference files exist.

# Opal Legacy — Repository Rules

## Approved direction (2026-11-17)
Build a high-fidelity replication of the existing Opal Legacy hotel website with **small, approved professional improvements only**. Never substitute an unrelated design or rearrange reference sections without approval.

## Reference documentation
- `docs/reference-lock/README.md`
- `docs/reference-lock/FRONTEND_MASTER_SPEC_AR.md`
- `docs/reference-lock/CONTENT_AND_REFERENCE_INVENTORY.json`
- `docs/reference-lock/VISUAL_QA_CHECKLIST.md`
- `docs/IMPLEMENTATION_STATUS.md`

## Non-negotiables
- Preserve the page sequence: identity, gallery, reservation, overview, facilities, location, availability, full gallery, reviews, contact, footer.
- The current CSS is provisional. Verify computed styles and visual reference shots before claiming exact fidelity.
- Real inventory, payment, contact delivery, and review submission are **not implemented**. Never simulate success.
- Ensure accessible keyboard/touch interactions and EN/AR language support.
- Do not publish fabricated prices, availability, reviews, policies, business details or unauthorized images/branding.
- Replace external reference photos with hotel-authorized local assets before publication.
- No production launch or SEO indexing before approved content, domain, and real booking backend are ready.

## Process
1. Audit reference browser output for desktop/mobile/RTL.
2. Make one scoped visual/component change at a time and compare against approved screenshots.
3. Run `npm test`, `npm run typecheck`, `npm run build` (and browser tests when tooling is available).
4. Record any unverified facts or incomplete integrations in `docs/IMPLEMENTATION_STATUS.md`.
5. Ask for explicit approval before any material redesign or booking activation.

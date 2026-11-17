# Opal Legacy — Repository Instructions

## CURRENT APPROVED DESIGN DIRECTION (updated 2026-11-17)
The owner has approved **Premium Frontend First**: a luxury/boutique hotel website inspired by Opal Legacy's original visuals, **not a literal replica**. Implement **Heritage Luxury × Modern Editorial**; add restrained premium refinements while retaining the hotel's character and recognizable reference content. Heavy content, real booking and backend features are deferred.

Read `docs/PREMIUM_UI_DIRECTION.md` for tokens, component scope and acceptance.

## Design and code rules
- Optimize first for excellent visual craft on desktop, tablet and mobile (EN + AR RTL).
- The previous `docs/reference-lock` inventory remains a *historical reference*, not the binding visual mandate after this new decision.
- Avoid heavy external UI libraries, repetitive card designs, generic gradients and flashy animation.
- Make photography the centerpiece; use clearly labelled illustrative imagery until the hotel owner supplies licensed photos and official logo. Never claim demo photos depict Opal Legacy.
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

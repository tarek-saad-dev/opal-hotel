# OPAL LEGACY — Premium Frontend Direction
**Approved:** 17 November 2026
**Stage:** Visual-first UI development / no production launch

## Design decision
- The former Opal Legacy listing is **inspiration for the hotel's visual identity and content structure**, not a pixel-perfect source to clone.
- The intended look is **Heritage Luxury × Modern Editorial**: warm Egyptian architectural character, generous whitespace, refined serif typography, mineral/earthy colors and restrained movement.
- Deliver a highly polished **desktop AND mobile** first. Heavy business content, booking inventory, payment, reviews management, customer accounts and backend features are **deferred**.
- Existing pages and interactive demos must not imply functional checkout or successful submission.

## First implemented design system (proposed visual direction)
| Token | Value | Meaning |
| --- | --- | --- |
| Deep Forest | `#162922` | Header / footer / brand depth |
| Forest | `#29463E` | Primary actions |
| Porcelain Cream | `#FAF8F2` | Main page |
| Soft Stone | `#F3F0E8` | Secondary surfaces |
| Sand | `#D1BB9C` | Decorative accents |
| Champagne | `#E7D3B6` | Luxurious warmth |
| Ink | `#28352F` | Body text |
| Editorial type | Cormorant Garamond, Georgia fallback | EN display |
| UI type | DM Sans, Helvetica fallback | EN body |
| RTL | Cairo, Tahoma fallback | Arabic |

These are **creative proposal tokens**, not measured original CSS. Use CSS custom properties for future adjustment.

## Phase 1 UI scope
1. Transparent-to-solid header, typographic wordmark (temporary until official logo is supplied), desktop navigation, responsive full-screen mobile navigation.
2. Full-bleed cinematic hero with elegant overlaid heading, scene arrows, gallery shortcut, story CTA, scroll cue, and subdued transitions respecting reduced-motion.
3. Elevated booking bar with real date inputs, check-in/check-out constraints, demo guest counter, keyboard-accessible controls and a non-deceptive preview-only state.
4. EN/AR layout and RTL consideration for masthead and booking.
5. Continue to show the established overview, facilities, gallery, location, rooms and forms below the masthead, with refined typography/surfaces. Refinement of those sections is a later pass.

## Images
- Current hero and gallery photos from Unsplash are **illustrative concept photography — not Opal Legacy photos**.
- The live UI explicitly displays an illustrative photo disclaimer.
- Do **not** confuse third-party booking pages with hotel ownership, redistribute their material or present illustrative room images as actual inventory.
- Before publication, replace with licensed/owner-approved, locally served hotel photos and the official logo.
- If network images fail, hero shows an editorial arch artwork fallback; image gallery shows a local neutral placeholder.

## Functional intent
- Scene next/prev and photo lightbox work.
- Mobile menu opens/closes; Escape closes overlays.
- Date inputs enforce checkout after check-in; guests count controls operate (1–10 adults, 0–10 children).
- Booking CTA **only** jumps to existing rooms preview/notice. No request goes to a reservation backend.
- No payments, reviews or contact submissions are sent to external services.

## Acceptance criteria
- `npm test`, `npm run typecheck`, and `npm run build` all pass.
- Browser screenshots checked at 1440, 768, 390px in EN/AR.
- No horizontal overflow, no JS page errors, navigable CTA/menu/guest dropdown, accessible labels.
- Recheck with approved photos on actual mobile Safari and Chrome before launch.
- No deploy or production booking activation in this phase.

## Next design pass
- Bespoke editorial room cards and gallery grid using approved actual hotel photos.
- Typography, micro-motion and section transition polish.
- Footer/contact language, accessibility, SEO after real content arrives.

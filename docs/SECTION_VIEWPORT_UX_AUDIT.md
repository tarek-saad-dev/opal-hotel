# Opal Legacy — Per-section Viewport UX Audit (V3)

## Design rule
**Not every section should equal 100vh.** The cinematic hero should be at least one visible viewport, with room to grow if text wraps. The gallery, room catalogue, amenities, contact form and booking steps should be **content-height** so they never clip owner-managed media or Arabic text.

- Use `svh` minimums for viewport-scale editorial compositions.
- Never enforce fixed `height:100vh` on CMS-heavy and interactive sections. Real content may grow naturally.
- Do not add scroll snapping or horizontal scrolling. Preserve image aspect ratios.
- Test 1440×900, 1440×650, 768×1024, 390×844, 320×640 in Arabic and English.

## Homepage — EN/AR

| Section | Desktop | Mobile | UX goal |
|---|---|---|---|
| Hero photo / video | At least 100svh | At least 100svh | Immersive first screen, grows if titles or CTA wrap |
| Booking ribbon | Compact, overlaps Hero | Compact, stacked naturally | Booking controls are visible, not a separate forced screen |
| Overview | ~100svh minimum when wide | Content height | Real large+inset photos and story |
| Facilities | Content height | Content height | Cards and expandable amenities may exceed screen |
| Location | ~93svh minimum | Content height | Balanced image, nearby attractions and address |
| Rooms | Content height | Content height | Three room choices, images and CTA |
| Gallery | Content height | Content height | Arbitrary owner photo/video count, filters |
| Reviews | ~94svh minimum | Content height | Editorial copy plus complete review form |
| Contact | ~92svh minimum | Content height | Complete accessible inputs and local details |
| Footer | Content height | Content height | Navigation, legal and trust links |

## Rooms collection — /{locale}/rooms

| Part | Desktop | Mobile/tablet | Rationale |
|---|---|---|---|
| Collection hero | Viewport minus standalone header | Natural copy + 40–43svh photo | Give real hotel imagery prominence without empty scroll |
| Room cards | Content height, 3 columns | Content height, 2 columns tablet / 1 phone | Comparison needs all options visible |
| Status/disclaimer | Compact | Compact | Not a dedicated screen |
| Footer | Compact | Compact | Useful navigation |

## Room details — all three slugs in both languages

Applies to light-and-stillness, quiet-comforts, and slow-mornings.

| Part | Desktop | Mobile/tablet | Rationale |
|---|---|---|---|
| Hero + gallery | ~81svh minimum | Natural content, main photo 44–53svh | Media priority, room title and gallery controls |
| Room story/amenities | Content height | Content height | Long multilingual text |
| Room film (optional) | Content height | Content height | Manual playback, not an autoplay hero |
| Related rooms | Content height | Content height | Cards and links cannot be clipped |
| Disclaimer/footer | Compact | Compact | No artificial screen-length filler |

## Booking preview — /{locale}/booking

| Part | Desktop | Mobile/tablet | Rationale |
|---|---|---|---|
| Introduction | Compact | Compact | Users are starting a task, not viewing a movie |
| Step indicator | Compact | Compact | Keep progress clear |
| Booking form/cards/review | Content height | Content height | Date fields and validation must remain visible |
| Summary | Sticky on taller desktop; natural on short displays | Natural in page flow | No double scrolling or truncated summary |
| Status/footer | Compact | Compact | No unnecessary space |

## Dashboard/admin
The owner dashboard is an application, not a cinematic website page. Its media picker and editors should be content-led, with manageable scrolling within overlays, **not** full-screen sections. This task deliberately does not change CMS data, permissions or asset approval.

## Automated test
`npm run audit:sections` visits six routes (home, room collection, three details, booking) at five sizes in both languages: **60 route/viewport combinations**. It writes measured per-section pixel height and viewport percentage, and checks horizontal overflow and Hero content visibility, under artifacts/frontend-preview/section-rhythm/. The existing screenshot audit still verifies visual quality. Tall sections are not automatically bugs.

Only use a **local** test server with isolated CMS data. Deploy to VPS after a successful review; no live data changes are needed.

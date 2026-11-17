# OPAL LEGACY — Visual Reference & QA Checklist

## State / evidence status

- [x] Source pages identified: EN and AR.
- [x] Content and section order logged from live indexed page.
- [x] Key image URL opened and verified as real photo.
- [ ] Full-page browser screenshots captured (not possible from present network-restricted runtime).
- [ ] Real DOM geometry and CSS values extracted.
- [ ] Interactive header/menu/datepicker/lightbox captures.
- [ ] User sign-off on screenshot reference.

## Screenshot matrix

| Locale | Viewport | Full page | Header | Hero | Booking | Facilities | Rooms | Gallery | Review/contact |
|---|---|---|---|---|---|---|---|---|---|
| en | 1440x900 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| en | 1280x800 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| en | 768x1024 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| en | 390x844 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| en | 375x812 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| ar | 1440x900 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| ar | 390x844 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## Measurements to extract per locale/viewport

- [ ] Header height, background, border, sticky/fixed behavior, close/open menu coordinates.
- [ ] Page/root background colors and dominant text colors (hex).
- [ ] Actual font-family/font-weight/font-size/line-height for H1,H2,H3,nav,body,buttons.
- [ ] Main content max-width and left/right margins.
- [ ] Section top/bottom spacing; vertical distance H1 -> gallery -> booking.
- [ ] Hero gallery image count, exact grid template, gaps, aspect ratios, object-position.
- [ ] Full gallery columns and row heights; lightbox typography.
- [ ] Booking widget width, border, background, radius, shadow and button height.
- [ ] Sticky/mobile behavior: when header/menu/booking elements change.
- [ ] Form labels, input height, error messages and focus colors.
- [ ] Footer background/spacing/columns.
- [ ] RTL image order vs reading order (avoid mirror mistakes).

## Interaction cases to record (non-destructive)

- [ ] Menu open/close, dropdown state, language/currency open/close.
- [ ] Gallery open, arrow navigation and close.
- [ ] Check-in calendar open; check-out constraint.
- [ ] Initial Rooms & Availability message and loading state.
- [ ] Booking result state **only on authorized booking test environment**.
- [ ] Review selected rating and validation display (no live submission).
- [ ] Contact validation display (no live submission).
- [ ] Tab/keyboard focus order and ESC dismissal.

## Pixel comparison acceptance

- Compare **same viewport, same locale, same page state, same image set**.
- Section ordering and content matching take precedence.
- Key image crops and gallery composition must match source screenshots.
- No added sections/cards/animations or broader redesign.
- Whitespace, text wrapping and hierarchy tuned from actual measurements.
- Check no horizontal scroll on 375/390px and no broken RTL.
- Review screenshot diffs manually; do not declare a numeric pixel-fidelity score until captured baseline exists.

## Known content-quality issues for confirmation

- [ ] Airport distance in description vs Location list (5 km vs 14 km on EN source).
- [ ] Train distance in description vs Location list (4.3 km vs 4.5 km).
- [ ] Source lists differ between EN/AR attractions.
- [ ] Check-in/check-out policies verify with hotel operations.
- [ ] Hotel stated 40 rooms verify with management.
- [ ] Pets, accessibility, club, public bath, shuttle and other advertised services verify with hotel.
- [ ] Network/affiliate references removed or replaced with authorized hotel info.

## Gate decision

**Can begin:** project foundation, semantic components, localization scaffolding, typed data structure and source-backed content inventory.

**Do not claim complete until screenshot capture:** exact style token freeze, pixel-perfect reproduction, visual sign-off, booking flow parity.
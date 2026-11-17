# Opal Legacy — Official Media Handoff

**Current state (2026-11-17):** Visual-first frontend, currently populated with clearly labelled **illustrative Unsplash concepts**. The real Opal Legacy hotel photos and the official logo have **not** been provided or verified yet. Do not represent the demo photos as actual hotel interiors or inventory.

## One-place update: `src/lib/gallery.ts`

The photo manifest `galleryImages` is the single source for all six concept images used in the room cards, editorial story and gallery. The Hero reads from the **first three photos automatically** through the exported `heroScenes` manifest.

When the hotel provides photos it owns or is licensed to use, upload the files under `public/media/hotel/`, then replace the six `galleryImages[i].src` values with local paths. Use the actual subjects in `alt` and change `origin` from `"design-demo"` to `"third-party-reference"` **only if actually appropriate**; preferably extend the `HotelImage` origin union with `"hotel-approved"` and set that value for verified hotel-owned assets.

| Slot in manifest | Current concept | Suggested verified asset and subject |
| --- | --- | --- |
| `galleryImages[0]` / Hero 01 | illustrative exterior | `/media/hotel/exterior.webp` — real building exterior |
| `galleryImages[1]` / Hero 02 | illustrative pool | `/media/hotel/garden.webp` — actual garden or common space |
| `galleryImages[2]` / Hero 03 | illustrative bedroom | `/media/hotel/room-main.webp` — actual verified guestroom |
| `galleryImages[3]` | illustrative room | `/media/hotel/room-secondary.webp` — real second room angle |
| `galleryImages[4]` | illustrative architecture | `/media/hotel/architecture.webp` — real building details |
| `galleryImages[5]` | illustrative suite | `/media/hotel/room-detail.webp` — real room detail |

If the hotel does not have a pool, do **not** reuse the preview pool imagery. Use authentic garden/courtyard photos instead.

## Recommended dimensions
- Hero/exterior: 1920–2400 px wide, landscape, exported WebP or AVIF, typically 250–700 KB.
- Editorial / room / gallery: around 1200–1600 px wide, WebP/AVIF, typically 120–350 KB.
- Logo: clean SVG (preferred) or transparent PNG/WebP, optimized with owner approval.
- Avoid uploading raw multi-megabyte camera photos. Keep the originals separately.

## The official hotel logo
1. Copy it to e.g. `public/media/hotel/opal-logo.svg`.
2. Set `hotelBrand.officialLogoSrc` in `src/lib/gallery.ts` from `null` to `"/media/hotel/opal-logo.svg"`.
3. The navigation and footer automatically use it while retaining visible `OPAL LEGACY` wordmark text. The current letter O is a temporary editorial placeholder, **not** the official Opal Legacy logo.

## When replacing imagery
1. Verify rights, content accuracy, and that every photo depicts the actual property.
2. Update `src/lib/gallery.ts` with the approved `/media/hotel/...` paths and real `alt` text.
3. Review any *copy* claiming specific guestroom types or facilities with management. Images must not be presented as real booking inventory until supported by the hotel.
4. Replace visual preview disclaimers with accurate text **only after all imagery in the relevant section is real and verified**.
5. Run `npm test && npm run typecheck && npm run build` and the 8-layout browser QA, inspect EN/AR Desktop/Tablet/Mobile screenshots.
6. Merge and run the existing `ops/deploy-vps.sh` on the VPS. Updating GitHub does not deploy automatically.
7. Keep noindex until the hotel approves content and public launch.

## How responsive files work
- The existing Unsplash preview URLs have automatic responsive `srcSet` to reduce load on phones.
- Local images are deliberately **not rewritten into guessed variant filenames**; a single well-compressed WebP/AVIF works without extra infrastructure. Source files are always managed in one manifest.

## No shortcuts
Do not scrape or hotlink a protected third-party listing as a substitute for owner-approved source photos. Never silently replace the logo with an unrelated/generated mark.

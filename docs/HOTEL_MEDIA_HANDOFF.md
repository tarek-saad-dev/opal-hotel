# Opal Legacy — Official Media & Content Handoff

**State as of 18 November 2026: PREVIEW ONLY.** The six display photographs are illustrative third-party design references and the temporary letter **O** is not the official hotel logo. No verified, licensed hotel-owned photos, branding files, room inventory, rates, or management content sign-off have been supplied in this project. Never present illustrative files as if they show the property.

## Source of truth

Edit only **`src/config/hotel-media.json`** to stage authorized media. Don't replace the six Unsplash URLs in `src/lib/gallery.ts` or directly alter the Hero, Rooms, Gallery, or Booking components. They all consume the same validated manifest.

The default mode is **`"preview"`**: the demo gallery, explicit disclosure, and temporary mark remain visible. Staging one or more official images doesn't switch them on. **`"official"`** can activate only when *all six* images, the logo, bilingual descriptions, image rights and factual-content sign-off are complete, and the full preflight passes. There is no mixed official/demo presentation.

| Role | Source path to enter | Real photo to provide |
| --- | --- | --- |
| exterior | `/media/hotel/exterior.webp` | Actual exterior, for Hero 01 |
| garden | `/media/hotel/garden.webp` | Actual property garden, courtyard or common area for Hero 02 |
| roomMain | `/media/hotel/room-main.webp` | Actual, confirmed guest-room photograph for Hero 03 |
| roomSecondary | `/media/hotel/room-secondary.webp` | Another approved guest-room angle |
| architecture | `/media/hotel/architecture.webp` | True architectural detail at this hotel |
| roomDetail | `/media/hotel/room-detail.webp` | True interior/room detail |

**Do not claim a pool if this hotel has none.** A garden, lobby or courtyard photo is preferred, but the `altEn` and `altAr` descriptions must match the actual file. The slot name is a code identifier and is not a factual claim.

The official logo should go at e.g. `public/media/hotel/opal-logo.svg`. Files can live directly inside `public/media/hotel/`; the paths in JSON start at `/media/hotel/` (not `/public`). Use lower-case ASCII filenames. Do not hotlink listing-site photos.

## Files & technical limits

- Photos: real JPEG, PNG or WebP; at least **1100 × 600 px** and at most **1.5 MiB** each. Aim for 1600–2200px wide WebP, visually checked for the mobile and desktop crops.
- Logo: transparent PNG/WebP or a **self-contained, sanitized SVG**; max **350 KiB**. Do not embed remote assets, scripts or tracking.
- `src`: `/media/hotel/...webp` etc. Relative path, no remote URL, data URL or traversal.
- `altEn` and `altAr`: accurate, short descriptions of each *actual* image; no invented room category or amenity.
- `rightsConfirmed`: set true for each slot/logo **only after verifying ownership or explicit license covering website use**.

## Approvals, privacy and content accuracy

The JSON also contains an `approval` object. Fill it *only* after written hotel management sign-off:

- `approvedBy`: non-sensitive **role** such as `"Hotel Management"` (not a private personal name).
- `approvedOn`: valid `YYYY-MM-DD`.
- `licenseEvidence`: **non-sensitive internal reference ID**, not the actual contract, a private link or client data.
- `contentVerified`: true **only** when management has checked the hotel's actual name, address/location, facilities, policies, translated descriptions, operating contact details, photo subjects, room inventory claims and anything externally sourced. Correct those facts in `src/lib/hotel-content.ts` before setting true.

Never commit private contracts, identity documents, guest photos without permission, internal contact lists or unredacted proof-of-license files to this repository. Keep the originals/approval evidence in the hotel's own secure files.

## Validation & activation

1. Put the permitted, optimized photo files and logo under `public/media/hotel/`.
2. Fill the relevant paths, alt text and `rightsConfirmed` fields in `src/config/hotel-media.json` while retaining `"mode": "preview"`.
3. Check the authenticity, rights, names, descriptions, room capacity, amenities and listed policies with the hotel.
4. After sign-off, fill the non-sensitive approval fields and set `"mode": "official"`.
5. Run these commands from the repository root:

```bash
npm run media:check
npm run media:launch-check
npm test
npm run typecheck
npm run build
npm run capture:preview
```

`media:check` checks whatever assets are staged without requiring launch approval; this passes for the current empty preview state. **`media:launch-check` is expected to fail while the owner assets/approval are missing.** The preflight also validates real file signatures, dimensions, size, safe local paths, and that all six slots and logo are present when publishing.

6. Inspect all eight browser QA layouts (EN/AR at 320, 390, 768, 1440 px), especially image crops, labels, layout shifts, text alternatives and that no unavailable room type is advertised.
7. Merge the reviewed PR and **manually** deploy to the isolated Opal VPS service using `ops/deploy-vps.sh`. The other VPS sites are not part of this release.
8. **Do not remove `robots: noindex` automatically.** A public indexed launch is a separate approval decision after verifying contact methods, room facts, policies and hosting/domain readiness.

## Important remaining limitation

The current **Rooms V2 and Booking V2 are visual concepts**, not verified bookable room categories. Even if photographs become hotel-approved, that does **not** make the room names, amenities, capacity, dates, availability, rate quote or reservation forms real. The UI intentionally says no live reservation has been created or sent.

## Troubleshooting

- `Photo roomMain: local file not found`: ensure the asset is actually committed to `public/media/hotel/`.
- `too small` / `exceeds KB target`: export a compressed, sufficiently high-resolution WebP.
- `Missing alt`: write real, useful English and Arabic alternatives.
- `mode is "preview"`: expected until the owner gives written approval and the full media handoff passes.
- Preview still shows the O/Unsplash: the all-or-nothing gate has not been approved; **this is intentional**.

## Room type photo slots (2026-11-20)
The CMS media studio now has one photo slot per room type (cover + gallery),
plus three general "Room photos" slots for the Rooms section strip. The hotel
listing groups its photos per room; their listing photo IDs are kept in
`photoRefs` in `src/lib/room-types.ts` to help match the owner's originals to
the right room. The site never loads photos from the listing.

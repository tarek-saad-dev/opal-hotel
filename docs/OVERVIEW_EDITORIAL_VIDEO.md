# Opal Legacy — Overview Editorial Video

The Overview section, in both `/ar` and `/en`, now supports a premium landscape film directly beside its existing story text. The hero film feature and Overview film are independent.

## Guest experience

- **Desktop:** Two balanced editorial columns. The hotel story remains readable, while a wide 16:10 cinematic film frame replaces the two overlapping Overview photos.
- **Mobile/tablet:** The story stacks above the film, with a 16:9 player and large touch-friendly play button.
- The selected **Overview main image** automatically serves as the video's Poster. If the selected video has an explicitly assigned library Poster, use that instead. No separate Poster upload is required.
- On arrival the Poster and play button appear **without downloading the MP4** (`preload="none"`); video playback begins only after the visitor presses Play, with native pause/scrub/audio/fullscreen controls then exposed.
- Localized copy and player labels; no forced autoplay, looping, or sound. Film is served using HTTP range requests.
- If the owner clears the Overview video assignment, the existing two-photo layout returns unchanged.

## Owner flow

Open `/admin` → **مكتبة الوسائط V2** → **وسائط أقسام الموقع** → **فيديو Overview — جنب الكلام**.

1. Click **ارفع فيديو للـOverview**, select an MP4. The uploaded file is added to the library and **automatically selected for the Overview section**. No duplicate picker or separate metadata entry is required.
2. Or choose an existing video using the thumbnail-based **أو اختار فيديو مرفوع قبل كده** selector.
3. Use **معاينة المسودة** in Arabic or English to preview before publishing.
4. Press **حفظ ونشر الآن**, confirm the batch rights statement **once**, and visit the public page. No developer or subsequent Deploy is needed.
5. To switch back to photos, clear the Overview video selection. Main/inset photos remain in the CMS as a fallback.

## Performance and constraints

- MP4 H.264/AAC, web-optimized with `faststart`, **up to 50 MB** per file. A short 10–30 second clip is ideal for this section; a longer film should be optimized to fit the limit or remain in the separate on-demand full-film experience.
- Images still load as the static Poster with no background video requests on initial page load. Video bytes stream only after Play.
- Media is stored outside the Git repo under the private CMS VPS directory. Owner upload is authenticated; *unpublished* and *unassigned* videos return 404 to anonymous visitors.
- Existing CMS documents without `overviewVideo` load with an empty assignment. Schema validation still only accepts managed CMS MP4 URLs (never arbitrary remote URLs).
- Video approval occurs exclusively in the published owner snapshot after the batch publishing-rights confirmation. All other V2 access and lifecycle policies are unchanged.

## Verification

Run `npm test && npm run typecheck && npm run build`, followed by the browser CMS integration and visual preview CI. E2E checks the direct upload, auto-selection, private AR preview, private video 404 before publication, public range requests and film rendering in Arabic/English, plus a mobile screenshot.

# Opal Poolside — Dynamic Owner CMS (V1)

## Purpose
The owner manages bilingual website text, galleries and section visibility from **`https://opal.drvotech.com/admin`**. Changes appear on the public site immediately after clicking **Publish**, without editing GitHub or redeploying. The draft preview is private.

The CMS is intentionally simple for the existing **single VPS / one Next.js service** architecture: no extra database, container or paid SaaS. Data and uploads are kept in a private, persistent directory **outside Git**.

## Owner workflow
1. Open `/admin` over HTTPS and log in using the owner password.
2. Use **المحتوى والنصوص** to edit hotel name, address, SEO description, bilingual hero, overview paragraphs, quick amenities, facility groups and nearby attractions.
3. Use **الأقسام والترتيب** to hide/show and move the seven homepage sections (Story, Facilities, Location, Rooms, Gallery, Reviews, Contact); edit each section's headline, kicker, accent and introduction for Arabic and English.
4. Use **مكتبة الصور واللوجو** to upload real JPEG/PNG/WebP images (up to 4 MB each) and their proper Arabic/English alt descriptions. Tick the rights/approval box only when authorized. **The logo can now go live separately** once its rights are confirmed and the saved draft is published. The six photos still require their complete approved set to replace preview photography; no partial photo swaps.
5. Click **حفظ المسودة**. Then **معاينة المسودة** opens `/ar/preview` or `/en/preview`. Only a signed-in owner can see this preview.
6. Click **نشر على الموقع**. The published snapshot becomes live on the next page load. No build or developer is involved. Previous versions are available as drafts from **النسخ السابقة**.

**Never paste passwords, licenses or client information into normal website text fields.** Full approval and licensing evidence should remain in separate secure hotel records. The CMS only stores the owner's confirmation per uploaded asset.

## Owner login & server setup
Run the existing Opal-only deploy command after PR merge. The updated deploy script creates these once:

- `/var/lib/opal-hotel-cms/`: persistent draft, published, history and media, owned by `opalhotel`, mode `0700`.
- `/etc/opal-hotel/cms.env`: root-only mode `0600`, containing a cryptographically generated owner password, a separate signed-cookie secret and the public HTTPS origin.
- `opal-hotel.service`: points to this data directory and env file. Existing managed service units are updated automatically.

Retrieve the generated login password securely **on the VPS only**:

```bash
sudo grep '^OPAL_CMS_ADMIN_PASSWORD=' /etc/opal-hotel/cms.env
```

Store it in a password manager. Do **not** share it in chat, GitHub, or public logs. The CMS requires HTTPS in production. To rotate it:

```bash
sudo nano /etc/opal-hotel/cms.env
sudo systemctl restart opal-hotel.service
```

Use a new long random password. Changing it invalidates existing signed sessions. Update `OPAL_CMS_PUBLIC_ORIGIN` if the domain changes. For local development, set `OPAL_CMS_ADMIN_PASSWORD` (at least 16 characters), `OPAL_CMS_SESSION_SECRET` (at least 40 characters), `OPAL_CMS_PUBLIC_ORIGIN=http://localhost:3000` and optionally `OPAL_CMS_DATA_DIR`.

## What is dynamic
- Published Arabic and English homepage copy and server-rendered title/meta description.
- Owner-ordered and hidden/visible sections; nav and footer respect visibility.
- The approved logo independently in the header/mobile menu after Publish; the six shared hero/story/gallery/rooms/booking images only when the *full photo set* is owner-approved.
- Live server read on each page visit; private draft preview; optimistic revision checks to prevent overwriting another editor's changes.
- Multiple image uploads, previous published revisions and restore-to-draft.

## Safety restrictions
- This CMS is single-owner password based, **not** a multi-tenant role/permissions platform yet.
- Uploads allow only PNG/JPEG/WebP magic signatures, max 4 MB; **no SVG, HTML or executable content**. Strip EXIF/geolocation from photos before uploading using an approved editor; V1 does not transcode or remove EXIF automatically.
- Newly uploaded media stays accessible only to the signed-in owner. An owner-approved, published logo can be retrieved publicly **by itself**; individual photos remain private until all six photos and the logo are approved and published together. Published media is cacheable for 10 minutes; previously viewed images may remain in browser caches briefly after withdrawal.
- The CMS logo activates independently when uploaded, rights-confirmed and published. The six-photo library still activates only when all six photographs, descriptions, rights and official logo are approved; the previous repo-based approval manifest remains a fallback.
- Owner content is escaped by React; no rich HTML injection or custom scripts. Security requires HTTPS, a strong owner secret and single-site origin checks.
- Booking, payment, availability, guest review submission and contact delivery **remain disabled preview experiences**. The CMS never adds a real reservation or sends guest details.
- The global `noindex` safety policy remains until separate hotel/public-launch approval.

## Data resilience
`git reset --hard` and regular deployments do **not** touch `/var/lib/opal-hotel-cms`. Saves and publishes use atomic file replacement; previous published JSON snapshots are preserved under `history/`.

**Important:** Version history on the same disk is not a disaster-recovery backup. Configure a separate, encrypted off-VPS backup of `/var/lib/opal-hotel-cms` with a trusted storage provider before relying on this for business-critical content. Restore securely with restricted `opalhotel` ownership.

## Verification
Run `npm test && npm run typecheck && npm run build`. GitHub's Frontend Visual Preview builds the app, tests the existing EN/AR × mobile/tablet/desktop journeys, then uses a local isolated CMS data directory to test login, drafts, preview, immediate publishing, section visibility, version history, invalid image uploads and logout.

## Deferred by design
Editable room inventory, capacity, pricing, actual availability, online payments, reviews or contact inboxes require approved backend schemas and a separate release gate. V1 does not claim those are implemented.


## Production activation and acceptance (after code review)

1. Confirm the DNS A record for `opal.drvotech.com` points to the intended VPS and HTTPS is working. Run the existing Opal-only deploy script **from the updated main checkout**:

   ```bash
   cd /var/www/opal-hotel
   sudo -u opalhotel git fetch origin main
   sudo -u opalhotel git reset --hard origin/main
   sudo OPAL_SSL_EMAIL=you@example.com bash ops/deploy-vps.sh opal.drvotech.com
   ```

   Replace the email with the actual SSL contact. These commands only apply if the existing checkout/service uses the documented `opalhotel` account. If Opal has not been deployed, clone the repository first and run `sudo OPAL_SSL_EMAIL=you@example.com bash ops/deploy-vps.sh opal.drvotech.com` from the checkout. **Do not run this against a different application.**

2. Check the app service and HTTPS without printing secrets:

   ```bash
   sudo systemctl --no-pager status opal-hotel.service
   bash ops/check-cms-production.sh opal.drvotech.com
   ```

   The smoke check is read-only. It verifies EN/AR, the owner page, anonymous API denial, private preview denial and that the CMS environment has loaded. It does not log in, upload, publish, modify content, or confirm that a real publish works.

3. From the owner dashboard, verify the end-to-end flow: log in with the VPS-generated password, change a harmless text field in EN and AR, **Save Draft**, check both private previews, verify the public page still shows the old text, then **Publish** and confirm that both public pages update without deploying. Test a restore-to-draft and then publish only if the restored content is correct.
4. Upload one JPEG/PNG/WebP image with EXIF/location metadata removed, then confirm the approval gate works. Do not treat the site as publicly launch-ready until the approved photo set, hotel facts and business sign-offs are complete.
5. Arrange an **encrypted backup on storage outside this VPS** for `/var/lib/opal-hotel-cms` before treating owner content as business-critical. Test restoring it to a safe location. History on the same disk does not protect against disk loss.

### Existing Opal service migration

The deploy script adds a managed `/etc/systemd/system/opal-hotel.service.d/20-opal-cms.conf` override for *only* the Opal service. It includes `OPAL_CMS_DATA_DIR`, the root-only env file path, and secure file creation mask, even if an older Opal unit has no `NEXT_TELEMETRY_DISABLED` line. A conflicting, unmanaged override causes deployment to stop instead of silently overwriting it. The public smoke check should pass **after** deployment and valid HTTPS configuration.


## Hero Video Management (V1)

The existing **/admin → مكتبة الصور واللوجو** page now contains an independent **Hero Video** studio. Owners may use video or keep the original photo carousel. This does **not** activate booking/payments and does **not** require all six hotel photos to be published.

### Owner workflow
1. Upload a short **desktop MP4** (H.264, `-movflags +faststart`, ideally 10–15 seconds and muted; maximum **6 MB**).
2. Optionally upload a **mobile MP4** (recommend 640×360 or 720p; maximum **4 MB**). If absent, the desktop video is used when video is enabled.
3. Upload a lightweight **poster** (WebP, PNG or JPEG, up to 4 MB; aim under 250 KB). This image is immediately eligible for the first paint only **after video approval and publishing**. Draft posters are owner-private.
4. Optionally upload a **full hotel film** (MP4, maximum **50 MB**) separately. It is shown only behind the **Watch Our Film** action; it is not preloaded when visiting the homepage.
5. Tick the explicit rights checkbox for the hero + poster (and separately the full film), enable video, click **Save Draft**, inspect `/ar/preview` and `/en/preview`, and **Publish**. Arabic and English share the same media assets, while headings remain localized.
6. To restore the still photo slider without deleting any files, simply turn off video and publish again. Historic CMS JSON snapshots preserve published choices.

### Playback / accessibility / performance
- A lightweight poster is loaded first. Only when the hero enters the viewport, the connection allows it, and reduced-motion/data-saver conditions permit, the video source is attached and playback starts muted/inline/looping.
- A Pause/Play control is always available. When autoplay is disallowed, the poster stays visible. If video decoding fails, the poster remains as the fallback.
- Video playback stops when the document becomes hidden or the hero scrolls out of view; long-film modal opens only from the explicit watch button. The full film is served on demand with HTTP **206 Range** responses for scrubbing.
- Video files are stored outside the Git checkout in `/var/lib/opal-hotel-cms/videos`, alongside the existing photo/data storage. Private draft uploads return 404 to anonymous visitors. Only explicitly approved and **published** assets are publicly streamed. Published video URLs are cacheable for up to 10 minutes.
- The Opal-managed Nginx vhost gets `client_max_body_size 55m` to allow a maximum 50 MB film upload. Other VPS applications are not changed. Deploying this new release is required for the updated Nginx limit to apply.
- MP4 container signatures and file-size limits are verified server-side, but the VPS does **not** transcode video or guarantee browser codec support. Export H.264 + yuv420p + faststart; avoid uploading HEVC/AV1-in-MP4 as the main cross-browser source. Remove personally identifying metadata from footage before uploading.
- Single-VPS storage/bandwidth is suitable for a small initial audience. High traffic / large films should move to object storage and a CDN; do **not** embed the four-minute film as an autoplay hero.

### Suggested source exports
```bash
# Example short hero: keep source aspect ratio, remove sound and move MP4 metadata to the front
ffmpeg -i hotel-master.mp4 -t 12 -an -vf "scale=1024:-2,fps=25" \
  -c:v libx264 -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart opal-hero-desktop.mp4

# Mobile fallback (smaller file)
ffmpeg -i opal-hero-desktop.mp4 -an -vf "scale=640:-2,fps=24" \
  -c:v libx264 -preset medium -crf 29 -pix_fmt yuv420p -movflags +faststart opal-hero-mobile.mp4
```

**Note:** The original uploaded owner film is approximately 4:10, 1024×576, and 33.6 MB. It fits the film upload budget, but the source footage is already compressed and should not be upscaled for quality.

### Local and production checks
- Run `npm test && npm run typecheck && npm run build` and the Playwright CMS suite on **isolated test credentials and a temporary CMS directory only**.
- After merging/deploying to the Opal VPS, confirm the updated Nginx client limit, upload the three optimized short-hero assets and full film from the admin, use **Save Draft → Preview EN/AR → Publish**, and verify the public video starts muted while the long film still loads only on click.
- Before any business-critical public content upload, enable and test an encrypted **off-VPS backup** of both `/var/lib/opal-hotel-cms/media` **and** `/var/lib/opal-hotel-cms/videos`, along with the CMS JSON history.

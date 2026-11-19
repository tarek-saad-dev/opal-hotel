# Opal Legacy — Dynamic Owner CMS (V1)

## Purpose
The owner manages bilingual website text, galleries and section visibility from **`https://opal.drvotech.com/admin`**. Changes appear on the public site immediately after clicking **Publish**, without editing GitHub or redeploying. The draft preview is private.

The CMS is intentionally simple for the existing **single VPS / one Next.js service** architecture: no extra database, container or paid SaaS. Data and uploads are kept in a private, persistent directory **outside Git**.

## Owner workflow
1. Open `/admin` over HTTPS and log in using the owner password.
2. Use **المحتوى والنصوص** to edit hotel name, address, SEO description, bilingual hero, overview paragraphs, quick amenities, facility groups and nearby attractions.
3. Use **الأقسام والترتيب** to hide/show and move the seven homepage sections (Story, Facilities, Location, Rooms, Gallery, Reviews, Contact); edit each section's headline, kicker, accent and introduction for Arabic and English.
4. Use **مكتبة الصور واللوجو** to upload real JPEG/PNG/WebP images (up to 4 MB each) and their proper Arabic/English alt descriptions. Tick the rights/approval box only when authorized. The six images **and logo must all be approved** to replace preview photography; partial updates stay in draft without mixing real and demo images.
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
- The six shared hero/story/gallery/rooms/booking images and the logo when the *full set* is owner-approved.
- Live server read on each page visit; private draft preview; optimistic revision checks to prevent overwriting another editor's changes.
- Multiple image uploads, previous published revisions and restore-to-draft.

## Safety restrictions
- This CMS is single-owner password based, **not** a multi-tenant role/permissions platform yet.
- Uploads allow only PNG/JPEG/WebP magic signatures, max 4 MB; **no SVG, HTML or executable content**. Strip EXIF/geolocation from photos before uploading using an approved editor; V1 does not transcode or remove EXIF automatically.
- The shared media set activates only when all six owner-verified photos, localized alts and official logo are complete. The previous repo-based approval manifest still exists as a fallback until the owner CMS library is ready.
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

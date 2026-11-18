# Authorized Opal Hotel Media Only

This folder is deliberately empty of hotel photography and branding until the owner supplies and approves the originals.

Place verified, authorized files here with concise, lowercase names such as `exterior.webp` and `opal-logo.svg`.

**Do not commit** third-party listing scrapes, stock images labelled as the hotel, private contracts, signatures, identity documents, unpublished guest photographs or personal information.

The source of truth is `src/config/hotel-media.json`. Fill in bilingual `altEn` / `altAr`, verify image rights, and only then activate official mode. Run `npm run media:check` to validate staged files and `npm run media:launch-check` for the final owner-approved gate.

See `docs/HOTEL_MEDIA_HANDOFF.md` for the exact six requested image roles and size requirements.

# Opal Poolside booking integration — rollout gates

Backend handoff baseline: 30b96ba0fb3e1a60c72d814deedaee58e35e9c34.
This is phase 1, not production acceptance. No backend changes or live calls made.

## Enable for isolated local verification
- Set OPAL_BOOKING_ENABLED=true in .env.local.
- OPAL_API_BASE_URL=http://127.0.0.1:8000 (origin only; visible to browser).
- OPAL_PAYMENT_GATEWAY=mock (loopback backend only; Laravel must permit mock).
- Laravel CORS must allow http://localhost:3000. Run the actual backend and frontend.
- Open /en/booking and /ar/booking. Default flag off preserves legacy page.
- Configure the actual Paymob return destination with backend/DevOps: /en/booking?reference=<opaque reference> or /ar/booking?reference=<opaque reference>. If provider cannot include reference, same-tab browser session offers the last reference on /booking; manual lookup is also available. Do not assume provider supports a particular redirect parameter.
- No browser return is treated as payment confirmation. Booking lookup is authoritative.

## Delivered on this branch
Typed public API client, catalog, one-unit Overnight Stay with manual/random assignment, Day Use, create and final server total, payment initiation, status polling/countdown, reference lookup, code and returned ticket code display, EN/AR and existing date picker/CMS shell. No automatic POST retries, no payment secrets in browser. Tests added but require CI.

## Remaining
- G01: five stable slug slots are implemented in Media Studio, but owner-approved media assignments and live product verification remain outstanding. Do not change Laravel slugs.
- Multi-unit allocation, product detail routes, booking QR graphic, ticket lookup UX, and visual/mobile E2E.
- Old contact/reviews endpoints not in Laravel handoff; keep separate and do not route them to Laravel without agreement.
- Verify actual API response shape (collection examples are documentation, not live evidence), CORS, 201 success, 409 inventory conflicts, 422 fields, 429, no PII in public booking lookup, one ticket per booking, scheduler expiration, payment reuse and recovery.
- G05: approved staging Paymob verification, return URL, SMTP; no production credentials or payments until signed off.
- Confirm actual staging/production API origins and TLS with DevOps.
- M11 remains EXTERNAL_BLOCKED. Do not deploy or enable live booking until approved.

## Postman audit notes
51 requests, 26 have no test event. Several positive assertions allow failure status, so a green runner is not proof of integration. Five web requests only represent part of documented Blade inventory. Agency/public reference variables are shared in several requests; run isolated flows rather than full mutation-enabled collection. Negative agency reference test can pass with no reference. Use explicit success assertions and fixtures.

## Phase 2 — dynamic homepage catalog and product media
When OPAL_BOOKING_ENABLED=true, the legacy Rooms section becomes the bilingual Poolside catalog. Existing section visibility and ordering are respected. Prices, descriptions, capacity and active status come from the Laravel public API. The room anchor remains stable; the visible navigation label changes to Experiences. No placeholder prices or products are displayed if the API fails.
The existing Media Studio has five additional product-specific slots under Rooms & Products. Select the cover, gallery and optional video for each historical slug, save/preview and publish with rights confirmation. Older CMS snapshots gain empty slots via normal normalization; no old media is overwritten. Missing product imagery uses a branded panel, never another product's photo. The homepage and checkout use the exact same slug mapping. Booking links carry the selected product type and slug. G01 stays unverified until real media is assigned and tested.

## Phase 3 — multi-unit checkout and booking pass
The public stay form now allows up to six units per request as a frontend safety cap (not a Laravel business limit). Each row has its own accommodation type, guests and optional physical unit. Availability requests are deduplicated by type and guest count; inventory matching rejects duplicate physical units and insufficient stock. The submitted guest total is the sum of the rows. Laravel remains authoritative for transactional stock, capacity and total. The UI supports all-automatic or all-manual assignment; mixed assignment is not exposed.
A confirmed booking with a returned ticket renders one QR locally using qrcode-generator (no third-party QR requests). The payload follows the guide: public API origin + /api/v1/tickets/{booking_code}. Verify that the deployed public origin equals Laravel APP_URL and that hotel staff can scan it before launch. Browser print is a convenience, not the official Laravel-issued PDF. Session recovery stores references only after successful creation or lookup. A calendar test now advances months when fewer than eight dates remain.
Still required: real staging API validation, multi-unit conflict tests against Laravel, QR scan with staff, payment return and email verification, mobile visual QA with the feature flag enabled. No production deployment.

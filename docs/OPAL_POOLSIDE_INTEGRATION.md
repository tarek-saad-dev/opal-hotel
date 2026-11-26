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
- G01: five historical slugs need verified owner-approved media (two Day Use, three Accommodation Types); existing CMS room keys differ. Do not assign unverified images or change Laravel slugs.
- Multi-unit allocation, product landing cards/homepage copy, booking QR graphic, ticket lookup UX, and visual/mobile E2E.
- Old contact/reviews endpoints not in Laravel handoff; keep separate and do not route them to Laravel without agreement.
- Verify actual API response shape (collection examples are documentation, not live evidence), CORS, 201 success, 409 inventory conflicts, 422 fields, 429, no PII in public booking lookup, one ticket per booking, scheduler expiration, payment reuse and recovery.
- G05: approved staging Paymob verification, return URL, SMTP; no production credentials or payments until signed off.
- Confirm actual staging/production API origins and TLS with DevOps.
- M11 remains EXTERNAL_BLOCKED. Do not deploy or enable live booking until approved.

## Postman audit notes
51 requests, 26 have no test event. Several positive assertions allow failure status, so a green runner is not proof of integration. Five web requests only represent part of documented Blade inventory. Agency/public reference variables are shared in several requests; run isolated flows rather than full mutation-enabled collection. Negative agency reference test can pass with no reference. Use explicit success assertions and fixtures.

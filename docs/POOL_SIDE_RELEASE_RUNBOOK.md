# Opal Poolside — Pre-production acceptance runbook
Status: PARTIAL / EXTERNAL_BLOCKED. Do not enable booking or agency features in production yet.

## 1. Required environment information
- Actual staging Laravel HTTPS origin (no /api/v1), staging frontend HTTPS origin, deployed Laravel commit, approved test account(s) for creator and parent/child visibility.
- Approved Paymob staging integration and exact payment-return URLs; Laravel handles authenticated webhook verification, queues and SMTP.
- Approved owner media for the five catalog slugs; never substitute unauthorised photography.
The handoff staging Postman environment contains https://YOUR-STAGING-HOST.example, not a usable API endpoint.

## 2. Read-only checks
From the PR checkout, with Node 22:
```bash
node scripts/poolside-preflight.mjs "$OPAL_API_BASE_URL" "$OPAL_AGENCY_PUBLIC_ORIGIN"
```
Supply both actual origins explicitly. The script checks ping, bilingual catalog contract, stable product slugs, decimal rates and browser CORS headers plus an OPTIONS preflight. It does not perform any booking, payment, webhook, refund, login or write. A PASS is not M11 release acceptance.

## 3. Isolated staging frontend configuration
Use a separate staging service, CMS data directory and credentials; do not repoint the live systemd service or edit the existing CMS secrets. Set OPAL_BOOKING_ENABLED=true, OPAL_AGENCY_ENABLED=true, OPAL_API_BASE_URL=<actual Laravel staging origin>, OPAL_AGENCY_PUBLIC_ORIGIN=<actual staging frontend origin>, OPAL_PAYMENT_GATEWAY=paymob for approved Paymob staging only. Mock is supported only for loopback API. Leave both flags false in production. Never expose agency credentials, Paymob secrets or webhook keys via NEXT_PUBLIC variables.

## 4. Evidence matrix
| Gate | Evidence required | Current |
|---|---|---|
| CI | Frontend CI, Visual Preview, Poolside Feature Integration on exact candidate SHA | rerun after final commit |
| G01 | five slug IDs, published owner-approved media, actual browser mapping | pending live catalog/media |
| Public Day Use | actual create, correct server total, valid code, status lookup | pending staging |
| Overnight | random/manual multi-unit, per-unit guests, price by nights, 409 concurrency | pending staging |
| Agency | creator-only pay, direct child read, non-authorized read/write denied, agency pricing, paging | pending staging |
| G05 | real Paymob staging session, browser return ignored as proof, authoritative webhook settlement, expiry | pending external |
| Ticket/mail | one issued ticket, actual QR scanner, real SMTP delivery/PDF | pending external |
| M11 release | signed evidence for all gates | EXTERNAL_BLOCKED |

Use test guests and approved test inventory only. No production charges, no simulated webhook against shared staging without explicit coordination. Redact guest data, tokens, booking references and payment URLs from shared logs.

## 5. Deploy and rollback plan (not executed)
After acceptance, record frontend/backend SHAs and current service configuration; back up persistent CMS data and root-only configuration; verify media ownership; merge reviewed candidate; build a separate release and verify before service switch. Existing ops/deploy-vps.sh resets the live checkout to origin/main and restarts the live service, so it is not a staging deploy or an atomic rollback mechanism. Do not execute it until release is approved.
For rollback, disable both feature flags in the actual service environment and restart; verify the legacy homepage and booking path, then restore the known-good frontend release if needed. Disabling UI flags does not cancel Laravel holds, payments or tickets: coordinate ongoing bookings with the backend operator. Keep evidence of the rollback and never delete live data.

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

## 6. Release candidate preparation (Phase 8)
The previously reviewed frontend commit `6070e373ac0bd22d3b4d9af4a9297a5b49840972` passed Frontend CI, Frontend Visual Preview and Poolside Feature Integration. These results are for that exact SHA; subsequent commits require their own checks.

The read-only preflight now also checks all three stable accommodation detail and availability routes in EN/AR, using a one-night window beginning seven Cairo calendar days in the future. A sold-out response is valid when its schema is correct; the probe does not reserve inventory. A skipped check is a non-pass. The output is a JSON report containing no booking/customer/token data. The opt-in GitHub workflow `Poolside Staging Preflight` accepts actual staging origins; once the workflow is available on the default branch, use Actions → Run workflow and download the evidence artifact. Before that, run the CLI from the candidate checkout. No workflow execution is implied by creating this file.

A separate build-only helper is available:
```bash
bash ops/prepare-poolside-release.sh <reviewed-40-character-commit-sha> /path/to/new/release-directory
```
Run from a trusted local Opal repository as an unprivileged dedicated deployment user. It requires an existing parent directory and an unused destination outside the source checkout, live app and CMS data directories. It exports the exact tracked commit, clears the known Opal runtime configuration from the build environment, disables both booking features during the build, installs dependencies, runs tests/typecheck/build, and records the SHA. It does not switch services or deploy. The repository does not currently commit a package-lock.json; npm install is used when no lockfile exists, so dependency resolution is not fully reproducible. Supply runtime configuration separately and verify the final staging build and service with the actual environment before any switch.

Public and agency configuration now share fail-closed validation: unknown gateways, placeholder origins, non-HTTPS remote origins and remote mock configurations are rejected rather than silently switching agency payment to Paymob. The approved Paymob sandbox credentials and callback configuration still belong to Laravel. All release gates remain open until real environment evidence is collected.

## 7. Phase 9 — final user-journey regression
Commit `15b8e4a9fe7bac74bfe368c2877ad7c2e3b3ec50` passed all three CI workflows. Subsequent changes require new checks. The homepage footer now exposes the agency portal only when its feature flag is enabled and uses the Poolside experiences label when the public booking flag is enabled.
The feature workflow now tests both public and agency payment initiation with a loopback-only mock payment URL, browser navigation, a simulated untrusted return and authoritative pending/paid/confirmed handling. Public multi-unit checkout also exercises distinct manual selection followed by automatic allocation in EN/AR. Captures use fixture data only and are uploaded as `poolside-feature-preview` (14 days). They are visual evidence, not an approval of styling or live payment. Real Laravel, Paymob, email, scanner and media acceptance are still external release gates; do not bypass them by enabling features in production.

## 8. Production integration — 2026-11-28
The owner confirmed Laravel is already deployed at https://api.opalpoolside.com (DNS 187.77.83.120); the intended frontend origin is https://opalpoolside.com. Do not redeploy Laravel. Read-only VPS evidence: HTTPS ping 200, success=true, Content-Language en; ping uses ANV Platform health text and no data field. Both public catalog endpoints returned HTTP 200 with empty arrays. CORS allow-origin was empty. The independent GitHub probe failed CORS/strict ping shape; all three fixture CI workflows passed at eca1fd7d7709cb67442f8cf0c52ea71174784f5b.
The current product catalog is authoritative. Historical handoff slugs remain only for backward-compatible media snapshots and optional historical tests; they are not required as actual Opal product identifiers. The CMS now exposes an authenticated read-only server catalog import (GET /api/admin/cms/products); load products in Media Studio, choose a live product, link its image/gallery/video, then save and publish. Namespaced keys separate day_use and bubble_stay. Existing matching historical images may be copied when explicitly linking that product; unrelated room media is never reused. No fake products/prices are created. The preflight checks actual active identifiers, not fixed historical names; it reports liveness, contract, CORS and missing catalog independently. Detail/availability checks sample up to ten validated active accommodation types to limit traffic. Actual inventory and final payment acceptance remain blocked.
Production runtime settings, when approved:
OPAL_API_BASE_URL=https://api.opalpoolside.com
OPAL_AGENCY_PUBLIC_ORIGIN=https://opalpoolside.com
OPAL_BOOKING_ENABLED=false
OPAL_AGENCY_ENABLED=false
OPAL_PAYMENT_GATEWAY=paymob
No production configuration change or deployment was performed. Keep both flags disabled until the actual active catalog, CORS, mapping and controlled payment acceptance are verified. A Paymob sandbox must not be assumed merely because the API is deployed on production.

#!/usr/bin/env bash
# Read-only, unauthenticated CMS production acceptance checks.
# Usage: bash ops/check-cms-production.sh opal.drvotech.com
set -Eeuo pipefail

(( $# == 1 )) || { echo "Usage: bash ops/check-cms-production.sh <opal-domain>" >&2; exit 2; }
DOMAIN="$1"
[[ "$DOMAIN" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}$ ]] || { echo "Invalid domain" >&2; exit 2; }
command -v curl >/dev/null || { echo "curl is required" >&2; exit 2; }
command -v node >/dev/null || { echo "node is required" >&2; exit 2; }
BASE="https://$DOMAIN"
fail(){ echo "[FAIL] $*" >&2; exit 1; }
ok(){ echo "[PASS] $*"; }
status(){
  curl --silent --show-error --max-time 15 --output /dev/null --write-out '%{http_code}' "$BASE$1" ||
    fail "Cannot reach $BASE$1 using a valid HTTPS certificate"
}
expect(){
  local actual
  actual="$(status "$1")"
  [[ "$actual" == "$2" ]] || fail "$1 expected HTTP $2; received $actual"
  ok "$1 returned HTTP $actual"
}

echo "Checking $BASE (public endpoints only; no credentials, writes, or content changes)"
expect /en 200
expect /ar 200
expect /admin 200
expect /api/admin/cms 401
expect /api/admin/cms/history 401
expect /en/preview 404
expect /ar/preview 404

SESSION="$(curl --silent --show-error --fail --max-time 15 "$BASE/api/admin/cms/session")" ||
  fail "Cannot read owner CMS session health"
printf '%s' "$SESSION" | node -e '
  let data;
  try { data = JSON.parse(require("fs").readFileSync(0, "utf8")); }
  catch { console.error("[FAIL] CMS session endpoint returned invalid JSON"); process.exit(1); }
  if (data.configured !== true || data.authenticated !== false) {
    console.error("[FAIL] CMS not configured or public check unexpectedly authenticated");
    process.exit(1);
  }
' || fail "CMS session health check failed"
ok "CMS credentials configured and anonymous visitor is unauthenticated"

# The anonymous check never signs in or publishes. Owner must separately
# verify draft -> private preview -> publish -> public site in the dashboard.
echo "[PASS] Public CMS smoke checks complete. Verify owner publishing manually."

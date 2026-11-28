#!/usr/bin/env bash
# Build a candidate in an unused directory without touching a running service.
# Run as a dedicated unprivileged user from a trusted checked-out Opal repo.
set -Eeuo pipefail
die(){ echo "[opal-release] $*" >&2; exit 1; }
(( EUID != 0 )) || die "Do not build Node dependencies as root."
(( $# == 2 )) || die "Usage: bash ops/prepare-poolside-release.sh <40-character commit SHA> <new absolute release directory>"
SHA="$1"
DEST="$2"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "Provide the exact reviewed commit SHA."
[[ "$DEST" == /* && "$DEST" != "/" && ! -e "$DEST" && ! -L "$DEST" ]] || die "Destination must be a new absolute directory."
for cmd in git node npm tar realpath; do command -v "$cmd" >/dev/null || die "Missing $cmd."; done
(( $(node -p 'process.versions.node.split(".")[0]') >= 22 )) || die "Node 22+ required."
ROOT="$(git rev-parse --show-toplevel)"
[[ "$(git -C "$ROOT" cat-file -t "$SHA")" == commit ]] || die "Commit not available in local checkout."
PARENT="$(realpath -e "$(dirname "$DEST")")"
DEST="$PARENT/$(basename "$DEST")"
[[ "$DEST" != "$ROOT" && "$DEST" != "$ROOT/"* && "$DEST" != /var/www/opal-hotel && "$DEST" != /var/www/opal-hotel/* && "$DEST" != /var/lib/opal-hotel-cms && "$DEST" != /var/lib/opal-hotel-cms/* ]] || die "Do not build inside live checkout, CMS data or source tree."
[[ ! -e "$DEST" && ! -L "$DEST" ]] || die "Destination already exists."
umask 077
mkdir -- "$DEST"
# Export tracked files only; no local .env, secrets, untracked data or git metadata.
git -C "$ROOT" archive "$SHA" | tar -x -C "$DEST"
cd "$DEST"
unset OPAL_API_BASE_URL NEXT_PUBLIC_OPAL_API_BASE_URL OPAL_AGENCY_PUBLIC_ORIGIN OPAL_PAYMENT_GATEWAY
unset OPAL_CMS_ADMIN_PASSWORD OPAL_CMS_SESSION_SECRET OPAL_CMS_DATA_DIR OPAL_CMS_PUBLIC_ORIGIN
export OPAL_BOOKING_ENABLED=false OPAL_AGENCY_ENABLED=false NEXT_TELEMETRY_DISABLED=1
if [[ -f package-lock.json ]]; then npm ci --include=dev --no-audit --no-fund; else npm install --include=dev --no-audit --no-fund; fi
npm test
npm run typecheck
npm run build
printf '%s\n' "$SHA" > .opal-release-sha
printf '[opal-release] Candidate built: %s\n[opal-release] Directory: %s\n[opal-release] No service, Nginx, CMS data or production configuration changed.\n' "$SHA" "$DEST"

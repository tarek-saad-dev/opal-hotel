#!/usr/bin/env bash
# Prepare the existing managed frontend service for a CLOSED booking cutover.
# Does not restart services, change Nginx, deploy code, or modify Laravel.
set -Eeuo pipefail
die(){ echo "[opal-runtime] $*" >&2; exit 1; }
(( EUID == 0 )) || die "Run with sudo/root."
(( $# == 0 )) || die "This script only prepares the confirmed Opal production origins."
UNIT=/etc/systemd/system/opal-hotel.service
CONFIG=/etc/opal-hotel
ENV_FILE="$CONFIG/poolside-runtime.env"
DROPIN_DIR=/etc/systemd/system/opal-hotel.service.d
DROPIN="$DROPIN_DIR/90-poolside-runtime.conf"
[[ -f "$UNIT" ]] && grep -Fq '# Managed by Opal Hotel' "$UNIT" || die "Expected existing managed Opal frontend service not found."
[[ -f "$CONFIG/cms.env" ]] || die "Existing CMS configuration not found."
for file in "$ENV_FILE" "$DROPIN"; do
 [[ ! -L "$file" ]] || die "Refusing symlink: $file"
 if [[ -e "$file" ]]; then die "Existing Poolside runtime configuration found. Review manually instead of overwriting."; fi
done
install -d -o root -g root -m 0700 "$CONFIG"
install -d -o root -g root -m 0755 "$DROPIN_DIR"
umask 077
ENV_TMP="$(mktemp "$CONFIG/.poolside-runtime.XXXXXX")"
DROPIN_TMP="$(mktemp "$DROPIN_DIR/.poolside-runtime.XXXXXX")"
trap 'rm -f "$ENV_TMP" "$DROPIN_TMP"' EXIT
cat >"$ENV_TMP" <<'ENV'
# Managed by Opal Hotel Poolside runtime
OPAL_API_BASE_URL=https://api.opalpoolside.com
OPAL_AGENCY_PUBLIC_ORIGIN=https://opalpoolside.com
OPAL_PAYMENT_GATEWAY=paymob
OPAL_BOOKING_ENABLED=false
OPAL_AGENCY_ENABLED=false
OPAL_BOOKING_MAINTENANCE=true
ENV
cat >"$DROPIN_TMP" <<'SYSTEMD'
# Managed by Opal Hotel Poolside runtime
[Service]
EnvironmentFile=/etc/opal-hotel/poolside-runtime.env
SYSTEMD
chmod 0600 "$ENV_TMP"
chmod 0644 "$DROPIN_TMP"
# Hard link creation refuses an existing destination; no existing config replaced.
ln -- "$ENV_TMP" "$ENV_FILE"
if ! ln -- "$DROPIN_TMP" "$DROPIN"; then rm -f "$ENV_FILE"; die "Cannot install new drop-in."; fi
printf '%s\n' "[opal-runtime] Prepared confirmed production API origin with booking and agency CLOSED." "[opal-runtime] Existing CMS credentials, service, Nginx and Backend untouched." "[opal-runtime] Do NOT restart until the reviewed frontend release is deployed; daemon-reload and restart are separate deliberate actions."

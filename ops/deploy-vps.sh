#!/usr/bin/env bash
# Opal Legacy production deployment; isolated app, Nginx host, and systemd unit.
# Usage: sudo bash ops/deploy-vps.sh hotel.example.com
# Optional automatic TLS: sudo OPAL_SSL_EMAIL=admin@example.com bash ops/deploy-vps.sh hotel.example.com
set -Eeuo pipefail

(( $# >= 1 )) || { echo "Usage: sudo bash ops/deploy-vps.sh <your-opal-domain>" >&2; exit 2; }
DOMAIN="$1"
PORT=3418
APP_USER=opalhotel
APP_DIR=/var/www/opal-hotel
CMS_DIR=/var/lib/opal-hotel-cms
CMS_CONFIG_DIR=/etc/opal-hotel
CMS_ENV=/etc/opal-hotel/cms.env
CMS_DROPIN_DIR=/etc/systemd/system/opal-hotel.service.d
CMS_DROPIN=$CMS_DROPIN_DIR/20-opal-cms.conf
UNIT=/etc/systemd/system/opal-hotel.service
VHOST=/etc/nginx/sites-available/opal-hotel.conf
VHOST_LINK=/etc/nginx/sites-enabled/opal-hotel.conf
REPO=https://github.com/tarek-saad-dev/opal-hotel.git

die() { echo "[opal] ERROR: $*" >&2; exit 1; }
log() { echo "[opal] $*"; }
(( EUID == 0 )) || die "Run with sudo/root."
[[ "$DOMAIN" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}$ ]] || die "Provide an actual domain name."
[[ "$DOMAIN" != "opal-legacy.luxor-hotels-eg.com" ]] || die "Cannot use the third-party listing domain."
for cmd in git node npm nginx systemctl curl ss runuser; do
  command -v "$cmd" >/dev/null || die "Missing prerequisite: $cmd"
done
(( $(node -p 'process.versions.node.split(".")[0]') >= 22 )) || die "Node 22+ required."
[[ -d /etc/nginx/sites-available && -d /etc/nginx/sites-enabled ]] || die "Missing Nginx sites-available / sites-enabled."

# Reject any unrelated existing service or virtual host.
if [[ -e "$UNIT" ]] && ! grep -Fq "Managed by Opal Hotel" "$UNIT"; then
  die "opal-hotel.service already exists and is managed elsewhere."
fi
if [[ -e "$VHOST" ]] && ! grep -Fq "Managed by Opal Hotel" "$VHOST"; then
  die "opal-hotel.conf exists and is managed elsewhere."
fi
if [[ -e "$VHOST" ]] && ! grep -Fq "server_name $DOMAIN;" "$VHOST"; then
  die "Existing Opal host is configured for another domain; refusing silent overwrite."
fi
if [[ ! -e "$VHOST" ]] && nginx -T 2>/dev/null | grep -F "server_name $DOMAIN" >/dev/null; then
  die "Domain $DOMAIN already configured in another Nginx site."
fi
if [[ ! -e "$UNIT" ]] && ss -Hltn "sport = :$PORT" | grep . >/dev/null; then
  die "Internal port $PORT is already occupied. Choose a free port in the script."
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --no-create-home --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
fi
install -d -o "$APP_USER" -g "$APP_USER" -m 0755 "$APP_DIR"
# Owner CMS data and uploads are intentionally OUTSIDE the Git checkout:
# git reset --hard or a future deployment cannot erase published content.
install -d -o "$APP_USER" -g "$APP_USER" -m 0700 "$CMS_DIR"
install -d -o root -g root -m 0700 "$CMS_CONFIG_DIR"
if [[ ! -f "$CMS_ENV" ]]; then
  # One-time strong credentials. Never display or commit them in logs.
  ADMIN_PASS="$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('base64url'))")"
  SESSION_KEY="$(node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64url'))")"
  (
    umask 077
    printf 'OPAL_CMS_ADMIN_PASSWORD=%s\nOPAL_CMS_SESSION_SECRET=%s\nOPAL_CMS_PUBLIC_ORIGIN=https://%s\n' \
      "$ADMIN_PASS" "$SESSION_KEY" "$DOMAIN" > "$CMS_ENV"
  )
  chmod 0600 "$CMS_ENV"
  unset ADMIN_PASS SESSION_KEY
  log "Owner CMS environment created at $CMS_ENV (root-only)."
  log "To retrieve the one-time owner password on the VPS, run: sudo grep '^OPAL_CMS_ADMIN_PASSWORD=' $CMS_ENV"
fi
if [[ ! -d "$APP_DIR/.git" ]]; then
  [[ -z "$(find "$APP_DIR" -mindepth 1 -print -quit)" ]] || die "Application directory is not empty."
  log "Cloning repository..."
  runuser -u "$APP_USER" -- git clone -q -b main "$REPO" "$APP_DIR"
fi
[[ "$(runuser -u "$APP_USER" -- git -C "$APP_DIR" remote get-url origin)" == "$REPO" ]] ||
  die "Refusing to modify an unrelated repository."
log "Updating main and compiling..."
runuser -u "$APP_USER" -- git -C "$APP_DIR" fetch -q origin main
runuser -u "$APP_USER" -- git -C "$APP_DIR" reset --hard FETCH_HEAD
runuser -u "$APP_USER" -- bash -c 'cd /var/www/opal-hotel && npm install --no-audit --no-fund && npm run build'

if [[ ! -e "$UNIT" ]]; then
  cat >"$UNIT" <<'SYSTEMD'
# Managed by Opal Hotel
[Unit]
Description=Opal Legacy Hotel - Next.js production
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=opalhotel
Group=opalhotel
WorkingDirectory=/var/www/opal-hotel
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
Environment=OPAL_CMS_DATA_DIR=/var/lib/opal-hotel-cms
EnvironmentFile=/etc/opal-hotel/cms.env
UMask=0077
ExecStart=/usr/bin/env npm run start -- -H 127.0.0.1 -p 3418
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SYSTEMD
fi
# Apply the CMS settings to existing Opal-managed units regardless of their layout.
# A separate managed drop-in avoids rewriting an older service's directives.
if [[ -e "$CMS_DROPIN" ]] && ! grep -Fq "# Managed by Opal Hotel CMS" "$CMS_DROPIN"; then
  die "Existing CMS systemd override is not Opal-managed; refusing overwrite."
fi
install -d -o root -g root -m 0755 "$CMS_DROPIN_DIR"
cat >"$CMS_DROPIN" <<'SYSTEMD_CMS'
# Managed by Opal Hotel CMS
[Service]
Environment=OPAL_CMS_DATA_DIR=/var/lib/opal-hotel-cms
EnvironmentFile=/etc/opal-hotel/cms.env
UMask=0077
SYSTEMD_CMS

log "Starting production service..."
systemctl daemon-reload
systemctl enable --now opal-hotel.service
systemctl restart opal-hotel.service

READY=0
for attempt in $(seq 1 25); do
  if curl -fsS --max-time 2 "http://127.0.0.1:$PORT/en" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done
(( READY == 1 )) || { systemctl --no-pager status opal-hotel.service || true; die "Local health check failed. Nginx has not been changed."; }

if [[ ! -e "$VHOST" ]]; then
  cat >"$VHOST" <<'NGINX'
# Managed by Opal Hotel
server {
    listen 80;
    listen [::]:80;
    server_name __OPAL_DOMAIN__;

    access_log /var/log/nginx/opal-hotel.access.log;
    error_log /var/log/nginx/opal-hotel.error.log warn;
    client_max_body_size 8m;

    location / {
        proxy_pass http://127.0.0.1:3418;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
NGINX
  sed -i "s/__OPAL_DOMAIN__/$DOMAIN/" "$VHOST"
  ln -s "$VHOST" "$VHOST_LINK"
  if ! nginx -t; then
    rm -f "$VHOST_LINK" "$VHOST"
    die "Nginx configuration rejected; rolled back only the new Opal site."
  fi
  systemctl reload nginx
else
  nginx -t || die "Nginx validation failed."
fi

log "Next.js is healthy on localhost:$PORT; dedicated host http://$DOMAIN/en configured."
if [[ -v OPAL_SSL_EMAIL ]] && [[ -n "$OPAL_SSL_EMAIL" ]]; then
  command -v certbot >/dev/null || die "Certbot missing; app is running, but TLS was not enabled."
  log "Enabling HTTPS..."
  certbot --nginx --non-interactive --agree-tos --email "$OPAL_SSL_EMAIL" --redirect -d "$DOMAIN" ||
    die "HTTPS failed. Confirm DNS A record points to this VPS, then retry."
  log "Website online: https://$DOMAIN/en and https://$DOMAIN/ar"
else
  log "To enable HTTPS after DNS is configured: sudo OPAL_SSL_EMAIL=admin@yourdomain.com bash ops/deploy-vps.sh $DOMAIN"
fi
log "Service: opal-hotel.service. All other applications untouched."

# Opal Legacy — Direct VPS Production Deploy

**One production environment. No staging. No Docker. No additional database.**

This project runs as an independent Next.js systemd service behind a dedicated Nginx virtual host on the existing Ubuntu VPS.

## Isolation / prerequisites
- Ubuntu VPS with `node` **22+**, `npm`, `git`, `nginx`, `curl`, `ss`, `systemctl` and `certbot` installed.
- The server already hosts other projects. Never change their systemd units, Nginx vhosts or SQL databases.
- Independent service: `opal-hotel.service`; directory: `/var/www/opal-hotel`.
- Internal-only listener: `127.0.0.1:3418` (installer refuses to use a port that is already occupied). No new inbound firewall ports.
- Pick a **new domain owned by the hotel**. The third-party listing domain is not ours. Point its A record at the VPS IP in the domain's DNS console first.

## One-time deploy (in the VPS root shell)

Replace `YOUR-OPAL-DOMAIN` and email with the correct values:

```bash
curl -fsSL https://raw.githubusercontent.com/tarek-saad-dev/opal-hotel/main/ops/deploy-vps.sh -o /tmp/deploy-opal.sh
sudo OPAL_SSL_EMAIL=admin@YOUR-OPAL-DOMAIN bash /tmp/deploy-opal.sh YOUR-OPAL-DOMAIN
```

The script uses the public GitHub repo, compiles Next.js as the restricted `opalhotel` Unix user, starts and health-checks an isolated service, creates only `opal-hotel.conf`, validates Nginx, and requests Let's Encrypt HTTPS if `OPAL_SSL_EMAIL` was supplied.

## Checks

```bash
sudo systemctl status opal-hotel.service --no-pager
curl -I http://127.0.0.1:3418/en
sudo nginx -t
```

Open `https://YOUR-OPAL-DOMAIN/en` and `https://YOUR-OPAL-DOMAIN/ar` once TLS and DNS are ready.

## Updates

Execute the same two commands to pull the latest `main` branch, rebuild and restart the same production service. There is no staging environment.

## Important
- Current UI is **preview-quality content on a production server**, not a launched booking service.
- Unsplash photos are illustrative and must not be represented as Opal Legacy photos. UI labels them as previews.
- Booking, pricing, contact messages, reviews and payment are not connected. Search indexing remains deliberately disabled until publication is approved.
- No real deployment has occurred merely because these files exist. A VPS administrator must run the command from their authenticated server session.
- No server SSH credentials or private keys should be pasted into this repository or ChatGPT.

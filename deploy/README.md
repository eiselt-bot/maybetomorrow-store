# MaybeTomorrow.store — Deployment Guide

Target host: **mahelya** (IONOS VPS, `87.106.127.232`, Ubuntu 24.04 LTS)
App directory: `/home/claude-admin/maybetomorrow-store`
App port: `3003` (PM2 app name `mt-store`)
Domain: `maybetomorrow.store` + wildcard `*.maybetomorrow.store`

This guide walks through a clean first-time deployment. Subsequent deploys are
handled by `scripts/deploy.sh` (build + `pm2 reload`).

---

## 1. Register the domain at IONOS

1. Log in to the IONOS control panel.
2. Register `maybetomorrow.store` (Top-Level-Domain `.store`, ~18 EUR/year).
3. Wait for the domain to appear under **Domains & SSL → Domains**.

---

## 2. Configure DNS records

In the IONOS DNS manager for `maybetomorrow.store`, add:

| Type  | Host | Value            | TTL |
|-------|------|------------------|-----|
| A     | `@`  | `87.106.127.232` | 3600 |
| A     | `*`  | `87.106.127.232` | 3600 |
| AAAA  | `@`  | *(optional, IPv6)* | 3600 |

The wildcard `*` record is what allows `shoezaa.maybetomorrow.store`,
`bakery.maybetomorrow.store`, and every other tenant subdomain to resolve
without extra config.

Verify propagation:

```bash
dig +short maybetomorrow.store
dig +short shoezaa.maybetomorrow.store
# both should return 87.106.127.232
```

---

## 3. Install certbot + the IONOS DNS plugin

A **wildcard** certificate requires the DNS-01 challenge — http-01 cannot
validate `*.maybetomorrow.store`. The community plugin
[`certbot-dns-ionos`](https://github.com/helgeerbe/certbot-dns-ionos) uses the
IONOS API to provision the `_acme-challenge` TXT record automatically.

```bash
sudo apt update
sudo apt install -y certbot python3-pip
sudo pip install certbot-dns-ionos --break-system-packages
# (or use pipx / a venv if you prefer to keep system Python clean)
```

---

## 4. Create IONOS API credentials

1. Go to <https://developer.hosting.ionos.com/> → **API Keys** → create a new
   key. IONOS returns a **public prefix** and an **API secret**.
2. Store them on mahelya in `/etc/letsencrypt/ionos.ini`:

```ini
# /etc/letsencrypt/ionos.ini
dns_ionos_prefix  = YOUR_PUBLIC_PREFIX
dns_ionos_secret  = YOUR_API_SECRET
dns_ionos_endpoint = https://api.hosting.ionos.com
```

3. Lock it down — certbot refuses to use it otherwise:

```bash
sudo chmod 600 /etc/letsencrypt/ionos.ini
sudo chown root:root /etc/letsencrypt/ionos.ini
```

---

## 5. Issue the wildcard certificate

```bash
sudo certbot certonly \
  --dns-ionos \
  --dns-ionos-credentials /etc/letsencrypt/ionos.ini \
  --dns-ionos-propagation-seconds 120 \
  -d 'maybetomorrow.store' \
  -d '*.maybetomorrow.store' \
  --agree-tos \
  -m admin@maybetomorrow.store \
  --no-eff-email
```

On success, the cert lands at:

- `/etc/letsencrypt/live/maybetomorrow.store/fullchain.pem`
- `/etc/letsencrypt/live/maybetomorrow.store/privkey.pem`

Certbot installs a systemd timer (`certbot.timer`) that renews automatically.
Verify with:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

> **Manual fallback:** if you cannot use `certbot-dns-ionos`, you can issue the
> cert with `--manual --preferred-challenges dns` and copy the `_acme-challenge`
> TXT records into the IONOS DNS manager by hand. Remember to also set up a
> `--manual-auth-hook` if you want auto-renewal.

---

## 6. Install the Nginx vhost

```bash
# From inside /home/claude-admin/maybetomorrow-store
sudo cp deploy/nginx-maybetomorrow.conf /etc/nginx/sites-available/maybetomorrow
sudo ln -sf /etc/nginx/sites-available/maybetomorrow /etc/nginx/sites-enabled/maybetomorrow

# Validate and reload.
sudo nginx -t
sudo systemctl reload nginx
```

> The vhost file lives **inside the project repo** (`deploy/`) so it's
> version-controlled. The copy into `/etc/nginx/sites-available/` is the
> runtime copy — don't edit it in place; edit the repo file and copy again.

---

## 7. Create the uploads directory

Uploaded files are served by Nginx directly from a path outside the project
tree, so `npm run build` and `pm2 reload` never touch user data:

```bash
sudo mkdir -p /var/mt-store/uploads
sudo chown claude-admin:claude-admin /var/mt-store/uploads
sudo chmod 755 /var/mt-store/uploads
```

The location is set via `UPLOAD_DIR=/var/mt-store/uploads` in `.env` and
served to the public at `/uploads/` via the Nginx `alias` directive.

---

## 8. First-time build + PM2 start

```bash
cd /home/claude-admin/maybetomorrow-store

# Install production dependencies (use `npm ci` for a reproducible install).
npm ci

# Push the Drizzle schema to Postgres (only needed the first time, or after
# schema changes).
npm run db:push

# Optional: seed demo data.
npm run db:seed

# Build the standalone Next.js bundle.
npm run build

# Start under PM2 and persist across reboots.
pm2 start ecosystem.config.js
pm2 save
```

Verify:

```bash
pm2 status mt-store
curl -I http://127.0.0.1:3003
curl -I https://maybetomorrow.store
```

The last command should return `HTTP/2 200` (or a redirect from the root page).

---

## 9. Subsequent deploys

Pull the latest code, then run the idempotent deploy script:

```bash
cd /home/claude-admin/maybetomorrow-store
git pull
./scripts/deploy.sh
```

`deploy.sh` runs `npm run build` and either `pm2 reload` (if `mt-store` is
already running) or `pm2 start` (first-time start on a fresh server).

---

## 10. Local subdomain testing (developer machines)

The production vhost accepts any `*.maybetomorrow.store` subdomain. To test the
same behavior locally against `next dev -p 3003`, add an entry to your dev
machine's `/etc/hosts`:

```
# /etc/hosts  (on your laptop, NOT on mahelya)
127.0.0.1    shoezaa.localhost
127.0.0.1    bakery.localhost
127.0.0.1    claurice.localhost
```

Then browse to `http://shoezaa.localhost:3003`. Next.js will receive the
original `Host: shoezaa.localhost` header, and your tenant-resolution
middleware can strip the `.localhost` suffix the same way it strips
`.maybetomorrow.store` in production.

> On Windows, the hosts file lives at
> `C:\Windows\System32\drivers\etc\hosts` and requires Administrator to edit.
> On macOS/Linux: `/etc/hosts` (edit with `sudo`).

---

## 11. Troubleshooting

| Symptom | Where to look |
|---|---|
| 502 Bad Gateway | `pm2 logs mt-store` — the Node process is probably dead or still building. |
| SSL cert expired | `sudo certbot renew` + check `sudo systemctl status certbot.timer`. |
| Wrong tenant resolved | Check `X-Forwarded-Host` is reaching Next.js — `curl -v` a subdomain and inspect the headers the upstream sees. |
| Uploads return 404 | Verify `/var/mt-store/uploads/` exists and is owned by `claude-admin`. |
| `nginx -t` fails after edit | Re-copy the file from `deploy/nginx-maybetomorrow.conf`; don't hand-edit the `/etc/nginx/` copy. |

---

## 12. Rollback

PM2 keeps the previous deployment in memory until `pm2 reload` finishes, so a
failed deploy usually just means the old version keeps serving traffic. If a
broken build makes it to disk:

```bash
cd /home/claude-admin/maybetomorrow-store
git log --oneline -n 10          # find the last good commit
git checkout <good-sha>
./scripts/deploy.sh
```

For a DB rollback, restore the latest dump from mahelya's nightly Postgres
backups (see `memory/server-mahelya.md`).

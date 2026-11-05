# Current deployment step — sample preview and payment sandbox

No live tender collector is required for this step. Use a separate `app.bidata.uz` preview. Real-money payments stay blocked with sample data.

## Server preflight and app installation

From a clean reviewed checkout on the **Hetzner server**:

```bash
sudo bash scripts/deploy-hetzner.sh app.bidata.uz --check
sudo bash scripts/deploy-hetzner.sh app.bidata.uz
```

Prerequisites: system-installed Node 24, Git, curl, systemd and ss. The script stops if a prerequisite is missing, port 8187 is busy, or its app/data/service paths already exist. It does not replace an existing Node runtime, change Nginx/DNS or open a public port. It creates the dedicated service and checks the backend on loopback port **8187**. This script has been syntax checked; it has not been executed on Hetzner.

For this script's port, use `proxy_pass http://127.0.0.1:8187;` in the separate HTTPS vhost. The manual example below uses 8080; choose one method and keep the service/vhost ports consistent. Inspect the server's actual Nginx location first (aaPanel may not use `/etc/nginx`). HTTPS and domain routing must be configured before logging in from the public app URL.

## Stripe sandbox configuration

After connecting the correct Stripe account, create two **test-mode** recurring flat prices (monthly and yearly), with test amounts explicitly chosen by the owner. Configure the test customer portal. Put secrets directly into the server's private `.env`, never GitHub or chat:

```dotenv
PAYMENTS_ENABLED=true
BILLING_MODE=test
STRIPE_SECRET_KEY=<test secret key, entered privately on server>
STRIPE_PRICE_MONTHLY=<test monthly price ID>
STRIPE_PRICE_YEARLY=<test yearly price ID>
```

Restart `bidata-web` and verify `/api/config` reports `billingMode: test`. The subscription screen must show the test-only notice. Register a disposable test account; test successful payment, decline, cancellation, account isolation, return from Checkout and portal management with Stripe's official sandbox data. Confirm actual status in Stripe, not only the return URL. No Stripe account connection or credentials are available to this project by default. Sandbox transactions have not yet been exercised against Stripe.

Switching between Stripe test and live environments requires a separate account database/customer mapping; do not reuse test customers in live mode. Keep separate deployments and DB files for preview and production.

---

# Hetzner deployment

This guide has **not** been run on the user's server. The current production site remains unchanged. Suggested first deployment: `app.bidata.uz`, preserving the existing `bidata.uz` landing page and `social.bidata.uz` services.

## Prerequisites

- Current source checked out from the reviewed branch/release.
- Node 24 LTS installed and available at `/usr/bin/node` (verify with `command -v node`).
- A dedicated unprivileged `bidata` user, app checkout in `/opt/bidata-web-app` and persistent data directory `/var/lib/bidata` writable only by that user.
- DNS A record for the chosen new subdomain pointing at the existing server. Do not replace other records.

Set server-only `/opt/bidata-web-app/.env` permissions to 600, owned by `bidata`. Set:

```dotenv
PUBLIC_ORIGIN=https://app.bidata.uz
HOST=127.0.0.1
PORT=8080
DATABASE_PATH=/var/lib/bidata/bidata.sqlite
DATA_MODE=sample
PAYMENTS_ENABLED=false
```

Use sample mode for the initial private preview. Do not commit `.env`, production data or database files. Replace the sample mode only after connecting a validated feed.

## systemd unit

Save as `/etc/systemd/system/bidata-web.service` after confirming paths and that port 8080 is free:

```ini
[Unit]
Description=Bidata web application
After=network.target

[Service]
Type=simple
User=bidata
Group=bidata
WorkingDirectory=/opt/bidata-web-app
ExecStart=/usr/bin/node --env-file=.env server.mjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/bidata

[Install]
WantedBy=multi-user.target
```

Use a single Node process for this version. Monitor CPU/storage, back up SQLite consistently using SQLite backup tooling, test restore, restrict database permissions and establish deletion/retention procedures. The app intentionally ignores forwarded request headers; its built-in IP rate limiter groups requests behind Nginx, so add an appropriate Nginx edge rate policy before scaling public traffic. Do not expose port 8080 publicly.

## Separate Nginx vhost

Inspect current Nginx configuration first. Add a separate host, not a replacement for existing vhosts:

```nginx
server {
    listen 80;
    server_name app.bidata.uz;
    client_max_body_size 16k;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }
}
```

Check `nginx -t` before reload. Obtain an HTTPS certificate for the new host with the existing certificate-management method, configure HTTP→HTTPS redirection, then verify certificate renewal. The app requires `PUBLIC_ORIGIN` to exactly match the external HTTPS origin for cookie/CSRF security. Do not make credentials or tokens public to troubleshoot it.

## Acceptance before public release

1. `npm run check` and `npm test` pass on Node 24.
2. Test register/login/logout and per-account saved items/profile/stages on iPhone Safari and desktop. Add email verification and password recovery before public account onboarding.
3. Confirm HTTPS, secure HttpOnly cookie, exact origin checks, icon and Home Screen launch. Test offline shell and honest unavailable-data behavior. Use no sensitive production data in previews.
4. Verify live feed provenance, refresh cadence, expired lots, duplicate handling, stable IDs and source links. All expired lots remain visible and are labelled expired; decide retention policy for production.
5. Publish actual privacy/terms/refund/support details. Select a merchant/payment provider with business eligibility confirmed; configure test prices and portal. Test checkout, abandoned checkout expiry, duplicate attempts, cancellation, renewal, decline, refund policy and provider outage without live charges.
6. Review security, privacy, logs, backups, account deletion and operational monitoring. This initial app has no email delivery, background push, AI pricing or automated bidding.
7. Only then enable real payments and invite paying users.

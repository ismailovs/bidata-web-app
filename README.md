# Bidata web app

An iPhone-installable PWA for Uzbekistan tender discovery. Runs on the existing Hetzner server with Node 24; no Mac, Xcode, native build, or runtime npm dependencies required.

## Implemented

- Responsive dark dashboard matching Bidata's existing blue branding; Uzbek Cyrillic and Russian interfaces.
- Tender search, region/category filters, deadline/value sorting and source links.
- Email/password accounts, salted scrypt password hashes and server-side SQLite sessions in HttpOnly cookies.
- Per-account saved tenders, company keyword/region preferences and deterministic matching (not an AI score).
- Saved-tender workflow: review → preparing → submitted → won/lost. Stages are manually recorded; the app does not submit bids.
- Refresh every 60 seconds while visible, plus foreground reconnect refresh and new-result notices. This is polling, not a background realtime push service.
- PWA manifest, PNG home-screen/maskable icons, Safari installation guide and offline application shell. API/account/tender responses are never service-worker cached.
- Configurable Stripe monthly/yearly hosted Checkout, billing portal and server-verified Pro CSV export. Prices are retrieved from Stripe; no invented sales prices.

## Run locally

Requires **Node 24 LTS** with built-in `node:sqlite`.

```bash
cp .env.example .env
npm start
```

Open http://localhost:8080. No `npm install` step is needed.

```bash
npm run check
npm test
```

Tests cover test/live billing separation, sample sandbox checkout, account lifecycle, CSRF, rate limiting, user data isolation, workflow/profile persistence, live-feed validation, sample-payment blocking, server-owned customer/price binding and paid export authorization with a mocked Stripe API. They do not charge cards or certify sandbox integration.

## Current status

The supplied repository originally contained only a README. No existing backend or live data contract was available. The default mode therefore shows **explicitly labelled sample tenders**, not scraped or simulated live opportunities. Accounts/bookmarks/profile/workflow work against the local database. Sample buyer names and dates have no commercial meaning.

Payment integration is implemented but **disabled by default**. Stripe test mode can run with sample tenders. Real-money payment setup, production legal pages, account recovery/email verification and production release review remain outstanding. Do not advertise production readiness or collect public customer accounts until these are complete. No production domain, DNS, Nginx or existing Bidata files were changed.

## iPhone installation

After HTTPS deployment, open the app in Safari → Share → Add to Home Screen → Add. Standalone mode uses the Bidata icon. Offline you can open the shell, but tenders and account actions require a connection. Background alerts require a separate Web Push/Telegram/email implementation.

## Live tender feed

Connect your existing authorized data collector by atomically writing `TENDERS_FILE` to a new file and renaming it into place. Set `DATA_MODE=live`. Format:

```json
{
  "updatedAt": "2026-11-04T12:00:00Z",
  "tenders": [
    {
      "id": "uzex-12345",
      "title": "Tender title",
      "buyer": "Buyer organization",
      "region": "Тошкент",
      "category": "Электр",
      "amount": 245000000,
      "currency": "UZS",
      "deadline": "2026-11-20T12:00:00+05:00",
      "source": "UZEX",
      "sourceUrl": "https://your-authorized-source.example/lot/12345"
    }
  ]
}
```

Use actual source URLs, source-derived buyer names and stable source-prefixed IDs. The timestamp must reflect a successful source refresh, not merely a local file rewrite. Files older than `FEED_MAX_AGE_HOURS` (24 by default), duplicate IDs, invalid amounts, non-HTTPS source URLs and missing feeds fail closed with 503; they never fall back to samples. Choose a shorter freshness threshold after measuring source reliability. This file adapter is intended for a small initial feed; large feeds need indexed storage, pagination and source-specific importers.

## Payments

Stripe is an initial provider adapter, not an assertion that a merchant account or local payment methods already exist. The merchant must confirm their account/business eligibility and supported payment methods. A Click/Payme adapter would be separate work; neither is falsely presented as available.

Configure test credentials and recurring Price IDs in the server `.env` only. Add real HTTPS privacy/terms URLs and support email. For sandbox testing with sample tenders, set `BILLING_MODE=test`, `PAYMENTS_ENABLED=true` and a `sk_test_` key. The UI explicitly labels test mode. No live feed or legal URLs are required for test-only checkout. Never use real card details in test mode. For real payments set `BILLING_MODE=live` and a `sk_live_` key; a validated live feed and the reviewed legal/support configuration are still required. A mismatched key/environment disables checkout. Both prices must be active recurring flat prices, one month / one year. Configure the Stripe customer portal and terms URL in Stripe Dashboard.

- Checkout receives only a server-allowed plan ID, never a client-selected customer, amount or price.
- Stripe customer IDs are attached to the signed-in account. Deterministic idempotency prevents duplicate customer creation. An in-process billing lock and open-checkout guard reduce duplicate subscriptions. This version is a **single Node process**, not a multi-replica billing deployment.
- Returning to `?checkout=returned` never grants Pro. The server reads the customer's subscription status directly from Stripe on `/api/me` and each protected export. Only allowed active/trialing subscriptions without paused collection qualify.
- Cancellation, expiration and failed-payment status changes are reflected on the next server check. A provider outage fails paid requests closed. This pull-based implementation has no webhook endpoint or webhook-driven entitlement cache.
- Prices come from Stripe. Card data is entered on hosted Checkout, never in this app.
- Stripe portal handles cancellation/payment method changes. Public-launch refund policy, tax configuration, customer support and sandbox renewal/cancellation tests are still required.
- This version does not implement global full-refund access revocation for a still-active Stripe subscription. Handle refunds and subscription cancellation together in your billing operations, or implement a tested webhook-based refund policy before launch.

## Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Keep this application separate from the current marketing page (for example `app.bidata.uz`) until reviewed. Do not change existing `social.bidata.uz` or mail DNS. The example deploys a separate service behind Nginx and uses HTTPS.

## Direction inspired by Autopilot

See [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md) for the source-backed priorities and the boundary between current features and future marketplace integrations.

## Automated updates from GitHub

See [docs/GITHUB_DEPLOYMENT.md](docs/GITHUB_DEPLOYMENT.md). The workflow validates main-branch code, uses a forced-command deployment account with pinned SSH host identity, preserves server settings/data and attempts code rollback on failed server health checks. One-time server setup, GitHub environment secrets, HTTPS and an explicit enable variable are required. Nothing deploys from feature branches or pull requests.

# Mizān — Step 1 (foundation)

Sharia-aware **disclosure intelligence & alerting**. Monitors expert / institutional
trade disclosures and attaches a Framework B (Hanbali) Sharia verdict to every security
before it reaches your feed.

Built on your standard stack: single-HTML frontend + Vercel serverless + Supabase +
cron-job.org. Runs **end-to-end on mock data today** — no paid API needed to see it work.

## What's in this repo

```
public/index.html            The Mizān app (single HTML file) — wired to /api/feed
api/feed.js                  GET disclosure feed (shape the UI expects)
api/watchlist.js             GET/POST tracked sources
api/login.js                 POST hash-based login -> token
api/poll-disclosures.js      CRON: ingest -> screen -> classify -> store (idempotent)
api/_lib/frameworkB.js       ⭐ Framework B engine (shared by API + frontend)
api/_lib/supabase.js         Supabase service-role client
api/_lib/auth.js             hash + token helpers
api/_lib/sources/mock.js     mock disclosure source  (swap -> quiver.js)
api/_lib/sources/quiver.js   real source stub (Quiver)
api/_lib/screening/mock.js   mock Sharia-screening data (swap -> zoya.js)
api/_lib/screening/zoya.js   real screening stub (Zoya / Halal Terminal)
supabase/schema.sql          tables + RLS + seed data
scripts/hash.js              generate ADMIN_PASSWORD_HASH
test/frameworkB.test.js      engine self-test (npm test)
```

## The pipeline (same shape as the farm app's sensor loop)

```
cron-job.org ──► /api/poll-disclosures ──► source ──► screening ──► Framework B ──► Supabase
                                                                                      │
                        public/index.html ◄──────── /api/feed ◄───────────────────────┘
```

## Setup (≈15 min)

**1. Push to a repo** (mirror of `TheWaseelFarm/GreenHouse`), e.g. `TheWaseelFarm/Mizan`.

**2. Supabase** → open the project → SQL editor → paste and run `supabase/schema.sql`.
It creates the tables, enables RLS, and seeds 8 sample disclosures + 5 sources.
Copy the **Project URL**, **service_role key**, from Settings → API.

**3. Make your password hash locally:**
```bash
AUTH_SALT=<your-salt> node scripts/hash.js "<your-password>"
```
Copy the printed hash.

**4. Import the repo into Vercel** and set Environment Variables (see `.env.example`):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
`AUTH_SALT` (same salt as step 3), `AUTH_SECRET`, `CRON_SECRET`. Leave `QUIVER_API_KEY`
and `SCREENING_API_KEY` blank for now. Deploy.

**5. Open your Vercel URL.** The feed loads from Supabase (the seed). Done — it's live.

**6. Cron** → on cron-job.org add a job hitting, every 5 minutes:
```
https://<your-app>.vercel.app/api/poll-disclosures?secret=<CRON_SECRET>
```
On the mock source this is idempotent (first run inserts, later runs insert 0).

## Verify the engine
```bash
npm install
npm test
```

## Going from mock → real (Step 2)
- **Disclosures:** implement `api/_lib/sources/quiver.js`, set `QUIVER_API_KEY`, and change
  the import in `api/poll-disclosures.js` from `./sources/mock.js` to `./sources/quiver.js`.
- **Screening:** implement `api/_lib/screening/zoya.js` (or Halal Terminal), set
  `SCREENING_API_KEY`, swap the import. **Feed it raw inputs** (business activity,
  impure-income %, debt ratio) and let `frameworkB.js` decide — never a vendor's pass/fail.
- **Push notifications:** add a channel (web-push via the PWA now; FCM/OneSignal for native)
  and record sends in `alerts_sent` inside `poll-disclosures.js`.

## Guardrails (do not skip before anything real ships)
- **Not a fatwa / not advice.** The verdict is an automated indicator; keep the disclaimer.
  Have the Framework B rules reviewed by a qualified scholar.
- **Secrets** live only in Vercel env vars. The `service_role` key must never reach the browser.
- **RLS** is on; tables are reachable only via the server (service role).
- Any security lacking screening data is treated as `watch` (manual review) — never defaulted to Clean.

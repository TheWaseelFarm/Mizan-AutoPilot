# Mizān — data sources & API map (for Mizān local)

This is the inventory to wire Mizān against real data when running it locally /
off AutoPilot. It maps **external market-data providers** onto Mizān's own
backend contract, so you know which adapter file each one fills and which env
key turns it on.

Mizān is **intelligence, not advice**. Everything below feeds the pipeline:

```
source (disclosures) ──► screening (raw ratios) ──► aaoifi.js (verdict) ──► Supabase
prices ──────────────────────────────────────────► performance.js (dual-anchor)
                                public/ terminal ◄── /api/feed, /api/prices
```

**Golden rule (keep it):** feed the screening engine **raw inputs** (debt,
cash, impure-income %, business activity) and let `api/_lib/aaoifi.js` decide —
**never store a vendor's pass/fail verdict**. The app screens **only** with
AAOIFI 30/30/5. Framework B is personal and stays out of the product.

---

## 1. External providers → Mizān roles

Mizān needs four kinds of data. Any of these providers can supply them; pick one
per role, drop a REST key in the matching env var, and point the adapter import
at it.

| Provider | Gives you | Mizān role | Adapter file / env |
| --- | --- | --- | --- |
| **Quiver Quant** | Congress trades, 13F institutional holdings, insider (Form 4), gov contracts, lobbying, dark pool, WSB sentiment | **Disclosures feed** — the closest match to Mizān's whole premise | `api/_lib/sources/quiver.js` · `QUIVER_API_KEY` |
| **Financial Modeling Prep (FMP)** | SEC/Congress filings **+** daily prices | **Disclosures _and_ prices** (what the repo wires today) | `api/_lib/sources/fmp.js`, `api/_lib/prices/fmp.js` · `FMP_API_KEY` |
| **Alpha Vantage** | `CONGRESS_TRADES`, `INSIDER_TRANSACTIONS`, `INSTITUTIONAL_HOLDINGS`; `TIME_SERIES_DAILY`, `GLOBAL_QUOTE`; `BALANCE_SHEET`, `INCOME_STATEMENT`, `COMPANY_OVERVIEW` | **One provider for all three**: disclosures + prices + raw financials to compute 30/30/5 | new `sources/alphavantage.js`, `prices/alphavantage.js`, `screening/alphavantage.js` |
| **Twelve Data** | `get_time_series`, `get_quote`; `get_financials`, `get_statistics`, `get_market_cap`, `get_company_info`; SEC/EDGAR, insider, institutional | **Prices** + **screening inputs** (debt / cash / income → ratios) | new `prices/twelvedata.js`, `screening/twelvedata.js` |
| **Zoya / Halal Terminal** | Pre-computed AAOIFI screen + ratios | Screening — **use the ratios, not the verdict** (see golden rule) | `api/_lib/screening/{zoya,halalterminal}.js` · `SCREENING_API_KEY`, `SCREENING_PROVIDER` |
| **Interactive Brokers (IBKR)** | `get_account_positions` (read-only holdings), `get_price_history` | The **read-only "My portfolio" rail** — the consent-based holdings import behind `HOLDING_FIELD {ticker, value}` (no orders, no copy-trading) | `public/app.js` import path (client-side lens) |
| **Bigdata.com** | Company/ETF tearsheets, `screen_companies`, sentiment, filings | Optional: qualitative business-activity screen + sentiment | — |
| **Supabase** | Tables, RLS, service-role client | Mizān's datastore | `api/_lib/supabase.js`, `supabase/schema.sql` |

**Purest screening path:** Twelve Data or Alpha Vantage financials →
compute debt/mcap, (cash+securities)/mcap, impure/revenue → `aaoifi.js`. Cleaner
than a vendor verdict, and it keeps AAOIFI as the single source of truth.

> MCP vs. app backend: the connectors above are also loaded as **MCP tools**,
> which let Claude (or you, in a session) pull live data directly — handy for
> **seeding your local Supabase** or spot-checking a ticker. The deployed app's
> backend, though, calls each provider's **REST API** from the adapter files and
> needs the provider's own key in the env var. Two rails, same providers.

---

## 2. Mizān's own API (what the terminal + crons consume)

### Read endpoints (the web terminal calls these)

| Endpoint | Returns |
| --- | --- |
| `GET /api/feed?performance=1&limit=400` | Disclosure feed in UI shape. Runs `classifyAAOIFI`, gates unscreened rows out by default (`?all=1` to include), joins cached prices for dual-anchor performance (`?performance=1`). `?limit` 50–1000. |
| `GET /api/prices` | **Cached** prices only `{ticker:{quote,history:[{d,c}]}}`. Never calls a provider on a user request. |
| `GET /api/follower-counts` | Public follower aggregate (rewrites to `/api/follows?counts=1`, see `vercel.json`). |
| `GET /api/smart-money?timeframe=30d&side=BUY&limit=25` | Net-flow board cache. |
| `GET /api/status` | Data-readiness probe — config booleans, row counts, verdict breakdown, portfolio depth. **No secret values.** |
| `GET /api/follows` · `GET /api/watchlist` · `GET /api/notifications` | Auth-gated per-user data. |
| `POST /api/login {username,password}` | Hash-based login → token. |

### Cron endpoints (ingest/refresh — guarded by `?secret=CRON_SECRET`)

| Endpoint | Fills | Needs |
| --- | --- | --- |
| `GET /api/poll-disclosures` | `disclosures` (+ screening cache): source → screening → `classifyAAOIFI` → upsert | `FMP_API_KEY` (else mock) |
| `GET /api/refresh-prices` | `prices` (charts + returns), batched to provider quota | `FMP_API_KEY` |
| `GET /api/rescreen` | `screenings` (AAOIFI verdicts), ≤25/run → `{done,remaining}` | `SCREENING_API_KEY` (else mock) |
| `GET /api/refresh-trends` | `smart_money_trends` materialized board | — |

### Engine `_lib` (pure, shared by API + frontend)

- `aaoifi.js` — ⭐ the AAOIFI Standard 21 "30/30/5" screen (single source of verdict truth)
- `performance.js` — dual-anchor return (`sinceDisclosed` / `sincePublic`, `disclosedClose`, freshness note)
- `trends.js`, `followers.js`, `auth.js`, `supabase.js`

---

## 3. Environment keys (`env.example`)

```
SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY     # datastore (service-role is SERVER-ONLY, never the browser)
ADMIN_USERNAME · ADMIN_PASSWORD_HASH · AUTH_SALT · AUTH_SECRET   # hash-based auth
CRON_SECRET                                  # protects the cron endpoints
FMP_API_KEY        # real disclosures (SEC/Congress) AND real prices
QUIVER_API_KEY     # alternative disclosure source
SCREENING_API_KEY · SCREENING_PROVIDER (halalterminal|zoya) · SCREENING_API_BASE
ANTHROPIC_API_KEY  # optional
```

Swap a provider: set its key, then change the import in the consuming file —
`poll-disclosures.js` for a source, `refresh-prices.js` for prices, the
`screening/index.js` selector for screening.

---

## 4. Going from mock → real (local)

1. **Supabase** — set `SUPABASE_*`, run `supabase/schema.sql` (tables + RLS + seed).
2. **Disclosures + prices** — set `FMP_API_KEY` (or swap in Quiver / Alpha Vantage /
   Twelve Data adapters), schedule the crons.
3. **Screening** — leave `SCREENING_API_KEY` blank to run the mock, or set it (or
   compute ratios from Twelve Data / Alpha Vantage financials) → `aaoifi.js`.
4. **Check** `GET /api/status` — it tells you at a glance whether you're serving
   real data or the embedded sample/pending state, and what's missing.

The app **never fabricates**: until a table is populated it shows a clearly
labelled *Sample* / *Pending* state, never a confident number over empty data.

---

## 5. Not part of Mizān

Other connectors loaded in-session (Bird, Gmail, Google Calendar, Speko, Health
Data Avatar, Strava) are **not** Mizān data sources. The `tahlil-sahm` skill is
the owner's personal **Framework B** (Hanbali screen) — out of the product per
`CLAUDE.md`; it is not a Mizān data source and must not drive app verdicts.

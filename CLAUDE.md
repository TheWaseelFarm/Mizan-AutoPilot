# Mizān — working notes for Claude Code

Mizān is a **Sharia-aware market-intelligence** app. It surfaces disclosed
portfolios and stocks (funds, officials, insiders), attaches an **AAOIFI
Standard No. 21** verdict to every name, and lets users make their own decision.
It is **intelligence, not advice** — never a brokerage, copy-trading, or a fatwa.

## The two frontends
- `public/` — the deployed **web terminal** (vanilla JS single file, **no build
  step**). `public/app.js` renders against the design-handoff CSS in
  `public/styles/*.css`. This is the product users see at the live URL.
- `mobile/` — Expo React Native app (native only).

## Non-negotiable product rules
1. **Performance-led hierarchy.** The disclosed return is the hero; Sharia
   compliance is a compact tag + filter that is *always shown* but never the
   loudest thing on screen.
2. **Semantic colour reservation.** Teal / amber / coral (the `--mz-*compliant*`
   hues) are RESERVED for the Sharia verdict. Performance and **all charts** use
   cobalt / ink only — a chart must never read as a verdict.
3. **AAOIFI 30/30/5** is the screen (see `api/_lib/aaoifi.js`). Interest-bearing
   debt < 30% of market cap, cash + interest-bearing securities < 30%,
   non-permissible income < 5% of revenue. 33% is the S&P/MSCI index
   methodology, **not** AAOIFI — do not conflate them.
4. **Informative, not just a data dump.** Synthesize a plain-language "read" +
   signal tags so a user can judge a setup at a glance.

## Global consistency rule — charts
**Every chart in the app is the ONE shared interactive component** — the
`chart()` function in `public/app.js` (styled by `.mz-chart*` in
`public/index.html`). No chart may be a static image or a non-interactive SVG.
All charts behave identically:

- **Interactive scrub** — one global pointer + touch handler (`chartScrub`)
  drives every `.mz-chart[data-series]`. Dragging/hovering reveals the value +
  date at that point via a single floating tooltip (`.mz-chart-tip`), a
  crosshair (`.mz-chart__cx`) and a dot (`.mz-chart__dot`).
- **Respects the active timeframe** (1W … All) via `sliceTf()` reading `S.tf`.
- **Neutral styling** — cobalt line, ink dashed compare line; never a verdict hue.
- **Graceful empty state** — under 2 points renders `.mz-chart__empty`
  ("Pending" / "—"), never a broken axis.

Variants are size-only via the `cls` option: `mz-chart--full` (detail drawers,
120px), `mz-chart--card` (mobile cards, 40px), `mz-chart--spark` (table rows,
28px). To add a chart anywhere, call `chart(sliceTf(series), { cls })` — do not
write a new renderer.

## Global consistency rule (STANDING — applies to every task)
Any change the owner requests applies to **every instance of that pattern across the
whole app**, not only the screen named in the brief. Before closing a task, find and
update ALL surfaces where the pattern appears (charts, badges, numbers, labels,
disclaimers, both detail screens, list rows + mobile cards, Following/Compare). List the
affected screens in the PR so coverage is auditable.

## Every number carries its context (STANDING)
No bare number may force the user to ask "of what? since when? vs what?".
- A **return** shows its timeframe and recomputes with the selector ("▲6.7% · 1M"); when
  price data is pending it shows the disclosed return marked "indicative", never a
  confident number over a Pending chart.
- A **holding** shows its weight (% of portfolio) and disclosure date.
- A **trade / activity row** shows amount + date + filing lag.
- Missing data shows "—" / "pending" — **never a fabricated figure**. Grammar agrees with
  count ("1 disclosure", "2 disclosures").

## Thin-data credibility (STANDING)
A "portfolio" must disclose **≥ `MIN_HOLDINGS` (3) distinct names** to appear in ranked
lists or be followable — a single-stock entry is misleading. When attraction data is
absent, lead with a signal that exists (rank by return, # filers), never a hollow
"— followers".

## Data interface
New backend-dependent fields are mapped once via the `FIELD` / `MIN_HOLDINGS` constants at
the top of `public/app.js` (marked TODO until the `/api/*` contract is frozen) — read
through those, don't scatter raw field names.

## Conventions
- No frontend build step; keep `public/` runnable by opening the file.
- Charts read only **cached** price data (`S.prices` from `/api/prices`); the
  app falls back to embedded sample data offline.
- After editing `public/app.js`, run `node --check public/app.js`.
- Engine self-test: `npm test`.

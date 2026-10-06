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
2. **Semantic colour reservation.** The verdict hues — teal / amber / coral, i.e.
   `--green` #2f7a58 / `--amber` / `--red` #b5524d and their `-soft` variants in
   `public/styles/tokens.css` — are RESERVED for the Sharia verdict and must
   **never** be used in a chart. **Charts** use vivid *market* green / red
   (`--mz-chart-up` #12a150 / `--mz-chart-down` #e5383b in `public/styles/app.css`)
   for price direction and buy / sell — deliberately brighter, distinct hues from the
   verdict tokens (owner decision 2026-10-05). Non-chart performance numbers stay
   cobalt / ink. A chart must never read as a verdict.
3. **AAOIFI 30/30/5** is the screen (see `api/_lib/aaoifi.js`). Interest-bearing
   debt < 30% of market cap, cash + interest-bearing securities < 30%,
   non-permissible income < 5% of revenue. 33% is the S&P/MSCI index
   methodology, **not** AAOIFI — do not conflate them. **The app screens ONLY with
   AAOIFI** (debt over 30% *fails* a name). "Framework B" is the owner's *personal*
   methodology (where debt is advisory, not disqualifying) and is **deliberately not
   in the product** — never reintroduce it, or debt-as-advisory, into the app.
4. **Informative, not just a data dump.** Synthesize a plain-language "read" +
   signal tags so a user can judge a setup at a glance.

## Global consistency rule — charts
**Every chart in the app is the ONE shared interactive component** — `chart()` in
`public/app.js` (styled by `.mz-chart*` / `.mz-lw-*` in `public/styles/app.css`),
upgraded in place by `mountTradeCharts()` to **TradingView Lightweight Charts
4.2.3** (`#lwjs` in `index.html`; keep v4 — v5 changed the markers API). Never a
static image, never a second renderer. All charts behave identically:

- **Two layers, one component.** `chart()` always renders the SVG chart + global
  scrub (`chartScrub`, `.mz-chart-tip`) and embeds what LW needs (`data-series`,
  `data-ohlc`, `data-marks`, `data-title`). LW mounts on EVERY size; if the library
  is missing/offline/throws, the SVG + scrub stay exactly as rendered (jsdom QA
  runs this path). Every re-render `remove()`s old instances and the observer.
- **Prices payload.** `/api/prices` returns **closes only** (`{d,c}`) for every
  ticker (Vercel caps a response at 4.5 MB; `test/prices-shape.test.js` guards
  it). The stock page fetches its one ticker's OHLCV via
  `/api/prices?ticker=X&ohlc=1` (`ensureOhlc`) — never put OHLCV back in the
  all-tickers payload.
- **Detail charts (`mz-chart--full`)** — **owner choice 2026-10-06: every chart,
  stock pages included, is the green/red area line** (`STOCK_CANDLES = false` in
  `public/app.js`, so `ensureOhlc` is not called). The candle path stays behind
  that switch: candlesticks + volume **only from real cached OHLC** (every point
  has o/h/l; never flat candles made from closes). The portfolio index is always a line. Edges are not
  pinned: the fit leaves ~28px each side so first/last-bar markers are whole.
  No in-canvas TradingView logo; the licence credit is a text link
  (`lwCredit()`, legend line / above the footer). TradingView-style
  legend (date · O H L C · change vs prior close), crosshair with axis labels,
  dated LTR time axis (also in Arabic), ticker watermark; drag pans, pinch /
  axis-drag zooms, the wheel and vertical swipes keep scrolling the page,
  double-click or ↺ resets.
- **Cards / sparks** — minimal LW line (no grid/axes/legend/zoom), crosshair
  drives the shared tooltip; mounted lazily (IntersectionObserver).
- **Trade markers (detail charts)** — one per (trade date, side) at the **trade
  date**: ▲ bought (market green, below), ▼ sold (market red, above), ● 13F "held
  at quarter end" (cobalt — neither buy nor sell; never "bought"). Trades outside the series are not drawn (snap ≤ 4 days).
  Marker text only where it fits (newest first, else "×N"). Hovering or tapping
  within ~10–16px of a marker opens the tooltip: per (side, trade date, public
  date) one head line with the **trade date and public (filing) date** + lag, then
  one line of names + amounts (4, 2 on phones, then "+N"); pinned above the chart
  on phones. One legend line under the chart (`tradeLegend(series, marks)`) counts
  buys / sells / 13F positions in the period with their date ranges.
- **Detail-chart extras (thinkorswim-like)** — Hi / Lo tags ("Hi 603.88" / "أعلى
  603.88") at the highest high / lowest low of the bars on screen (closes on a line,
  index value without $), recomputed on pan / zoom / timeframe / resize and never
  covering a trade marker (markers win; the tag moves or hides); very light vertical
  gridlines on the time ticks (months); last-value tag on the price axis + crosshair
  axis labels.
- **Respects the active timeframe** (1W … All) via `sliceTf()` reading `S.tf`.
- **Market colours (owner decision 2026-10-05)** — `--mz-chart-up` #12a150 /
  `--mz-chart-down` #e5383b, read from CSS vars (`getComputedStyle`) in JS and used
  as `var(...)` in the SVG fallback: candles + wicks + borders up green / down red,
  volume the same at 0.45 alpha; a line / area (portfolio index, cards, sparks,
  closes-only stock charts, SVG fallback) is green when the series on screen ends
  ≥ its start, red when lower, with the area fading to transparent; buy ▲ green,
  sell ▼ red, 13F ● cobalt; legend change values green / red. The last-value tag is
  the line's hue (candles: vs prior close, like the legend). The verdict tokens
  (`--green` / `--amber` / `--red`, teal / amber / coral) are **never** used in a
  chart; crosshair, grid, text, watermark and Hi / Lo tags stay ink / muted.
- **Graceful empty state** — under 2 points renders `.mz-chart__empty`
  ("Pending" / "—"), never a broken axis.

Variants are size-only via the `cls` option: `mz-chart--full` (detail pages,
300px / 240px phone), `mz-chart--card` (cards, 64px), `mz-chart--spark` (table
rows, 44px). To add a chart anywhere, call `chart(sliceTf(series), { cls,
markers, title })` — do not write a new renderer.

## Navigation
`go(path)` is the only way pages change: it saves the leaving page's `scrollY` into
its history entry (`replaceState`) and pushes `{from, fromLabel}`; `popstate`
re-renders and restores that scroll. `/stock/:t` and `/portfolio/:id` open with a
back link (`backLink()`, `.mz-back`, `data-back`): "← Back to {page}" →
`history.back()`, or on a deep link the parent list ("← Stocks" / "← Portfolios").
Every in-page link to a page carries `data-nav` / `data-open-stock` /
`data-open-portfolio` (handled by the delegated click listener) — never a bare
`<a href>` that reloads the app.

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

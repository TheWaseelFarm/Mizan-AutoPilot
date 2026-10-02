# Mizān terminal UI redesign

The web terminal uses a navy utility rail, slate surfaces, a single cobalt accent,
an offline Avenir/Segoe UI/Arabic system-font stack, tabular numbers, hairline
separators, and restrained elevation. Light and dark themes share the same token
system; appearance is selectable from the rail or Account and persists locally.

## Surface coverage

- Desktop shell: wordmark, utility rail, search, product tabs, page headings,
  filters, sorting, timeframes, result context, and menus.
- Portfolio and stock lists: a featured disclosed-return read, contextual returns,
  tables, mobile cards, shared interactive sparklines, and compact verdict tags.
- Net flow: disclosed buy/sell/net amounts with the shared interactive price chart,
  replacing the separate static flow-bar renderer.
- Stock detail: conclusion, return, attention facts, price chart, AAOIFI ratio meters
  with 30/30/5 threshold marks, and collapsible disclosure activity.
- Portfolio detail: conclusion, return, holdings index/stock drill-down, individual
  names' AAOIFI ratio meters (no averaged portfolio ratios), contextual holdings,
  personal-portfolio overlap, and collapsible activity.
- Compare: per-portfolio verdict tags, contextual returns, shared charts, and
  disclosure/allocation/purification evidence.
- Following, Alerts, Account: consistent list cards, empty states, holdings import,
  appearance/language controls, exposure labels, and methodology.
- Mobile: searchable top bar, bottom navigation, comparison tray, detail sheets,
  44px controls, and responsive evidence sections. All surfaces remain RTL-safe.

## Product and engineering invariants

`classify()` and `api/_lib/aaoifi.js` are byte-for-byte unchanged. Screening remains
AAOIFI only. Verdict hues are confined to screening labels/exposure/ratio evidence;
performance and price/index charts use cobalt and ink. All price/index charts use
one `chart()` renderer and its existing scrub/crosshair handlers. Normalized index
tooltips now say “index” rather than implying a dollar price.

Existing API paths/field names and embedded sample fallback remain intact. Cached
price history is read through `FIELD.priceHistory`. No frontend dependencies or
build step were added. Relative assets plus file-only hash navigation permit opening
`public/index.html` directly; hosted routes continue to use path navigation.

The existing two-name portfolio gate was corrected to the product bible's three-name
minimum, including the follow action on thin-data deep links. Missing ratio/amount
inputs render as pending/—. Conclusions now use the same timeframe return as the
number they describe; return labels, holding weights, disclosure dates, and filing
lags remain visible.

## Validation and environment limits

- `node --check public/app.js`: passed.
- AAOIFI engine self-test: passed (8 classification cases, 3 verification scenarios,
  purification).
- Independent performance (22), trends (8), notifications (7), followers (10)
  checks: passed.
- Offline Node render smoke: passed across 20 theme/language/screen combinations,
  both detail drawers, comparison, net flow, direct-file routing, six timeframes,
  pending ratios, and shared chart states. This is a render test, not a browser
  layout test.
- Light/dark token contrast checks: primary, muted, action, and verdict text pairs
  all exceed 4.5:1. CSS brace balance and `git diff --check`: passed.
- `npm test`: attempted; stops at the screening layer because the existing
  `@supabase/supabase-js` dependency is not installed. An offline installation was
  attempted, but the package is absent from the local cache. The dependency and
  tests were not replaced or stubbed to manufacture a pass.
- Browser screenshots/layout verification: blocked by the sandbox's WebKit process
  and filesystem permissions. Desktop/mobile browser review remains outstanding.

The shared checkout's `.git` is read-only in this sandbox. Source changes were made
in the shared workspace; the branch and commit are in the local repository copy at
`/private/tmp/mizan-ui-redesign`. A bundle is provided separately for transfer.
No push or GitHub command was run.

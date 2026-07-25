# Mizān Design Direction

## 1. Product character

Mizān is a Sharia-aware market-intelligence platform, not a brokerage. It should
feel like a simplified institutional terminal: credible, calm, compact,
transparent, and approachable.

Every experience should answer:

1. What changed?
2. Who acted?
3. How material is the disclosed activity?
4. How fresh is the evidence?
5. What is the Sharia assessment, and why?

## 2. Primary navigation

### Desktop

- A slim utility rail may contain Following, Alerts and Account.
- A persistent, prominent two-tab switch sits in the product header:
  **Portfolios | Stocks**.
- Global search, freshness, notifications and user access remain in the top bar.

### Mobile

Bottom navigation:

1. Portfolios
2. Stocks
3. Following
4. Alerts
5. Account

The Portfolios/Stocks switch should also remain visible at the top of the
product content to reinforce the primary mental model.

## 3. Portfolios tab

### Purpose

Rank, explore and compare disclosed portfolios belonging to institutions and
public officials.

### Interactive controls

- Subviews: Top performers, Most active, Most followed, Highest compliant allocation.
- Time periods: 1M, 3M, 6M, 1Y, 3Y, 5Y, All.
- Filters: portfolio type, market, disclosure freshness, Sharia exposure.
- Sort selection with an adjacent “Why this ranking?” explanation.
- Table/card view toggle.
- Saved views.
- Compare mode with checkboxes.
- Desktop comparison drawer.
- Mobile sticky “Compare N portfolios” tray.

### Ranking rows/cards

Show:

- Rank and identity.
- Filer type.
- Disclosed performance in blue/neutral.
- Activity count.
- Filing freshness.
- Sharia allocation composition.
- Purification exposure.
- Followers/follow action.

The Sharia allocation bar must have text or percentage labels in addition to
color.

## 4. Stocks tab

### Purpose

Explore disclosed accumulation, reductions, entries and exits at stock level.

### Interactive controls

- Subviews: Most bought, Most sold, New positions, Increased, Reduced, Exited.
- Time periods: 1W, 1M, 3M, 6M, 1Y, All.
- Filters: Sharia status, evidence strength, investor type, freshness, sector,
  market and followed only.
- Sort: evidence strength, disclosed value, recency, position-weight change,
  number of filers.
- Saved views.
- Row selection opens an evidence drawer on desktop.
- Mobile card opens a full stock intelligence page.

### Stock rows/cards

Show:

- Ticker, company and compact sparkline.
- Activity label.
- Evidence strength and “Why?” affordance.
- Number/type of filers.
- Disclosed value.
- Filing freshness.
- Performance since disclosure in blue/neutral.
- Sharia assessment.

## 5. Detail experiences

### Portfolio detail

- Identity, filer type and follow/alert controls.
- Disclosed track record with period and methodology.
- Current disclosed holdings.
- Recent entries, increases, reductions and exits.
- Average filing delay.
- Sharia allocation and purification exposure.
- Evidence/source links.
- Compare action.

### Stock intelligence detail

- Stock identity, price and neutral performance.
- Clear Sharia assessment with last review and methodology.
- “What the evidence shows” summary.
- Key intelligence metrics.
- Evidence timeline distinguishing transaction, filed and detected dates.
- Disclosure activity table/cards.
- Evidence-quality explanation.
- Compliance assessment and history.

## 6. Visual language

- Warm gray application canvas.
- White surfaces with thin borders.
- Deep ink typography.
- Cobalt for navigation, selection and performance.
- Teal, amber and coral only for Sharia states.
- Moderate radii, minimal shadow and dense but breathable spacing.
- Use a professional icon library; never use emoji or text symbols as icons.
- Avoid gradients, glassmorphism, excessive animation and oversized decorative cards.

## 7. Interaction behavior

- Hover: subtle cobalt-tinted surface, never a large lift animation.
- Selected row: cobalt border/left accent plus pale selection background.
- Focus: visible 3px focus ring.
- Drawers: 360–400px desktop side panel, modal sheet on mobile.
- Filter count: visible numeric badge.
- Applied filters: removable chips plus “Clear all”.
- Saved view: preserve time period, filters, sorting and table/card choice.
- Compare: disable until two valid items are selected.
- Loading: skeletons matching final geometry.
- Stale data: clear timestamp and neutral warning state.
- Errors: plain-language recovery action, never a raw technical error.

## 8. Responsive behavior

- `< 768px`: cards, bottom navigation, filter sheet, sticky compare tray.
- `768–1199px`: compact two-column layouts and collapsible utility rail.
- `>= 1200px`: table-first layouts, comparison/evidence side drawers.
- No horizontal page overflow.
- Tables may scroll inside a labelled container only when unavoidable.
- Minimum touch target: 44px.

## 9. Arabic and RTL

- Use logical CSS properties.
- Mirror layout and chevrons where meaning requires it.
- Keep tickers and market symbols left-to-right.
- Do not translate company names without an approved Arabic value.
- Ensure tabular numbers remain legible in mixed-direction text.

## 10. Content rules

Preferred:

- Review evidence
- Disclosed activity
- Evidence strength
- Set alert
- Follow
- Compliance assessment

Avoid:

- Buy now
- Sell now
- Recommended trade
- Guaranteed opportunity
- Fatwa

Concise disclosure:

> Based on delayed public disclosures. Information only—not investment advice,
> brokerage or a fatwa.


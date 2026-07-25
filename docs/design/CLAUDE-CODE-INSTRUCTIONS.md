# Instructions for Claude Code

Implement this design system in the current Mizān repository. You are the
single implementation owner.

## Important correction to previous architecture

Mizān has two dominant primary product tabs:

- **Portfolios**
- **Stocks**

Do not replace them with Today, Signals or Discover. Signals are contextual
intelligence inside Portfolios and Stocks. Following, Alerts and Account are
secondary utilities.

## Working method

1. Audit the existing framework, routes, components, styles, state and data.
2. Preserve all working business logic, filters, charts, data and user changes.
3. Integrate the CSS files in this handoff into the existing styling approach.
4. If the app uses CSS Modules, Tailwind, styled-components or another system,
   translate these tokens and patterns rather than layering conflicting systems.
5. Build reusable components; do not duplicate page-specific CSS.
6. Fix Vercel deep-link refreshes and stable URLs.
7. Implement real responsive behavior for mobile, tablet and desktop.
8. Implement English/Arabic architecture and RTL-safe layouts.

## Required reusable components

- App shell and utility rail.
- Primary Portfolios/Stocks switch.
- Global search and data freshness.
- Secondary tabs and time selector.
- Filter bar, filter sheet and applied chips.
- Saved-view control.
- Sort control and ranking explanation.
- Portfolio ranking table and mobile card.
- Stock activity table and mobile card.
- Compliance badge and allocation bar.
- Evidence-strength badge and explanation.
- Compare selection, drawer and mobile tray.
- Evidence drawer.
- Loading, empty, stale, partial-data and error states.

## Portfolios acceptance criteria

- Portfolios is a primary route and active navigation state.
- Subviews, time range, filters, sort, view toggle and saved views are interactive.
- Two or more portfolios can be selected and compared.
- Desktop comparison uses a drawer; mobile uses a sticky tray and comparison page/sheet.
- Performance and Sharia colors remain semantically separated.
- A “Why this ranking?” explanation exists.

## Stocks acceptance criteria

- Stocks is a primary route and active navigation state.
- Most bought/sold and position-change subviews are interactive.
- Filters, sorting and saved views work.
- Selecting a desktop row opens evidence detail without losing current filters.
- Mobile cards open a shareable stock detail route.
- Evidence, freshness and Sharia status are visible without opening the detail.

## Technical verification

- Run lint, type check, tests and production build.
- Test direct navigation and refresh on every primary and detail route.
- Verify approximately 375px, 768px, 1024px and 1440px widths.
- Verify RTL.
- Verify keyboard focus and screen-reader labels.
- Confirm there is no horizontal page overflow or console error.

At completion, report files changed, components created, routes changed, test
results, assumptions and any temporary calculations.


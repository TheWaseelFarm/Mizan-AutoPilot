# Mizān Enterprise UI Handoff

This package gives Claude Code the approved UX direction and a portable CSS
foundation for the existing Mizān application.

## Product architecture

Mizān has two dominant product tabs:

1. **Portfolios** — compare and explore disclosed portfolios.
2. **Stocks** — explore disclosed stock activity and its evidence.

Signals are contextual intelligence inside both tabs. They are not a third
primary destination. Secondary destinations are Following, Alerts, and Account.

## Package contents

- `DESIGN-DIRECTION.md` — UX, interaction and responsive requirements.
- `CLAUDE-CODE-INSTRUCTIONS.md` — implementation prompt for Claude Code.
- `styles/tokens.css` — colors, typography, spacing and elevation.
- `styles/foundations.css` — reset, document, typography and accessibility.
- `styles/layout.css` — application shell, primary tabs, grids and mobile shell.
- `styles/components.css` — controls, tables, cards, badges, drawers and states.
- `styles/responsive.css` — mobile, tablet, desktop and reduced-motion rules.
- `styles/index.css` — single import entry point.
- `references/portfolios-tab.png` — approved Portfolios interaction direction.
- `references/stocks-tab.png` — approved Stocks interaction direction.

## Integration

Import `styles/index.css` once at the application entry point:

```css
@import "./styles/index.css";
```

Claude should map the classes to the current component system rather than
rewriting working business logic. The package is intentionally framework
agnostic.

## Non-negotiable semantic rules

- Green, amber and coral are reserved for Sharia status.
- Performance uses cobalt or neutral ink, with an explicit `+` or `−`.
- Status is never communicated by color alone.
- No buy/sell execution language or trading ticket.
- Public disclosure dates and delays remain visible.
- Direct routes and browser refresh must work in production.
- English and Arabic/RTL must receive equal layout quality.

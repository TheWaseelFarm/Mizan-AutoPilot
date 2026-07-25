/**
 * Mizān design tokens — enterprise "simplified institutional terminal" (design handoff).
 *
 * Translated from the handoff's CSS custom properties (styles/tokens.css) into the
 * React Native theme so we integrate one system rather than layering two.
 *
 * Two saturated color families, kept strictly apart:
 *   1. `cobalt` (brand) — navigation, selection, links, and PERFORMANCE (up). Chrome.
 *   2. Sharia semantics — teal (compliant) / amber (purify) / coral (non-compliant) /
 *      slate (under review). RESERVED for the Sharia verdict ONLY. Nothing else uses them.
 *      Status is never communicated by color alone — always paired with a label/dot.
 */

/* --- Neutral ink scale (text + borders + surfaces) --------------------------------- */
export const ink = {
  950: '#101828',
  800: '#1D2939',
  700: '#344054',
  600: '#475467',
  500: '#667085',
  400: '#98A2B3',
  300: '#D0D5DD',
  200: '#E4E7EC',
  100: '#F2F4F7',
  50: '#F9FAFB',
} as const;

/* --- Cobalt (brand / navigation / selection / performance-up) ---------------------- */
export const cobalt = {
  700: '#1849A9',
  600: '#2457D6',
  500: '#356AE6',
  100: '#DBE7FF',
  50: '#F2F6FF',
} as const;

export const color = {
  // Surfaces — warm gray canvas, white surfaces with thin borders.
  bg: '#F6F7FA',
  canvas: '#F6F7FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceAlt: ink[100],
  surfaceSelected: '#F3F7FF',
  line: 'rgba(16, 24, 40, 0.10)',
  line2: 'rgba(16, 24, 40, 0.16)',

  // Text — deep ink typography.
  ink: ink[950],
  ink800: ink[800],
  strong: ink[800],
  muted: ink[600],
  faint: ink[500],
  ghost: ink[400],

  // Brand — cobalt.
  brand: cobalt[600],
  brandStrong: cobalt[700],
  brandInk: cobalt[700],
  brandTint: cobalt[50],
  brandSoft: 'rgba(36, 87, 214, 0.10)',
  brandBorder: cobalt[100],
  onBrand: '#FFFFFF',
} as const;

/**
 * Verdict color language — the product's soul. Codes match `aaoifi.ts`:
 * clean | purify | fail | unscreened. `tint` = soft accessible background,
 * `text` = legible on light, `solid` = the pure hue (bars/dots only), `border` = pill edge.
 * Mapped from the handoff's compliant / purify / non-compliant / review scales.
 */
export const verdictColor = {
  clean: { text: '#08644F', solid: '#14866D', tint: '#EEFAF6', border: '#B7E6D7' },
  purify: { text: '#946200', solid: '#C88719', tint: '#FFF8E8', border: '#F3D79A' },
  fail: { text: '#A62F3A', solid: '#D94B55', tint: '#FFF2F3', border: '#F7C2C7' },
  unscreened: { text: '#475467', solid: '#98A2B3', tint: '#F2F4F7', border: '#D8DDE5' },
} as const;

export type VerdictCode = keyof typeof verdictColor;

/**
 * Performance tones — deliberately NOT the verdict hues. Performance up/down must never be
 * mistaken for a Sharia verdict, so gains use the cobalt brand and losses a neutral ink,
 * always paired with an explicit + / − sign (see fmtSigned in performance.ts).
 */
export const perfColor = {
  up: cobalt[600],
  upSoft: cobalt[50],
  down: ink[600],
  downSoft: ink[100],
  flat: ink[500],
  flatSoft: ink[100],
} as const;

/**
 * Evidence-strength tones — NEUTRAL (ink), never a Sharia hue. High/Medium/Low describe how
 * strong the disclosed evidence is, which is orthogonal to compliance.
 */
export const evidenceColor = {
  high: { text: ink[800], solid: ink[700], tint: ink[100], border: ink[200] },
  medium: { text: ink[600], solid: ink[500], tint: ink[50], border: ink[200] },
  low: { text: ink[500], solid: ink[400], tint: ink[50], border: ink[200] },
} as const;

export type EvidenceStrength = keyof typeof evidenceColor;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  // Numeric aliases mirroring the handoff scale.
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const font = {
  // Sizes — typography carries the hierarchy (large bold numbers, small quiet labels).
  display: 30,
  h1: 24,
  h2: 19,
  h3: 16,
  body: 15,
  label: 13,
  small: 11.5,
  tiny: 10.5,
  weight: {
    regular: '500',
    medium: '600',
    bold: '700',
    heavy: '800',
  },
  // Tabular numerals for aligned figures in tables/rows (web + iOS honor this).
  numeric: { fontVariant: ['tabular-nums'] as ['tabular-nums'] },
} as const;

export const shadow = {
  // Minimal shadow — enterprise restraint.
  card: {
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  drawer: {
    shadowColor: '#101828',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
} as const;

/** The visible cobalt focus ring color (web keyboard focus / selected accents). */
export const focusRing = 'rgba(36, 87, 214, 0.45)';

/** Layout constants (px) — utility rail, header, drawers, responsive breakpoints. */
export const layout = {
  utilityRail: 80,
  headerHeight: 72,
  mobileNavHeight: 76,
  drawerWidth: 384,
  contentMax: 1200,
  // Responsive breakpoints (min-width, px).
  bpTablet: 768,
  bpDesktop: 1200,
  touchMin: 44,
} as const;

/** The subtle disclaimer required on every performance surface (spec §0 / handoff §10). */
export const DISCLAIMER =
  'Screening based on AAOIFI Standard No. 21. Informational only — past disclosed-holdings evidence, delayed by up to 45 days. Not investment advice, brokerage, or a fatwa.';

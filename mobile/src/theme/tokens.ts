/**
 * Mizān design tokens — light, trust/finance (spec §6).
 *
 * The palette has exactly two saturated color families:
 *   1. `brand` (calm blue) — brand, links, active states. Decorative/functional chrome.
 *   2. `verdict` (green/amber/red/grey) — RESERVED for Sharia verdicts ONLY.
 *      Nothing else in the UI may use these hues. The verdict is the hero;
 *      performance/price render in muted `ink`/`muted` tones with ▲▼ glyphs.
 */

export const color = {
  // Surfaces — off-white/very-light-grey, never pure white for the page.
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F8',
  line: 'rgba(15, 27, 45, 0.08)',
  line2: 'rgba(15, 27, 45, 0.14)',

  // Text
  ink: '#0F1B2D', // deep readable
  muted: '#5A6B85',
  faint: '#8A96AB',

  // Brand — calm blue accent
  brand: '#2563EB',
  brandInk: '#1E40AF',
  brandSoft: 'rgba(37, 99, 235, 0.10)',
  onBrand: '#FFFFFF',
} as const;

/**
 * Verdict color language — the product's soul. Codes match `frameworkB.ts`:
 * clean | purify | fail | unscreened. `tint` = soft accessible background,
 * `text` = legible on light, `solid` = the pure hue (bars/dots only).
 */
export const verdictColor = {
  clean: { text: '#12925A', solid: '#3ECB86', tint: 'rgba(18, 146, 90, 0.12)' },
  purify: { text: '#B0790C', solid: '#F3B24A', tint: 'rgba(176, 121, 12, 0.13)' },
  fail: { text: '#D24A41', solid: '#F0625A', tint: 'rgba(210, 74, 65, 0.12)' },
  unscreened: { text: '#6B7690', solid: '#AAB3C4', tint: 'rgba(107, 118, 144, 0.14)' },
} as const;

export type VerdictCode = keyof typeof verdictColor;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const font = {
  // Sizes — typography carries the hierarchy (large bold numbers, small quiet labels).
  display: 30,
  h1: 24,
  h2: 19,
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
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const;

/** The subtle disclaimer required on every performance surface (spec §0). */
export const DISCLAIMER =
  'Informational only — past disclosed-holdings evidence, delayed by up to 45 days. Not investment advice, brokerage, or a fatwa.';

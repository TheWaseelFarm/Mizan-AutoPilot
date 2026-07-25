/**
 * AAOIFI Standard No. 21 Sharia-screening engine (frontend mirror of api/_lib/aaoifi.js).
 *
 * The Mizān app screens with AAOIFI — a globally recognized standard. The verdict must match
 * the backend, so this keeps the same field fallbacks (camelCase | snake_case) and thresholds.
 * Do NOT diverge this file from the backend engine — the verdict lives in one logical place.
 *
 * A stock passes BOTH screens to be Compliant:
 *   1. Business activity (qualitative): fails if core revenue is from a prohibited sector.
 *   2. Financial ratios vs. market cap: debt < 30%, cash+securities < 30%, impure income < 5%.
 * Debt AND cash now FAIL a name (the key difference from the old debt-advisory rule).
 */

export const AAOIFI = Object.freeze({ debtMax: 30, cashMax: 30, impureMax: 5 });

export type VerdictCode = 'clean' | 'purify' | 'fail';
export type Label = VerdictCode | 'unscreened';

export interface ScreenableRecord {
  impurePct?: number | string;
  impure_pct?: number | string;
  debtPct?: number | string;
  debt_pct?: number | string;
  debtRatio?: number | string;
  debt_ratio?: number | string;
  cashPct?: number | string;
  cash_pct?: number | string;
  businessStatus?: string;
  business_status?: string;
  screened?: boolean;
}

/** Accepts either camelCase (client) or snake_case (DB) records. */
export function classifyAAOIFI(rec: ScreenableRecord = {}): VerdictCode {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const debt = Number(rec.debtPct ?? rec.debt_pct ?? rec.debtRatio ?? rec.debt_ratio ?? 0);
  const cash = Number(rec.cashPct ?? rec.cash_pct ?? 0);
  const business = rec.businessStatus ?? rec.business_status ?? 'pass';
  if (business === 'fail' || impure > AAOIFI.impureMax || debt > AAOIFI.debtMax || cash > AAOIFI.cashMax) {
    return 'fail';
  }
  if (impure === 0) return 'clean';
  return 'purify'; // passes both screens but has some impure income (0–5%) -> purify dividends
}

/**
 * Display label. Rows with no screening data are shown as "unscreened" (a UI/data truth-label,
 * NOT a verdict category) — the engine itself is never changed for this.
 */
export function labelOf(rec: ScreenableRecord): Label {
  return rec.screened === false ? 'unscreened' : classifyAAOIFI(rec);
}

/**
 * Dividend/gain purification: donate the impure-income % of dividends/realised gains. Under
 * AAOIFI, DEBT never creates a purification obligation — it passes (<30%) or fails the name.
 */
export function purificationEstimate(rec: ScreenableRecord = {}, realizedGain = 0): number {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const gain = Number(realizedGain || 0);
  if (impure <= 0 || gain <= 0) return 0;
  return +(gain * (impure / 100)).toFixed(2);
}

/**
 * Completeness gate: an item is surfaced only when fully screened with a verdict. Unscreened
 * items never appear in any list, feed, or search. Mirrors the backend `passesGate`.
 */
export function isScreened(rec: { label?: Label; screened?: boolean }): boolean {
  return rec.screened !== false && rec.label !== 'unscreened' && !!rec.label;
}

/** Short verdict label (AAOIFI wording). */
export const VERDICT_SHORT: Record<Label, string> = {
  clean: 'Compliant',
  purify: 'Compliant · purify',
  fail: 'Non-compliant',
  unscreened: 'Unscreened',
};

/** Verdict as PERMISSION, never a recommendation. */
export const VERDICT_PERMISSION: Record<Label, string> = {
  clean: 'Permissible to own',
  purify: 'Permissible — purify dividends',
  fail: 'Not permissible to own',
  unscreened: 'Not checked yet',
};

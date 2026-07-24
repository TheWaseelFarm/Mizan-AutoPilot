/**
 * Framework B — Hanbali Sharia screening engine.
 *
 * EXACT mirror of `api/_lib/frameworkB.js`. The verdict must match the backend,
 * so this keeps the same field fallbacks (camelCase | snake_case), the same
 * "pass" default, and the same thresholds. Do NOT diverge this file from the
 * backend engine — the verdict lives in one logical place.
 *
 * Two DISQUALIFYING tests only:
 *   (1) permissible business activity
 *   (2) impure / interest income <= 5% of revenue
 * Debt-to-market-cap is ADVISORY: it never fails a name; it only moves it to
 * Purify-at-sale.
 */

export const FB = Object.freeze({ impureMax: 5, debtAdvisory: 33 });

export type VerdictCode = 'clean' | 'purify' | 'fail';
export type Label = VerdictCode | 'unscreened';

export interface ScreenableRecord {
  impurePct?: number | string;
  impure_pct?: number | string;
  debtRatio?: number | string;
  debt_ratio?: number | string;
  businessStatus?: string;
  business_status?: string;
  screened?: boolean;
}

/** Accepts either camelCase (client) or snake_case (DB) records. */
export function classifyFB(rec: ScreenableRecord = {}): VerdictCode {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const debt = Number(rec.debtRatio ?? rec.debt_ratio ?? 0);
  const business = rec.businessStatus ?? rec.business_status ?? 'pass';
  if (business === 'fail' || impure > FB.impureMax) return 'fail';
  if (business === 'pass' && impure === 0 && debt <= FB.debtAdvisory) return 'clean';
  return 'purify'; // non-zero impure income (<=5%), business "watch", or debt over advisory
}

/**
 * Display label. Rows with no screening data are shown as "unscreened" (a UI/data
 * truth-label, NOT a verdict category) — classifyFB itself is never changed for this.
 */
export function labelOf(rec: ScreenableRecord): Label {
  return rec.screened === false ? 'unscreened' : classifyFB(rec);
}

/**
 * Purification owed at TIME OF SALE on a Purify-at-sale holding.
 * Only the impure slice of the realised gain is donated.
 */
export function purificationEstimate(rec: ScreenableRecord = {}, realizedGain = 0): number {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const gain = Number(realizedGain || 0);
  if (impure <= 0 || gain <= 0) return 0;
  return +(gain * (impure / 100)).toFixed(2);
}

export const VERDICT_SHORT: Record<Label, string> = {
  clean: 'Clean',
  purify: 'Purify at sale',
  fail: 'Fail',
  unscreened: 'Unscreened',
};

/** Verdict as PERMISSION, never a recommendation (carried over from the web copy pass). */
export const VERDICT_PERMISSION: Record<Label, string> = {
  clean: 'Permissible to own',
  purify: 'Permissible — charity owed on profit',
  fail: 'Not permissible to own',
  unscreened: 'Not checked yet',
};

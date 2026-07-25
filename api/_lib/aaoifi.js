// api/_lib/aaoifi.js
// AAOIFI Standard No. 21 Sharia-screening engine (replaces the old Framework B engine).
// The Mizān app screens with AAOIFI — a globally recognized standard — NOT a house
// methodology. (Framework B is the owner's PERSONAL method and is out of scope here.)
//
// Pure module: NO I/O, NO framework deps. Shared by the serverless functions AND the
// frontend, so the verdict lives in exactly one place.
//
// A stock must pass BOTH screens to be Compliant. Thresholds are AAOIFI No. 21's "30/30/5"
// rule (the current standard; verified 2026):
//   1. Business activity (qualitative): fails if core revenue is from a prohibited sector.
//   2. Financial ratios (quantitative), each vs. market capitalization:
//        interest-bearing debt / market cap        < 30%   (over = NON-COMPLIANT — debt FAILS)
//        cash + interest-bearing securities / mcap < 30%   (over = NON-COMPLIANT)
//        impure (non-permissible) income / revenue < 5%    (over = NON-COMPLIANT)
//
//   fail    -> impermissible business  OR  impure > 5%  OR  debt > 30%  OR  cash > 30%
//   clean   -> passes both screens with ZERO impure income
//   purify  -> passes both screens but has some impure income (0–5%) -> purify dividends
//
// NOTE ON 30%: AAOIFI No. 21 specifies 30% for the debt/liquidity ratios. The 33% figure seen
// elsewhere is the S&P/Dow Jones & MSCI index methodology, NOT AAOIFI — do not conflate them.
// The debt ratio is measured against the trailing-12-month AVERAGE market cap; that averaging
// is done upstream by the screening provider (this engine consumes the finished ratio).
// A qualified scholar should still confirm the prohibited-sector list for the activity screen.

export const AAOIFI = Object.freeze({ debtMax: 30, cashMax: 30, impureMax: 5 });

// Accepts either camelCase (frontend) or snake_case (DB) records. `debtPct`/`cashPct` are the
// AAOIFI ratio inputs (debt or cash+securities as a % of market cap); `debtRatio`/`debt_ratio`
// are accepted as the legacy alias for the debt ratio.
export function classifyAAOIFI(rec = {}) {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const debt = Number(rec.debtPct ?? rec.debt_pct ?? rec.debtRatio ?? rec.debt_ratio ?? 0);
  const cash = Number(rec.cashPct ?? rec.cash_pct ?? 0);
  const business = rec.businessStatus ?? rec.business_status ?? "pass";
  // Debt AND cash now FAIL a name (the key AAOIFI difference from the old debt-advisory rule).
  if (business === "fail" || impure > AAOIFI.impureMax || debt > AAOIFI.debtMax || cash > AAOIFI.cashMax) {
    return "fail";
  }
  if (impure === 0) return "clean";
  return "purify"; // passes both screens but has some impure income (0–5%) -> purify dividends
}

// Dividend/gain purification: donate the impure-income % of dividends/realised gains.
// Under AAOIFI, DEBT never creates a purification obligation — it passes (<30%) or fails.
export function purificationEstimate(rec = {}, realizedGain = 0) {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const gain = Number(realizedGain || 0);
  if (impure <= 0 || gain <= 0) return 0;
  return +(gain * (impure / 100)).toFixed(2);
}

export function verdictLabel(code) {
  return { clean: "Compliant", purify: "Compliant · purify", fail: "Non-compliant" }[code] || code;
}

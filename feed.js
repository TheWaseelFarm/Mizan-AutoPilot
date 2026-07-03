// api/_lib/frameworkB.js
// Framework B — Hanbali Sharia screening engine
// (per Sh. al-Manīʿ / Barakah symposium / al-ʿUṣaymī).
//
// Pure module: NO I/O, NO framework deps. Shared by the serverless
// functions AND the frontend, so the verdict lives in exactly one place.
//
// Two DISQUALIFYING tests only:
//   (1) permissible business activity
//   (2) impure / interest income <= 5% of revenue
// Debt-to-market-cap is ADVISORY: it never fails a name; it only moves
// it to Purify-at-sale.
//
//   fail          -> impermissible business activity  OR  impurePct > 5
//   clean         -> permissible business AND impurePct === 0 AND debt within advisory
//   purify        -> permissible business, impurePct 0–5 (non-zero)  OR  debt over advisory

export const FB = Object.freeze({ impureMax: 5, debtAdvisory: 33 });

// Accepts either camelCase (frontend) or snake_case (DB) records.
export function classifyFB(rec = {}) {
  const impure   = Number(rec.impurePct     ?? rec.impure_pct     ?? 0);
  const debt     = Number(rec.debtRatio     ?? rec.debt_ratio     ?? 0);
  const business = rec.businessStatus       ?? rec.business_status ?? "pass";
  if (business === "fail" || impure > FB.impureMax) return "fail";
  if (business === "pass" && impure === 0 && debt <= FB.debtAdvisory) return "clean";
  return "purify"; // non-zero impure income (<=5%), business "watch", or debt over advisory
}

// Purification owed at TIME OF SALE on a Purify-at-sale holding.
// Only the impure slice of the realised gain is donated.
export function purificationEstimate(rec = {}, realizedGain = 0) {
  const impure = Number(rec.impurePct ?? rec.impure_pct ?? 0);
  const gain = Number(realizedGain || 0);
  if (impure <= 0 || gain <= 0) return 0;
  return +(gain * (impure / 100)).toFixed(2);
}

export function verdictLabel(code) {
  return { clean: "Clean", purify: "Purify-at-sale", fail: "Fail" }[code] || code;
}

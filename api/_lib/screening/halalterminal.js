// api/_lib/screening/halalterminal.js
// Halal Terminal (REST) Sharia-screening adapter — the v1 chosen provider (spec §7).
//
// NON-NEGOTIABLE (same rule as zoya.js): consume RAW inputs (business-activity screen +
// raw financial ratios: debt %, cash %, impure %) and let the AAOIFI engine
// (api/_lib/aaoifi.js) decide the verdict. NEVER return, or map from, Halal Terminal's own
// overall compliant/non-compliant verdict — we take their numbers, not their conclusion.
//
// CONFIRMED from the public API surface (https://api.halalterminal.com/):
//   • Endpoint:  POST /api/screen/{symbol}
//   • Auth:      header  X-API-Key: <key>
//   • Body:      per-methodology status + ratio breakdowns (actual debt & impure-income
//                ratios, not just pass/fail) + purification rate + a `verified` audit flag.
//
// TODO(owner): the build sandbox can't reach the API docs (403), so the exact JSON field
// PATHS below are UNVERIFIED. Confirm them against one real response (curl the endpoint
// with your key) and adjust FIELD_PATHS, then delete this notice. The NO_RAW_INPUTS guard
// below will stop the pipeline loudly rather than let a wrong path silently read as "clean".

const BASE = process.env.SCREENING_API_BASE || "https://api.halalterminal.com";

// Candidate JSON paths (first non-null wins). Ordered from most- to least-likely.
// Each entry is a path into the parsed response object.
const FIELD_PATHS = {
  // Business / sector ACTIVITY screen — the permissible-line-of-business test ONLY,
  // never the financial-ratio outcome or the overall verdict.
  businessStatus: [
    ["business", "status"],
    ["businessActivity", "status"],
    ["sector", "status"],
    ["screening", "businessActivity"],
  ],
  businessDesc: [
    ["business", "description"],
    ["businessActivity", "description"],
    ["sector", "name"],
    ["industry"],
  ],
  // Impure / non-compliant / interest income as a PERCENT of revenue (raw).
  impurePct: [
    ["ratios", "nonCompliantRevenuePercent"],
    ["ratios", "impureIncomePercent"],
    ["ratios", "interestIncomePercent"],
    ["financials", "nonCompliantRevenue"],
    ["nonCompliantRevenuePercent"],
  ],
  // Interest-bearing debt as a PERCENT of market cap (AAOIFI: > 30% => Non-compliant).
  debtRatio: [
    ["ratios", "interestBearingDebtToMarketCapPercent"],
    ["ratios", "debtToMarketCapPercent"],
    ["ratios", "debtToAssetsPercent"],
    ["financials", "debtRatio"],
    ["debtToMarketCapPercent"],
  ],
  // Cash + interest-bearing securities as a PERCENT of market cap (AAOIFI: > 30% => Non-compliant).
  cashPct: [
    ["ratios", "cashAndInterestSecuritiesToMarketCapPercent"],
    ["ratios", "cashToMarketCapPercent"],
    ["ratios", "liquidAssetsToMarketCapPercent"],
    ["financials", "cashRatio"],
    ["cashToMarketCapPercent"],
  ],
  // Vendor purification rate (informational passthrough only; sale-time math lives elsewhere).
  purificationRate: [
    ["purification", "ratePerShare"],
    ["purification", "rate"],
    ["purificationRate"],
  ],
};

const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const round2 = (n) => Math.round(n * 100) / 100;

function getPath(obj, path) {
  return path.reduce((o, k) => (o == null ? o : o[k]), obj);
}
// First non-null value across a list of candidate paths.
function pick(obj, paths) {
  for (const p of paths) {
    const v = getPath(obj, p);
    if (v != null && v !== "") return v;
  }
  return null;
}

// Map ONLY the business-activity screen to pass/watch/fail. Reflects the ACTIVITY, not the
// vendor's financial-ratio outcome or overall verdict.
function mapBusinessStatus(status) {
  const v = String(status || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (["NON_COMPLIANT", "NONCOMPLIANT", "FAIL", "FAILED", "IMPERMISSIBLE", "HARAM", "PROHIBITED"].includes(v))
    return "fail";
  if (["COMPLIANT", "PASS", "PASSED", "HALAL", "PERMISSIBLE", "OK"].includes(v)) return "pass";
  if (!v) return "pass"; // no activity flag present -> not a business-activity failure
  return "watch"; // questionable / doubtful / unknown activity -> Purify-at-sale via the engine
}

function reasoningFor(businessStatus, impurePct, debtRatio, cashPct) {
  if (businessStatus === "fail") {
    return "Excluded at the AAOIFI business-activity screen: the core line of business is impermissible.";
  }
  const bits = ["Business activity is permissible."];
  if (debtRatio > 30) bits.push(`Interest-bearing debt is ~${debtRatio}% of market cap — over the 30% AAOIFI limit, so Non-compliant.`);
  if (cashPct > 30) bits.push(`Cash + interest-bearing securities are ~${cashPct}% of market cap — over the 30% AAOIFI limit, so Non-compliant.`);
  bits.push(
    impurePct > 5
      ? `About ${impurePct}% of revenue is impure income — over the 5% limit, so Non-compliant.`
      : impurePct > 0
        ? `About ${impurePct}% of revenue is impure income — purify that share of dividends.`
        : "No impure income to purify.",
  );
  return bits.join(" ");
}

async function getJSON(symbol, key) {
  const url = `${BASE}/api/screen/${encodeURIComponent(symbol)}`;
  const headers = { "content-type": "application/json", accept: "application/json", "X-API-Key": key };
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      // POST per the documented contract; body empty (symbol is in the path).
      const res = await fetch(url, { method: "POST", headers, body: "{}", signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 404) return { notFound: true };
      if (res.status === 429) throw new Error("429 rate limit reached");
      if (res.status >= 500) {
        lastErr = new Error(`Halal Terminal HTTP ${res.status}`);
        continue; // retry once on 5xx
      }
      if (!res.ok) throw new Error(`Halal Terminal HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      lastErr = e; // retry once on abort/network
    }
  }
  throw lastErr || new Error("Halal Terminal request failed");
}

// Returns the RAW screening shape (screened/business/businessStatus/impurePct/debtRatio/
// reasoning/purification) or null when there's no data for the ticker (resolver marks it
// unscreened). Throws on misconfig / no-raw-inputs so we never fabricate a verdict.
export async function screen(ticker) {
  const key = process.env.SCREENING_API_KEY;
  if (!key) throw new Error("SCREENING_API_KEY not set");

  const resp = await getJSON(ticker, key);
  if (resp?.notFound) return null;
  if (resp?.error) throw new Error(`Halal Terminal: ${resp.error}`);

  // The screening node may be the response root or nested under `data`/`result`.
  const root = resp?.data ?? resp?.result ?? resp;

  const impurePct = num(pick(root, FIELD_PATHS.impurePct));
  const debtRatio = num(pick(root, FIELD_PATHS.debtRatio));
  const cashPctRaw = num(pick(root, FIELD_PATHS.cashPct));
  const businessRaw = pick(root, FIELD_PATHS.businessStatus);

  // Guard: if we found NO raw ratios AND no activity screen, we must NOT invent them or
  // fall back to the vendor's verdict. Stop loudly (per spec + zoya.js precedent).
  if (impurePct == null && debtRatio == null && cashPctRaw == null && businessRaw == null) {
    throw new Error(
      "NO_RAW_INPUTS: Halal Terminal response exposed no raw revenue/debt/cash ratios or activity screen at the configured paths — confirm FIELD_PATHS against a real response before enabling. Do NOT map a vendor verdict to AAOIFI.",
    );
  }

  const businessStatus = mapBusinessStatus(businessRaw);
  const impure = impurePct == null ? 0 : round2(impurePct);
  const debt = debtRatio == null ? 0 : round2(debtRatio);
  const cash = cashPctRaw == null ? 0 : round2(cashPctRaw);

  return {
    screened: true,
    business: pick(root, FIELD_PATHS.businessDesc) || "Screened (Halal Terminal)",
    businessStatus, // from ACTIVITY only, never the vendor verdict
    impurePct: impure,
    debtRatio: debt, // interest-bearing debt / market cap (%)
    cashPct: cash, // cash + interest securities / market cap (%)
    reasoning: reasoningFor(businessStatus, impure, debt, cash),
    purification: null, // computed at sale-time by aaoifi.purificationEstimate
  };
}

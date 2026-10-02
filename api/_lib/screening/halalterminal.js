// api/_lib/screening/halalterminal.js
// Halal Terminal (REST) Sharia-screening adapter — the v1 chosen provider (spec §7).
//
// NON-NEGOTIABLE: consume RAW inputs (business-activity screen + raw financial ratios:
// debt %, cash %, impure %) and let the AAOIFI engine (api/_lib/aaoifi.js) decide the
// verdict. NEVER return, or map from, Halal Terminal's own overall compliant/non-compliant
// verdict (is_compliant / aaoifi_compliant / by_methodology.*.is_compliant) — we take their
// numbers, not their conclusion.
//
// VERIFIED against a real response (GET /api/screen/AAPL, 2026-10):
//   • Endpoint:  POST /api/screen/{symbol}   Auth header: X-API-Key: <key>
//   • Flat body. Ratios are FRACTIONS (0..1), so we ×100 for the engine (which works in %):
//       debt_to_market_cap_ratio                     -> interest-bearing debt / market cap
//       by_methodology.AAOIFI.mc_trailing_basis.debt_ratio -> AAOIFI 12-mo trailing debt (preferred)
//       liquidity_to_market_cap_ratio                -> cash + interest securities / market cap
//       business_income.combined_impure_ratio        -> non-permissible income / revenue
//         (falls back to interest_income_to_revenue_ratio)
//   • business_screen_pass (boolean) = the ACTIVITY screen (separate from financials + verdict).
//   • questionable_business (boolean|null) -> "watch" (Purify-at-sale via the engine).

const BASE = process.env.SCREENING_API_BASE || "https://api.halalterminal.com";

const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const round2 = (n) => Math.round(n * 100) / 100;
// Halal Terminal ratios are fractions (0.0176 = 1.76%); the AAOIFI engine compares percentages.
const asPct = (v) => { const n = num(v); return n == null ? null : round2(n * 100); };

// Business-ACTIVITY screen ONLY -> pass/watch/fail (never the vendor's financial/overall verdict).
function businessStatusOf(root) {
  if (root.business_screen_pass === false) return "fail";
  if (root.questionable_business === true) return "watch";
  // String fallback if a future response uses a status string instead of the boolean.
  const s = String(root.business_screen_status || root.shariah_compliance_status || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (["NON_COMPLIANT", "NONCOMPLIANT", "FAIL", "IMPERMISSIBLE", "HARAM", "PROHIBITED"].includes(s)) return "fail";
  return "pass";
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

// Pure mapping from a Halal Terminal response body to the RAW screening shape the AAOIFI engine
// consumes. Exported for testing. Returns the screening object, or null for no data.
export function mapResponse(resp) {
  if (!resp || resp.notFound) return null;
  const root = resp.data ?? resp.result ?? resp;

  const debtFrac = root?.by_methodology?.AAOIFI?.mc_trailing_basis?.debt_ratio ?? root.debt_to_market_cap_ratio;
  const debtRatio = asPct(debtFrac); // interest-bearing debt / market cap (%)
  const cashPct = asPct(root.liquidity_to_market_cap_ratio ?? root.cash_to_market_cap_ratio); // cash+interest securities / mcap (%)
  const impurePct = asPct(root?.business_income?.combined_impure_ratio ?? root.interest_income_to_revenue_ratio); // non-permissible income / revenue (%)

  // No raw ratios AND no activity screen -> stop loudly rather than fabricate (per spec).
  if (debtRatio == null && cashPct == null && impurePct == null && root.business_screen_pass == null) {
    throw new Error(
      "NO_RAW_INPUTS: Halal Terminal response exposed no raw debt/cash/impure ratios or activity screen — the adapter mapping needs review before enabling.",
    );
  }

  const businessStatus = businessStatusOf(root);
  const impure = impurePct == null ? 0 : impurePct;
  const debt = debtRatio == null ? 0 : debtRatio;
  const cash = cashPct == null ? 0 : cashPct;

  return {
    screened: true,
    business: root.industry || root.sector || root.name || "Screened (Halal Terminal)",
    businessStatus, // from ACTIVITY only, never the vendor verdict
    impurePct: impure,
    debtRatio: debt, // interest-bearing debt / market cap (%)
    cashPct: cash, // cash + interest securities / market cap (%)
    reasoning: reasoningFor(businessStatus, impure, debt, cash),
    purification: null, // computed at sale-time by aaoifi.purificationEstimate
  };
}

async function getJSON(symbol, key) {
  const url = `${BASE}/api/screen/${encodeURIComponent(symbol)}`;
  const headers = { "content-type": "application/json", accept: "application/json", "X-API-Key": key };
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { method: "POST", headers, body: "{}", signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 404) return { notFound: true };
      if (res.status === 429) throw new Error("429 rate limit reached");
      if (res.status >= 500) { lastErr = new Error(`Halal Terminal HTTP ${res.status}`); continue; }
      if (!res.ok) throw new Error(`Halal Terminal HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
    }
  }
  throw lastErr || new Error("Halal Terminal request failed");
}

// Returns the RAW screening shape or null (ticker unknown). Throws on misconfig / API error /
// no-raw-inputs so the resolver never fabricates a verdict.
export async function screen(ticker) {
  const key = process.env.SCREENING_API_KEY;
  if (!key) throw new Error("SCREENING_API_KEY not set");
  const resp = await getJSON(ticker, key);
  if (resp?.notFound) return null;
  if (resp?.error || resp?.error_message) throw new Error(`Halal Terminal: ${resp.error_message || resp.error}`);
  return mapResponse(resp);
}

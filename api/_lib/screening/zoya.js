// api/_lib/screening/zoya.js
// Zoya (GraphQL) Sharia-screening adapter.
//
// NON-NEGOTIABLE: consume RAW inputs (business activity + raw debt/cash/impure ratios) and
// let the AAOIFI engine (api/_lib/aaoifi.js) decide the verdict. Zoya is AAOIFI-native, so its
// own verdict may agree with ours — but we still compute from the raw ratios, not their label,
// so the methodology + thresholds live in exactly one place (api/_lib/aaoifi.js).
//
// TODO(owner): the build sandbox can't reach the Zoya developer docs (403), so the
// endpoint, auth header, query, and field paths below are UNVERIFIED. Confirm them against
// developer.zoya.finance before enabling SCREENING_API_KEY, then delete this notice.
//
//   If Zoya only exposes a FINAL compliance verdict and does NOT expose (a) a business-
//   activity screen separate from financials AND (b) raw revenue/debt ratios, then Zoya is
//   NOT usable under AAOIFI — this adapter throws NO_RAW_INPUTS so you stop rather
//   than mapping their verdict to ours.

const ZOYA_ENDPOINT = "https://api.zoya.finance/graphql";   // TODO confirm
const AUTH_HEADER   = "x-api-key";                          // TODO confirm ("x-api-key" | "Authorization")
const AUTH_SCHEME   = "";                                   // TODO e.g. "Bearer " if using Authorization

// TODO confirm the query name + field paths. We request the RAW facts only.
const QUERY = `query MizanScreen($symbol: String!) {
  advancedCompliance(symbol: $symbol) {                 # TODO confirm root field
    symbol
    businessActivity { status description }             # TODO: activity-only screen (NOT the overall verdict)
    financials {
      nonCompliantRevenuePercentage                     # TODO
      questionableRevenuePercentage                     # TODO (doubtful/uncertain income)
      interestBearingDebtToMarketCapPercentage          # TODO (AAOIFI: >30% fails)
      cashAndInterestSecuritiesToMarketCapPercentage    # TODO (AAOIFI: >30% fails)
    }
  }
}`;
// Path from the GraphQL `data` object to the screening node. TODO confirm.
const DATA_PATH = ["advancedCompliance"];

const num = v => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const round2 = n => Math.round(n * 100) / 100;

function getPath(obj, path) { return path.reduce((o, k) => (o == null ? o : o[k]), obj); }

// Map ONLY the business-activity screen (permissible line of business) to pass/watch/fail.
// This must reflect the ACTIVITY, not the financial-ratio outcome.
function mapBusinessStatus(status) {
  const v = String(status || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (["NON_COMPLIANT", "NONCOMPLIANT", "FAIL", "FAILED", "IMPERMISSIBLE", "HARAM", "PROHIBITED"].includes(v)) return "fail";
  if (["COMPLIANT", "PASS", "PASSED", "HALAL", "PERMISSIBLE"].includes(v)) return "pass";
  return "watch"; // questionable / doubtful / unknown activity -> manual-watch (Purify-at-sale via engine)
}

function reasoningFor(businessStatus, impurePct, debtRatio, cashPct) {
  if (businessStatus === "fail") {
    return "Excluded at the AAOIFI business-activity screen: the core line of business is impermissible.";
  }
  const bits = ["Business activity is permissible."];
  if (debtRatio > 30) bits.push(`Interest-bearing debt is ~${debtRatio}% of market cap — over the 30% AAOIFI limit, so Non-compliant.`);
  if (cashPct > 30) bits.push(`Cash + interest-bearing securities are ~${cashPct}% of market cap — over the 30% AAOIFI limit, so Non-compliant.`);
  bits.push(impurePct > 5
    ? `About ${impurePct}% of revenue is impure income — over the 5% limit, so Non-compliant.`
    : impurePct > 0
      ? `About ${impurePct}% of revenue is impure income — purify that share of dividends.`
      : "No impure income to purify.");
  return bits.join(" ");
}

async function gqlPost(body, key) {
  const headers = { "content-type": "application/json", accept: "application/json" };
  headers[AUTH_HEADER] = AUTH_SCHEME + key;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(ZOYA_ENDPOINT, { method: "POST", headers, body, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 404) return { notFound: true };
      if (res.status >= 500) { lastErr = new Error(`Zoya HTTP ${res.status}`); continue; } // retry
      if (!res.ok) throw new Error(`Zoya HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      lastErr = e; // retry once on abort/network
    }
  }
  throw lastErr || new Error("Zoya request failed");
}

// Returns the RAW screening shape (screened/business/businessStatus/impurePct/debtRatio/
// reasoning/purification) or null when Zoya has no data (resolver marks it unscreened).
export async function screen(ticker) {
  const key = process.env.SCREENING_API_KEY;
  if (!key) throw new Error("SCREENING_API_KEY not set");

  const resp = await gqlPost(JSON.stringify({ query: QUERY, variables: { symbol: ticker } }), key);
  if (resp?.notFound) return null;
  if (resp?.errors?.length) throw new Error(`Zoya GraphQL: ${resp.errors[0]?.message || "error"}`);

  const node = getPath(resp?.data, DATA_PATH);
  if (!node) return null; // no data for this ticker -> unscreened

  const fin = node.financials || {};
  const nonCompliant = num(fin.nonCompliantRevenuePercentage);
  const questionable = num(fin.questionableRevenuePercentage);
  const debtRatio    = num(fin.interestBearingDebtToMarketCapPercentage);
  const cashRatio    = num(fin.cashAndInterestSecuritiesToMarketCapPercentage);

  // Guard: if the vendor gave us no raw ratios, we must NOT invent them or fall back to a
  // verdict. Stop loudly so the owner reconsiders the provider (per the task).
  if (nonCompliant == null && questionable == null && debtRatio == null && cashRatio == null) {
    throw new Error("NO_RAW_INPUTS: Zoya returned no raw revenue/debt/cash ratios — do not map a vendor verdict to AAOIFI. Confirm the query/fields or choose another provider.");
  }

  const impurePct = round2((nonCompliant || 0) + (questionable || 0));
  const businessStatus = mapBusinessStatus(node.businessActivity?.status);
  return {
    screened: true,
    business: node.businessActivity?.description || "Screened",
    businessStatus,                                   // from ACTIVITY only, never the vendor verdict
    impurePct,
    debtRatio: debtRatio || 0,                        // interest-bearing debt / market cap (%)
    cashPct: cashRatio || 0,                          // cash + interest securities / market cap (%)
    reasoning: reasoningFor(businessStatus, impurePct, debtRatio || 0, cashRatio || 0),
    purification: null,                               // computed at sale-time elsewhere
  };
}

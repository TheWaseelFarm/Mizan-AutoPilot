// api/_lib/screening/zoya.js
// Zoya (GraphQL) Sharia-screening adapter.
//
// NON-NEGOTIABLE: consume RAW inputs (business activity + raw financial ratios) and let
// Framework B (api/_lib/frameworkB.js) decide the verdict. NEVER return, or map from,
// Zoya's own AAOIFI compliant/non-compliant verdict — AAOIFI fails high-debt names, but
// Framework B treats debt as advisory only.
//
// TODO(owner): the build sandbox can't reach the Zoya developer docs (403), so the
// endpoint, auth header, query, and field paths below are UNVERIFIED. Confirm them against
// developer.zoya.finance before enabling SCREENING_API_KEY, then delete this notice.
//
//   If Zoya only exposes a FINAL compliance verdict and does NOT expose (a) a business-
//   activity screen separate from financials AND (b) raw revenue/debt ratios, then Zoya is
//   NOT usable under Framework B — this adapter throws NO_RAW_INPUTS so you stop rather
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
      interestBearingDebtToMarketCapPercentage          # TODO
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

function reasoningFor(businessStatus, impurePct, debtRatio) {
  if (businessStatus === "fail") {
    return "Excluded at the business-activity level: the core line of business is impermissible under the screen.";
  }
  const bits = [];
  bits.push(businessStatus === "watch"
    ? "Business activity is permissible but flagged for monitoring."
    : "Business activity is permissible.");
  bits.push(impurePct > 0
    ? `About ${impurePct}% of revenue is non-compliant/doubtful, so any realised gain carries a purification amount at sale.`
    : "No impure income to purify.");
  if (debtRatio > 33) bits.push("Debt-to-market-cap sits above the advisory reference, but under Framework B debt is advisory only and never disqualifies.");
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

  // Guard: if the vendor gave us no raw ratios, we must NOT invent them or fall back to a
  // verdict. Stop loudly so the owner reconsiders the provider (per the task).
  if (nonCompliant == null && questionable == null && debtRatio == null) {
    throw new Error("NO_RAW_INPUTS: Zoya returned no raw revenue/debt ratios — do not map a vendor verdict to Framework B. Confirm the query/fields or choose another provider.");
  }

  const impurePct = round2((nonCompliant || 0) + (questionable || 0));
  const businessStatus = mapBusinessStatus(node.businessActivity?.status);
  return {
    screened: true,
    business: node.businessActivity?.description || "Screened",
    businessStatus,                                   // from ACTIVITY only, never the vendor verdict
    impurePct,
    debtRatio: debtRatio || 0,
    reasoning: reasoningFor(businessStatus, impurePct, debtRatio || 0),
    purification: null,                               // computed at sale-time elsewhere
  };
}

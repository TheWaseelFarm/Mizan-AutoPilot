// api/_lib/screening/edgar.js
// Screening inputs computed from the company's own filing: SEC EDGAR XBRL "company facts"
// (the latest 10-K) for debt, cash + securities, interest income and revenue; the SEC's SIC
// code for the business-activity screen; and a 12-month average close (Twelve Data) for the
// market cap. No vendor verdict exists on this path at all — the adapter returns RAW ratios and
// api/_lib/aaoifi.js alone decides.
//
// Enable with SCREENING_PROVIDER=edgar. Needs SEC_USER_AGENT (SEC fair-access policy: app name +
// contact) and TWELVEDATA_API_KEY (1 credit per ticker). Three SEC requests + one price request
// per ticker, cached ~30 days by screening/index.js.
//
// REFUSES RATHER THAN GUESSES. XBRL tags differ between filers, so a missing tag is common. A
// ratio is only returned when every input was found at the latest fiscal year end; otherwise
// this throws INCOMPLETE and the resolver shows the name as Unscreened. In particular it throws
// when the debt picture looks partial (current debt but no long-term tag, or interest expense
// far too large for the debt found) — an understated debt ratio would pass a name that fails.
//
// Known limits, stated so nobody over-trusts the numbers:
//   • Impure income here = interest / investment income only. Revenue from an impermissible
//     side business (e.g. a captive finance arm) is NOT separated out.
//   • Cash + securities counts all tagged investments, including any equity holdings, so the
//     cash ratio errs high (towards failing), never low.
//   • Market cap = fiscal-year weighted average shares × average close of the last 12 months.
import { requireUserAgent, padCik } from "../sources/edgar13f.js";
import { fetchPrice } from "../prices/twelvedata.js";

const round2 = (n) => Math.round(n * 100) / 100;
const ANNUAL = /^10-K/; // 10-K, 10-K/A, 10-KT. Foreign filers (20-F / IFRS) are not supported.

export class IncompleteError extends Error {
  constructor(what) { super(`INCOMPLETE: ${what}`); this.code = "INCOMPLETE"; }
}

// ---- Business-activity screen from the SEC SIC code ---------------------------------------
// "fail" = the core business is conventional finance, insurance, alcohol or tobacco.
// "watch" = permissible on its face but commonly mixed; shown for manual review (it does not
// change the verdict). A qualified scholar should confirm this list.
const SIC_FAIL = [
  [6000, 6199, "conventional banking / credit"],
  [6200, 6221, "securities brokerage / dealing"],
  [6300, 6411, "conventional insurance"],
  [2082, 2085, "alcoholic beverages"],
  [2100, 2199, "tobacco"],
  [5813, 5813, "drinking places"],
  [5921, 5921, "liquor stores"],
];
const SIC_WATCH = [
  [2011, 2013, "meat products (may include pork)"],
  [2080, 2080, "beverages (may include alcohol)"],
  [3480, 3489, "ordnance"],
  [3760, 3769, "guided missiles / defence"],
  [4830, 4841, "broadcasting / cable"],
  [5810, 5812, "restaurants"],
  [6282, 6282, "investment advice"],
  [6770, 6799, "blank-check / investment vehicles / REITs"],
  [7011, 7011, "hotels (may include casinos)"],
  [7810, 7841, "motion pictures"],
  [7900, 7999, "amusement / gambling"],
];
const inRange = (table, n) => table.find(([lo, hi]) => n >= lo && n <= hi);

export function businessFromSic(sic) {
  const n = parseInt(sic, 10);
  if (!Number.isFinite(n)) return { status: "watch", why: "no SIC code on file" };
  const f = inRange(SIC_FAIL, n);
  if (f) return { status: "fail", why: f[2] };
  const w = inRange(SIC_WATCH, n);
  if (w) return { status: "watch", why: w[2] };
  return { status: "pass", why: null };
}

// ---- Reading XBRL facts ---------------------------------------------------------------------
const monthsBetween = (a, b) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));

function rowsOf(facts, tag, unit, ns = "us-gaap") {
  return facts?.facts?.[ns]?.[tag]?.units?.[unit] || [];
}

/** End date of the latest fiscal year reported on a 10-K, or null. */
export function fiscalYearEnd(facts) {
  let best = null;
  for (const tag of ["Assets", "Liabilities", "StockholdersEquity"]) {
    for (const r of rowsOf(facts, tag, "USD")) {
      if (ANNUAL.test(r.form || "") && r.end && (!best || r.end > best)) best = r.end;
    }
  }
  return best;
}

// Value of `tag` AT the fiscal year end (balance-sheet instant, or a 10–13 month period ending
// then), from a 10-K. A value tagged for any other date is ignored: filers drop tags over time
// and an old figure must never stand in for this year's. Latest filing wins (restatements).
function at(facts, tag, fy, unit = "USD") {
  let best = null;
  for (const r of rowsOf(facts, tag, unit)) {
    if (r.end !== fy || !ANNUAL.test(r.form || "")) continue;
    if (r.start) { const m = monthsBetween(r.start, r.end); if (m < 10 || m > 13) continue; }
    if (!best || String(r.filed || "") > String(best.filed || "")) best = r;
  }
  return best && Number.isFinite(Number(best.val)) ? Number(best.val) : null;
}
const firstOf = (facts, fy, tags, unit) => { for (const t of tags) { const v = at(facts, t, fy, unit); if (v != null) return v; } return null; };
const maxOf = (facts, fy, tags, unit) => { let m = null; for (const t of tags) { const v = at(facts, t, fy, unit); if (v != null && (m == null || v > m)) m = v; } return m; };

/** Interest-bearing debt at the fiscal year end. Throws IncompleteError when it looks partial. */
export function totalDebt(facts, fy) {
  const combined = at(facts, "DebtLongtermAndShorttermCombinedAmount", fy);
  const ltAll = at(facts, "LongTermDebt", fy); // current + non-current maturities
  const ltCur = firstOf(facts, fy, ["LongTermDebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"]);
  let ltNon = firstOf(facts, fy, ["LongTermDebtNoncurrent", "LongTermDebtAndCapitalLeaseObligations"]);
  if (ltNon == null && ltAll != null) ltNon = Math.max(0, ltAll - (ltCur || 0));
  const debtCur = at(facts, "DebtCurrent", fy); // short-term borrowings + current maturities
  const shortTerm = maxOf(facts, fy, ["ShortTermBorrowings", "CommercialPaper", "ShortTermBankLoansAndNotesPayable"]) || 0;

  let debt;
  if (combined != null) debt = combined;
  else if (debtCur != null) {
    if (ltNon == null) throw new IncompleteError("current debt is tagged but long-term debt is not — the debt total would be understated");
    debt = ltNon + debtCur;
  } else if (ltAll != null) debt = ltAll + shortTerm;
  else if (ltNon != null || ltCur != null) debt = (ltNon || 0) + (ltCur || 0) + shortTerm;
  else debt = shortTerm; // no debt tags at all: a debt-free filer, checked against interest expense below

  // Cross-check: interest expense far above what this much debt could cost means debt is missing.
  const interest = maxOf(facts, fy, ["InterestExpense", "InterestExpenseDebt", "InterestExpenseNonoperating", "InterestAndDebtExpense"]);
  if (interest != null && interest > 5e6 && interest > 0.15 * debt) {
    throw new IncompleteError("interest expense is too large for the debt found in the filing's standard tags");
  }
  return debt;
}

/** Cash + securities at the fiscal year end (errs high — see header). */
export function cashAndSecurities(facts, fy) {
  const cash = firstOf(facts, fy, ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "Cash"]);
  const cashPlusSt = at(facts, "CashCashEquivalentsAndShortTermInvestments", fy);
  if (cash == null && cashPlusSt == null) throw new IncompleteError("cash is not tagged at the fiscal year end");
  const cur = maxOf(facts, fy, ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesDebtSecuritiesCurrent"]) || 0;
  const non = maxOf(facts, fy, ["MarketableSecuritiesNoncurrent", "LongTermInvestments", "AvailableForSaleSecuritiesDebtSecuritiesNoncurrent"]) || 0;
  const total = maxOf(facts, fy, ["MarketableSecurities", "AvailableForSaleSecuritiesDebtSecurities", "DebtSecuritiesAvailableForSaleExcludingAccruedInterest"]) || 0;
  const securities = Math.max(cur + non, total);
  return Math.max((cash || 0) + securities, (cashPlusSt || 0) + non);
}

const INTEREST_INCOME = [
  "InvestmentIncomeInterest", "InvestmentIncomeInterestAndDividend", "InvestmentIncomeNet",
  "InterestIncomeOther", "InterestAndOtherIncome", "InterestIncomeOperating", "InterestAndDividendIncomeOperating",
];
const REVENUE = [
  "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax",
  "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet",
];

/**
 * Pure: XBRL company facts + SIC + average close -> the RAW screening shape for aaoifi.js.
 * Throws IncompleteError when an input is missing (the caller shows "Unscreened").
 */
export function ratiosFromFacts(facts, { sic, sicDescription, avgClose, latestShares } = {}) {
  const fy = fiscalYearEnd(facts);
  if (!fy) throw new IncompleteError("no 10-K balance sheet in SEC XBRL data (foreign or very new filer)");

  const biz = businessFromSic(sic);
  const business = `${sicDescription || "Unclassified"}${sic ? ` (SIC ${sic})` : ""}${biz.why ? ` — ${biz.why}` : ""}`;
  if (biz.status === "fail") {
    // Excluded at the activity screen: the ratios are not needed and are not computed.
    return {
      screened: true, business, businessStatus: "fail", impurePct: 0, debtRatio: 0, cashPct: 0,
      reasoning: `Excluded at the AAOIFI business-activity screen: ${biz.why}. Financial ratios were not computed.`,
      purification: null, source: "sec-edgar", fiscalYearEnd: fy,
    };
  }

  const revenue = maxOf(facts, fy, REVENUE);
  if (!(revenue > 0)) throw new IncompleteError("revenue is not tagged at the fiscal year end");
  const interestIncome = maxOf(facts, fy, INTEREST_INCOME);
  if (interestIncome == null) throw new IncompleteError("interest / investment income is not tagged at the fiscal year end");
  const debt = totalDebt(facts, fy);
  const cash = cashAndSecurities(facts, fy);

  let shares = firstOf(facts, fy, ["WeightedAverageNumberOfSharesOutstandingBasic", "CommonStockSharesOutstanding"], "shares");
  // A split after the fiscal year end: prices are split-adjusted, so use the newest share count.
  if (latestShares > 0 && (!shares || latestShares / shares > 1.5 || latestShares / shares < 0.67)) shares = latestShares;
  if (!(shares > 0)) throw new IncompleteError("share count is not tagged");
  if (!(avgClose > 0)) throw new IncompleteError("no 12-month price history for the market cap");
  const marketCap = shares * avgClose;

  const impurePct = round2(Math.max(0, interestIncome) / revenue * 100);
  const debtRatio = round2(debt / marketCap * 100);
  const cashPct = round2(cash / marketCap * 100);

  const bits = [biz.status === "watch" ? `Business activity needs review (${biz.why}).` : "Business activity is permissible."];
  if (debtRatio > 30) bits.push(`Interest-bearing debt is ~${debtRatio}% of market cap — over the 30% AAOIFI limit, so Non-compliant.`);
  if (cashPct > 30) bits.push(`Cash + securities are ~${cashPct}% of market cap — over the 30% AAOIFI limit, so Non-compliant.`);
  bits.push(impurePct > 5
    ? `About ${impurePct}% of revenue is interest / investment income — over the 5% limit, so Non-compliant.`
    : impurePct > 0
      ? `About ${impurePct}% of revenue is interest / investment income — purify that share of dividends.`
      : "No interest income to purify.");
  bits.push(`Computed from the 10-K for the year ending ${fy} (SEC EDGAR) against a 12-month average market cap.`);

  return {
    screened: true, business, businessStatus: biz.status, impurePct, debtRatio, cashPct,
    reasoning: bits.join(" "), purification: null,
    source: "sec-edgar", fiscalYearEnd: fy,
    inputs: { debt, cashAndSecurities: cash, interestIncome, revenue, shares, avgClose: round2(avgClose), marketCap: Math.round(marketCap) },
  };
}

/** Mean close over the last 365 days of a {d,c} history; null with under ~7 months of data. */
export function averageClose(history, now = Date.now()) {
  const from = new Date(now - 365 * 86400000).toISOString().slice(0, 10);
  const xs = (history || []).filter((p) => p && p.d >= from && Number.isFinite(p.c)).map((p) => p.c);
  return xs.length >= 150 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/** Newest dei share count from any filing (cover page), or null. */
export function latestShareCount(facts) {
  let best = null;
  for (const r of rowsOf(facts, "EntityCommonStockSharesOutstanding", "shares", "dei")) {
    if (r.end && (!best || r.end > best.end)) best = r;
  }
  return best ? Number(best.val) : null;
}

// ---- Network ----------------------------------------------------------------------------------
let nextSlot = 0; // SEC fair access: stay well under 10 requests / second
async function secJson(url) {
  const ua = requireUserAgent();
  const wait = Math.max(0, nextSlot - Date.now());
  nextSlot = Date.now() + wait + 150;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": ua, Accept: "application/json" }, signal: ctrl.signal });
    if (res.status === 404) return null;
    if (res.status === 403) throw new Error("SEC refused the request (HTTP 403) — SEC_USER_AGENT must name the app and a contact email");
    if (!res.ok) throw new Error(`SEC HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

let tickerMap = null; // ticker -> CIK, loaded once per process
async function cikFor(ticker) {
  if (!tickerMap) {
    const j = await secJson("https://www.sec.gov/files/company_tickers.json");
    const m = new Map();
    for (const row of Object.values(j || {})) if (row && row.ticker) m.set(String(row.ticker).toUpperCase(), row.cik_str);
    tickerMap = m;
  }
  const t = String(ticker || "").toUpperCase();
  return tickerMap.get(t) ?? tickerMap.get(t.replace(".", "-")) ?? null;
}

// Returns the RAW screening shape, or null when the SEC does not know the ticker. Throws on
// misconfiguration, a network failure or INCOMPLETE inputs so the resolver never fabricates.
export async function screen(ticker) {
  requireUserAgent();
  if (!process.env.TWELVEDATA_API_KEY) throw new Error("TWELVEDATA_API_KEY not set (needed for the 12-month average market cap)");
  const cik = await cikFor(ticker);
  if (cik == null) return null;
  const id = padCik(cik);
  const facts = await secJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${id}.json`);
  if (!facts) return null;
  const sub = await secJson(`https://data.sec.gov/submissions/CIK${id}.json`);
  const price = await fetchPrice(ticker);
  return ratiosFromFacts(facts, {
    sic: sub?.sic, sicDescription: sub?.sicDescription,
    avgClose: averageClose(price?.history), latestShares: latestShareCount(facts),
  });
}

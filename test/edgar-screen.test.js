// Self-test for the SEC EDGAR screening adapter: ratios computed from 10-K facts, the
// "refuse rather than guess" rules, the SIC activity screen and the resolver wiring.
// Run: npm test — or: node test/edgar-screen.test.js   (no network)
import assert from "node:assert";

import { classifyAAOIFI } from "../api/_lib/aaoifi.js";
import {
  averageClose, businessFromSic, fiscalYearEnd, latestShareCount, ratiosFromFacts, totalDebt,
} from "../api/_lib/screening/edgar.js";
import { activeScreener, usingLiveScreener, screeningProvider } from "../api/_lib/screening/index.js";
import { screen as edgarScreen } from "../api/_lib/screening/edgar.js";
import { screen as mockScreen } from "../api/_lib/screening/mock.js";
import { screen as halalTerminalScreen } from "../api/_lib/screening/halalterminal.js";

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };
const throwsIncomplete = (fn, re, msg) => {
  let err = null;
  try { fn(); } catch (e) { err = e; }
  ok(err && err.code === "INCOMPLETE" && re.test(err.message), msg + (err ? ` (got: ${err.message})` : " (did not throw)"));
};

// Build a minimal companyfacts object. spec: { Tag: value | [value, end] | { val, end, start, form, unit } }
const FY = "2025-12-31";
function facts(spec, { fy = FY, dei } = {}) {
  const gaap = {};
  for (const [tag, v] of Object.entries(spec)) {
    const o = typeof v === "object" && !Array.isArray(v) ? v : { val: Array.isArray(v) ? v[0] : v, end: Array.isArray(v) ? v[1] : fy };
    const unit = o.unit || (/Shares/.test(tag) ? "shares" : "USD");
    const row = { end: o.end || fy, val: o.val, form: o.form || "10-K", filed: o.filed || "2026-02-10" };
    if (o.start) row.start = o.start;
    (gaap[tag] ||= { units: {} }).units[unit] = [...(gaap[tag].units[unit] || []), row];
  }
  const out = { facts: { "us-gaap": gaap } };
  if (dei) out.facts.dei = { EntityCommonStockSharesOutstanding: { units: { shares: [{ end: "2026-10-20", val: dei, form: "10-Q" }] } } };
  return out;
}
const dur = (val, fy = FY) => ({ val, end: fy, start: `${Number(fy.slice(0, 4)) - 1}${fy.slice(4)}` }); // ~12-month period
const base = (extra = {}) => ({
  Assets: 500e9,
  Revenues: dur(200e9),
  InvestmentIncomeInterest: dur(2e9),
  LongTermDebt: 8e9,
  CashAndCashEquivalentsAtCarryingValue: 10e9,
  MarketableSecuritiesCurrent: 30e9,
  WeightedAverageNumberOfSharesOutstandingBasic: dur(10e9),
  ...extra,
});
const ctx = { sic: "3674", sicDescription: "Semiconductors & Related Devices", avgClose: 100 }; // mcap = $1,000B

// 1) Ratios from raw filing numbers; the engine (not the adapter) gives the verdict.
let r = ratiosFromFacts(facts(base()), ctx);
ok(r.screened === true && r.source === "sec-edgar" && r.fiscalYearEnd === FY, "screened from the latest 10-K");
ok(r.impurePct === 1 && r.debtRatio === 0.8 && r.cashPct === 4, "impure 2/200, debt 8/1000, cash 40/1000");
ok(r.businessStatus === "pass" && classifyAAOIFI(r) === "purify", "engine: purify");
ok(!("verdict" in r) && !("label" in r) && !("compliant" in r), "adapter returns no verdict");
ok(r.inputs.marketCap === 1000e9 && r.inputs.debt === 8e9, "raw inputs kept for audit");

// 2) AAOIFI limits are the engine's: debt over 30% and cash over 30% fail.
ok(classifyAAOIFI(ratiosFromFacts(facts(base({ LongTermDebt: 400e9 })), ctx)) === "fail", "debt 40% of market cap fails");
ok(classifyAAOIFI(ratiosFromFacts(facts(base({ MarketableSecuritiesNoncurrent: 300e9 })), ctx)) === "fail", "cash + securities 34% fails");
ok(classifyAAOIFI(ratiosFromFacts(facts(base({ InvestmentIncomeInterest: dur(12e9) })), ctx)) === "fail", "interest income 6% of revenue fails");

// 3) Debt assembly: no double counting of current maturities; commercial paper added.
ok(totalDebt(facts({ LongTermDebt: 78e9, LongTermDebtCurrent: 10e9, LongTermDebtNoncurrent: 68e9, CommercialPaper: 2e9 }), FY) === 80e9, "LongTermDebt (all maturities) + commercial paper");
ok(totalDebt(facts({ LongTermDebtNoncurrent: 7e9, LongTermDebtCurrent: 1e9, DebtCurrent: 1e9, LongTermDebt: 8e9 }), FY) === 8e9, "DebtCurrent already holds the current maturities");
ok(totalDebt(facts({ LongTermDebtAndCapitalLeaseObligations: 34e9, DebtCurrent: 9e9 }), FY) === 43e9, "long-term incl. leases + current debt");
ok(totalDebt(facts({ Assets: 1 }), FY) === 0, "a filer with no debt tags and no interest expense is debt-free");

// 4) Refuse rather than understate debt (an understated ratio would pass a failing name).
throwsIncomplete(() => totalDebt(facts({ DebtCurrent: 14e9 }), FY), /long-term debt is not/, "current debt without a long-term tag is refused");
throwsIncomplete(() => totalDebt(facts({ LongTermDebt: 10e9, InterestExpense: dur(3e9) }), FY), /interest expense is too large/, "interest expense too large for the debt found is refused");
throwsIncomplete(() => totalDebt(facts({ InterestExpense: dur(50e6) }), FY), /interest expense is too large/, "interest expense with no debt tags is refused");
ok(totalDebt(facts({ LongTermDebt: 10e9, InterestExpense: dur(0.5e9) }), FY) === 10e9, "normal interest cost passes the check");

// 5) Missing inputs are never replaced by zero.
const without = (k) => { const b = base(); delete b[k]; return facts(b); };
throwsIncomplete(() => ratiosFromFacts(without("InvestmentIncomeInterest"), ctx), /interest \/ investment income/, "no interest-income tag -> refused, not 0% (which would read as clean)");
throwsIncomplete(() => ratiosFromFacts(without("Revenues"), ctx), /revenue/, "no revenue -> refused");
throwsIncomplete(() => ratiosFromFacts(without("CashAndCashEquivalentsAtCarryingValue"), ctx), /cash/, "no cash -> refused");
throwsIncomplete(() => ratiosFromFacts(facts(base()), { ...ctx, avgClose: null }), /price history/, "no price history -> refused");
throwsIncomplete(() => ratiosFromFacts({ facts: { "us-gaap": {} } }, ctx), /no 10-K/, "no 10-K (foreign filer) -> refused");

// 6) A figure tagged for an OLDER year never stands in for this year's.
throwsIncomplete(() => ratiosFromFacts(facts(base({ InvestmentIncomeInterest: { val: 2e9, end: "2023-12-31", start: "2022-12-31" } })), ctx), /interest \/ investment income/, "stale interest-income tag ignored");
ok(totalDebt(facts({ LongTermDebt: 5e9, LongTermDebtNoncurrent: [99e9, "2021-12-31"] }), FY) === 5e9, "stale debt tag ignored");
// A quarterly (3-month) figure ending on the fiscal year end is not the annual figure.
throwsIncomplete(() => ratiosFromFacts(facts(base({ Revenues: { val: 50e9, end: FY, start: "2025-09-30" } })), ctx), /revenue/, "a 3-month period is not annual revenue");
// Restatement: the latest filing wins.
r = ratiosFromFacts(facts(base({ LongTermDebt: 8e9 })), ctx);
const restated = facts(base());
restated.facts["us-gaap"].LongTermDebt.units.USD.push({ end: FY, val: 20e9, form: "10-K/A", filed: "2026-06-01" });
ok(ratiosFromFacts(restated, ctx).debtRatio === 2, "restated value from the later filing is used");

// 7) Business-activity screen from the SIC code only.
ok(businessFromSic("6021").status === "fail" && businessFromSic(6311).status === "fail", "banks and insurers fail");
ok(businessFromSic("2111").status === "fail" && businessFromSic("2082").status === "fail", "tobacco and brewers fail");
ok(businessFromSic("7011").status === "watch" && businessFromSic("").status === "watch", "hotels / unknown -> watch");
ok(businessFromSic("3674").status === "pass" && businessFromSic("2911").status === "pass", "chips and oil pass the activity screen");
r = ratiosFromFacts(facts({ Assets: 1 }), { sic: "6021", sicDescription: "National Commercial Banks", avgClose: 50 });
ok(r.businessStatus === "fail" && classifyAAOIFI(r) === "fail" && /not computed/.test(r.reasoning), "a bank fails at the activity screen without ratios");
r = ratiosFromFacts(facts(base()), { ...ctx, sic: "7011", sicDescription: "Hotels & Motels" });
ok(r.businessStatus === "watch" && classifyAAOIFI(r) === "purify", "watch is shown but does not change the verdict");

// 8) Market cap inputs.
ok(fiscalYearEnd(facts({ Assets: [1, "2024-12-31"], Liabilities: 1 })) === FY, "fiscal year end = newest 10-K balance sheet");
ok(latestShareCount(facts({}, { dei: 123 })) === 123 && latestShareCount(facts({})) === null, "cover-page share count");
r = ratiosFromFacts(facts(base(), { dei: 100e9 }), { ...ctx, avgClose: 10, latestShares: 100e9 });
ok(r.inputs.shares === 100e9 && r.debtRatio === 0.8, "10-for-1 split after year end: newest share count is used with split-adjusted prices");
r = ratiosFromFacts(facts(base()), { ...ctx, latestShares: 9.8e9 });
ok(r.inputs.shares === 10e9, "ordinary buyback drift keeps the fiscal-year average");
const now = Date.parse("2026-11-14");
const hist = (n) => Array.from({ length: n }, (_, i) => ({ d: new Date(now - i * 86400000).toISOString().slice(0, 10), c: 100 + (i % 2 ? 10 : -10) }));
ok(averageClose(hist(250), now) === 100, "12-month mean close");
ok(averageClose(hist(60), now) === null, "too little history -> null, not a thin average");
ok(averageClose([...hist(250), { d: "2020-01-01", c: 9999 }], now) === 100, "prices older than a year are excluded");

// 9) Resolver wiring.
const keep = { ...process.env };
for (const k of ["SCREENING_API_KEY", "SCREENING_PROVIDER", "SEC_USER_AGENT", "TWELVEDATA_API_KEY"]) delete process.env[k];
ok(usingLiveScreener() === false && activeScreener() === mockScreen, "mock with no configuration");
process.env.SCREENING_PROVIDER = "edgar";
ok(activeScreener() === mockScreen, "edgar selected but SEC_USER_AGENT / price key missing -> mock");
process.env.SEC_USER_AGENT = "Test App ops@example.com";
ok(activeScreener() === mockScreen, "edgar still needs the price key");
process.env.TWELVEDATA_API_KEY = "k";
ok(usingLiveScreener() === true && activeScreener() === edgarScreen && screeningProvider() === "edgar", "edgar live with both set");
process.env.SCREENING_API_KEY = "vendor";
ok(activeScreener() === edgarScreen, "an unrelated vendor key does not override SCREENING_PROVIDER=edgar");
delete process.env.SCREENING_PROVIDER;
ok(activeScreener() === halalTerminalScreen, "default provider unchanged: Halal Terminal when SCREENING_API_KEY is set");
for (const k of Object.keys(process.env)) if (!(k in keep)) delete process.env[k];
Object.assign(process.env, keep);

console.log(`SEC EDGAR screening adapter: ${pass} checks PASSED`);

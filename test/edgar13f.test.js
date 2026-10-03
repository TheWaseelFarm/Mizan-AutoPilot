// Self-test for the SEC EDGAR 13F source (api/_lib/sources/edgar13f.js). No network: fetch is
// stubbed and served from recorded / synthetic fixtures under test/fixtures/edgar13f/.
// Run: npm test  — or: node test/edgar13f.test.js
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FUNDS, fetchNew13FDisclosures, fundLatest, fundSnapshot, parseInfoTable, valueMultiplier,
  latestPeriodFilings, resolveSnapshot, findInfoTableName, pickFigi, requireUserAgent, fmtDate,
} from "../api/_lib/sources/edgar13f.js";

const FX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "edgar13f");
const fx = (f) => fs.readFileSync(path.join(FX, f), "utf8");
const FIGI = JSON.parse(fx("openfigi.json")); // recorded OpenFIGI responses keyed by CUSIP

let pass = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  pass++;
};

// ---- fetch stub ----------------------------------------------------------------------
const UA = "Mizan test suite (contact via repo owner)";
const ARCH = "https://www.sec.gov/Archives/edgar/data";
const indexOf = (dir, table) => JSON.stringify({ directory: { item: [
  { name: "primary_doc.xml" }, { name: `${dir}-index.html` }, ...(table ? [{ name: table }] : []),
] } });
const ROUTES = {
  // Pershing Square Inc. — recorded live (Q2 2026 13F-HR).
  "https://data.sec.gov/submissions/CIK0002026053.json": () => fx("pershing-submissions.json"),
  [`${ARCH}/2026053/000117266126003790/index.json`]: () => fx("pershing-index.json"),
  [`${ARCH}/2026053/000117266126003790/infotable.xml`]: () => fx("pershing-infotable.xml"),
  // Test Capital — synthetic: 13F-HR, then a RESTATEMENT and a NEW HOLDINGS amendment.
  "https://data.sec.gov/submissions/CIK0009999999.json": () => fx("testcap-submissions.json"),
  [`${ARCH}/9999999/000999999926000003/primary_doc.xml`]: () => fx("testcap-restatement-primary_doc.xml"),
  [`${ARCH}/9999999/000999999926000004/primary_doc.xml`]: () => fx("testcap-newholdings-primary_doc.xml"),
  [`${ARCH}/9999999/000999999926000003/index.json`]: () => indexOf("000999999926000003", "restated_table.xml"),
  [`${ARCH}/9999999/000999999926000004/index.json`]: () => indexOf("000999999926000004", "50240.xml"),
  [`${ARCH}/9999999/000999999926000003/restated_table.xml`]: () => fx("testcap-restatement-table.xml"),
  [`${ARCH}/9999999/000999999926000004/50240.xml`]: () => fx("testcap-newholdings-table.xml"),
  // (the superseded original 000999999926000002 has NO route: fetching it fails the test)
  // Legacy Partners — synthetic pre-2023 filing (values in $ thousands).
  "https://data.sec.gov/submissions/CIK0008888888.json": () => fx("legacy-submissions.json"),
  [`${ARCH}/8888888/000888888822000002/index.json`]: () => indexOf("000888888822000002", "form13fInfoTable.xml"),
  [`${ARCH}/8888888/000888888822000002/form13fInfoTable.xml`]: () => fx("legacy-2022.xml"),
};

let calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  calls.push({ url, init });
  if (url === "https://api.openfigi.com/v3/mapping") {
    const jobs = JSON.parse(init.body);
    const body = jobs.map((j) => FIGI[j.idValue] || { warning: "No identifier found." });
    return { status: 200, ok: true, json: async () => body, text: async () => JSON.stringify(body) };
  }
  const route = ROUTES[url];
  if (!route) return { status: 404, ok: false, json: async () => ({}), text: async () => "not found" };
  const text = route();
  return { status: 200, ok: true, json: async () => JSON.parse(text), text: async () => text };
};
const secCalls = () => calls.filter((c) => !c.url.includes("openfigi"));
const figiJobs = () => calls.filter((c) => c.url.includes("openfigi")).reduce((n, c) => n + JSON.parse(c.init.body).length, 0);

const PERSHING = FUNDS.find((f) => f.actor === "Pershing Square");
const TESTCAP = { actor: "Test Capital", cik: "0009999999", secName: "TEST CAPITAL LLC" };
const LEGACY = { actor: "Legacy Partners", cik: "0008888888", secName: "LEGACY PARTNERS LP" };
const NOW = Date.parse("2026-10-03T00:00:00Z");

process.env.SEC_MIN_INTERVAL_MS = "0";
delete process.env.OPENFIGI_API_KEY;
delete process.env.SEC13F_TOP_N;
delete process.env.SEC13F_FUNDS_PER_RUN;

try {
  // 1) Missing SEC_USER_AGENT -> clear error, and no request is made.
  delete process.env.SEC_USER_AGENT;
  calls = [];
  assert.throws(() => requireUserAgent(), /SEC_USER_AGENT not set/);
  pass++;
  await assert.rejects(fetchNew13FDisclosures({ funds: [PERSHING], now: NOW }), /SEC_USER_AGENT not set/);
  pass++;
  await assert.rejects(fundLatest(PERSHING), /SEC_USER_AGENT not set/);
  pass++;
  ok(calls.length === 0, "UA missing: nothing fetched");

  process.env.SEC_USER_AGENT = UA;

  // 2) Value units by filing date: thousands before 2023-01-03, whole dollars from then on.
  ok(valueMultiplier("2022-11-14") === 1000, "pre-2023 filing: value x1000");
  ok(valueMultiplier("2023-01-02") === 1000, "2023-01-02: still thousands");
  ok(valueMultiplier("2023-01-03") === 1, "2023-01-03: dollars");
  ok(valueMultiplier("2026-08-14") === 1, "2026 filing: dollars");
  const legacyParsed = parseInfoTable(fx("legacy-2022.xml"), { filingDate: "2022-11-14" });
  ok(legacyParsed.holdings.find((h) => h.cusip === "594918104").value === 2329000, "legacy MSFT 2,329 -> $2,329,000");
  const sameXmlNewDate = parseInfoTable(fx("legacy-2022.xml"), { filingDate: "2023-02-14" });
  ok(sameXmlNewDate.holdings.find((h) => h.cusip === "594918104").value === 2329, "same XML filed 2023+ read as dollars");

  // End-to-end on the legacy filer (old period -> pass `now` + max age so it is not 'stale').
  calls = [];
  const legacyMeta = await fundLatest(LEGACY, { now: Date.parse("2022-12-01T00:00:00Z") });
  const legacy = await fundSnapshot(LEGACY, legacyMeta);
  ok(legacy.rows.length === 3, "legacy: 3 mapped positions");
  ok(legacy.rows[0].ticker === "NFLX" && legacy.rows[0].positionValue === 2354000, "legacy: values scaled to USD, sorted desc");
  ok(legacy.rows[0].transactionDate === "Sep 30, 2022" && legacy.rows[0].filingDate === "Nov 14, 2022", "legacy: period + filing dates");

  // 3) Real Pershing filing (recorded): parse, aggregate, map, row shape.
  calls = [];
  const psMeta = await fundLatest(PERSHING);
  ok(psMeta.period === "2026-06-30" && psMeta.filed === "2026-08-14", "pershing: latest period/filed");
  ok(psMeta.snapshot.length === 1 && psMeta.snapshot[0].accession === "0001172661-26-003790", "pershing: snapshot = the 13F-HR");
  ok(psMeta.amended === false, "pershing: not amended");
  const ps = await fundSnapshot(PERSHING, psMeta);
  ok(secCalls().every((c) => c.init.headers["User-Agent"] === UA), "every SEC request carries SEC_USER_AGENT");
  ok(secCalls().length === 3, "pershing: submissions + index + info table only");
  ok(ps.stats.rows === 15 && ps.stats.positions === 14, "pershing: 15 rows -> 14 CUSIPs (HHH reported twice)");
  const hhh = ps.rows.find((r) => r.ticker === "HHH");
  ok(hhh && hhh.positionValue === 1347734055 + 643410000, "pershing: same-CUSIP rows aggregated");
  ok(!ps.rows.some((r) => r.ticker === "PSUS"), "pershing: closed-end fund (non-equity) skipped");
  ok(ps.stats.unmappedCusips === 1, "pershing: 1 unmapped/non-equity CUSIP counted");
  ok(ps.rows.length === 13, "pershing: 13 equity positions kept");
  const uber = ps.rows[0];
  ok(uber.ticker === "UBER" && uber.positionValue === 2476978592 && uber.amountMid === 2476978592, "pershing: top position UBER, value in USD");
  ok(uber.actor === "Pershing Square" && uber.kind === "13F Fund" && uber.source === "SEC 13F" && uber.side === "BUY", "row: shared disclosure shape");
  ok(uber.initials === "PS" && uber.shares === 34326200 && uber.sharesLabel === "34,326,200 sh held", "row: initials + shares");
  ok(uber.transactionDate === "Jun 30, 2026" && uber.filingDate === "Aug 14, 2026", "row: transactionDate = period end, filingDate = filed");
  ok(uber.__replace === undefined, "row: un-amended snapshot never overwrites");
  ok(new Set(ps.rows.map((r) => r.ticker)).size === ps.rows.length, "one row per (fund, ticker, period)");

  // 4) Top-N cap (env-tunable).
  process.env.SEC13F_TOP_N = "5";
  calls = [];
  const top5 = await fundSnapshot(PERSHING, psMeta);
  ok(top5.rows.length === 5, "top-N: capped at SEC13F_TOP_N=5");
  ok(top5.rows.map((r) => r.ticker).join(",") === "UBER,BN,MSFT,AMZN,HHH", "top-N: largest positions by value");
  ok(figiJobs() === 10, "top-N: only one OpenFIGI batch needed for N=5");
  delete process.env.SEC13F_TOP_N;

  // 5) Options + principal rows skipped; unmapped CUSIP skipped (never guessed).
  const restated = parseInfoTable(fx("testcap-restatement-table.xml"), { filingDate: "2026-08-30" });
  ok(restated.stats.options === 2, "options: put + call rows skipped");
  ok(restated.stats.principal === 1, "PRN (note) row skipped");
  ok(!restated.holdings.some((h) => h.cusip === "90353TAJ9"), "PRN CUSIP absent");
  const msft = restated.holdings.find((h) => h.cusip === "594918104");
  ok(msft.value === 4000000 && msft.shares === 10000, "namespaced rows parsed; option row not added to MSFT");
  ok(!restated.holdings.some((h) => h.cusip === "023135106"), "AMZN put-only exposure not treated as a holding");
  ok(restated.holdings.find((h) => h.cusip === "78409V104").name === "S&P GLOBAL INC", "XML entities decoded");

  // 6) Amendment handling: RESTATEMENT replaces the original, NEW HOLDINGS adds to it.
  calls = [];
  const tcMeta = await fundLatest(TESTCAP, { now: NOW });
  ok(tcMeta.filings.length === 3, "amend: 3 filings for the latest period (Form 4 + older period ignored)");
  ok(tcMeta.snapshot.map((f) => f.accession).join(",") === "0009999999-26-000003,0009999999-26-000004", "amend: snapshot = restatement + new holdings");
  ok(tcMeta.filed === "2026-09-10" && tcMeta.amended === true, "amend: filed = latest amendment");
  const tc = await fundSnapshot(TESTCAP, tcMeta);
  ok(!calls.some((c) => c.url.includes("000999999926000002")), "amend: superseded original never fetched");
  ok(tc.rows.map((r) => r.ticker).join(",") === "MSFT,SPGI,V", "amend: restated rows + new-holdings row; unmapped/fund skipped");
  ok(tc.stats.unmappedCusips === 2, "amend: unmapped CUSIP + closed-end fund counted, not guessed");
  ok(tc.rows.every((r) => r.__replace === true && r.filingDate === "Sep 10, 2026"), "amend: rows overwrite stored values, carry amendment date");
  ok(tc.stats.options === 2 && tc.stats.principal === 1, "amend: skip stats reported");

  // resolveSnapshot rules in isolation.
  const F = (form, accession, filingDate) => ({ form, accession, filingDate, period: "2026-06-30" });
  const base = F("13F-HR", "a1", "2026-08-14");
  ok(resolveSnapshot([base, F("13F-HR/A", "a2", "2026-08-20")], {}).map((f) => f.accession).join() === "a1", "unknown amendment type ignored");
  ok(resolveSnapshot([base, F("13F-HR/A", "a2", "2026-08-20")], { a2: "NEW HOLDINGS" }).length === 2, "new holdings appended");
  ok(resolveSnapshot([base, F("13F-HR/A", "a2", "2026-08-20"), F("13F-HR/A", "a3", "2026-08-30")], { a2: "NEW HOLDINGS", a3: "RESTATEMENT" }).map((f) => f.accession).join() === "a3", "later restatement replaces all");
  const lp = latestPeriodFilings({ filings: { recent: { form: ["13F-NT", "13F-HR"], accessionNumber: ["n1", "h1"], filingDate: ["2026-08-14", "2026-05-15"], reportDate: ["2026-06-30", "2026-03-31"] } } });
  ok(lp.period === "2026-03-31" && lp.filings.length === 1, "13F-NT notice ignored (falls back to last holdings report)");
  ok(latestPeriodFilings({ filings: { recent: { form: ["4"] } } }) === null, "no 13F-HR -> null");

  // Small helpers.
  ok(findInfoTableName({ directory: { item: [{ name: "primary_doc.xml" }, { name: "x-index.html" }, { name: "50240.xml" }] } }) === "50240.xml", "info table found without 'infotable' in name");
  ok(findInfoTableName({ directory: { item: [{ name: "primary_doc.xml" }] } }) === null, "primary_doc.xml never used as info table");
  ok(pickFigi({ data: [{ ticker: "BRK/B", marketSector: "Equity", securityType: "Common Stock", exchCode: "US" }] }).ticker === "BRK.B", "class-share ticker normalised");
  ok(pickFigi({ data: [{ ticker: "SPY", marketSector: "Equity", securityType: "ETP", exchCode: "US" }] }) === null, "ETF not treated as a single stock");
  ok(pickFigi({ warning: "No identifier found." }) === null, "no FIGI -> null");
  ok(fmtDate("2026-06-30") === "Jun 30, 2026", "fmtDate is timezone-proof");

  // 7) Poll entry point: change detection, per-run cap, staleness, name check.
  calls = [];
  const seen = [];
  let r = await fetchNew13FDisclosures({
    funds: [PERSHING, TESTCAP], now: NOW,
    isIngested: async (actor, filed) => { seen.push(`${actor}|${filed}`); return actor === "Pershing Square"; },
  });
  ok(seen.join(";") === "Pershing Square|Aug 14, 2026;Test Capital|Sep 10, 2026", "gate keyed on (actor, snapshot filing date)");
  ok(r.report.upToDate === 1 && r.report.ingested.length === 1 && r.report.ingested[0].actor === "Test Capital", "already-ingested fund skipped");
  ok(!calls.some((c) => c.url.includes("/2026053/")), "up-to-date fund: no info-table fetch");
  ok(r.rows.length === 3, "only the new fund's rows returned");

  process.env.SEC13F_FUNDS_PER_RUN = "1";
  r = await fetchNew13FDisclosures({ funds: [PERSHING, TESTCAP], now: NOW });
  ok(r.report.ingested.length === 1 && r.report.deferred === 1, "SEC13F_FUNDS_PER_RUN caps ingestion; rest deferred");
  delete process.env.SEC13F_FUNDS_PER_RUN;

  r = await fetchNew13FDisclosures({ funds: [LEGACY], now: NOW });
  ok(r.report.stale === 1 && r.rows.length === 0, "stale filer (period > max age) skipped");

  r = await fetchNew13FDisclosures({ funds: [{ ...PERSHING, secName: "SOMEONE ELSE LLC" }], now: NOW });
  ok(r.rows.length === 0 && /expected "SOMEONE ELSE LLC"/.test(r.report.errors[0]), "CIK/name mismatch -> fund skipped");

  // 8) Curated list sanity: unique, 10-digit CIKs, every fund carries its EDGAR name.
  ok(new Set(FUNDS.map((f) => f.cik)).size === FUNDS.length, "FUNDS: unique CIKs");
  ok(FUNDS.every((f) => /^\d{10}$/.test(f.cik) && f.secName && f.actor), "FUNDS: well-formed");
} finally {
  globalThis.fetch = realFetch;
}

console.log(`EDGAR 13F: ${pass} checks PASSED`);

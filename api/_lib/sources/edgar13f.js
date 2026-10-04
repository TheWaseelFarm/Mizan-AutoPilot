// api/_lib/sources/edgar13f.js
// INSTITUTIONAL 13F source — read straight from SEC EDGAR (free, official, no key).
//
// A 13F-HR is a quarterly POSITION SNAPSHOT (value + share count per holding), not a trade. Each
// reported holding becomes one disclosure row per (fund, ticker, report period) in the shared
// disclosure shape (see quiver.js map13F / thirteenf.js): side 'BUY' (= a held position),
// positionValue = the reported value (USD), transactionDate = period end, filingDate = the date the
// current snapshot was filed (the latest amendment's date once a period has been amended).
//
// Pipeline per fund:
//   1. data.sec.gov/submissions/CIK##########.json  -> latest report period's 13F-HR (+ /A)
//   2. Archives/.../<accession>/index.json           -> the information-table XML (not primary_doc)
//   3. parse <infoTable> rows (skip options + principal-amount rows), aggregate per CUSIP
//   4. OpenFIGI CUSIP -> ticker (equities only); unmapped CUSIPs are SKIPPED, never guessed
//   5. keep the fund's top N positions by value (bounded screening / API cost)
//
// SEC fair-access policy: every request carries SEC_USER_AGENT (company + contact) and requests
// are serialized at <= ~8/s. With SEC_USER_AGENT unset this module THROWS — it never guesses a UA.
//
// Env:
//   SEC_USER_AGENT          required, e.g. "Mizan Market Intelligence ops@<your-domain>"
//   SEC13F_TOP_N            positions kept per fund (default 25)
//   ENABLE_13F=1            turns the source on in api/poll-disclosures.js (off by default)
//   SEC13F_FUNDS_PER_RUN    max funds INGESTED per poll run (default 1; the per-fund "anything
//                           new?" check is one small submissions request and always runs)
//   SEC13F_MAX_AGE_DAYS     ignore filings whose period ended longer ago (default 200)
//   SEC_MIN_INTERVAL_MS     spacing between SEC requests (default 125 = 8 req/s)
//   OPENFIGI_API_KEY        optional; raises OpenFIGI limits (100 jobs/request vs 10)

const SEC_DATA = "https://data.sec.gov";
const SEC_WWW = "https://www.sec.gov";
const OPENFIGI_URL = "https://api.openfigi.com/v3/mapping";
const TIMEOUT_MS = 20000;
// Filings made on/after this date report <value> in whole dollars; earlier ones in $ thousands.
const DOLLARS_SINCE = "2023-01-03";

// Curated large 13F filers. Every CIK below was verified against data.sec.gov/submissions
// (the `secName` is the exact EDGAR entity name; fetches are skipped if it ever differs).
// Scion Asset Management (0001649339) is deliberately absent: it deregistered and its last
// 13F covers 2025-09-30. Pershing Square Capital Management (0001336528) now files 13F-NT
// pointing at its public parent PERSHING SQUARE INC., so that parent CIK is used.
export const FUNDS = [
  { actor: "Berkshire Hathaway",        cik: "0001067983", secName: "BERKSHIRE HATHAWAY INC" },
  { actor: "Bridgewater Associates",    cik: "0001350694", secName: "Bridgewater Associates, LP" },
  { actor: "Renaissance Technologies",  cik: "0001037389", secName: "RENAISSANCE TECHNOLOGIES LLC" },
  { actor: "Citadel Advisors",          cik: "0001423053", secName: "CITADEL ADVISORS LLC" },
  { actor: "Pershing Square",           cik: "0002026053", secName: "PERSHING SQUARE INC." },
  { actor: "Appaloosa",                 cik: "0001656456", secName: "Appaloosa LP" },
  { actor: "Tiger Global Management",   cik: "0001167483", secName: "TIGER GLOBAL MANAGEMENT LLC" },
  { actor: "Coatue Management",         cik: "0001135730", secName: "COATUE MANAGEMENT LLC" },
  { actor: "Duquesne Family Office",    cik: "0001536411", secName: "Duquesne Family Office LLC" },
  { actor: "Third Point",               cik: "0001040273", secName: "Third Point LLC" },
  { actor: "Baupost Group",             cik: "0001061768", secName: "BAUPOST GROUP LLC/MA" },
  { actor: "ARK Investment Management", cik: "0001697748", secName: "ARK Investment Management LLC" },
];

// OpenFIGI security types we treat as a single stock that can carry an AAOIFI verdict.
// ETFs/funds, preferreds, warrants, rights and units are skipped (counted as non-equity).
const EQUITY_TYPES = new Set([
  "Common Stock", "ADR", "GDR", "REIT", "MLP", "NY Reg Shrs", "Tracking Stk", "Ltd Part",
  "Dutch Cert", "Receipt", "Depositary Receipt",
]);

const intEnv = (k, d) => {
  const n = parseInt(process.env[k], 10);
  return Number.isFinite(n) && n >= 0 ? n : d;
};
export const enabled13F = () => /^(1|true|yes|on)$/i.test(String(process.env.ENABLE_13F || ""));

/** The SEC User-Agent, or a clear error. Never guessed / hard-coded. */
export function requireUserAgent() {
  const ua = String(process.env.SEC_USER_AGENT || "").trim();
  if (!ua) throw new Error("SEC_USER_AGENT not set — SEC fair-access policy requires a descriptive User-Agent with contact info");
  return ua;
}

// ---- small helpers -----------------------------------------------------------

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
/** 'YYYY-MM-DD' -> 'Mon DD, YYYY' (same display format as quiver.js), timezone-proof. */
export function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  return `${MONTHS[Number(m[2]) - 1]} ${m[3]}, ${m[1]}`;
}
export const padCik = (cik) => String(cik).replace(/\D/g, "").padStart(10, "0");
const normName = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
function initialsOf(name) {
  const p = String(name || "").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "FN";
}
const money = (n) => (n == null ? "" : `$${Math.round(n).toLocaleString("en-US")}`);
function decodeXml(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&")
    .trim();
}
// First <tag> (any namespace prefix) inside an XML fragment.
function tag(xml, name) {
  const m = new RegExp(`<(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "i").exec(xml);
  return m ? decodeXml(m[1]) : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- HTTP (SEC throttled; OpenFIGI separate) -----------------------------------

// Request STARTS are spaced >= SEC_MIN_INTERVAL_MS apart (default 125ms = 8/s, under SEC's 10/s),
// even when callers run concurrently: each call synchronously reserves the next free slot.
let nextSecSlot = 0;
async function secFetch(url, { as = "json" } = {}) {
  const ua = requireUserAgent();
  const gap = intEnv("SEC_MIN_INTERVAL_MS", 125);
  const now = Date.now();
  const start = Math.max(now, nextSecSlot);
  nextSecSlot = start + gap;
  if (start > now) await sleep(start - now);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": ua, Accept: as === "json" ? "application/json" : "application/xml,text/xml,*/*" },
      signal: ctrl.signal,
    });
    if (res.status === 403) {
      const e = new Error("SEC refused the request (HTTP 403) — SEC_USER_AGENT must name the app/company and a contact email");
      e.code = "SEC_BLOCKED";
      throw e;
    }
    if (res.status === 429) {
      const e = new Error("SEC rate limit (HTTP 429)");
      e.code = "RATE_LIMIT";
      throw e;
    }
    if (!res.ok) throw new Error(`SEC HTTP ${res.status} for ${url}`);
    return as === "json" ? await res.json() : await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ---- filing selection -------------------------------------------------------------

/**
 * From a submissions JSON, the 13F-HR / 13F-HR/A filings for the LATEST report period, oldest
 * filing first. 13F-NT (notice: holdings reported by another manager) is ignored.
 * Returns null when the filer has no holdings report.
 */
export function latestPeriodFilings(submissions) {
  const r = submissions?.filings?.recent || {};
  const forms = r.form || [];
  const all = [];
  for (let i = 0; i < forms.length; i++) {
    const form = String(forms[i] || "").toUpperCase();
    if (form !== "13F-HR" && form !== "13F-HR/A") continue;
    const period = r.reportDate?.[i];
    if (!period || !r.accessionNumber?.[i]) continue;
    all.push({
      form,
      accession: r.accessionNumber[i],
      filingDate: r.filingDate?.[i] || "",
      period,
      primaryDocument: r.primaryDocument?.[i] || "",
    });
  }
  if (!all.length) return null;
  const period = all.reduce((m, f) => (f.period > m ? f.period : m), "");
  const filings = all
    .filter((f) => f.period === period)
    .sort((a, b) => (a.filingDate === b.filingDate ? a.accession.localeCompare(b.accession) : a.filingDate.localeCompare(b.filingDate)));
  return { period, filings };
}

/** Amendment type from a 13F primary_doc.xml: 'RESTATEMENT' | 'NEW HOLDINGS' | null. */
export function amendmentTypeOf(primaryDocXml) {
  const t = tag(String(primaryDocXml || ""), "amendmentType");
  if (!t) return null;
  const u = t.toUpperCase();
  if (u.includes("RESTATEMENT")) return "RESTATEMENT";
  if (u.includes("NEW HOLDINGS")) return "NEW HOLDINGS";
  return null;
}

/**
 * Resolve which filings make up the current snapshot for the period (oldest first):
 *   • a 13F-HR (or a RESTATEMENT amendment) REPLACES everything filed before it;
 *   • a NEW HOLDINGS amendment ADDS to the current set (e.g. positions released from
 *     confidential treatment);
 *   • an amendment whose type is unknown is ignored rather than guessed.
 * `amendTypes` maps accession -> amendment type.
 */
export function resolveSnapshot(filings, amendTypes = {}) {
  let set = [];
  for (const f of filings) {
    if (f.form === "13F-HR") { set = [f]; continue; }
    const t = amendTypes[f.accession];
    if (t === "RESTATEMENT") set = [f];
    else if (t === "NEW HOLDINGS") set.push(f);
  }
  return set;
}

/** The information-table XML in a filing index (never primary_doc.xml). */
export function findInfoTableName(indexJson) {
  const items = (indexJson?.directory?.item || []).map((i) => i.name).filter(Boolean);
  const xmls = items.filter((n) => /\.xml$/i.test(n) && !/^primary_doc\.xml$/i.test(n));
  return xmls.find((n) => /info.?table/i.test(n)) || xmls[0] || null;
}

/** Multiplier to convert reported <value> to USD: x1000 for filings before 2023-01-03. */
export const valueMultiplier = (filingDate) => (String(filingDate || "") < DOLLARS_SINCE ? 1000 : 1);

/**
 * Parse an information table into holdings, aggregated per CUSIP (a manager often reports the
 * same security across several rows — by sub-manager / discretion). Skips option rows (putCall)
 * and principal-amount rows (PRN = bonds/notes). `value` is returned in USD.
 */
export function parseInfoTable(xml, { filingDate } = {}) {
  const mult = valueMultiplier(filingDate);
  const re = /<(?:[\w-]+:)?infoTable\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?infoTable>/gi;
  const byCusip = new Map();
  const stats = { rows: 0, options: 0, principal: 0, invalid: 0 };
  let m;
  while ((m = re.exec(String(xml || "")))) {
    stats.rows++;
    const row = m[1];
    if (tag(row, "putCall")) { stats.options++; continue; }
    const type = (tag(row, "sshPrnamtType") || "SH").toUpperCase();
    if (type !== "SH") { stats.principal++; continue; }
    const cusip = (tag(row, "cusip") || "").toUpperCase().replace(/\s/g, "");
    const value = Number(tag(row, "value"));
    const shares = Number(tag(row, "sshPrnamt"));
    if (!/^[0-9A-Z]{9}$/.test(cusip) || !Number.isFinite(value)) { stats.invalid++; continue; }
    const h = byCusip.get(cusip) || { cusip, name: tag(row, "nameOfIssuer") || cusip, titleOfClass: tag(row, "titleOfClass") || "", value: 0, shares: 0 };
    h.value += value * mult;
    h.shares += Number.isFinite(shares) ? shares : 0;
    byCusip.set(cusip, h);
  }
  const holdings = [...byCusip.values()].sort((a, b) => b.value - a.value);
  return { holdings, stats };
}

/** Merge holdings from several filings of one snapshot (NEW HOLDINGS amendments add rows). */
export function mergeHoldings(lists) {
  const by = new Map();
  for (const holdings of lists) {
    for (const h of holdings) {
      const cur = by.get(h.cusip);
      if (cur) { cur.value += h.value; cur.shares += h.shares; }
      else by.set(h.cusip, { ...h });
    }
  }
  return [...by.values()].sort((a, b) => b.value - a.value);
}

// ---- CUSIP -> ticker (OpenFIGI) ---------------------------------------------------

/** Pick the US-listed equity from one OpenFIGI mapping result; null if none qualifies. */
export function pickFigi(result) {
  const data = Array.isArray(result?.data) ? result.data : [];
  const eq = data.filter((d) => d && d.marketSector === "Equity" && d.ticker && EQUITY_TYPES.has(d.securityType));
  const best = eq.find((d) => d.exchCode === "US") || eq[0];
  if (!best) return null;
  const ticker = String(best.ticker).trim().toUpperCase().replace(/\//g, ".");
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,9}$/.test(ticker)) return null;
  return { ticker, name: best.name || "", securityType: best.securityType };
}

/**
 * Map CUSIPs to tickers via OpenFIGI. Returns Map(cusip -> {ticker,...} | null). A rate limit
 * stops mapping (remaining CUSIPs are simply absent = skipped, never guessed).
 */
export async function mapCusips(cusips, cache = new Map()) {
  const key = String(process.env.OPENFIGI_API_KEY || "").trim();
  const batch = key ? 100 : 10;
  const todo = [...new Set(cusips)].filter((c) => !cache.has(c));
  for (let i = 0; i < todo.length; i += batch) {
    const chunk = todo.slice(i, i + batch);
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (key) headers["X-OPENFIGI-APIKEY"] = key;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(OPENFIGI_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(chunk.map((idValue) => ({ idType: "ID_CUSIP", idValue, exchCode: "US" }))),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 429) {
      const e = new Error("OpenFIGI rate limit (HTTP 429)");
      e.code = "RATE_LIMIT";
      throw e;
    }
    if (!res.ok) throw new Error(`OpenFIGI HTTP ${res.status}`);
    const out = await res.json();
    chunk.forEach((c, j) => cache.set(c, pickFigi(out?.[j])));
  }
  return cache;
}

// ---- rows -------------------------------------------------------------------------

const INT_MAX = 2147483647; // disclosures.shares is a Postgres integer

/**
 * Build disclosure rows (shared shape) from ticker-mapped holdings. Every row of a snapshot carries
 * the snapshot's filing date (`filed` = the latest filing that makes up the snapshot, i.e. the
 * amendment date once a period has been amended). `amended` marks rows that must overwrite
 * previously stored values (RESTATEMENT) / filing dates (NEW HOLDINGS).
 */
export function buildRows(fund, holdings, { period, filed, amended = false } = {}) {
  return holdings.map((h) => ({
    actor: fund.actor,
    kind: "13F Fund",
    initials: initialsOf(fund.actor),
    source: "SEC 13F",
    side: "BUY", // a reported held position; an exited name simply drops out of the next filing
    ticker: h.ticker,
    company: h.name || h.ticker,
    sector: "",
    amount: money(h.value),
    amountMid: h.value,          // kept in sync so legacy weight paths still work
    positionValue: h.value,      // authoritative reported holding value (USD)
    shares: Number.isFinite(h.shares) && h.shares > 0 && h.shares <= INT_MAX ? Math.round(h.shares) : null,
    sharesLabel: h.shares > 0 ? `${Math.round(h.shares).toLocaleString("en-US")} sh held` : "Not disclosed",
    transactionDate: fmtDate(period),   // report period end (the snapshot date)
    filingDate: fmtDate(filed),
    purchasePrice: 0, fallbackPrice: 0,
    alert: `13F position in ${h.ticker} as of ${fmtDate(period)}`,
    confidence: "—",
    // An amended snapshot supersedes what was stored for the period (values + filing date), so
    // the poll loop upserts these instead of ignoring the duplicate key.
    __replace: amended || undefined,
  }));
}

/**
 * Collapse mapped holdings to one entry per ticker (two CUSIPs can map to one ticker), skip
 * unmapped ones, and keep the top N by value.
 */
export function topMapped(holdings, figiMap, topN) {
  const byTicker = new Map();
  let unmapped = 0;
  for (const h of holdings) {
    const f = figiMap.get(h.cusip);
    if (!f) { if (figiMap.has(h.cusip)) unmapped++; continue; }
    const cur = byTicker.get(f.ticker);
    if (cur) { cur.value += h.value; cur.shares += h.shares; }
    else byTicker.set(f.ticker, { ...h, ticker: f.ticker });
  }
  const rows = [...byTicker.values()].sort((a, b) => b.value - a.value).slice(0, topN);
  return { rows, unmapped };
}


// ---- per fund ---------------------------------------------------------------------

const archiveDir = (fund, acc) =>
  `${SEC_WWW}/Archives/edgar/data/${Number(padCik(fund.cik))}/${String(acc).replace(/-/g, "")}`;

/**
 * Resolve a fund's current snapshot for its latest report period: 1 submissions request, plus one
 * small primary_doc request per amendment in that period (amendments are rare). Throws on a
 * CIK/name mismatch. Returns null when the filer has no 13F-HR on file.
 *   -> { period, filings, snapshot, filed, amended }
 * `filed` is the latest filing date within the snapshot — the change-detection key.
 */
export async function fundLatest(fund, { maxPeriodAgeMs = Infinity, now = Date.now() } = {}) {
  const sub = await secFetch(`${SEC_DATA}/submissions/CIK${padCik(fund.cik)}.json`);
  if (fund.secName && normName(sub?.name) !== normName(fund.secName))
    throw new Error(`CIK ${fund.cik} is "${sub?.name}", expected "${fund.secName}"`);
  const latest = latestPeriodFilings(sub);
  if (!latest) return null;
  if (now - Date.parse(latest.period + "T00:00:00Z") > maxPeriodAgeMs) return { ...latest, stale: true };

  const amendTypes = {};
  for (const f of latest.filings) {
    if (f.form !== "13F-HR/A") continue;
    try {
      const doc = /\.xml$/i.test(f.primaryDocument) ? f.primaryDocument.split("/").pop() : "primary_doc.xml";
      amendTypes[f.accession] = amendmentTypeOf(await secFetch(`${archiveDir(fund, f.accession)}/${doc}`, { as: "text" }));
    } catch (e) {
      if (e.code) throw e;              // blocked / rate limited -> caller stops the run
      amendTypes[f.accession] = null;   // unreadable amendment -> ignored, never guessed
    }
  }
  const snapshot = resolveSnapshot(latest.filings, amendTypes);
  const filed = snapshot.reduce((m, f) => (f.filingDate > m ? f.filingDate : m), "");
  return { ...latest, snapshot, filed, amended: snapshot.some((f) => f.form === "13F-HR/A") };
}

/**
 * Fetch + parse the snapshot's information table(s) and return the fund's top-N rows.
 * `meta` is the result of fundLatest(). `figiCache` is shared across funds within a run.
 */
export async function fundSnapshot(fund, meta, { topN = intEnv("SEC13F_TOP_N", 25), figiCache = new Map() } = {}) {
  if (!meta?.snapshot?.length) return { rows: [], stats: { reason: "no usable holdings report" } };

  const lists = [];
  const parseStats = { rows: 0, options: 0, principal: 0, invalid: 0 };
  for (const f of meta.snapshot) {
    const idx = await secFetch(`${archiveDir(fund, f.accession)}/index.json`);
    const name = findInfoTableName(idx);
    if (!name) continue;
    const xml = await secFetch(`${archiveDir(fund, f.accession)}/${name}`, { as: "text" });
    const { holdings, stats } = parseInfoTable(xml, { filingDate: f.filingDate });
    for (const k of Object.keys(parseStats)) parseStats[k] += stats[k];
    lists.push(holdings);
  }
  const holdings = mergeHoldings(lists);

  // Map the largest positions first, one OpenFIGI batch at a time, stopping once N tickers are
  // found — bounds OpenFIGI use even for filers with thousands of positions.
  const step = String(process.env.OPENFIGI_API_KEY || "").trim() ? 100 : 10;
  const candidates = holdings.slice(0, Math.max(topN * 2, topN + 10));
  let mapped = { rows: [], unmapped: 0 };
  let rateLimited = false;
  for (let i = 0; i < candidates.length; i += step) {
    const upto = candidates.slice(0, i + step);
    try {
      await mapCusips(upto.map((h) => h.cusip), figiCache);
    } catch (e) {
      if (e.code !== "RATE_LIMIT") throw e;
      rateLimited = true;
    }
    mapped = topMapped(upto, figiCache, topN);
    if (rateLimited || mapped.rows.length >= topN) break;
  }

  return {
    rows: buildRows(fund, mapped.rows, { period: meta.period, filed: meta.filed, amended: meta.amended }),
    stats: {
      period: meta.period,
      filed: meta.filed,
      filings: meta.snapshot.map((f) => `${f.form} ${f.accession}`),
      positions: holdings.length,
      ...parseStats,
      unmappedCusips: mapped.unmapped,
      openfigiRateLimited: rateLimited || undefined,
    },
  };
}

// ---- poll entry point --------------------------------------------------------------

/**
 * New 13F disclosure rows across FUNDS, for the poll loop.
 *   isIngested(actor, filingDateLabel) -> Promise<boolean>: true when rows for this fund with the
 *     snapshot's filing date are already stored. Then nothing beyond the cheap submissions check
 *     is fetched for that fund — information tables + OpenFIGI only run when a NEW filing (or
 *     amendment) appears, i.e. about once a quarter per fund.
 * At most SEC13F_FUNDS_PER_RUN funds are ingested per call; the rest are picked up on later runs.
 * Never throws for a single fund; throws only when SEC_USER_AGENT is missing.
 */
export async function fetchNew13FDisclosures({ isIngested = async () => false, funds = FUNDS, now = Date.now() } = {}) {
  requireUserAgent();
  const perRun = intEnv("SEC13F_FUNDS_PER_RUN", 1);
  const maxPeriodAgeMs = intEnv("SEC13F_MAX_AGE_DAYS", 200) * 86400000;
  const figiCache = new Map();
  const rows = [];
  const report = { checked: 0, upToDate: 0, stale: 0, ingested: [], deferred: 0, errors: [] };
  const fatal = (e) => e.code === "SEC_BLOCKED" || e.code === "RATE_LIMIT";

  // Phase 1 — "anything new?" for every fund, concurrently (request starts stay throttled).
  const checks = await Promise.allSettled(funds.map((fund) => fundLatest(fund, { maxPeriodAgeMs, now })));
  let halted = false;
  checks.forEach((c, i) => {
    if (c.status === "rejected") {
      report.errors.push(`${funds[i].actor}: ${c.reason?.message || c.reason}`);
      if (fatal(c.reason || {})) halted = true;
    } else report.checked++;
  });
  if (halted) return { rows, report }; // SEC blocked / rate-limited: back off until the next run

  // Phase 2 — ingest new snapshots, one fund at a time, at most SEC13F_FUNDS_PER_RUN.
  for (let i = 0; i < funds.length; i++) {
    const fund = funds[i];
    if (checks[i].status !== "fulfilled") continue;
    const meta = checks[i].value;
    if (!meta) { report.errors.push(`${fund.actor}: no 13F-HR on file`); continue; }
    if (meta.stale) { report.stale++; continue; }
    if (!meta.snapshot.length) { report.errors.push(`${fund.actor}: no usable holdings report for ${meta.period}`); continue; }
    let done = false;
    try { done = !!(await isIngested(fund.actor, fmtDate(meta.filed))); } catch { done = false; }
    if (done) { report.upToDate++; continue; }
    if (report.ingested.length >= perRun) { report.deferred++; continue; }
    try {
      const snap = await fundSnapshot(fund, meta, { figiCache });
      rows.push(...snap.rows);
      report.ingested.push({ actor: fund.actor, rows: snap.rows.length, ...snap.stats });
    } catch (e) {
      report.errors.push(`${fund.actor}: ${e.message}`);
      if (fatal(e)) break;
    }
  }
  return { rows, report };
}

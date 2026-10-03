// api/_lib/sources/quiver.js
// REAL disclosure source via Quiver Quantitative.
// Covers three datasets, mapped to the shared disclosure shape (mirrors fmp.js
// so poll-disclosures' toRow() needs no changes):
//   • Congressional trading  -> kind "Congress"   (House / Senate PTR)
//   • Insider Form 4         -> kind "Insider"    (SEC Form 4)
//   • Institutional 13F      -> kind "13F Fund"   (SEC 13F)
//
// Needs a Quiver key in env: QUIVER_API_KEY. Auth header is
// "Authorization: Token <KEY>" (NOT Bearer).
//
// poll-disclosures.js prefers this source automatically when QUIVER_API_KEY is
// set, falling back to FMP otherwise.
//
// RESILIENCE: the three datasets are fetched independently (Promise.allSettled)
// — one failing endpoint never blocks the others. Field names follow Quiver's
// published beta docs but are read defensively (multiple candidate keys), so
// minor naming drift won't break ingestion. Once QUIVER_API_KEY is live, one
// poll run confirms the real response shape and any field/path can be pinned.
//
// Tunables (all optional env):
//   QUIVER_API_BASE        default https://api.quiverquant.com
//   QUIVER_SOURCES         comma list: congress,insiders,sec13f  (default all)
//   QUIVER_CONGRESS_PATH   default /beta/live/congresstrading (recent; bulk is 50MB+ full history)
//   QUIVER_INSIDER_PATH    default /beta/live/insiders
//   QUIVER_13F_PATH        default /beta/live/sec13fchanges

const BASE = process.env.QUIVER_API_BASE || "https://api.quiverquant.com";
const LOOKBACK_DAYS = 45;    // STOCK Act / recent-filing window
const MAX_TOTAL = 150;       // global cap per poll
const TIMEOUT_MS = 15000;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return typeof s === "string" ? s : "";
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2,"0")}, ${d.getFullYear()}`;
}
function dateObj(s){ const d = new Date(s); return isNaN(d) ? null : d; }
function initialsOf(name){
  const p = String(name||"").trim().split(/\s+/);
  return ((p[0]?.[0]||"") + (p[p.length-1]?.[0]||"")).toUpperCase() || "PO";
}
function numOrNull(v){
  if(v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[$,\s]/g,""));
  return isFinite(n) ? n : null;
}
function midpoint(amount){
  const nums = String(amount||"").match(/[\d,]+/g);
  if(!nums) return null;
  const v = nums.map(n=>Number(n.replace(/,/g,"")));
  return v.length>=2 ? Math.round((v[0]+v[1])/2) : (v[0]??null);
}
function money(n){ return n==null ? "" : `$${Math.round(n).toLocaleString("en-US")}`; }
// STOCK Act PTR bands. Quiver's bulk feed gives only the band's lower bound as a
// numeric string ("15001.0"); expand it back to the disclosed range.
const PTR_BANDS = [
  [1001, 15000], [15001, 50000], [50001, 100000], [100001, 250000],
  [250001, 500000], [500001, 1000000], [1000001, 5000000],
  [5000001, 25000000], [25000001, 50000000], [50000001, null],
];
function ptrRange(raw){
  const s = String(raw ?? "").trim();
  if(!s) return { amount: "", amountMid: null };
  if(/[-–]|\$/.test(s)) return { amount: s, amountMid: midpoint(s) };   // already "$1,001 - $15,000"
  const lo = numOrNull(s);
  const band = lo != null && PTR_BANDS.find(([a]) => a === Math.round(lo));
  if(!band) return { amount: money(lo), amountMid: lo };
  const [a, b] = band;
  return b == null
    ? { amount: `Over ${money(a - 1)}`, amountMid: a }
    : { amount: `${money(a)} - ${money(b)}`, amountMid: Math.round((a + b) / 2) };
}
function cleanTicker(v){
  const t = String(v||"").trim().toUpperCase();
  return (!t || t === "--" || !/[A-Z]/.test(t)) ? null : t;
}
// First non-empty value across candidate keys (Quiver naming can drift).
function pick(o, keys){
  for(const k of keys){
    const v = o?.[k];
    if(v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

async function getJSON(path){
  const key = process.env.QUIVER_API_KEY;
  if(!key) throw new Error("QUIVER_API_KEY not set");
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Token ${key}`, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if(res.status === 401 || res.status === 403)
      throw new Error(`Quiver auth failed (HTTP ${res.status}) — check QUIVER_API_KEY`);
    if(res.status === 429) throw new Error("Quiver rate limit (HTTP 429)");
    if(!res.ok) throw new Error(`Quiver ${path} HTTP ${res.status}`);
    const data = await res.json();
    if(!Array.isArray(data))
      throw new Error(`Quiver ${path}: ${data?.error || data?.message || "unexpected response (not an array)"}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ---- dataset mappers -> shared disclosure shape (see fmp.js) --------------

// Congressional trading.
function mapCongress(t){
  const ticker = cleanTicker(pick(t, ["Ticker","ticker","symbol"]));
  if(!ticker) return null;

  // Equities only: options, bonds, crypto etc. would read as a stock position.
  const assetType = String(pick(t, ["TickerType","AssetType"]) || "").toLowerCase();
  if(/option|^op$|bond|crypto|^gs$|other/.test(assetType)) return null;

  const name = pick(t, ["Representative","Senator","Name","representative"]) || "Public Official Filing";
  const typeStr = String(pick(t, ["Transaction","TransactionType","Type","transaction"]) || "").toLowerCase();
  // "Exchange" is neither a buy nor a sell — skip rather than mislabel it.
  if(typeStr.includes("exchange")) return null;
  const side = typeStr.includes("sale") || typeStr.includes("sell") ? "SELL" : "BUY";

  // Combined endpoint carries the chamber in "House" ("Representatives"/"Senate").
  const chamber = String(pick(t, ["House","Chamber","chamber"]) || "").toLowerCase();
  const source = chamber.includes("senate") ? "Senate PTR"
    : (chamber.includes("house") || chamber.includes("representative")) ? "House PTR"
    : "Congress PTR";

  const { amount, amountMid } = ptrRange(pick(t, ["Range","range","Amount","Trade_Size_USD","amount"]));
  const filedRaw = pick(t, ["ReportDate","Filed","Disclosed","filingDate","reportDate"]);

  return {
    actor: name, kind: "Congress", initials: initialsOf(name), source, side, ticker,
    company: pick(t, ["Company","company","assetDescription","Description"]) || ticker,
    sector: "",
    amount, amountMid,
    shares: null, sharesLabel: "Not disclosed",
    transactionDate: fmtDate(pick(t, ["TransactionDate","Traded","transactionDate","Date"])),
    filingDate: fmtDate(filedRaw),
    purchasePrice: 0, fallbackPrice: 0,
    alert: `Disclosed ${side} of ${ticker}`, confidence: "—",
    __filedRaw: filedRaw,
  };
}

// Insider Form 4.
function mapInsider(t){
  const ticker = cleanTicker(pick(t, ["Ticker","ticker","symbol"]));
  if(!ticker) return null;

  const name = pick(t, ["Name","Insider","Owner","ReportingName","reporting_name"]) || "Insider Filing";
  const code = String(pick(t, ["TransactionCode","Code","transaction_code"]) || "").toUpperCase();
  const ad   = String(pick(t, ["AcquiredDisposedCode","AcquiredDisposed","acquired_disposed"]) || "").toUpperCase();
  // P/A = acquired (BUY), S/D = disposed (SELL); default BUY.
  const side = (code === "S" || ad === "D") ? "SELL" : "BUY";

  const shares = numOrNull(pick(t, ["Shares","shares","TransactionShares"]));
  const price  = numOrNull(pick(t, ["PricePerShare","Price","price","SharePrice"]));
  const amountMid = (shares != null && price != null) ? Math.round(shares * price)
    : numOrNull(pick(t, ["Value","value","TransactionValue"]));
  const filedRaw = pick(t, ["FilingDate","FileDate","Filed","filing_date","Date"]);

  return {
    actor: name, kind: "Insider", initials: initialsOf(name), source: "SEC Form 4", side, ticker,
    company: pick(t, ["Company","company","CompanyName"]) || ticker,
    sector: "",
    amount: money(amountMid), amountMid,
    shares, sharesLabel: shares != null ? `${Math.abs(shares).toLocaleString("en-US")} sh` : "Not disclosed",
    transactionDate: fmtDate(pick(t, ["TransactionDate","Date","transaction_date"])),
    filingDate: fmtDate(filedRaw),
    purchasePrice: price || 0, fallbackPrice: 0,
    alert: `Insider ${side} of ${ticker}`, confidence: "—",
    __filedRaw: filedRaw,
  };
}

// Institutional 13F (position changes).
function map13F(t){
  const ticker = cleanTicker(pick(t, ["Ticker","ticker","symbol"]));
  if(!ticker) return null;

  const inst = pick(t, ["Institution","Filer","Owner","InstitutionName","institution"]) || "Institutional Filer";
  const change = numOrNull(pick(t, ["Change","Change_Shares","ShareChange","change"]));
  const held   = numOrNull(pick(t, ["Shares","shares","Shares_Held","SharesHeld"]));
  const value  = numOrNull(pick(t, ["Value","value","MarketValue","Value_USD"]));
  // Positive share change = added (BUY), negative = reduced (SELL); a plain
  // held position (no change) reports BUY, mirroring thirteenf.js.
  const side = (change != null && change < 0) ? "SELL" : "BUY";
  const sh = change != null ? change : held;
  const filedRaw = pick(t, ["FilingDate","Filed","filing_date","Date"]);

  return {
    actor: inst, kind: "13F Fund", initials: initialsOf(inst), source: "SEC 13F", side, ticker,
    company: pick(t, ["Company","company","Name","Issuer"]) || ticker,
    sector: "",
    amount: money(value), amountMid: value,
    positionValue: value,   // authoritative reported holding value (matches thirteenf.js)
    shares: sh,
    sharesLabel: sh != null
      ? `${Math.abs(sh).toLocaleString("en-US")} sh ${change != null ? (change < 0 ? "reduced" : "added") : "held"}`
      : "Not disclosed",
    transactionDate: fmtDate(pick(t, ["ReportPeriod","Quarter","Date","report_period"])),
    filingDate: fmtDate(filedRaw),
    purchasePrice: 0, fallbackPrice: 0,
    alert: `13F ${side} of ${ticker}`, confidence: "—",
    __filedRaw: filedRaw,
  };
}

// ---- dataset registry -----------------------------------------------------

function sourcesEnabled(){
  const raw = (process.env.QUIVER_SOURCES || "congress,insiders,sec13f")
    .toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  return new Set(raw);
}

function registry(){
  const on = sourcesEnabled();
  return [
    { key: "congress", path: process.env.QUIVER_CONGRESS_PATH || "/beta/live/congresstrading", map: mapCongress, cap: 60 },
    { key: "insiders", path: process.env.QUIVER_INSIDER_PATH  || "/beta/live/insiders",         map: mapInsider,  cap: 60 },
    { key: "sec13f",   path: process.env.QUIVER_13F_PATH      || "/beta/live/sec13fchanges",    map: map13F,      cap: 80 },
  ].filter(s => on.has(s.key));
}

export async function fetchNewDisclosures(){
  const active = registry();
  if(!active.length) throw new Error("No Quiver datasets enabled (check QUIVER_SOURCES)");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const settled = await Promise.allSettled(
    active.map(s => getJSON(s.path).then(rows => ({ s, rows })))
  );

  const all = [];
  const errors = [];
  for(const r of settled){
    if(r.status !== "fulfilled"){ errors.push(r.reason?.message || String(r.reason)); continue; }
    const { s, rows } = r.value;
    const mapped = [];
    for(const t of rows){ const rec = s.map(t); if(rec) mapped.push(rec); }
    // Per-source: drop stale filings, newest first, cap.
    const fresh = mapped
      .filter(rec => { const f = dateObj(rec.__filedRaw); return !f || f >= cutoff; })
      .sort((a,b) => (dateObj(b.__filedRaw)||0) - (dateObj(a.__filedRaw)||0))
      .slice(0, s.cap);
    for(const rec of fresh){ delete rec.__filedRaw; all.push(rec); }
  }

  // Only fail the whole poll if every enabled dataset errored (keeps the cron alive
  // when, say, just the 13F endpoint is down). An empty-but-successful fetch returns [].
  if(!all.length && errors.length === active.length)
    throw new Error(`Quiver: all datasets failed — ${errors.join("; ")}`);

  all.sort((a,b) => (dateObj(b.filingDate)||0) - (dateObj(a.filingDate)||0));
  return all.slice(0, MAX_TOTAL);
}

// api/_lib/sources/quiver.js
// REAL disclosure source via Quiver Quantitative (congressional trading).
// Needs a Quiver key in env: QUIVER_API_KEY.
// Auth header is "Authorization: Token <KEY>" (NOT Bearer).
//
// poll-disclosures.js prefers this source automatically when QUIVER_API_KEY is
// set, falling back to FMP otherwise. Output shape mirrors ./fmp.js exactly so
// the existing toRow() mapping in poll-disclosures.js needs no changes.
//
// NOTE: endpoint path + field names below follow Quiver's published beta docs.
// They are read defensively (multiple candidate keys) so minor naming drift
// won't break ingestion; once QUIVER_API_KEY is live, one poll run confirms the
// real response shape and any field can be pinned exactly.

const BASE = process.env.QUIVER_API_BASE || "https://api.quiverquant.com";
// Bulk endpoint returns recent congressional trades across all members.
const CONGRESS_PATH = process.env.QUIVER_CONGRESS_PATH || "/beta/bulk/congresstrading";
const LOOKBACK_DAYS = 45;   // STOCK Act disclosure window
const MAX_ROWS = 60;
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
function midpoint(amount){
  const nums = String(amount||"").match(/[\d,]+/g);
  if(!nums) return null;
  const v = nums.map(n=>Number(n.replace(/,/g,"")));
  return v.length>=2 ? Math.round((v[0]+v[1])/2) : (v[0]??null);
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

// Map one Quiver congress-trading row to the disclosure shape (same as fmp.js).
function mapCongress(t){
  const ticker = String(pick(t, ["Ticker","ticker","symbol"]) || "").trim().toUpperCase();
  if(!ticker || ticker === "--" || !/[A-Z]/.test(ticker)) return null;

  const name = pick(t, ["Representative","Senator","Name","representative"]) || "Public Official Filing";
  const typeStr = String(pick(t, ["Transaction","TransactionType","Type","transaction"]) || "").toLowerCase();
  const side = typeStr.includes("sale") || typeStr.includes("sell") ? "SELL" : "BUY";

  // Quiver's combined endpoint carries the chamber in "House" ("Representatives"/"Senate").
  const chamber = String(pick(t, ["House","Chamber","chamber"]) || "").toLowerCase();
  const source = chamber.includes("senate") ? "Senate PTR"
    : (chamber.includes("house") || chamber.includes("representative")) ? "House PTR"
    : "Congress PTR";

  const amountRaw = pick(t, ["Range","Amount","Trade_Size_USD","amount","range"]);
  const amount = typeof amountRaw === "number" ? `$${amountRaw.toLocaleString("en-US")}` : (amountRaw || "");
  const amountMid = typeof amountRaw === "number" ? amountRaw : midpoint(amountRaw);

  const txRaw = pick(t, ["TransactionDate","Traded","transactionDate","Date"]);
  const filedRaw = pick(t, ["ReportDate","Filed","Disclosed","filingDate","reportDate"]);

  return {
    actor: name,
    kind: "Congress",
    initials: initialsOf(name),
    source,
    side,
    ticker,
    company: pick(t, ["Company","company","assetDescription","Description"]) || ticker,
    sector: "",
    amount,
    amountMid,
    shares: null,
    sharesLabel: "Not disclosed",
    transactionDate: fmtDate(txRaw),
    filingDate: fmtDate(filedRaw),
    purchasePrice: 0,
    fallbackPrice: 0,
    alert: `Disclosed ${side} of ${ticker}`,
    confidence: "—",
    __filedRaw: filedRaw,   // internal: for lookback filter + sort
  };
}

export async function fetchNewDisclosures(){
  const raw = await getJSON(CONGRESS_PATH);
  if(!raw.length) throw new Error("Quiver returned no congressional-trading rows");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const rows = [];
  for(const t of raw){
    const rec = mapCongress(t);
    if(!rec) continue;
    const filed = dateObj(rec.__filedRaw);
    if(filed && filed < cutoff) continue;
    delete rec.__filedRaw;
    rows.push(rec);
  }

  rows.sort((a,b)=>(dateObj(b.filingDate)||0)-(dateObj(a.filingDate)||0));
  return rows.slice(0, MAX_ROWS);
}

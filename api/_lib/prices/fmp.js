// api/_lib/prices/fmp.js
// Price + daily-history adapter over Financial Modeling Prep (FMP) /stable.
// Needs FMP_API_KEY. Returns RAW price facts for the cache; the UI computes intervals.
//
// TODO(owner): confirm these paths/fields against the CURRENT FMP /stable docs — the
// build sandbox can't reach them. Expected shapes (as of FMP "stable"):
//   GET /stable/quote?symbol=SYM            -> [{ symbol, price, previousClose, ... }]
//   GET /stable/historical-price-eod/light?symbol=SYM&from=YYYY-MM-DD
//                                           -> [{ symbol, date:"YYYY-MM-DD", price:<close>, volume }]
//   (If your plan returns the "full" EOD endpoint, its close field is `close` — handled below.)
const BASE = "https://financialmodelingprep.com/stable";
const QUOTE_PATH          = "quote";
const QUOTE_PRICE_FIELDS  = ["price", "previousClose"];        // first present wins
const HISTORY_PATH        = "historical-price-eod/light";
const HISTORY_DATE_FIELD  = "date";
const HISTORY_CLOSE_FIELDS = ["price", "close", "adjClose"];   // first present wins
const HISTORY_DAYS = 400;   // covers the 1Y interval plus weekends/holidays
const DAY_MS = 86400000;

function pickNum(obj, fields){
  for (const f of fields){ const v = obj?.[f]; if (v != null && v !== "") { const n = Number(v); if (!Number.isNaN(n)) return n; } }
  return null;
}
function ymd(d){ return d.toISOString().slice(0, 10); }

// GET with a 10s timeout and one retry on 5xx / network error. 404 -> null (no data).
async function fmpGet(path, params){
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY not set");
  const qs = new URLSearchParams({ ...params, apikey: key }).toString();
  const url = `${BASE}/${path}?${qs}`;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++){
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 404) return null;
      if (res.status >= 500) { lastErr = new Error(`FMP ${path} HTTP ${res.status}`); continue; } // retry
      if (!res.ok) throw new Error(`FMP ${path} HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      lastErr = e; // retry once on abort/network
    }
  }
  throw lastErr || new Error(`FMP ${path} failed`);
}

// Returns { quote:Number, history:[{d,c}] ascending } or null when the ticker has no data.
export async function fetchPrice(ticker){
  const from = ymd(new Date(Date.now() - HISTORY_DAYS * DAY_MS));
  const [qRes, hRes] = await Promise.allSettled([
    fmpGet(QUOTE_PATH, { symbol: ticker }),
    fmpGet(HISTORY_PATH, { symbol: ticker, from }),
  ]);

  const histRaw = hRes.status === "fulfilled" ? hRes.value : null;
  const arr = Array.isArray(histRaw) ? histRaw : (histRaw?.historical || []);
  const history = arr
    .map(r => ({ d: String(r?.[HISTORY_DATE_FIELD] || "").slice(0, 10), c: pickNum(r, HISTORY_CLOSE_FIELDS) }))
    .filter(p => p.d && p.c != null)
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));

  const qRaw = qRes.status === "fulfilled" ? qRes.value : null;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  let quote = pickNum(q || {}, QUOTE_PRICE_FIELDS);
  if (quote == null && history.length) quote = history[history.length - 1].c; // fall back to latest close

  if (!history.length && quote == null){
    if (qRes.status === "rejected" && hRes.status === "rejected") throw (hRes.reason || qRes.reason);
    return null; // no data (e.g. 404) — never fabricate a price
  }
  return { quote, history };
}

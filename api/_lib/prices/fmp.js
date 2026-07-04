// api/_lib/prices/fmp.js
// Daily-history adapter over Financial Modeling Prep (FMP). Needs FMP_API_KEY.
// Returns RAW price facts for the cache; the UI computes intervals.
//
// FREE-TIER FRUGAL: exactly ONE FMP call per ticker. We fetch daily history only and use
// its latest close as the "quote" (an informational, filing-lagged app doesn't need an
// intraday quote). The 250/day cap is easy to blow, so we also:
//   - remember the working endpoint per warm lambda (no re-probing),
//   - throw a RATE_LIMIT error on HTTP 429 so the caller aborts the whole batch.
//
// FMP has two namespaces and plans differ on which are enabled; we try candidates in order
// and reuse the first that returns data:
//   /stable/historical-price-eod/light  ->  /stable/.../full  ->  /api/v3/historical-price-full/{sym}
const HOST = "https://financialmodelingprep.com";
const HISTORY_DAYS = 400;   // covers the 1Y interval plus weekends/holidays
const DAY_MS = 86400000;

const HISTORY_ENDPOINTS = [
  (sym, from) => `${HOST}/stable/historical-price-eod/light?symbol=${encodeURIComponent(sym)}&from=${from}`,
  (sym, from) => `${HOST}/stable/historical-price-eod/full?symbol=${encodeURIComponent(sym)}&from=${from}`,
  (sym, from) => `${HOST}/api/v3/historical-price-full/${encodeURIComponent(sym)}?from=${from}`,
];
const HISTORY_CLOSE_FIELDS = ["close", "adjClose", "price"];

let histPref = 0; // last-working endpoint index (warm-lambda memo)

class RateLimitError extends Error { constructor(m) { super(m); this.code = "RATE_LIMIT"; } }

const num = v => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const pickNum = (obj, fields) => { for (const f of fields) { const n = num(obj?.[f]); if (n != null) return n; } return null; };
const ymd = d => d.toISOString().slice(0, 10);

// GET JSON with apikey, 10s timeout, 1 retry on 5xx. Throws RateLimitError on 429 / "Limit
// Reach", a plain Error on other HTTP errors or an FMP `{ "Error Message": ... }` body.
async function getJson(url) {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY not set");
  const full = url + (url.includes("?") ? "&" : "?") + "apikey=" + key;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(full, { headers: { accept: "application/json" }, signal: ctrl.signal });
      clearTimeout(timer);
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = text; }
      const emsg = (data && !Array.isArray(data) && data["Error Message"]) ? data["Error Message"] : null;
      if (res.status === 429 || (emsg && /limit reach|rate limit|too many/i.test(emsg))) {
        throw new RateLimitError(emsg || "HTTP 429 rate limit");
      }
      if (res.status >= 500) { lastErr = new Error(`HTTP ${res.status}`); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}${emsg ? " " + emsg : ""}`);
      if (emsg) throw new Error(emsg);
      return data;
    } catch (e) {
      clearTimeout(timer);
      if (e.code === "RATE_LIMIT") throw e; // don't retry a rate limit
      lastErr = e;
    }
  }
  throw lastErr || new Error("request failed");
}

// Returns { history:[{d,c}] ascending } or { history:[] } for a genuine no-data ticker.
async function fetchHistory(ticker) {
  const from = ymd(new Date(Date.now() - HISTORY_DAYS * DAY_MS));
  const order = [histPref, ...HISTORY_ENDPOINTS.map((_, i) => i)].filter((v, i, a) => a.indexOf(v) === i);
  const errs = [];
  let sawWellFormedEmpty = false;
  for (const i of order) {
    try {
      const raw = await getJson(HISTORY_ENDPOINTS[i](ticker, from));
      const arr = Array.isArray(raw) ? raw : (raw?.historical || []);
      const history = arr
        .map(r => ({ d: String(r?.date || "").slice(0, 10), c: pickNum(r, HISTORY_CLOSE_FIELDS) }))
        .filter(p => p.d && p.c != null)
        .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
      if (history.length) { histPref = i; return { history }; }
      sawWellFormedEmpty = true; // endpoint responded OK but had no rows
    } catch (e) {
      if (e.code === "RATE_LIMIT") throw e; // abort — quota is spent
      errs.push(`[${i}] ${e.message}`);
    }
  }
  if (sawWellFormedEmpty && !errs.length) return { history: [] }; // genuine no-data
  throw new Error(errs.join(" | "));
}

// Returns { quote, history } or null when the ticker genuinely has no data. ONE FMP call.
export async function fetchPrice(ticker) {
  const { history } = await fetchHistory(ticker);
  if (!history.length) return null;
  return { quote: history[history.length - 1].c, history };
}

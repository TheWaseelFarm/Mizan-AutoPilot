// api/_lib/prices/fmp.js
// Price + daily-history adapter over Financial Modeling Prep (FMP).
// Needs FMP_API_KEY. Returns RAW price facts for the cache; the UI computes intervals.
//
// FMP has two endpoint namespaces and plans differ on which are enabled:
//   - "stable"  : /stable/quote , /stable/historical-price-eod/light|full
//   - legacy v3 : /api/v3/quote/{sym} , /api/v3/historical-price-full/{sym}  (often the free tier)
// We try candidates in order and use whichever your key can actually read, so the same key
// that powers the congress feed works here too. The winning endpoint is remembered per warm
// lambda to conserve the 250/day budget.
const HOST = "https://financialmodelingprep.com";
const HISTORY_DAYS = 400;   // covers the 1Y interval plus weekends/holidays
const DAY_MS = 86400000;

const QUOTE_ENDPOINTS = [
  sym => `${HOST}/stable/quote?symbol=${encodeURIComponent(sym)}`,
  sym => `${HOST}/api/v3/quote/${encodeURIComponent(sym)}`,
];
const HISTORY_ENDPOINTS = [
  (sym, from) => `${HOST}/stable/historical-price-eod/light?symbol=${encodeURIComponent(sym)}&from=${from}`,
  (sym, from) => `${HOST}/stable/historical-price-eod/full?symbol=${encodeURIComponent(sym)}&from=${from}`,
  (sym, from) => `${HOST}/api/v3/historical-price-full/${encodeURIComponent(sym)}?from=${from}`,
];
const QUOTE_PRICE_FIELDS   = ["price", "previousClose", "close"];
const HISTORY_CLOSE_FIELDS = ["close", "adjClose", "price"];

let quotePref = 0, histPref = 0; // last-working endpoint index (warm-lambda memo)

const num = v => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const pickNum = (obj, fields) => { for (const f of fields) { const n = num(obj?.[f]); if (n != null) return n; } return null; };
const ymd = d => d.toISOString().slice(0, 10);

// GET JSON with apikey, 10s timeout, 1 retry on 5xx/network. Throws on HTTP error or an
// FMP `{ "Error Message": ... }` body (invalid key / endpoint not on plan).
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
      if (res.status >= 500) { lastErr = new Error(`HTTP ${res.status}`); continue; }
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = text; }
      if (!res.ok) throw new Error(`HTTP ${res.status}${data?.["Error Message"] ? " " + data["Error Message"] : ""}`);
      if (data && !Array.isArray(data) && data["Error Message"]) throw new Error(data["Error Message"]);
      return data;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
    }
  }
  throw lastErr || new Error("request failed");
}

// Try each candidate (preferred index first); return the first parsed result, remember it.
async function tryCandidates(builders, prefIdx, setPref, args, parse) {
  const order = [prefIdx, ...builders.map((_, i) => i)].filter((v, i, a) => a.indexOf(v) === i);
  const errs = [];
  for (const i of order) {
    try {
      const out = parse(await getJson(builders[i](...args)));
      if (out != null && !(Array.isArray(out) && out.length === 0)) { setPref(i); return out; }
      errs.push(`[${i}] empty`);
    } catch (e) { errs.push(`[${i}] ${e.message}`); }
  }
  throw new Error(errs.join(" | "));
}

// Returns { quote, history:[{d,c}] ascending } or null when the ticker genuinely has no data.
export async function fetchPrice(ticker) {
  const from = ymd(new Date(Date.now() - HISTORY_DAYS * DAY_MS));

  const quoteP = tryCandidates(
    QUOTE_ENDPOINTS, quotePref, i => { quotePref = i; }, [ticker],
    raw => { const q = Array.isArray(raw) ? raw[0] : raw; return pickNum(q || {}, QUOTE_PRICE_FIELDS); }
  ).catch(e => ({ __err: e.message }));

  const histP = tryCandidates(
    HISTORY_ENDPOINTS, histPref, i => { histPref = i; }, [ticker, from],
    raw => {
      const arr = Array.isArray(raw) ? raw : (raw?.historical || []);
      return arr
        .map(r => ({ d: String(r?.date || "").slice(0, 10), c: pickNum(r, HISTORY_CLOSE_FIELDS) }))
        .filter(p => p.d && p.c != null)
        .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
    }
  ).catch(e => ({ __err: e.message }));

  const [quoteRes, histRes] = await Promise.all([quoteP, histP]);
  const history = Array.isArray(histRes) ? histRes : [];
  let quote = (quoteRes && quoteRes.__err) ? null : quoteRes;
  if (quote == null && history.length) quote = history[history.length - 1].c; // fall back to latest close

  if (!history.length && quote == null) {
    const why = [quoteRes?.__err && `quote: ${quoteRes.__err}`, histRes?.__err && `history: ${histRes.__err}`]
      .filter(Boolean).join(" ; ");
    if (why) throw new Error(why);   // surface the real FMP error for diagnostics
    return null;                      // genuinely no data (e.g. empty arrays)
  }
  return { quote, history };
}

// api/_lib/prices/twelvedata.js
// Daily-history adapter over Twelve Data (https://twelvedata.com). Needs TWELVEDATA_API_KEY
// (free tier: 8 requests/min, 800/day). Drop-in replacement for the FMP adapter after FMP
// moved historical prices behind a paid plan.
//
// ONE call per ticker: a single `time_series` request returns the daily history AND its
// latest close (used as the informational "quote" — a filing-lagged app needs no intraday).
// Returns { quote, history:[{d,c}] ascending } or null for a genuine no-data ticker.
// Throws a RATE_LIMIT error on HTTP 429 / credit exhaustion so the caller aborts the batch.
const HOST = "https://api.twelvedata.com";
const OUTPUTSIZE = 400; // ~400 trading days (> 1Y), covers every UI interval

class RateLimitError extends Error { constructor(m) { super(m); this.code = "RATE_LIMIT"; } }

const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

// Returns { quote, history } or null when the ticker genuinely has no data. ONE API call.
export async function fetchPrice(ticker) {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error("TWELVEDATA_API_KEY not set");
  const url = `${HOST}/time_series?symbol=${encodeURIComponent(ticker)}` +
    `&interval=1day&outputsize=${OUTPUTSIZE}&order=ASC&format=JSON&apikey=${key}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  let data;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: ctrl.signal });
    clearTimeout(timer);
    const text = await res.text();
    try { data = JSON.parse(text); } catch { throw new Error(`bad JSON from Twelve Data (HTTP ${res.status})`); }
    // Twelve Data reports rate limits via HTTP 429 and/or a body { status:"error", code:429 }.
    if (res.status === 429) throw new RateLimitError("HTTP 429 rate limit");
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }

  // Error payloads: { "code": <n>, "message": "...", "status": "error" }
  if (data && data.status === "error") {
    const msg = String(data.message || "Twelve Data error");
    if (data.code === 429 || /api credits|rate limit|too many|run out/i.test(msg)) throw new RateLimitError(msg);
    if (/not found|invalid symbol|no data|not available/i.test(msg)) return null; // genuine no-data
    throw new Error(msg);
  }

  const values = Array.isArray(data?.values) ? data.values : [];
  const history = values
    .map((r) => ({ d: String(r?.datetime || "").slice(0, 10), c: num(r?.close) }))
    .filter((p) => p.d && p.c != null)
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));

  if (!history.length) return null;
  return { quote: history[history.length - 1].c, history };
}

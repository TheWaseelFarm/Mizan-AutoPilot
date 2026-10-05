// Response shapes for GET /api/prices (pure, no I/O — unit-tested in test/prices-shape.test.js).
//
// The cache stores each point as { d, o?, h?, l?, c, v? } (see twelvedata.js). Only the ONE stock
// detail chart draws candles, so the default all-tickers payload stays closes-only ({ d, c }):
// that keeps the response well under Vercel's 4.5 MB function body cap and keeps every page load
// (web + mobile) as light as before OHLCV was stored. Full OHLCV is served for a single ticker on
// request (?ticker=JPM&ohlc=1), fetched by the stock page when it opens.

// A ticker as the app writes it (letters, digits, dot / dash share classes). null when not one.
export function cleanTicker(t) {
  const s = String(t == null ? "" : t).trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(s) ? s : null;
}

// [{ d, o?, h?, l?, c, v? }] -> [{ d, c }] (points without a date or a finite close are dropped).
export function closesOnly(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const p of history) {
    if (!p || !p.d || p.c == null || !Number.isFinite(Number(p.c))) continue;
    out.push({ d: p.d, c: Number(p.c) });
  }
  return out;
}

// DB rows -> { TICKER: { quote, history, updatedAt } }. ohlc=false (default) strips o/h/l/v.
export function pricesPayload(rows, { ohlc = false } = {}) {
  const out = {};
  for (const r of rows || []) {
    if (!r || !r.ticker) continue;
    const h = Array.isArray(r.history) ? r.history : [];
    out[r.ticker] = {
      quote: r.quote == null ? null : Number(r.quote),
      history: ohlc ? h : closesOnly(h),
      updatedAt: r.updated_at,
    };
  }
  return out;
}

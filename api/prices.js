// GET /api/prices -> cached price data ONLY (never calls a price provider from a user request).
// Default (every page load, web + mobile): ALL tickers, closes only —
//   { "NVDA": { quote:Number|null, history:[{d,c}], updatedAt }, ... }
// GET /api/prices?ticker=JPM&ohlc=1 -> that ONE ticker with its full cached points —
//   { "JPM": { quote, history:[{d,o?,h?,l?,c,v?}], updatedAt } }  (o/h/l/v where the provider gave
//   them; rows cached before OHLCV was kept have only {d,c}). Used by the stock detail chart only,
//   so OHLCV never inflates the all-tickers payload (Vercel caps a function response at 4.5 MB).
// If the cache table doesn't exist yet (or errors), returns {} so the UI shows "Price pending".
import { supabase } from "./_lib/supabase.js";
import { cleanTicker, pricesPayload } from "./_lib/prices/shape.js";

export default async function handler(req, res) {
  try {
    const q = (req && req.query) || {};
    const one = q.ticker != null ? cleanTicker(q.ticker) : null;
    if (q.ticker != null && !one) return res.status(400).json({ error: "bad ticker" });
    let query = supabase().from("prices").select("ticker,quote,history,updated_at");
    if (one) query = query.eq("ticker", one);
    const { data, error } = await query;
    if (error) throw error;
    const ohlc = !!one && /^(1|true|yes)$/i.test(String(q.ohlc || ""));
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json(pricesPayload(data, { ohlc }));
  } catch (e) {
    // Graceful empty: cache not provisioned or unreachable -> "Price pending" everywhere.
    return res.status(200).json({});
  }
}

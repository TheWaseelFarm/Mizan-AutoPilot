// GET /api/prices -> cached price data ONLY (never calls FMP from a user request).
// Shape: { "NVDA": { quote:Number|null, history:[{d,c}], updatedAt }, ... }
// If the cache table doesn't exist yet (or errors), returns {} so the UI shows "Price pending".
import { supabase } from "./_lib/supabase.js";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase()
      .from("prices")
      .select("ticker,quote,history,updated_at");
    if (error) throw error;
    const out = {};
    for (const r of (data || [])) {
      out[r.ticker] = {
        quote: r.quote == null ? null : Number(r.quote),
        history: Array.isArray(r.history) ? r.history : [],
        updatedAt: r.updated_at,
      };
    }
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json(out);
  } catch (e) {
    // Graceful empty: cache not provisioned or unreachable -> "Price pending" everywhere.
    return res.status(200).json({});
  }
}

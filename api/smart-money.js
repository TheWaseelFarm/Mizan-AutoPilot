// GET /api/smart-money?timeframe=30d&side=BUY&limit=25
// Serves the cached smart_money_trends aggregation (spec §A3) — the Stocks tab reads this
// instead of aggregating raw trades. Completeness gate applies (unscreened never stored).
// Returns [] gracefully if the cache table isn't provisioned yet (app falls back to a
// client-side derivation from the feed).
import { supabase } from "./_lib/supabase.js";

const TF = new Set(["7d", "30d", "90d", "all"]);

export default async function handler(req, res) {
  try {
    const timeframe = TF.has(String(req.query.timeframe)) ? String(req.query.timeframe) : "30d";
    const side = String(req.query.side).toUpperCase() === "SELL" ? "SELL" : "BUY";
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

    const { data, error } = await supabase()
      .from("smart_money_trends")
      .select("ticker,company,net_weight,dollar_est,filer_count,label")
      .eq("timeframe", timeframe)
      .eq("side", side)
      .neq("label", "unscreened")
      .order("net_weight", { ascending: false })
      .limit(limit);
    if (error) throw error;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json(data || []);
  } catch (e) {
    // Cache not provisioned / unreachable -> empty; the client derives from the feed instead.
    return res.status(200).json([]);
  }
}

// GET /api/follower-counts -> { "Renaissance Technologies": 1240, ... }
// PUBLIC aggregate (no per-user data): how many users follow each portfolio, so the app can
// rank a "Most followed" board — but only once the counts are meaningful (the client gates on
// that). Tolerates the `follows` table being absent (returns {}) so the app degrades cleanly
// before the migration is run, exactly like /api/prices.
import { supabase } from "./_lib/supabase.js";
import { aggregateFollowerCounts } from "./_lib/followers.js";

export default async function handler(_req, res) {
  try {
    const { data, error } = await supabase().from("follows").select("portfolio");
    if (error) throw error;
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json(aggregateFollowerCounts(data || []));
  } catch {
    // Table missing / unreachable -> {} -> "Most followed" stays hidden (never fabricated).
    return res.status(200).json({});
  }
}

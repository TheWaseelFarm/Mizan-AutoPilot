// GET  /api/follows                    -> list the authed user's followed portfolios
// POST /api/follows { portfolio, on }   -> follow (on=true) / unfollow (on=false)
//
// Per-user via `user_id` = the authed username (single-admin today; real accounts later,
// spec §7). Auth-gated like /api/watchlist. Tolerates the `follows` table being absent so
// the app degrades to local follow state before the migration is run.
import { parseBody } from "./_lib/http.js";
import { supabase } from "./_lib/supabase.js";
import { requireAuth } from "./_lib/auth.js";
import { aggregateFollowerCounts } from "./_lib/followers.js";

export default async function handler(req, res) {
  // PUBLIC follower-count aggregate (no auth, no per-user data). Served here to stay within
  // the serverless-function budget; `/api/follower-counts` rewrites to `/api/follows?counts=1`
  // (see vercel.json). Tolerates the `follows` table being absent -> {} (board stays hidden).
  if (req.method === "GET" && (req.query.counts === "1" || req.query.counts === "true")) {
    try {
      const { data, error } = await supabase().from("follows").select("portfolio");
      if (error) throw error;
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
      return res.status(200).json(aggregateFollowerCounts(data || []));
    } catch {
      return res.status(200).json({});
    }
  }

  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const body = req.method === "POST" ? parseBody(req) : null;
  if (req.method === "POST" && !body) return res.status(400).json({ error: "Invalid request body" });
  if (req.method === "POST" && !String(body.portfolio || "").trim()) {
    return res.status(400).json({ error: "portfolio required" });
  }
  const userId = user.username;

  try {
    const db = supabase();
    if (req.method === "GET") {
      const { data, error } = await db
        .from("follows").select("portfolio,created_at")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json((data || []).map((r) => r.portfolio));
    }

    if (req.method === "POST") {
      const portfolio = String(body.portfolio || "").trim();
      const on = body.on !== false; // default: follow

      if (on) {
        const { error } = await db
          .from("follows")
          .upsert({ user_id: userId, portfolio }, { onConflict: "user_id,portfolio", ignoreDuplicates: true });
        if (error) throw error;
      } else {
        const { error } = await db.from("follows").delete().eq("user_id", userId).eq("portfolio", portfolio);
        if (error) throw error;
      }
      return res.status(200).json({ portfolio, on });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

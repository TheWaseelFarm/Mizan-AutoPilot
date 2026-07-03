// GET  /api/watchlist            -> list tracked sources
// POST /api/watchlist { id, on } -> toggle a source on/off
import { supabase } from "./_lib/supabase.js";
import { requireAuth } from "./_lib/auth.js";

export default async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const db = supabase();
  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("watchlist").select("*").order("id");
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { id, on } = body;
      const { data, error } = await db.from("watchlist").update({ on }).eq("id", id).select();
      if (error) throw error;
      return res.status(200).json(data?.[0] || {});
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

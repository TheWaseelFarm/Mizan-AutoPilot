// GET  /api/watchlist            -> list tracked sources
// POST /api/watchlist { id, on } -> toggle a source on/off
import { parseBody } from "./_lib/http.js";
import { supabase } from "./_lib/supabase.js";
import { requireAuth } from "./_lib/auth.js";

export default async function handler(req, res) {
  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const body = req.method === "POST" ? parseBody(req) : null;
  if (req.method === "POST" && !body) return res.status(400).json({ error: "Invalid request body" });
  if (req.method === "POST" &&
      !((typeof body.id === "string" && body.id.trim()) ||
        (typeof body.id === "number" && Number.isFinite(body.id)))) {
    return res.status(400).json({ error: "id required" });
  }
  if (req.method === "POST" && typeof body.on !== "boolean") {
    return res.status(400).json({ error: "on must be a boolean" });
  }
  try {
    const db = supabase();
    if (req.method === "GET") {
      const { data, error } = await db.from("watchlist").select("*").order("id");
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === "POST") {
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

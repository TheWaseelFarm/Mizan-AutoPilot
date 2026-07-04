// GET /api/refresh-prices?secret=CRON_SECRET
// Refreshes cached FMP quotes + daily history for the distinct tickers in `disclosures`,
// OLDEST updated_at first. Batched to respect the FMP free tier (250 calls/day):
// each ticker costs ~2 FMP calls (quote + history), so MAX_TICKERS keeps a run well under cap.
// Idempotent; returns { done, failed, remaining } so cron-job.org can call it repeatedly.
import { supabase } from "./_lib/supabase.js";
import { fetchPrice } from "./_lib/prices/fmp.js";

const MAX_TICKERS = 40; // ~80 FMP calls/run; 2–3 runs/day stays under 250.

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  try {
    const db = supabase();

    // Distinct tickers currently in disclosures.
    const { data: discRows, error: dErr } = await db.from("disclosures").select("ticker");
    if (dErr) throw dErr;
    const tickers = [...new Set((discRows || []).map(r => r.ticker).filter(Boolean))];

    // Existing cache freshness (missing = never fetched = highest priority).
    const { data: priceRows, error: pErr } = await db.from("prices").select("ticker,updated_at");
    if (pErr) throw pErr;
    const seenAt = new Map((priceRows || []).map(r => [r.ticker, r.updated_at]));

    // Oldest first: never-fetched (−Infinity) before any timestamp, then ascending.
    const ordered = tickers.sort((a, b) => {
      const ta = seenAt.has(a) ? Date.parse(seenAt.get(a) || 0) : -Infinity;
      const tb = seenAt.has(b) ? Date.parse(seenAt.get(b) || 0) : -Infinity;
      return ta - tb;
    });
    const batch = ordered.slice(0, MAX_TICKERS);

    let done = 0, failed = 0;
    for (const ticker of batch) {
      try {
        const p = await fetchPrice(ticker);
        if (!p) { failed++; continue; } // no data — leave cache untouched (UI shows "Price pending")
        const { error } = await db.from("prices").upsert(
          { ticker, history: p.history, quote: p.quote, updated_at: new Date().toISOString() },
          { onConflict: "ticker" }
        );
        if (error) throw error;
        done++;
      } catch (e) {
        failed++;
      }
    }

    return res.status(200).json({ done, failed, remaining: Math.max(0, ordered.length - batch.length) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

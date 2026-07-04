// GET /api/rescreen?secret=CRON_SECRET
// Backfill: force re-screens the distinct tickers in `disclosures` (e.g. after enabling the
// Zoya key), refreshing the screenings cache AND each disclosure's stored screening fields
// + Framework B label. Idempotent and batched (<=25/invocation) so it can be called
// repeatedly; returns { done, failed, remaining, live }.
//
// NOTE: requires supabase/screenings.sql to have been run — the sweep uses that cache's
// fetched_at to page through tickers across repeated calls.
import { supabase } from "./_lib/supabase.js";
import { classifyFB } from "./_lib/frameworkB.js";
import { screenOnce, usingLiveScreener } from "./_lib/screening/index.js";

const BATCH = 25;
const GRACE_MS = 10 * 60 * 1000; // a ticker refreshed within this window counts as done for the sweep

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  try {
    const db = supabase();

    const { data: discRows, error: dErr } = await db.from("disclosures").select("ticker");
    if (dErr) throw dErr;
    const distinct = [...new Set((discRows || []).map(r => r.ticker).filter(Boolean))];

    let fetchedAt = new Map();
    try {
      const { data: scr } = await db.from("screenings").select("ticker,fetched_at");
      fetchedAt = new Map((scr || []).map(r => [r.ticker, r.fetched_at]));
    } catch (e) { /* screenings table may not exist yet */ }

    const now = Date.now();
    const pending = t => { const f = fetchedAt.get(t); return !f || (now - Date.parse(f)) > GRACE_MS; };
    const ordered = distinct.filter(pending).sort((a, b) => {
      const ta = fetchedAt.has(a) ? Date.parse(fetchedAt.get(a) || 0) : -Infinity;
      const tb = fetchedAt.has(b) ? Date.parse(fetchedAt.get(b) || 0) : -Infinity;
      return ta - tb;
    });
    const batch = ordered.slice(0, BATCH);

    let done = 0, failed = 0;
    for (const ticker of batch) {
      try {
        const payload = await screenOnce(ticker);          // force fresh (bypass cache)
        const label = classifyFB(payload);                 // engine decides — never the vendor
        try {
          await db.from("screenings").upsert(
            { ticker, payload, fetched_at: new Date().toISOString() },
            { onConflict: "ticker" }
          );
        } catch (e) { /* best-effort cache write */ }
        const { error } = await db.from("disclosures").update({
          business: payload.business, business_status: payload.businessStatus,
          impure_pct: payload.impurePct, debt_ratio: payload.debtRatio,
          reasoning: payload.reasoning, purification: payload.purification,
          label,
        }).eq("ticker", ticker);
        if (error) throw error;
        done++;
      } catch (e) {
        failed++;
      }
    }

    return res.status(200).json({
      done, failed,
      remaining: Math.max(0, ordered.length - batch.length),
      live: usingLiveScreener(),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

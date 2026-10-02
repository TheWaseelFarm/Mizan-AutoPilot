// GET /api/refresh-prices?secret=CRON_SECRET
// Refreshes cached quotes + daily history (via Twelve Data) for the distinct tickers in
// `disclosures`, OLDEST updated_at first. One API call per ticker; MAX_TICKERS keeps a run
// under Twelve Data's free per-minute cap (8/min).
// Idempotent; returns { done, failed, remaining } so the daily routine can call it repeatedly.
import { requireCron } from "./_lib/cron.js";
import { supabase } from "./_lib/supabase.js";
import { fetchPrice } from "./_lib/prices/twelvedata.js";

const MAX_TICKERS = 8; // Twelve Data free tier: 8 requests/min. One run (1 call/ticker) stays
                       // under the per-minute cap; the daily routine calls this several times
                       // (oldest-first) to cycle every ticker.

export default async function handler(req, res) {
  if (!requireCron(req, res)) return;
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

    let done = 0, noData = 0, errored = 0, rateLimited = false;
    const sampleErrors = [];
    for (const ticker of batch) {
      try {
        const p = await fetchPrice(ticker);
        if (!p) { noData++; continue; } // genuinely no data — leave cache untouched
        const { error } = await db.from("prices").upsert(
          { ticker, history: p.history, quote: p.quote, updated_at: new Date().toISOString() },
          { onConflict: "ticker" }
        );
        if (error) throw error;
        done++;
      } catch (e) {
        if (e.code === "RATE_LIMIT") { // FMP daily quota spent — stop hammering
          rateLimited = true;
          sampleErrors.push(`${ticker}: ${e.message}`.slice(0, 200));
          break;
        }
        errored++;
        if (sampleErrors.length < 3) sampleErrors.push(`${ticker}: ${e.message}`.slice(0, 300));
      }
    }

    return res.status(200).json({
      done,
      failed: noData + errored,
      noData,
      errored,
      rateLimited,
      remaining: Math.max(0, ordered.length - batch.length),
      sampleErrors, // first few real FMP messages, for diagnosis
      ...(rateLimited && {
        hint: "Twelve Data rate limit hit (free tier: 8/min, 800/day). The run stops and the " +
              "remaining tickers are picked up on the next call — the daily routine calls this a " +
              "few times with gaps so every ticker cycles through.",
      }),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

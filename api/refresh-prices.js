// GET /api/refresh-prices?secret=CRON_SECRET
// Refreshes cached quotes + daily history (via Twelve Data) for the distinct tickers in
// `disclosures` that are DUE (never fetched, or last attempted > 20h ago), half never-fetched /
// half oldest-existing per batch (see _lib/price-queue.js). One API call per ticker; MAX_TICKERS
// keeps a run under Twelve Data's free per-minute cap (8/min). A FAILED attempt also touches
// updated_at (without clobbering cached history), so tickers that always fail (paid-plan or
// invalid symbols) rotate to the back instead of blocking the queue.
// Idempotent; returns { done, failed, remaining } where `remaining` = tickers still DUE after this
// batch, so a caller can loop until it reaches 0.
import { requireCron } from "./_lib/cron.js";
import { supabase } from "./_lib/supabase.js";
import { fetchPrice } from "./_lib/prices/twelvedata.js";
import { pickBatch } from "./_lib/price-queue.js";

// Tickers per call (one Twelve Data request each). Default 8 = the free tier's per-minute cap.
// On a paid plan set PRICE_BATCH_SIZE in Vercel (e.g. 60 on "Grow", 377 req/min) to refresh much
// more per call. Capped at 120 so one call stays well inside the serverless time limit.
const MAX_TICKERS = Math.min(120, Math.max(1, parseInt(process.env.PRICE_BATCH_SIZE, 10) || 8));

// Record a failed attempt: bump updated_at only (an upsert of just these columns leaves any cached
// history/quote intact). Best-effort — never throws.
async function markAttempt(db, ticker) {
  try { await db.from("prices").upsert({ ticker, updated_at: new Date().toISOString() }, { onConflict: "ticker" }); } catch (e) { /* ignore */ }
}

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

    const { batch, due } = pickBatch(tickers, seenAt, { max: MAX_TICKERS });

    let done = 0, noData = 0, errored = 0, rateLimited = false;
    const sampleErrors = [];
    for (const ticker of batch) {
      try {
        const p = await fetchPrice(ticker);
        if (!p) { noData++; await markAttempt(db, ticker); continue; } // genuinely no data — keep cache, rotate to back
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
        await markAttempt(db, ticker);
        if (sampleErrors.length < 3) sampleErrors.push(`${ticker}: ${e.message}`.slice(0, 300));
      }
    }

    return res.status(200).json({
      done,
      failed: noData + errored,
      noData,
      errored,
      rateLimited,
      remaining: Math.max(0, due - batch.length),
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

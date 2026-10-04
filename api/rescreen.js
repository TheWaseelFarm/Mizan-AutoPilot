// GET /api/rescreen?secret=CRON_SECRET
// Backfill: force re-screens the distinct tickers in `disclosures` (e.g. after enabling the
// Zoya key), refreshing the screenings cache AND each disclosure's stored screening fields
// + AAOIFI label. Idempotent and batched (<=25/invocation) so it can be called
// repeatedly; returns { done, failed, remaining, live }.
//
// NOTE: requires supabase/screenings.sql to have been run — the sweep uses that cache's
// fetched_at to page through tickers across repeated calls.
import { requireCron } from "./_lib/cron.js";
import { supabase } from "./_lib/supabase.js";
import { classifyAAOIFI } from "./_lib/aaoifi.js";
import { ratioUpdates } from "./_lib/ratios-sync.js";
import { screenOnce, usingLiveScreener } from "./_lib/screening/index.js";

const BATCH = 25;
const GRACE_MS = 10 * 60 * 1000; // a ticker refreshed within this window counts as done for the sweep

export default async function handler(req, res) {
  if (!requireCron(req, res)) return;
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

    // Backfill: copy cached cash ratios onto stored rows (no provider calls; idempotent).
    let synced = 0;
    try {
      const { data: cache } = await db.from("screenings").select("ticker,payload");
      const { data: stored } = await db.from("disclosures").select("ticker,cash_pct");
      for (const u of ratioUpdates(stored, cache)) {
        const { error: uErr } = await db.from("disclosures").update({ cash_pct: u.cash_pct, label: u.label }).eq("ticker", u.ticker);
        if (!uErr) synced++;
      }
    } catch (e) { /* screenings table or column missing -> skip */ }

    const now = Date.now();
    const pending = t => { const f = fetchedAt.get(t); return !f || (now - Date.parse(f)) > GRACE_MS; };
    const ordered = distinct.filter(pending).sort((a, b) => {
      const ta = fetchedAt.has(a) ? Date.parse(fetchedAt.get(a) || 0) : -Infinity;
      const tb = fetchedAt.has(b) ? Date.parse(fetchedAt.get(b) || 0) : -Infinity;
      return ta - tb;
    });
    const batch = ordered.slice(0, BATCH);

    let done = 0, failed = 0, skipped = 0;
    for (const ticker of batch) {
      try {
        const payload = await screenOnce(ticker);          // force fresh (bypass cache)
        // GUARD: never overwrite existing (possibly real) screening with a no-data/mock payload
        // when the provider is down — that silently degrades good names to "unscreened" and
        // empties the feed. Leave the stored screening untouched and move on.
        if (!payload || /^No screening data/i.test(payload.reasoning || "")) { skipped++; continue; }
        const label = classifyAAOIFI(payload);             // engine decides — never the vendor
        try {
          await db.from("screenings").upsert(
            { ticker, payload, fetched_at: new Date().toISOString() },
            { onConflict: "ticker" }
          );
        } catch (e) { /* best-effort cache write */ }
        const cols = {
          business: payload.business, business_status: payload.businessStatus,
          impure_pct: payload.impurePct, debt_ratio: payload.debtRatio,
          cash_pct: payload.cashPct,
          reasoning: payload.reasoning, purification: payload.purification,
          label,
        };
        let { error } = await db.from("disclosures").update(cols).eq("ticker", ticker);
        if (error && /cash_pct/i.test(error.message || "")) { // DB without the column: keep the rest working
          delete cols.cash_pct;
          ({ error } = await db.from("disclosures").update(cols).eq("ticker", ticker));
        }
        if (error) throw error;
        done++;
      } catch (e) {
        failed++;
      }
    }

    return res.status(200).json({
      done, failed, skipped, syncedCash: synced,
      remaining: Math.max(0, ordered.length - batch.length),
      live: usingLiveScreener(),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// GET /api/refresh-trends?secret=CRON_SECRET
// Rebuilds the smart_money_trends cache from disclosures (spec §A3) so the Stocks tab never
// aggregates raw trades on every request. Idempotent: recomputes all (ticker,timeframe,side)
// rows and upserts them. Returns a summary. Tolerates the table being absent.
import { supabase } from "./_lib/supabase.js";
import { classifyAAOIFI } from "./_lib/aaoifi.js";
import { aggregateTrends } from "./_lib/trends.js";

// Mirror api/feed.js: recompute the verdict from raw inputs and derive `screened`.
function toRec(row) {
  const rec = {
    actor: row.actor,
    ticker: row.ticker,
    company: row.company,
    side: row.side,
    amountMid: row.amount_mid,
    filingDate: row.filing_date,
    businessStatus: row.business_status,
    impurePct: Number(row.impure_pct),
    debtRatio: Number(row.debt_ratio),
  };
  rec.screened =
    typeof row.screened === "boolean" ? row.screened : !/^No screening data/i.test(row.reasoning || "");
  rec.label = classifyAAOIFI(rec);
  return rec;
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  try {
    const db = supabase();
    const { data, error } = await db.from("disclosures").select("*").limit(2000);
    if (error) throw error;

    const trends = aggregateTrends((data || []).map(toRec)).map((t) => ({
      ...t,
      updated_at: new Date().toISOString(),
    }));

    if (!trends.length) return res.status(200).json({ ok: true, rows: 0 });

    // Upsert the fresh aggregation. (Old rows for tickers that dropped out age via updated_at.)
    const { error: upErr } = await db
      .from("smart_money_trends")
      .upsert(trends, { onConflict: "ticker,timeframe,side" });
    if (upErr) throw upErr;

    return res.status(200).json({ ok: true, rows: trends.length });
  } catch (e) {
    // Keep the cron alive (report in body, not a 5xx that would get the job auto-disabled).
    return res.status(200).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}

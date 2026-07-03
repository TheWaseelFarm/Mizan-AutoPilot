// GET /api/poll-disclosures?secret=CRON_SECRET
// Triggered by cron-job.org (e.g. every 5 min). Ingest -> screen -> classify -> store.
// De-dupes on a unique key so re-runs are idempotent.
import { supabase } from "./_lib/supabase.js";
import { classifyFB } from "./_lib/frameworkB.js";
 import { fetchNewDisclosures } from "./_lib/sources/fmp.js";  // -> ./sources/quiver.js later
import { screen } from "./_lib/screening/mock.js";              // -> ./screening/zoya.js later

function dedupeKey(r) {
  return [r.source, r.actor, r.ticker, r.transactionDate, r.side].join("|");
}
function toRow(r) {
  return {
    dedupe_key: dedupeKey(r),
    actor: r.actor, kind: r.kind, initials: r.initials, source: r.source, side: r.side,
    ticker: r.ticker, company: r.company, sector: r.sector,
    amount: r.amount, amount_mid: r.amountMid,
    shares: r.shares, shares_label: r.sharesLabel,
    transaction_date: r.transactionDate, filing_date: r.filingDate,
    purchase_price: r.purchasePrice, fallback_price: r.fallbackPrice,
    business: r.business, business_status: r.businessStatus,
    impure_pct: r.impurePct, debt_ratio: r.debtRatio,
    reasoning: r.reasoning, purification: r.purification,
    label: r.label, alert: r.alert, confidence: r.confidence
  };
}

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  try {
    const db = supabase();
    const incoming = await fetchNewDisclosures();
    let inserted = 0;
    for (const d of incoming) {
      const s = await screen(d.ticker);           // raw screening inputs
      const rec = { ...d, ...s };
      rec.label = classifyFB(rec);                 // Framework B verdict
      const { data, error } = await db
        .from("disclosures")
        .upsert(toRow(rec), { onConflict: "dedupe_key", ignoreDuplicates: true })
        .select("id");
  if (error) return res.status(200).json({ ok: false, stage: "insert", error: error.message, sampleRow: toRow(rec) });
      if (data && data.length) inserted++;
      // TODO (next step): if inserted, queue a push notification in alerts_sent.
    }
    return res.status(200).json({ ok: true, checked: incoming.length, inserted });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

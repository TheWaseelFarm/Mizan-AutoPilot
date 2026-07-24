// GET /api/poll-disclosures?secret=CRON_SECRET
// Triggered by cron-job.org (e.g. every 5 min). Ingest -> screen -> classify -> store.
// De-dupes on a unique key so re-runs are idempotent.
import { supabase } from "./_lib/supabase.js";
import { classifyFB } from "./_lib/frameworkB.js";
 import { fetchNewDisclosures } from "./_lib/sources/fmp.js";  // -> ./sources/quiver.js later
// Cache-aware screener. Uses Zoya when SCREENING_API_KEY is set, else the mock adapter —
// the app keeps working without a key.
import { screenCached } from "./_lib/screening/index.js";
import { notificationRowsFor } from "./_lib/notify.js";

// On a newly-inserted disclosure, write one in-app notification per follower of the portfolio.
// Best-effort: any failure (tables absent, etc.) returns 0 and never blocks ingestion.
async function notifyFollowers(db, disclosure) {
  try {
    const { data: fol, error } = await db.from("follows").select("user_id").eq("portfolio", disclosure.actor);
    if (error || !fol || !fol.length) return 0;
    const rows = notificationRowsFor(disclosure, fol.map((f) => f.user_id));
    if (!rows.length) return 0;
    const { error: nErr } = await db
      .from("notifications")
      .upsert(rows, { onConflict: "user_id,disclosure_id", ignoreDuplicates: true });
    return nErr ? 0 : rows.length;
  } catch {
    return 0;
  }
}

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

    // Fetch from the source (FMP). A transient/rate-limit (429) failure must NOT 500 —
    // cron-job.org disables a job after repeated non-2xx responses. Skip the run instead.
    let incoming;
    try {
      incoming = await fetchNewDisclosures();
    } catch (e) {
      const rateLimited = /429|limit reach|rate limit|too many/i.test(e.message || "");
      return res.status(200).json({
        ok: false, checked: 0, inserted: 0,
        skipped: rateLimited ? "source_rate_limited" : "source_error",
        detail: String(e.message || e).slice(0, 200),
      });
    }

    let inserted = 0, notified = 0;
    for (const d of incoming) {
      const s = await screenCached(db, d.ticker); // raw screening inputs (cached, 30-day)
      const rec = { ...d, ...s };
      rec.label = classifyFB(rec);                 // Framework B verdict

      const { data, error } = await db
        .from("disclosures")
        .upsert(toRow(rec), { onConflict: "dedupe_key", ignoreDuplicates: true })
        .select("id");
      if (!error && data && data.length) {
        inserted++;
        // Fan out an in-app notification to everyone following this portfolio (best-effort;
        // tolerant of the follows/notifications tables being absent). Never blocks ingest.
        notified += await notifyFollowers(db, { ...rec, id: data[0].id });
      }
    }
    return res.status(200).json({ ok: true, checked: incoming.length, inserted, notified });
  } catch (e) {
    // Keep the cron alive on unexpected errors too (report in the body, not via a 5xx that
    // would get the job auto-disabled). Truly fatal misconfig still surfaces here.
    return res.status(200).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}

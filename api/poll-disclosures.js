// GET /api/poll-disclosures?secret=CRON_SECRET
// Triggered by cron-job.org (e.g. every 5 min). Ingest -> screen -> classify -> store.
// De-dupes on a unique key so re-runs are idempotent.
import { requireCron } from "./_lib/cron.js";
import { supabase } from "./_lib/supabase.js";
import { classifyAAOIFI } from "./_lib/aaoifi.js";
import { fetchNewDisclosures as fetchFromFmp } from "./_lib/sources/fmp.js";
import { fetchNewDisclosures as fetchFromQuiver } from "./_lib/sources/quiver.js";
// Institutional 13F funds straight from SEC EDGAR — OFF unless ENABLE_13F=1 (+ SEC_USER_AGENT).
import { enabled13F, fetchNew13FDisclosures } from "./_lib/sources/edgar13f.js";
// Prefer Quiver (real congressional data) when a key is present; else keep FMP.
const fetchNewDisclosures = () =>
  process.env.QUIVER_API_KEY ? fetchFromQuiver() : fetchFromFmp();
const activeSource = () => (process.env.QUIVER_API_KEY ? "quiver" : "fmp");
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
  const row = {
    dedupe_key: dedupeKey(r),
    actor: r.actor, kind: r.kind, initials: r.initials, source: r.source, side: r.side,
    ticker: r.ticker, company: r.company, sector: r.sector,
    amount: r.amount, amount_mid: r.amountMid,
    shares: r.shares, shares_label: r.sharesLabel,
    transaction_date: r.transactionDate, filing_date: r.filingDate,
    purchase_price: r.purchasePrice, fallback_price: r.fallbackPrice,
    business: r.business, business_status: r.businessStatus,
    impure_pct: r.impurePct, debt_ratio: r.debtRatio,
    cash_pct: r.cashPct, // AAOIFI cash + interest-bearing securities screen (was never saved)
    reasoning: r.reasoning, purification: r.purification,
    label: r.label, alert: r.alert, confidence: r.confidence
  };
  // Reported 13F holding value (position snapshot). Only set when the source provides one, so
  // transaction rows (PTR / Form 4) are written exactly as before.
  if (r.positionValue != null) row.position_value = r.positionValue;
  return row;
}

// Upsert one disclosure. Duplicates are ignored, except rows flagged __replace (an amended 13F
// snapshot), which overwrite the stored values. If the DB predates the position_value column,
// retry without it rather than dropping the row.
async function upsertDisclosure(db, rec) {
  const opts = { onConflict: "dedupe_key", ignoreDuplicates: !rec.__replace };
  const row = toRow(rec);
  let { data, error } = await db.from("disclosures").upsert(row, opts).select("id");
  // Tolerate a DB that predates optional columns: retry without whichever one it rejected.
  for (const col of ["position_value", "cash_pct"]) {
    if (error && col in row && new RegExp(col, "i").test(error.message || "")) {
      const { [col]: _drop, ...rest } = row;
      Object.keys(row).forEach((k) => { if (!(k in rest)) delete row[k]; });
      ({ data, error } = await db.from("disclosures").upsert(rest, opts).select("id"));
    }
  }
  return { data, error };
}

// 13F change detection: a fund's latest snapshot counts as ingested once any of its rows with
// that snapshot's filing date is stored. 13F changes quarterly, so after the first ingest each
// run costs one small SEC request per fund and no info-table / OpenFIGI / screening work.
async function thirteenFIngested(db, actor, filingDate) {
  const { count, error } = await db
    .from("disclosures").select("id", { count: "exact", head: true })
    .eq("source", "SEC 13F").eq("actor", actor).eq("filing_date", filingDate);
  if (error) throw error;
  return (count || 0) > 0;
}

export default async function handler(req, res) {
  if (!requireCron(req, res)) return;
  try {
    const db = supabase();

    // Fetch from the source (FMP). A transient/rate-limit (429) failure must NOT 500 —
    // cron-job.org disables a job after repeated non-2xx responses. Skip the run instead.
    let incoming;
    let sourceError;
    try {
      incoming = await fetchNewDisclosures();
    } catch (e) {
      const rateLimited = /429|limit reach|rate limit|too many/i.test(e.message || "");
      sourceError = {
        skipped: rateLimited ? "source_rate_limited" : "source_error",
        detail: String(e.message || e).slice(0, 200),
      };
      // Flag off: behave exactly as before (skip the run). Flag on: still ingest 13F funds.
      if (!enabled13F()) {
        return res.status(200).json({ ok: false, source: activeSource(), checked: 0, inserted: 0, ...sourceError });
      }
      incoming = [];
    }

    // Institutional 13F funds (SEC EDGAR), combined with the congressional source. Best-effort:
    // a 13F failure is reported in the body and never blocks congressional ingestion.
    // ?refresh13f=1 bypasses the "already ingested" check (e.g. to finish an interrupted ingest).
    let sec13f;
    if (enabled13F()) {
      try {
        const force = /^(1|true|yes)$/i.test(String(req.query?.refresh13f || ""));
        const { rows, report } = await fetchNew13FDisclosures({
          isIngested: force ? async () => false : (actor, filed) => thirteenFIngested(db, actor, filed),
        });
        incoming = incoming.concat(rows);
        sec13f = report;
      } catch (e) {
        sec13f = { error: String(e.message || e).slice(0, 200) };
      }
    }

    let inserted = 0, notified = 0;
    for (const d of incoming) {
      const s = await screenCached(db, d.ticker); // raw screening inputs (cached, 30-day)
      const rec = { ...d, ...s };
      rec.label = classifyAAOIFI(rec);              // AAOIFI verdict

      const { data, error } = await upsertDisclosure(db, rec);
      if (!error && data && data.length) {
        inserted++;
        // Fan out an in-app notification to everyone following this portfolio (best-effort;
        // tolerant of the follows/notifications tables being absent). Never blocks ingest.
        notified += await notifyFollowers(db, { ...rec, id: data[0].id });
      }
    }
    return res.status(200).json({
      ok: !sourceError, source: activeSource(), checked: incoming.length, inserted, notified,
      // Both absent when ENABLE_13F is off, so the legacy response is unchanged.
      ...(sourceError || {}), ...(sec13f ? { sec13f } : {}),
    });
  } catch (e) {
    // Keep the cron alive on unexpected errors too (report in the body, not via a 5xx that
    // would get the job auto-disabled). Truly fatal misconfig still surfaces here.
    return res.status(200).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}

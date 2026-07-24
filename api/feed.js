// GET /api/feed -> disclosure feed in the exact shape the Mizān UI expects.
// The completeness gate is ON BY DEFAULT: unscreened / verdict-less rows are excluded from
// the feed (spec + v1-extend decision #2 — hide unscreened app-wide, in the query layer).
//   ?all=1          include unscreened rows too (internal/admin/debug only).
//   ?performance=1  join the cached prices and attach dual-anchor performance per row.
import { supabase } from "./_lib/supabase.js";
import { classifyFB } from "./_lib/frameworkB.js";
import { dualAnchor } from "./_lib/performance.js";
// import { requireAuth } from "./_lib/auth.js"; // uncomment to require login

function toClient(row) {
  const rec = {
    id: row.id,
    actor: row.actor, kind: row.kind, initials: row.initials, source: row.source, side: row.side,
    ticker: row.ticker, company: row.company, sector: row.sector,
    amount: row.amount, amountMid: row.amount_mid,
    shares: row.shares, sharesLabel: row.shares_label,
    transactionDate: row.transaction_date, filingDate: row.filing_date,
    purchasePrice: Number(row.purchase_price), fallbackPrice: Number(row.fallback_price),
    business: row.business, businessStatus: row.business_status,
    impurePct: Number(row.impure_pct), debtRatio: Number(row.debt_ratio),
    reasoning: row.reasoning, purification: row.purification,
    alert: row.alert, confidence: row.confidence
  };
  // Whether this row has real screening data. Prefer an explicit `screened` column if the
  // DB has one; otherwise derive it from the mock fallback's reasoning marker. Kept
  // migration-free so existing deployments keep working.
  rec.screened = typeof row.screened === "boolean"
    ? row.screened
    : !/^No screening data/i.test(row.reasoning || "");
  rec.label = classifyFB(rec); // engine is the single source of truth for the verdict
  return rec;
}

// Completeness gate (spec §5/§7, v1-extend decision #2): a row is surfaced only when it has
// real screening data (a verdict) and is not unscreened. Unscreened names must never appear
// compliant — they're hidden from every list, feed, and search. Applied by default below.
function passesGate(rec) {
  return rec.screened !== false && rec.label !== "unscreened" && !!rec.label;
}

// Attach dual-anchor performance to each row from the cached prices. Best-effort: if the
// prices table is absent/unreachable, rows get performance:null (UI shows "Price pending")
// rather than failing the feed. Never fabricates — only computes where cached data exists.
async function attachPerformance(db, rows) {
  let byTicker = new Map();
  try {
    const tickers = [...new Set(rows.map((r) => r.ticker).filter(Boolean))];
    if (tickers.length) {
      const { data, error } = await db
        .from("prices").select("ticker,quote,history").in("ticker", tickers);
      if (error) throw error;
      byTicker = new Map(
        (data || []).map((p) => [p.ticker, { quote: p.quote == null ? null : Number(p.quote), history: p.history || [] }]),
      );
    }
  } catch (e) {
    byTicker = new Map(); // cache missing -> everything "Price pending"
  }
  return rows.map((r) => ({ ...r, performance: dualAnchor(byTicker.get(r.ticker), r) }));
}

export default async function handler(req, res) {
  // if (!requireAuth(req)) return res.status(401).json({ error: "Unauthorized" });
  try {
    const includeAll = /^(1|true|yes)$/i.test(String(req.query.all || ""));
    const withPerf = /^(1|true|yes)$/i.test(String(req.query.performance || ""));
    const db = supabase();
    const { data, error } = await db
      .from("disclosures").select("*")
      .order("filing_date", { ascending: false })
      .limit(100);
    if (error) throw error;
    let rows = (data || []).map(toClient);
    if (!includeAll) rows = rows.filter(passesGate); // gate ON by default
    if (withPerf) rows = await attachPerformance(db, rows);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export { passesGate };

// GET /api/feed -> disclosure feed in the exact shape the Mizān UI expects.
import { supabase } from "./_lib/supabase.js";
import { classifyFB } from "./_lib/frameworkB.js";
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

// Completeness gate (spec §5/§7): a row is eligible for RANKED lists only when it has real
// screening data (a verdict). Unscreened names must never appear compliant, and are hidden
// from ranked lists — reachable only by direct search. This is OPT-IN via `?ranked=1` so
// existing consumers (and search) keep the full set by default; ranked surfaces request it.
// (Performance-completeness is enforced later, where the price cache is joined.)
function passesGate(rec) {
  return rec.screened !== false && !!rec.label;
}

export default async function handler(req, res) {
  // if (!requireAuth(req)) return res.status(401).json({ error: "Unauthorized" });
  try {
    const ranked = /^(1|true|yes)$/i.test(String(req.query.ranked || ""));
    const { data, error } = await supabase()
      .from("disclosures").select("*")
      .order("filing_date", { ascending: false })
      .limit(100);
    if (error) throw error;
    let rows = (data || []).map(toClient);
    if (ranked) rows = rows.filter(passesGate);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export { passesGate };

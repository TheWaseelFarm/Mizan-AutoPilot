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
  rec.label = classifyFB(rec); // engine is the single source of truth for the verdict
  return rec;
}

export default async function handler(req, res) {
  // if (!requireAuth(req)) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { data, error } = await supabase()
      .from("disclosures").select("*")
      .order("filing_date", { ascending: false })
      .limit(100);
    if (error) throw error;
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json((data || []).map(toClient));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

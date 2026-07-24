// api/_lib/trends.js
// Smart-money aggregation (spec §A3). PURE — no I/O — so it's unit-testable and shared by the
// refresh cron. Rolls disclosures up per (ticker, timeframe, side):
//   net_weight = Σ (trade value as % of the FILER's disclosed position size)  — the rank metric
//   dollar_est = Σ trade midpoints                                            — secondary $ volume
//   filer_count = distinct filers
//   label      = the ticker's Framework B verdict (engine remains the source of truth)
// Only fully-screened, verdict-carrying rows count (completeness gate — unscreened excluded).

const DAY_MS = 86_400_000;
export const TIMEFRAMES = { "7d": 7, "30d": 30, "90d": 90, all: Infinity };

const amountOf = (r) => Math.abs(Number(r.amountMid ?? r.amount_mid ?? 0));
const sideOf = (r) => (String(r.side).toUpperCase() === "SELL" ? "SELL" : "BUY");

// Each filer's disclosed position size (Σ of their disclosed amounts) — the weight denominator.
function filerTotals(rows) {
  const m = new Map();
  for (const r of rows) m.set(r.actor, (m.get(r.actor) || 0) + amountOf(r));
  return m;
}

export function aggregateTrends(rows, nowMs = Date.now()) {
  const screened = (rows || []).filter(
    (r) => !!r.label && r.label !== "unscreened" && r.screened !== false,
  );
  const totals = filerTotals(screened);
  const out = new Map(); // key: ticker|timeframe|side

  for (const r of screened) {
    const side = sideOf(r);
    const amt = amountOf(r);
    const ft = totals.get(r.actor) || amt || 1;
    const w = ft > 0 ? amt / ft : 0; // trade value as a fraction of the filer's position
    const filedMs = Date.parse(r.filingDate ?? r.filing_date ?? "");

    for (const [tf, days] of Object.entries(TIMEFRAMES)) {
      if (days !== Infinity) {
        if (Number.isNaN(filedMs) || nowMs - filedMs > days * DAY_MS) continue;
      }
      const key = `${r.ticker}|${tf}|${side}`;
      const e =
        out.get(key) ||
        { ticker: r.ticker, company: r.company || r.ticker, timeframe: tf, side, net_weight: 0, dollar_est: 0, filers: new Set(), label: r.label };
      e.net_weight += w;
      e.dollar_est += amt;
      e.filers.add(r.actor);
      e.label = r.label;
      out.set(key, e);
    }
  }

  return [...out.values()]
    .map((e) => ({
      ticker: e.ticker,
      company: e.company,
      timeframe: e.timeframe,
      side: e.side,
      net_weight: +(e.net_weight * 100).toFixed(2), // % of position, summed across filers
      dollar_est: Math.round(e.dollar_est),
      filer_count: e.filers.size,
      label: e.label,
    }))
    .sort((a, b) => b.net_weight - a.net_weight);
}

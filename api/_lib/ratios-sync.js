// Pure helper for api/rescreen.js: copy the cash ratio (and the verdict it drives) from the
// screening cache onto stored disclosure rows.
//
// Why: poll-disclosures and rescreen wrote impure_pct and debt_ratio but NEVER cash_pct, so every
// stored row kept the column default 0 and AAOIFI's 30% cash + interest-bearing-securities screen
// was silently skipped (e.g. TTD, ~80% cash, was shown as passing). The screenings cache already
// holds the real ratio, so this backfills without any provider call.
import { classifyAAOIFI } from "./aaoifi.js";

const num = (v) => (v == null || v === "" || !isFinite(Number(v)) ? null : Number(v));

// discRows: [{ ticker, cash_pct, label }]   screenRows: [{ ticker, payload }]
// Returns one update per ticker whose stored cash_pct differs from the cached payload.
export function ratioUpdates(discRows, screenRows) {
  const payloads = new Map();
  for (const s of screenRows || []) {
    const p = s && s.payload;
    if (!p || /^No screening data/i.test(p.reasoning || "")) continue; // never copy mock/no-data
    if (num(p.cashPct) == null) continue;
    payloads.set(s.ticker, p);
  }
  const seen = new Map(); // ticker -> stored cash_pct (first row; all rows of a ticker share it)
  for (const r of discRows || []) if (!seen.has(r.ticker)) seen.set(r.ticker, num(r.cash_pct));
  const out = [];
  for (const [ticker, stored] of seen) {
    const p = payloads.get(ticker);
    if (!p) continue;
    const cash = num(p.cashPct);
    if (stored != null && Math.abs(stored - cash) < 0.001) continue;
    out.push({ ticker, cash_pct: cash, label: classifyAAOIFI(p) });
  }
  return out;
}

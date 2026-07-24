// Self-test for the smart-money aggregation (spec §A3). Run: npm test
import assert from "node:assert";

import { aggregateTrends } from "../api/_lib/trends.js";

const NOW = Date.parse("2026-07-24");
const rows = [
  // Filer A position total = 100k (30k NVDA + 70k MSFT)
  { actor: "A", ticker: "NVDA", company: "NVIDIA", side: "BUY", amountMid: 30000, filingDate: "2026-07-20", label: "clean" }, // 4d ago
  { actor: "A", ticker: "MSFT", company: "Microsoft", side: "BUY", amountMid: 70000, filingDate: "2026-07-01", label: "clean" }, // 23d ago
  // Filer B position total = 50k (all NVDA)
  { actor: "B", ticker: "NVDA", company: "NVIDIA", side: "BUY", amountMid: 50000, filingDate: "2026-07-22", label: "clean" }, // 2d ago
  // Unscreened -> must be excluded from the aggregation entirely
  { actor: "C", ticker: "UBS", company: "UBS", side: "BUY", amountMid: 8000, filingDate: "2026-07-23", label: "unscreened", screened: false },
];

const all = aggregateTrends(rows, NOW);
const get = (ticker, tf, side) => all.find((r) => r.ticker === ticker && r.timeframe === tf && r.side === side);

let pass = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  pass++;
};
const near = (a, b, m) => ok(a != null && Math.abs(a - b) < 0.01, `${m} (got ${a}, want ${b})`);

// NVDA in 7d: A weight 30k/100k=0.30, B weight 50k/50k=1.00 -> (1.30)*100 = 130
const nvda7 = get("NVDA", "7d", "BUY");
ok(nvda7, "NVDA 7d/BUY present");
near(nvda7.net_weight, 130, "NVDA 7d net_weight = 130 (weight-normalized)");
ok(nvda7.dollar_est === 80000, "NVDA 7d dollar_est = 80000 (secondary $ volume)");
ok(nvda7.filer_count === 2, "NVDA 7d filer_count = 2");

// MSFT filed 23d ago -> absent from 7d, present in 30d at 70k/100k=0.70 -> 70
ok(!get("MSFT", "7d", "BUY"), "MSFT absent from 7d (filed 23d ago)");
near(get("MSFT", "30d", "BUY").net_weight, 70, "MSFT 30d net_weight = 70");

// Completeness gate: unscreened UBS never appears
ok(!all.some((r) => r.ticker === "UBS"), "unscreened UBS excluded from trends");

// Sorted by net_weight desc within the full set
const byTf = all.filter((r) => r.timeframe === "all" && r.side === "BUY");
ok(byTf[0].net_weight >= byTf[byTf.length - 1].net_weight, "results sorted by net_weight desc");

console.log(`Smart-money trends: ${pass} checks PASSED`);

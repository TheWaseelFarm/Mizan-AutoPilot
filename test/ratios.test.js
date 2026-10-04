// Self-test for the cash-ratio backfill helper. Run: npm test
import assert from "node:assert";
import { ratioUpdates } from "../api/_lib/ratios-sync.js";

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; };

// TTD: provider says cash is ~80% of market cap, but the stored row has the default 0 -> the
// 30% cash screen never fired and TTD showed as passing. The backfill must flip it to fail.
const disc = [
  { ticker: "TTD", cash_pct: 0, label: "purify" }, { ticker: "TTD", cash_pct: 0, label: "purify" },
  { ticker: "MSFT", cash_pct: 12.5, label: "clean" },   // already correct
  { ticker: "NEW", cash_pct: null, label: "clean" },    // null stored, payload has a value
  { ticker: "NODATA", cash_pct: 0, label: "clean" },    // mock payload must never be copied
  { ticker: "NOCACHE", cash_pct: 0, label: "clean" },   // no screening cached
];
const scr = [
  { ticker: "TTD", payload: { cashPct: 80.32, debtRatio: 3.48, impurePct: 0.9, businessStatus: "pass", reasoning: "x" } },
  { ticker: "MSFT", payload: { cashPct: 12.5, debtRatio: 11, impurePct: 0, businessStatus: "pass", reasoning: "x" } },
  { ticker: "NEW", payload: { cashPct: 4, debtRatio: 2, impurePct: 0, businessStatus: "pass", reasoning: "x" } },
  { ticker: "NODATA", payload: { cashPct: 0, reasoning: "No screening data available (mock)" } },
];
const u = ratioUpdates(disc, scr);
const by = Object.fromEntries(u.map((x) => [x.ticker, x]));
ok(u.length === 2 && by.TTD && by.NEW, "only rows whose stored cash differs are updated (TTD, NEW)");
ok(by.TTD.cash_pct === 80.32 && by.TTD.label === "fail", "TTD (80.32% cash) is now Non-compliant");
ok(by.NEW.cash_pct === 4 && by.NEW.label === "clean", "null stored cash is filled from the cache");
ok(!by.MSFT, "already-correct rows are untouched (idempotent)");
ok(!by.NODATA && !by.NOCACHE, "no-data / uncached tickers are never changed");
ok(ratioUpdates(disc.filter((r) => r.ticker !== "TTD"), scr).every((x) => x.ticker !== "TTD"), "only tickers present in disclosures");
ok(ratioUpdates(null, null).length === 0 && ratioUpdates([], []).length === 0, "empty/null inputs are safe");
// idempotence: applying the updates then re-running yields nothing
const applied = disc.map((r) => (by[r.ticker] ? { ...r, cash_pct: by[r.ticker].cash_pct, label: by[r.ticker].label } : r));
ok(ratioUpdates(applied, scr).length === 0, "second run is a no-op");
// a cached cash of exactly 30 passes (engine uses > 30); 30.01 fails — documents the edge case
const edge = (c) => ratioUpdates([{ ticker: "E", cash_pct: 0 }], [{ ticker: "E", payload: { cashPct: c, debtRatio: 0, impurePct: 0, businessStatus: "pass", reasoning: "x" } }])[0].label;
ok(edge(30) === "clean" && edge(30.01) === "fail", "threshold edge: 30.0 passes, 30.01 fails (engine rule: > 30)");
console.log(`Cash-ratio backfill: ${pass} checks PASSED`);

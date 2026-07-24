// Self-test for the dual-anchor performance module (spec §3.4).
// Run: npm test  — or: node test/performance.test.js
process.env.TZ = "UTC"; // deterministic date parsing (before any Date use)
import assert from "node:assert";

import { pctChange, closeOnOrAfter, dualAnchor, freshnessNote } from "../api/_lib/performance.js";

let pass = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  pass++;
};
const near = (a, b, msg) => ok(a != null && Math.abs(a - b) < 0.01, `${msg} (got ${a}, want ~${b})`);

// --- pctChange + closeOnOrAfter -------------------------------------------------
ok(pctChange(100, 120) === 20, "pctChange 100->120 = 20%");
ok(pctChange(0, 10) === null, "pctChange guards divide-by-zero");
ok(pctChange(null, 10) === null, "pctChange guards null");

const history = [
  { d: "2026-06-01", c: 100 },
  { d: "2026-06-10", c: 110 },
  { d: "2026-06-20", c: 120 },
];
ok(closeOnOrAfter(history, Date.parse("2026-06-05")) === 110, "closeOnOrAfter picks first close on/after target");
ok(closeOnOrAfter(history, Date.parse("2026-07-01")) === null, "closeOnOrAfter null when target after last day");

// --- dualAnchor: a large part of the move happened before it was public ---------
let a = dualAnchor({ quote: 120, history }, { transactionDate: "Jun 01, 2026", filingDate: "Jun 10, 2026" });
ok(a !== null, "dualAnchor returns a result with price data");
ok(a.disclosedClose === 100 && a.publicClose === 110, "anchors: disclosed 100, public 110");
near(a.sinceDisclosed, 20, "sinceDisclosed = 20%");
near(a.sincePublic, 9.09, "sincePublic = 9.09%");
near(a.disclosedToPublicPct, 10, "disclosed->public = 10%");
ok(a.lagDays === 9, "lag = 9 days");
ok(a.freshness === "A large part of this move happened before it was public.", "freshness: large part (share 0.5)");

// --- dualAnchor: MOST of the move happened before it was public -----------------
let b = dualAnchor({ quote: 120, history }, { transactionDate: "Jun 01, 2026", filingDate: "Jun 20, 2026" });
near(b.sinceDisclosed, 20, "b sinceDisclosed = 20%");
near(b.sincePublic, 0, "b sincePublic = 0% (public close already 120)");
ok(b.freshness === "Most of this move happened before it was public.", "freshness: most (share 1.0)");

// --- immaterial move -> no freshness note --------------------------------------
const flat = [{ d: "2026-06-01", c: 100 }, { d: "2026-06-20", c: 101 }];
let c = dualAnchor({ quote: 101, history: flat }, { transactionDate: "Jun 01, 2026", filingDate: "Jun 10, 2026" });
near(c.sinceDisclosed, 1, "c sinceDisclosed = 1%");
ok(c.freshness === null, "freshness: null when move < 3%");

// --- move reversed after going public -> no "before public" note ---------------
ok(freshnessNote(10, -8) === null, "freshness: null when move reversed post-public");

// --- honest gaps: no price / empty history / trade after cache -> null ----------
ok(dualAnchor(null, { transactionDate: "Jun 01, 2026" }) === null, "no price -> null");
ok(dualAnchor({ quote: null, history }, {}) === null, "no quote -> null");
ok(dualAnchor({ quote: 120, history: [] }, {}) === null, "empty history -> null");
let d = dualAnchor({ quote: 120, history }, { transactionDate: "Jul 05, 2026", filingDate: "Jul 06, 2026" });
ok(d.sinceDisclosed === null && d.freshness === null, "trade after cached range -> sinceDisclosed null, no fabrication");

console.log(`Performance (dual-anchor): ${pass} checks PASSED`);

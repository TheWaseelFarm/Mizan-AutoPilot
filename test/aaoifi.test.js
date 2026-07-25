// Self-test for the AAOIFI Standard 21 engine. Run: npm test
import { classifyAAOIFI, purificationEstimate, AAOIFI } from "../api/_lib/aaoifi.js";
import assert from "node:assert";

const cases = [
  // clean: passes both screens, zero impure income
  [{ businessStatus: "pass", impurePct: 0, debtRatio: 3.2, cashPct: 6.5 }, "clean"],
  // purify: passes both screens but has some impure income (0–5%)
  [{ businessStatus: "pass", impurePct: 0.8, debtRatio: 7.1, cashPct: 9 }, "purify"],
  [{ businessStatus: "watch", impurePct: 1.7, debtRatio: 2.9, cashPct: 11 }, "purify"],
  // fail: debt over the 30% limit — the KEY AAOIFI difference (debt now FAILS, not advisory)
  [{ businessStatus: "pass", impurePct: 0, debtRatio: 52, cashPct: 3 }, "fail"],
  // fail: cash + interest securities over 30%
  [{ businessStatus: "pass", impurePct: 0, debtRatio: 5, cashPct: 35 }, "fail"],
  // fail: impermissible business activity
  [{ businessStatus: "fail", impurePct: 71, debtRatio: 0 }, "fail"],
  // fail: impure income over 5%
  [{ businessStatus: "pass", impurePct: 6, debtRatio: 5 }, "fail"],
  // debt exactly at the 30% limit is still compliant (strict > )
  [{ businessStatus: "pass", impurePct: 0, debtRatio: 30, cashPct: 30 }, "clean"],
];

let pass = 0;
for (const [rec, expect] of cases) {
  assert.strictEqual(classifyAAOIFI(rec), expect, `expected ${expect} for ${JSON.stringify(rec)}`);
  pass++;
}

// Task verification scenarios (mirrored in the PR description):
assert.strictEqual(classifyAAOIFI({ businessStatus: "fail" }), "fail", "conventional bank -> Non-compliant");
assert.strictEqual(classifyAAOIFI({ businessStatus: "pass", impurePct: 0, debtRatio: 45 }), "fail", "high-debt halal name -> Non-compliant");
assert.strictEqual(classifyAAOIFI({ businessStatus: "pass", impurePct: 1.5, debtRatio: 8, cashPct: 10 }), "purify", "clean tech + ~1.5% impure -> Compliant · purify");

// Thresholds + purification (dividend/gain % of impure income; debt never purifies under AAOIFI)
assert.strictEqual(AAOIFI.debtMax, 30);
assert.strictEqual(purificationEstimate({ impurePct: 2 }, 1000), 20); // 2% of a $1,000 gain

console.log(`AAOIFI: ${pass}/${cases.length} classification cases + 3 verification scenarios + purification PASSED`);

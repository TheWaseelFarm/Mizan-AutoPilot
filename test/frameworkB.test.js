// Minimal self-test for the Framework B engine.  Run: npm test
import { classifyFB, purificationEstimate } from "../api/_lib/frameworkB.js";
import assert from "node:assert";

const cases = [
  [{ businessStatus: "pass", impurePct: 0,   debtRatio: 3.2 }, "clean"],  // no impure, low debt
  [{ businessStatus: "pass", impurePct: 0.8, debtRatio: 7.1 }, "purify"], // non-zero impure -> purify
  [{ businessStatus: "pass", impurePct: 0,   debtRatio: 52  }, "purify"], // debt advisory, NEVER fail
  [{ businessStatus: "watch",impurePct: 1.7, debtRatio: 2.9 }, "purify"],
  [{ businessStatus: "fail", impurePct: 71,  debtRatio: 0   }, "fail"],   // impermissible business
  [{ businessStatus: "pass", impurePct: 6,   debtRatio: 5   }, "fail"],   // impure > 5%
];
let pass = 0;
for (const [rec, expect] of cases) {
  assert.strictEqual(classifyFB(rec), expect, `expected ${expect} for ${JSON.stringify(rec)}`);
  pass++;
}
assert.strictEqual(purificationEstimate({ impurePct: 2 }, 1000), 20); // 2% of a $1,000 gain
console.log(`Framework B: ${pass}/${cases.length} classification cases + purification math PASSED`);

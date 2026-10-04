// Self-test for the price-refresh queue selection. Run: npm test
import assert from "node:assert";
import { pickBatch, MIN_AGE_MS } from "../api/_lib/price-queue.js";

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; };
const NOW = Date.parse("2026-10-03T12:00:00Z");
const ago = (h) => new Date(NOW - h * 3600e3).toISOString();
const names = (n, p) => Array.from({ length: n }, (_, i) => `${p}${String(i).padStart(2, "0")}`);

// 1. Fresh rows are not due; empty / null inputs are safe.
let r = pickBatch(["A", "B"], new Map([["A", ago(1)], ["B", ago(19)]]), { now: NOW });
ok(r.batch.length === 0 && r.due === 0, "rows touched < 20h ago are not due");
r = pickBatch(null, new Map(), { now: NOW });
ok(r.batch.length === 0 && r.due === 0, "null tickers -> empty");

// 2. Fair share: 20 never-fetched + 14 stale -> 4 + 4 per batch (stale are not starved).
const never = names(20, "N"), stale = names(14, "S");
const seen = new Map(stale.map((t, i) => [t, ago(2013 - i)])); // months old, S00 oldest
r = pickBatch([...never, ...stale], seen, { now: NOW, max: 8 });
ok(r.batch.length === 8, "batch size 8");
ok(r.batch.filter((t) => t.startsWith("N")).length === 4 && r.batch.filter((t) => t.startsWith("S")).length === 4, "half never-fetched, half oldest existing");
ok(r.batch.includes("S00") && r.batch.includes("S03") && !r.batch.includes("S04"), "stale picked oldest first");
ok(r.due === 34, "due counts both pools");

// 3. One pool short -> the other fills the batch.
r = pickBatch(names(2, "N"), new Map(), { now: NOW, max: 8 });
ok(r.batch.length === 2, "only 2 due -> 2 picked");
r = pickBatch(names(30, "N"), new Map(), { now: NOW, max: 8 });
ok(r.batch.length === 8 && r.batch.every((t) => t.startsWith("N")), "all never-fetched fills the batch");
r = pickBatch(stale, seen, { now: NOW, max: 8 });
ok(r.batch.length === 8 && r.batch.every((t) => t.startsWith("S")), "all stale fills the batch");

// 4. Failed tickers rotate to the back: after a failed attempt marks updated_at = now they are no
//    longer due, so they cannot block the queue; they come back after MIN_AGE_MS.
const failing = ["EA", "BRCM", "USOU"];
const seen2 = new Map(failing.map((t) => [t, new Date(NOW).toISOString()]));
r = pickBatch([...failing, ...names(10, "N")], seen2, { now: NOW, max: 8 });
ok(r.batch.every((t) => !failing.includes(t)) && r.batch.length === 8, "just-attempted failing tickers are skipped");
r = pickBatch(failing, seen2, { now: NOW + MIN_AGE_MS + 1, max: 8 });
ok(r.batch.length === 3, "failing tickers are retried after MIN_AGE_MS");

// 5. Determinism + invalid timestamps count as due (oldest).
const a = pickBatch(names(12, "N"), new Map(), { now: NOW }), b = pickBatch(names(12, "N").reverse(), new Map(), { now: NOW });
ok(JSON.stringify(a.batch) === JSON.stringify(b.batch), "selection independent of input order");
r = pickBatch(["X"], new Map([["X", null]]), { now: NOW });
ok(r.batch.length === 1, "row with null updated_at is due");

// 6. Drain simulation: 155 tickers (65 never, 90 cached w/ 14 stale), 3 always failing -> every
//    ticker is attempted within ceil(due/8) calls and nothing is attempted twice in the window.
const all = [...names(65, "N"), ...names(90, "C"), ...failing];
const seen3 = new Map([...names(90, "C")].map((t, i) => [t, i < 14 ? ago(2000) : ago(30)]));
const attempted = new Set(); let calls = 0;
for (; calls < 40; calls++) {
  const { batch } = pickBatch(all, seen3, { now: NOW, max: 8 });
  if (!batch.length) break;
  for (const t of batch) { ok(!attempted.has(t), `no repeat attempt in window (${t})`); attempted.add(t); seen3.set(t, new Date(NOW).toISOString()); }
}
ok(attempted.size === all.length, "every ticker attempted exactly once");
ok(calls <= Math.ceil(all.length / 8) + 1, `drained in ${calls} calls`);

console.log(`Price queue: ${pass} checks PASSED`);

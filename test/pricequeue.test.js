// Self-test for the price-refresh queue selection. Run: npm test
import assert from "node:assert";
import { pickBatch, FAILED_RETRY_MS } from "../api/_lib/price-queue.js";

let pass = 0;
const ok = (c, m) => { assert.ok(c, m); pass++; };
const NOW = Date.parse("2026-10-06T12:00:00Z"); // a Tuesday (weekend rules are tested separately)
const ago = (h) => new Date(NOW - h * 3600e3).toISOString();
const DAY = 24 * 3600e3;
const names = (n, p) => Array.from({ length: n }, (_, i) => `${p}${String(i).padStart(2, "0")}`);

// 1. Fresh rows are not due; empty / null inputs are safe.
// NOW = Tuesday 12:00 UTC. Touched earlier TODAY (even 11h ago) -> not due; touched YESTERDAY
// (even 13h ago) -> due: the rule is one fetch per UTC calendar day.
let r = pickBatch(["A", "B"], new Map([["A", ago(1)], ["B", ago(11.5)]]), { now: NOW });
ok(r.batch.length === 0 && r.due === 0, "rows touched earlier today are not due");
r = pickBatch(["A", "B"], new Map([["A", ago(12.5)], ["B", ago(36)]]), { now: NOW });
ok(r.batch.length === 2, "rows touched on an earlier calendar day are due (even 12.5h ago)");
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
// never-succeeded tickers (row without a price) back off for FAILED_RETRY_MS (7 days), not 1 day
const failedSet = new Set(failing);
r = pickBatch(failing, seen2, { now: NOW + DAY, max: 8, failed: failedSet });
ok(r.batch.length === 0, "never-succeeded tickers are NOT retried the next day");
r = pickBatch(failing, seen2, { now: NOW + 6 * DAY, max: 8, failed: failedSet });
ok(r.batch.length === 0, "...nor after 6 days");
r = pickBatch(failing, seen2, { now: NOW + FAILED_RETRY_MS + 1, max: 8, failed: failedSet }); // Tue + 7d = Tue
ok(r.batch.length === 3, "...but are retried after 7 days");
r = pickBatch(failing, seen2, { now: NOW + DAY, max: 8 });
ok(r.batch.length === 3, "tickers that did succeed once are refreshed the next day");

// 4b. Weekends (UTC): cached tickers are not refreshed; never-fetched ones still are.
const SAT = Date.parse("2026-10-03T12:00:00Z"), SUN = Date.parse("2026-10-04T12:00:00Z"), MON = Date.parse("2026-10-05T12:00:00Z");
const oldSeen = new Map([["C1", new Date(SAT - 3 * DAY).toISOString()], ["C2", new Date(SAT - 5 * DAY).toISOString()]]);
for (const [label, t] of [["Saturday", SAT], ["Sunday", SUN]]) {
  r = pickBatch(["C1", "C2", "NEW1"], oldSeen, { now: t, max: 8 });
  ok(r.weekend && r.batch.length === 1 && r.batch[0] === "NEW1", `${label}: only never-fetched tickers are fetched`);
  ok(r.due === 1, `${label}: cached tickers are not counted as due`);
}
r = pickBatch(["C1", "C2", "NEW1"], oldSeen, { now: MON, max: 8 });
ok(!r.weekend && r.batch.length === 3, "Monday: cached tickers are due again");
ok(pickBatch(["C1"], oldSeen, { now: SAT, skipWeekend: false }).batch.length === 1, "skipWeekend:false disables the gate");

// 4c. Credit budget: over a full week the cron fires every 30 min, yet no ticker is fetched more
//     than once per calendar day and nothing is fetched on the weekend.
{
  const tick = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const store = new Map(tick.map((t) => [t, new Date(MON - 2 * DAY).toISOString()])); // Sat-old
  const perDay = {}; const WEEK0 = Date.parse("2026-10-05T00:00:00Z");
  for (let step = 0; step < 7 * 48; step++) {
    const now = WEEK0 + step * 1800e3;
    for (let guard = 0; guard < 10; guard++) {
      const { batch } = pickBatch(tick, store, { now, max: 8 });
      if (!batch.length) break;
      const d = new Date(now).toISOString().slice(0, 10); perDay[d] = (perDay[d] || 0) + batch.length;
      batch.forEach((t) => store.set(t, new Date(now).toISOString()));
    }
  }
  const days = Object.entries(perDay);
  ok(days.every(([, n]) => n <= tick.length), "<= one fetch per ticker per day: " + JSON.stringify(perDay));
  ok(!perDay["2026-10-10"] && !perDay["2026-10-11"], "no fetches on Sat/Sun");
  ok(perDay["2026-10-05"] === tick.length, "Monday refreshes every ticker once");
}

// 5. Determinism + invalid timestamps count as due (oldest).
const a = pickBatch(names(12, "N"), new Map(), { now: NOW }), b = pickBatch(names(12, "N").reverse(), new Map(), { now: NOW });
ok(JSON.stringify(a.batch) === JSON.stringify(b.batch), "selection independent of input order");
r = pickBatch(["X"], new Map([["X", null]]), { now: NOW });
ok(r.batch.length === 1, "row with null updated_at is due");

// 6. Drain simulation: 155 tickers (65 never, 90 cached w/ 14 stale), 3 always failing -> every
//    ticker is attempted within ceil(due/8) calls and nothing is attempted twice in the window.
const all = [...names(65, "N"), ...names(90, "C"), ...failing];
const seen3 = new Map([...names(90, "C")].map((t, i) => [t, i < 14 ? ago(2000) : ago(30)]));
const attempted = new Set(); let calls = 0; // (Tuesday NOW: weekday)
for (; calls < 40; calls++) {
  const { batch } = pickBatch(all, seen3, { now: NOW, max: 8 });
  if (!batch.length) break;
  for (const t of batch) { ok(!attempted.has(t), `no repeat attempt in window (${t})`); attempted.add(t); seen3.set(t, new Date(NOW).toISOString()); }
}
ok(attempted.size === all.length, "every ticker attempted exactly once");
ok(calls <= Math.ceil(all.length / 8) + 1, `drained in ${calls} calls`);

console.log(`Price queue: ${pass} checks PASSED`);

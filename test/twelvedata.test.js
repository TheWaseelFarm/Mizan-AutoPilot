// Self-test for the Twelve Data price adapter's OHLCV mapping (no network: global fetch is mocked).
// Run: npm test  — or: node test/twelvedata.test.js
import assert from "node:assert";
import { fetchPrice, toPoint } from "../api/_lib/prices/twelvedata.js";
import { closeOnOrAfter, dualAnchor } from "../api/_lib/performance.js";

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// Mock the ONE time_series call. Twelve Data returns numbers as strings, newest first unless order=ASC.
let calls = 0, lastUrl = "";
const mock = (body, status = 200) => {
  globalThis.fetch = async (url) => { calls++; lastUrl = String(url); return { status, text: async () => JSON.stringify(body) }; };
};
process.env.TWELVEDATA_API_KEY = "test-key";

mock({
  status: "ok",
  values: [
    { datetime: "2026-06-03", open: "101.123456", high: "103.5", low: "100.25", close: "102.987654", volume: "1234567" },
    { datetime: "2026-06-01", open: "99", high: "100.5", low: "98.75", close: "100", volume: "1000000" },
    // missing open -> keeps the close (and volume) but no o/h/l: never a half candle
    { datetime: "2026-06-02", open: "", high: "101", low: "99", close: "100.5", volume: "900000.4" },
    // high below the close (bad bar) -> close only, no o/h/l
    { datetime: "2026-06-04", open: "103", high: "102", low: "101", close: "104", volume: "n/a" },
    // no close -> dropped entirely
    { datetime: "2026-06-05", open: "104", high: "105", low: "103", close: "", volume: "5" },
  ],
});

const r = await fetchPrice("NVDA");
ok(calls === 1, "exactly one API call per ticker");
ok(/\/time_series\?symbol=NVDA/.test(lastUrl) && /outputsize=400/.test(lastUrl), "same single time_series request (no extra credits)");
ok(r && Array.isArray(r.history) && r.history.length === 4, "rows without a close are dropped");
ok(r.history.map((p) => p.d).join() === "2026-06-01,2026-06-02,2026-06-03,2026-06-04", "history sorted ascending");

const [d1, d2, d3, d4] = r.history;
assert.deepStrictEqual(d1, { d: "2026-06-01", o: 99, h: 100.5, l: 98.75, c: 100, v: 1000000 });
pass++;
ok(d3.o === 101.1235 && d3.c === 102.9877 && d3.h === 103.5 && d3.l === 100.25, "prices rounded to at most 4 decimals");
ok(d3.v === 1234567 && Number.isInteger(d3.v), "volume is an integer");
ok(d2.c === 100.5 && !("o" in d2) && !("h" in d2) && !("l" in d2), "missing open -> close kept, no o/h/l");
ok(d2.v === 900000, "volume kept (rounded) even without o/h/l");
ok(d4.c === 104 && !("o" in d4) && !("v" in d4), "inconsistent bar -> close only; non-numeric volume omitted");
ok(r.quote === 104, "quote = latest close");

// Every existing consumer reads .d/.c only — OHLCV points must keep working there.
ok(closeOnOrAfter(r.history, Date.parse("2026-06-02T00:00:00Z")) === 100.5, "closeOnOrAfter works on OHLCV points");
const perf = dualAnchor({ quote: r.quote, history: r.history }, { transactionDate: "2026-06-01", filingDate: "2026-06-03" });
ok(perf && perf.sinceDisclosed != null, "dualAnchor works on OHLCV points");

// toPoint directly
ok(toPoint({ datetime: "2026-06-01 00:00:00", close: "5" }).d === "2026-06-01", "datetime trimmed to the day");
ok(toPoint({ datetime: "", close: "5" }) === null && toPoint(null) === null, "no date -> null");

// No-data and rate-limit paths are unchanged.
mock({ status: "error", code: 400, message: "**symbol** not found: ZZZZ" });
ok((await fetchPrice("ZZZZ")) === null, "genuine no-data -> null");
mock({ status: "error", code: 429, message: "You have run out of API credits" });
await assert.rejects(fetchPrice("NVDA"), (e) => e.code === "RATE_LIMIT"); pass++;

console.log(`Twelve Data adapter (OHLCV): ${pass} checks PASSED`);

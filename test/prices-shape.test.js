// Self-test for the /api/prices response shapes (pure; no network, no DB).
// Run: npm test  — or: node test/prices-shape.test.js
import assert from "node:assert";
import { cleanTicker, closesOnly, pricesPayload } from "../api/_lib/prices/shape.js";

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// closesOnly: strips o/h/l/v, keeps order, drops points without a date or finite close.
const h = [
  { d: "2026-06-01", o: 99, h: 100.5, l: 98.75, c: 100, v: 1000000 },
  { d: "2026-06-02", c: 100.5, v: 900000 },
  { d: "2026-06-03", c: "102.9877" },
  { d: "", c: 5 }, { d: "2026-06-04", c: null }, { d: "2026-06-05", c: "x" }, null,
];
const co = closesOnly(h);
ok(co.length === 3, "closesOnly keeps the 3 valid points");
ok(co.every((p) => Object.keys(p).join() === "d,c"), "closesOnly points carry only d + c");
ok(co[2].c === 102.9877 && typeof co[2].c === "number", "closesOnly coerces a numeric-string close");
ok(closesOnly(null).length === 0 && closesOnly("x").length === 0, "closesOnly tolerates a non-array");

// pricesPayload: default closes-only; ohlc=true passes the stored points through unchanged.
const rows = [{ ticker: "JPM", quote: "301.2", history: h.slice(0, 3), updated_at: "2026-06-03T22:00:00Z" }, { ticker: "EA", quote: null, history: null }];
const def = pricesPayload(rows);
ok(def.JPM.quote === 301.2 && def.JPM.updatedAt === "2026-06-03T22:00:00Z", "payload keeps quote + updatedAt");
ok(def.JPM.history.every((p) => p.o == null && p.h == null && p.l == null && p.v == null), "default payload has no o/h/l/v");
ok(def.EA.quote === null && Array.isArray(def.EA.history) && def.EA.history.length === 0, "missing history -> []");
const full = pricesPayload(rows.slice(0, 1), { ohlc: true });
ok(full.JPM.history[0].o === 99 && full.JPM.history[0].v === 1000000, "ohlc payload keeps open + volume");
ok(full.JPM.history[1].o == null && full.JPM.history[1].c === 100.5, "ohlc payload never invents a missing open");

// cleanTicker: the ?ticker= guard.
ok(cleanTicker("jpm") === "JPM" && cleanTicker("BRK.B") === "BRK.B" && cleanTicker("BF-B") === "BF-B", "cleanTicker accepts real tickers");
ok(cleanTicker("") === null && cleanTicker("JPM;drop") === null && cleanTicker("A".repeat(20)) === null && cleanTicker(null) === null, "cleanTicker rejects junk");

// Size guard: Vercel caps a (non-streamed) function response at 4.5 MB. With ~300 tickers x 400 daily
// points fully cached with OHLCV, the default all-tickers payload must stay under it; the same set
// WITH OHLCV would not (which is why OHLCV is served one ticker at a time).
const TICKERS = 300, POINTS = 400, LIMIT = 4.5e6;
const day0 = Date.UTC(2025, 0, 2);
const big = Array.from({ length: TICKERS }, (_, t) => ({
  ticker: "T" + t, quote: 123.45, updated_at: "2026-06-03T22:00:00Z",
  history: Array.from({ length: POINTS }, (_, i) => {
    const c = Math.round((100 + t + Math.sin(i / 7) * 9 + i / 13) * 1e4) / 1e4;
    return { d: new Date(day0 + i * 864e5).toISOString().slice(0, 10), o: Math.round((c - 0.4123) * 1e4) / 1e4, h: Math.round((c + 1.2345) * 1e4) / 1e4, l: Math.round((c - 1.3456) * 1e4) / 1e4, c, v: 12345678 + i * 7919 };
  }),
}));
const defBytes = Buffer.byteLength(JSON.stringify(pricesPayload(big)));
const fullBytes = Buffer.byteLength(JSON.stringify(pricesPayload(big, { ohlc: true })));
ok(defBytes < LIMIT, `default payload ${TICKERS}x${POINTS} = ${(defBytes / 1e6).toFixed(2)} MB stays under 4.5 MB`);
ok(fullBytes > LIMIT, `the same set with OHLCV (${(fullBytes / 1e6).toFixed(2)} MB) would exceed it — keep OHLCV per ticker`);
const one = Buffer.byteLength(JSON.stringify(pricesPayload(big.slice(0, 1), { ohlc: true })));
ok(one < 100e3, `one ticker with OHLCV = ${(one / 1e3).toFixed(0)} KB`);

console.log(`/api/prices shapes (closes-only default, OHLCV per ticker): ${pass} checks PASSED (default ${(defBytes / 1e6).toFixed(2)} MB vs ${(fullBytes / 1e6).toFixed(2)} MB with OHLCV)`);

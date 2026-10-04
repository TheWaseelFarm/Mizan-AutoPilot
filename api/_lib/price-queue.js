// Pure queue selection for api/refresh-prices.js (unit-tested in test/pricequeue.test.js).
//
// Problems this fixes (found on production, Oct 2026):
//  - never-fetched tickers always sorted first, so tickers that ALWAYS fail (paid-plan / invalid
//    symbols) stayed at the head forever and starved everything else;
//  - cached series were only reached after every never-fetched ticker had a row;
//  - every 30-minute run re-fetched whatever was oldest, even if refreshed an hour ago.
//
// Rules:
//  1. A ticker is DUE if it has no row, or its row was last touched (success OR failed attempt)
//     more than `minAgeMs` ago. Failed attempts also touch `updated_at` (see refresh-prices.js),
//     so a failing ticker retries once per `minAgeMs`, not every run.
//  2. Fair share: each batch takes up to half from never-fetched tickers and half from the oldest
//     existing rows (filling from the other pool when one runs short), so neither starves.
export const MIN_AGE_MS = 20 * 3600 * 1000;

export function pickBatch(tickers, seenAt, { now = Date.now(), max = 8, minAgeMs = MIN_AGE_MS } = {}) {
  const uniq = [...new Set((tickers || []).filter(Boolean))];
  const never = [], aged = [];
  for (const t of uniq) {
    if (!seenAt.has(t)) { never.push(t); continue; }
    const ts = Date.parse(seenAt.get(t) || "");
    if (!isFinite(ts) || now - ts >= minAgeMs) aged.push([t, isFinite(ts) ? ts : -Infinity]);
  }
  never.sort(); // deterministic
  aged.sort((a, b) => (a[1] === b[1] ? (a[0] < b[0] ? -1 : 1) : a[1] - b[1]));
  const agedT = aged.map((x) => x[0]);
  const half = Math.ceil(max / 2);
  const takeNever = Math.min(never.length, Math.max(half, max - agedT.length));
  const takeAged = Math.min(agedT.length, max - takeNever);
  const batch = [...never.slice(0, takeNever), ...agedT.slice(0, takeAged)];
  return { batch, due: never.length + agedT.length, never: never.length, aged: agedT.length };
}

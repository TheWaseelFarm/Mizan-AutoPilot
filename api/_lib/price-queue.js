// Pure queue selection for api/refresh-prices.js (unit-tested in test/pricequeue.test.js).
//
// Problems this fixes (found on production, Oct 2026):
//  - never-fetched tickers always sorted first, so tickers that ALWAYS fail (paid-plan / invalid
//    symbols) stayed at the head forever and starved everything else;
//  - cached series were only reached after every never-fetched ticker had a row;
//  - every 30-minute run re-fetched whatever was oldest, even if refreshed an hour ago.
//
// Rules (credit budget: each ticker costs at most ONE provider call per day):
//  1. NEVER-FETCHED tickers (no row) are due immediately — a one-off cost per new ticker.
//  2. A ticker with cached prices is due only when its last touch (success or failed attempt) was on
//     an EARLIER UTC calendar day — so it is refreshed exactly once per day, never twice.
//  3. US markets are closed on weekends: on Saturday/Sunday (UTC) cached tickers are NOT refreshed
//     (no new close exists). Monday's pass fetches Friday's close.
//  4. A ticker that has NEVER succeeded (a row with no price, e.g. a paid-plan or invalid symbol)
//     retries only after `failedRetryMs` (7 days), so it can't burn a credit every day.
//  5. Fair share: each batch takes up to half from never-fetched tickers and half from the oldest
//     existing rows (filling from the other pool when one runs short), so neither starves.
export const FAILED_RETRY_MS = 7 * 24 * 3600 * 1000;

const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10); // 'YYYY-MM-DD' compares chronologically

export function pickBatch(tickers, seenAt, { now = Date.now(), max = 8, failedRetryMs = FAILED_RETRY_MS, failed = new Set(), skipWeekend = true } = {}) {
  const uniq = [...new Set((tickers || []).filter(Boolean))];
  const day = new Date(now).getUTCDay(), weekend = skipWeekend && (day === 0 || day === 6);
  const never = [], aged = [];
  for (const t of uniq) {
    if (!seenAt.has(t)) { never.push(t); continue; }
    if (weekend) continue;
    const ts = Date.parse(seenAt.get(t) || "");
    const due = !isFinite(ts) || (failed.has(t) ? now - ts >= failedRetryMs : utcDay(ts) < utcDay(now));
    if (due) aged.push([t, isFinite(ts) ? ts : -Infinity]);
  }
  never.sort(); // deterministic
  aged.sort((a, b) => (a[1] === b[1] ? (a[0] < b[0] ? -1 : 1) : a[1] - b[1]));
  const agedT = aged.map((x) => x[0]);
  const half = Math.ceil(max / 2);
  const takeNever = Math.min(never.length, Math.max(half, max - agedT.length));
  const takeAged = Math.min(agedT.length, max - takeNever);
  const batch = [...never.slice(0, takeNever), ...agedT.slice(0, takeAged)];
  return { batch, due: never.length + agedT.length, never: never.length, aged: agedT.length, weekend };
}

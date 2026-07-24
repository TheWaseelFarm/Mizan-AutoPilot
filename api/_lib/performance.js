// api/_lib/performance.js
// Dual-anchor performance (spec §3.4) — the "publish the weakness" trust feature.
//
// Pure module: NO I/O, NO deps. Shared by the serverless functions AND (mirrored) by the
// clients, so the two performance anchors are defined in exactly one place:
//
//   sinceDisclosed = from the filer's TRADE date  -> now  (their track record)
//   sincePublic    = from the FILING date         -> now  (what a user could actually act on)
//
// When a large share of the disclosed→now move happened DURING the filing lag (before it was
// public), we surface a freshness note. That gap is a core trust feature, not a footnote:
// performance is evidence delayed by filing lag, never a recommendation.

const DAY_MS = 86400000;

export function pctChange(from, to) {
  if (from == null || to == null || !isFinite(from) || !isFinite(to) || from === 0) return null;
  return ((to - from) / from) * 100;
}

// history: [{ d:'YYYY-MM-DD', c:Number }] ascending. Returns the first close ON or AFTER the
// target (the executable price a user would have gotten from that date), or null when the
// target is after the last cached day.
export function closeOnOrAfter(history, targetMs) {
  if (!Array.isArray(history) || !history.length || targetMs == null || Number.isNaN(targetMs)) return null;
  for (const p of history) {
    if (Date.parse(p.d) >= targetMs) return Number(p.c);
  }
  return null;
}

function parseMs(s) {
  const t = Date.parse(s || "");
  return Number.isNaN(t) ? null : t;
}

/**
 * Compute both anchors for one disclosure against a ticker's cached price.
 * @param price       { quote:Number, history:[{d,c}] } (the /api/prices cache shape)
 * @param disclosure  { transactionDate, filingDate }
 * @returns null when there's no usable price data; otherwise the dual-anchor object.
 */
export function dualAnchor(price, disclosure) {
  if (!price || price.quote == null || !Array.isArray(price.history) || !price.history.length) return null;
  const now = Number(price.quote);
  const tradeMs = parseMs(disclosure?.transactionDate);
  const fileMs = parseMs(disclosure?.filingDate);

  const disclosedClose = tradeMs == null ? null : closeOnOrAfter(price.history, tradeMs);
  const publicClose = fileMs == null ? null : closeOnOrAfter(price.history, fileMs);

  const sinceDisclosed = pctChange(disclosedClose, now);
  const sincePublic = pctChange(publicClose, now);
  // Move captured BEFORE it was public (same denominator as sinceDisclosed → shares are comparable).
  const disclosedToPublicPct = pctChange(disclosedClose, publicClose);
  const lagDays =
    tradeMs != null && fileMs != null ? Math.max(0, Math.round((fileMs - tradeMs) / DAY_MS)) : null;

  return {
    now,
    disclosedClose,
    publicClose,
    sinceDisclosed,
    sincePublic,
    disclosedToPublicPct,
    lagDays,
    freshness: freshnessNote(sinceDisclosed, disclosedToPublicPct),
  };
}

/**
 * A short note when a MATERIAL share of the disclosed→now move happened during the lag
 * (before the filing was public). Returns the note string, or null when not material.
 * `share` = disclosed→public move ÷ disclosed→now move (both anchored at the disclosed close).
 */
export function freshnessNote(sinceDisclosed, disclosedToPublicPct) {
  if (sinceDisclosed == null || disclosedToPublicPct == null) return null;
  if (Math.abs(sinceDisclosed) < 3) return null; // move too small to matter
  const share = disclosedToPublicPct / sinceDisclosed;
  if (!isFinite(share) || share <= 0) return null; // move reversed after it went public, or none pre-public
  if (share >= 0.6) return "Most of this move happened before it was public.";
  if (share >= 0.35) return "A large part of this move happened before it was public.";
  return null;
}

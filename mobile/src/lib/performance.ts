/**
 * Dual-anchor performance (spec §3.4) — client mirror of api/_lib/performance.js.
 * Kept identical to the backend module so the two anchors are defined the same way
 * everywhere:
 *   sinceDisclosed = from the filer's TRADE date  -> now (their track record)
 *   sincePublic    = from the FILING date         -> now (what a user could act on)
 * Honest by construction: no price / trade after the cached range returns null,
 * never a fabricated 0%.
 */

const DAY_MS = 86_400_000;

export interface PricePoint {
  d: string; // 'YYYY-MM-DD'
  c: number;
}
export interface Price {
  quote: number | null;
  history: PricePoint[];
  updatedAt?: string;
}
export type PricesMap = Record<string, Price>;

export interface DualAnchor {
  now: number;
  disclosedClose: number | null;
  publicClose: number | null;
  sinceDisclosed: number | null;
  sincePublic: number | null;
  disclosedToPublicPct: number | null;
  lagDays: number | null;
  freshness: string | null;
}

export function pctChange(from: number | null, to: number | null): number | null {
  if (from == null || to == null || !isFinite(from) || !isFinite(to) || from === 0) return null;
  return ((to - from) / from) * 100;
}

/** First close ON or AFTER the target (the executable price from that date), or null. */
export function closeOnOrAfter(history: PricePoint[], targetMs: number | null): number | null {
  if (!Array.isArray(history) || !history.length || targetMs == null || Number.isNaN(targetMs)) return null;
  for (const p of history) {
    if (Date.parse(p.d) >= targetMs) return Number(p.c);
  }
  return null;
}

function parseMs(s?: string): number | null {
  const t = Date.parse(s || '');
  return Number.isNaN(t) ? null : t;
}

export function dualAnchor(
  price: Price | undefined | null,
  disclosure: { transactionDate?: string; filingDate?: string },
): DualAnchor | null {
  if (!price || price.quote == null || !Array.isArray(price.history) || !price.history.length) return null;
  const now = Number(price.quote);
  const tradeMs = parseMs(disclosure?.transactionDate);
  const fileMs = parseMs(disclosure?.filingDate);

  const disclosedClose = tradeMs == null ? null : closeOnOrAfter(price.history, tradeMs);
  const publicClose = fileMs == null ? null : closeOnOrAfter(price.history, fileMs);

  const sinceDisclosed = pctChange(disclosedClose, now);
  const sincePublic = pctChange(publicClose, now);
  const disclosedToPublicPct = pctChange(disclosedClose, publicClose);
  const lagDays = tradeMs != null && fileMs != null ? Math.max(0, Math.round((fileMs - tradeMs) / DAY_MS)) : null;

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

export function freshnessNote(
  sinceDisclosed: number | null,
  disclosedToPublicPct: number | null,
): string | null {
  if (sinceDisclosed == null || disclosedToPublicPct == null) return null;
  if (Math.abs(sinceDisclosed) < 3) return null;
  const share = disclosedToPublicPct / sinceDisclosed;
  if (!isFinite(share) || share <= 0) return null;
  if (share >= 0.6) return 'Most of this move happened before it was public.';
  if (share >= 0.35) return 'A large part of this move happened before it was public.';
  return null;
}

/** Muted ▲/▼ compact percent (evidence styling — never a verdict color). */
export function fmtPctCompact(v: number | null): string | null {
  if (v == null || !isFinite(v)) return null;
  return (v >= 0 ? '▲' : '▼') + Math.abs(v).toFixed(1) + '%';
}

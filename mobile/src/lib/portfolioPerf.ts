/**
 * Portfolio-level performance (spec §4/§5): a weighted index built from the holdings' price
 * series × their composition weights, plus a weighted "since disclosed" figure. Uses real
 * cached prices when present, else the clearly-labelled illustrative series. Muted evidence —
 * never a recommendation.
 */
import type { Holding } from './derive';
import { resolvePrice } from './illustrative';
import { dualAnchor, type PricePoint, type PricesMap } from './performance';
import type { Disclosure } from './types';

export interface PortfolioPerf {
  history: PricePoint[];
  sinceDisclosed: number | null;
  illustrative: boolean;
}

export function portfolioIndex(
  composition: Holding[],
  rows: Disclosure[],
  prices: PricesMap,
): PortfolioPerf | null {
  // Only currently-held names (weight > 0) drive the weighted index; net-sold names carry 0
  // weight and would otherwise needlessly shrink the common price window.
  const held = composition.filter((h) => h.weightPct > 0);
  if (!held.length) return null;

  let illustrative = false;
  const parts: { w: number; closes: number[]; dates: string[]; since: number | null }[] = [];

  for (const h of held) {
    const { price, illustrative: ill } = resolvePrice(prices, { ticker: h.ticker });
    if (ill) illustrative = true;
    const disc = rows
      .filter((r) => r.ticker === h.ticker)
      .sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || ''))[0];
    const da = disc ? dualAnchor(price, disc) : null;
    parts.push({
      w: h.weightPct / 100,
      closes: price.history.map((p) => Number(p.c)),
      dates: price.history.map((p) => p.d),
      since: da?.sinceDisclosed ?? null,
    });
  }

  // Align on the shortest common window (from the most-recent end) and build a weighted index
  // normalized to 100 at the window start.
  const minLen = Math.min(...parts.map((p) => p.closes.length));
  if (!minLen || minLen < 2) return null;
  const refDates = parts[0].dates.slice(parts[0].dates.length - minLen);

  const history: PricePoint[] = [];
  for (let i = 0; i < minLen; i++) {
    let idx = 0;
    for (const p of parts) {
      const start = p.closes.length - minLen;
      const base = p.closes[start] || 1;
      idx += p.w * (p.closes[start + i] / base);
    }
    history.push({ d: refDates[i], c: +(idx * 100).toFixed(2) });
  }

  // Weighted since-disclosed across holdings that have a value.
  let wsum = 0;
  let acc = 0;
  for (let k = 0; k < parts.length; k++) {
    const since = parts[k].since;
    if (since != null) {
      acc += parts[k].w * since;
      wsum += parts[k].w;
    }
  }
  const sinceDisclosed = wsum > 0 ? +(acc / wsum).toFixed(2) : null;

  return { history, sinceDisclosed, illustrative };
}

import type { Label } from './frameworkB';
import type { Disclosure, Portfolio, Stock } from './types';

const isFund = (kind: string) => (kind || '').toLowerCase().includes('fund');

export function sourceGroup(kind: string): Portfolio['group'] {
  const s = (kind || '').toLowerCase();
  if (s.includes('insider')) return 'insider';
  if (s.includes('congress') || s.includes('official') || s.includes('senate') || s.includes('house'))
    return 'official';
  return 'fund';
}

/** One plain descriptor per actor, derived from kind / source (spec: explain every actor). */
export function actorDescriptor(d: Pick<Disclosure, 'kind' | 'source'>): string {
  const kind = (d.kind || '').toLowerCase();
  const src = (d.source || '').toLowerCase();
  if (src.includes('senate')) return 'a US senator';
  if (src.includes('house')) return 'a US representative';
  if (kind.includes('congress') || kind.includes('official')) return 'a US lawmaker';
  if (kind.includes('insider') || src.includes('form 4')) return 'a corporate insider';
  if (kind.includes('fund') || kind.includes('13f') || kind.includes('institution'))
    return 'an institutional investment fund';
  return 'a disclosed filer';
}

export function typeLabel(kind: string): string {
  const s = (kind || '').toLowerCase();
  if (s.includes('insider')) return 'Insider';
  if (s.includes('congress') || s.includes('official') || s.includes('senate') || s.includes('house'))
    return 'Official';
  return 'Fund';
}

/** Roll disclosures up into followable portfolios with a verdict mix (Tab 1). */
export function derivePortfolios(rows: Disclosure[]): Portfolio[] {
  const map = new Map<string, Portfolio>();
  for (const t of rows) {
    const key = t.actor || 'Unknown source';
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        kind: t.kind,
        initials: t.initials || '·',
        fund: isFund(t.kind),
        group: sourceGroup(t.kind),
        mix: { clean: 0, purify: 0, fail: 0, unscreened: 0 },
        count: 0,
        tickers: [],
        latest: null,
      });
    }
    const s = map.get(key)!;
    s.count++;
    s.mix[t.label] = (s.mix[t.label] ?? 0) + 1;
    if (!s.tickers.some((x) => x.ticker === t.ticker)) {
      s.tickers.push({ ticker: t.ticker, label: t.label });
    }
    const d = Date.parse(t.filingDate || t.transactionDate || '');
    if (!Number.isNaN(d) && (s.latest === null || d > s.latest)) s.latest = d;
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Portfolio-level Sharia flag — a roll-up of holdings (spec §2). */
export function portfolioFlag(p: Portfolio): { text: string; tone: Label } {
  const nonCompliant = p.mix.fail;
  const toPurify = p.mix.purify;
  if (nonCompliant > 0) return { text: 'Contains non-compliant names', tone: 'fail' };
  if (toPurify > 0) return { text: `Mostly compliant · ${toPurify} to purify`, tone: 'purify' };
  return { text: 'Fully compliant', tone: 'clean' };
}

/** Roll disclosures up per stock, split by side (Tab 2). */
export function deriveStocks(rows: Disclosure[]): Stock[] {
  const map = new Map<string, Stock>();
  const filersByTicker = new Map<string, Set<string>>();
  for (const t of rows) {
    if (!map.has(t.ticker)) {
      map.set(t.ticker, {
        ticker: t.ticker,
        company: t.company || t.ticker,
        label: t.label,
        buys: 0,
        sells: 0,
        buyWeight: 0,
        sellWeight: 0,
        filers: 0,
      });
      filersByTicker.set(t.ticker, new Set());
    }
    const s = map.get(t.ticker)!;
    const mid = Number(t.amountMid || 0);
    if (String(t.side).toUpperCase() === 'SELL') {
      s.sells++;
      s.sellWeight += mid;
    } else {
      s.buys++;
      s.buyWeight += mid;
    }
    filersByTicker.get(t.ticker)!.add(t.actor);
  }
  for (const [ticker, filers] of filersByTicker) map.get(ticker)!.filers = filers.size;
  return [...map.values()];
}

/** Days between two dates, floored at 0 (filing lag). */
export function daysBetween(a?: string, b?: string): number | null {
  const t1 = Date.parse(a || '');
  const t2 = Date.parse(b || '');
  if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
  return Math.max(0, Math.round((t2 - t1) / 86_400_000));
}

/** Plain judgment word for a filing lag (spec: judgment words with numbers). */
export function lagWord(days: number): 'fast' | 'typical' | 'slow' {
  return days <= 10 ? 'fast' : days <= 30 ? 'typical' : 'slow';
}

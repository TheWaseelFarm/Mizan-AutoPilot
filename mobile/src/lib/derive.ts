import type { Label } from './aaoifi';
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

/** One holding's share of a filer's portfolio (spec §4 / Appendix A `holdings.weight_pct`). */
export interface Holding {
  ticker: string;
  company: string;
  label: Label;
  /** net disclosed dollars in this name (buys − sells). */
  net: number;
  /** share of the disclosed portfolio, 0–100 (0 for net-sold names). */
  weightPct: number;
  /** true = a current disclosed position (net > 0); false = net-sold/exited in these filings. */
  held: boolean;
}

/** True when a filer reports POSITIONS (13F funds) rather than TRANSACTIONS (Congress/insider). */
export function reportsPositions(rows: Disclosure[]): boolean {
  return rows.length > 0 && sourceGroup(rows[0].kind) === 'fund';
}

/**
 * Portfolio composition — how much of a filer's disclosed portfolio each stock makes up, so a
 * user can see the allocation (informational, never a buy instruction).
 *
 * Two data shapes, weighted correctly for each:
 *   • 13F funds file a POSITION SNAPSHOT — each holding has a reported value, and a later
 *     filing SUPERSEDES an earlier one. So we take the LATEST reported value per ticker
 *     (`positionValue`, falling back to `amountMid`) — exact holding weights, never a sum of
 *     re-files. A latest filing that is a SELL means the position was exited.
 *   • Congress / insider PTRs file TRANSACTIONS, so we net buys − sells.
 *
 * Net-sold / exited names are kept at 0% with `held: false` (tagged "Sold" in the UI) so
 * nothing silently vanishes. `rows` = one actor.
 */
export function portfolioComposition(rows: Disclosure[]): Holding[] {
  if (reportsPositions(rows)) return positionComposition(rows);
  return transactionComposition(rows);
}

/** 13F: weight by the latest reported position value per ticker (exact, never summed). */
function positionComposition(rows: Disclosure[]): Holding[] {
  const latest = new Map<string, Disclosure>();
  for (const t of rows) {
    const cur = latest.get(t.ticker);
    const td = Date.parse(t.filingDate || t.transactionDate || '') || 0;
    const cd = cur ? Date.parse(cur.filingDate || cur.transactionDate || '') || 0 : -Infinity;
    if (!cur || td >= cd) latest.set(t.ticker, t);
  }
  const items = [...latest.values()]
    .map((t) => {
      const value = Math.max(0, Number(t.positionValue ?? t.amountMid ?? 0));
      const held = String(t.side).toUpperCase() !== 'SELL' && value > 0;
      return { ticker: t.ticker, company: t.company || t.ticker, label: t.label, value, held };
    })
    .filter((i) => i.value > 0);
  const total = items.reduce((s, i) => s + (i.held ? i.value : 0), 0) || 1;
  return items
    .map((i) => ({
      ticker: i.ticker,
      company: i.company,
      label: i.label,
      net: i.value,
      held: i.held,
      weightPct: i.held ? (i.value / total) * 100 : 0,
    }))
    .sort((a, b) => Number(b.held) - Number(a.held) || b.weightPct - a.weightPct || b.net - a.net);
}

/** PTR / insider: net buys − sells; net-sold names kept at 0% (held: false). */
function transactionComposition(rows: Disclosure[]): Holding[] {
  const map = new Map<string, { ticker: string; company: string; label: Label; net: number; gross: number }>();
  for (const t of rows) {
    const m =
      map.get(t.ticker) || { ticker: t.ticker, company: t.company || t.ticker, label: t.label, net: 0, gross: 0 };
    const amt = Number(t.amountMid || 0);
    m.net += (String(t.side).toUpperCase() === 'SELL' ? -1 : 1) * amt;
    m.gross += amt;
    m.label = t.label; // same per ticker; keep the latest
    map.set(t.ticker, m);
  }
  const items = [...map.values()].filter((i) => i.gross > 0);
  const totalPos = items.reduce((s, i) => s + Math.max(0, i.net), 0);
  const denom = totalPos > 0 ? totalPos : 1;
  return items
    .map((i) => ({
      ticker: i.ticker,
      company: i.company,
      label: i.label,
      net: i.net,
      held: i.net > 0,
      weightPct: i.net > 0 ? (i.net / denom) * 100 : 0,
    }))
    .sort((a, b) => Number(b.held) - Number(a.held) || b.weightPct - a.weightPct || b.net - a.net);
}

/** A smart-money ranked stock row (Tab 2). Mirrors api/_lib/trends.js. */
export interface SmartRow {
  ticker: string;
  company: string;
  label: Label;
  /**
   * Σ trade-value-as-%-of-filer-position across the filers whose position we can size.
   * `null` when NO contributing filer disclosed enough to gauge a position (never a
   * fabricated identical number — the UI shows "—").
   */
  netWeightPct: number | null;
  /** Σ disclosed midpoints — the primary $ volume rank metric. */
  dollarVol: number;
  filers: number;
}

/**
 * Client-side smart-money aggregation (fallback for /api/smart-money). Ranks stocks on a side
 * by disclosed **$ volume** (real and comparable across names). It also computes a secondary
 * "% of position" weight — but ONLY from filers whose position we can actually gauge (they
 * disclosed ≥2 holdings). A single-holding filer's trade is always 100% of what we can see,
 * which is a fabricated-looking figure, so those are excluded from the weight; a stock with no
 * gaugeable filer gets `netWeightPct: null` → "—" in the UI. `rows` is the already-gated feed.
 */
export function deriveSmartMoney(
  rows: Disclosure[],
  side: 'BUY' | 'SELL',
  withinDays = Infinity,
  nowMs = Date.now(),
): SmartRow[] {
  const filerTotal = new Map<string, number>();
  const filerTickers = new Map<string, Set<string>>();
  for (const r of rows) {
    filerTotal.set(r.actor, (filerTotal.get(r.actor) || 0) + Math.abs(Number(r.amountMid || 0)));
    (filerTickers.get(r.actor) || filerTickers.set(r.actor, new Set()).get(r.actor)!).add(r.ticker);
  }

  const map = new Map<
    string,
    { ticker: string; company: string; label: Label; weight: number; hasWeight: boolean; dollar: number; filers: Set<string> }
  >();
  for (const r of rows) {
    if ((String(r.side).toUpperCase() === 'SELL' ? 'SELL' : 'BUY') !== side) continue;
    if (withinDays !== Infinity) {
      const f = Date.parse(r.filingDate || '');
      if (Number.isNaN(f) || nowMs - f > withinDays * 86_400_000) continue;
    }
    const amt = Math.abs(Number(r.amountMid || 0));
    const m =
      map.get(r.ticker) ||
      { ticker: r.ticker, company: r.company || r.ticker, label: r.label, weight: 0, hasWeight: false, dollar: 0, filers: new Set<string>() };
    m.dollar += amt;
    m.filers.add(r.actor);
    m.label = r.label;
    // Weight only from filers whose position we can size (≥2 disclosed holdings) — the guard.
    const total = filerTotal.get(r.actor) || 0;
    if ((filerTickers.get(r.actor)?.size || 1) >= 2 && total > 0) {
      m.weight += amt / total;
      m.hasWeight = true;
    }
    map.set(r.ticker, m);
  }
  return [...map.values()]
    .map((m) => ({
      ticker: m.ticker,
      company: m.company,
      label: m.label,
      netWeightPct: m.hasWeight ? +(m.weight * 100).toFixed(1) : null,
      dollarVol: m.dollar,
      filers: m.filers.size,
    }))
    // Default ranking = disclosed $ volume (real + logical: a $22M name outranks a $41K one).
    .sort((a, b) => b.dollarVol - a.dollarVol);
}

/** Compact $ money label (e.g. $1.2M, $340K). */
export function fmtMoney(v: number): string {
  const n = Math.abs(v);
  if (n >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
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

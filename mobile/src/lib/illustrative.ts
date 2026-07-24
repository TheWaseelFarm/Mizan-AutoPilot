/**
 * Illustrative (synthetic) price series — a clearly-labeled DESIGN PLACEHOLDER, not real
 * market data. Used only until the live FMP price cache is populated, so the performance
 * chart has something to draw. Every surface that shows it labels it "Illustrative", and
 * real cached prices always take precedence (see resolvePrice). This never claims to be a
 * real price — the honesty guardrail ("no price → Price pending") still governs live data.
 */
import type { Price, PricePoint, PricesMap } from './performance';

// Deterministic PRNG seeded from the ticker, so a name's illustrative series is stable
// across renders (no flicker) and reproducible.
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** A deterministic, weekday-only random-walk series for `ticker`, ending today. */
export function illustrativePrice(ticker: string, days = 170): Price {
  const rnd = mulberry32(hashStr(ticker || 'X'));
  const base = 40 + Math.floor(rnd() * 260); // $40–$300 anchor
  const drift = (rnd() - 0.45) * 0.0035; // slight up/down bias
  const vol = 0.008 + rnd() * 0.018;
  const history: PricePoint[] = [];
  let price = base;
  const today = Date.now();
  for (let i = days; i >= 0; i--) {
    const d = new Date(today - i * 86_400_000);
    const day = d.getUTCDay();
    if (day === 0 || day === 6) continue; // weekdays only, like a real market
    price = Math.max(1, price * (1 + drift + (rnd() - 0.5) * vol));
    history.push({ d: ymd(d), c: +price.toFixed(2) });
  }
  return { quote: history[history.length - 1].c, history, illustrative: true };
}

/**
 * Resolve the price to chart for a disclosure: the REAL cached price when present, otherwise
 * a clearly-labeled illustrative series. Returns whether the result is illustrative so the UI
 * can caption it honestly.
 */
export function resolvePrice(
  prices: PricesMap,
  d: { ticker: string },
): { price: Price; illustrative: boolean } {
  const real = prices?.[d.ticker];
  if (real && real.quote != null && Array.isArray(real.history) && real.history.length) {
    return { price: real, illustrative: false };
  }
  return { price: illustrativePrice(d.ticker), illustrative: true };
}

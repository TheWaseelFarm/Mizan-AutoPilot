import type { Label } from './frameworkB';

/** A disclosure record as returned by GET /api/feed (see api/feed.js `toClient`). */
export interface Disclosure {
  id: number | string;
  actor: string;
  kind: string;
  initials?: string;
  source?: string;
  side: string; // "BUY" | "SELL"
  ticker: string;
  company?: string;
  sector?: string;
  amount?: string;
  amountMid?: number;
  transactionDate?: string;
  filingDate?: string;
  purchasePrice?: number;
  fallbackPrice?: number;
  business?: string;
  businessStatus?: string;
  impurePct?: number;
  debtRatio?: number;
  reasoning?: string;
  screened?: boolean;
  /** Verdict label, filled by labelOf() on the client if the API didn't. */
  label: Label;
}

/** A filer's portfolio, rolled up from their disclosures (Tab 1). */
export interface Portfolio {
  name: string;
  kind: string;
  initials: string;
  fund: boolean;
  group: 'fund' | 'official' | 'insider';
  mix: { clean: number; purify: number; fail: number; unscreened: number };
  count: number;
  tickers: { ticker: string; label: Label }[];
  latest: number | null;
}

/** A stock rolled up across filers (Tab 2). */
export interface Stock {
  ticker: string;
  company: string;
  label: Label;
  buys: number;
  sells: number;
  /** Sum of disclosed midpoints, a stand-in for weight until position sizes land. */
  buyWeight: number;
  sellWeight: number;
  filers: number;
}

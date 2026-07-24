import Constants from 'expo-constants';

import { labelOf } from './frameworkB';
import type { PricesMap } from './performance';
import { SAMPLE } from './sample';
import type { Disclosure } from './types';

/**
 * Base URL for the reused Vercel serverless backend (`/api/*`).
 * Order: EXPO_PUBLIC_API_BASE env → app.json `extra.apiBase` → production default.
 */
const API_BASE: string =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ||
  'https://mizan-auto-pilot.vercel.app';

/** Ensure every row carries a verdict label, computed by the engine if absent. */
function withLabel(rows: Omit<Disclosure, 'label'>[]): Disclosure[] {
  return rows.map((r) => ({ ...r, label: labelOf(r) }) as Disclosure);
}

/**
 * Fetch the disclosure feed. Falls back to bundled SAMPLE data when the API is
 * unreachable, so the app is never blank. Never fabricates verdicts — labelOf()
 * is the single source of truth, matching the backend.
 */
export async function fetchFeed(signal?: AbortSignal): Promise<{ rows: Disclosure[]; live: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/feed`, {
      headers: { accept: 'application/json' },
      signal,
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : data?.disclosures ?? [];
    if (!rows.length) return { rows: withLabel(SAMPLE), live: false };
    // Re-derive the label client-side even if the API sent one — keeps a single rule.
    return { rows: withLabel(rows), live: true };
  } catch {
    return { rows: withLabel(SAMPLE), live: false };
  }
}

/**
 * Fetch the cached price map: { TICKER: { quote, history:[{d,c}], updatedAt } }.
 * This endpoint returns ONLY cached data (never fabricates); an empty object means
 * "Price pending" everywhere, which the UI renders honestly. Failures degrade to {}.
 */
export async function fetchPrices(signal?: AbortSignal): Promise<PricesMap> {
  try {
    const res = await fetch(`${API_BASE}/api/prices`, {
      headers: { accept: 'application/json' },
      signal,
    });
    if (!res.ok) throw new Error(`prices ${res.status}`);
    const data = await res.json();
    return data && typeof data === 'object' ? (data as PricesMap) : {};
  } catch {
    return {};
  }
}

export { API_BASE };

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchFeed, fetchFollowerCounts, fetchPrices } from '../lib/api';
import type { FollowerCounts } from '../lib/followers';
import { isScreened } from '../lib/frameworkB';
import type { PricesMap } from '../lib/performance';
import type { Disclosure } from '../lib/types';

interface FeedState {
  rows: Disclosure[];
  /** Cached price map (ticker -> { quote, history }). Empty means "Price pending". */
  prices: PricesMap;
  /** Public follower counts (portfolio -> count). Empty until a real following exists. */
  followerCounts: FollowerCounts;
  loading: boolean;
  /** true when data came from the live API, false when the bundled sample fallback was used. */
  live: boolean;
  refresh: () => void;
}

const Ctx = createContext<FeedState | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = useState<Disclosure[]>([]);
  const [prices, setPrices] = useState<PricesMap>({});
  const [followerCounts, setFollowerCounts] = useState<FollowerCounts>({});
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    setLoading(true);
    // Feed, prices and follower counts load in parallel; prices and counts are best-effort
    // (empty -> "Price pending" / Most-followed hidden).
    Promise.all([
      fetchFeed(ctrl.signal),
      fetchPrices(ctrl.signal),
      fetchFollowerCounts(ctrl.signal),
    ]).then(([feed, priceMap, counts]) => {
      if (!alive) return;
      // Completeness gate (decision #2): unscreened items never reach any list/search.
      setRows(feed.rows.filter(isScreened));
      setLive(feed.live);
      setPrices(priceMap);
      setFollowerCounts(counts);
      setLoading(false);
    });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [nonce]);

  const value = useMemo(
    () => ({ rows, prices, followerCounts, loading, live, refresh }),
    [rows, prices, followerCounts, loading, live, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFeed(): FeedState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFeed must be used within FeedProvider');
  return c;
}

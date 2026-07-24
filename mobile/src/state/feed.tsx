import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchFeed } from '../lib/api';
import type { Disclosure } from '../lib/types';

interface FeedState {
  rows: Disclosure[];
  loading: boolean;
  /** true when data came from the live API, false when the bundled sample fallback was used. */
  live: boolean;
  refresh: () => void;
}

const Ctx = createContext<FeedState | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    setLoading(true);
    fetchFeed(ctrl.signal).then(({ rows: r, live: l }) => {
      if (!alive) return;
      setRows(r);
      setLive(l);
      setLoading(false);
    });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [nonce]);

  const value = useMemo(() => ({ rows, loading, live, refresh }), [rows, loading, live, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFeed(): FeedState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFeed must be used within FeedProvider');
  return c;
}

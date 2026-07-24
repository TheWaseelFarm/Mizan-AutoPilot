import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * In-memory follow state for the scaffold. In v1 this backs onto the `follows`
 * table via /api/watchlist (user ↔ portfolio) with RLS; here it lives for the
 * session so the Following tab and Follow buttons work end-to-end.
 */
interface FollowsCtx {
  isFollowed: (name: string) => boolean;
  toggle: (name: string) => void;
  followed: string[];
}

const Ctx = createContext<FollowsCtx | null>(null);

export function FollowsProvider({ children }: { children: React.ReactNode }) {
  const [set, setSet] = useState<Record<string, boolean>>({});

  const isFollowed = useCallback((name: string) => !!set[name], [set]);
  const toggle = useCallback(
    (name: string) => setSet((prev) => ({ ...prev, [name]: !prev[name] })),
    [],
  );
  const followed = useMemo(() => Object.keys(set).filter((k) => set[k]), [set]);

  const value = useMemo(() => ({ isFollowed, toggle, followed }), [isFollowed, toggle, followed]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFollows(): FollowsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFollows must be used within FollowsProvider');
  return c;
}

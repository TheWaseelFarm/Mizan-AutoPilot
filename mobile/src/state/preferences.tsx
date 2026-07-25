import React, { createContext, useContext, useMemo, useState } from 'react';

import type { ComplianceKey } from '../components/ComplianceFilter';

/**
 * App-wide preferences. Today this holds the user's verdict tolerance (the default compliance
 * filter), so it's ONE setting — editable from Profile or from any list's filter — instead of a
 * per-screen duplicate. Session-only for now; in v1 it persists to a per-user `preferences`
 * record (RLS, spec §7).
 */
interface PreferencesCtx {
  compliance: ComplianceKey;
  setCompliance: (k: ComplianceKey) => void;
}

const Ctx = createContext<PreferencesCtx | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [compliance, setCompliance] = useState<ComplianceKey>('all');
  const value = useMemo(() => ({ compliance, setCompliance }), [compliance]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePreferences(): PreferencesCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePreferences must be used within PreferencesProvider');
  return c;
}

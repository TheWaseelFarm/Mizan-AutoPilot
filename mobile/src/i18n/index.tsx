import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';

import { ar, en, type Lang, type StringKey } from './strings';

/**
 * i18n + direction context. Switches the UI chrome between English and Arabic and drives
 * layout direction (LTR / RTL). Disclosed data (tickers, company names, amounts) is never
 * translated and stays LTR (handoff §9).
 *
 * On web we set the document `dir`/`lang` so text alignment, inputs and logical properties
 * flip; on native we flag I18nManager. Language is session-only for now (persists per-user in v1).
 */
interface I18nCtx {
  lang: Lang;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function applyDirection(lang: Lang) {
  const rtl = lang === 'ar';
  try {
    I18nManager.allowRTL(rtl);
    // Note: on native this needs a reload to fully mirror flexbox; on web it is applied live.
    I18nManager.forceRTL(rtl);
  } catch {
    /* no-op */
  }
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  const setLang = useCallback((l: Lang) => {
    applyDirection(l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => {
      const dict = lang === 'ar' ? ar : en;
      let s: string = (dict[key] as string | undefined) ?? en[key] ?? String(key);
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [lang],
  );

  const value = useMemo<I18nCtx>(
    () => ({ lang, isRTL: lang === 'ar', dir: lang === 'ar' ? 'rtl' : 'ltr', setLang, t }),
    [lang, setLang, t],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n must be used within I18nProvider');
  return c;
}

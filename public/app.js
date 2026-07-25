/* Mizān web terminal — vanilla JS front-end rendering the design-handoff CSS (styles/*.css).
 * Fetches the same /api/feed backend the native app uses; falls back to embedded sample data.
 * Desktop: utility rail + top bar + data tables + side drawers. Mobile: cards + bottom nav.
 * The Sharia verdict is computed here by the same AAOIFI logic as api/_lib/aaoifi.js. */
(() => {
  'use strict';

  /* ---------------------------------------------------------------- icons (SVG) */
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.6" y2="16.6"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
    sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M6 12h12M9 17h6"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z"/></svg>',
    starOn: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M15 11h.01M11 21v-3h2v3"/></svg>',
    landmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 10h16M12 3l8 5H4zM6 10v8M10 10v8M14 10v8M18 10v8"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    portfolios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16"/></svg>',
    stocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l5-5 3 3 7-8M14 8h4v4"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="7" height="14" rx="1.5"/><rect x="14" y="5" width="7" height="14" rx="1.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg>',
  };

  /* ---------------------------------------------------------------- i18n */
  const STR = {
    en: {
      'tab.portfolios': 'Portfolios', 'tab.stocks': 'Stocks', 'tab.following': 'Following', 'tab.alerts': 'Alerts', 'tab.account': 'Account',
      'p.title': 'Portfolio intelligence', 'p.sub': 'Compare disclosed portfolios through performance, activity and Sharia exposure.',
      's.title': 'Stock intelligence', 's.sub': 'Explore disclosed activity with evidence and Sharia context.',
      'sv.top': 'Top performers', 'sv.active': 'Most active', 'sv.followed': 'Most followed', 'sv.alloc': 'Highest compliant allocation',
      'sv.bought': 'Most bought', 'sv.sold': 'Most sold', 'sv.new': 'New positions', 'sv.incr': 'Increased', 'sv.red': 'Reduced', 'sv.exit': 'Exited',
      'c.filter': 'Filter', 'c.sort': 'Sort', 'c.compare': 'Compare', 'c.why': 'Why this ranking?', 'c.clear': 'Clear all', 'c.search': 'Search portfolios, investors or stocks',
      'so.return': 'Disclosed return', 'so.activity': 'Disclosed activity', 'so.followers': 'Followers', 'so.alloc': 'Compliant allocation',
      'so.value': 'Disclosed value', 'so.weight': 'Position weight', 'so.filers': 'Number of filers',
      'v.compliant': 'Compliant', 'v.purify': 'Compliant · purify', 'v.noncompliant': 'Non-compliant', 'v.review': 'Under review',
      'h.rank': 'Rank', 'h.portfolio': 'Portfolio / filer', 'h.type': 'Type', 'h.return': 'Disclosed return', 'h.activity': 'Activity',
      'h.freshness': 'Evidence freshness', 'h.allocation': 'Sharia allocation', 'h.purify': 'Purification', 'h.followers': 'Followers',
      'h.stock': 'Stock & company', 'h.signal': 'Signal / activity', 'h.evidence': 'Evidence', 'h.filers': 'Filers', 'h.value': 'Disclosed value', 'h.since': 'Since disclosed', 'h.status': 'Sharia status',
      'ev.high': 'High', 'ev.medium': 'Medium', 'ev.low': 'Low',
      'cmp.title': 'Compare portfolios', 'cmp.return': 'Disclosed return', 'cmp.disclosures': 'Disclosures', 'cmp.alloc': 'Compliant allocation', 'cmp.purify': 'Purification exposure', 'cmp.followers': 'Followers', 'cmp.open': 'Open comparison', 'cmp.tray': 'Compare {n} portfolios', 'cmp.pick': 'Select one more to compare', 'cmp.note': 'All metrics use the latest disclosed filings. Not investment advice.',
      'ev.title': '{t} evidence', 'ev.why': 'Why {s} evidence?', 'ev.review': 'Review full evidence', 'ev.recent': 'Recent filer activity', 'ev.setalert': 'Set alert',
      'g.portfolios': 'Rankings reflect disclosed data and calculated metrics for the selected period. Performance is never colored like a Sharia verdict; this is not advice to buy or sell.',
      'g.disclaimer': 'Screening based on AAOIFI Standard No. 21. Informational only — past disclosed-holdings evidence, delayed by up to 45 days. Not investment advice, brokerage, or a fatwa.',
      'meta.count': '{n} shown', 'live': 'Live data', 'sample': 'Sample data', 'freshUpdated': 'Updated',
      'empty.title': 'Nothing matches these filters', 'empty.body': 'Try clearing a filter or widening the time period.',
      'acct.title': 'Account', 'acct.lang': 'Language', 'follow.title': 'Following', 'alerts.title': 'Alerts',
      'sec.methodology': 'Methodology', 'sec.mtext': 'Two screens, both required: permissible business activity, and financial ratios vs. market cap — interest-bearing debt < 30%, cash + interest securities < 30%, and impure income < 5%. Over any limit is Non-compliant. Some impure income (0–5%) is Compliant · purify.',
    },
    ar: {
      'tab.portfolios': 'المحافظ', 'tab.stocks': 'الأسهم', 'tab.following': 'المتابَعون', 'tab.alerts': 'التنبيهات', 'tab.account': 'الحساب',
      'p.title': 'ذكاء المحافظ', 'p.sub': 'قارن المحافظ المُفصَح عنها من حيث الأداء والنشاط والالتزام الشرعي.',
      's.title': 'ذكاء الأسهم', 's.sub': 'استكشف النشاط المُفصَح عنه مع الأدلة والسياق الشرعي.',
      'sv.top': 'الأفضل أداءً', 'sv.active': 'الأكثر نشاطًا', 'sv.followed': 'الأكثر متابعة', 'sv.alloc': 'أعلى تخصيص متوافق',
      'sv.bought': 'الأكثر شراءً', 'sv.sold': 'الأكثر بيعًا', 'sv.new': 'مراكز جديدة', 'sv.incr': 'زيادة', 'sv.red': 'تخفيض', 'sv.exit': 'خروج',
      'c.filter': 'تصفية', 'c.sort': 'ترتيب', 'c.compare': 'مقارنة', 'c.why': 'لماذا هذا الترتيب؟', 'c.clear': 'مسح الكل', 'c.search': 'ابحث عن محفظة أو مستثمر أو سهم',
      'so.return': 'العائد المُفصَح', 'so.activity': 'النشاط المُفصَح', 'so.followers': 'المتابِعون', 'so.alloc': 'التخصيص المتوافق',
      'so.value': 'القيمة المُفصَح عنها', 'so.weight': 'وزن المركز', 'so.filers': 'عدد المُفصِحين',
      'v.compliant': 'متوافق', 'v.purify': 'متوافق · تطهير', 'v.noncompliant': 'غير متوافق', 'v.review': 'قيد المراجعة',
      'h.rank': 'الترتيب', 'h.portfolio': 'المحفظة / المُفصِح', 'h.type': 'النوع', 'h.return': 'العائد المُفصَح', 'h.activity': 'النشاط',
      'h.freshness': 'حداثة الأدلة', 'h.allocation': 'التخصيص الشرعي', 'h.purify': 'التطهير', 'h.followers': 'المتابِعون',
      'h.stock': 'السهم والشركة', 'h.signal': 'الإشارة / النشاط', 'h.evidence': 'الأدلة', 'h.filers': 'المُفصِحون', 'h.value': 'القيمة المُفصَح عنها', 'h.since': 'منذ الإفصاح', 'h.status': 'الحالة الشرعية',
      'ev.high': 'قوي', 'ev.medium': 'متوسط', 'ev.low': 'ضعيف',
      'cmp.title': 'مقارنة المحافظ', 'cmp.return': 'العائد المُفصَح', 'cmp.disclosures': 'الإفصاحات', 'cmp.alloc': 'التخصيص المتوافق', 'cmp.purify': 'نسبة التطهير', 'cmp.followers': 'المتابِعون', 'cmp.open': 'فتح المقارنة', 'cmp.tray': 'قارن {n} محافظ', 'cmp.pick': 'اختر واحدة أخرى للمقارنة', 'cmp.note': 'تستخدم كل المقاييس أحدث الإفصاحات. ليست نصيحة استثمارية.',
      'ev.title': 'أدلة {t}', 'ev.why': 'لماذا الأدلة {s}؟', 'ev.review': 'مراجعة كل الأدلة', 'ev.recent': 'أحدث نشاط للمُفصِحين', 'ev.setalert': 'ضبط تنبيه',
      'g.portfolios': 'تعكس التصنيفات بيانات مُفصَحًا عنها ومقاييس محسوبة للفترة المحددة. لا يُلوَّن الأداء كحكم شرعي، وهذا ليس نصيحة بالشراء أو البيع.',
      'g.disclaimer': 'الفحص وفق معيار AAOIFI رقم 21. لأغراض معلوماتية فقط — أدلة إفصاح سابقة قد تتأخر حتى 45 يومًا. ليست نصيحة استثمارية أو وساطة أو فتوى.',
      'meta.count': '{n} معروض', 'live': 'بيانات حية', 'sample': 'بيانات تجريبية', 'freshUpdated': 'حُدِّث',
      'empty.title': 'لا شيء يطابق هذه المرشحات', 'empty.body': 'جرّب مسح مرشح أو توسيع الفترة الزمنية.',
      'acct.title': 'الحساب', 'acct.lang': 'اللغة', 'follow.title': 'المتابَعون', 'alerts.title': 'التنبيهات',
      'sec.methodology': 'المنهجية', 'sec.mtext': 'فحصان، كلاهما مطلوب: نشاط تجاري مباح، ونسب مالية إلى القيمة السوقية — الدين بفائدة < 30%، النقد والأوراق ذات الفائدة < 30%، والدخل غير النقي < 5%. تجاوز أي حد = غير متوافق. دخل غير نقي يسير (0–5%) = متوافق · تطهير.',
    },
  };
  let LANG = 'en';
  const t = (k, vars) => { let s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k; if (vars) for (const n in vars) s = s.replace('{' + n + '}', vars[n]); return s; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------------------------------------------------------- AAOIFI verdict (mirrors api/_lib/aaoifi.js) */
  function classify(rec) {
    const impure = +(rec.impurePct ?? 0), debt = +(rec.debtPct ?? rec.debtRatio ?? 0), cash = +(rec.cashPct ?? 0);
    const biz = rec.businessStatus ?? 'pass';
    if (biz === 'fail' || impure > 5 || debt > 30 || cash > 30) return 'fail';
    return impure === 0 ? 'clean' : 'purify';
  }
  const VER = {
    clean: { cls: 'compliant', k: 'v.compliant' }, purify: { cls: 'purify', k: 'v.purify' },
    fail: { cls: 'noncompliant', k: 'v.noncompliant' }, unscreened: { cls: 'review', k: 'v.review' },
  };
  const labelOf = (r) => (r.screened === false ? 'unscreened' : classify(r));
  const badge = (label) => `<span class="mz-badge mz-badge--${VER[label].cls}"><span class="mz-dot" style="width:.45rem;height:.45rem;background:currentColor"></span>${t(VER[label].k)}</span>`;

  /* ---------------------------------------------------------------- sample fallback */
  const SAMPLE = [
    { id: 1, actor: 'Renaissance Technologies', kind: '13F Fund', initials: 'RT', source: '13F-HR', side: 'BUY', ticker: 'NVDA', company: 'NVIDIA Corp.', amountMid: 32500, transactionDate: 'Jun 17, 2026', filingDate: 'Jun 25, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 3.2, screened: true },
    { id: 2, actor: 'Public Official Filing', kind: 'Congress', initials: 'PO', source: 'House PTR', side: 'BUY', ticker: 'AVGO', company: 'Broadcom Inc.', amountMid: 75000, transactionDate: 'Jun 15, 2026', filingDate: 'Jun 24, 2026', businessStatus: 'watch', impurePct: 1.4, debtRatio: 19, screened: true },
    { id: 3, actor: 'Global Value Fund', kind: '13F Fund', initials: 'GV', source: '13F-HR', side: 'SELL', ticker: 'JPM', company: 'JPMorgan Chase & Co.', amountMid: 75000, transactionDate: 'Jun 11, 2026', filingDate: 'Jun 23, 2026', businessStatus: 'fail', impurePct: 71, debtRatio: 0, screened: true },
    { id: 4, actor: 'Public Official Filing', kind: 'Congress', initials: 'PO', source: 'House PTR', side: 'SELL', ticker: 'XOM', company: 'Exxon Mobil Corp.', amountMid: 32500, transactionDate: 'Jun 02, 2026', filingDate: 'Jun 17, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 52, screened: true },
    { id: 5, actor: 'Northstar Quant Partners', kind: '13F Fund', initials: 'NQ', source: '13F-HR', side: 'BUY', ticker: 'MSFT', company: 'Microsoft Corp.', amountMid: 175000, positionValue: 175000, transactionDate: 'Jun 10, 2026', filingDate: 'Jun 20, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 11, screened: true },
    { id: 6, actor: 'Corporate Insider Filing', kind: 'Insider', initials: 'IN', source: 'Form 4', side: 'SELL', ticker: 'TSLA', company: 'Tesla, Inc.', amountMid: 375000, transactionDate: 'Jun 09, 2026', filingDate: 'Jun 12, 2026', businessStatus: 'pass', impurePct: 2.1, debtRatio: 8, screened: true },
    { id: 7, actor: 'Northstar Quant Partners', kind: '13F Fund', initials: 'NQ', source: '13F-HR', side: 'BUY', ticker: 'NVDA', company: 'NVIDIA Corp.', amountMid: 75000, positionValue: 75000, transactionDate: 'Jun 08, 2026', filingDate: 'Jun 19, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 3.2, screened: true },
    { id: 8, actor: 'Renaissance Technologies', kind: '13F Fund', initials: 'RT', source: '13F-HR', side: 'BUY', ticker: 'GOOGL', company: 'Alphabet Inc.', amountMid: 128000, positionValue: 128000, transactionDate: 'May 30, 2026', filingDate: 'Jun 22, 2026', businessStatus: 'watch', impurePct: 1.7, debtRatio: 3, screened: true },
    { id: 9, actor: 'Global Value Fund', kind: '13F Fund', initials: 'GV', source: '13F-HR', side: 'BUY', ticker: 'COST', company: 'Costco Wholesale', amountMid: 64000, positionValue: 64000, transactionDate: 'Jun 05, 2026', filingDate: 'Jun 21, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 9, screened: true },
  ].map((r) => ({ ...r, label: labelOf(r) }));

  /* ---------------------------------------------------------------- derivation */
  const groupOf = (kind) => { const s = (kind || '').toLowerCase(); return s.includes('insider') ? 'insider' : (s.includes('congress') || s.includes('official') || s.includes('senate') || s.includes('house')) ? 'official' : 'fund'; };
  const typeLabel = (kind) => ({ insider: 'Insider', official: 'Official', fund: 'Fund' }[groupOf(kind)]);
  const groupIcon = (g) => ({ fund: I.building, official: I.landmark, insider: I.briefcase }[g] || I.building);
  const fmtMoney = (v) => { const n = Math.abs(v); return n >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v); };
  const daysSince = (d) => { const x = Date.parse(d || ''); return isFinite(x) ? Math.max(0, Math.round((Date.now() - x) / 864e5)) : null; };
  const daysBetween = (a, b) => { const t1 = Date.parse(a || ''), t2 = Date.parse(b || ''); return (isFinite(t1) && isFinite(t2)) ? Math.max(0, Math.round((t2 - t1) / 864e5)) : null; };
  const fmtPct = (v) => v == null || !isFinite(v) ? null : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%';

  function derivePortfolios(rows) {
    const m = new Map();
    for (const r of rows) {
      const key = r.actor || 'Unknown';
      let p = m.get(key);
      if (!p) { p = { name: key, kind: r.kind, initials: r.initials || key.slice(0, 2).toUpperCase(), group: groupOf(r.kind), mix: { clean: 0, purify: 0, fail: 0, unscreened: 0 }, count: 0, rows: [], fresh: null }; m.set(key, p); }
      p.count++; p.mix[r.label] = (p.mix[r.label] || 0) + 1; p.rows.push(r);
      const ds = daysSince(r.filingDate); if (ds != null && (p.fresh == null || ds < p.fresh)) p.fresh = ds;
    }
    for (const p of m.values()) {
      const total = p.mix.clean + p.mix.purify + p.mix.fail + p.mix.unscreened || 1;
      p.cleanPct = p.mix.clean / total;
      // Purification exposure = mean impure-income % across OWNABLE names (compliant / purify).
      // Non-compliant names are excluded — you don't own them, so they carry no purification.
      const own = p.rows.filter((r) => r.label !== 'fail' && r.label !== 'unscreened');
      p.purifyPct = own.length ? +(own.reduce((a, r) => a + (+r.impurePct || 0), 0) / own.length).toFixed(1) : 0;
      const perfs = p.rows.map((r) => r.performance && r.performance.sinceDisclosed).filter((x) => x != null && isFinite(x));
      p.perf = perfs.length ? +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(1) : null;
    }
    return [...m.values()];
  }
  const portfolioFlag = (p) => p.mix.fail > 0 ? { text: 'Contains non-compliant names', tone: 'fail' } : p.mix.purify > 0 ? { text: `Mostly compliant · ${p.mix.purify} to purify`, tone: 'purify' } : { text: 'Fully compliant', tone: 'clean' };

  function deriveStocks(rows, side) {
    const m = new Map();
    for (const r of rows) {
      if ((String(r.side).toUpperCase() === 'SELL' ? 'SELL' : 'BUY') !== side) continue;
      let s = m.get(r.ticker);
      if (!s) { s = { ticker: r.ticker, company: r.company || r.ticker, label: r.label, dollar: 0, filers: new Set(), rows: [], fresh: null }; m.set(r.ticker, s); }
      s.dollar += Math.abs(+r.amountMid || 0); s.filers.add(r.actor); s.rows.push(r); s.label = r.label;
      const ds = daysSince(r.filingDate); if (ds != null && (s.fresh == null || ds < s.fresh)) s.fresh = ds;
    }
    return [...m.values()].map((s) => {
      const perfs = s.rows.map((r) => r.performance && r.performance.sinceDisclosed).filter((x) => x != null && isFinite(x));
      return { ...s, filerCount: s.filers.size, perf: perfs.length ? +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(1) : null };
    });
  }
  const evStrength = (n) => n >= 8 ? 'high' : n >= 3 ? 'medium' : 'low';

  /* ---------------------------------------------------------------- state */
  const S = {
    tab: 'portfolios', pMetric: 'top', sMetric: 'bought', tf: 'ALL', query: '',
    compliance: 'all', evFilter: 'all', followedOnly: false, compareMode: false,
    selected: [], follows: new Set(), drawer: null, // {type:'compare'|'evidence'|'detail', ...}
    openMenu: null, rows: SAMPLE, live: false, prices: {},
  };
  const P_SUB = [['top', 'sv.top'], ['active', 'sv.active'], ['followed', 'sv.followed'], ['alloc', 'sv.alloc']];
  const S_SUB = [['bought', 'sv.bought', 'BUY', 'value'], ['sold', 'sv.sold', 'SELL', 'value'], ['new', 'sv.new', 'BUY', 'filers'], ['incr', 'sv.incr', 'BUY', 'weight'], ['red', 'sv.red', 'SELL', 'weight'], ['exit', 'sv.exit', 'SELL', 'filers']];
  const P_SORT = { top: 'so.return', active: 'so.activity', followed: 'so.followers', alloc: 'so.alloc' };
  const S_SORT = { value: 'so.value', weight: 'so.weight', filers: 'so.filers' };
  const TFS = [['1M', '1M'], ['3M', '3M'], ['6M', '6M'], ['1Y', '1Y'], ['3Y', '3Y'], ['5Y', '5Y'], ['ALL', 'All']];

  /* ---------------------------------------------------------------- routing */
  function parsePath() {
    const seg = location.pathname.replace(/^\/+|\/+$/g, '').split('/');
    const a = seg[0] || '';
    if (a === 'stocks') S.tab = 'stocks';
    else if (a === 'portfolios' || a === '') S.tab = 'portfolios';
    else if (a === 'stock' && seg[1]) { S.tab = 'stocks'; S._openStock = decodeURIComponent(seg[1]); }
    else if (a === 'portfolio' && seg[1]) { S.tab = 'portfolios'; S._openPortfolio = decodeURIComponent(seg[1]); }
    else if (['following', 'alerts', 'account'].includes(a)) S.tab = a;
  }
  function go(path, push) {
    if (push !== false) history.pushState({}, '', path);
    parsePath(); S.drawer = null; S.openMenu = null; render();
  }
  window.addEventListener('popstate', () => { parsePath(); render(); });

  /* ---------------------------------------------------------------- data load */
  async function load() {
    const j = (u) => fetch(u, { headers: { accept: 'application/json' } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    const [feed, prices] = await Promise.allSettled([j('/api/feed?performance=1'), j('/api/prices')]);
    if (feed.status === 'fulfilled' && Array.isArray(feed.value) && feed.value.length) {
      S.rows = feed.value.map((r) => ({ ...r, label: r.label || labelOf(r) }));
      S.live = true;
    }
    if (prices.status === 'fulfilled' && prices.value && typeof prices.value === 'object') S.prices = prices.value;
    render();
  }

  /* ---------------------------------------------------------------- computed list */
  function currentList() {
    let rows = S.rows;
    if (S.tab === 'portfolios') {
      let list = derivePortfolios(rows);
      if (S.query) { const q = S.query.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(q) || p.rows.some((r) => (r.ticker || '').toLowerCase().includes(q))); }
      if (S.compliance !== 'all') list = list.filter((p) => { const tone = portfolioFlag(p).tone; return S.compliance === 'fully' ? tone === 'clean' : tone !== 'fail'; });
      if (S.followedOnly) list = list.filter((p) => S.follows.has(p.name));
      const cmp = { top: (a, b) => (b.perf ?? -1e9) - (a.perf ?? -1e9), active: (a, b) => b.count - a.count, followed: (a, b) => (b._f || 0) - (a._f || 0) || b.count - a.count, alloc: (a, b) => b.cleanPct - a.cleanPct || b.count - a.count };
      return list.sort(cmp[S.pMetric]);
    }
    const cfg = S_SUB.find((x) => x[0] === S.sMetric);
    let list = deriveStocks(rows, cfg[2]);
    if (S.query) { const q = S.query.toLowerCase(); list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)); }
    if (S.compliance !== 'all') list = list.filter((s) => S.compliance === 'fully' ? s.label === 'clean' : s.label !== 'fail');
    if (S.evFilter !== 'all') list = list.filter((s) => evStrength(s.filerCount) === S.evFilter);
    if (S.followedOnly) list = list.filter((s) => S.follows.has(s.ticker));
    const srt = { value: (a, b) => b.dollar - a.dollar, weight: (a, b) => b.filerCount - a.filerCount || b.dollar - a.dollar, filers: (a, b) => b.filerCount - a.filerCount || b.dollar - a.dollar };
    return list.sort(srt[cfg[3]]);
  }

  /* ---------------------------------------------------------------- small render helpers */
  const allocBar = (mix) => {
    const total = mix.clean + mix.purify + mix.fail + mix.unscreened || 1;
    const seg = (k, cls) => mix[k] > 0 ? `<span class="mz-allocation__segment--${cls}" style="flex:${mix[k]}"></span>` : '';
    const pct = (k) => mix[k] > 0 ? `<span>${Math.round(mix[k] / total * 100)}%</span>` : '';
    return `<div class="mz-allocation"><div class="mz-allocation__bar">${seg('clean', 'compliant')}${seg('purify', 'purify')}${seg('fail', 'noncompliant')}</div><div class="mz-allocation__legend">${pct('clean')}${pct('purify')}${pct('fail')}</div></div>`;
  };
  const freshEl = (d) => d == null ? '<span class="mz-muted">—</span>' : `<span class="mz-fresh" data-fresh="${d <= 30}">${I.clock}${d}d · ${d <= 30 ? 'Fresh' : d <= 75 ? 'Recent' : 'Aging'}</span>`;
  // avatarHtml + metaHtml are trusted HTML built by callers (they escape their own text).
  const entity = (avatarHtml, name, metaHtml, nameLtr) => `<div class="mz-entity"><span class="mz-entity__avatar">${avatarHtml}</span><div><div class="mz-entity__name${nameLtr ? ' mz-ltr' : ''}">${esc(name)}</div><div class="mz-entity__meta">${metaHtml}</div></div></div>`;
  const miniIcon = (svg) => `<span style="width:.9rem;height:.9rem;display:inline-flex">${svg}</span>`;
  const perfCell = (v) => v == null ? '<span class="mz-muted">—</span>' : `<span class="mz-performance">${fmtPct(v)}</span>`;
  const starBtn = (id) => `<button class="mz-star" data-star="${esc(id)}" data-on="${S.follows.has(id)}" aria-label="Follow">${S.follows.has(id) ? I.starOn : I.star}</button>`;

  /* --- real performance charts, restored from the native app (dual-anchor / index) --- */
  const chartPath = (v, W, H) => { const mn = Math.min(...v), mx = Math.max(...v), r = (mx - mn) || 1; return v.map((y, i) => `${(i / (v.length - 1) * W).toFixed(2)},${(H - (y - mn) / r * H).toFixed(2)}`).join(' '); };
  const histVals = (ticker) => ((S.prices[ticker] && S.prices[ticker].history) || []).map((p) => +p.c).filter((x) => isFinite(x));
  // Real sparkline from the ticker's cached price history (empty string when no data).
  const spark = (ticker) => { const v = histVals(ticker); return v.length < 2 ? '' : `<svg class="mz-spark" viewBox="0 0 80 28" preserveAspectRatio="none"><polyline fill="none" stroke="var(--mz-cobalt-500)" stroke-width="1.5" points="${chartPath(v, 80, 28)}"/></svg>`; };
  // A bigger line chart for detail drawers; `vals` is a numeric close series.
  function lineChart(vals) {
    if (!vals || vals.length < 2) return `<div class="mz-muted" style="padding:1.25rem 0;text-align:center;font-size:var(--mz-text-xs)">Price data pending — will populate once the cache fills.</div>`;
    const H = 120, W = 320, ret = vals[vals.length - 1] / vals[0] - 1;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block;overflow:visible"><polyline points="${chartPath(vals, W, H)}" fill="none" stroke="var(--mz-cobalt-600)" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <div style="display:flex;justify-content:space-between;margin-block-start:.4rem;font-size:var(--mz-text-xs)"><span class="mz-muted mz-ltr">$${Math.min(...vals).toFixed(0)}</span><span class="mz-performance">${fmtPct(ret * 100)} over range</span><span class="mz-muted mz-ltr">$${Math.max(...vals).toFixed(0)}</span></div>`;
  }
  // Equal-weight normalized index across a portfolio's ownable (non-fail) held tickers.
  function portfolioIndexVals(rows) {
    const tickers = [...new Set(rows.filter((r) => r.label !== 'fail').map((r) => r.ticker))];
    const series = tickers.map(histVals).filter((a) => a.length >= 2);
    if (!series.length) return [];
    const len = Math.min(...series.map((a) => a.length)), out = [];
    for (let i = 0; i < len; i++) { let s = 0; for (const a of series) s += a[a.length - len + i] / a[a.length - len]; out.push(s / series.length * 100); }
    return out;
  }

  /* ---------------------------------------------------------------- chrome */
  function renderChrome() {
    document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
    // rail
    const rail = { following: [I.star, 'tab.following'], alerts: [I.bell, 'tab.alerts'], account: [I.user, 'tab.account'] };
    document.querySelectorAll('.mz-rail-link[data-rail]').forEach((a) => { const k = a.dataset.rail; a.innerHTML = `<span style="width:1.4rem">${rail[k][0]}</span><span>${t(rail[k][1])}</span>`; a.setAttribute('aria-current', S.tab === k ? 'page' : 'false'); });
    const lang = document.getElementById('langToggle'); lang.innerHTML = `<span style="width:1.4rem">${I.globe}</span><span>${LANG === 'en' ? 'ع' : 'EN'}</span>`;
    // top tabs
    document.querySelectorAll('#topTabs .mz-product-tab').forEach((b) => { const on = b.dataset.tab === S.tab || (S.tab === 'portfolios' && b.dataset.tab === 'portfolios'); b.textContent = t('tab.' + b.dataset.tab); b.setAttribute('aria-selected', (b.dataset.tab === S.tab) || (['following', 'alerts', 'account'].includes(S.tab) && b.dataset.tab === 'portfolios' && false)); });
    document.querySelectorAll('#topTabs .mz-product-tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === (S.tab === 'stocks' ? 'stocks' : 'portfolios')));
    document.getElementById('searchIcon').innerHTML = I.search;
    const inp = document.getElementById('search'); inp.placeholder = t('c.search'); if (inp.value !== S.query) inp.value = S.query;
    document.getElementById('bellBtn').innerHTML = I.bell;
    document.getElementById('freshness').textContent = S.live ? t('live') : t('sample');
    // mobile nav
    const nav = [['portfolios', I.portfolios, 'tab.portfolios', '/portfolios'], ['stocks', I.stocks, 'tab.stocks', '/stocks'], ['following', I.star, 'tab.following', '/following'], ['alerts', I.bell, 'tab.alerts', '/alerts'], ['account', I.user, 'tab.account', '/account']];
    document.getElementById('mobileNav').innerHTML = nav.map(([k, ic, lk, path]) => `<a href="${path}" class="mz-mobile-nav__item" data-nav="${k}" aria-current="${S.tab === k ? 'page' : 'false'}"><span style="width:1.4rem">${ic}</span><span>${t(lk)}</span></a>`).join('');
  }

  /* ---------------------------------------------------------------- toolbar */
  function renderToolbar() {
    const isP = S.tab === 'portfolios';
    document.getElementById('pageTitle').textContent = t(isP ? 'p.title' : 's.title');
    document.getElementById('pageSub').textContent = t(isP ? 'p.sub' : 's.sub');
    document.getElementById('headingEnd').innerHTML = '';
    // subtabs
    const subs = isP ? P_SUB : S_SUB.map((x) => [x[0], x[1]]);
    const cur = isP ? S.pMetric : S.sMetric;
    document.getElementById('subtabs').innerHTML = subs.map(([k, lk]) => `<button class="mz-subtab" role="tab" data-sub="${k}" aria-selected="${k === cur}">${t(lk)}</button>`).join('');
    // timebar
    document.getElementById('timebar').innerHTML = TFS.map(([k, l]) => `<button class="mz-segmented__item" data-tf="${k}" aria-selected="${k === S.tf}">${l}</button>`).join('');
    // sort
    const sortKey = isP ? P_SORT[S.pMetric] : S_SORT[S_SUB.find((x) => x[0] === S.sMetric)[3]];
    document.getElementById('sortBtn').innerHTML = `${I.sort}<span>${t(sortKey)}</span>${I.chevronDown}`;
    document.getElementById('whyBtn').innerHTML = `${I.info}<span>${t('c.why')}</span>`;
    const fCount = (S.compliance !== 'all' ? 1 : 0) + (!isP && S.evFilter !== 'all' ? 1 : 0) + (S.followedOnly ? 1 : 0);
    document.getElementById('filterBtn').innerHTML = `${I.filter}<span>${t('c.filter')}</span>${fCount ? `<span class="mz-count">${fCount}</span>` : ''}`;
    document.getElementById('filterBtn').dataset.active = fCount > 0;
    const cmp = document.getElementById('compareBtn');
    cmp.style.display = isP ? '' : 'none';
    cmp.innerHTML = `${I.compare}<span>${t('c.compare')}${S.compareMode && S.selected.length ? ` (${S.selected.length})` : ''}</span>`;
    cmp.dataset.active = S.compareMode;
    // applied chips
    const chips = [];
    if (S.compliance === 'fully') chips.push([t('v.compliant') + ' only', () => { S.compliance = 'all'; render(); }]);
    if (S.compliance === 'exclude') chips.push([t('v.compliant') + ' + ' + t('v.purify'), () => { S.compliance = 'all'; render(); }]);
    if (!isP && S.evFilter !== 'all') chips.push([t('ev.' + S.evFilter) + ' ' + t('h.evidence').toLowerCase(), () => { S.evFilter = 'all'; render(); }]);
    if (S.followedOnly) chips.push([t('tab.following'), () => { S.followedOnly = false; render(); }]);
    const chipWrap = document.getElementById('chips');
    chipWrap.innerHTML = chips.length ? `<div class="mz-toolbar" style="gap:.5rem">${chips.map((c, i) => `<button class="mz-chip" data-chip="${i}" data-active="true">${esc(c[0])} ${I.close}</button>`).join('')}${chips.length > 1 ? `<button class="mz-linkbtn" id="clearChips">${t('c.clear')}</button>` : ''}</div>` : '';
    chipWrap._chips = chips;
  }

  /* ---------------------------------------------------------------- tables + cards */
  function renderList() {
    const list = currentList();
    document.getElementById('resultMeta').textContent = t('meta.count', { n: list.length }) + (S.live ? '' : ' · ' + t('sample'));
    const isP = S.tab === 'portfolios';
    const thead = document.getElementById('thead'), tbody = document.getElementById('tbody'), cards = document.getElementById('cards');
    if (['following', 'alerts', 'account'].includes(S.tab)) { renderSecondary(); return; }
    document.getElementById('tableWrap').style.display = '';
    document.getElementById('legend').innerHTML = ['clean', 'purify', 'fail', 'unscreened'].map((k) => `<span><span class="mz-dot" style="background:var(--mz-${VER[k].cls === 'compliant' ? 'compliant' : VER[k].cls === 'purify' ? 'purify' : VER[k].cls === 'noncompliant' ? 'noncompliant' : 'review'}-600)"></span>${t(VER[k].k)}</span>`).join('');
    document.getElementById('guardrail').textContent = t(isP ? 'g.portfolios' : 'g.disclaimer');

    if (isP) {
      thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.portfolio')}</th><th>${t('h.type')}</th><th>${t('h.return')}</th><th>${t('h.activity')}</th><th>${t('h.freshness')}</th><th>${t('h.allocation')}</th><th>${t('h.purify')}</th><th>${t('h.followers')}</th></tr>`;
      tbody.innerHTML = list.map((p, i) => {
        const flag = portfolioFlag(p), sel = S.selected.includes(p.name);
        const first = S.compareMode ? `<button class="mz-check-btn" data-select="${esc(p.name)}" data-on="${sel}" aria-label="Select">${sel ? I.check : ''}</button>` : `<span class="mz-rank">${i + 1}</span>`;
        const av = `<span style="color:var(--mz-cobalt-700);font-weight:800;font-size:.8rem">${esc(p.initials)}</span>`;
        const meta = `<span style="display:inline-flex;gap:.35rem;align-items:center">${miniIcon(groupIcon(p.group))}${esc(flag.text)}</span>`;
        return `<tr data-row="portfolio" data-id="${esc(p.name)}" data-selected="${sel}"><td>${first}</td><td>${entity(av, p.name, meta)}</td><td class="mz-muted">${typeLabel(p.kind)}</td><td>${perfCell(p.perf)}</td><td class="mz-cell-num">${p.count}</td><td>${freshEl(p.fresh)}</td><td>${allocBar(p.mix)}</td><td class="mz-cell-num" style="color:var(--mz-purify-700)">${p.purifyPct > 0 ? p.purifyPct + '%' : '—'}</td><td>${starBtn(p.name)}</td></tr>`;
      }).join('') || emptyRow(9);
      cards.innerHTML = list.map((p, i) => portfolioCard(p, i)).join('');
    } else {
      thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.stock')}</th><th>${t('h.signal')}</th><th>${t('h.evidence')}</th><th>${t('h.filers')}</th><th>${t('h.value')}</th><th>${t('h.freshness')}</th><th>${t('h.since')}</th><th>${t('h.status')}</th></tr>`;
      const signal = { bought: 'Accumulation', sold: 'Reduction', new: 'New position', incr: 'Position increased', red: 'Position reduced', exit: 'Exited' }[S.sMetric];
      tbody.innerHTML = list.map((s, i) => `<tr data-row="stock" data-id="${esc(s.ticker)}"><td><span class="mz-rank">${i + 1}</span></td><td>${entity(`<span class="mz-ltr" style="font-weight:800;font-size:.72rem">${esc(s.ticker.slice(0, 4))}</span>`, s.ticker, esc(s.company), true)}</td><td><div class="mz-muted">${signal}</div>${spark(s.ticker)}</td><td style="font-weight:700">${t('ev.' + evStrength(s.filerCount))}</td><td class="mz-cell-num">${s.filerCount}</td><td class="mz-cell-num" style="font-weight:750">${fmtMoney(s.dollar)}</td><td>${freshEl(s.fresh)}</td><td>${perfCell(s.perf)}</td><td>${badge(s.label)}</td></tr>`).join('') || emptyRow(9);
      cards.innerHTML = list.map((s, i) => stockCard(s, i)).join('');
    }
  }
  const emptyRow = (cols) => `<tr><td colspan="${cols}"><div class="mz-state"><div class="mz-state__content"><h3>${t('empty.title')}</h3><p class="mz-muted">${t('empty.body')}</p></div></div></td></tr>`;

  function portfolioCard(p, i) {
    const flag = portfolioFlag(p), sel = S.selected.includes(p.name);
    return `<article class="mz-portfolio-card" data-row="portfolio" data-id="${esc(p.name)}" data-selected="${sel}">
      <div style="display:flex;gap:.75rem;align-items:center">
        ${S.compareMode ? `<button class="mz-check-btn" data-select="${esc(p.name)}" data-on="${sel}">${sel ? I.check : ''}</button>` : `<span class="mz-rank">${i + 1}</span>`}
        <span class="mz-entity__avatar"><span style="color:var(--mz-cobalt-700);font-weight:800">${esc(p.initials)}</span></span>
        <div style="flex:1;min-width:0"><div class="mz-entity__name">${esc(p.name)}</div><div class="mz-entity__meta">${typeLabel(p.kind)}</div></div>
        <div style="text-align:end">${perfCell(p.perf)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-block-start:.6rem;gap:.5rem">
        <span class="mz-badge mz-badge--${flag.tone === 'clean' ? 'compliant' : flag.tone === 'purify' ? 'purify' : 'noncompliant'}">${flag.text}</span>
        ${freshEl(p.fresh)}
      </div>
      <div style="margin-block-start:.6rem">${allocBar(p.mix)}</div>
      <div class="mz-card-metrics"><div><div class="mz-metric__label">${t('h.activity')}</div><div class="mz-metric__value">${p.count}</div></div><div><div class="mz-metric__label">${t('h.purify')}</div><div class="mz-metric__value">${p.purifyPct}%</div></div><div><div class="mz-metric__label">${t('h.followers')}</div><div class="mz-metric__value">${starBtn(p.name)}</div></div></div>
    </article>`;
  }
  function stockCard(s, i) {
    return `<article class="mz-stock-card" data-row="stock" data-id="${esc(s.ticker)}">
      <div style="display:flex;gap:.75rem;align-items:center">
        <span class="mz-rank">${i + 1}</span>
        <div style="flex:1;min-width:0"><div class="mz-entity__name mz-ltr">${esc(s.ticker)}</div><div class="mz-entity__meta">${esc(s.company)}</div></div>
        ${spark(s.ticker)}
        ${badge(s.label)}
      </div>
      <div class="mz-card-metrics"><div><div class="mz-metric__label">${t('h.evidence')}</div><div class="mz-metric__value">${t('ev.' + evStrength(s.filerCount))}</div></div><div><div class="mz-metric__label">${t('h.value')}</div><div class="mz-metric__value">${fmtMoney(s.dollar)}</div></div><div><div class="mz-metric__label">${t('h.since')}</div><div class="mz-metric__value">${fmtPct(s.perf) || '—'}</div></div></div>
      <div style="margin-block-start:.5rem">${freshEl(s.fresh)}</div>
    </article>`;
  }

  /* ---------------------------------------------------------------- secondary screens */
  function emptyState(icon, title, body) {
    return `<div class="mz-surface mz-state"><div class="mz-state__content"><div style="width:2.2rem;margin-inline:auto;color:var(--mz-ink-300)">${icon}</div><h3 style="margin-block:.6rem .3rem">${esc(title)}</h3><p class="mz-muted" style="margin:0">${esc(body)}</p></div></div>`;
  }
  function renderSecondary() {
    document.getElementById('tableWrap').style.display = 'none';
    document.getElementById('cards').innerHTML = '';
    document.getElementById('legend').innerHTML = '';
    document.getElementById('subtabs').innerHTML = '';
    setToolbarVisible(false);
    document.getElementById('chips').innerHTML = '';
    document.getElementById('resultMeta').textContent = '';
    const host = document.getElementById('tbody').closest('.mz-content-grid').firstElementChild;
    host.querySelector('#acctPanel')?.remove();
    const div = document.createElement('div'); div.id = 'acctPanel';
    const title = { following: 'follow.title', alerts: 'alerts.title', account: 'acct.title' }[S.tab];
    document.getElementById('pageTitle').textContent = t(title);
    document.getElementById('pageSub').textContent = '';
    document.getElementById('guardrail').textContent = S.tab === 'account' ? t('g.disclaimer') : '';

    if (S.tab === 'account') {
      const seg = (val, cur, opts) => `<div class="mz-segmented">${opts.map(([k, l]) => `<button class="mz-segmented__item" ${val}="${k}" aria-selected="${cur === k}">${l}</button>`).join('')}</div>`;
      div.innerHTML =
        `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)"><h3>${t('acct.lang')}</h3>${seg('data-lang', LANG, [['en', 'English'], ['ar', 'العربية']])}</section>` +
        `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)"><h3>${LANG === 'ar' ? 'حساسية الحكم' : 'Verdict tolerance'}</h3><p class="mz-muted" style="margin:.25rem 0 .75rem;font-size:var(--mz-text-sm)">${LANG === 'ar' ? 'يضبط الافتراضي لكل القوائم.' : 'Sets the default across every list.'}</p>${seg('data-fc', S.compliance, [['all', LANG === 'ar' ? 'الكل' : 'All'], ['fully', t('v.compliant') + (LANG === 'ar' ? ' فقط' : ' only')], ['exclude', t('v.compliant') + ' + ' + t('v.purify')]])}</section>` +
        `<section class="mz-surface" style="padding:var(--mz-space-5)"><h3>${t('sec.methodology')}</h3><p class="mz-muted" style="margin:0;line-height:1.55">${t('sec.mtext')}</p></section>`;
    } else if (S.tab === 'following') {
      const followed = derivePortfolios(S.rows).filter((p) => S.follows.has(p.name));
      div.innerHTML = followed.length
        ? `<div class="mz-card-list" style="display:grid">${followed.map((p, i) => portfolioCard(p, i)).join('')}</div>`
        : emptyState(I.star, LANG === 'ar' ? 'لا تتابع أحدًا بعد' : "You're not following anyone yet",
          LANG === 'ar' ? 'تابِع محفظة من تبويب المحافظ لإبقائها هنا.' : 'Follow a portfolio from the Portfolios tab to keep it here.');
    } else { // alerts
      const notes = S.rows.filter((r) => S.follows.has(r.actor)).sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || ''));
      div.innerHTML = notes.length
        ? `<div class="mz-card-list" style="display:grid">${notes.map((r) => { const lag = daysBetween(r.transactionDate, r.filingDate); return `<article class="mz-stock-card" data-row="stock" data-id="${esc(r.ticker)}"><div style="display:flex;gap:.75rem;align-items:center"><div style="flex:1;min-width:0"><div class="mz-entity__name">${esc(r.actor)}</div><div class="mz-entity__meta">${String(r.side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought'} <span class="mz-ltr">${esc(r.ticker)}</span> · ${esc(r.amount || (r.amountMid ? fmtMoney(+r.amountMid) : '—'))}${lag != null ? ` · filed ${lag}d later` : ''}</div></div>${badge(r.label)}${I.chevronRight ? `<span style="width:1rem;color:var(--mz-ink-400)">${I.chevronRight}</span>` : ''}</div></article>`; }).join('')}</div>`
        : emptyState(I.bell, S.follows.size ? (LANG === 'ar' ? 'أنت مُطّلع على كل شيء' : "You're all caught up") : (LANG === 'ar' ? 'لا توجد تنبيهات بعد' : 'No alerts yet'),
          LANG === 'ar' ? 'تابِع محافظ لتصلك التنبيهات هنا عند نشر إفصاحات جديدة.' : 'Follow portfolios to be notified here when they file new disclosures.');
    }
    host.insertBefore(div, host.querySelector('.mz-guardrail'));
  }

  /* ---------------------------------------------------------------- drawer */
  function renderDrawer() {
    const grid = document.getElementById('contentGrid'), d = document.getElementById('drawer');
    const comparing = S.compareMode && S.selected.length && S.tab === 'portfolios';
    document.getElementById('mobileTray').hidden = !comparing;
    if (comparing) {
      const tray = document.getElementById('mobileTray');
      const n = S.selected.length;
      tray.innerHTML = `<span style="flex:1;font-weight:650;font-size:.8rem">${n < 2 ? t('cmp.pick') : n + ' ' + t('tab.portfolios').toLowerCase()}</span><button class="mz-button mz-button--primary" ${n < 2 ? 'disabled' : ''} id="trayOpen">${t('cmp.tray', { n })}</button>`;
      // On desktop the comparison panel is a persistent side drawer (matches the reference);
      // on mobile the tray's button opens it as a sheet instead.
      const desktop = window.matchMedia('(min-width: 75rem)').matches;
      if (desktop && (!S.drawer || S.drawer.type === 'compare')) S.drawer = { type: 'compare' };
    } else if (S.drawer && S.drawer.type === 'compare') {
      S.drawer = null;
    }
    const scrim = document.getElementById('scrim');
    if (!S.drawer) { grid.classList.remove('mz-content-grid--drawer-open'); d.hidden = true; d.innerHTML = ''; scrim.hidden = true; return; }
    grid.classList.add('mz-content-grid--drawer-open'); d.hidden = false;
    // Scrim only under the sheet/side-panel on tablet & mobile (desktop drawer is in-grid).
    scrim.hidden = window.matchMedia('(min-width: 75rem)').matches;
    if (S.drawer.type === 'compare') d.innerHTML = compareDrawer();
    else if (S.drawer.type === 'evidence') d.innerHTML = evidenceDrawer(S.drawer.ticker);
    else if (S.drawer.type === 'detail') d.innerHTML = portfolioDrawer(S.drawer.name);
  }
  function drawerHead(title) { return `<div class="mz-drawer__header"><div class="mz-drawer__title"><h3 style="margin:0">${esc(title)}</h3><button class="mz-button mz-button--icon" id="drawerClose" aria-label="Close" style="min-height:2.25rem;width:2.25rem">${I.close}</button></div></div>`; }

  function compareDrawer() {
    const items = currentList().filter((p) => S.selected.includes(p.name)).slice(0, 2);
    const row = (label, fn) => `<div class="mz-drawer__section"><div class="mz-cmp-metric__label">${label}</div><div class="mz-cmp-vals">${items.map((p) => `<div>${fn(p)}</div>`).join('')}</div></div>`;
    return drawerHead(t('cmp.title')) +
      `<div class="mz-drawer__section"><div class="mz-cmp-head">${items.map((p) => `<div><span class="mz-entity__avatar" style="margin-inline:auto">${esc(p.initials)}</span><div style="font-weight:700;margin-block-start:.35rem">${esc(p.name)}</div><div class="mz-entity__meta">${typeLabel(p.kind)}</div></div>`).join('')}</div></div>` +
      row(t('cmp.return'), (p) => perfCell(p.perf)) +
      row(t('cmp.disclosures'), (p) => p.count) +
      row(t('cmp.alloc'), (p) => Math.round(p.cleanPct * 100) + '%') +
      row(t('cmp.purify'), (p) => `<span style="color:var(--mz-purify-700)">${p.purifyPct}%</span>`) +
      `<div class="mz-drawer__section">${items.map((p) => allocBar(p.mix)).join('')}</div>` +
      `<div class="mz-drawer__footer"><p class="mz-muted" style="margin:0;font-size:.75rem">${t('cmp.note')}</p></div>`;
  }
  function evidenceDrawer(ticker) {
    const rows = S.rows.filter((r) => r.ticker === ticker);
    const filers = new Set(rows.map((r) => r.actor)).size, str = evStrength(filers), fresh = Math.min(...rows.map((r) => daysSince(r.filingDate) ?? 999));
    const label = rows[0] ? rows[0].label : 'unscreened', dollar = rows.reduce((a, r) => a + Math.abs(+r.amountMid || 0), 0);
    const reasons = [`${filers} independent disclosing filer${filers === 1 ? '' : 's'}`, 'Consistent direction across filings', fresh <= 30 ? 'Recent, fresh disclosures' : `Most recent filing ${fresh}d ago`];
    const top = [...rows].sort((a, b) => (+b.amountMid || 0) - (+a.amountMid || 0)).slice(0, 5);
    const perf = rows.map((r) => r.performance && r.performance.sinceDisclosed).find((x) => x != null && isFinite(x));
    return drawerHead(t('ev.title', { t: ticker })) +
      `<div class="mz-drawer__section"><div style="display:flex;align-items:baseline;justify-content:space-between;margin-block-end:.5rem"><span class="mz-cmp-metric__label">${LANG === 'ar' ? 'الأداء' : 'Performance'}</span>${perf != null ? `<span class="mz-performance">${fmtPct(perf)} ${t('h.since').toLowerCase()}</span>` : ''}</div>${lineChart(histVals(ticker))}</div>` +
      `<div class="mz-drawer__section"><h3 style="font-size:var(--mz-text-md)">${t('ev.why', { s: t('ev.' + str) })}</h3><ul class="mz-why-list">${reasons.map((r) => `<li><span style="width:1.1rem;color:var(--mz-cobalt-600)">${I.check}</span>${esc(r)}</li>`).join('')}</ul></div>` +
      `<div class="mz-drawer__section"><div class="mz-summary-grid" style="grid-template-columns:1fr 1fr 1fr;margin:0"><div class="mz-summary"><div class="mz-summary__label">${t('h.value')}</div><div class="mz-summary__value">${fmtMoney(dollar)}</div></div><div class="mz-summary"><div class="mz-summary__label">${t('h.filers')}</div><div class="mz-summary__value">${filers}</div></div><div class="mz-summary"><div class="mz-summary__label">${t('h.status')}</div><div style="margin-block-start:.35rem">${badge(label)}</div></div></div></div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('ev.recent')}</div>${top.map((r) => `<div style="display:flex;justify-content:space-between;gap:.5rem;padding-block:.4rem;border-block-end:var(--mz-border)"><div><div style="font-weight:650">${esc(r.actor)}</div><div class="mz-entity__meta">${String(r.side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought'} · ${esc(r.source || r.kind || '')}</div></div><div class="mz-cell-num" style="font-weight:700">${fmtMoney(+r.amountMid || 0)}</div></div>`).join('')}</div>` +
      `<div class="mz-drawer__footer" style="display:grid;gap:.5rem"><button class="mz-button mz-button--primary" data-open-stock="${esc(ticker)}">${t('ev.review')} ${I.external}</button><button class="mz-button mz-button--ghost">${I.bell}${t('ev.setalert')}</button></div>`;
  }
  function portfolioDrawer(name) {
    const p = derivePortfolios(S.rows).find((x) => x.name === name); if (!p) return drawerHead(name);
    const flag = portfolioFlag(p);
    // Composition: value-weight the ownable (non-fail) held names.
    const holdings = {};
    for (const r of p.rows) { holdings[r.ticker] = holdings[r.ticker] || { ticker: r.ticker, company: r.company, label: r.label, v: 0 }; holdings[r.ticker].v += Math.abs(+r.amountMid || 0); }
    const hs = Object.values(holdings).sort((a, b) => b.v - a.v);
    const ownTotal = hs.filter((h) => h.label !== 'fail').reduce((a, h) => a + h.v, 0) || 1;
    const idx = portfolioIndexVals(p.rows);
    // Activity log — recent disclosed trades, newest first.
    const acts = [...p.rows].sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || '')).slice(0, 6);
    const sideTag = (s) => String(s).toUpperCase() === 'SELL'
      ? `<span class="mz-badge mz-badge--noncompliant" style="min-height:1.3rem">Sold</span>`
      : `<span class="mz-badge mz-badge--compliant" style="min-height:1.3rem">Bought</span>`;
    return drawerHead(name) +
      `<div class="mz-drawer__section"><span class="mz-badge mz-badge--${flag.tone === 'clean' ? 'compliant' : flag.tone === 'purify' ? 'purify' : 'noncompliant'}">${flag.text}</span><div style="margin-block-start:.6rem">${allocBar(p.mix)}</div></div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${LANG === 'ar' ? 'الأداء' : 'Performance'}</div>${lineChart(idx)}<p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.5rem 0 0">${LANG === 'ar' ? 'مؤشر متساوي الوزن للأسماء المملوكة — أدلة، ليس نصيحة.' : 'Equal-weight index of the ownable holdings — evidence, not advice.'}</p></div>` +
      `<div class="mz-drawer__section"><div class="mz-summary-grid" style="grid-template-columns:1fr 1fr;margin:0"><div class="mz-summary"><div class="mz-summary__label">${t('h.return')}</div><div class="mz-summary__value">${fmtPct(p.perf) || '—'}</div></div><div class="mz-summary"><div class="mz-summary__label">${t('cmp.disclosures')}</div><div class="mz-summary__value">${p.count}</div></div></div></div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('h.allocation')}</div>${hs.map((h) => { const w = h.label === 'fail' ? 0 : Math.round(h.v / ownTotal * 100); return `<div style="padding-block:.45rem;border-block-end:var(--mz-border)"><div style="display:flex;justify-content:space-between;gap:.5rem;align-items:center"><div class="mz-ltr" style="font-weight:700;min-width:0"><span>${esc(h.ticker)}</span> <span class="mz-muted" style="font-weight:400">${esc(h.company || '')}</span></div><div style="display:flex;gap:.5rem;align-items:center;flex:0 0 auto">${h.label === 'fail' ? '' : `<span class="mz-cell-num" style="font-weight:700">${w}%</span>`}${badge(h.label)}</div></div>${h.label === 'fail' ? '' : `<div class="mz-allocation__bar" style="margin-block-start:.35rem"><span class="mz-allocation__segment--compliant" style="flex:${w}"></span><span style="flex:${100 - w};background:var(--mz-ink-100)"></span></div>`}</div>`; }).join('')}</div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${LANG === 'ar' ? 'سجل النشاط' : 'Activity log'}</div>${acts.map((r) => { const lag = daysBetween(r.transactionDate, r.filingDate); return `<div style="display:flex;justify-content:space-between;gap:.5rem;align-items:center;padding-block:.4rem;border-block-end:var(--mz-border)"><div style="min-width:0"><div class="mz-ltr" style="font-weight:700">${esc(r.ticker)}</div><div class="mz-entity__meta">${esc(r.amount || (r.amountMid ? fmtMoney(+r.amountMid) : ''))}${lag != null ? ` · filed ${lag}d later` : ''}</div></div>${sideTag(r.side)}</div>`; }).join('')}</div>` +
      `<div class="mz-drawer__footer"><button class="mz-button mz-button--secondary" style="width:100%" data-follow="${esc(name)}">${S.follows.has(name) ? I.starOn : I.star}${S.follows.has(name) ? t('common.following') : t('common.follow')}</button></div>`;
  }

  /* ---------------------------------------------------------------- main render */
  function setToolbarVisible(show) {
    ['timeRow', 'controlRow'].forEach((id) => { const e = document.getElementById(id); if (e) e.style.display = show ? '' : 'none'; });
  }
  function render() {
    setToolbarVisible(!['following', 'alerts', 'account'].includes(S.tab));
    renderChrome(); renderToolbar(); renderList(); renderDrawer();
    // deferred deep-link drawer opens
    if (S._openStock) { S.drawer = { type: 'evidence', ticker: S._openStock }; S._openStock = null; renderDrawer(); }
    if (S._openPortfolio) { S.drawer = { type: 'detail', name: S._openPortfolio }; S._openPortfolio = null; renderDrawer(); }
  }

  /* ---------------------------------------------------------------- events (delegated) */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-tab],[data-sub],[data-tf],[data-rail],[data-nav],[data-lang],[data-star],[data-select],[data-row],[data-chip],[data-open-stock],[data-follow],#langToggle,#sortBtn,#filterBtn,#compareBtn,#whyBtn,#drawerClose,#clearChips,#trayOpen,#bellBtn');
    if (!el) { if (S.openMenu) { S.openMenu = null; closeMenus(); } return; }
    const has = (a) => el.hasAttribute(a) || el.id === a;

    if (el.dataset.tab) { S.tab = el.dataset.tab; go('/' + el.dataset.tab); return; }
    if (el.dataset.nav) { e.preventDefault(); S.tab = el.dataset.nav; go('/' + el.dataset.nav); return; }
    if (el.dataset.rail !== undefined && el.dataset.rail) { e.preventDefault(); go('/' + el.dataset.rail); return; }
    if (el.dataset.sub) { if (S.tab === 'portfolios') S.pMetric = el.dataset.sub; else S.sMetric = el.dataset.sub; S.drawer = null; render(); return; }
    if (el.dataset.tf) { S.tf = el.dataset.tf; render(); return; }
    if (el.id === 'langToggle') { LANG = LANG === 'en' ? 'ar' : 'en'; render(); return; }
    if (el.dataset.lang) { LANG = el.dataset.lang; render(); return; }
    if (el.dataset.star != null) { e.stopPropagation(); toggleFollow(el.dataset.star); render(); return; }
    if (el.dataset.follow) { toggleFollow(el.dataset.follow); render(); return; }
    if (el.dataset.select != null) { e.stopPropagation(); toggleSelect(el.dataset.select); return; }
    if (el.id === 'compareBtn') { S.compareMode = !S.compareMode; if (!S.compareMode) { S.selected = []; if (S.drawer && S.drawer.type === 'compare') S.drawer = null; } render(); return; }
    if (el.id === 'trayOpen') { S.drawer = { type: 'compare' }; renderDrawer(); return; }
    if (el.id === 'sortBtn') { toggleMenu('sort'); return; }
    if (el.id === 'filterBtn') { toggleMenu('filter'); return; }
    if (el.id === 'whyBtn') { toggleMenu('why'); return; }
    if (el.id === 'drawerClose') { closeDrawer(); return; }
    if (el.id === 'clearChips') { S.compliance = 'all'; S.evFilter = 'all'; S.followedOnly = false; render(); return; }
    if (el.dataset.chip != null) { const chips = document.getElementById('chips')._chips; chips && chips[+el.dataset.chip] && chips[+el.dataset.chip][1](); return; }
    if (el.dataset.openStock) { S.drawer = { type: 'evidence', ticker: el.dataset.openStock }; go('/stock/' + encodeURIComponent(el.dataset.openStock)); return; }
    if (el.dataset.row) {
      const id = el.dataset.id;
      if (el.dataset.row === 'portfolio') { if (S.compareMode) { toggleSelect(id); return; } S.drawer = { type: 'detail', name: id }; go('/portfolio/' + encodeURIComponent(id)); }
      else { S.drawer = { type: 'evidence', ticker: id }; go('/stock/' + encodeURIComponent(id)); }
      return;
    }
  });
  document.getElementById('search').addEventListener('input', (e) => { S.query = e.target.value; renderList(); });
  document.getElementById('scrim').addEventListener('click', closeDrawer);

  // Close a drawer and, if we're on a detail route, return to the tab's list URL.
  function closeDrawer() {
    S.drawer = null;
    const p = location.pathname;
    if (p.startsWith('/stock/')) history.pushState({}, '', '/stocks');
    else if (p.startsWith('/portfolio/')) history.pushState({}, '', '/portfolios');
    renderDrawer();
  }

  function toggleFollow(id) { S.follows.has(id) ? S.follows.delete(id) : S.follows.add(id); }
  function toggleSelect(name) { const i = S.selected.indexOf(name); if (i >= 0) S.selected.splice(i, 1); else if (S.selected.length < 2) S.selected.push(name); render(); }

  function closeMenus() { ['sortMenu', 'filterMenu'].forEach((id) => { const m = document.getElementById(id); if (m) m.innerHTML = ''; }); }
  function toggleMenu(which) {
    if (S.openMenu === which) { S.openMenu = null; closeMenus(); return; }
    S.openMenu = which; closeMenus();
    if (which === 'sort') {
      const isP = S.tab === 'portfolios';
      const opts = isP ? P_SUB.map(([k]) => [k, P_SORT[k]]) : [['value', 'so.value'], ['weight', 'so.weight'], ['filers', 'so.filers']];
      const cur = isP ? S.pMetric : S_SUB.find((x) => x[0] === S.sMetric)[3];
      document.getElementById('sortMenu').innerHTML = `<div class="mz-menu">${opts.map(([k, lk]) => `<button data-sortpick="${k}" aria-selected="${k === cur}">${t(lk)}${k === cur ? I.check : ''}</button>`).join('')}</div>`;
    } else if (which === 'filter') {
      const isP = S.tab === 'portfolios';
      document.getElementById('filterMenu').innerHTML = `<div class="mz-menu">
        <button data-fc="all" aria-selected="${S.compliance === 'all'}">${t('v.compliant')} + ${t('v.purify')} + …</button>
        <button data-fc="fully" aria-selected="${S.compliance === 'fully'}">${t('v.compliant')} only</button>
        <button data-fc="exclude" aria-selected="${S.compliance === 'exclude'}">${t('v.compliant')} + ${t('v.purify')}</button>
        ${!isP ? `<div style="border-top:var(--mz-border);margin:.35rem 0"></div>${['all', 'high', 'medium', 'low'].map((k) => `<button data-fe="${k}" aria-selected="${S.evFilter === k}">${k === 'all' ? t('h.evidence') + ': ' + t('c.filter') : t('ev.' + k) + ' ' + t('h.evidence').toLowerCase()}</button>`).join('')}` : ''}
        <div style="border-top:var(--mz-border);margin:.35rem 0"></div>
        <button data-fo="1" aria-selected="${S.followedOnly}">${t('tab.following')} only</button>
      </div>`;
    }
    // 'why' handled as a menu on the whyBtn
    if (which === 'why') { S.openMenu = null; const isP = S.tab === 'portfolios'; alertWhy(isP); }
  }
  function alertWhy() {
    const isP = S.tab === 'portfolios';
    const key = isP ? P_SORT[S.pMetric] : S_SORT[S_SUB.find((x) => x[0] === S.sMetric)[3]];
    const msg = isP
      ? `Ranked by ${t(key).toLowerCase()} for the selected period — a neutral, evidence-only figure from disclosed data. Never a Sharia signal, never a prediction.`
      : `Ranked by ${t(key).toLowerCase()}. Disclosed value is summed disclosed dollars; filers is the number of independent disclosing investors; evidence strength grows with independent, consistent, fresh filings.`;
    window.alert(t('c.why') + '\n\n' + msg);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sortpick],[data-fc],[data-fe],[data-fo]');
    if (!b) return;
    if (b.dataset.sortpick) { if (S.tab === 'portfolios') S.pMetric = b.dataset.sortpick; else { const cfg = S_SUB.find((x) => x[3] === b.dataset.sortpick); if (cfg) S.sMetric = cfg[0]; } }
    if (b.dataset.fc) S.compliance = b.dataset.fc;
    if (b.dataset.fe) S.evFilter = b.dataset.fe;
    if (b.dataset.fo) S.followedOnly = !S.followedOnly;
    S.openMenu = null; render();
  });

  /* ---------------------------------------------------------------- boot */
  parsePath(); render(); load();
})();

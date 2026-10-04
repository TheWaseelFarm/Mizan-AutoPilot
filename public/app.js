/* Mizān web terminal — vanilla JS front-end rendering the page-scoped design systems (styles/*.css).
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
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg>',
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
    caretUp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l6 9H6z"/></svg>',
    caretDown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l-6-9h12z"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  };

  /* ---------------------------------------------------------------- i18n */
  const STR = {
    en: {
      'tab.portfolios': 'Portfolios', 'tab.stocks': 'Stocks', 'tab.following': 'Following', 'tab.alerts': 'Alerts', 'tab.account': 'Account',
      'p.title': 'Portfolio intelligence', 'p.sub': 'Track performance, activity, holdings and recent changes across monitored portfolios.',
      's.title': 'Stock intelligence', 's.sub': 'Read the capital flows. Evaluate the evidence.',
      'sv.top': 'Top performers', 'sv.active': 'Most active', 'sv.followed': 'Most followed', 'sv.alloc': 'Highest included allocation', 'sv.conc': 'Most concentrated', 'sv.lag': 'Fastest to disclose',
      'so.conc': 'Concentration (HHI)', 'so.lag': 'Disclosure lag',
      'sv.bought': 'Most bought', 'sv.sold': 'Most sold', 'sv.flow': 'Net flow', 'sv.new': 'New positions', 'sv.incr': 'Increased', 'sv.red': 'Reduced', 'sv.exit': 'Exited',
      'so.net': 'Absolute net flow', 'flow.note': 'Net flow = gross buying − gross selling over the disclosed window. Excluded names stay visible for market awareness but are never actionable. Informational only — not advice.',
      'c.filter': 'Filter', 'c.sort': 'Sort', 'c.compare': 'Compare', 'c.why': 'Why this ranking?', 'c.clear': 'Clear all', 'c.search': 'Search portfolios, investors or stocks',
      'so.return': 'Disclosed return', 'so.activity': 'Disclosed activity', 'so.followers': 'Followers', 'so.alloc': 'Included allocation',
      'so.value': 'Disclosed value', 'so.weight': 'Position weight', 'so.filers': 'Number of filers',
      'v.compliant': 'Included', 'v.purify': 'Watch', 'v.noncompliant': 'Excluded', 'v.review': 'Pending',
      'f.all': 'All names', 'f.fully': 'Included only', 'f.exclude': 'Hide excluded', 'f.evAll': 'Any evidence strength',
      'h.rank': 'Rank', 'h.portfolio': 'Portfolio / filer', 'h.type': 'Type', 'h.return': 'Disclosed return', 'h.activity': 'Activity',
      'h.freshness': 'Evidence freshness', 'h.allocation': 'Included allocation', 'h.purify': 'Purification', 'h.followers': 'Followers',
      'h.stock': 'Stock & company', 'h.signal': 'Signal / activity', 'h.evidence': 'Evidence', 'h.filers': 'Filers', 'h.value': 'Disclosed value', 'h.since': 'Since disclosed', 'h.status': 'Mizan Status',
      'ev.high': 'High', 'ev.medium': 'Medium', 'ev.low': 'Low',
      'cmp.title': 'Compare portfolios', 'cmp.return': 'Disclosed return', 'cmp.disclosures': 'Disclosures', 'cmp.alloc': 'Included allocation', 'cmp.purify': 'Purification exposure', 'cmp.followers': 'Followers', 'cmp.open': 'Open comparison', 'cmp.tray': 'Compare {n} portfolios', 'cmp.pick': 'Select one more to compare', 'cmp.note': 'All metrics use the latest disclosed filings. Not investment advice.',
      'ev.title': '{t} evidence', 'ev.why': 'Why {s} evidence?', 'ev.review': 'Review full evidence', 'ev.recent': 'Recent filer activity', 'ev.setalert': 'Set alert',
      'g.portfolios': 'Rankings reflect disclosed data and calculated metrics for the selected period. Informational only — not advice to buy or sell.',
      'g.disclaimer': 'Screening based on AAOIFI Standard No. 21. Informational only — past disclosed-holdings evidence; each disclosure arrives after the trade (filing lag shown on every row). Not investment advice, brokerage, or a fatwa.',
      'meta.count': '{n} shown', 'live': 'Delayed data', 'sample': 'Sample data', 'freshUpdated': 'Updated',
      'empty.title': 'Nothing matches these filters', 'empty.body': 'Try clearing a filter or widening the time period.',
      'acct.title': 'Account', 'acct.lang': 'Language', 'follow.title': 'Following', 'alerts.title': 'Alerts',
      'common.follow': 'Follow', 'common.following': 'Following', 'common.watch': 'Watch',
      'dtl.portfolio': 'Portfolio', 'dtl.stock': 'Stock', 'dtl.return': 'Disclosed return', 'dtl.returnSub': 'Disclosed-holdings performance',
      'dtl.pending': 'Pending', 'dtl.pendingSub': 'Not enough price history yet', 'dtl.attention': 'Attention',
      'dtl.indicativeSub': 'Indicative · disclosed return, price history pending', 'dtl.weight': 'weight', 'dtl.disclosed': 'disclosed', 'dtl.bought': 'Bought', 'dtl.sold': 'Sold', 'dtl.filedLater': 'filed {n}d later',
      'dtl.followers': 'followers', 'dtl.disclosures': 'disclosures', 'dtl.buyers': 'filers buying', 'dtl.filers': 'total filers',
      'dtl.perf': 'Performance', 'dtl.holdings': 'Top holdings', 'dtl.who': 'Who bought & sold', 'dtl.activity': 'Activity log',
      'dtl.nojudge': 'Not enough data yet to judge.', 'dtl.evNote': 'Disclosed-holdings evidence; each disclosure arrives after the trade (its filing lag is shown). Informational only — not advice or a recommendation to follow.',
      'dtl.compNote': 'Mizan Status is shown as a compact label (AAOIFI Standard No. 21). Screening is a filter you apply elsewhere — it does not change the performance shown.',
      'sec.methodology': 'Methodology', 'sec.mtext': 'Screening follows AAOIFI Shariah Standard No. 21 — the current "30/30/5" rule. Two screens, both required: (1) permissible business activity, and (2) financial ratios vs. market capitalization — interest-bearing debt < 30%, cash + interest-bearing securities < 30%, and non-permissible income < 5% of revenue. Over any limit is Non-compliant. Some impure income (0–5%) is Compliant · purify — you purify that share of dividends. (The 33% figure used by some index providers is not AAOIFI.)',
    },
    ar: {
      'tab.portfolios': 'المحافظ', 'tab.stocks': 'الأسهم', 'tab.following': 'متابعاتي', 'tab.alerts': 'التنبيهات', 'tab.account': 'الحساب',
      'p.title': 'متابعة المحافظ', 'p.sub': 'قارن أداء المحافظ وتداولاتها وأسهمها.',
      's.title': 'متابعة الأسهم', 's.sub': 'اطّلع على الشراء والبيع وراجع الإفصاحات.',
      'sv.top': 'الأفضل أداءً', 'sv.active': 'الأكثر نشاطًا', 'sv.followed': 'الأكثر متابعة', 'sv.alloc': 'أعلى نسبة للأسهم المتوافقة', 'sv.conc': 'الأعلى تركّزًا', 'sv.lag': 'الأسرع إفصاحًا',
      'so.conc': 'تركّز المحفظة', 'so.lag': 'مدة تأخر الإفصاح',
      'sv.bought': 'الأكثر شراءً', 'sv.sold': 'الأكثر بيعًا', 'sv.flow': 'صافي التدفق', 'sv.new': 'استثمارات جديدة', 'sv.incr': 'زيادة الاستثمار', 'sv.red': 'تقليل الاستثمار', 'sv.exit': 'بيع كامل الاستثمار',
      'so.net': 'حجم صافي الشراء أو البيع', 'flow.note': 'صافي التدفق = إجمالي الشراء − إجمالي البيع خلال فترة الإفصاح. تظهر الأسهم غير المتوافقة للاطلاع على حركة السوق فقط. لأغراض معلوماتية فقط — ليست نصيحة استثمارية.',
      'c.filter': 'تصفية', 'c.sort': 'ترتيب', 'c.compare': 'مقارنة', 'c.why': 'لماذا هذا الترتيب؟', 'c.clear': 'مسح الكل', 'c.search': 'ابحث عن محفظة أو مستثمر أو سهم',
      'so.return': 'العائد حسب الإفصاحات', 'so.activity': 'التداولات المعلنة', 'so.followers': 'المتابِعون', 'so.alloc': 'نسبة الأسهم المتوافقة',
      'so.value': 'قيمة التداولات المعلنة', 'so.weight': 'نسبة السهم في المحفظة', 'so.filers': 'عدد المستثمرين',
      'v.compliant': 'متوافق', 'v.purify': 'يحتاج تطهيرًا', 'v.noncompliant': 'غير متوافق', 'v.review': 'قيد الفحص',
      'f.all': 'جميع الأسهم', 'f.fully': 'المتوافقة فقط', 'f.exclude': 'إخفاء غير المتوافقة', 'f.evAll': 'كل مستويات قوة البيانات',
      'h.rank': 'الترتيب', 'h.portfolio': 'المحفظة / المستثمر', 'h.type': 'النوع', 'h.return': 'العائد حسب الإفصاحات', 'h.activity': 'النشاط',
      'h.freshness': 'تاريخ الإفصاح', 'h.allocation': 'نسبة الأسهم المتوافقة', 'h.purify': 'التطهير', 'h.followers': 'المتابِعون',
      'h.stock': 'السهم والشركة', 'h.signal': 'ملخص التداولات', 'h.evidence': 'قوة البيانات', 'h.filers': 'عدد المستثمرين', 'h.value': 'قيمة التداولات المعلنة', 'h.since': 'منذ الإفصاح', 'h.status': 'التوافق الشرعي',
      'ev.high': 'قوية', 'ev.medium': 'متوسطة', 'ev.low': 'ضعيفة',
      'cmp.title': 'مقارنة المحافظ', 'cmp.return': 'العائد حسب الإفصاحات', 'cmp.disclosures': 'الإفصاحات', 'cmp.alloc': 'نسبة الأسهم المتوافقة', 'cmp.purify': 'نسبة الأسهم التي تحتاج تطهيرًا', 'cmp.followers': 'المتابِعون', 'cmp.open': 'فتح المقارنة', 'cmp.tray': 'محافظ للمقارنة: {n}', 'cmp.pick': 'اختر محفظة أخرى للمقارنة', 'cmp.note': 'تستند جميع المقاييس إلى أحدث الإفصاحات المنشورة. لأغراض معلوماتية فقط — ليست نصيحة استثمارية.',
      'ev.title': 'قوة البيانات: {t}', 'ev.why': 'لماذا قوة البيانات «{s}»؟', 'ev.review': 'عرض التفاصيل', 'ev.recent': 'أحدث تداولات المستثمرين', 'ev.setalert': 'إنشاء تنبيه',
      'g.portfolios': 'يعكس الترتيب البيانات المعلنة والحسابات للفترة المحددة. لأغراض معلوماتية فقط — ليست نصيحة استثمارية.',
      'g.disclaimer': 'الفحص وفق المعيار الشرعي رقم 21 من أيوفي. البيانات من إفصاحات سابقة، وقد تُنشر بعد التداول بفترة. نوضح مدة التأخر في كل سطر. لأغراض معلوماتية فقط — ليست نصيحة استثمارية أو خدمة وساطة أو فتوى.',
      'meta.count': 'النتائج المعروضة: {n}', 'live': 'بيانات متأخرة', 'sample': 'بيانات نموذجية', 'freshUpdated': 'آخر تحديث',
      'empty.title': 'لا توجد نتائج بهذا الاختيار', 'empty.body': 'غيّر التصفية أو اختر فترة أطول.',
      'acct.title': 'الحساب', 'acct.lang': 'اللغة', 'follow.title': 'متابعاتي', 'alerts.title': 'التنبيهات',
      'common.follow': 'متابعة', 'common.following': 'تتم المتابعة', 'common.watch': 'متابعة',
      'dtl.portfolio': 'المحفظة', 'dtl.stock': 'السهم', 'dtl.return': 'العائد حسب الإفصاحات', 'dtl.returnSub': 'أداء الأسهم في الإفصاحات',
      'dtl.pending': 'بانتظار البيانات', 'dtl.pendingSub': 'سجل الأسعار غير كافٍ بعد', 'dtl.attention': 'اهتمام المتابعين',
      'dtl.indicativeSub': 'عائد تقديري حسب الإفصاحات · سجل الأسعار غير متاح بعد', 'dtl.weight': 'النسبة من المحفظة', 'dtl.disclosed': 'الإفصاح بتاريخ', 'dtl.bought': 'شراء', 'dtl.sold': 'بيع', 'dtl.filedLater': 'تأخر الإفصاح بالأيام: {n}',
      'dtl.followers': 'عدد المتابعين', 'dtl.disclosures': 'عدد الإفصاحات', 'dtl.buyers': 'عدد المشترين', 'dtl.filers': 'إجمالي المستثمرين',
      'dtl.perf': 'الأداء', 'dtl.holdings': 'أكبر الاستثمارات', 'dtl.who': 'مَن اشترى وباع', 'dtl.activity': 'سجل النشاط',
      'dtl.nojudge': 'البيانات غير كافية للتقييم بعد.', 'dtl.evNote': 'البيانات من إفصاحات سابقة، وقد تُنشر بعد التداول بفترة. نوضح مدة التأخر. لأغراض معلوماتية فقط — ليست نصيحة استثمارية أو توصية بمتابعة مستثمر.',
      'dtl.compNote': 'نتيجة الفحص وفق المعيار الشرعي رقم 21 من أيوفي. استخدم التصفية لاختيار حالة التوافق. التصفية لا تغيّر العائد المعروض.',
      'sec.methodology': 'المنهجية', 'sec.mtext': 'نفحص الأسهم وفق المعيار الشرعي رقم 21 من أيوفي، بقاعدة 30/30/5. يجب أن يجتاز السهم فحص النشاط التجاري والنسب المالية معًا. الديون بفائدة أقل من 30% من القيمة السوقية. النقد والأوراق المالية بفائدة أقل من 30% من القيمة السوقية. الدخل غير المباح أقل من 5% من الإيرادات. عدم اجتياز أي شرط يعني أن السهم غير متوافق. إذا اجتاز السهم الفحص وكان لديه دخل غير مباح محدود (0–5%)، فيحتاج تطهيرًا: إخراج الحصة المقابلة من توزيعات الأرباح. نسبة 33% المستخدمة في بعض المؤشرات ليست معيار أيوفي.',
    },
  };
  // Arabic is the default language; an explicit choice is remembered per browser.
  let LANG = 'ar';
  try { const saved = localStorage.getItem('mz_lang'); if (saved === 'en' || saved === 'ar') LANG = saved; } catch (e) { /* private mode */ }
  const setLang = (l) => { LANG = l; try { localStorage.setItem('mz_lang', l); } catch (e) { /* private mode */ } };
  let THEME = 'light';
  try { THEME = localStorage.getItem('mz_theme') === 'dark' ? 'dark' : 'light'; } catch (e) { /* private mode */ }
  document.documentElement.dataset.theme = THEME;
  const t = (k, vars) => { let s = (STR[LANG] && STR[LANG][k]) || STR.en[k] || k; if (vars) for (const n in vars) s = s.replace('{' + n + '}', vars[n]); return s; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ─── Data interface — TODO: confirm these map to the real /api/feed + /api/prices contract ───
     The brief asks every number to carry context (weight, disclosure date, timeframe return).
     Until the backend field/endpoint names are frozen, map them ONCE here and read via FIELD.* */
  const FIELD = {
    amount: 'amountMid',            // disclosed trade value (mid of a disclosed range)
    positionValue: 'positionValue', // filer's disclosed position size (basis for %-of-position)
    disclosedDate: 'transactionDate', // when the trade happened / was disclosed ("disclosed Jun 2")
    filedDate: 'filingDate',        // when it was filed (drives the filing-lag figure)
    priceHistory: 'history',        // S.prices[TICKER][FIELD.priceHistory] = [{ d, c }]
    bioguide: 'bioguideId',         // TODO: Congress member id (Quiver "BioGuideID") -> official public-domain portrait
  };
  const MIN_HOLDINGS = 3;           // product-bible gate: ≥3 distinct disclosed names
  const fAmt = (r) => Math.abs(+r[FIELD.amount] || 0);
  const hasAmount = (r) => r[FIELD.amount] != null && r[FIELD.amount] !== '' && isFinite(+r[FIELD.amount]);
  const disclosedMoney = (r) => hasAmount(r) ? fmtMoney(fAmt(r)) : '—';
  // Weight basis: prefer the filer's exact disclosed POSITION size (13F) for a true portfolio
  // weight; fall back to trade value (amountMid) for congressional/insider filings, which only
  // report dollar RANGES — there the weight is a rough share of disclosed trades, not a holding %.
  const fWeightBasis = (r) => { const pv = r[FIELD.positionValue]; return Math.abs(+(pv == null ? r[FIELD.amount] : pv) || 0); };
  const fDisclosed = (r) => r[FIELD.disclosedDate];
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  // Strip source artifacts from a company name, e.g. "Exxon Mobil Corp (1)" -> "Exxon Mobil Corp".
  const coName = (c) => String(c || '').replace(/\s*\(\d+\)\s*$/, '').trim();

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
  // Mizan Status pill — redesign package `.status` states: included / watch / excluded / pending.
  const STATUS_CLS = { clean: 'included', purify: 'watch', fail: 'excluded', unscreened: 'pending' };
  const badge = (label, text) => { const v = VER[label] || VER.unscreened; const s = text || (LANG === 'ar' ? t(v.k) : t(v.k).toUpperCase()); return `<span class="status ${STATUS_CLS[label] || 'pending'}" title="${LANG === 'ar' ? 'المعيار الشرعي رقم 21 من أيوفي' : 'AAOIFI Standard No. 21'}">${esc(s)}</span>`; };

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
    // Additional disclosures so the demo funds clear the min-holdings gate (≥3 distinct names).
    // The Insider (TSLA-only) is left as a single-holding entry — the excluded thin example.
    { id: 10, actor: 'Renaissance Technologies', kind: '13F Fund', initials: 'RT', source: '13F-HR', side: 'BUY', ticker: 'MSFT', company: 'Microsoft Corp.', amountMid: 96000, positionValue: 96000, transactionDate: 'Jun 12, 2026', filingDate: 'Jun 24, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 11, screened: true },
    { id: 11, actor: 'Renaissance Technologies', kind: '13F Fund', initials: 'RT', source: '13F-HR', side: 'BUY', ticker: 'COST', company: 'Costco Wholesale', amountMid: 41000, positionValue: 41000, transactionDate: 'Jun 03, 2026', filingDate: 'Jun 18, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 9, screened: true },
    { id: 12, actor: 'Global Value Fund', kind: '13F Fund', initials: 'GV', source: '13F-HR', side: 'BUY', ticker: 'NVDA', company: 'NVIDIA Corp.', amountMid: 58000, positionValue: 58000, transactionDate: 'Jun 07, 2026', filingDate: 'Jun 20, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 3.2, screened: true },
    { id: 13, actor: 'Global Value Fund', kind: '13F Fund', initials: 'GV', source: '13F-HR', side: 'BUY', ticker: 'MSFT', company: 'Microsoft Corp.', amountMid: 88000, positionValue: 88000, transactionDate: 'May 28, 2026', filingDate: 'Jun 16, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 11, screened: true },
    { id: 14, actor: 'Northstar Quant Partners', kind: '13F Fund', initials: 'NQ', source: '13F-HR', side: 'BUY', ticker: 'GOOGL', company: 'Alphabet Inc.', amountMid: 112000, positionValue: 112000, transactionDate: 'Jun 06, 2026', filingDate: 'Jun 19, 2026', businessStatus: 'watch', impurePct: 1.7, debtRatio: 3, screened: true },
    { id: 15, actor: 'Northstar Quant Partners', kind: '13F Fund', initials: 'NQ', source: '13F-HR', side: 'BUY', ticker: 'COST', company: 'Costco Wholesale', amountMid: 54000, positionValue: 54000, transactionDate: 'May 26, 2026', filingDate: 'Jun 15, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 9, screened: true },
    { id: 16, actor: 'Public Official Filing', kind: 'Congress', initials: 'PO', source: 'House PTR', side: 'BUY', ticker: 'MSFT', company: 'Microsoft Corp.', amountMid: 45000, transactionDate: 'May 24, 2026', filingDate: 'Jun 14, 2026', businessStatus: 'pass', impurePct: 0, debtRatio: 11, screened: true },
  ].map((r) => ({ ...r, label: labelOf(r) }));

  // Sample price fixture — DEMO DATA, not live quotes. Deterministic, plausible weekly
  // closes so the performance hero renders in the sample (non-live) state; the UI shows
  // "Sample data" whenever S.live is false. Replaced entirely by /api/prices when the
  // backend is configured. Shape: S.prices[TICKER] = { quote, history:[{d,c}] }.
  const SAMPLE_PRICES = {
    NVDA: { quote: 171, history: [{d:'2025-07-17',c:94.97},{d:'2025-07-24',c:98.26},{d:'2025-07-31',c:100.9},{d:'2025-08-07',c:104.34},{d:'2025-08-14',c:103.72},{d:'2025-08-21',c:106.28},{d:'2025-08-28',c:103.45},{d:'2025-09-04',c:107.1},{d:'2025-09-11',c:108.84},{d:'2025-09-18',c:112.28},{d:'2025-09-25',c:117.35},{d:'2025-10-02',c:119.01},{d:'2025-10-09',c:120.16},{d:'2025-10-16',c:124.85},{d:'2025-10-23',c:127.18},{d:'2025-10-30',c:129.58},{d:'2025-11-06',c:132.36},{d:'2025-11-13',c:128.78},{d:'2025-11-20',c:134.15},{d:'2025-11-27',c:133.62},{d:'2025-12-04',c:133.68},{d:'2025-12-11',c:130.9},{d:'2025-12-18',c:132.33},{d:'2025-12-25',c:131.79},{d:'2026-01-01',c:129.84},{d:'2026-01-08',c:125.92},{d:'2026-01-15',c:124.01},{d:'2026-01-22',c:125.93},{d:'2026-01-29',c:129.6},{d:'2026-02-05',c:128.49},{d:'2026-02-12',c:127.65},{d:'2026-02-19',c:123.74},{d:'2026-02-26',c:129.08},{d:'2026-03-05',c:125.56},{d:'2026-03-12',c:130.04},{d:'2026-03-19',c:126.37},{d:'2026-03-26',c:127.77},{d:'2026-04-02',c:129.91},{d:'2026-04-09',c:132.65},{d:'2026-04-16',c:135.43},{d:'2026-04-23',c:140.31},{d:'2026-04-30',c:143.33},{d:'2026-05-07',c:147.49},{d:'2026-05-14',c:144.37},{d:'2026-05-21',c:140.07},{d:'2026-05-28',c:137.56},{d:'2026-06-04',c:135.78},{d:'2026-06-11',c:137.22},{d:'2026-06-18',c:142.67},{d:'2026-06-25',c:142.22},{d:'2026-07-02',c:138.94},{d:'2026-07-09',c:141.59},{d:'2026-07-16',c:146.82},{d:'2026-07-23',c:148.71},{d:'2026-07-30',c:146.57},{d:'2026-08-06',c:151.32},{d:'2026-08-13',c:150.09},{d:'2026-08-20',c:154.64},{d:'2026-08-27',c:160.18},{d:'2026-09-03',c:163.25},{d:'2026-09-10',c:163.09},{d:'2026-09-17',c:165.84},{d:'2026-09-24',c:171.84},{d:'2026-10-01',c:171}] },
    AVGO: { quote: 338, history: [{d:'2025-07-17',c:267.78},{d:'2025-07-24',c:270.45},{d:'2025-07-31',c:269.28},{d:'2025-08-07',c:279.48},{d:'2025-08-14',c:274.77},{d:'2025-08-21',c:272.2},{d:'2025-08-28',c:275},{d:'2025-09-04',c:285.76},{d:'2025-09-11',c:294.74},{d:'2025-09-18',c:301.04},{d:'2025-09-25',c:294.14},{d:'2025-10-02',c:284.56},{d:'2025-10-09',c:286.15},{d:'2025-10-16',c:285.67},{d:'2025-10-23',c:296.59},{d:'2025-10-30',c:291.43},{d:'2025-11-06',c:294.1},{d:'2025-11-13',c:297.2},{d:'2025-11-20',c:301.61},{d:'2025-11-27',c:297.3},{d:'2025-12-04',c:292.6},{d:'2025-12-11',c:287.01},{d:'2025-12-18',c:283.2},{d:'2025-12-25',c:286.24},{d:'2026-01-01',c:297.82},{d:'2026-01-08',c:301.79},{d:'2026-01-15',c:308.48},{d:'2026-01-22',c:306.9},{d:'2026-01-29',c:312.57},{d:'2026-02-05',c:318.67},{d:'2026-02-12',c:325.86},{d:'2026-02-19',c:332.17},{d:'2026-02-26',c:321.96},{d:'2026-03-05',c:320.18},{d:'2026-03-12',c:319.86},{d:'2026-03-19',c:314.45},{d:'2026-03-26',c:314.16},{d:'2026-04-02',c:309.92},{d:'2026-04-09',c:321.59},{d:'2026-04-16',c:330.48},{d:'2026-04-23',c:332.52},{d:'2026-04-30',c:337.96},{d:'2026-05-07',c:331.35},{d:'2026-05-14',c:337.83},{d:'2026-05-21',c:336.73},{d:'2026-05-28',c:338.27},{d:'2026-06-04',c:345.76},{d:'2026-06-11',c:340.01},{d:'2026-06-18',c:333.75},{d:'2026-06-25',c:328.02},{d:'2026-07-02',c:329.62},{d:'2026-07-09',c:323.8},{d:'2026-07-16',c:316.24},{d:'2026-07-23',c:322.02},{d:'2026-07-30',c:317.39},{d:'2026-08-06',c:313.38},{d:'2026-08-13',c:311.14},{d:'2026-08-20',c:305.92},{d:'2026-08-27',c:314.78},{d:'2026-09-03',c:319.15},{d:'2026-09-10',c:330.68},{d:'2026-09-17',c:331.13},{d:'2026-09-24',c:329.85},{d:'2026-10-01',c:338}] },
    JPM: { quote: 291, history: [{d:'2025-07-17',c:278.89},{d:'2025-07-24',c:274.72},{d:'2025-07-31',c:270.4},{d:'2025-08-07',c:272.08},{d:'2025-08-14',c:275.88},{d:'2025-08-21',c:272.65},{d:'2025-08-28',c:278.35},{d:'2025-09-04',c:277.27},{d:'2025-09-11',c:272.1},{d:'2025-09-18',c:275.39},{d:'2025-09-25',c:278.59},{d:'2025-10-02',c:278.59},{d:'2025-10-09',c:284.99},{d:'2025-10-16',c:282.1},{d:'2025-10-23',c:287.24},{d:'2025-10-30',c:282.16},{d:'2025-11-06',c:281.12},{d:'2025-11-13',c:287.8},{d:'2025-11-20',c:289.06},{d:'2025-11-27',c:290.68},{d:'2025-12-04',c:296.09},{d:'2025-12-11',c:294.77},{d:'2025-12-18',c:294.3},{d:'2025-12-25',c:295.27},{d:'2026-01-01',c:299.31},{d:'2026-01-08',c:306.02},{d:'2026-01-15',c:308.02},{d:'2026-01-22',c:312.37},{d:'2026-01-29',c:310.73},{d:'2026-02-05',c:309.4},{d:'2026-02-12',c:312.78},{d:'2026-02-19',c:315.1},{d:'2026-02-26',c:315.64},{d:'2026-03-05',c:319.93},{d:'2026-03-12',c:314.96},{d:'2026-03-19',c:313.24},{d:'2026-03-26',c:310.06},{d:'2026-04-02',c:305.83},{d:'2026-04-09',c:301.34},{d:'2026-04-16',c:299.17},{d:'2026-04-23',c:294.22},{d:'2026-04-30',c:288.56},{d:'2026-05-07',c:289.32},{d:'2026-05-14',c:291.55},{d:'2026-05-21',c:287.11},{d:'2026-05-28',c:289.14},{d:'2026-06-04',c:292.26},{d:'2026-06-11',c:291.57},{d:'2026-06-18',c:286.65},{d:'2026-06-25',c:287.15},{d:'2026-07-02',c:285.14},{d:'2026-07-09',c:290.96},{d:'2026-07-16',c:293.36},{d:'2026-07-23',c:290.12},{d:'2026-07-30',c:291.39},{d:'2026-08-06',c:287.27},{d:'2026-08-13',c:287.33},{d:'2026-08-20',c:293.19},{d:'2026-08-27',c:289.45},{d:'2026-09-03',c:284.33},{d:'2026-09-10',c:290.25},{d:'2026-09-17',c:290.47},{d:'2026-09-24',c:286.43},{d:'2026-10-01',c:291}] },
    XOM: { quote: 116, history: [{d:'2025-07-17',c:93.82},{d:'2025-07-24',c:96.11},{d:'2025-07-31',c:96.96},{d:'2025-08-07',c:94.67},{d:'2025-08-14',c:94.64},{d:'2025-08-21',c:92.81},{d:'2025-08-28',c:93.48},{d:'2025-09-04',c:93.49},{d:'2025-09-11',c:93.88},{d:'2025-09-18',c:96.13},{d:'2025-09-25',c:97.51},{d:'2025-10-02',c:95.73},{d:'2025-10-09',c:93.65},{d:'2025-10-16',c:95.25},{d:'2025-10-23',c:93.58},{d:'2025-10-30',c:92.19},{d:'2025-11-06',c:91.72},{d:'2025-11-13',c:89.93},{d:'2025-11-20',c:89.38},{d:'2025-11-27',c:91.66},{d:'2025-12-04',c:90.55},{d:'2025-12-11',c:90.77},{d:'2025-12-18',c:91.39},{d:'2025-12-25',c:93.46},{d:'2026-01-01',c:94.73},{d:'2026-01-08',c:96.44},{d:'2026-01-15',c:95.72},{d:'2026-01-22',c:96.08},{d:'2026-01-29',c:98.14},{d:'2026-02-05',c:96.53},{d:'2026-02-12',c:97.21},{d:'2026-02-19',c:95.16},{d:'2026-02-26',c:92.85},{d:'2026-03-05',c:94.95},{d:'2026-03-12',c:95.24},{d:'2026-03-19',c:93.74},{d:'2026-03-26',c:92.7},{d:'2026-04-02',c:92.33},{d:'2026-04-09',c:93.84},{d:'2026-04-16',c:96.17},{d:'2026-04-23',c:96.45},{d:'2026-04-30',c:96.59},{d:'2026-05-07',c:94.82},{d:'2026-05-14',c:96.74},{d:'2026-05-21',c:95.84},{d:'2026-05-28',c:95.09},{d:'2026-06-04',c:95.41},{d:'2026-06-11',c:94.48},{d:'2026-06-18',c:96.83},{d:'2026-06-25',c:96.16},{d:'2026-07-02',c:94.9},{d:'2026-07-09',c:96.59},{d:'2026-07-16',c:98.96},{d:'2026-07-23',c:100.6},{d:'2026-07-30',c:101.48},{d:'2026-08-06',c:103.14},{d:'2026-08-13',c:105.89},{d:'2026-08-20',c:108.12},{d:'2026-08-27',c:109.2},{d:'2026-09-03',c:108.81},{d:'2026-09-10',c:109.78},{d:'2026-09-17',c:111.87},{d:'2026-09-24',c:114.59},{d:'2026-10-01',c:116}] },
    MSFT: { quote: 512, history: [{d:'2025-07-17',c:476.65},{d:'2025-07-24',c:469.06},{d:'2025-07-31',c:469.5},{d:'2025-08-07',c:469.69},{d:'2025-08-14',c:473.49},{d:'2025-08-21',c:479.26},{d:'2025-08-28',c:488.85},{d:'2025-09-04',c:481.09},{d:'2025-09-11',c:489.1},{d:'2025-09-18',c:486.2},{d:'2025-09-25',c:486},{d:'2025-10-02',c:496.99},{d:'2025-10-09',c:508.83},{d:'2025-10-16',c:512.86},{d:'2025-10-23',c:515.22},{d:'2025-10-30',c:527.42},{d:'2025-11-06',c:522.87},{d:'2025-11-13',c:524.82},{d:'2025-11-20',c:534.05},{d:'2025-11-27',c:538.37},{d:'2025-12-04',c:531.1},{d:'2025-12-11',c:526.31},{d:'2025-12-18',c:520.2},{d:'2025-12-25',c:521.17},{d:'2026-01-01',c:522.25},{d:'2026-01-08',c:523.53},{d:'2026-01-15',c:529.67},{d:'2026-01-22',c:524.91},{d:'2026-01-29',c:518.04},{d:'2026-02-05',c:524.5},{d:'2026-02-12',c:525.85},{d:'2026-02-19',c:531.92},{d:'2026-02-26',c:540.49},{d:'2026-03-05',c:530.78},{d:'2026-03-12',c:540.68},{d:'2026-03-19',c:550.41},{d:'2026-03-26',c:558.91},{d:'2026-04-02',c:563.38},{d:'2026-04-09',c:564.3},{d:'2026-04-16',c:571.49},{d:'2026-04-23',c:563.92},{d:'2026-04-30',c:553.91},{d:'2026-05-07',c:556.42},{d:'2026-05-14',c:547.18},{d:'2026-05-21',c:550.89},{d:'2026-05-28',c:546.97},{d:'2026-06-04',c:540.27},{d:'2026-06-11',c:548.02},{d:'2026-06-18',c:541.61},{d:'2026-06-25',c:541.92},{d:'2026-07-02',c:535.75},{d:'2026-07-09',c:532.48},{d:'2026-07-16',c:532.35},{d:'2026-07-23',c:534.91},{d:'2026-07-30',c:530.93},{d:'2026-08-06',c:538.53},{d:'2026-08-13',c:533.17},{d:'2026-08-20',c:524.14},{d:'2026-08-27',c:518.32},{d:'2026-09-03',c:520.69},{d:'2026-09-10',c:516.42},{d:'2026-09-17',c:514.7},{d:'2026-09-24',c:509.88},{d:'2026-10-01',c:512}] },
    TSLA: { quote: 349, history: [{d:'2025-07-17',c:218.42},{d:'2025-07-24',c:214.75},{d:'2025-07-31',c:220.1},{d:'2025-08-07',c:209.01},{d:'2025-08-14',c:204.15},{d:'2025-08-21',c:203.14},{d:'2025-08-28',c:192.48},{d:'2025-09-04',c:196.64},{d:'2025-09-11',c:190.34},{d:'2025-09-18',c:196.96},{d:'2025-09-25',c:202.94},{d:'2025-10-02',c:196.17},{d:'2025-10-09',c:202.08},{d:'2025-10-16',c:211.3},{d:'2025-10-23',c:216.13},{d:'2025-10-30',c:209.52},{d:'2025-11-06',c:207.59},{d:'2025-11-13',c:205.48},{d:'2025-11-20',c:202.65},{d:'2025-11-27',c:210.35},{d:'2025-12-04',c:216.7},{d:'2025-12-11',c:228.52},{d:'2025-12-18',c:234.29},{d:'2025-12-25',c:225.32},{d:'2026-01-01',c:231.71},{d:'2026-01-08',c:241.67},{d:'2026-01-15',c:253.27},{d:'2026-01-22',c:251.1},{d:'2026-01-29',c:262.37},{d:'2026-02-05',c:269.69},{d:'2026-02-12',c:277.16},{d:'2026-02-19',c:289.12},{d:'2026-02-26',c:284.96},{d:'2026-03-05',c:294.97},{d:'2026-03-12',c:308.16},{d:'2026-03-19',c:296.77},{d:'2026-03-26',c:300.78},{d:'2026-04-02',c:311.21},{d:'2026-04-09',c:318.83},{d:'2026-04-16',c:330},{d:'2026-04-23',c:332.12},{d:'2026-04-30',c:327.98},{d:'2026-05-07',c:318.06},{d:'2026-05-14',c:325.78},{d:'2026-05-21',c:324.09},{d:'2026-05-28',c:323.28},{d:'2026-06-04',c:318.41},{d:'2026-06-11',c:327.38},{d:'2026-06-18',c:342.52},{d:'2026-06-25',c:337.13},{d:'2026-07-02',c:327.49},{d:'2026-07-09',c:342},{d:'2026-07-16',c:330.75},{d:'2026-07-23',c:349.49},{d:'2026-07-30',c:342.22},{d:'2026-08-06',c:336.59},{d:'2026-08-13',c:336.25},{d:'2026-08-20',c:341.34},{d:'2026-08-27',c:351.03},{d:'2026-09-03',c:364.3},{d:'2026-09-10',c:372.59},{d:'2026-09-17',c:354.01},{d:'2026-09-24',c:342.56},{d:'2026-10-01',c:349}] },
    GOOGL: { quote: 201, history: [{d:'2025-07-17',c:183.82},{d:'2025-07-24',c:181.62},{d:'2025-07-31',c:178.86},{d:'2025-08-07',c:178.85},{d:'2025-08-14',c:175.93},{d:'2025-08-21',c:179.84},{d:'2025-08-28',c:182.06},{d:'2025-09-04',c:182.44},{d:'2025-09-11',c:179.91},{d:'2025-09-18',c:180.93},{d:'2025-09-25',c:178.69},{d:'2025-10-02',c:174.46},{d:'2025-10-09',c:178.02},{d:'2025-10-16',c:179.61},{d:'2025-10-23',c:175.75},{d:'2025-10-30',c:180.39},{d:'2025-11-06',c:178.53},{d:'2025-11-13',c:175},{d:'2025-11-20',c:174.89},{d:'2025-11-27',c:176.38},{d:'2025-12-04',c:178.24},{d:'2025-12-11',c:179.73},{d:'2025-12-18',c:177.62},{d:'2025-12-25',c:177.11},{d:'2026-01-01',c:174.97},{d:'2026-01-08',c:174.54},{d:'2026-01-15',c:174.49},{d:'2026-01-22',c:178.85},{d:'2026-01-29',c:178.91},{d:'2026-02-05',c:175.04},{d:'2026-02-12',c:179.4},{d:'2026-02-19',c:175.23},{d:'2026-02-26',c:176.28},{d:'2026-03-05',c:173.65},{d:'2026-03-12',c:176.1},{d:'2026-03-19',c:180.74},{d:'2026-03-26',c:181.45},{d:'2026-04-02',c:185.76},{d:'2026-04-09',c:184.38},{d:'2026-04-16',c:184.17},{d:'2026-04-23',c:187.12},{d:'2026-04-30',c:189.46},{d:'2026-05-07',c:190.02},{d:'2026-05-14',c:190.44},{d:'2026-05-21',c:189.19},{d:'2026-05-28',c:189.5},{d:'2026-06-04',c:190.51},{d:'2026-06-11',c:185.84},{d:'2026-06-18',c:184.13},{d:'2026-06-25',c:189.73},{d:'2026-07-02',c:195.54},{d:'2026-07-09',c:192.01},{d:'2026-07-16',c:193.26},{d:'2026-07-23',c:193.13},{d:'2026-07-30',c:198.88},{d:'2026-08-06',c:204.73},{d:'2026-08-13',c:199.95},{d:'2026-08-20',c:198.97},{d:'2026-08-27',c:198.52},{d:'2026-09-03',c:199.53},{d:'2026-09-10',c:203.72},{d:'2026-09-17',c:200.54},{d:'2026-09-24',c:199.44},{d:'2026-10-01',c:201}] },
    COST: { quote: 952, history: [{d:'2025-07-17',c:878.35},{d:'2025-07-24',c:869.82},{d:'2025-07-31',c:887.95},{d:'2025-08-07',c:887.95},{d:'2025-08-14',c:905.84},{d:'2025-08-21',c:898.1},{d:'2025-08-28',c:896.86},{d:'2025-09-04',c:903.08},{d:'2025-09-11',c:912.85},{d:'2025-09-18',c:906.18},{d:'2025-09-25',c:921.52},{d:'2025-10-02',c:930.94},{d:'2025-10-09',c:918.37},{d:'2025-10-16',c:934.35},{d:'2025-10-23',c:940.27},{d:'2025-10-30',c:930.27},{d:'2025-11-06',c:933.15},{d:'2025-11-13',c:952.82},{d:'2025-11-20',c:972.52},{d:'2025-11-27',c:967.24},{d:'2025-12-04',c:987.85},{d:'2025-12-11',c:976.42},{d:'2025-12-18',c:969.68},{d:'2025-12-25',c:964.72},{d:'2026-01-01',c:968},{d:'2026-01-08',c:953.16},{d:'2026-01-15',c:970.01},{d:'2026-01-22',c:970.98},{d:'2026-01-29',c:973.4},{d:'2026-02-05',c:962.7},{d:'2026-02-12',c:952.7},{d:'2026-02-19',c:969.17},{d:'2026-02-26',c:966.78},{d:'2026-03-05',c:966.04},{d:'2026-03-12',c:954.68},{d:'2026-03-19',c:973.87},{d:'2026-03-26',c:969.21},{d:'2026-04-02',c:965.06},{d:'2026-04-09',c:962.28},{d:'2026-04-16',c:947.74},{d:'2026-04-23',c:954.74},{d:'2026-04-30',c:955.81},{d:'2026-05-07',c:959.55},{d:'2026-05-14',c:946.98},{d:'2026-05-21',c:954.06},{d:'2026-05-28',c:974.65},{d:'2026-06-04',c:970.66},{d:'2026-06-11',c:972.64},{d:'2026-06-18',c:975.48},{d:'2026-06-25',c:969.77},{d:'2026-07-02',c:971.53},{d:'2026-07-09',c:961.94},{d:'2026-07-16',c:961.7},{d:'2026-07-23',c:968.86},{d:'2026-07-30',c:957.51},{d:'2026-08-06',c:956.78},{d:'2026-08-13',c:957.63},{d:'2026-08-20',c:943.34},{d:'2026-08-27',c:933.96},{d:'2026-09-03',c:934.12},{d:'2026-09-10',c:946.08},{d:'2026-09-17',c:954.56},{d:'2026-09-24',c:948.1},{d:'2026-10-01',c:952}] }
  };

  /* ---------------------------------------------------------------- derivation */
  const groupOf = (kind) => { const s = (kind || '').toLowerCase(); return s.includes('insider') ? 'insider' : (s.includes('congress') || s.includes('official') || s.includes('senate') || s.includes('house')) ? 'official' : 'fund'; };
  const typeLabel = (kind) => (LANG === 'ar' ? { insider: 'مطلع', official: 'مسؤول', fund: 'صندوق' } : { insider: 'Insider', official: 'Official', fund: 'Fund' })[groupOf(kind)];
  const groupIcon = (g) => ({ fund: I.building, official: I.landmark, insider: I.briefcase }[g] || I.building);
  const fmtMoney = (v) => { const n = Math.abs(v); if (LANG === 'ar') return '\u2066' + (n >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v)) + '\u2069'; return n >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v); };
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
      p.hhi = concentration(p); // Herfindahl concentration of ownable holdings (0–1)
      const lags = p.rows.map((r) => daysBetween(r.transactionDate, r.filingDate)).filter((x) => x != null);
      p.avgLag = lags.length ? Math.round(lags.reduce((a, b) => a + b, 0) / lags.length) : null; // avg filing lag (days)
      const hn = heldNames(p.rows); p.heldMap = hn.held; p.exitedMap = hn.exited;
      p.holdings = hn.held.size; // names STILL HELD (min-holdings gate); fully-sold names are exits, not holdings
      p.ret = returnOf(portfolioIndexHist(p.rows), p.perf); // timeframe-aware return (carries context)
    }
    return [...m.values()];
  }
  const portfolioFlag = (p) => p.mix.fail > 0 ? { text: 'Contains non-compliant names', tone: 'fail' } : p.mix.purify > 0 ? { text: `Mostly compliant · ${p.mix.purify} to purify`, tone: 'purify' } : { text: 'Fully compliant', tone: 'clean' };

  /* --- Decision-support synthesis: turn the raw disclosures into a plain-language "read" +
     scannable signal tags, so a user can judge a setup at a glance instead of parsing columns. */
  const sideUp = (s) => String(s).toUpperCase() !== 'SELL';
  const localizedSignal = (text) => LANG === 'ar' ? ({ 'Cluster buy': 'شراء جماعي', 'Cluster sell': 'بيع جماعي', 'Sole filer': 'مستثمر واحد', 'Two-sided': 'شراء وبيع', 'Fresh': 'حديث', 'Top performer': 'أداء متميز', 'Active': 'نشط', 'Concentrated': 'عالي التركّز', 'Diversified': 'متنوع' }[text] || text) : text;

  function stockRead(ticker) {
    const rows = S.rows.filter((r) => r.ticker === ticker);
    if (!rows.length) return { sentence: '', tags: [] };
    const buyers = new Set(rows.filter((r) => sideUp(r.side)).map((r) => r.actor)).size;
    const sellers = new Set(rows.filter((r) => !sideUp(r.side)).map((r) => r.actor)).size;
    const filers = new Set(rows.map((r) => r.actor)).size;
    const buy = rows.filter((r) => sideUp(r.side)).reduce((a, r) => a + Math.abs(+r.amountMid || 0), 0);
    const sell = rows.filter((r) => !sideUp(r.side)).reduce((a, r) => a + Math.abs(+r.amountMid || 0), 0);
    const net = buy - sell;
    const fresh = Math.min(...rows.map((r) => daysSince(r.filingDate) ?? 999));
    const label = rows[0].label;
    const dir = net > 0 ? 'accumulation' : net < 0 ? 'distribution' : 'mixed activity';
    const breadth = filers >= 5 ? 'Broad' : filers >= 2 ? 'Moderate' : 'Single-filer';
    let s = (LANG === 'ar' ? `${filers >= 5 ? 'تداولات من عدة مستثمرين' : filers >= 2 ? 'تداولات من أكثر من مستثمر' : 'تداولات من مستثمر واحد'}: ${net > 0 ? 'الشراء أكبر من البيع' : net < 0 ? 'البيع أكبر من الشراء' : 'الشراء يساوي البيع'} — ${buyers ? `عدد المشترين: ${buyers}` : ''}${buyers && sellers ? '، ' : ''}${sellers ? `عدد البائعين: ${sellers}` : ''}؛ صافي الشراء والبيع: ${net >= 0 ? '+' : '−'}${fmtMoney(Math.abs(net))}.` : `${breadth} ${dir} — ${buyers ? `${buyers} buying` : ''}${buyers && sellers ? ', ' : ''}${sellers ? `${sellers} selling` : ''}, net ${net >= 0 ? '+' : '−'}${fmtMoney(Math.abs(net))}.`);
    s += (LANG === 'ar' ? fresh <= 30 ? ' الإفصاحات حديثة.' : ` المدة منذ آخر إفصاح بالأيام: ${fresh}.` : fresh <= 30 ? ' Filings are recent.' : ` Most recent filing ${fresh}d ago.`);
    s += (LANG === 'ar' ? label === 'fail' ? ' السهم غير متوافق؛ يظهر للاطلاع فقط.'
      : label === 'purify' ? ' السهم يحتاج تطهيرًا لتوزيعات الأرباح.'
      : label === 'clean' ? ' السهم متوافق وفق الفحص.' : '' : label === 'fail' ? ' Non-compliant — shown for awareness only, not ownable.'
      : label === 'purify' ? ' Compliant, with a small dividend-purification obligation.'
      : label === 'clean' ? ' Fully compliant.' : '');
    const tags = [];
    if (filers >= 4 && sellers === 0) tags.push([LANG === 'ar' ? 'شراء جماعي' : 'Cluster buy', 'up']);
    else if (filers >= 4 && buyers === 0) tags.push([LANG === 'ar' ? 'بيع جماعي' : 'Cluster sell', 'down']);
    if (filers === 1) tags.push([LANG === 'ar' ? 'مستثمر واحد' : 'Sole filer', 'muted']);
    if (buyers && sellers) tags.push([LANG === 'ar' ? 'شراء وبيع' : 'Two-sided', 'muted']);
    if (fresh <= 14) tags.push([LANG === 'ar' ? 'حديث' : 'Fresh', 'up']);
    return { sentence: s, tags, net, filers, fresh, label };
  }

  // Herfindahl concentration (0–1) of a portfolio's ownable holdings by disclosed value.
  function concentration(p) {
    const hs = {};
    for (const r of p.rows) { if (r.label === 'fail') continue; hs[r.ticker] = (hs[r.ticker] || 0) + Math.abs(+r.amountMid || 0); }
    const vals = Object.values(hs), tot = vals.reduce((a, b) => a + b, 0) || 1;
    return vals.length ? vals.reduce((a, v) => a + (v / tot) ** 2, 0) : 0;
  }
  function portfolioRead(p) {
    const flag = portfolioFlag(p), hhi = concentration(p);
    const perfWord = p.perf == null ? 'Performance pending' : p.perf >= 10 ? 'Strong disclosed return' : p.perf >= 0 ? 'Modestly positive disclosed return' : 'Lagging disclosed return';
    const compWord = flag.tone === 'clean' ? 'fully Sharia-compliant' : flag.tone === 'purify' ? 'compliant with a few names to purify' : 'holds non-compliant names';
    let s = `${perfWord}${p.perf != null ? ` (${fmtPct(p.perf)})` : ''}, ${compWord}${p.count >= 5 ? ', and actively disclosing' : ''}.`;
    const tags = [];
    if (p.perf != null && p.perf >= 15) tags.push(['Top performer', 'up']);
    if (p.count >= 5) tags.push(['Active', 'muted']);
    if (hhi >= 0.4) tags.push(['Concentrated', 'muted']);
    else if (hhi > 0 && hhi < 0.2) tags.push(['Diversified', 'muted']);
    return { sentence: s, tags, hhi };
  }

  /* ===== Conclusion-first detail screens: the app STATES the judgment, leads with return +
     attraction, keeps compliance a quiet label. Nothing here fabricates a number. ===== */
  // Public follower counts only become visible once a real leaderboard exists (mirrors
  // api/_lib/followers.js) — so one keen early follow never fabricates an "attention" figure.
  const followersAreMeaningful = () => Object.values(S.followerCounts || {}).filter((n) => n >= 3).length >= 3;
  const followerCountOf = (name) => (followersAreMeaningful() && isFinite(+S.followerCounts[name])) ? +S.followerCounts[name] : null;
  // Real, deterministic rank by the SAME metric the list shows (timeframe return) among the SAME
  // set the list ranks (portfolios that clear the min-holdings gate). Nulls excluded — never invented.
  function returnRank(name) {
    const ranked = derivePortfolios(S.rows)
      .filter((p) => p.holdings >= MIN_HOLDINGS && p.ret && p.ret.val != null && isFinite(p.ret.val))
      .sort((a, b) => b.ret.val - a.ret.val);
    const i = ranked.findIndex((p) => p.name === name);
    return i < 0 ? null : { rank: i + 1, total: ranked.length };
  }
  // Neutral (cobalt/ink ▲▼) return — NEVER a verdict hue. Missing -> "—" (no fabrication).
  const priceReturn = (ticker) => seriesReturn(sliceTf(histOf(ticker)).map((p) => +p.c));

  // THE rules function: (disclosed return, attraction signals) -> one plain headline. Bilingual.
  // When the return is unknown AND there's no activity, it says so — it never invents a verdict.
  function composeHeadline(perf, attr) {
    attr = attr || {}; const ar = LANG === 'ar'; const known = perf != null && isFinite(perf);
    if (!known && !attr.hasActivity) return t('dtl.nojudge');
    let r;
    if (!known) r = ar ? 'الأداء غير متاح بعد' : 'Performance pending';
    else if (perf >= 15) r = ar ? 'أداء قوي مؤخرًا' : 'Strong recent performance';
    else if (perf >= 3) r = ar ? 'أداء جيد مؤخرًا' : 'Solid recent performance';
    else if (perf >= 0) r = ar ? 'أداء شبه مستقر مؤخرًا' : 'Roughly flat lately';
    else if (perf > -10) r = ar ? 'أداء ضعيف مؤخرًا' : 'Soft recent performance';
    else r = ar ? 'أداء متراجع' : 'Weak recent performance';
    let a = '';
    if (attr.wellFollowed) a = ar ? 'ويحظى بمتابعة واسعة' : 'and widely followed';
    else if (attr.buyers >= 2) a = ar ? `وعدد المشترين: ${attr.buyers}` : `and ${attr.buyers} filers buying`;
    else if (attr.active) a = ar ? 'ونشط في الإفصاح' : 'and actively disclosing';
    else if (attr.quiet) a = ar ? 'لكن الإفصاحات قليلة' : 'though disclosures are sparse';
    return `${r}${a ? (ar ? '، ' : ', ') : ''}${a}.`;
  }

  // Shared conclusion-first hero: WHO this is -> composed headline -> return (hero) + attraction.
  // `who` = { avatar, name, sub, ltr }; `stats` are the localized attraction rows.

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
      const perf = perfs.length ? +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(1) : null;
      return { ...s, filerCount: s.filers.size, perf, ret: returnOf(histOf(s.ticker), perf) };
    });
  }
  const evStrength = (n) => n >= 8 ? 'high' : n >= 3 ? 'medium' : 'low';

  // Smart-money NET FLOW per ticker: gross buying vs gross selling and the net (complements the
  // Stocks tab — pure market intelligence, no execution). Non-compliant names stay VISIBLE for
  // macro awareness (shown struck-through), never actionable.
  function deriveFlow(rows) {
    const m = new Map();
    for (const r of rows) {
      let f = m.get(r.ticker);
      if (!f) { f = { ticker: r.ticker, company: r.company || r.ticker, label: r.label, buy: 0, sell: 0, filers: new Set(), fresh: null }; m.set(r.ticker, f); }
      const amt = Math.abs(+r.amountMid || 0);
      if (String(r.side).toUpperCase() === 'SELL') f.sell += amt; else f.buy += amt;
      f.filers.add(r.actor); f.label = r.label;
      const ds = daysSince(r.filingDate); if (ds != null && (f.fresh == null || ds < f.fresh)) f.fresh = ds;
    }
    return [...m.values()]
      .map((f) => ({ ...f, net: f.buy - f.sell, gross: f.buy + f.sell, filerCount: f.filers.size }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }

  /* ---------------------------------------------------------------- "My portfolio" (read-only)
     A consent-based, read-only lens: import your OWN holdings and see them through Mizān's
     screen — your Sharia exposure + how you overlap with any tracked portfolio. NOT a wallet,
     NOT a budget, NOT copy-trading: no broker, no orders. Held only in THIS browser.
     TODO(open-banking): swap the manual import for a consent-based aggregator (broker OAuth /
     SAMA Open Banking AIS) behind this same {ticker, value} contract — read-only, revocable. */
  const HOLDING_FIELD = { ticker: 'ticker', value: 'value' }; // value = position market value (optional)
  const MY_KEY = 'mz_my_holdings';
  function loadMyHoldings() { try { const j = JSON.parse(localStorage.getItem(MY_KEY) || '[]'); return Array.isArray(j) ? j.filter((h) => h && h.ticker) : []; } catch (e) { return []; } }
  function saveMyHoldings() { try { localStorage.setItem(MY_KEY, JSON.stringify(S.myHoldings || [])); } catch (e) { /* private mode */ } }
  const MY_SAMPLE = [{ ticker: 'AAPL', value: 22000 }, { ticker: 'MSFT', value: 15000 }, { ticker: 'NVDA', value: 12000 }, { ticker: 'JPM', value: 9000 }, { ticker: 'COST', value: 7000 }];

  /* ---------------------------------------------------------------- state */
  const S = {
    tab: 'portfolios', pMetric: 'top', sMetric: 'bought', tf: 'ALL', query: '',
    compliance: 'all', evFilter: 'all', followedOnly: false, compareMode: false,
    selected: [], follows: new Set(), drawer: null, // {type:'compare'|'evidence'|'detail', ...}
    openMenu: null, rows: [], live: false, loading: true, prices: {}, followerCounts: {},
    status: null, // /api/status readiness probe — drives the honest "why is this empty" note
    myHoldings: loadMyHoldings(),
  };
  const P_SUB = [['top', 'sv.top'], ['active', 'sv.active'], ['followed', 'sv.followed'], ['alloc', 'sv.alloc'], ['conc', 'sv.conc'], ['lag', 'sv.lag']];
  const S_SUB = [['bought', 'sv.bought', 'BUY', 'value'], ['sold', 'sv.sold', 'SELL', 'value'], ['flow', 'sv.flow', '', 'net'], ['new', 'sv.new', 'BUY', 'filers'], ['incr', 'sv.incr', 'BUY', 'weight'], ['red', 'sv.red', 'SELL', 'weight'], ['exit', 'sv.exit', 'SELL', 'filers']];
  const P_SORT = { top: 'so.return', active: 'so.activity', followed: 'so.followers', alloc: 'so.alloc', conc: 'so.conc', lag: 'so.lag' };
  const S_SORT = { value: 'so.value', weight: 'so.weight', filers: 'so.filers', net: 'so.net' };
  const TFS = [['1W', '1W'], ['1M', '1M'], ['3M', '3M'], ['6M', '6M'], ['1Y', '1Y'], ['3Y', '3Y'], ['5Y', '5Y'], ['ALL', 'All']];

  /* ---- My-portfolio derivation (read-only lens) ---- */
  // A held ticker's verdict comes from the screening we already have (the disclosed feed); a
  // name we've never screened reads as "under review" — never defaulted to compliant.
  function securityInfo(ticker) {
    const r = S.rows.find((x) => x.ticker === ticker);
    if (!r) return { company: '', label: 'unscreened', impurePct: null };
    return { company: r.company || ticker, label: r.label || labelOf(r), impurePct: +r.impurePct || 0 };
  }
  // Parse pasted holdings: "TICKER [amount]" per line/comma. Amount optional (equal-weight then).
  function parseHoldings(text) {
    const out = [], seen = new Set();
    String(text || '').split(/[\n,;]+/).forEach((chunk) => {
      const m = chunk.trim().match(/^([A-Za-z.\-]{1,6})(?:[\s:=]+\$?([\d,]+(?:\.\d+)?))?$/);
      if (!m) return;
      const ticker = m[1].toUpperCase();
      if (seen.has(ticker)) return; seen.add(ticker);
      out.push({ ticker, value: m[2] ? +m[2].replace(/,/g, '') : null });
    });
    return out;
  }
  const cleanShare = (mix) => { const tot = (mix.clean + mix.purify + mix.fail + mix.unscreened) || 1; return (mix.clean + mix.purify) / tot; };
  // Derive my Sharia exposure from S.myHoldings (weights from value, else equal-weight).
  function myExposure() {
    const hs = (S.myHoldings || []).filter((h) => h && h.ticker);
    if (!hs.length) return null;
    const anyVal = hs.some((h) => h.value != null && isFinite(+h.value));
    const rows = hs.map((h) => { const info = securityInfo(h.ticker); return { ticker: h.ticker, company: info.company, label: info.label, impurePct: info.impurePct, w: anyVal ? (Math.abs(+h.value) || 0) : 1, value: h.value }; });
    const totW = rows.reduce((a, h) => a + h.w, 0) || 1;
    rows.forEach((h) => { h.weight = h.w / totW; });
    const mix = { clean: 0, purify: 0, fail: 0, unscreened: 0 };
    rows.forEach((h) => { mix[h.label] = (mix[h.label] || 0) + h.weight; });
    const own = rows.filter((h) => h.label === 'clean' || h.label === 'purify');
    const ownW = own.reduce((a, h) => a + h.weight, 0) || 1;
    const purifyPct = own.reduce((a, h) => a + (h.impurePct || 0) * h.weight, 0) / ownW;
    return { rows: rows.sort((a, b) => b.weight - a.weight), mix, purifyPct: +purifyPct.toFixed(2), count: rows.length, hasValues: anyVal, totalValue: anyVal ? Math.round(totW) : null };
  }
  // Overlap between my holdings and a tracked portfolio p.
  function compareToMine(p) {
    const mine = myExposure(); if (!mine) return null;
    const mineSet = new Set(mine.rows.map((h) => h.ticker));
    const theirs = new Map();
    for (const r of p.rows) if (!theirs.has(r.ticker)) theirs.set(r.ticker, { ticker: r.ticker, company: r.company, label: r.label });
    return {
      mine,
      overlap: mine.rows.filter((h) => theirs.has(h.ticker)),
      yoursOnly: mine.rows.filter((h) => !theirs.has(h.ticker)),
      theirsOnly: [...theirs.values()].filter((t) => !mineSet.has(t.ticker)),
      theirCompliant: cleanShare(p.mix),
    };
  }
  // Weighted Sharia-exposure bar (all four states, verdict hues) + a compact legend.
  const wpct = (x) => Math.round(x * 100) + '%';

  // Account panel: import your holdings (read-only) and see your Sharia exposure.

  // Portfolio-drawer section: how the tracked portfolio compares to MY holdings.


  /* ---------------------------------------------------------------- data load */
  async function load() {
    const j = (u) => fetch(u, { headers: { accept: 'application/json' } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    const [feed, prices, followers, status] = await Promise.allSettled([j('/api/feed?performance=1'), j('/api/prices'), j('/api/follower-counts'), j('/api/status')]);
    if (feed.status === 'fulfilled' && Array.isArray(feed.value) && feed.value.length) {
      S.rows = feed.value.map((r) => ({ ...r, company: coName(r.company), label: r.label || labelOf(r) }));
      S.live = true;
    } else {
      // Live feed unavailable → fall back to the clearly-labeled embedded sample. The initial
      // state is empty + loading, so the user never sees a flash of sample before live.
      S.rows = SAMPLE; S.live = false;
    }
    if (prices.status === 'fulfilled' && prices.value && typeof prices.value === 'object' && Object.keys(prices.value).length) { S.prices = prices.value; S.pricesLive = true; }
    else { S.prices = SAMPLE_PRICES; S.pricesLive = false; }
    if (followers.status === 'fulfilled' && followers.value && typeof followers.value === 'object') S.followerCounts = followers.value;
    if (status.status === 'fulfilled' && status.value && typeof status.value === 'object') S.status = status.value;
    S.loading = false;
    render();
  }

  /* ---------------------------------------------------------------- computed list */
  function currentList() {
    let rows = S.rows;
    if (S.tab === 'portfolios') {
      // Thin-data credibility gate: a single-holding "portfolio" (e.g. a JPM-only entry) is
      // misleading, so a portfolio must disclose ≥ MIN_HOLDINGS distinct names to be ranked.
      let list = derivePortfolios(rows).filter((p) => p.holdings >= MIN_HOLDINGS);
      if (S.query) { const q = S.query.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(q) || p.rows.some((r) => (r.ticker || '').toLowerCase().includes(q))); }
      if (S.compliance !== 'all') list = list.filter((p) => { const sh = shareOf(p); return S.compliance === 'fully' ? sh.band === 'clean' : S.compliance === 'watch' ? sh.band === 'purify' : S.compliance === 'excluded' ? sh.fail > 0 : sh.fail === 0; });
      if (S.followedOnly) list = list.filter((p) => S.follows.has(p.name));
      const cmp = {
        top: (a, b) => (thinIdxNote(a) ? 1 : 0) - (thinIdxNote(b) ? 1 : 0) || ((b.ret && b.ret.val) ?? -1e9) - ((a.ret && a.ret.val) ?? -1e9), // same number shown; thin indexes rank last

        active: (a, b) => b.count - a.count,
        followed: (a, b) => (b._f || 0) - (a._f || 0) || b.count - a.count,
        alloc: (a, b) => b.cleanPct - a.cleanPct || b.count - a.count,
        conc: (a, b) => (b.hhi ?? 0) - (a.hhi ?? 0), // most concentrated first
        lag: (a, b) => (a.avgLag ?? 1e9) - (b.avgLag ?? 1e9), // fastest to disclose first (nulls last)
      };
      return list.sort(cmp[S.pMetric] || cmp.top);
    }
    // Net-flow board (Smart Money) — its own derivation; non-compliant names stay visible.
    if (S.sMetric === 'flow') {
      let list = deriveFlow(rows);
      if (S.query) { const q = S.query.toLowerCase(); list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)); }
      // Compliance filter still applies (except 'all', which keeps non-compliant visible for macro awareness).
      if (S.compliance === 'fully') list = list.filter((s) => s.label === 'clean');
      else if (S.compliance === 'exclude') list = list.filter((s) => s.label !== 'fail');
      if (S.followedOnly) list = list.filter((s) => S.follows.has(s.ticker));
      return list;
    }
    const cfg = S_SUB.find((x) => x[0] === S.sMetric);
    let list = deriveStocks(rows, cfg[2]);
    if (S.query) { const q = S.query.toLowerCase(); list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)); }
    if (S.compliance !== 'all') list = list.filter((s) => S.compliance === 'fully' ? s.label === 'clean' : S.compliance === 'watch' ? s.label === 'purify' : S.compliance === 'excluded' ? s.label === 'fail' : s.label !== 'fail');
    if (S.evFilter !== 'all') list = list.filter((s) => evStrength(s.filerCount) === S.evFilter);
    if (S.followedOnly) list = list.filter((s) => S.follows.has(s.ticker));
    const srt = { value: (a, b) => b.dollar - a.dollar, weight: (a, b) => b.filerCount - a.filerCount || b.dollar - a.dollar, filers: (a, b) => b.filerCount - a.filerCount || b.dollar - a.dollar };
    return list.sort(srt[cfg[3]]);
  }

  /* ---------------------------------------------------------------- small render helpers */
  // avatarHtml + metaHtml are trusted HTML built by callers (they escape their own text).
  // Performance HERO — the primary signal (performance-led hierarchy). Cobalt up / neutral-ink
  // down with a caret; deliberately NOT a Sharia hue, so it never reads as a verdict.
  // Accepts a bare number (legacy) or a context object { val, tf, indicative } from returnOf().
  // Neutral cobalt/ink only — never a verdict hue. Shows an "indic." caveat when price data is pending.
  // Compact compliance tag — small pill, no longer the loud hero (performance-led).
  // Shared copper/ink performance palette; status colors remain a separate compact signal.
  const portfolioTone = (p) => p.mix.unscreened > 0 && portfolioFlag(p).tone === 'clean' ? 'purify' : portfolioFlag(p).tone;
  const latestFiling = (rows) => rows.map((r) => r[FIELD.filedDate]).filter((d) => d && isFinite(Date.parse(d))).sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  // Trade direction — NEUTRAL (cobalt buy / ink sell). Verdict hues (green/amber/red) are reserved
  // for the Sharia label only, so buy/sell must never borrow them.

  /* ============ ONE shared, interactive chart component — used by EVERY chart ============
     Global consistency rule (CLAUDE.md): every chart in the app is this component. Same
     behavior everywhere — scrub (touch/pointer) reveals value + date, respects the active
     timeframe (1W…All), neutral cobalt/ink only (never a verdict hue), graceful empty state. */
  const chartPath = (v, W, H, mn, mx) => { const r = (mx - mn) || 1; return v.map((y, i) => `${(i / (v.length - 1) * W).toFixed(2)},${(H - (y - mn) / r * H).toFixed(2)}`).join(' '); };
  const histOf = (ticker) => ((S.prices[ticker] && S.prices[ticker][FIELD.priceHistory]) || []).filter((p) => p && isFinite(+p.c));
  const TF_DAYS_ALL = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825, ALL: Infinity };
  // Slice by CALENDAR days back from the series' last close (not by number of points: a daily
  // series has ~21 points a month, so counting points made "1M" cover five weeks and "1Y" ~17 months).
  const sliceTf = (hist) => {
    const n = TF_DAYS_ALL[S.tf] ?? Infinity;
    if (n === Infinity || !hist || hist.length <= 2) return hist;
    const last = Date.parse(hist[hist.length - 1].d);
    if (!isFinite(last)) return hist.slice(-Math.max(2, Math.round(n)));
    const cut = last - n * 864e5, out = hist.filter((p) => Date.parse(p.d) >= cut);
    return out.length >= 2 ? out : hist.slice(-2);
  };
  // Detail performance charts frame to the disclosed-trade window when the timeframe is "All",
  // so recent buy/sell markers spread across the width instead of bunching against years of
  // history. Specific timeframes (1W…5Y) still slice normally via sliceTf.
  function frameToTrades(hist, rows) {
    if (S.tf !== 'ALL' || !Array.isArray(hist) || hist.length < 2) return sliceTf(hist);
    const ds = (rows || []).map((r) => Date.parse(fDisclosed(r))).filter((x) => isFinite(x));
    if (!ds.length) return sliceTf(hist);
    const start = Math.min(...ds) - 30 * 864e5; // ~1 month of lead-in before the first trade
    const framed = hist.filter((p) => Date.parse(p.d) >= start);
    return framed.length >= 2 ? framed : sliceTf(hist);
  }
  const shortDate = (d) => { const ms = Date.parse(d); if (!isFinite(ms)) return d || ''; return new Date(ms).toLocaleDateString(LANG === 'ar' ? 'ar-u-nu-latn' : 'en-US', { month: LANG === 'ar' ? 'long' : 'short', day: 'numeric', year: 'numeric', ...(/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? { timeZone: 'UTC' } : {}) }); };
  const seriesReturn = (v) => v && v.length >= 2 ? (v[v.length - 1] / v[0] - 1) * 100 : null;
  const fmtPrice = (v) => (v == null || !isFinite(+v)) ? '—' : LANG === 'ar' ? '\u2066$' + (+v).toLocaleString('en-US', { maximumFractionDigits: 2 }) + '\u2069' : '$' + (+v).toLocaleString('en-US', { maximumFractionDigits: 2 });
  // "Bought-at → now": the disclosure's disclosed-close vs today's price + gain, from the
  // dual-anchor performance each row carries (feed ?performance=1). The core evidence signal:
  // "would following this filer have worked?" Neutral cobalt/ink only — never a verdict hue.
  function entryVsNow(r) {
    const p = r && r.performance;
    if (!p || p.disclosedClose == null || p.now == null) return '';
    const pct = p.sinceDisclosed;
    const pctHtml = (pct == null || !isFinite(pct)) ? '' : ` · <span class="return ${pct >= 0 ? 'up' : 'down'}">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%</span>`;
    const since = LANG === 'ar' ? 'منذ الإفصاح' : 'since disclosed';
    return `<span>${fmtPrice(p.disclosedClose)} → <b>${fmtPrice(p.now)}</b>${pctHtml} <span class="mz-muted">${since}</span></span>`;
  }
  const tfLabelNow = () => LANG === 'ar' ? ({ '1W': 'أسبوع', '1M': 'شهر', '3M': '3 أشهر', '6M': '6 أشهر', '1Y': 'سنة', '3Y': '3 سنوات', '5Y': '5 سنوات', 'ALL': 'كامل الفترة' }[S.tf] || 'كامل الفترة') : (TFS.find(([k]) => k === S.tf) || [, 'All'])[1];
  // Timeframe-aware return that carries its context. Prefers the price return over the active
  // timeframe (recomputes with the selector); if prices are pending, falls back to the disclosed
  // return but marks it "indicative" — never a confident number over a Pending chart.
  function returnOf(series, disclosed) {
    const lastD = series && series.length ? series[series.length - 1].d : null;
    if (lastD && (daysSince(lastD) ?? 0) > STALE_DAYS) return { val: null, tf: null, indicative: false, stale: true, asOf: lastD };
    const tfRet = seriesReturn(sliceTf(series || []).map((p) => +p.c));
    if (tfRet != null && isFinite(tfRet)) return { val: +tfRet.toFixed(1), tf: tfLabelNow(), indicative: false };
    if (disclosed != null && isFinite(disclosed)) return { val: +(+disclosed).toFixed(1), tf: null, indicative: true };
    return { val: null, tf: null, indicative: false };
  }

  // 'YYYY-MM-DD' for a disclosure date such as 'Sep 14, 2026' (local calendar day) or an ISO string.
  const isoDay = (v) => {
    if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).slice(0, 10);
    const ms = Date.parse(v); if (!isFinite(ms)) return null;
    const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  // What a filer STILL HOLDS: per ticker, the latest action (by trade date, then filing date) decides.
  // A ticker whose latest action is a SELL is "exited" — it is not a holding, not exposure, and not
  // part of the portfolio return. Returns Map(ticker -> { label, start, row }) for held names, where
  // `start` is the day the position was first disclosed (the return only counts moves AFTER it).
  function heldNames(rows) {
    const by = new Map();
    for (const r of rows) { const a = by.get(r.ticker); (a || by.set(r.ticker, []).get(r.ticker)).push(r); }
    const held = new Map(), exited = new Map();
    for (const [tk, rs] of by) {
      const ord = rs.slice().sort((a, b) => (Date.parse(fDisclosed(b)) || 0) - (Date.parse(fDisclosed(a)) || 0) || (Date.parse(b[FIELD.filedDate]) || 0) - (Date.parse(a[FIELD.filedDate]) || 0));
      const latest = ord[0], label = rs.slice().sort(byFiled)[0].label; // verdict from the newest filing
      if (String(latest.side).toUpperCase() === 'SELL') { exited.set(tk, { label, row: latest }); continue; }
      const buys = rs.filter((r) => String(r.side).toUpperCase() !== 'SELL').map((r) => isoDay(fDisclosed(r))).filter(Boolean).sort();
      held.set(tk, { label, start: buys[0] || null, row: latest });
    }
    return { held, exited };
  }
  // Equal-weight portfolio index, built from daily returns and joined BY DATE (series that end on
  // different days are never shifted in time). Only HELD names the engine passes (not Excluded /
  // unscreened) count, each from its OWN disclosure day onward — a "disclosed return" must never
  // include price moves from before the filer disclosed anything. Names whose prices are stale are left out.
  function portfolioIndexHist(rows) {
    const { held } = heldNames(rows), mem = [];
    for (const [tk, info] of held) {
      if (info.label === 'fail' || info.label === 'unscreened' || !info.start) continue;
      const h = histOf(tk); if (h.length >= 2) mem.push({ tk, h, start: info.start });
    }
    if (!mem.length) return [];
    const newest = mem.reduce((m, x) => (x.h[x.h.length - 1].d > m ? x.h[x.h.length - 1].d : m), '');
    const live = mem.filter((m) => (Date.parse(newest) - Date.parse(m.h[m.h.length - 1].d)) / 864e5 <= STALE_DAYS);
    const minStart = live.reduce((m, x) => (x.start < m ? x.start : m), '9999-12-31');
    const dates = [...new Set(live.flatMap((m) => m.h.map((p) => p.d)).filter((d) => d >= minStart))].sort();
    if (dates.length < 2) return [];
    const cur = live.map((m) => ({ ...m, i: -1, prev: null })); // pointer to last price at or before the date
    const out = []; let idx = 100;
    dates.forEach((d, k) => {
      let sum = 0, n = 0;
      for (const m of cur) {
        const before = m.prev;
        while (m.i + 1 < m.h.length && m.h[m.i + 1].d <= d) m.i++;
        const px = m.i >= 0 ? +m.h[m.i].c : null;
        if (k > 0 && before != null && px != null && dates[k - 1] >= m.start) { sum += px / before - 1; n++; }
        m.prev = px;
      }
      if (k > 0 && n) idx *= 1 + sum / n;
      out.push({ d, c: idx });
    });
    return out;
  }

  // THE shared chart. `hist` = [{d,c}]. opts: { cls, compare:[{d,c}], empty,
  //   markers:[{d,side,label}] (disclosed trades pinned on the line — cobalt buy / ink sell),
  //   color: optional CSS color (Portfolios sign palette), area/valueAxis: optional detail styling,
  //   today: string (a value label shown top-end, e.g. "$146 · today") }.
  function chart(hist, opts) {
    opts = opts || {};
    const cls = opts.cls || 'mz-chart--full';
    const h = cls === 'mz-chart--spark' ? 44 : cls === 'mz-chart--card' ? 64 : 180;
    const data = (hist || []).filter((p) => p && isFinite(+p.c));
    if (data.length < 2) return `<div class="mz-chart ${cls} mz-chart__empty" style="height:${h}px">${opts.empty || '—'}</div>`;
    const closes = data.map((p) => +p.c), mn = Math.min(...closes), mx = Math.max(...closes), rng = (mx - mn) || 1;
    const W = 320, H = 100, sw = cls === 'mz-chart--full' ? 1.7 : 1.4;
    const line = `<polyline points="${chartPath(closes, W, H, mn, mx)}" fill="none" stroke="${esc(opts.color || 'var(--blue)')}" stroke-width="${sw}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    const area = opts.area ? `<polygon points="0,${H} ${chartPath(closes, W, H, mn, mx)} ${W},${H}" fill="${esc(opts.color || 'var(--blue)')}" opacity="0.08"/>` : '';
    const valueAxis = opts.valueAxis ? `<span class="mz-chart__value-axis">${[mx, (mn + mx) / 2, mn].map((v) => `<span>${(v / closes[0] * 100 - 100).toFixed(0)}%</span>`).join('')}</span>` : '';
    let cmp = '';
    if (opts.compare) { const c2 = (opts.compare || []).filter((p) => p && isFinite(+p.c)).map((p) => +p.c); if (c2.length >= 2) cmp = `<polyline points="${chartPath(c2, W, H, mn, mx)}" fill="none" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="3 3"/>`; }
    // % positions (the SVG is stretched to fill, so a data point maps to left = i/(n-1), top = 1-(c-mn)/rng).
    const at = (i) => ({ x: (i / (data.length - 1) * 100), y: ((1 - (closes[i] - mn) / rng) * 100) });
    let markers = '', marksAttr = '';
    if (opts.markers && opts.markers.length) {
      const span0 = Date.parse(data[0].d) - 4 * 864e5, span1 = Date.parse(data[data.length - 1].d) + 4 * 864e5;
      const nearest = (d) => { const t0 = Date.parse(d); if (!isFinite(t0) || t0 < span0 || t0 > span1) return -1; let bi = -1, bd = Infinity; for (let i = 0; i < data.length; i++) { const dd = Math.abs(Date.parse(data[i].d) - t0); if (dd < bd) { bd = dd; bi = i; } } return bi; };
      const valid = opts.markers.filter((m) => m && m.d);
      markers = valid.map((m) => { const i = nearest(m.d); if (i < 0) return ''; const p = at(i); const sell = String(m.side).toUpperCase() === 'SELL'; return `<span class="mz-chart__mk" data-side="${sell ? 'sell' : 'buy'}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" title="${esc((sell ? t('dtl.sold') : t('dtl.bought')) + (m.label ? ' ' + m.label : '') + ' · ' + shortDate(m.d))}"></span>`; }).join('');
      // Encode markers so the scrub tooltip can reveal WHAT was traded when it passes over a dot.
      marksAttr = ` data-marks="${esc(JSON.stringify(valid.map((m) => [m.d, String(m.side).toUpperCase() === 'SELL' ? 'S' : 'B', m.label || ''])))}"`;
    }
    // "Today" endpoint dot (detail charts) + optional value label so the line's end reads as now.
    const lastP = at(data.length - 1);
    const todayDot = cls === 'mz-chart--full' ? `<span class="mz-chart__today" style="left:${lastP.x.toFixed(2)}%;top:${lastP.y.toFixed(2)}%"></span>` : '';
    const todayLab = opts.today ? `<span class="mz-chart__todaylab">${esc(opts.today)}</span>` : '';
    // Date axis (detail charts): start date … last date, so marker positions read as "when".
    const axisEls = (opts.axis && cls === 'mz-chart--full')
      ? `<span class="mz-chart__ax mz-chart__ax--start">${esc(shortDate(data[0].d))}</span><span class="mz-chart__ax mz-chart__ax--end">${esc(shortDate(data[data.length - 1].d))}</span>`
      : '';
    const series = esc(JSON.stringify(data.map((p) => [p.d, +p.c])));
    const unit = opts.unit === 'index' ? 'index' : 'price';
    return `<div class="mz-chart ${cls}" tabindex="0" role="img" aria-label="${esc(LANG === 'ar' ? 'حركة الأداء — اسحب لعرض التاريخ والقيمة' : 'Performance history — scrub for date and value')}" data-series="${series}" data-unit="${unit}" data-min="${mn}" data-max="${mx}"${marksAttr} style="height:${h}px;--mz-chart-color:${esc(opts.color || 'var(--blue)')}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${area}${cmp}${line}</svg>${valueAxis}${markers}${todayDot}${todayLab}${axisEls}<span class="mz-chart__cx"></span><span class="mz-chart__dot"></span></div>`;
  }

  // Interactive scrub — ONE handler drives every chart (touch + pointer). Registered once.
  const chartTip = (() => { const el = document.createElement('div'); el.className = 'mz-chart-tip'; el.id = 'chartTooltip'; el.setAttribute('role', 'tooltip'); document.body.appendChild(el); return el; })();
  function chartHideTip() { if (!chartTip.classList.contains('is-on')) return; chartTip.classList.remove('is-on'); document.querySelectorAll('.mz-chart.is-active').forEach((c) => c.classList.remove('is-active')); }
  function chartScrub(clientX, target) {
    if (target && target.closest && target.closest('.mz-chart--lw')) return; // LW crosshair drives the tip
    const el = target && target.closest && target.closest('.mz-chart[data-series]');
    if (!el) { chartHideTip(); return; }
    const rect = el.getBoundingClientRect();
    let data; try { data = JSON.parse(el.dataset.series); } catch (e) { return; }
    const n = data.length; if (n < 2) return;
    let i = Math.round((clientX - rect.left) / rect.width * (n - 1)); i = Math.max(0, Math.min(n - 1, i));
    const d = data[i][0], c = +data[i][1], mn = +el.dataset.min, mx = +el.dataset.max, r = (mx - mn) || 1;
    const px = i / (n - 1) * rect.width, py = (1 - (c - mn) / r) * rect.height;
    el.classList.add('is-active');
    const cx = el.querySelector('.mz-chart__cx'), dot = el.querySelector('.mz-chart__dot');
    if (cx) cx.style.left = px + 'px';
    if (dot) { dot.style.left = px + 'px'; dot.style.top = py + 'px'; }
    // If a disclosed-trade marker sits at this point, reveal WHAT was traded.
    let extra = '';
    if (el.dataset.marks) {
      try {
        const near = JSON.parse(el.dataset.marks).find((m) => { const mt = Date.parse(m[0]); let bi = 0, bd = Infinity; for (let k = 0; k < n; k++) { const dd = Math.abs(Date.parse(data[k][0]) - mt); if (dd < bd) { bd = dd; bi = k; } } return bi === i; });
        if (near) extra = ` · ${near[1] === 'S' ? '▼ ' + (LANG === 'ar' ? 'بيع' : 'Sold') : '▲ ' + (LANG === 'ar' ? 'شراء' : 'Bought')}${near[2] ? ' ' + (LANG === 'ar' ? '\u2066' + near[2] + '\u2069' : near[2]) : ''}`;
      } catch (e) { /* ignore */ }
    }
    chartTip.textContent = `${el.dataset.unit === 'index' ? c.toFixed(2) + (LANG === 'ar' ? ' · مؤشر' : ' · index') : LANG === 'ar' ? '\u2066$' + c.toFixed(2) + '\u2069' : '$' + c.toFixed(2)} · ${shortDate(d)}${extra}`;
    chartTip.classList.add('is-on');
    const halfTip = chartTip.getBoundingClientRect().width / 2;
    chartTip.style.left = Math.max(halfTip + 8, Math.min(window.innerWidth - halfTip - 8, rect.left + px)) + 'px';
    chartTip.style.top = Math.max(chartTip.getBoundingClientRect().height + 16, rect.top + py) + 'px';
  }
  // Keyboard access uses the same scrub calculation and tooltip as pointer/touch.
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest && e.target.closest('.mz-chart[data-series]');
    if (!el || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const data = JSON.parse(el.dataset.series), last = data.length - 1;
    const current = +(el.dataset.scrubIndex || 0);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? last : Math.max(0, Math.min(last, current + (e.key === 'ArrowRight' ? 1 : -1)));
    el.dataset.scrubIndex = next;
    el.setAttribute('aria-describedby', 'chartTooltip');
    const rect = el.getBoundingClientRect();
    chartScrub(rect.left + next / last * rect.width, el);
  });
  document.addEventListener('focusout', (e) => { if (e.target.matches('.mz-chart')) chartHideTip(); });
  document.addEventListener('pointermove', (e) => chartScrub(e.clientX, e.target));
  document.addEventListener('pointerdown', (e) => chartScrub(e.clientX, e.target));
  const hideUnlessLw = (e) => { if (!(e.target && e.target.closest && e.target.closest('.mz-chart--lw'))) chartHideTip(); };
  document.addEventListener('pointerup', hideUnlessLw);
  document.addEventListener('pointercancel', chartHideTip);
  window.addEventListener('scroll', chartHideTip, true);
  document.addEventListener('touchmove', (e) => { if (e.touches && e.touches[0]) chartScrub(e.touches[0].clientX, e.target); }, { passive: true });
  document.addEventListener('touchend', hideUnlessLw);

  // Honest "why is this empty" note. When most disclosed names have no Sharia verdict yet they
  // are (correctly) hidden — an unscreened name is never shown as included — so the board can
  // read empty while real data exists. This explains that with the real counts from /api/status
  // (total disclosures) and the live feed (S.rows = the screened names that passed the gate),
  // instead of a silent zero. Returns '' when the data is healthy or status is unavailable.
  function readinessNote() {
    const st = S.status;
    if (!st || !st.data || !st.data.disclosures) return '';
    const total = Number(st.data.disclosures.total || 0);
    if (!total) return '';
    const screenedShown = S.live ? S.rows.length : 0;
    const screeningOff = st.config && st.config.screening === false;
    if (!screeningOff && screenedShown >= total) return ''; // healthy — nothing to explain
    const hidden = Math.max(0, total - screenedShown);
    if (!hidden && !screeningOff) return '';
    const ar = LANG === 'ar';
    const en = `Mizan screening ${screeningOff ? "isn’t enabled yet" : 'is still catching up'} — ${screenedShown} of ${total} disclosed ${total === 1 ? 'name has' : 'names have'} a verdict, so ${hidden} ${hidden === 1 ? 'name is' : 'names are'} hidden (an unscreened name is never shown as included). Rankings fill in once screening ${screeningOff ? 'is turned on' : 'completes'}.`;
    const arS = `فحص ميزان ${screeningOff ? 'غير مفعّل بعد' : 'لا يزال جاريًا'} — عدد الأسهم التي اكتمل فحصها: ${screenedShown} من ${total}؛ وعدد الأسهم المخفية: ${hidden} (لا يظهر السهم الذي لم يُفحص بوصفه متوافقًا). تظهر النتائج بعد ${screeningOff ? 'تفعيل الفحص' : 'اكتمال الفحص'}.`;
    return `<p class="footnote" style="max-width:40rem;margin-inline:auto">${ar ? arS : en}</p>`;
  }

  /* ================================================================ PRESENTATION (mizan-redesign-v1)
     The redesign package is the visual source of truth: every page below is built from its
     markup (sidebar, topbar, hero, investor cards, signal cards, metric strip, table + panel,
     detail hero/grid, timeline). Every figure is bound to the derivations above — the package's
     demo values are never used, and nothing here invents a number. */
  const L = (en, ar) => (LANG === 'ar' ? ar : en);
  const ini = (name) => { const p = String(name || '').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/); return ((p[0] || '')[0] || '') + ((p.length > 1 ? p[p.length - 1] : '')[0] || '') || '—'; };
  const ago = (d) => d == null ? '—' : L(`${d}d`, d === 1 ? 'يوم واحد' : d === 2 ? 'يومين' : `${d} ${d >= 3 && d <= 10 ? 'أيام' : 'يومًا'}`);
  const plural2 = (n, en1, enN, ar) => LANG === 'ar' ? `${ar}: ${n}` : plural(n, en1, enN);
  const sideWord = (side) => String(side).toUpperCase() === 'SELL' ? L('sold', 'باع') : L('bought', 'اشترى');
  const TONE = { clean: 'included', purify: 'watch', fail: 'excluded', unscreened: 'pending', mixed: 'mixed' };
  const COVER = { clean: '', purify: 'amber', fail: 'red', unscreened: 'grey', mixed: 'mixed' };
  const ROUTE_TITLES = { discover: ['Discover', 'اكتشف'], portfolios: ['Portfolios', 'المحافظ'], stocks: ['Stocks', 'الأسهم'], alerts: ['Alerts', 'التنبيهات'], following: ['Following', 'متابعاتي'], account: ['Account', 'الحساب'], methodology: ['Methodology', 'المنهجية'] };
  const lagText = (r) => { const lag = daysBetween(r[FIELD.disclosedDate], r[FIELD.filedDate]); return lag == null ? '' : t('dtl.filedLater', { n: lag }); };
  const recentRows = (rows, days) => rows.filter((r) => (daysSince(r[FIELD.filedDate]) ?? 1e9) <= days);
  const byFiled = (a, b) => (Date.parse(b[FIELD.filedDate]) || 0) - (Date.parse(a[FIELD.filedDate]) || 0);
  const eligible = () => derivePortfolios(S.rows).filter((p) => p.holdings >= MIN_HOLDINGS);
  // Never "Live": prices are cached daily closes and filings lag trades by law. Say exactly how fresh.
  const dayMonth = (d) => { const ms = Date.parse(d); return isFinite(ms) ? new Date(ms).toLocaleDateString(LANG === 'ar' ? 'ar-u-nu-latn' : 'en-US', { month: LANG === 'ar' ? 'long' : 'short', day: 'numeric', ...(/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? { timeZone: 'UTC' } : {}) }) : ''; };
  const STALE_DAYS = 7;
  const lastClose = (tk) => { const h = histOf(tk); return h.length ? h[h.length - 1].d : null; };
  // Freshness of the prices behind the names on screen (not the newest series anywhere).
  function priceFreshness() {
    const tickers = [...new Set(S.rows.map((r) => r.ticker))];
    let newest = null, stale = 0, missing = 0;
    for (const tk of tickers) { const d = lastClose(tk); if (!d) { missing++; continue; } if (!newest || Date.parse(d) > Date.parse(newest)) newest = d; if ((daysSince(d) ?? 0) > STALE_DAYS) stale++; }
    return { newest, stale, missing, total: tickers.length };
  }
  const dataLabel = () => {
    if (S.loading) return L('Loading…', 'جارٍ التحميل…');
    if (!S.live) return L('Sample data', 'بيانات نموذجية');
    const fd = latestFiling(S.rows), filings = fd ? L(`Filings to ${dayMonth(fd)}`, `الإفصاحات حتى ${dayMonth(fd)}`) : '';
    if (!S.pricesLive) return [L('Prices pending', 'الأسعار غير متاحة بعد'), filings].filter(Boolean).join(' · ');
    const f = priceFreshness();
    const prices = f.newest ? L(`Prices ${dayMonth(f.newest)}`, `آخر أسعار: ${dayMonth(f.newest)}`) : L('Prices pending', 'الأسعار غير متاحة بعد');
    const gapParts = [f.stale ? L(`${f.stale} stale`, `أسعار غير محدّثة: ${f.stale}`) : '', f.missing ? L(`${f.missing} without prices`, `أسهم بلا أسعار: ${f.missing}`) : ''].filter(Boolean);
    const gaps = gapParts.length ? L(` (${gapParts.join(', ')} of ${f.total})`, ` (${gapParts.join('، ')}؛ إجمالي الأسهم: ${f.total})`) : '';
    return [prices + gaps, filings].filter(Boolean).join(' · ');
  };

  /* ---- Real portraits. Congress members: official public-domain portrait when the feed carries a
     Bioguide id. Everyone else: the Wikipedia/Wikimedia image, accepted ONLY when the article's
     description matches the filer type (so a generic name never gets a stranger's face).
     Otherwise the package's initials portrait. Cached per browser for 7 days. */
  const PHOTO_KEY = 'mz_photos_v1';
  let PHOTOS = {}; try { PHOTOS = JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}') || {}; } catch (e) { PHOTOS = {}; }
  const photoInflight = new Set();
  const PHOTO_MATCH = {
    official: /politician|senator|representative|congress/i,
    insider: /business|executive|entrepreneur|investor|engineer|founder|chief|ceo|banker/i,
    fund: /hedge fund|investment|asset management|capital management|financial|bank|holding company|conglomerate|fund/i,
  };
  const imgTag = (src) => `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`;
  function photoFor(name, group, row) {
    const bio = row && row[FIELD.bioguide];
    if (bio) return `https://unitedstates.github.io/images/congress/225x275/${encodeURIComponent(bio)}.jpg`;
    const hit = PHOTOS[name];
    if (hit && Date.now() - hit.t < 7 * 864e5) return hit.u || null;
    if (!name || /filing|unknown|sample/i.test(name) || photoInflight.has(name) || location.protocol === 'file:') return null;
    photoInflight.add(name);
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(name.replace(/ /g, '_')), { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const ok = !!(d && d.type === 'standard' && d.thumbnail && d.thumbnail.source && (PHOTO_MATCH[group] || PHOTO_MATCH.fund).test(d.description || ''));
        PHOTOS[name] = { u: ok ? d.thumbnail.source : '', t: Date.now() };
        try { localStorage.setItem(PHOTO_KEY, JSON.stringify(PHOTOS)); } catch (e) { /* private mode */ }
        if (ok) document.querySelectorAll('[data-photo]').forEach((el) => { if (el.dataset.photo === name && !el.querySelector('img')) el.insertAdjacentHTML('beforeend', imgTag(d.thumbnail.source)); });
      })
      .catch(() => { PHOTOS[name] = { u: '', t: Date.now() - 6.9 * 864e5 }; }) // retry soon, not every render
      .finally(() => photoInflight.delete(name));
    return null;
  }
  function avatar(name, opts) {
    opts = opts || {};
    const src = opts.noPhoto ? null : photoFor(name, opts.group || 'fund', opts.row);
    return `<span class="avatar ${opts.cls || ''}" data-tone="${TONE[opts.tone] || 'pending'}" data-photo="${esc(name)}" aria-hidden="true">${esc(opts.initials || ini(name))}${src ? imgTag(src) : ''}</span>`;
  }
  // Portfolio-level Mizan Status = the real mix of its distinct names, never a blanket verdict
  // (one excluded name used to stamp a 31-of-48-passing portfolio "EXCLUDED").
  function shareOf(p) {
    const c = { clean: 0, purify: 0, fail: 0, unscreened: 0 };
    (p.heldMap || heldNames(p.rows).held).forEach((v) => { c[v.label] = (c[v.label] || 0) + 1; }); // names still held; newest verdict
    const total = c.clean + c.purify + c.fail + c.unscreened || 1, pass = c.clean + c.purify;
    // Band: ANY excluded name -> 'mixed' (neutral ink, never amber — amber means "passes with
    // purification"); else any pending name -> pending (grey); else purification -> watch (amber); else included.
    const band = c.fail > 0 ? 'mixed' : c.unscreened > 0 ? 'unscreened' : c.purify > 0 ? 'purify' : 'clean';
    return { ...c, total, pass, ratio: pass / total, band, exited: (p.exitedMap || new Map()).size };
  }
  const sharePill = (p) => {
    const sh = shareOf(p);
    const tip = L(`${sh.clean} Included · ${sh.purify} Watch · ${sh.fail} Excluded${sh.unscreened ? ` · ${sh.unscreened} Pending` : ''}${sh.exited ? ` · ${sh.exited} sold (not counted)` : ''} (AAOIFI 30/30/5)`, `متوافق: ${sh.clean} · يحتاج تطهيرًا: ${sh.purify} · غير متوافق: ${sh.fail}${sh.unscreened ? ` · قيد الفحص: ${sh.unscreened}` : ''} ${sh.exited ? ` · بيعت ولا تُحتسب: ${sh.exited}` : ''} (أيوفي 30/30/5)`);
    const txt = sh.pass === sh.total ? L(`ALL ${sh.total} PASS`, `أسهم متوافقة: ${sh.total} من ${sh.total}`) : L(`${sh.pass} OF ${sh.total} PASS`, `أسهم متوافقة: ${sh.pass} من ${sh.total}`);
    const bar = `<span class="mixbar" aria-hidden="true">${[['clean', 'included'], ['purify', 'watch'], ['fail', 'excluded'], ['unscreened', 'pending']].map(([k, cls]) => sh[k] ? `<i class="${cls}" style="flex:${sh[k]}"></i>` : '').join('')}</span>`;
    return `<span class="status ${sh.band === 'mixed' ? 'mixed' : STATUS_CLS[sh.band]}" title="${esc(tip)}">${esc(txt)}${bar}</span>`;
  };
  const pAvatar = (p, cls) => avatar(p.name, { group: p.group, tone: shareOf(p).band, cls, initials: p.initials, row: p.rows[0] });

  // Return carries its context (timeframe, or "indicative" when prices are pending). Blue/ink only.
  const retTag = (ret) => {
    if (ret && ret.stale) return `<span class="return muted">—</span><small class="ctx">${esc(L(`prices stale (${shortDate(ret.asOf)})`, `الأسعار غير محدّثة (${shortDate(ret.asOf)})`))}</small>`;
    if (!ret || ret.val == null || !isFinite(ret.val)) return `<span class="return muted">—</span><small class="ctx">${t('dtl.pending')}</small>`;
    return `<span class="return ${ret.val >= 0 ? 'up' : 'down'}">${ret.val >= 0 ? '▲' : '▼'} ${Math.abs(ret.val).toFixed(1)}%</span><small class="ctx">${esc(ret.indicative ? L('indicative · since disclosed', 'تقديري · منذ الإفصاح') : (ret.tf || tfLabelNow()))}</small>`;
  };
  const STATUS_OPTS = () => [['all', L('Status: all', 'الحالة: الكل')], ['fully', t('v.compliant')], ['watch', t('v.purify')], ['excluded', t('v.noncompliant')], ['exclude', t('f.exclude')]];
  const star = (id) => `<button class="star" type="button" data-star="${esc(id)}" aria-pressed="${S.follows.has(id)}" aria-label="${esc(t('common.follow'))}">${S.follows.has(id) ? '★' : '☆'}</button>`;
  const seg = (keys) => `<div class="seg" role="group" aria-label="${L('Time period', 'الفترة الزمنية')}">${keys.map((k) => `<button type="button" data-tf="${k}" class="${S.tf === k ? 'active' : ''}" aria-pressed="${S.tf === k}">${LANG === 'ar' ? ({ '1W': 'أسبوع', '1M': 'شهر', '3M': '3 أشهر', '6M': '6 أشهر', '1Y': 'سنة', '3Y': '3 سنوات', '5Y': '5 سنوات', 'ALL': 'كامل الفترة' }[k] || k) : k === 'ALL' ? L('ALL', 'الكل') : k}</button>`).join('')}</div>`;
  const footnote = (extra) => `<p class="footnote">${esc(t('g.disclaimer'))}${extra ? ' ' + extra : ''}</p>`;
  const chartFrame = (html, legend) => `<div class="chart-placeholder chart-live">${html}</div>${legend ? `<div class="chart-legend">${legend}</div>` : ''}`;
  const tradeLegend = () => `<span><i style="background:var(--blue)"></i>${L('Disclosed buy', 'شراء معلن')}</span><span><i style="background:#fff;border:1.5px solid var(--ink)"></i>${L('Disclosed sell', 'بيع معلن')}</span>`;
  const emptyCard = (title, body, cta) => `<div class="card empty"><h3>${esc(title)}</h3><p>${esc(body)}</p>${cta || ''}</div>`;
  const pageHead = (eyebrow, h1, sub, end) => `<div class="pagehead"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(h1)}</h1><p>${esc(sub)}</p></div>${end || ''}</div>`;

  /* ---- Shell (package sidebar + topbar). */
  const NAV = [['discover', I.compass], ['portfolios', I.portfolios], ['stocks', I.stocks], ['alerts', I.bell], ['following', I.star]];
  function renderShell() {
    document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
    const active = { portfolio: 'portfolios', stock: 'stocks' }[S.page] || S.page;
    document.getElementById('brandName').textContent = L('Mizan', 'ميزان');
    document.getElementById('brandSub').textContent = L('Financial Intelligence', 'ذكاء مالي');
    document.getElementById('nav').innerHTML = NAV.map(([k, ic]) => `<a href="/${k === 'discover' ? '' : k}" data-nav="${k}" title="${L(...ROUTE_TITLES[k])}" class="${active === k ? 'active' : ''}" ${active === k ? 'aria-current="page"' : ''}><span class="ico">${ic}</span><span>${L(...ROUTE_TITLES[k])}</span></a>`).join('');
    document.getElementById('sidefoot').innerHTML = `<a href="/methodology" data-nav="methodology" title="${L(...ROUTE_TITLES.methodology)}"><span class="ico">${I.info}</span><span>${L(...ROUTE_TITLES.methodology)}</span></a><a href="/account" data-nav="account" title="${L(...ROUTE_TITLES.account)}"><span class="ico">${I.user}</span><span>${L(...ROUTE_TITLES.account)}</span></a><a href="#" id="langToggle" title="${LANG === 'en' ? 'العربية' : 'English'}"><span class="ico">${I.globe}</span><span>${LANG === 'en' ? 'العربية' : 'English'}</span></a>`;
    document.getElementById('mobileNav').innerHTML = [...NAV.map(([k]) => k), 'account'].map((k) => `<a href="/${k === 'discover' ? '' : k}" class="chip ${active === k ? 'on' : ''}" data-nav="${k}">${L(...ROUTE_TITLES[k])}</a>`).join('');
    const search = document.getElementById('search');
    search.placeholder = L('Search investors, portfolios, stocks, filings...', 'ابحث عن مستثمر أو محفظة أو سهم أو إيداع...');
    search.setAttribute('aria-label', search.placeholder);
    if (search.value !== S.query) search.value = S.query;
    // Cached / embedded prices are never labeled Live.
    document.getElementById('dataChip').textContent = dataLabel();
    const thinP = S.page === 'portfolio' && (derivePortfolios(S.rows).find((x) => x.name === S.id) || { holdings: 0 }).holdings < MIN_HOLDINGS;
    const fid = S.page === 'portfolio' ? (thinP ? null : S.id) : S.page === 'stock' ? S.id : null;
    const fb = document.getElementById('topFollow');
    fb.textContent = fid && S.follows.has(fid) ? t('common.following') : t('common.follow');
    fb.dataset.followId = fid || '';
    document.title = `Mizān — ${L(...(ROUTE_TITLES[active] || ROUTE_TITLES.discover))}`;
  }

  /* ---- Discover (prototype/dashboard.html). */
  function investorCard(p) {
    const moves = recentRows(p.rows, 30).length;
    return `<article class="card investor-card" tabindex="0" role="link" data-open-portfolio="${esc(p.name)}">
      <div class="cover ${COVER[shareOf(p).band] || ''}">${pAvatar(p, 'portrait')}</div>
      <div class="body"><h3>${esc(p.name)}</h3><div class="meta">${esc(typeLabel(p.kind))} · ${esc(L(`latest filing ${shortDate(latestFiling(p.rows)) || '—'}`, `آخر إفصاح ${shortDate(latestFiling(p.rows)) || '—'}`))}</div><div class="card-return">${retTag(p.ret)}</div>${sharePill(p)}
      <div class="kpirow"><div class="kpi"><b>${p.holdings}</b><span>${L('holdings', 'الأسهم')}</span></div><div class="kpi"><b>${moves}</b><span>${L('moves · 30d', 'عدد التداولات · 30 يومًا')}</span></div><div class="kpi"><b>${ago(p.fresh)}</b><span>${L('freshness', 'آخر إفصاح')}</span></div></div></div></article>`;
  }
  function pageDiscover() {
    const ports = eligible();
    const featured = [...ports].sort((a, b) => (thinIdxNote(a) ? 1 : 0) - (thinIdxNote(b) ? 1 : 0) || (((b.ret && b.ret.val) ?? -1e9) - ((a.ret && a.ret.val) ?? -1e9)) || (a.fresh ?? 1e9) - (b.fresh ?? 1e9)).slice(0, 4);
    const week = recentRows(S.rows, 7), followedWeek = new Set(week.filter((r) => S.follows.has(r.actor)).map((r) => r.actor)).size;
    const latest = latestFiling(S.rows);
    const today = S.follows.size
      ? L(`${plural(followedWeek, 'portfolio', 'portfolios')} you follow filed in the last 7 days.`, `خلال 7 أيام: عدد المحافظ التي تتابعها ونشرت إفصاحات جديدة ${followedWeek}.`)
      : week.length
        ? L(`${plural(week.length, 'new disclosure', 'new disclosures')} from ${plural(new Set(week.map((r) => r.actor)).size, 'investor', 'investors')} in the last 7 days.`, `خلال 7 أيام، بلغ عدد الإفصاحات الجديدة ${week.length}. عدد المستثمرين: ${new Set(week.map((r) => r.actor)).size}.`)
        : L(`Latest disclosure filed ${shortDate(latest) || '—'}.`, `آخر إفصاح بتاريخ ${shortDate(latest) || '—'}.`);
    const weekNames = new Map(); (week.length ? week : S.rows.slice().sort(byFiled).slice(0, 5)).forEach((r) => weekNames.set(r.ticker, r.label));
    const weekCounts = ['clean', 'purify', 'fail', 'unscreened'].map((l) => [l, [...weekNames.values()].filter((x) => x === l).length]).filter(([, n]) => n);
    const changes = S.rows.slice().sort(byFiled).slice(0, 3);
    const steps = [
      ['01 / DISCOVER', '01 / اكتشف', 'Find people worth following', 'اكتشف مستثمرين لمتابعتهم', 'Browse featured investors, rising activity, popular portfolios, and new filings.', 'تصفّح المستثمرين البارزين والنشاط المتزايد والمحافظ الأكثر متابعة والإفصاحات الجديدة.'],
      ['02 / EVALUATE', '02 / قيّم', 'Understand the evidence', 'راجع التفاصيل', 'See holdings, change history, freshness, concentration, and Mizan Status in one place.', 'اطّلع على الأسهم وسجل التغيّرات وتاريخ تحديث البيانات ودرجة التركّز والتوافق الشرعي في مكان واحد.'],
      ['03 / MONITOR', '03 / راقب', 'Stay on top of changes', 'ابقَ على اطلاع', 'Follow portfolios and stocks, then let alerts surface what actually changed.', 'تابِع المحافظ والأسهم، ودع التنبيهات تُظهر ما تغيّر فعلًا.'],
    ];
    return `<section class="hero"><div><div class="eyebrow">${L('Discover → Evaluate → Monitor', 'اكتشف ← قيّم ← راقب')}</div>
        <h1>${L('Follow the people and portfolios shaping the market.', 'تابع المستثمرين وتعرّف على محافظهم.')}</h1>
        <p>${L('Mizan turns disclosed investor activity into a clear, human-centered intelligence feed. Discover who is moving, understand why it matters, and monitor the names you care about.', 'اكتشف تداولات المستثمرين من إفصاحاتهم. قارن أداء محافظهم، وتابع الأسهم التي تهمك، واطّلع على نتائج فحصها الشرعي.')}</p>
        <div class="actions"><a class="btn btn-primary" href="/portfolios" data-nav="portfolios">${L('Explore portfolios', 'استكشف المحافظ')}</a><a class="btn btn-secondary" href="/alerts" data-nav="alerts">${L('View new filings', 'شاهد الإفصاحات الجديدة')}</a></div></div>
        <div class="hero-note"><small>${L('Today in Mizan', 'اليوم في ميزان')}</small><strong>${esc(today)}</strong><div>${weekCounts.map(([l, n]) => badge(l, LANG === 'ar' ? `${t(VER[l].k)} · عدد الأسهم: ${n}` : `${n} ${t(VER[l].k).toUpperCase()}`)).join(' ')}<small style="display:block;margin-top:8px">${L('names traded, by Mizan Status', 'الأسهم المتداولة حسب التوافق الشرعي')}</small></div></div></section>
      <section><div class="section-title"><h2>${L('Featured investors', 'مستثمرون بارزون')}</h2><a href="/portfolios" data-nav="portfolios">${L('Explore all →', 'استكشف الكل ←')}</a></div>
        ${featured.length ? `<div class="discovery">${featured.map(investorCard).join('')}</div>` : emptyCard(t('empty.title'), t('empty.body'))}</section>
      <section><div class="section-title"><h2>${L('What changed', 'آخر التغيّرات')}</h2><a href="/alerts" data-nav="alerts">${L('See all alerts →', 'كل التنبيهات ←')}</a></div>
        <div class="grid three">${changes.map((r) => `<div class="signal-card" tabindex="0" role="link" data-open-stock="${esc(r.ticker)}">${badge(r.label)}<h3>${esc(L(r.actor, `\u2066${r.actor}\u2069`))} ${sideWord(r.side)} <span dir="ltr">${esc(r.ticker)}</span></h3><p>${esc(disclosedMoney(r))} · ${esc(L('filed', 'نُشر في'))} ${esc(shortDate(r[FIELD.filedDate]) || '—')}${lagText(r) ? ' · ' + esc(lagText(r)) : ''}</p></div>`).join('')}</div></section>
      <section style="margin-top:24px"><div class="section-title"><h2>${L('How Mizan works', 'كيف يعمل ميزان')}</h2></div>
        <div class="how">${steps.map((s) => `<div class="card step"><div class="step-num">${L(s[0], s[1])}</div><h3>${L(s[2], s[3])}</h3><p>${L(s[4], s[5])}</p></div>`).join('')}</div></section>
      ${footnote()}`;
  }

  // How many disclosed names actually back the equal-weight portfolio index / return.
  const idxCount = (p) => [...(p.heldMap || heldNames(p.rows).held)].filter(([tk, v]) => v.label !== 'fail' && v.label !== 'unscreened' && v.start && histOf(tk).length >= 2).length;
  const thinIdxNote = (p) => { const n = idxCount(p); return (p.ret && p.ret.val != null && !p.ret.indicative && n < MIN_HOLDINGS) ? L(`based on ${n} of ${p.holdings} names`, `الأسهم المستخدمة لحساب العائد: ${n} من ${p.holdings}`) : ''; };
  // Plain-language read: compliance mix + the SAME timeframe return shown on screen + activity.
  function mizanRead(p) {
    const r = p.ret || {}, known = r.val != null && isFinite(r.val);
    const note = thinIdxNote(p) ? L(', ', '، ') + thinIdxNote(p) : '';
    const ret = known ? L(`Return ${r.val >= 0 ? '▲' : '▼'} ${Math.abs(r.val).toFixed(1)}% (${r.indicative ? 'indicative, since disclosed' : r.tf || tfLabelNow()}${note}).`, `العائد ${r.val >= 0 ? '▲' : '▼'} ${Math.abs(r.val).toFixed(1)}% (${r.indicative ? 'تقديري، منذ الإفصاح' : r.tf || tfLabelNow()}${note}).`) : L('Return pending.', 'العائد غير متاح بعد.');
    const sh = shareOf(p);
    const comp = L(`${sh.pass} of ${sh.total} names pass AAOIFI (${sh.clean} Included, ${sh.purify} Watch)${sh.fail ? `; ${sh.fail} Excluded` : ''}${sh.unscreened ? `; ${sh.unscreened} pending screening` : ''}.`, `أسهم متوافقة: ${sh.pass} من ${sh.total} وفق المعيار الشرعي رقم 21 من أيوفي (متوافق: ${sh.clean}، يحتاج تطهيرًا: ${sh.purify})${sh.fail ? `؛ غير متوافق: ${sh.fail}` : ''}${sh.unscreened ? `؛ قيد الفحص: ${sh.unscreened}` : ''}.`);
    const act = L(`${plural(p.count, 'disclosure', 'disclosures')} across ${plural(p.holdings, 'name', 'names')}; latest filed ${ago(p.fresh)} ago.`, `عدد الإفصاحات: ${p.count}؛ عدد الأسهم: ${p.holdings}؛ آخر إفصاح منذ ${ago(p.fresh)}.`);
    return `${ret} ${comp} ${act}`;
  }

  /* ---- Portfolios (prototype/portfolios.html). */
  function portfolioPanel(p) {
    if (!p) return `<aside class="card panel">${emptyCard(t('dtl.pending'), t('empty.body'))}</aside>`;
    const moves = recentRows(p.rows, 30).length, events = p.rows.slice().sort(byFiled).slice(0, 3);
    const thin = p.holdings < MIN_HOLDINGS;
    return `<aside class="card panel"><div class="panel-head">${pAvatar(p)}<div><div class="eyebrow">${L('Selected investor', 'المستثمر المختار')}</div><h2>${esc(p.name)}</h2>${sharePill(p)}</div></div>
      <div class="hero">${retTag(p.ret)}</div>
      <div class="summary">${esc(L(`${moves} ${moves === 1 ? 'trade' : 'trades'} disclosed in the last 30 days.`, `عدد التداولات المعلنة خلال آخر 30 يومًا: ${moves}.`))} ${esc(mizanRead(p))}</div>
      <div class="activity">${events.map((r) => `<div class="event"><i></i><div><strong>${esc(sideWord(r.side).replace(/^./, (c) => c.toUpperCase()))} <span dir="ltr">${esc(r.ticker)}</span></strong><small>${esc(disclosedMoney(r))} · ${esc(shortDate(fDisclosed(r)) || '—')}${lagText(r) ? ' · ' + esc(lagText(r)) : ''}</small></div><span class="mono">${String(r.side).toUpperCase() === 'SELL' ? '↓' : '↑'}</span></div>`).join('')}</div>
      <div class="insight"><b>${L('Why it matters', 'ماذا تعني هذه البيانات؟')}</b><br>${esc(L(`Latest filing ${ago(p.fresh)} ago · ${plural(p.count, 'disclosure', 'disclosures')} across ${plural(p.holdings, 'holding', 'holdings')}. Open the profile to review holdings, weights and screening evidence.`, `آخر إفصاح منذ ${ago(p.fresh)} · عدد الإفصاحات: ${p.count}؛ عدد الأسهم: ${p.holdings}. اعرض التفاصيل للاطلاع على الأسهم وأوزانها وتفاصيل الفحص.`))}</div>
      <div style="display:flex;gap:8px;margin-top:14px"><a class="btn btn-primary" href="/portfolio/${encodeURIComponent(p.name)}" data-open-portfolio="${esc(p.name)}">${L('Open profile', 'عرض التفاصيل')}</a>${thin ? '' : `<button class="btn btn-secondary" type="button" data-follow="${esc(p.name)}">${S.follows.has(p.name) ? t('common.following') : t('common.follow')}</button>`}</div></aside>`;
  }
  function pagePortfolios() {
    S.tab = 'portfolios';
    const list = currentList(), all = eligible();
    const sel = list.find((p) => p.name === S.sel) || list[0];
    const statusOpts = [['all', L('Status: all', 'الحالة: الكل')], ['fully', L('All names Included', 'جميع الأسهم متوافقة')], ['watch', L('All pass · some purification', 'متوافقة مع حاجة للتطهير')], ['exclude', L('No excluded names', 'دون أسهم غير متوافقة')], ['excluded', L('Has excluded names', 'تضم أسهمًا غير متوافقة')]];
    const metric = (label, val, sub) => `<div class="metric"><span>${label}</span><b>${val}</b><small>${sub}</small></div>`;
    const rows = list.map((p) => `<tr data-select="${esc(p.name)}" aria-selected="${sel && sel.name === p.name}" tabindex="0">
        <td><a class="person" href="/portfolio/${encodeURIComponent(p.name)}" data-open-portfolio="${esc(p.name)}">${pAvatar(p)}<div><strong>${esc(p.name)}</strong><small>${esc(typeLabel(p.kind))} · ${esc(plural2(p.holdings, 'holding', 'holdings', 'الأسهم'))}</small></div></a></td>
        <td>${retTag(p.ret)}${thinIdxNote(p) && p.ret && p.ret.val != null ? `<small class="ctx">${esc(thinIdxNote(p))}</small>` : ''}</td>
        <td class="mono">${esc(plural2(p.count, 'update', 'updates', 'الإفصاحات'))}</td>
        <td class="mono">${ago(p.fresh)}<small>${esc(shortDate(latestFiling(p.rows)) || '—')}</small></td>
        <td>${sharePill(p)}</td><td>${star(p.name)}</td></tr>`).join('');
    return pageHead(L('Portfolio Intelligence', 'متابعة المحافظ'), L('People first. Data when you need it.', 'تعرّف على المحافظ وتابع أداءها.'), L('Compare disclosed portfolios without losing the human context behind each decision.', 'قارن العوائد والتداولات والأسهم في المحافظ المعلنة.'),
        sel ? `<button class="btn btn-primary" type="button" data-follow="${esc(sel.name)}">${S.follows.has(sel.name) ? t('common.following') : L('+ Follow portfolio', '+ متابعة المحفظة')}</button>` : '') +
      `<div class="metric-strip">${metric(L('Tracked portfolios', 'محافظ معروضة'), list.length, L(`of ${all.length} with ≥${MIN_HOLDINGS} holdings`, `من ${all.length}؛ لكل محفظة ${MIN_HOLDINGS} أسهم على الأقل`))}${metric(L('New filings', 'إفصاحات جديدة'), recentRows(list.flatMap((p) => p.rows), 30).length, L('last 30 days', 'آخر 30 يومًا'))}${metric(L('Fresh this week', 'محافظ بإفصاحات جديدة'), list.filter((p) => p.fresh != null && p.fresh <= 7).length, L('filed ≤ 7 days ago', 'خلال 7 أيام'))}${metric(L('All names pass', 'محافظ بأسهم متوافقة'), list.filter((p) => shareOf(p).pass === shareOf(p).total).length, L('no excluded or pending names', 'دون أسهم غير متوافقة أو أسهم قيد الفحص'))}${metric(L('With excluded names', 'تضم أسهمًا غير متوافقة'), list.filter((p) => shareOf(p).fail > 0).length, L('see the pass share per investor', 'نسبة الأسهم المتوافقة لكل محفظة'))}</div>
      <div class="toolbar">${seg(['1M', '3M', '6M', '1Y', '3Y', 'ALL'])}<select class="select" id="pSort" aria-label="${L('Sort', 'ترتيب')}">${P_SUB.map(([k]) => `<option value="${k}" ${k === S.pMetric ? 'selected' : ''}>${L('Sort: ', 'ترتيب: ')}${esc(t(P_SORT[k]).toLowerCase())}</option>`).join('')}</select><select class="select" id="pStatus" aria-label="${t('h.status')}">${statusOpts.map(([k, l]) => `<option value="${k}" ${S.compliance === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><input class="search" id="pSearch" type="search" style="width:220px" value="${esc(S.query)}" placeholder="${L('Find a portfolio', 'ابحث عن محفظة')}" aria-label="${L('Find a portfolio', 'ابحث عن محفظة')}"></div>
      <div class="grid two"><div class="card table-card"><table class="table"><thead><tr><th>${L('Investor', 'المستثمر')}</th><th>${L('Return', 'العائد')} (${esc(tfLabelNow())})</th><th>${L('Activity', 'النشاط')}</th><th>${L('Freshness', 'آخر إفصاح')}</th><th>${L('Mizan Status', 'التوافق الشرعي')}</th><th>${L('Follow', 'متابعة')}</th></tr></thead><tbody>${rows || `<tr><td colspan="6">${emptyCard(t('empty.title'), t('empty.body'), readinessNote())}</td></tr>`}</tbody></table></div>
      ${portfolioPanel(sel)}</div>${footnote()}`;
  }

  /* ---- Portfolio detail (prototype/portfolio-detail.html). */
  function screeningRows(rows) {
    const names = [...new Map(rows.map((r) => [r.ticker, r])).values()];
    const pct = (v) => v == null || v === '' || !isFinite(+v) ? '—' : (+v).toFixed(1) + '%';
    return names.map((r) => `<div class="holding"><span><b dir="ltr">${esc(r.ticker)}</b>${badge(r.label)}</span><span class="muted">${L('Debt', 'الديون')} ${pct(r.debtPct ?? r.debtRatio)} · ${L('Cash', 'النقد')} ${pct(r.cashPct)} · ${L('Impure', 'الدخل غير المباح')} ${pct(r.impurePct)}</span><span class="mono">${r.businessStatus === 'fail' ? L('Activity ✕', 'النشاط غير متوافق ✕') : r.businessStatus === 'pass' ? L('Activity ✓', 'النشاط متوافق ✓') : L('Review', 'مراجعة')}</span></div>`).join('');
  }
  function pagePortfolio(name) {
    const p = derivePortfolios(S.rows).find((x) => x.name === name);
    if (!p) return emptyCard(L('Portfolio not found', 'المحفظة غير موجودة'), L('It may not be in the current disclosure window.', 'قد لا تكون ضمن فترة الإفصاحات الحالية.'), `<a class="btn btn-primary" href="/portfolios" data-nav="portfolios">${L('Explore portfolios', 'استكشف المحافظ')}</a>`);
    const moves = recentRows(p.rows, 30).length;
    const holdings = {};
    for (const r of p.rows.filter((x) => p.heldMap.has(x.ticker))) { const h = holdings[r.ticker] || (holdings[r.ticker] = { ticker: r.ticker, company: r.company, label: r.label, v: 0, known: true, d: null }); h.known = h.known && (r[FIELD.positionValue] != null ? isFinite(+r[FIELD.positionValue]) : hasAmount(r)); h.v += fWeightBasis(r); const dd = fDisclosed(r); if (dd && (!h.d || Date.parse(dd) > Date.parse(h.d))) h.d = dd; }
    const hs = Object.values(holdings).sort((a, b) => b.v - a.v), totalV = hs.reduce((a, h) => a + h.v, 0) || 1, weightsKnown = hs.every((h) => h.known);
    // 13F snapshots store only each fund's top reported positions, so weights are shares of THOSE, not of the whole book.
    const is13F = p.rows.every((r) => /13F/i.test(r.source || r.kind || ''));
    const weightBasis = is13F ? L('of top reported positions', 'من أكبر الاستثمارات المعلنة') : p.rows.every((r) => r[FIELD.positionValue] != null) ? L('of portfolio', 'من المحفظة') : L('of disclosed value', 'من قيمة التداولات المعلنة');
    const thin = p.holdings < MIN_HOLDINGS;
    const idxN = idxCount(p);
    const exits = [...p.exitedMap].map(([tk, v]) => ({ ticker: tk, label: v.label, company: v.row.company, d: fDisclosed(v.row) })).sort((a, b) => (Date.parse(b.d) || 0) - (Date.parse(a.d) || 0));
    const sideTxt = (tk) => { const st = p.heldMap.get(tk); return L(`held since ${shortDate(st && st.start) || '—'}`, `منذ ${shortDate(st && st.start) || '—'}`); };
    const marks = p.rows.map((r) => ({ d: fDisclosed(r), side: r.side, label: r.ticker }));
    return `<div class="detail-hero">${pAvatar(p)}<div><div class="eyebrow">${esc(L('Investor profile', 'ملف المستثمر'))} · ${esc(typeLabel(p.kind))}</div><h1>${esc(p.name)}</h1><p>${esc(typeLabel(p.kind))} · ${esc(plural2(p.holdings, 'disclosed name', 'disclosed names', 'الأسهم في الإفصاحات'))} · ${esc(plural2(p.count, 'disclosure', 'disclosures', 'الإفصاحات'))}</p><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${sharePill(p)}<span class="chip">${esc(L(`Updated ${ago(p.fresh)} ago`, `آخر تحديث منذ ${ago(p.fresh)}`))}</span>${thin ? '' : star(p.name)}</div></div>
        <div class="detail-stat"><span class="muted">${L('Return', 'العائد')}</span><b class="hero-ret">${thin ? '<span class="return muted">—</span>' : retTag(p.ret)}</b><small class="muted">${esc(L(`${moves} ${moves === 1 ? 'trade' : 'trades'} in the last 30 days`, `عدد التداولات خلال آخر 30 يومًا: ${moves}`))}</small></div></div>
      <div class="detail-grid"><div class="grid">
        ${thin ? `<section class="card block"><h2>${L('Activity only', 'النشاط فقط')}</h2><p class="muted" style="line-height:1.6">${esc(L(`Fewer than ${MIN_HOLDINGS} distinct disclosed names, so this filer is not ranked, followable or shown as a portfolio return. The disclosures below are the evidence.`, `عدد الأسهم المعلنة أقل من ${MIN_HOLDINGS}. لذلك لا يظهر المستثمر في الترتيب، ولا يمكن متابعته، ولا نعرض عائد محفظته. يمكنك مراجعة إفصاحاته أدناه.`))}</p></section>` : `<section class="card block"><div class="section-title"><h2>${L('Portfolio movement', 'حركة المحفظة')}</h2>${seg(['1M', '3M', '6M', '1Y', 'ALL'])}</div><div style="display:flex;align-items:baseline;gap:10px">${retTag(p.ret)}${thinIdxNote(p) ? `<span class="chip">${esc(L(`Based on ${idxN} of ${p.holdings} names — indicative only`, `الأسهم المستخدمة لحساب العائد: ${idxN} من ${p.holdings} — تقديري فقط`))}</span>` : ''}</div>${chartFrame(chart(sliceTf(portfolioIndexHist(p.rows)), { unit: 'index', markers: marks, axis: true, empty: esc(idxN ? L('No prices in this period — try a longer timeframe', 'لا تتوفر أسعار لهذه الفترة — جرّب فترة أطول') : L('No cached prices yet for the passing names in this portfolio', 'أسعار الأسهم المتوافقة في هذه المحفظة غير متاحة بعد')) }), tradeLegend())}<p class="footnote">${esc(L(`Equal-weight index (start = 100) of ${idxN} of ${p.holdings} disclosed names — those with cached prices; Excluded names are left out. Trades outside the price window are not pinned.`, `مؤشر يبدأ من 100 ويعطي كل سهم الوزن نفسه. عدد الأسهم المستخدمة: ${idxN} من ${p.holdings}، بحسب الأسعار المتاحة. نستبعد الأسهم غير المتوافقة. لا تظهر علامات التداولات خارج فترة الأسعار.`))}</p></section>`}
        <section class="card block"><h2>${L('Current holdings', 'الأسهم الحالية')}</h2><div class="holdings">${hs.map((h) => `<div class="holding" tabindex="0" role="link" data-open-stock="${esc(h.ticker)}"><span><b dir="ltr">${esc(h.ticker)}</b>${badge(h.label)}</span><span class="muted">${esc(h.company || '')} · ${esc(sideTxt(h.ticker))} · ${esc(shortDate(h.d) || '—')}</span><span class="mono">${weightsKnown ? Math.round(h.v / totalV * 100) + '%' : '—'}<small class="ctx">${esc(weightBasis)}</small></span></div>`).join('') || `<p class="muted">${esc(L('No current holdings in the disclosures.', 'لا توجد أسهم حالية في الإفصاحات.'))}</p>`}</div>${exits.length ? `<h3 style="margin:18px 0 6px;font-size:14px">${L('Recent exits', 'خرج منها مؤخرًا')}</h3><div class="holdings">${exits.map((h) => `<div class="holding" tabindex="0" role="link" data-open-stock="${esc(h.ticker)}"><span><b dir="ltr">${esc(h.ticker)}</b>${badge(h.label)}</span><span class="muted">${esc(h.company || '')} · ${esc(L('sold', 'بيع'))} ${esc(shortDate(h.d) || '—')}</span><span class="mono">—</span></div>`).join('')}</div>` : ''}</section>
        <section class="card block"><div class="section-title"><h2>${L('Screening evidence', 'تفاصيل الفحص')}</h2><span class="chip">${LANG === 'ar' ? 'أيوفي · 30/30/5' : 'AAOIFI · 30/30/5'}</span></div><div class="holdings">${screeningRows(p.rows)}</div><p class="footnote">${esc(t('dtl.compNote'))}</p></section>
      </div><aside class="grid">
        <section class="card block"><h2>${L('What changed', 'آخر التغيّرات')}</h2><div class="timeline">${p.rows.slice().sort(byFiled).slice(0, 8).map((r) => `<div class="row"><span class="mono">${ago(daysSince(r[FIELD.filedDate]))}</span><div><b>${esc(sideWord(r.side).replace(/^./, (c) => c.toUpperCase()))} <span dir="ltr">${esc(r.ticker)}</span></b><div class="muted">${esc(disclosedMoney(r))} · ${esc(shortDate(fDisclosed(r)) || '—')}${lagText(r) ? ' · ' + esc(lagText(r)) : ''}</div></div>${badge(r.label)}</div>`).join('')}</div></section>
        <section class="card block"><h2>${L('Mizan read', 'ملخص المحفظة')}</h2><p class="muted" style="line-height:1.6">${esc(thin ? mizanRead({ ...p, ret: null }) : mizanRead(p))}</p><p class="footnote">${esc(t('dtl.evNote'))}</p></section>
      </aside></div>`;
  }

  /* ---- Stock detail (prototype/stock-detail.html). */
  function pageStock(ticker) {
    const rows = S.rows.filter((r) => r.ticker === ticker);
    if (!rows.length) return emptyCard(L('Stock not found', 'السهم غير موجود'), L('No disclosures for this ticker in the current window.', 'لا توجد إفصاحات لهذا الرمز خلال الفترة الحالية.'), `<a class="btn btn-primary" href="/stocks" data-nav="stocks">${L(...ROUTE_TITLES.stocks)}</a>`);
    const r0 = rows[0], filers = new Set(rows.map((r) => r.actor)).size, read = stockRead(ticker);
    const perfs = rows.map((r) => r.performance && r.performance.sinceDisclosed).filter((x) => x != null && isFinite(x));
    const ret = returnOf(histOf(ticker), perfs.length ? perfs.reduce((a, b) => a + b, 0) / perfs.length : null);
    const shist = sliceTf(histOf(ticker));
    const fullHist = histOf(ticker), asOf = fullHist.length ? fullHist[fullHist.length - 1].d : null, asOfAge = asOf ? daysSince(asOf) : null;
    const quote = (S.prices[ticker] && S.prices[ticker].quote != null) ? +S.prices[ticker].quote : (shist.length ? +shist[shist.length - 1].c : null);
    const ratio = (label, v, limit, basis) => { const n = v == null || v === '' || !isFinite(+v) ? null : +v; return `<div class="holding"><span>${label}</span><span class="muted">${n == null ? t('dtl.pending') : basis} · ${L('limit', 'الحد')} ${limit}%</span><span class="mono">${n == null ? '—' : n.toFixed(1) + '%'}</span></div>`; };
    const log = rows.slice().sort((a, b) => (Date.parse(fDisclosed(b)) || 0) - (Date.parse(fDisclosed(a)) || 0));
    return pageHead(L('Stock intelligence', 'متابعة الأسهم'), ticker, `${coName(r0.company) || ticker} · ${L(`Disclosed by ${plural(filers, 'filer', 'filers')}`, `عدد المستثمرين الذين تداولوه: ${filers}`)}`, badge(r0.label)) +
      `<div class="detail-grid"><div class="grid">
        <section class="card block"><div class="section-title"><h2>${L('Price & disclosed activity', 'السعر والتداولات المعلنة')}</h2><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${seg(['1M', '3M', '6M', '1Y', 'ALL'])}<span class="chip">${esc(!S.live ? dataLabel() : !S.pricesLive ? L('Prices pending', 'الأسعار غير متاحة بعد') : asOf ? L(`Close ${dayMonth(asOf)}`, `إغلاق ${dayMonth(asOf)}`) : L('No prices yet', 'لا أسعار بعد'))}</span></div></div><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">${retTag(ret)}<small class="ctx">${quote != null ? esc(fmtPrice(quote)) + ' · ' + esc(L('cached close', 'آخر إغلاق محفوظ')) + (asOf ? ' ' + esc(shortDate(asOf)) : '') : ''}</small>${asOfAge != null && asOfAge > STALE_DAYS ? `<span class="chip">${esc(L(`Stale · ${asOfAge}d old`, `سعر غير محدّث · المدة بالأيام: ${asOfAge}`))}</span>` : ''}</div>${chartFrame(chart(shist, { markers: rows.map((r) => ({ d: fDisclosed(r), side: r.side, label: r.actor })), axis: true, empty: esc(fullHist.length >= 2 ? L('No prices in this period — try a longer timeframe', 'لا تتوفر أسعار لهذه الفترة — جرّب فترة أطول') : L(`No cached price history for ${ticker} yet — the chart appears once our price provider covers it`, `لا يتوفر سجل أسعار محفوظ لـ ${ticker} بعد — يظهر الرسم عند توفر البيانات من مزوّد الأسعار`)) }), tradeLegend())}</section>
        <section class="card block"><h2>${L('Who traded it', 'من تداول السهم؟')}</h2><div class="holdings">${log.map((r) => { const g = groupOf(r.kind); return `<div class="holding"><span class="person" data-open-portfolio="${esc(r.actor)}" role="link" tabindex="0">${avatar(r.actor, { group: g, tone: r.label, row: r, initials: r.initials })}<span><b>${esc(r.actor)}</b><small class="ctx">${esc(r.source || typeLabel(r.kind))}</small></span></span><span class="muted">${esc(sideWord(r.side))} · ${esc(shortDate(fDisclosed(r)) || '—')}${lagText(r) ? ' · ' + esc(lagText(r)) : ''}${entryVsNow(r) ? `<small class="ctx">${entryVsNow(r)}</small>` : ''}</span><span class="mono">${esc(disclosedMoney(r))}</span></div>`; }).join('')}</div></section>
      </div><aside class="grid">
        <section class="card block"><h2>${L('Signal summary', 'ملخص التداولات')}</h2><p class="muted">${esc(read.sentence)}</p></section>
        <section class="card block"><h2>${L('Mizan Status', 'التوافق الشرعي')}</h2>${badge(r0.label)}<div class="holdings" style="margin-top:10px">${ratio(L('Interest-bearing debt', 'الديون بفائدة'), r0.debtPct ?? r0.debtRatio, 30, L('of market cap', 'من القيمة السوقية'))}${ratio(L('Cash & interest securities', 'النقد والأوراق المالية بفائدة'), r0.cashPct, 30, L('of market cap', 'من القيمة السوقية'))}${ratio(L('Non-permissible income', 'الدخل غير المباح'), r0.impurePct, 5, L('of revenue', 'من الإيرادات'))}</div><p class="muted" style="margin-top:10px">${L('Business activity', 'النشاط التجاري')}: ${r0.businessStatus === 'fail' ? L('does not pass', 'لم يجتز') : r0.businessStatus === 'pass' ? L('passes', 'اجتاز') : L('under review', 'قيد الفحص')}. <a href="/methodology" data-nav="methodology" style="text-decoration:underline">${L('Methodology', 'المنهجية')}</a></p><p class="footnote">${esc(t('dtl.compNote'))}</p></section>
      </aside></div>${footnote()}`;
  }

  /* ---- Stocks list (no prototype page — built from prototype pagehead, metric strip and table). */
  function pageStocks() {
    S.tab = 'stocks'; if (S.sMetric === 'flow') S.sMetric = 'bought';
    const list = currentList();
    const views = S_SUB.filter((x) => x[0] !== 'flow');
    const metric = (label, val, sub) => `<div class="metric"><span>${label}</span><b>${val}</b><small>${sub}</small></div>`;
    const rows = list.map((s) => `<tr data-open-stock="${esc(s.ticker)}" data-select tabindex="0">
        <td><div class="person">${avatar(s.ticker, { tone: s.label, initials: s.ticker.slice(0, 4), noPhoto: true })}<div><strong dir="ltr">${esc(s.ticker)}</strong><small>${esc(coName(s.company))}</small></div></div></td>
        <td><div style="display:flex;align-items:center;gap:12px"><div>${retTag(s.ret)}</div>${chart(sliceTf(histOf(s.ticker)), { cls: 'mz-chart--spark' })}</div></td>
        <td class="mono">${s.filerCount}</td><td class="mono">${s.rows.some(hasAmount) ? fmtMoney(s.dollar) : '—'}</td>
        <td class="mono">${ago(s.fresh)}</td><td>${badge(s.label)}</td><td>${star(s.ticker)}</td></tr>`).join('');
    return pageHead(L('Stock intelligence', 'متابعة الأسهم'), L('What disclosed investors are trading.', 'تداولات المستثمرين كما ترد في الإفصاحات.'), L('Every name carries its disclosed flow, filers and Mizan Status.', 'اطّلع على التداولات المعلنة لكل سهم، ومن تداوله، ونتيجة فحصه الشرعي.')) +
      `<div class="metric-strip">${metric(L('Names in view', 'أسهم معروضة'), list.length, esc(t(views.find((v) => v[0] === S.sMetric)[1])))}${metric(L('Disclosed value', 'قيمة التداولات المعلنة'), fmtMoney(list.reduce((a, s) => a + s.dollar, 0)), L('sum of disclosed ranges', 'مجموع القيم التقديرية في الإفصاحات'))}${metric(L('Filers', 'المستثمرون'), new Set(list.flatMap((s) => [...s.filers])).size, L('independent investors', 'مستثمرون مستقلون'))}${metric(L('Included', 'متوافق'), list.filter((s) => s.label === 'clean').length, (LANG === 'ar' ? 'أيوفي 30/30/5' : 'AAOIFI 30/30/5'))}${metric(L('Excluded', 'غير متوافق'), list.filter((s) => s.label === 'fail').length, L('shown for awareness', 'للاطلاع فقط'))}</div>
      <div class="toolbar">${seg(['1M', '3M', '6M', '1Y', '3Y', 'ALL'])}<select class="select" id="sView" aria-label="${L('View', 'العرض')}">${views.map(([k, lk]) => `<option value="${k}" ${k === S.sMetric ? 'selected' : ''}>${esc(t(lk))}</option>`).join('')}</select><select class="select" id="sStatus" aria-label="${t('h.status')}">${STATUS_OPTS().map(([k, l]) => `<option value="${k}" ${S.compliance === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><input class="search" id="pSearch" type="search" style="width:220px" value="${esc(S.query)}" placeholder="${L('Find a stock', 'ابحث عن سهم')}" aria-label="${L('Find a stock', 'ابحث عن سهم')}"></div>
      <div class="card table-card"><table class="table"><thead><tr><th>${L('Stock', 'السهم')}</th><th>${L('Return', 'العائد')} (${esc(tfLabelNow())})</th><th>${L('Filers', 'المستثمرون')}</th><th>${L('Disclosed value', 'قيمة التداولات المعلنة')}</th><th>${L('Freshness', 'آخر إفصاح')}</th><th>${L('Mizan Status', 'التوافق الشرعي')}</th><th>${L('Follow', 'متابعة')}</th></tr></thead><tbody>${rows || `<tr><td colspan="7">${emptyCard(t('empty.title'), t('empty.body'), readinessNote())}</td></tr>`}</tbody></table></div>${footnote()}`;
  }

  /* ---- Alerts (prototype/alerts.html). Same alert source as before: disclosures from the filers
     you follow, newest first; plus freshness notes for followed portfolios gone quiet (> 21d). */
  function pageAlerts() {
    const notes = S.rows.filter((r) => S.follows.has(r.actor)).sort(byFiled);
    const stale = eligible().filter((p) => S.follows.has(p.name) && p.fresh != null && p.fresh > 21);
    const f = S.alertFilter || 'all';
    const chips = [['all', L('All', 'الكل')], ['filings', L('New filings', 'إفصاحات جديدة')], ['freshness', L('Freshness', 'آخر إفصاح')]];
    const items = [
      ...(f === 'freshness' ? [] : notes.map((r) => { const d = daysSince(r[FIELD.filedDate]); return { d, html: `<div class="row"><span class="alert-tags">${d != null && d <= 7 ? `<span class="chip">${L('NEW', 'جديد')}</span>` : ''}${badge(r.label)}</span><div class="person" data-open-stock="${esc(r.ticker)}" role="link" tabindex="0">${avatar(r.actor, { group: groupOf(r.kind), tone: r.label, row: r, initials: r.initials })}<div><strong>${esc(L(r.actor, `\u2066${r.actor}\u2069`))} ${sideWord(r.side)} <span dir="ltr">${esc(r.ticker)}</span></strong><small>${esc(disclosedMoney(r))} · ${esc(L('disclosed', 'الإفصاح بتاريخ'))} ${esc(shortDate(fDisclosed(r)) || '—')}${lagText(r) ? ' · ' + esc(lagText(r)) : ''}</small></div></div><span class="mono">${ago(d)}</span></div>` }; })),
      ...(f === 'filings' ? [] : stale.map((p) => ({ d: p.fresh, html: `<div class="row"><span class="alert-tags"><span class="chip">${L('STALE', 'لا إفصاح حديث')}</span>${sharePill(p)}</span><div class="person" data-open-portfolio="${esc(p.name)}" role="link" tabindex="0">${pAvatar(p)}<div><strong>${esc(L(`${p.name} has no fresh disclosure in ${p.fresh} days`, `لا إفصاح جديد من \u2066${p.name}\u2069؛ المدة بالأيام: ${p.fresh}`))}</strong><small>${L('Evidence freshness', 'تاريخ الإفصاح')}</small></div></div><span class="mono">${ago(p.fresh)}</span></div>` }))),
    ].sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    return pageHead(L('Monitor', 'راقب'), L('Alerts that explain what changed.', 'تابع آخر التغيّرات.'), L('From the investors you follow, newest first, with amount, date and filing lag.', 'تداولات من تتابعهم، من الأحدث إلى الأقدم. مع المبلغ والتاريخ ومدة تأخر الإفصاح.'), `<a class="btn btn-primary" href="/account" data-nav="account">${L('Alert settings', 'إعدادات التنبيهات')}</a>`) +
      `<div class="toolbar">${chips.map(([k, l]) => `<button type="button" class="chip ${f === k ? 'on' : ''}" data-alert="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>` +
      (items.length ? `<div class="card block alerts"><div class="timeline">${items.map((x) => x.html).join('')}</div></div>`
        : emptyCard(S.follows.size ? L("You're all caught up", 'اطّلعت على جميع التنبيهات') : L('No alerts yet', 'لا توجد تنبيهات بعد'), L('Follow portfolios to be notified here when they file new disclosures.', 'تابع المحافظ لتصلك تنبيهات هنا عند نشر إفصاحات جديدة.'), `<a class="btn btn-primary" href="/portfolios" data-nav="portfolios">${L('Explore portfolios', 'استكشف المحافظ')}</a>`));
  }

  /* ---- Following (featured-investor cards for what you follow). */
  function pageFollowing() {
    const ports = eligible().filter((p) => S.follows.has(p.name));
    const stocks = [...S.follows].filter((id) => !ports.some((p) => p.name === id) && S.rows.some((r) => r.ticker === id));
    return pageHead(L('Watchlist', 'قائمة المتابعة'), L('The people and names you follow.', 'المحافظ والأسهم التي تتابعها.'), L('Open any profile to see what changed since you last looked.', 'اعرض التفاصيل لمتابعة آخر التغيّرات.')) +
      (ports.length ? `<section><div class="section-title"><h2>${L('Portfolios', 'المحافظ')}</h2></div><div class="discovery">${ports.map(investorCard).join('')}</div></section>` : '') +
      (stocks.length ? `<section><div class="section-title"><h2>${L('Stocks', 'الأسهم')}</h2></div><div class="grid three">${stocks.map((tk) => { const r = S.rows.filter((x) => x.ticker === tk).sort(byFiled)[0]; return `<div class="signal-card" tabindex="0" role="link" data-open-stock="${esc(tk)}">${badge(r.label)}<h3 dir="ltr">${esc(tk)}</h3><p>${esc(coName(r.company))} · ${esc(L('latest filing', 'آخر إفصاح'))} ${esc(shortDate(r[FIELD.filedDate]) || '—')}</p></div>`; }).join('')}</div></section>` : '') +
      (!ports.length && !stocks.length ? emptyCard(L("You're not following anyone yet", 'قائمة متابعاتك فارغة'), L('Follow a portfolio or stock to keep it here.', 'تابع محفظة أو سهمًا ليظهر هنا.'), `<a class="btn btn-primary" href="/portfolios" data-nav="portfolios">${L('Explore portfolios', 'استكشف المحافظ')}</a>`) : '');
  }

  /* ---- Account + Methodology (supporting pages, package card blocks). */
  function myHoldingsBlock() {
    const exp = myExposure();
    const head = `<h2>${L('My portfolio', 'محفظتي')} <span class="chip" style="margin-inline-start:6px">${L('Read-only', 'قراءة فقط')}</span></h2><p class="muted" style="line-height:1.5">${L('Add your holdings to see your Mizan Status mix. Informational only — no broker, no orders. Stored only in this browser.', 'أضف أسهمك للاطلاع على توزيعها بحسب التوافق الشرعي. لأغراض معلوماتية فقط — ليست نصيحة استثمارية. لا تتوفر وساطة أو أوامر تداول. تُحفظ الأسهم في هذا المتصفح فقط.')}</p>`;
    if (!exp) return `<section class="card block">${head}<textarea class="field" id="myHoldingsInput" rows="3" placeholder="${L('Ticker, then optional amount — e.g. MSFT 15000', 'رمز السهم ثم المبلغ اختياريًا — مثل MSFT 15000')}" aria-label="${L('Holdings', 'الأسهم')}"></textarea><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-primary" type="button" id="myImportBtn">${L('Import holdings', 'إضافة الأسهم')}</button><button class="btn btn-secondary" type="button" id="mySampleBtn">${L('Try sample holdings', 'جرّب محفظة نموذجية')}</button></div></section>`;
    const share = (k) => Math.round((exp.mix[k] || 0) * 100);
    return `<section class="card block">${head}<div class="metric-strip" style="grid-template-columns:repeat(4,1fr)">${[['clean', t('v.compliant')], ['purify', t('v.purify')], ['fail', t('v.noncompliant')], ['unscreened', t('v.review')]].map(([k, l]) => `<div class="metric"><span>${esc(l)}</span><b>${share(k)}%</b><small>${L('of your holdings', 'من أسهمك')}</small></div>`).join('')}</div>
      <div class="holdings">${exp.rows.map((h) => `<div class="holding"><span><b dir="ltr">${esc(h.ticker)}</b>${badge(h.label)}</span><span class="muted">${esc(h.company || L('under review', 'قيد الفحص'))}</span><span class="mono">${Math.round(h.weight * 100)}%<small class="ctx">${exp.hasValues ? L('weight', 'من المحفظة') : L('equal weight — no amounts', 'نسبة متساوية — لم تُضف مبالغ')}</small></span></div>`).join('')}</div>
      ${exp.mix.purify > 0 && exp.purifyPct > 0 ? `<p class="footnote">${esc(L(`Est. purification ~${exp.purifyPct}% of dividends on the ownable names.`, `نسبة التطهير التقديرية: نحو ${exp.purifyPct}% من توزيعات أرباح الأسهم المتوافقة.`))}</p>` : ''}
      <button class="btn btn-secondary" type="button" id="myClearBtn" style="margin-top:12px">${L('Clear my portfolio', 'مسح محفظتي')}</button></section>`;
  }
  function pageAccount() {
    const opts = (attr, cur, list) => `<div class="toolbar" style="margin:10px 0 0">${list.map(([k, l]) => `<button type="button" class="chip ${cur === k ? 'on' : ''}" ${attr}="${k}" aria-pressed="${cur === k}">${esc(l)}</button>`).join('')}</div>`;
    return pageHead(L('Account', 'الحساب'), L('Your workspace, on your terms.', 'اضبط ميزان كما يناسبك.'), L('Language, default filters and your read-only holdings.', 'اختر اللغة والتصفية، وأضف أسهمك للاطلاع على توافقها الشرعي.')) +
      `<div class="grid two"><div class="grid">${myHoldingsBlock()}</div><aside class="grid">
        <section class="card block"><h2>${L('Language', 'اللغة')}</h2>${opts('data-lang', LANG, [['en', 'English'], ['ar', 'العربية']])}</section>
        <section class="card block"><h2>${L('Default Mizan Status filter', 'التصفية الافتراضية للأسهم')}</h2><p class="muted">${L('Sets the default across every list.', 'يُطبّق اختيارك على جميع القوائم.')}</p>${opts('data-fc', S.compliance, [['all', L('All', 'الكل')], ['fully', t('f.fully')], ['exclude', t('f.exclude')]])}</section>
        <section class="card block"><h2>${L('Methodology', 'المنهجية')}</h2><p class="muted" style="line-height:1.55">${LANG === 'ar' ? 'المعيار الشرعي رقم 21 من أيوفي · 30/30/5.' : 'AAOIFI Standard No. 21 · 30/30/5.'}</p><a class="btn btn-secondary" href="/methodology" data-nav="methodology">${L('Read the methodology', 'اقرأ المنهجية')}</a></section>
      </aside></div>${footnote()}`;
  }
  function pageMethodology() {
    const rule = (label, limit, basis) => `<div class="holding"><span><b>${label}</b></span><span class="muted">${basis}</span><span class="mono">&lt; ${limit}%</span></div>`;
    return pageHead(L('Methodology', 'المنهجية'), L('How Mizan Status is decided.', 'كيف نفحص التوافق الشرعي؟'), (LANG === 'ar' ? 'المعيار الشرعي رقم 21 من أيوفي' : 'AAOIFI Shari’ah Standard No. 21')) +
      `<div class="detail-grid"><section class="card block"><h2>${LANG === 'ar' ? 'أيوفي 30/30/5' : 'AAOIFI 30/30/5'}</h2><p class="muted" style="line-height:1.65">${esc(t('sec.mtext'))}</p><div class="holdings" style="margin-top:12px">${rule(L('Interest-bearing debt', 'الديون بفائدة'), 30, L('of market cap', 'من القيمة السوقية'))}${rule(L('Cash & interest-bearing securities', 'النقد والأوراق المالية بفائدة'), 30, L('of market cap', 'من القيمة السوقية'))}${rule(L('Non-permissible income', 'الدخل غير المباح'), 5, L('of revenue', 'من الإيرادات'))}</div></section>
        <aside class="grid"><section class="card block"><h2>${L('Status states', 'نتائج الفحص')}</h2><div class="holdings">${[['clean', L('Passes every screen.', 'يجتاز فحص النشاط والنسب المالية.')], ['purify', L('Passes, with a small purification obligation.', 'يجتاز الفحص، مع تطهير توزيعات الأرباح.')], ['fail', L('Fails a screen — shown for awareness only.', 'لا يجتاز الفحص. يظهر للاطلاع فقط.')], ['unscreened', L('Not screened yet — never shown as included.', 'لم يُفحص بعد — لا نعدّه متوافقًا قبل اكتمال الفحص.')]].map(([k, d]) => `<div class="holding"><span>${badge(k)}</span><span class="muted">${d}</span><span></span></div>`).join('')}</div></section></aside></div>${footnote()}`;
  }

  /* ---- Lightweight Charts ("trade graph") upgrade of the shared chart(). Detail charts mount
     TradingView's open-source renderer on the SAME cached series, with disclosed buys/sells as
     markers. Cobalt/ink only. Without the library (offline) the SVG chart + scrub stay as-is. */
  let LW_CHARTS = [];
  document.getElementById('lwjs')?.addEventListener('load', () => { if (!S.loading) mountTradeCharts(); });
  const rgba = (hex, a) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex).trim()); return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : `rgba(60,111,150,${a})`; };
  function mountTradeCharts() {
    LW_CHARTS.forEach((c) => { try { c.remove(); } catch (e) { /* already detached */ } }); LW_CHARTS = [];
    const LW = window.LightweightCharts; if (!LW || !LW.createChart) return;
    const css = getComputedStyle(document.documentElement), v = (n, f) => (css.getPropertyValue(n) || '').trim() || f;
    const blue = v('--blue', '#3c6f96'), ink = v('--ink', '#17201b'), muted = v('--muted', '#6f786f'), line = v('--line', '#dde2dc');
    document.querySelectorAll('.mz-chart--full[data-series]').forEach((el) => {
      let data, marks = [];
      try { data = JSON.parse(el.dataset.series); marks = el.dataset.marks ? JSON.parse(el.dataset.marks) : []; } catch (e) { return; }
      const seen = new Set();
      const pts = data.map(([d, c]) => ({ time: String(d).slice(0, 10), value: +c })).filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.time) && isFinite(p.value) && !seen.has(p.time) && seen.add(p.time)).sort((a, b) => (a.time < b.time ? -1 : 1));
      if (pts.length < 2) return;
      const unit = el.dataset.unit, svgFallback = el.innerHTML, series = el.dataset.series;
      el.removeAttribute('data-series'); el.innerHTML = ''; el.classList.add('mz-chart--lw'); el.style.height = '';
      try {
      const c = LW.createChart(el, {
        autoSize: true,
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: muted, fontFamily: v('--font', 'system-ui'), fontSize: 11 },
        grid: { vertLines: { visible: false }, horzLines: { color: line } },
        rightPriceScale: { borderVisible: false }, timeScale: { borderVisible: false, ...(LANG === 'ar' ? { tickMarkFormatter: (d) => dayMonth(typeof d === 'object' ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : typeof d === 'number' ? new Date(d * 1000).toISOString() : d) } : {}) },
        crosshair: { mode: LW.CrosshairMode.Magnet },
        handleScroll: false, handleScale: false,
        localization: { ...(LANG === 'ar' ? { locale: 'ar-u-nu-latn', timeFormatter: (d) => shortDate(typeof d === 'object' ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : typeof d === 'number' ? new Date(d * 1000).toISOString() : d) } : {}), priceFormatter: (x) => unit === 'index' ? x.toFixed(1) : '$' + x.toFixed(2) },
      });
      const s = c.addAreaSeries({ lineColor: blue, topColor: rgba(blue, 0.2), bottomColor: rgba(blue, 0), lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
      s.setData(pts);
      const lo = Date.parse(pts[0].time) - 4 * 864e5, hi = Date.parse(pts[pts.length - 1].time) + 4 * 864e5;
      const near = (d) => { const tt = Date.parse(d); if (!isFinite(tt) || tt < lo || tt > hi) return null; let best = null, bd = Infinity; for (const p of pts) { const dd = Math.abs(Date.parse(p.time) - tt); if (dd < bd) { bd = dd; best = p.time; } } return best; };
      // Group trades by (date, side): one arrow each, no inline text (19 labels on one week were
      // unreadable). What was traded shows in the shared tooltip when the crosshair reaches it.
      const groups = new Map();
      marks.forEach(([d, side, label]) => { const time = near(d); if (!time) return; const k = time + side; const g = groups.get(k) || { time, side, labels: [] }; if (label && !g.labels.includes(label)) g.labels.push(label); groups.set(k, g); });
      const mk = [...groups.values()].map((g) => ({ time: g.time, position: g.side === 'S' ? 'aboveBar' : 'belowBar', color: g.side === 'S' ? ink : blue, shape: g.side === 'S' ? 'arrowDown' : 'arrowUp', size: 1 }))
        .sort((a, b) => (a.time < b.time ? -1 : 1));
      if (mk.length) s.setMarkers(mk);
      c.subscribeCrosshairMove((prm) => {
        const tm = prm && prm.time, b = tm && groups.get(tm + 'B'), sl = tm && groups.get(tm + 'S');
        if (!tm || !prm.point || (!b && !sl)) { chartHideTip(); return; }
        const list = (g, word) => g ? `${word} ${LANG === 'ar' ? g.labels.slice(0, 4).map((d) => '\u2066' + d + '\u2069').join('، ') : g.labels.slice(0, 4).join(', ')}${g.labels.length > 4 ? ` +${g.labels.length - 4}` : ''}` : '';
        chartTip.textContent = [list(b, L('▲ Bought', '▲ شراء')), list(sl, L('▼ Sold', '▼ بيع'))].filter(Boolean).join(' · ') + ' · ' + shortDate(tm);
        chartTip.classList.add('is-on');
        const rect = el.getBoundingClientRect(), half = chartTip.getBoundingClientRect().width / 2;
        chartTip.style.left = Math.max(half + 8, Math.min(window.innerWidth - half - 8, rect.left + prm.point.x)) + 'px';
        chartTip.style.top = Math.max(chartTip.getBoundingClientRect().height + 16, rect.top + prm.point.y) + 'px';
      });
      c.timeScale().fitContent();
      LW_CHARTS.push(c);
      } catch (err) { // never leave a blank frame: restore the shared SVG chart + scrub
        el.innerHTML = svgFallback; el.dataset.series = series; el.classList.remove('mz-chart--lw');
      }
    });
  }

  /* ---- Routing + render. Existing routes keep working (/portfolios, /stocks, /portfolio/:id,
     /stock/:t, /following, /alerts, /account); "/" is now Discover. */
  function parsePath() {
    const seg0 = (location.protocol === 'file:' ? location.hash.slice(1) : location.pathname).replace(/^\/+|\/+$/g, '').split('/');
    const a = seg0[0] || 'discover';
    let id = seg0[1] || null; try { id = id && decodeURIComponent(id); } catch (e) { /* keep the raw segment */ }
    S.id = id;
    if (a === 'portfolio' && S.id) S.page = 'portfolio';
    else if (a === 'stock' && S.id) S.page = 'stock';
    else S.page = ROUTE_TITLES[a] ? a : 'discover';
  }
  function setPath(path) { history.pushState({}, '', location.protocol === 'file:' ? '#' + path : path); }
  function go(path) { setPath(path); parsePath(); window.scrollTo(0, 0); render(); }
  window.addEventListener('popstate', () => { parsePath(); render(); });

  function render() {
    renderShell();
    const main = document.getElementById('main');
    if (S.loading) { main.innerHTML = `<div class="card empty" role="status"><h3>${L('Reading disclosures…', 'جارٍ قراءة الإفصاحات…')}</h3><p>${L('Preparing the evidence for your workspace.', 'جارٍ تحميل بيانات المحافظ والأسهم.')}</p></div>`; return; }
    const pages = { discover: pageDiscover, portfolios: pagePortfolios, portfolio: () => pagePortfolio(S.id), stocks: pageStocks, stock: () => pageStock(S.id), alerts: pageAlerts, following: pageFollowing, account: pageAccount, methodology: pageMethodology };
    main.innerHTML = (pages[S.page] || pageDiscover)() + `<p class="credit">${L('Portraits: Wikimedia Commons / U.S. Congress (public domain), where available.', 'الصور: ويكيميديا كومنز / الكونغرس الأمريكي (ضمن الملكية العامة) عند توفرها.')}</p>`;
    mountTradeCharts();
  }

  /* ---- Events (delegated). */
  const openPortfolio = (name) => go('/portfolio/' + encodeURIComponent(name));
  const openStock = (tk) => go('/stock/' + encodeURIComponent(tk));
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-nav],[data-open-portfolio],[data-open-stock],[data-star],[data-follow],[data-tf],[data-lang],[data-fc],[data-alert],[data-select],#langToggle,#kbdBtn,#topFollow,#myImportBtn,#mySampleBtn,#myClearBtn');
    if (!el) return;
    if (el.id === 'langToggle') { e.preventDefault(); setLang(LANG === 'en' ? 'ar' : 'en'); render(); return; }
    if (el.id === 'kbdBtn') { document.getElementById('search').focus(); return; }
    if (el.id === 'topFollow') { if (el.dataset.followId) { toggleFollow(el.dataset.followId); render(); } else go('/portfolios'); return; }
    if (el.dataset.star != null) { e.preventDefault(); e.stopPropagation(); toggleFollow(el.dataset.star); render(); return; }
    if (el.dataset.follow) { e.preventDefault(); toggleFollow(el.dataset.follow); render(); return; }
    if (el.dataset.tf) { S.tf = el.dataset.tf; render(); return; }
    if (el.dataset.lang) { setLang(el.dataset.lang); render(); return; }
    if (el.dataset.fc) { S.compliance = el.dataset.fc; render(); return; }
    if (el.dataset.alert) { S.alertFilter = el.dataset.alert; render(); return; }
    if (el.dataset.nav) { e.preventDefault(); go(el.dataset.nav === 'discover' ? '/' : '/' + el.dataset.nav); return; }
    if (el.dataset.openPortfolio) { e.preventDefault(); e.stopPropagation(); openPortfolio(el.dataset.openPortfolio); return; }
    if (el.dataset.openStock) { e.preventDefault(); openStock(el.dataset.openStock); return; }
    if (el.dataset.select) { S.sel = el.dataset.select; render(); return; }
    if (el.id === 'myImportBtn') { const ta = document.getElementById('myHoldingsInput'); const parsed = parseHoldings(ta ? ta.value : ''); if (parsed.length) { S.myHoldings = parsed; saveMyHoldings(); render(); } return; }
    if (el.id === 'mySampleBtn') { S.myHoldings = MY_SAMPLE.slice(); saveMyHoldings(); render(); return; }
    if (el.id === 'myClearBtn') { S.myHoldings = []; saveMyHoldings(); render(); return; }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('search').focus(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="link"],[data-select],[data-open-stock]') && !e.target.matches('a,button,input,select,textarea')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('change', (e) => {
    const id = e.target.id;
    if (id === 'pSort') S.pMetric = e.target.value; else if (id === 'pStatus' || id === 'sStatus') S.compliance = e.target.value; else if (id === 'sView') S.sMetric = e.target.value; else return;
    render(); const f = document.getElementById(id); if (f) f.focus();
  });
  // Search: filters the Portfolios / Stocks lists; typing elsewhere jumps to Portfolios.
  let searchTimer = null;
  document.addEventListener('input', (e) => {
    if (e.target.id !== 'search' && e.target.id !== 'pSearch') return;
    S.query = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const keepFocus = e.target.id, pos = e.target.selectionStart;
      if (!['portfolios', 'stocks'].includes(S.page)) go('/portfolios'); else render();
      const f = document.getElementById(keepFocus); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (err) { /* type=search */ } }
    }, 160);
  });

  function toggleFollow(id) {
    const portfolio = derivePortfolios(S.rows).find((p) => p.name === id);
    if (portfolio && portfolio.holdings < MIN_HOLDINGS) return; // thin-data gate: not followable
    S.follows.has(id) ? S.follows.delete(id) : S.follows.add(id);
  }

  /* ---------------------------------------------------------------- boot */
  parsePath(); render(); load();
})();

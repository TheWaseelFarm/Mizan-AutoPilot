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
  };

  /* ---------------------------------------------------------------- i18n */
  const STR = {
    en: {
      'tab.portfolios': 'Portfolios', 'tab.stocks': 'Stocks', 'tab.following': 'Following', 'tab.alerts': 'Alerts', 'tab.account': 'Account',
      'p.title': 'Portfolio Intelligence', 'p.sub': 'Track performance, activity, holdings and recent changes across monitored portfolios.',
      's.title': 'Stock intelligence', 's.sub': 'Explore disclosed activity with evidence and Sharia context.',
      'sv.top': 'Top performers', 'sv.active': 'Most active', 'sv.followed': 'Most followed', 'sv.alloc': 'Highest compliant allocation', 'sv.conc': 'Most concentrated', 'sv.lag': 'Fastest to disclose',
      'so.conc': 'Concentration (HHI)', 'so.lag': 'Disclosure lag',
      'sv.bought': 'Most bought', 'sv.sold': 'Most sold', 'sv.flow': 'Net flow', 'sv.new': 'New positions', 'sv.incr': 'Increased', 'sv.red': 'Reduced', 'sv.exit': 'Exited',
      'so.net': 'Absolute net flow', 'flow.note': 'Net flow = gross buying − gross selling over the disclosed window. Non-compliant names stay visible for market awareness but are never actionable. Informational only — not advice.',
      'c.filter': 'Filter', 'c.sort': 'Sort', 'c.compare': 'Compare', 'c.why': 'Why this ranking?', 'c.clear': 'Clear all', 'c.search': 'Search portfolios, investors or stocks',
      'so.return': 'Disclosed return', 'so.activity': 'Disclosed activity', 'so.followers': 'Followers', 'so.alloc': 'Compliant allocation',
      'so.value': 'Disclosed value', 'so.weight': 'Position weight', 'so.filers': 'Number of filers',
      'v.compliant': 'Included', 'v.purify': 'Watch', 'v.noncompliant': 'Excluded', 'v.review': 'Review',
      'f.all': 'All names (incl. non-compliant)', 'f.fully': 'Compliant only', 'f.exclude': 'Exclude non-compliant', 'f.evAll': 'Any evidence strength',
      'h.rank': 'Rank', 'h.portfolio': 'Portfolio / filer', 'h.type': 'Type', 'h.return': 'Disclosed return', 'h.activity': 'Activity',
      'h.freshness': 'Evidence freshness', 'h.allocation': 'Sharia allocation', 'h.purify': 'Purification', 'h.followers': 'Followers',
      'h.stock': 'Stock & company', 'h.signal': 'Signal / activity', 'h.evidence': 'Evidence', 'h.filers': 'Filers', 'h.value': 'Disclosed value', 'h.since': 'Since disclosed', 'h.status': 'Sharia status',
      'ev.high': 'High', 'ev.medium': 'Medium', 'ev.low': 'Low',
      'cmp.title': 'Compare portfolios', 'cmp.return': 'Disclosed return', 'cmp.disclosures': 'Disclosures', 'cmp.alloc': 'Compliant allocation', 'cmp.purify': 'Purification exposure', 'cmp.followers': 'Followers', 'cmp.open': 'Open comparison', 'cmp.tray': 'Compare {n} portfolios', 'cmp.pick': 'Select one more to compare', 'cmp.note': 'All metrics use the latest disclosed filings. Not investment advice.',
      'ev.title': '{t} evidence', 'ev.why': 'Why {s} evidence?', 'ev.review': 'Review full evidence', 'ev.recent': 'Recent filer activity', 'ev.setalert': 'Set alert',
      'g.portfolios': 'Rankings reflect disclosed data and calculated metrics for the selected period. Performance is never colored like a Sharia verdict; this is not advice to buy or sell.',
      'g.disclaimer': 'Screening based on AAOIFI Standard No. 21. Informational only — past disclosed-holdings evidence, delayed by up to 45 days. Not investment advice, brokerage, or a fatwa.',
      'meta.count': '{n} shown', 'live': 'Delayed data', 'sample': 'Sample data', 'freshUpdated': 'Updated',
      'empty.title': 'Nothing matches these filters', 'empty.body': 'Try clearing a filter or widening the time period.',
      'acct.title': 'Account', 'acct.lang': 'Language', 'follow.title': 'Following', 'alerts.title': 'Alerts',
      'common.follow': 'Follow', 'common.following': 'Following', 'common.watch': 'Watch',
      'dtl.portfolio': 'Portfolio', 'dtl.stock': 'Stock', 'dtl.return': 'Disclosed return', 'dtl.returnSub': 'Disclosed-holdings performance',
      'dtl.pending': 'Pending', 'dtl.pendingSub': 'Not enough price history yet', 'dtl.attention': 'Attention',
      'dtl.indicativeSub': 'Indicative — disclosed return, awaiting live prices', 'dtl.weight': 'weight', 'dtl.disclosed': 'disclosed', 'dtl.bought': 'Bought', 'dtl.sold': 'Sold', 'dtl.filedLater': 'filed {n}d later',
      'dtl.followers': 'followers', 'dtl.disclosures': 'disclosures', 'dtl.buyers': 'filers buying', 'dtl.filers': 'total filers',
      'dtl.perf': 'Performance', 'dtl.holdings': 'Top holdings', 'dtl.who': 'Who bought & sold', 'dtl.activity': 'Activity log',
      'dtl.nojudge': 'Not enough data yet to judge.', 'dtl.evNote': 'Disclosed-holdings evidence, delayed by filing lag (up to 45 days). Informational only — not advice or a recommendation to follow.',
      'dtl.compNote': 'Compliance is shown as a label (AAOIFI Standard No. 21). Screening is a filter you apply elsewhere — it does not change the performance shown.',
      'sec.methodology': 'Methodology', 'sec.mtext': 'Screening follows AAOIFI Shariah Standard No. 21 — the current "30/30/5" rule. Two screens, both required: (1) permissible business activity, and (2) financial ratios vs. market capitalization — interest-bearing debt < 30%, cash + interest-bearing securities < 30%, and non-permissible income < 5% of revenue. Over any limit is Non-compliant. Some impure income (0–5%) is Compliant · purify — you purify that share of dividends. (The 33% figure used by some index providers is not AAOIFI.)',
    },
    ar: {
      'tab.portfolios': 'المحافظ', 'tab.stocks': 'الأسهم', 'tab.following': 'المتابَعون', 'tab.alerts': 'التنبيهات', 'tab.account': 'الحساب',
      'p.title': 'ذكاء المحافظ', 'p.sub': 'تابِع الأداء والنشاط والحيازات والتغيّرات الأخيرة عبر المحافظ المُراقبة.',
      's.title': 'ذكاء الأسهم', 's.sub': 'استكشف النشاط المُفصَح عنه مع الأدلة والسياق الشرعي.',
      'sv.top': 'الأفضل أداءً', 'sv.active': 'الأكثر نشاطًا', 'sv.followed': 'الأكثر متابعة', 'sv.alloc': 'أعلى تخصيص متوافق', 'sv.conc': 'الأكثر تركيزًا', 'sv.lag': 'الأسرع إفصاحًا',
      'so.conc': 'التركيز (HHI)', 'so.lag': 'زمن الإفصاح',
      'sv.bought': 'الأكثر شراءً', 'sv.sold': 'الأكثر بيعًا', 'sv.flow': 'صافي التدفق', 'sv.new': 'مراكز جديدة', 'sv.incr': 'زيادة', 'sv.red': 'تخفيض', 'sv.exit': 'خروج',
      'so.net': 'صافي التدفق المطلق', 'flow.note': 'صافي التدفق = إجمالي الشراء − إجمالي البيع خلال نافذة الإفصاح. تبقى الأسماء غير المتوافقة ظاهرة للوعي بالسوق لكنها غير قابلة للتنفيذ. لأغراض معلوماتية فقط — ليست نصيحة.',
      'c.filter': 'تصفية', 'c.sort': 'ترتيب', 'c.compare': 'مقارنة', 'c.why': 'لماذا هذا الترتيب؟', 'c.clear': 'مسح الكل', 'c.search': 'ابحث عن محفظة أو مستثمر أو سهم',
      'so.return': 'العائد المُفصَح', 'so.activity': 'النشاط المُفصَح', 'so.followers': 'المتابِعون', 'so.alloc': 'التخصيص المتوافق',
      'so.value': 'القيمة المُفصَح عنها', 'so.weight': 'وزن المركز', 'so.filers': 'عدد المُفصِحين',
      'v.compliant': 'مُدرَج', 'v.purify': 'مراقبة', 'v.noncompliant': 'مُستبعَد', 'v.review': 'قيد المراجعة',
      'f.all': 'كل الأسماء (متضمنة غير المتوافقة)', 'f.fully': 'المتوافقة فقط', 'f.exclude': 'استبعاد غير المتوافقة', 'f.evAll': 'أي قوة أدلة',
      'h.rank': 'الترتيب', 'h.portfolio': 'المحفظة / المُفصِح', 'h.type': 'النوع', 'h.return': 'العائد المُفصَح', 'h.activity': 'النشاط',
      'h.freshness': 'حداثة الأدلة', 'h.allocation': 'التخصيص الشرعي', 'h.purify': 'التطهير', 'h.followers': 'المتابِعون',
      'h.stock': 'السهم والشركة', 'h.signal': 'الإشارة / النشاط', 'h.evidence': 'الأدلة', 'h.filers': 'المُفصِحون', 'h.value': 'القيمة المُفصَح عنها', 'h.since': 'منذ الإفصاح', 'h.status': 'الحالة الشرعية',
      'ev.high': 'قوي', 'ev.medium': 'متوسط', 'ev.low': 'ضعيف',
      'cmp.title': 'مقارنة المحافظ', 'cmp.return': 'العائد المُفصَح', 'cmp.disclosures': 'الإفصاحات', 'cmp.alloc': 'التخصيص المتوافق', 'cmp.purify': 'نسبة التطهير', 'cmp.followers': 'المتابِعون', 'cmp.open': 'فتح المقارنة', 'cmp.tray': 'قارن {n} محافظ', 'cmp.pick': 'اختر واحدة أخرى للمقارنة', 'cmp.note': 'تستخدم كل المقاييس أحدث الإفصاحات. ليست نصيحة استثمارية.',
      'ev.title': 'أدلة {t}', 'ev.why': 'لماذا الأدلة {s}؟', 'ev.review': 'مراجعة كل الأدلة', 'ev.recent': 'أحدث نشاط للمُفصِحين', 'ev.setalert': 'ضبط تنبيه',
      'g.portfolios': 'تعكس التصنيفات بيانات مُفصَحًا عنها ومقاييس محسوبة للفترة المحددة. لا يُلوَّن الأداء كحكم شرعي، وهذا ليس نصيحة بالشراء أو البيع.',
      'g.disclaimer': 'الفحص وفق معيار AAOIFI رقم 21. لأغراض معلوماتية فقط — أدلة إفصاح سابقة قد تتأخر حتى 45 يومًا. ليست نصيحة استثمارية أو وساطة أو فتوى.',
      'meta.count': '{n} معروض', 'live': 'بيانات مؤجَّلة', 'sample': 'بيانات تجريبية', 'freshUpdated': 'حُدِّث',
      'empty.title': 'لا شيء يطابق هذه المرشحات', 'empty.body': 'جرّب مسح مرشح أو توسيع الفترة الزمنية.',
      'acct.title': 'الحساب', 'acct.lang': 'اللغة', 'follow.title': 'المتابَعون', 'alerts.title': 'التنبيهات',
      'common.follow': 'متابعة', 'common.following': 'تتابعه', 'common.watch': 'مراقبة',
      'dtl.portfolio': 'المحفظة', 'dtl.stock': 'السهم', 'dtl.return': 'العائد المُفصَح', 'dtl.returnSub': 'أداء الحيازات المُفصَح عنها',
      'dtl.pending': 'قيد الانتظار', 'dtl.pendingSub': 'لا يوجد سجل أسعار كافٍ بعد', 'dtl.attention': 'الاهتمام',
      'dtl.indicativeSub': 'تقديري — العائد المُفصَح، بانتظار الأسعار الحية', 'dtl.weight': 'الوزن', 'dtl.disclosed': 'أُفصح', 'dtl.bought': 'شراء', 'dtl.sold': 'بيع', 'dtl.filedLater': 'أُفصح بعد {n}ي',
      'dtl.followers': 'متابِع', 'dtl.disclosures': 'إفصاح', 'dtl.buyers': 'جهة تشتري', 'dtl.filers': 'إجمالي المُفصِحين',
      'dtl.perf': 'الأداء', 'dtl.holdings': 'أهم الحيازات', 'dtl.who': 'مَن اشترى وباع', 'dtl.activity': 'سجل النشاط',
      'dtl.nojudge': 'لا توجد بيانات كافية للحكم بعد.', 'dtl.evNote': 'أدلة الحيازات المُفصَح عنها، متأخرة بزمن الإفصاح (حتى 45 يومًا). لأغراض معلوماتية فقط — ليست نصيحة أو توصية بالمتابعة.',
      'dtl.compNote': 'يُعرض الالتزام كوسم (معيار AAOIFI رقم 21). الفحص مرشِّح تطبّقه في مكان آخر — ولا يغيّر الأداء المعروض.',
      'sec.methodology': 'المنهجية', 'sec.mtext': 'يتبع الفحص معيار AAOIFI الشرعي رقم 21 — قاعدة «30/30/5» الحالية. فحصان، كلاهما مطلوب: (1) نشاط تجاري مباح، و(2) نسب مالية إلى القيمة السوقية — الدين بفائدة < 30%، والنقد والأوراق ذات الفائدة < 30%، والدخل غير المباح < 5% من الإيراد. تجاوز أي حد = غير متوافق. دخل غير نقي يسير (0–5%) = متوافق · تطهير. (نسبة 33% لدى بعض مزوّدي المؤشرات ليست من AAOIFI.)',
    },
  };
  let LANG = 'en';
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
  const badge = (label) => `<span class="mz-badge mz-badge--${VER[label].cls}" title="AAOIFI Standard No. 21"><span class="mz-dot" style="width:.45rem;height:.45rem;background:currentColor"></span>${t(VER[label].k)}</span>`;

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
  const typeLabel = (kind) => (LANG === 'ar' ? { insider: 'داخلي', official: 'مسؤول', fund: 'صندوق' } : { insider: 'Insider', official: 'Official', fund: 'Fund' })[groupOf(kind)];
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
      p.hhi = concentration(p); // Herfindahl concentration of ownable holdings (0–1)
      const lags = p.rows.map((r) => daysBetween(r.transactionDate, r.filingDate)).filter((x) => x != null);
      p.avgLag = lags.length ? Math.round(lags.reduce((a, b) => a + b, 0) / lags.length) : null; // avg filing lag (days)
      p.holdings = new Set(p.rows.map((r) => r.ticker)).size; // distinct disclosed holdings (min-holdings gate)
      p.ret = returnOf(portfolioIndexHist(p.rows), p.perf); // timeframe-aware return (carries context)
    }
    return [...m.values()];
  }
  const portfolioFlag = (p) => p.mix.fail > 0 ? { text: 'Contains non-compliant names', tone: 'fail' } : p.mix.purify > 0 ? { text: `Mostly compliant · ${p.mix.purify} to purify`, tone: 'purify' } : { text: 'Fully compliant', tone: 'clean' };

  /* --- Decision-support synthesis: turn the raw disclosures into a plain-language "read" +
     scannable signal tags, so a user can judge a setup at a glance instead of parsing columns. */
  const sideUp = (s) => String(s).toUpperCase() !== 'SELL';
  const localizedSignal = (text) => LANG === 'ar' ? ({ 'Cluster buy': 'شراء جماعي', 'Cluster sell': 'بيع جماعي', 'Sole filer': 'مُفصِح واحد', 'Two-sided': 'شراء وبيع', 'Fresh': 'حديث', 'Top performer': 'أداء بارز', 'Active': 'نشِط', 'Concentrated': 'مركّز', 'Diversified': 'متنوع' }[text] || text) : text;
  const signalChip = (text, tone) => `<span class="mz-signal" data-tone="${tone || 'muted'}">${esc(localizedSignal(text))}</span>`;
  const signalRow = (tags) => tags.length ? `<span class="mz-signals">${tags.map(([txt, tone]) => signalChip(txt, tone)).join('')}</span>` : '';

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
    let s = `${breadth} ${dir} — ${buyers ? `${buyers} buying` : ''}${buyers && sellers ? ', ' : ''}${sellers ? `${sellers} selling` : ''}, net ${net >= 0 ? '+' : '−'}${fmtMoney(Math.abs(net))}.`;
    s += fresh <= 30 ? ' Filings are recent.' : ` Most recent filing ${fresh}d ago.`;
    s += label === 'fail' ? ' Non-compliant — shown for awareness only, not ownable.'
      : label === 'purify' ? ' Compliant, with a small dividend-purification obligation.'
      : label === 'clean' ? ' Fully compliant.' : '';
    const tags = [];
    if (filers >= 4 && sellers === 0) tags.push(['Cluster buy', 'up']);
    else if (filers >= 4 && buyers === 0) tags.push(['Cluster sell', 'down']);
    if (filers === 1) tags.push(['Sole filer', 'muted']);
    if (buyers && sellers) tags.push(['Two-sided', 'muted']);
    if (fresh <= 14) tags.push(['Fresh', 'up']);
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
  const retNode = (v) => v == null || !isFinite(v)
    ? '<span class="mz-muted">—</span>'
    : `<span class="mz-ret" data-up="${v >= 0}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(1)}%</span>`;
  const priceReturn = (ticker) => seriesReturn(sliceTf(histOf(ticker)).map((p) => +p.c));

  // THE rules function: (disclosed return, attraction signals) -> one plain headline. Bilingual.
  // When the return is unknown AND there's no activity, it says so — it never invents a verdict.
  function composeHeadline(perf, attr) {
    attr = attr || {}; const ar = LANG === 'ar'; const known = perf != null && isFinite(perf);
    if (!known && !attr.hasActivity) return t('dtl.nojudge');
    let r;
    if (!known) r = ar ? 'الأداء قيد الانتظار' : 'Performance pending';
    else if (perf >= 15) r = ar ? 'أداء قوي مؤخرًا' : 'Strong recent performance';
    else if (perf >= 3) r = ar ? 'أداء جيد مؤخرًا' : 'Solid recent performance';
    else if (perf >= 0) r = ar ? 'أداء ثابت تقريبًا' : 'Roughly flat lately';
    else if (perf > -10) r = ar ? 'أداء ضعيف مؤخرًا' : 'Soft recent performance';
    else r = ar ? 'أداء متراجع' : 'Weak recent performance';
    let a = '';
    if (attr.wellFollowed) a = ar ? 'ويحظى بمتابعة واسعة' : 'and widely followed';
    else if (attr.buyers >= 2) a = ar ? `و${attr.buyers} جهات تشتريه` : `and ${attr.buyers} filers buying`;
    else if (attr.active) a = ar ? 'ونشِط في الإفصاح' : 'and actively disclosing';
    else if (attr.quiet) a = ar ? 'لكن الإفصاحات قليلة' : 'though disclosures are sparse';
    return `${r}${a ? (ar ? '، ' : ', ') : ''}${a}.`;
  }

  // Shared conclusion-first hero: WHO this is -> composed headline -> return (hero) + attraction.
  // `who` = { avatar, name, sub, ltr }; `stats` are the localized attraction rows.
  function detailHero(who, headline, ret, statsHtml) {
    ret = ret || { val: null };
    let retHtml;
    if (ret.val == null || !isFinite(ret.val)) {
      retHtml = `<div class="mz-dtl-big mz-dtl-neutral">${t('dtl.pending')}</div><div class="mz-dtl-sub">${t('dtl.pendingSub')}</div>`;
    } else {
      // The number carries its context: "· 1M" from the timeframe selector, or "· indicative"
      // when it's the disclosed return standing in until live prices back the chart.
      const ctx = ret.tf ? ` · ${ret.tf}` : (ret.indicative ? ` · ${LANG === 'ar' ? 'تقديري' : 'indicative'}` : '');
      const sub = ret.indicative ? t('dtl.indicativeSub') : t('dtl.returnSub');
      retHtml = `<div class="mz-dtl-big" data-up="${ret.val >= 0}">${ret.val >= 0 ? '▲' : '▼'} ${Math.abs(ret.val).toFixed(1)}%<span class="mz-dtl-ctx">${ctx}</span></div><div class="mz-dtl-sub">${sub}</div>`;
    }
    return `<div class="mz-drawer__section">
      <div class="mz-dtl-who"><span class="mz-entity__avatar">${who.avatar}</span><div style="min-width:0"><div class="mz-dtl-name${who.ltr ? ' mz-ltr' : ''}">${esc(who.name)}</div><div class="mz-dtl-whosub">${esc(who.sub)}</div></div></div>
      <p class="mz-dtl-headline">${esc(headline)}</p>
      <div class="mz-dtl-heros">
        <div class="mz-dtl-card"><div class="mz-dtl-lab">${t('dtl.return')}</div>${retHtml}</div>
        <div class="mz-dtl-card"><div class="mz-dtl-lab">${t('dtl.attention')}</div>${statsHtml}</div>
      </div>
    </div>`;
  }
  const dtlStat = (val, label) => `<div class="mz-dtl-stat"><b>${val}</b> ${label}</div>`;

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
  const EXP_SEG = [['clean', 'compliant'], ['purify', 'purify'], ['fail', 'noncompliant'], ['unscreened', 'review']];
  function exposureBar(mix) { return `<div class="mz-allocation__bar">${EXP_SEG.map(([k, c]) => mix[k] > 0.0005 ? `<span style="flex:${mix[k]};background:var(--mz-${c}-600)"></span>` : '').join('')}</div>`; }
  function legendFor(mix) { return [['clean', 'compliant', 'v.compliant'], ['purify', 'purify', 'v.purify'], ['fail', 'noncompliant', 'v.noncompliant'], ['unscreened', 'review', 'v.review']].filter(([k]) => mix[k] > 0.0005).map(([k, c, lk]) => `<span><span class="mz-dot" style="background:var(--mz-${c}-600)"></span>${t(lk)} ${Math.round(mix[k] * 100)}%</span>`).join(''); }
  const wpct = (x) => Math.round(x * 100) + '%';

  // Account panel: import your holdings (read-only) and see your Sharia exposure.
  function myPortfolioPanel() {
    const ar = LANG === 'ar', exp = myExposure();
    const tag = `<span class="mz-badge" style="min-height:1.3rem;font-size:.62rem;background:var(--mz-cobalt-50);color:var(--mz-cobalt-700);border:1px solid var(--mz-cobalt-100)">${ar ? 'قراءة فقط' : 'Read-only'}</span>`;
    const head = `<div style="display:flex;align-items:center;gap:.5rem"><h3 style="margin:0">${ar ? 'محفظتي' : 'My portfolio'}</h3>${tag}</div>`;
    const note = `<p class="mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;margin:.4rem 0 0">${ar ? 'أضِف حيازاتك لرؤية التزامك الشرعي وكيف تتقاطع مع المحافظ المتابَعة. لأغراض معلوماتية فقط — لا وسيط، لا أوامر، لا ميزانية. تُحفظ في هذا المتصفح فقط.' : 'Add your holdings to see your Sharia exposure and how you overlap with tracked portfolios. Informational only — no broker, no orders, no budget. Stored only in this browser.'}</p>`;
    if (!exp) {
      return `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)">${head}${note}<textarea id="myHoldingsInput" rows="3" placeholder="AAPL 20000, MSFT 15000, JPM 10000" style="width:100%;box-sizing:border-box;margin-block-start:.75rem;padding:.6rem;border:var(--mz-border);border-radius:var(--mz-radius-sm);font:inherit;font-size:var(--mz-text-sm);resize:vertical"></textarea><div style="display:flex;gap:.5rem;margin-block-start:.6rem;flex-wrap:wrap"><button class="mz-button mz-button--primary" id="myImportBtn">${ar ? 'تحليل الحيازات' : 'Import holdings'}</button><button class="mz-button mz-button--secondary" id="mySampleBtn">${ar ? 'تجربة حيازات نموذجية' : 'Try sample holdings'}</button></div><p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.5rem 0 0">${ar ? 'الصيغة: رمز ثم قيمة اختيارية، لكل سطر أو مفصولة بفواصل. بدون قيم = أوزان متساوية.' : 'Format: ticker then optional amount, per line or comma-separated. No amounts = equal weight.'}</p></section>`;
    }
    const holdings = exp.rows.map((h) => `<div class="mz-hold"><div class="mz-hold__n"><div class="mz-ltr" style="font-weight:750">${esc(h.ticker)}</div><div class="mz-entity__meta">${esc(h.company || (ar ? 'قيد المراجعة' : 'under review'))} · ${wpct(h.weight)}${ar ? ' وزن' : ' weight'}</div></div>${badge(h.label)}</div>`).join('');
    return `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)">${head}
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-block-start:.75rem"><span class="mz-muted" style="font-size:var(--mz-text-xs)">${exp.count} ${ar ? 'اسم' : (exp.count === 1 ? 'holding' : 'holdings')}${exp.totalValue != null ? ` · ${fmtMoney(exp.totalValue)}` : ''}</span><span style="font-size:var(--mz-text-xs);font-weight:750;color:var(--mz-cobalt-700)">${wpct(exp.mix.clean + exp.mix.purify)} ${ar ? 'متوافق' : 'compliant'}</span></div>
      <div style="margin-block-start:.5rem">${exposureBar(exp.mix)}</div>
      <div class="mz-legend" style="margin-block-start:.6rem">${legendFor(exp.mix)}</div>
      ${exp.mix.purify > 0 && exp.purifyPct > 0 ? `<p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.5rem 0 0">${ar ? `تطهير تقديري ~${exp.purifyPct}% من أرباح الأسماء القابلة للتملّك.` : `Est. purification ~${exp.purifyPct}% of dividends on the ownable names.`}</p>` : ''}
      <div style="margin-block-start:.8rem">${holdings}</div>
      <button class="mz-button mz-button--ghost" id="myClearBtn" style="margin-block-start:.6rem">${ar ? 'مسح محفظتي' : 'Clear my portfolio'}</button>
      <p class="mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;margin:.6rem 0 0">${ar ? 'لا وسيط، لا أوامر، لا نسخ تداول. أدلة، ليست نصيحة. تُحفظ محليًا فقط.' : 'No broker, no orders, no copy-trading. Evidence, not advice. Stored locally only.'}</p></section>`;
  }

  // Portfolio-drawer section: how the tracked portfolio compares to MY holdings.
  function vsMineSection(p) {
    const ar = LANG === 'ar', cmp = compareToMine(p);
    if (!cmp) {
      return `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.4rem">${ar ? 'مقابل محفظتك' : 'Vs your portfolio'}</div><p class="mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;margin:0 0 .55rem">${ar ? 'أضِف حيازاتك (قراءة فقط) لترى التقاطع والتزامك الشرعي مقابل هذه المحفظة.' : 'Add your holdings (read-only) to see the overlap and your Sharia exposure vs this portfolio.'}</p><button class="mz-button mz-button--secondary" data-nav="account">${ar ? 'أضِف محفظتي' : 'Add my portfolio'}</button></div>`;
    }
    const yourComp = cmp.mine.mix.clean + cmp.mine.mix.purify;
    const stat = (lab, val, col) => `<div style="flex:1"><div class="mz-muted" style="font-size:var(--mz-text-xs)">${lab}</div><div style="font-weight:800;font-variant-numeric:tabular-nums;${col ? `color:${col}` : ''}">${val}</div></div>`;
    const chip = (tk, fail) => `<span class="mz-signal" data-tone="muted"><span class="mz-ltr" style="font-weight:700${fail ? ';text-decoration:line-through' : ''}">${esc(tk)}</span></span>`;
    const list = (arr, empty, showFail) => arr.length ? `<span class="mz-signals">${arr.slice(0, 8).map((h) => chip(h.ticker, showFail && h.label === 'fail')).join('')}</span>` : `<span class="mz-muted" style="font-size:var(--mz-text-xs)">${empty}</span>`;
    return `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${ar ? 'مقابل محفظتك' : 'Vs your portfolio'}</div>
      <div style="display:flex;gap:1rem;margin-block-end:.65rem">${stat(ar ? 'التزامك' : 'You compliant', wpct(yourComp), 'var(--mz-cobalt-700)')}${stat(ar ? 'التزامهم' : 'Them compliant', wpct(cmp.theirCompliant), 'var(--mz-cobalt-700)')}${stat(ar ? 'مشترك' : 'Shared', String(cmp.overlap.length))}</div>
      <div style="margin-block-end:.55rem"><div class="mz-entity__meta" style="margin-block-end:.3rem">${ar ? 'تملكونه معًا' : 'You both hold'}</div>${list(cmp.overlap, ar ? 'لا تقاطع' : 'No overlap')}</div>
      <div><div class="mz-entity__meta" style="margin-block-end:.3rem">${ar ? 'يملكونه ولا تملكه' : 'They hold, you don’t'}</div>${list(cmp.theirsOnly, '—', true)}</div>
      <p class="mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;margin:.6rem 0 0">${ar ? 'لأغراض معلوماتية فقط — للتوعية، ليست توصية بالشراء أو البيع. الأسماء المشطوبة غير متوافقة.' : 'Informational only — for awareness, not a recommendation. Struck-through names are non-compliant.'}</p></div>`;
  }

  /* ---------------------------------------------------------------- routing */
  function parsePath() {
    const seg = (location.protocol === 'file:' ? location.hash.slice(1) : location.pathname).replace(/^\/+|\/+$/g, '').split('/');
    const a = seg[0] || '';
    if (a === 'stocks') S.tab = 'stocks';
    else if (a === 'portfolios' || a === '') S.tab = 'portfolios';
    else if (a === 'stock' && seg[1]) { S.tab = 'stocks'; S._openStock = decodeURIComponent(seg[1]); }
    else if (a === 'portfolio' && seg[1]) { S.tab = 'portfolios'; S._openPortfolio = decodeURIComponent(seg[1]); }
    else if (['following', 'alerts', 'account'].includes(a)) S.tab = a;
  }
  function setPath(path) { history.pushState({}, '', location.protocol === 'file:' ? '#' + path : path); }
  function go(path, push) {
    if (push !== false) setPath(path);
    parsePath(); S.drawer = null; S.openMenu = null; render();
  }
  window.addEventListener('popstate', () => { parsePath(); render(); });

  /* ---------------------------------------------------------------- data load */
  async function load() {
    const j = (u) => fetch(u, { headers: { accept: 'application/json' } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    const [feed, prices, followers] = await Promise.allSettled([j('/api/feed?performance=1'), j('/api/prices'), j('/api/follower-counts')]);
    if (feed.status === 'fulfilled' && Array.isArray(feed.value) && feed.value.length) {
      S.rows = feed.value.map((r) => ({ ...r, company: coName(r.company), label: r.label || labelOf(r) }));
      S.live = true;
    } else {
      // Live feed unavailable → fall back to the clearly-labeled embedded sample. The initial
      // state is empty + loading, so the user never sees a flash of sample before live.
      S.rows = SAMPLE; S.live = false;
    }
    if (prices.status === 'fulfilled' && prices.value && typeof prices.value === 'object' && Object.keys(prices.value).length) S.prices = prices.value;
    else S.prices = SAMPLE_PRICES;
    if (followers.status === 'fulfilled' && followers.value && typeof followers.value === 'object') S.followerCounts = followers.value;
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
      if (S.compliance !== 'all') list = list.filter((p) => { const tone = portfolioFlag(p).tone; return S.compliance === 'fully' ? portfolioTone(p) === 'clean' : S.compliance === 'watch' ? portfolioTone(p) === 'purify' : S.compliance === 'excluded' ? tone === 'fail' : tone !== 'fail'; });
      if (S.followedOnly) list = list.filter((p) => S.follows.has(p.name));
      const cmp = {
        top: (a, b) => ((b.ret && b.ret.val) ?? -1e9) - ((a.ret && a.ret.val) ?? -1e9), // rank by the SAME number shown

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
    return `<div class="mz-allocation"><div class="mz-allocation__bar">${seg('clean', 'compliant')}${seg('purify', 'purify')}${seg('fail', 'noncompliant')}${seg('unscreened', 'review')}</div><div class="mz-allocation__legend">${pct('clean')}${pct('purify')}${pct('fail')}${pct('unscreened')}</div></div>`;
  };
  const freshEl = (d) => d == null ? '<span class="mz-muted">—</span>' : `<span class="mz-fresh" data-fresh="${d <= 30}">${I.clock}${d}${LANG === 'ar' ? 'ي منذ الإفصاح' : 'd since filing'}</span>`;
  // avatarHtml + metaHtml are trusted HTML built by callers (they escape their own text).
  const entity = (avatarHtml, name, metaHtml, nameLtr) => `<div class="mz-entity"><span class="mz-entity__avatar">${avatarHtml}</span><div><div class="mz-entity__name${nameLtr ? ' mz-ltr' : ''}">${esc(name)}</div><div class="mz-entity__meta">${metaHtml}</div></div></div>`;
  const miniIcon = (svg) => `<span style="width:.9rem;height:.9rem;display:inline-flex">${svg}</span>`;
  const perfCell = (v) => v == null ? '<span class="mz-muted">—</span>' : `<span class="mz-performance">${fmtPct(v)}</span>`;
  // Performance HERO — the primary signal (performance-led hierarchy). Cobalt up / neutral-ink
  // down with a caret; deliberately NOT a Sharia hue, so it never reads as a verdict.
  // Accepts a bare number (legacy) or a context object { val, tf, indicative } from returnOf().
  // Neutral cobalt/ink only — never a verdict hue. Shows an "indic." caveat when price data is pending.
  const perfHero = (r) => {
    const o = (r && typeof r === 'object') ? r : { val: (r == null ? null : +r), tf: null, indicative: false };
    if (o.val == null || !isFinite(o.val)) return `<span class="mz-perf-hero mz-perf-pending">—<span class="mz-perf-ctx"> · ${t('dtl.pending')}</span></span>`;
    const ctx = `<span class="mz-perf-ctx"> · ${o.indicative ? (LANG === 'ar' ? 'تقديري · منذ الإفصاح' : 'indic. · since disclosed') : esc(o.tf || tfLabelNow())}</span>`;
    return `<span class="mz-perf-hero" data-up="${o.val >= 0}">${o.val >= 0 ? I.caretUp : I.caretDown}${fmtPct(o.val)}${ctx}</span>`;
  };
  // Compact compliance tag — small pill, no longer the loud hero (performance-led).
  const compliancePill = (tone) => badge(tone);
  // Portfolios use the owner's sign-based performance palette; other views keep cobalt.
  const portfolioColor = (val) => val == null ? 'var(--mz-ink-400)' : val >= 0 ? 'var(--mz-compliant-600)' : 'var(--mz-noncompliant-600)';
  const portfolioTone = (p) => p.mix.unscreened > 0 && portfolioFlag(p).tone === 'clean' ? 'purify' : portfolioFlag(p).tone;
  const latestFiling = (rows) => rows.map((r) => r[FIELD.filedDate]).filter((d) => d && isFinite(Date.parse(d))).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const portfolioReturn = (ret) => `<span class="mz-pf-return" style="color:${portfolioColor(ret.val)}">${ret.val == null ? '—' : fmtPct(ret.val)}</span>${ret.indicative ? `<span class="mz-cell-context">${LANG === 'ar' ? 'تقديري · منذ الإفصاح' : 'indicative · since disclosed'}</span>` : ''}`;

  const starBtn = (id) => `<button class="mz-star" data-star="${esc(id)}" data-on="${S.follows.has(id)}" aria-label="${t('common.follow')}" aria-pressed="${S.follows.has(id)}">${S.follows.has(id) ? I.starOn : I.star}</button>`;
  // Trade direction — NEUTRAL (cobalt buy / ink sell). Verdict hues (green/amber/red) are reserved
  // for the Sharia label only, so buy/sell must never borrow them.
  const sideTag = (side) => { const sell = String(side).toUpperCase() === 'SELL'; return `<span class="mz-side" data-side="${sell ? 'sell' : 'buy'}">${sell ? t('dtl.sold') : t('dtl.bought')}</span>`; };

  /* ============ ONE shared, interactive chart component — used by EVERY chart ============
     Global consistency rule (CLAUDE.md): every chart in the app is this component. Same
     behavior everywhere — scrub (touch/pointer) reveals value + date, respects the active
     timeframe (1W…All), neutral cobalt/ink only (never a verdict hue), graceful empty state. */
  const chartPath = (v, W, H, mn, mx) => { const r = (mx - mn) || 1; return v.map((y, i) => `${(i / (v.length - 1) * W).toFixed(2)},${(H - (y - mn) / r * H).toFixed(2)}`).join(' '); };
  const histOf = (ticker) => ((S.prices[ticker] && S.prices[ticker][FIELD.priceHistory]) || []).filter((p) => p && isFinite(+p.c));
  const TF_DAYS_ALL = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825, ALL: Infinity };
  const sliceTf = (hist) => { const n = TF_DAYS_ALL[S.tf] ?? Infinity; return (n === Infinity || hist.length <= n) ? hist : hist.slice(-Math.max(2, Math.round(n))); };
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
  const shortDate = (d) => { const ms = Date.parse(d); if (!isFinite(ms)) return d || ''; return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const seriesReturn = (v) => v && v.length >= 2 ? (v[v.length - 1] / v[0] - 1) * 100 : null;
  const fmtPrice = (v) => (v == null || !isFinite(+v)) ? '—' : '$' + (+v).toLocaleString('en-US', { maximumFractionDigits: 2 });
  // "Bought-at → now": the disclosure's disclosed-close vs today's price + gain, from the
  // dual-anchor performance each row carries (feed ?performance=1). The core evidence signal:
  // "would following this filer have worked?" Neutral cobalt/ink only — never a verdict hue.
  function entryVsNow(r) {
    const p = r && r.performance;
    if (!p || p.disclosedClose == null || p.now == null) return '';
    const pct = p.sinceDisclosed;
    const pctHtml = (pct == null || !isFinite(pct)) ? '' : ` · <span class="mz-ret" data-up="${pct >= 0}">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%</span>`;
    const since = LANG === 'ar' ? 'منذ الإفصاح' : 'since disclosed';
    return `<span class="mz-entry">${fmtPrice(p.disclosedClose)} → <b>${fmtPrice(p.now)}</b>${pctHtml} <span class="mz-muted">${since}</span></span>`;
  }
  const tfLabelNow = () => S.tf === 'ALL' && LANG === 'ar' ? 'الكل' : (TFS.find(([k]) => k === S.tf) || [, 'All'])[1];
  // Timeframe-aware return that carries its context. Prefers the price return over the active
  // timeframe (recomputes with the selector); if prices are pending, falls back to the disclosed
  // return but marks it "indicative" — never a confident number over a Pending chart.
  function returnOf(series, disclosed) {
    const tfRet = seriesReturn(sliceTf(series || []).map((p) => +p.c));
    if (tfRet != null && isFinite(tfRet)) return { val: +tfRet.toFixed(1), tf: tfLabelNow(), indicative: false };
    if (disclosed != null && isFinite(disclosed)) return { val: +(+disclosed).toFixed(1), tf: null, indicative: true };
    return { val: null, tf: null, indicative: false };
  }

  // Equal-weight normalized portfolio index, WITH dates (for the scrub tooltip). `includeAll`
  // keeps the non-compliant names (the "original" portfolio) for the screening-effect overlay.
  function portfolioIndexHist(rows, includeAll) {
    const tickers = [...new Set(rows.filter((r) => includeAll || r.label !== 'fail').map((r) => r.ticker))];
    const series = tickers.map(histOf).filter((a) => a.length >= 2);
    if (!series.length) return [];
    const len = Math.min(...series.map((a) => a.length)), ref = series[0].slice(-len), out = [];
    for (let i = 0; i < len; i++) { let s = 0; for (const a of series) { const tl = a.slice(-len); s += (+tl[i].c) / (+tl[0].c); } out.push({ d: ref[i].d, c: s / series.length * 100 }); }
    return out;
  }

  // THE shared chart. `hist` = [{d,c}]. opts: { cls, compare:[{d,c}], empty,
  //   markers:[{d,side,label}] (disclosed trades pinned on the line — cobalt buy / ink sell),
  //   color: optional CSS color (Portfolios sign palette), area/valueAxis: optional detail styling,
  //   today: string (a value label shown top-end, e.g. "$146 · today") }.
  function chart(hist, opts) {
    opts = opts || {};
    const cls = opts.cls || 'mz-chart--full';
    const h = cls === 'mz-chart--spark' ? 28 : cls === 'mz-chart--card' ? 40 : 120;
    const data = (hist || []).filter((p) => p && isFinite(+p.c));
    if (data.length < 2) return `<div class="mz-chart ${cls} mz-chart__empty" style="height:${h}px">${opts.empty || '—'}</div>`;
    const closes = data.map((p) => +p.c), mn = Math.min(...closes), mx = Math.max(...closes), rng = (mx - mn) || 1;
    const W = 320, H = 100, sw = cls === 'mz-chart--full' ? 1.7 : 1.4;
    const line = `<polyline points="${chartPath(closes, W, H, mn, mx)}" fill="none" stroke="${esc(opts.color || 'var(--mz-cobalt-600)')}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    const area = opts.area ? `<polygon points="0,${H} ${chartPath(closes, W, H, mn, mx)} ${W},${H}" fill="${esc(opts.color || 'var(--mz-cobalt-600)')}" opacity="0.08"/>` : '';
    const valueAxis = opts.valueAxis ? `<span class="mz-chart__value-axis">${[mx, (mn + mx) / 2, mn].map((v) => `<span>${(v / closes[0] * 100 - 100).toFixed(0)}%</span>`).join('')}</span>` : '';
    let cmp = '';
    if (opts.compare) { const c2 = (opts.compare || []).filter((p) => p && isFinite(+p.c)).map((p) => +p.c); if (c2.length >= 2) cmp = `<polyline points="${chartPath(c2, W, H, mn, mx)}" fill="none" stroke="var(--mz-ink-400)" stroke-width="1.2" stroke-dasharray="3 3"/>`; }
    // % positions (the SVG is stretched to fill, so a data point maps to left = i/(n-1), top = 1-(c-mn)/rng).
    const at = (i) => ({ x: (i / (data.length - 1) * 100), y: ((1 - (closes[i] - mn) / rng) * 100) });
    let markers = '', marksAttr = '';
    if (opts.markers && opts.markers.length) {
      const nearest = (d) => { const t0 = Date.parse(d); if (!isFinite(t0)) return -1; let bi = -1, bd = Infinity; for (let i = 0; i < data.length; i++) { const dd = Math.abs(Date.parse(data[i].d) - t0); if (dd < bd) { bd = dd; bi = i; } } return bi; };
      const valid = opts.markers.filter((m) => m && m.d);
      markers = valid.map((m) => { const i = nearest(m.d); if (i < 0) return ''; const p = at(i); const sell = String(m.side).toUpperCase() === 'SELL'; return `<span class="mz-chart__mk" data-side="${sell ? 'sell' : 'buy'}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" title="${esc((sell ? 'Sold' : 'Bought') + (m.label ? ' ' + m.label : '') + ' · ' + shortDate(m.d))}"></span>`; }).join('');
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
    return `<div class="mz-chart ${cls}" data-series="${series}" data-unit="${unit}" data-min="${mn}" data-max="${mx}"${marksAttr} style="height:${h}px;--mz-chart-color:${esc(opts.color || 'var(--mz-cobalt-600)')}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${area}${cmp}${line}</svg>${valueAxis}${markers}${todayDot}${todayLab}${axisEls}<span class="mz-chart__cx"></span><span class="mz-chart__dot"></span></div>`;
  }

  // Interactive scrub — ONE handler drives every chart (touch + pointer). Registered once.
  const chartTip = (() => { const el = document.createElement('div'); el.className = 'mz-chart-tip'; document.body.appendChild(el); return el; })();
  function chartHideTip() { if (!chartTip.classList.contains('is-on')) return; chartTip.classList.remove('is-on'); document.querySelectorAll('.mz-chart.is-active').forEach((c) => c.classList.remove('is-active')); }
  function chartScrub(clientX, target) {
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
        if (near) extra = ` · ${near[1] === 'S' ? '▼ ' + (LANG === 'ar' ? 'بيع' : 'Sold') : '▲ ' + (LANG === 'ar' ? 'شراء' : 'Bought')}${near[2] ? ' ' + near[2] : ''}`;
      } catch (e) { /* ignore */ }
    }
    chartTip.textContent = `${el.dataset.unit === 'index' ? c.toFixed(2) + (LANG === 'ar' ? ' · مؤشر' : ' · index') : '$' + c.toFixed(2)} · ${shortDate(d)}${extra}`;
    chartTip.style.left = (rect.left + px) + 'px'; chartTip.style.top = (rect.top + py) + 'px';
    chartTip.classList.add('is-on');
  }
  document.addEventListener('pointermove', (e) => chartScrub(e.clientX, e.target));
  document.addEventListener('pointerdown', (e) => chartScrub(e.clientX, e.target));
  document.addEventListener('pointerup', chartHideTip);
  document.addEventListener('pointercancel', chartHideTip);
  window.addEventListener('scroll', chartHideTip, true);
  document.addEventListener('touchmove', (e) => { if (e.touches && e.touches[0]) chartScrub(e.touches[0].clientX, e.target); }, { passive: true });
  document.addEventListener('touchend', chartHideTip);

  // Swipe-back on detail drawers — a horizontal drag toward the back edge closes the sheet.
  // (Direction flips in RTL.) Ignores swipes that start on a chart, so scrubbing isn't hijacked.
  let swX0 = null, swY0 = null;
  document.addEventListener('touchstart', (e) => {
    const inDrawer = e.target.closest && e.target.closest('.mz-drawer');
    if (!inDrawer || !S.drawer || S.drawer.type === 'compare' || (e.target.closest && e.target.closest('.mz-chart'))) { swX0 = null; return; }
    const tt = e.touches && e.touches[0]; if (!tt) { swX0 = null; return; } swX0 = tt.clientX; swY0 = tt.clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (swX0 == null) return;
    const tt = e.changedTouches && e.changedTouches[0]; if (tt) {
      const dx = tt.clientX - swX0, dy = tt.clientY - swY0;
      const back = document.documentElement.dir === 'rtl' ? dx < -70 : dx > 70;
      if (back && Math.abs(dx) > Math.abs(dy) * 1.6) closeDrawer();
    }
    swX0 = null;
  }, { passive: true });

  /* ---------------------------------------------------------------- chrome */
  function renderChrome() {
    document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('mz-portfolios-page', S.tab === 'portfolios');
    const brand = document.querySelector('.mz-utility-rail__brand');
    brand.innerHTML = S.tab === 'portfolios' ? 'mizan<small>Financial Intelligence</small>' : 'm<span class="mz-brand-balance" aria-hidden="true"></span>';
    // rail
    const navItems = [['portfolios', I.portfolios, 'tab.portfolios'], ['stocks', I.stocks, 'tab.stocks'], ['following', I.star, 'tab.following'], ['alerts', I.bell, 'tab.alerts'], ['account', I.user, 'tab.account']];
    document.getElementById('railNav').innerHTML = navItems.map(([k, ic, lk]) => `<a href="/${k}" class="mz-rail-link" data-nav="${k}" aria-current="${S.tab === k ? 'page' : 'false'}"><span style="width:1.4rem">${ic}</span><span>${t(lk)}</span></a>`).join('');
    const lang = document.getElementById('langToggle'); lang.innerHTML = `<span style="width:1.4rem">${I.globe}</span><span>${LANG === 'en' ? 'ع' : 'EN'}</span>`;
    document.getElementById('themeToggle').innerHTML = `<span style="width:1.4rem">${I.user.replace('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/>')}</span><span>${LANG === 'ar' ? (THEME === 'light' ? 'داكن' : 'فاتح') : (THEME === 'light' ? 'Dark' : 'Light')}</span>`;
    document.getElementById('brandCaption').textContent = LANG === 'ar' ? 'ذكاء السوق' : 'Market intelligence';
    document.getElementById('search').setAttribute('aria-label', t('c.search'));
    // top tabs
    document.querySelectorAll('#topTabs .mz-product-tab').forEach((b) => { const on = b.dataset.tab === S.tab || (S.tab === 'portfolios' && b.dataset.tab === 'portfolios'); b.textContent = t('tab.' + b.dataset.tab); b.setAttribute('aria-selected', (b.dataset.tab === S.tab) || (['following', 'alerts', 'account'].includes(S.tab) && b.dataset.tab === 'portfolios' && false)); });
    document.querySelectorAll('#topTabs .mz-product-tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === (S.tab === 'stocks' ? 'stocks' : 'portfolios')));
    document.getElementById('searchIcon').innerHTML = I.search;
    const inp = document.getElementById('search'); inp.placeholder = t('c.search'); if (inp.value !== S.query) inp.value = S.query;
    document.getElementById('bellBtn').innerHTML = I.bell;
    document.getElementById('bellBtn').setAttribute('aria-label', t('tab.alerts'));
    document.getElementById('langToggle').setAttribute('aria-label', t('acct.lang'));
    document.getElementById('themeToggle').setAttribute('aria-label', LANG === 'ar' ? 'تبديل المظهر' : 'Toggle appearance');
    document.getElementById('freshness').innerHTML = S.tab === 'portfolios' ? `${I.clock}<span>${LANG === 'ar' ? 'بيانات متأخرة' : 'Delayed data'}</span>` : esc(S.live ? t('live') : t('sample'));
    // mobile nav
    document.getElementById('mobileNav').innerHTML = navItems.map(([k, ic, lk]) => `<a href="/${k}" class="mz-mobile-nav__item" data-nav="${k}" aria-current="${S.tab === k ? 'page' : 'false'}"><span style="width:1.4rem">${ic}</span><span>${t(lk)}</span></a>`).join('');
  }

  /* ---------------------------------------------------------------- toolbar */
  function renderToolbar() {
    const isP = S.tab === 'portfolios';
    document.getElementById('pageTitle').textContent = t(isP ? 'p.title' : 's.title');
    document.getElementById('pageSub').textContent = t(isP ? 'p.sub' : 's.sub');
    document.getElementById('headingEnd').innerHTML = `<span class="mz-edition">${LANG === 'ar' ? 'من الإفصاح إلى الرؤية' : 'Disclosure. Perspective.'}</span>`;
    // subtabs
    const subs = isP ? P_SUB : S_SUB.map((x) => [x[0], x[1]]);
    const cur = isP ? S.pMetric : S.sMetric;
    document.getElementById('subtabs').innerHTML = subs.map(([k, lk]) => `<button class="mz-subtab" role="tab" data-sub="${k}" aria-selected="${k === cur}">${t(lk)}</button>`).join('');
    // timebar
    document.getElementById('timebar').innerHTML = TFS.map(([k, l]) => `<button class="mz-segmented__item" data-tf="${k}" aria-selected="${k === S.tf}">${k === 'ALL' && LANG === 'ar' ? 'الكل' : l}</button>`).join('');
    // sort
    const sortKey = isP ? P_SORT[S.pMetric] : S_SORT[S_SUB.find((x) => x[0] === S.sMetric)[3]];
    document.getElementById('sortBtn').innerHTML = `${I.sort}<span>${t(sortKey)}</span>${I.chevronDown}`;
    document.getElementById('whyBtn').innerHTML = `${I.info}<span>${t('c.why')}</span>`;
    const fCount = (S.compliance !== 'all' ? 1 : 0) + (!isP && S.evFilter !== 'all' ? 1 : 0) + (S.followedOnly ? 1 : 0);
    document.getElementById('filterBtn').innerHTML = `${I.filter}<span>${t('c.filter')}</span>${fCount ? `<span class="mz-count">${fCount}</span>` : ''}`;
    document.getElementById('filterBtn').dataset.active = fCount > 0;
    const cmp = document.getElementById('compareBtn');
    cmp.title = t('c.compare'); cmp.setAttribute('aria-label', t('c.compare'));
    cmp.style.display = isP ? '' : 'none';
    cmp.innerHTML = `${I.compare}<span>${t('c.compare')}${S.compareMode && S.selected.length ? ` (${S.selected.length})` : ''}</span>`;
    cmp.dataset.active = S.compareMode;
    document.getElementById('portfolioControls')?.remove();
    if (isP) {
      document.getElementById('controlRow').insertAdjacentHTML('afterbegin', `<div id="portfolioControls" class="mz-pf-controls"><label>${LANG === 'ar' ? 'ترتيب حسب' : 'Sort by'}<select id="portfolioSort">${P_SUB.map(([k]) => `<option value="${k}" ${k === S.pMetric ? 'selected' : ''}>${t(P_SORT[k])}</option>`).join('')}</select></label><label>${LANG === 'ar' ? 'الحالة' : 'Status'}<select id="portfolioStatus">${[['all', LANG === 'ar' ? 'الكل' : 'All'], ['fully', t('v.compliant')], ['watch', t('v.purify')], ['excluded', t('v.noncompliant')], ...(S.compliance === 'exclude' ? [['exclude', t('f.exclude')]] : [])].map(([k, label]) => `<option value="${k}" ${S.compliance === k ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div class="mz-search mz-pf-search"><span class="mz-search__icon">${I.search}</span><input id="portfolioSearch" type="search" aria-label="${LANG === 'ar' ? 'بحث المحافظ' : 'Search portfolios'}" placeholder="${LANG === 'ar' ? 'بحث المحافظ…' : 'Search portfolios...'}" value="${esc(S.query)}"></div></div>`);
    }
    // applied chips
    const chips = [];
    if (isP && ['watch', 'excluded'].includes(S.compliance)) chips.push([t(S.compliance === 'watch' ? 'v.purify' : 'v.noncompliant'), () => { S.compliance = 'all'; render(); }]);
    if (S.compliance === 'fully') chips.push([t('v.compliant') + (LANG === 'ar' ? ' فقط' : ' only'), () => { S.compliance = 'all'; render(); }]);
    if (S.compliance === 'exclude') chips.push([t('v.compliant') + ' + ' + t('v.purify'), () => { S.compliance = 'all'; render(); }]);
    if (!isP && S.evFilter !== 'all') chips.push([t('ev.' + S.evFilter) + ' ' + t('h.evidence').toLowerCase(), () => { S.evFilter = 'all'; render(); }]);
    if (S.followedOnly) chips.push([t('tab.following'), () => { S.followedOnly = false; render(); }]);
    const chipWrap = document.getElementById('chips');
    chipWrap.innerHTML = chips.length ? `<div class="mz-toolbar" style="gap:.5rem">${chips.map((c, i) => `<button class="mz-chip" data-chip="${i}" data-active="true">${esc(c[0])} ${I.close}</button>`).join('')}${chips.length > 1 ? `<button class="mz-linkbtn" id="clearChips">${t('c.clear')}</button>` : ''}</div>` : '';
    chipWrap._chips = chips;
  }

  function renderBrief(list) {
    const ar = LANG === 'ar', isP = S.tab === 'portfolios', lead = list[0];
    const el = document.getElementById('marketBrief');
    if (isP) {
      el.className = 'mz-pfsum';
      const known = list.filter((p) => p.ret.val != null && isFinite(p.ret.val));
      const avg = known.length ? known.reduce((sum, p) => sum + p.ret.val, 0) / known.length : null;
      const indicative = known.some((p) => p.ret.indicative);
      const rows = list.flatMap((p) => p.rows), latest = latestFiling(rows);
      const attn = list.filter((p) => portfolioTone(p) !== 'clean').length;
      const item = (label, value, sub, icon, color) => `<div class="mz-pfsum__item"><span class="mz-pfsum__label">${label}</span><strong class="mz-pfsum__val"${color ? ` style="color:${color}"` : ''}>${value}</strong><span class="mz-pfsum__sub">${sub}</span><span class="mz-pfsum__icon">${icon}</span></div>`;
      el.innerHTML =
        item(ar ? 'محافظ متابَعة' : 'Portfolios tracked', list.length, ar ? 'في هذا العرض' : 'In this view', I.briefcase) +
        item(ar ? `متوسط العائد (${tfLabelNow()})` : `Average return (${tfLabelNow()})`, avg == null ? '—' : fmtPct(avg), indicative ? (ar ? 'تقديري · منذ الإفصاح' : 'Indicative · since disclosed') : (ar ? 'للفترة المحددة' : 'Selected period'), I.stocks, portfolioColor(avg)) +
        item(ar ? 'إجمالي الإفصاحات' : 'Total disclosures', rows.length, ar ? 'المحافظ المعروضة' : 'Displayed portfolios', I.portfolios) +
        item(ar ? 'أحدث تاريخ تقديم' : 'Latest filing date', latest ? esc(shortDate(latest)) : '—', latest ? `${daysSince(latest)}${ar ? 'ي مضت' : 'd ago'}` : t('dtl.pending'), I.clock) +
        item(ar ? 'تحتاج انتباهًا' : 'Requiring attention', attn, ar ? 'مراقبة أو مستبعدة' : 'Watch or excluded', I.info, 'var(--mz-purify-600)');
      return;
    }
    // Stocks keeps its existing hero — this redesign is scoped to the Portfolios page.
    el.className = 'mz-brief';
    const ret = lead ? returnOf(histOf(lead.ticker), lead.perf) : null;
    const name = lead ? lead.ticker : t('dtl.pending');
    const rows = lead ? (lead.rows || S.rows.filter((r) => r.ticker === lead.ticker)) : [];
    const dates = rows.map((r) => r[FIELD.filedDate]).filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a));
    el.innerHTML = `<div class="mz-brief__lead"><div class="mz-eyebrow">${ar ? 'قراءة الإفصاحات' : 'The disclosure read'}</div><div class="mz-brief__return">${perfHero(ret)}</div><div class="mz-brief__identity"><span>${esc(name)}</span>${lead ? badge(lead.label) : badge('unscreened')}</div><p class="mz-muted">${ret && ret.indicative ? t('dtl.indicativeSub') : ar ? 'العائد للفترة المحددة · معلومات، ليست نصيحة' : 'Return for the selected period · intelligence, not advice'}</p></div><div class="mz-brief__facts"><div><span class="mz-eyebrow">${ar ? 'الأسماء المعروضة' : 'In this view'}</span><strong>${list.length}</strong><span class="mz-muted">${t('tab.stocks')}</span></div><div><span class="mz-eyebrow">${ar ? 'أحدث إفصاح للاسم' : 'Latest filing · featured name'}</span><strong class="mz-brief__date">${dates.length && isFinite(Date.parse(dates[0])) ? esc(shortDate(dates[0])) : '—'}</strong><span class="mz-muted">${dates.length && isFinite(Date.parse(dates[0])) ? (ar ? 'تاريخ الإفصاح' : 'Filing date') : t('dtl.pending')}</span></div></div>`;
  }

  // Evidence meters describe existing inputs; absent ratios are pending, never assumed zero.
  function ratioMeters(rec) {
    const ar = LANG === 'ar';
    const ratios = [
      [ar ? 'الدين بفائدة' : 'Interest-bearing debt', rec.debtPct ?? rec.debtRatio, 30, ar ? 'من القيمة السوقية' : 'of market cap'],
      [ar ? 'النقد والأوراق ذات الفائدة' : 'Cash & interest-bearing securities', rec.cashPct, 30, ar ? 'من القيمة السوقية' : 'of market cap'],
      [ar ? 'الدخل غير المباح' : 'Non-permissible income', rec.impurePct, 5, ar ? 'من الإيرادات' : 'of revenue'],
    ];
    return `<div class="mz-ratios">${ratios.map(([label, raw, limit, basis]) => {
      const v = raw == null || raw === '' || !isFinite(+raw) ? null : +raw;
      const max = limit === 5 ? 10 : 60;
      const tone = v == null ? 'review' : v > limit ? 'noncompliant' : 'compliant';
      return `<div class="mz-ratio"><div class="mz-ratio__label"><span>${label}</span><b class="mz-ltr">${v == null ? '—' : v.toFixed(1) + '%'}</b></div><div class="mz-ratio__track" ${v == null ? '' : `role="meter" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${Math.max(max, v)}" aria-valuenow="${v}" aria-valuetext="${v}% ${esc(basis)}; ${limit}% AAOIFI"`}><span class="mz-ratio__fill" style="width:${v == null ? 0 : Math.min(100, Math.max(0, v) / max * 100)}%;background:var(--mz-${tone}-600)"></span><i class="mz-ratio__limit" style="inset-inline-start:50%"></i></div><div class="mz-ratio__context"><span>${v == null ? t('dtl.pending') : basis}</span><span>${ar ? 'حد' : 'Limit'} ${limit}% · AAOIFI</span></div></div>`;
    }).join('')}</div>`;
  }
  function screeningSection(rows) {
    const ar = LANG === 'ar', names = [...new Map(rows.map((r) => [r.ticker, r])).values()];
    return `<section class="mz-drawer__section mz-screening"><div class="mz-section-title"><h3>${ar ? 'أدلة الفحص الشرعي' : 'Screening evidence'}</h3><span class="mz-eyebrow">AAOIFI · 30/30/5</span></div><p class="mz-entity__meta">${ar ? 'نسب الأسماء المُفصَح عنها؛ ليست متوسطًا للمحفظة.' : 'Ratios for disclosed names; no portfolio averaging.'}</p>${names.map((r) => `<details class="mz-screening__name" ${names.length === 1 ? 'open' : ''}><summary><b class="mz-ltr">${esc(r.ticker)}</b>${badge(r.label || labelOf(r))}</summary>${ratioMeters(r)}<p class="mz-entity__meta">${ar ? 'النشاط التجاري' : 'Business activity'}: ${r.businessStatus === 'fail' ? (ar ? 'لم يجتز' : 'Does not pass') : r.businessStatus === 'pass' ? (ar ? 'اجتاز' : 'Passes') : (ar ? 'قيد المراجعة' : 'Under review')} · ${ar ? 'أُفصح' : 'Disclosed'} ${esc(fDisclosed(r) || '—')}</p></details>`).join('')}</section>`;
  }

  /* ---------------------------------------------------------------- tables + cards */
  function renderList() {
    const list = currentList();
    document.getElementById('resultMeta').textContent = t('meta.count', { n: list.length }) + (S.live ? '' : ' · ' + t('sample'));
    const isP = S.tab === 'portfolios';
    if (S.loading) {
      document.getElementById('marketBrief').hidden = true;
      document.getElementById('resultMeta').textContent = '';
      document.getElementById('legend').innerHTML = '';
      document.getElementById('thead').innerHTML = '';
      document.getElementById('cards').innerHTML = '';
      document.getElementById('tableWrap').style.display = '';
      document.getElementById('tbody').innerHTML = `<tr><td colspan="8"><div class="mz-state"><div class="mz-state__content"><p class="mz-muted">${LANG === 'ar' ? 'جارٍ تحميل البيانات الحية…' : 'Loading live data…'}</p></div></div></td></tr>`;
      return;
    }
    document.getElementById('marketBrief').hidden = ['following', 'alerts', 'account'].includes(S.tab);
    if (!document.getElementById('marketBrief').hidden) renderBrief(list);
    document.getElementById('acctPanel')?.remove();
    const thead = document.getElementById('thead'), tbody = document.getElementById('tbody'), cards = document.getElementById('cards');
    if (['following', 'alerts', 'account'].includes(S.tab)) { renderSecondary(); return; }
    document.getElementById('tableWrap').style.display = '';
    // Spec: the compliance legend is removed from the primary Portfolios experience; kept on Stocks.
    document.getElementById('legend').innerHTML = isP ? '' : ['clean', 'purify', 'fail', 'unscreened'].map((k) => `<span><span class="mz-dot" style="background:var(--mz-${VER[k].cls === 'compliant' ? 'compliant' : VER[k].cls === 'purify' ? 'purify' : VER[k].cls === 'noncompliant' ? 'noncompliant' : 'review'}-600)"></span>${t(VER[k].k)}</span>`).join('');
    document.getElementById('guardrail').textContent = isP ? (LANG === 'ar' ? 'العوائد من البيانات المُفصَح عنها للفترة المحددة. معلومات فقط، وليست نصيحة استثمارية.' : 'Returns reflect disclosed data for the selected period. Informational only — not investment advice.') : t('g.disclaimer');

    if (isP) {
      thead.innerHTML = `<tr><th>#</th><th>${t('h.portfolio')}</th><th>${t('h.return')} (${esc(tfLabelNow())})</th><th>${t('h.activity')}</th><th>${t('dtl.holdings')}</th><th>${LANG === 'ar' ? 'آخر تقديم' : 'Last filing'}</th><th>${LANG === 'ar' ? 'حالة ميزان' : 'Mizan Status'}</th><th>${t('common.follow')}</th></tr>`;
      tbody.innerHTML = list.map((p, i) => {
        const sel = S.compareMode ? S.selected.includes(p.name) : S.drawer?.type === 'detail' && S.drawer.name === p.name;
        const first = S.compareMode ? `<button class="mz-check-btn" data-select="${esc(p.name)}" data-on="${sel}" aria-label="Select">${sel ? I.check : ''}</button>` : `<span class="mz-rank">${i + 1}</span>`;
        const date = latestFiling(p.rows);
        return `<tr tabindex="0" role="button" data-row="portfolio" data-id="${esc(p.name)}" data-selected="${sel}"><td>${first}</td><td>${entity(esc(p.initials), p.name, esc(typeLabel(p.kind)))}</td><td><div class="mz-perf-cell">${portfolioReturn(p.ret)}${chart(sliceTf(portfolioIndexHist(p.rows)), { cls: 'mz-chart--spark', unit: 'index', color: portfolioColor(p.ret.val) })}</div></td><td class="mz-cell-num">${p.count}<span class="mz-cell-context">${LANG === 'ar' ? 'إفصاح' : p.count === 1 ? 'Disclosure' : 'Disclosures'}</span></td><td class="mz-cell-num">${p.holdings}<span class="mz-cell-context">${LANG === 'ar' ? 'أسهم' : p.holdings === 1 ? 'Stock' : 'Stocks'}</span></td><td>${date ? esc(shortDate(date)) : '—'}<span class="mz-cell-context">${p.fresh == null ? t('dtl.pending') : `${p.fresh}${LANG === 'ar' ? 'ي مضت' : 'd ago'}`}</span></td><td>${compliancePill(portfolioTone(p))}</td><td>${starBtn(p.name)}</td></tr>`;
      }).join('') || emptyRow(8);
      cards.innerHTML = list.map((p, i) => portfolioCard(p, i)).join('');
    } else if (S.sMetric === 'flow') {
      renderFlowBoard(list, thead, tbody, cards);
    } else {
      // Performance-led: Since-disclosed return is the hero column (3rd); status is a compact badge.
      thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.stock')}</th><th>${t('h.return')}</th><th>${t('h.signal')}</th><th>${t('h.evidence')}</th><th>${t('h.filers')}</th><th>${t('h.value')}</th><th>${t('h.status')}</th></tr>`;
      const signal = (LANG === 'ar' ? { bought: 'تجميع', sold: 'تخفيض', new: 'مركز جديد', incr: 'زيادة المركز', red: 'تخفيض المركز', exit: 'خروج' } : { bought: 'Accumulation', sold: 'Reduction', new: 'New position', incr: 'Position increased', red: 'Position reduced', exit: 'Exited' })[S.sMetric];
      tbody.innerHTML = list.map((s, i) => `<tr tabindex="0" role="button" data-row="stock" data-id="${esc(s.ticker)}"><td><span class="mz-rank">${i + 1}</span></td><td>${entity(`<span class="mz-ltr" style="font-weight:800;font-size:.72rem">${esc(s.ticker.slice(0, 4))}</span>`, s.ticker, `${esc(s.company)}${s.fresh != null ? ` · ${s.fresh}${LANG === 'ar' ? 'ي منذ الإفصاح' : 'd since filing'}` : ''}`, true)}</td><td><div class="mz-perf-cell">${perfHero(s.ret)}${chart(sliceTf(histOf(s.ticker)), { cls: 'mz-chart--spark' })}</div></td><td><div class="mz-muted" style="margin-block-end:.2rem">${signal}</div>${signalRow(stockRead(s.ticker).tags.slice(0, 1))}</td><td style="font-weight:700">${t('ev.' + evStrength(s.filerCount))}</td><td class="mz-cell-num">${s.filerCount}</td><td class="mz-cell-num" style="font-weight:750">${s.rows.some(hasAmount) ? fmtMoney(s.dollar) : '—'}</td><td>${badge(s.label)}</td></tr>`).join('') || emptyRow(8);
      cards.innerHTML = list.map((s, i) => stockCard(s, i)).join('');
    }
  }

  // Net-flow board — disclosed amounts alongside the shared interactive price chart.
  function renderFlowBoard(list, thead, tbody, cards) {
    const netCell = (f) => { const up = f.net >= 0; return `<span class="mz-perf-hero" data-up="${up}" style="font-size:var(--mz-text-md)">${up ? I.caretUp : I.caretDown}${fmtMoney(Math.abs(f.net))}<span class="mz-perf-ctx"> · ${LANG === 'ar' ? 'مُفصَح' : 'disclosed'}</span></span>`; };
    const tickerCell = (f) => { const bad = f.label === 'fail'; return entity(`<span class="mz-ltr" style="font-weight:800;font-size:.72rem${bad ? ';text-decoration:line-through' : ''}">${esc(f.ticker.slice(0, 4))}</span>`, f.ticker, `${esc(f.company)}${f.fresh != null ? ` · ${f.fresh}${LANG === 'ar' ? 'ي منذ الإفصاح' : 'd since filing'}` : ''}`, true); };
    thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.stock')}</th><th>${t('dtl.perf')} · ${esc(tfLabelNow())}</th><th>${LANG === 'ar' ? 'صافي' : 'Net'}</th><th>${LANG === 'ar' ? 'إجمالي' : 'Gross'}</th><th>${t('h.filers')}</th><th>${t('h.status')}</th></tr>`;
    tbody.innerHTML = list.map((f, i) => `<tr tabindex="0" role="button" data-row="stock" data-id="${esc(f.ticker)}"${f.label === 'fail' ? ' style="opacity:.85"' : ''}><td><span class="mz-rank">${i + 1}</span></td><td>${tickerCell(f)}</td><td style="min-width:14rem">${chart(sliceTf(histOf(f.ticker)), { cls: 'mz-chart--card', empty: t('dtl.pending') })}<div style="display:flex;justify-content:space-between;margin-block-start:.25rem;font-size:var(--mz-text-xs)" class="mz-muted"><span>${LANG === 'ar' ? 'بيع' : 'sold'} ${fmtMoney(f.sell)}</span><span>${LANG === 'ar' ? 'شراء' : 'bought'} ${fmtMoney(f.buy)}</span></div></td><td>${netCell(f)}</td><td class="mz-cell-num mz-muted">${fmtMoney(f.gross)}</td><td class="mz-cell-num">${f.filerCount}</td><td>${badge(f.label)}</td></tr>`).join('') || emptyRow(7);
    cards.innerHTML = list.map((f, i) => `<article class="mz-stock-card" tabindex="0" role="button" data-row="stock" data-id="${esc(f.ticker)}"${f.label === 'fail' ? ' style="opacity:.85"' : ''}><div style="display:flex;gap:.75rem;align-items:center"><span class="mz-rank">${i + 1}</span><div style="flex:1;min-width:0"><div class="mz-entity__name mz-ltr"${f.label === 'fail' ? ' style="text-decoration:line-through"' : ''}>${esc(f.ticker)}</div><div class="mz-entity__meta">${esc(f.company)}</div></div><div style="text-align:end">${netCell(f)}</div></div><div style="margin-block-start:.6rem">${chart(sliceTf(histOf(f.ticker)), { cls: 'mz-chart--card', empty: t('dtl.pending') })}</div><div style="display:flex;justify-content:space-between;margin-block-start:.5rem;gap:.5rem;align-items:center">${badge(f.label)}<span class="mz-muted" style="font-size:var(--mz-text-xs)">${LANG === 'ar' ? 'بيع' : 'sold'} ${fmtMoney(f.sell)} · ${LANG === 'ar' ? 'شراء' : 'bought'} ${fmtMoney(f.buy)}</span></div></article>`).join('');
    // Non-compliant names remain labeled for market awareness.
    document.getElementById('guardrail').textContent = t('flow.note');
  }
  const emptyRow = (cols) => `<tr><td colspan="${cols}"><div class="mz-state"><div class="mz-state__content"><h3>${t('empty.title')}</h3><p class="mz-muted">${t('empty.body')}</p></div></div></td></tr>`;

  function portfolioCard(p, i) {
    const flag = portfolioFlag(p), sel = S.compareMode ? S.selected.includes(p.name) : S.drawer?.type === 'detail' && S.drawer.name === p.name;
    return `<article class="mz-portfolio-card" tabindex="0" role="button" data-row="portfolio" data-id="${esc(p.name)}" data-selected="${sel}">
      <div style="display:flex;gap:.75rem;align-items:center">
        ${S.compareMode ? `<button class="mz-check-btn" aria-label="${LANG === 'ar' ? 'اختر للمقارنة' : 'Select for comparison'}" data-select="${esc(p.name)}" data-on="${sel}">${sel ? I.check : ''}</button>` : `<span class="mz-rank">${i + 1}</span>`}
        <span class="mz-entity__avatar"><span style="color:var(--mz-cobalt-700);font-weight:800">${esc(p.initials)}</span></span>
        <div style="flex:1;min-width:0"><div class="mz-entity__name">${esc(p.name)}</div><div class="mz-entity__meta">${esc(typeLabel(p.kind))}${p.fresh != null ? ` · ${p.fresh}${LANG === 'ar' ? 'ي منذ الإفصاح' : 'd since filing'}` : ''}</div></div>
        <div style="text-align:end">${S.tab === 'portfolios' ? portfolioReturn(p.ret) : perfHero(p.ret)}</div>
      </div>
      <div style="margin-block-start:.65rem">${chart(sliceTf(portfolioIndexHist(p.rows)), { cls: 'mz-chart--card', unit: 'index', color: S.tab === 'portfolios' ? portfolioColor(p.ret.val) : undefined })}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-block-start:.6rem;gap:.5rem">
        ${compliancePill(S.tab === 'portfolios' ? portfolioTone(p) : flag.tone)}
        <span class="mz-muted" style="font-size:var(--mz-text-xs)">${p.count} ${LANG === 'ar' ? 'إفصاح' : (p.count === 1 ? 'disclosure' : 'disclosures')} · ${starBtn(p.name)}</span>
      </div>
    </article>`;
  }
  function stockCard(s, i) {
    return `<article class="mz-stock-card" tabindex="0" role="button" data-row="stock" data-id="${esc(s.ticker)}">
      <div style="display:flex;gap:.75rem;align-items:center">
        <span class="mz-rank">${i + 1}</span>
        <div style="flex:1;min-width:0"><div class="mz-entity__name mz-ltr">${esc(s.ticker)}</div><div class="mz-entity__meta">${esc(s.company)}${s.fresh != null ? ` · ${s.fresh}${LANG === 'ar' ? 'ي منذ الإفصاح' : 'd since filing'}` : ''}</div></div>
        <div style="text-align:end">${perfHero(s.ret)}</div>
      </div>
      <div style="margin-block-start:.6rem">${chart(sliceTf(histOf(s.ticker)), { cls: 'mz-chart--card' })}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-block-start:.6rem;gap:.5rem">
        ${badge(s.label)}
        <span class="mz-muted" style="font-size:var(--mz-text-xs)">${t('ev.' + evStrength(s.filerCount))} · ${s.filerCount} ${LANG === 'ar' ? 'مُفصِح' : (s.filerCount === 1 ? 'filer' : 'filers')} · ${s.rows.some(hasAmount) ? fmtMoney(s.dollar) : '—'}</span>
      </div>
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
        myPortfolioPanel() +
        `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)"><h3>${LANG === 'ar' ? 'المظهر' : 'Appearance'}</h3>${seg('data-theme-pick', THEME, [['light', LANG === 'ar' ? 'فاتح' : 'Light'], ['dark', LANG === 'ar' ? 'داكن' : 'Dark']])}</section>` +
        `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)"><h3>${t('acct.lang')}</h3>${seg('data-lang', LANG, [['en', 'English'], ['ar', 'العربية']])}</section>` +
        `<section class="mz-surface" style="padding:var(--mz-space-5);margin-block-end:var(--mz-space-4)"><h3>${LANG === 'ar' ? 'حساسية الحكم' : 'Verdict tolerance'}</h3><p class="mz-muted" style="margin:.25rem 0 .75rem;font-size:var(--mz-text-sm)">${LANG === 'ar' ? 'يضبط الافتراضي لكل القوائم.' : 'Sets the default across every list.'}</p>${seg('data-fc', S.compliance, [['all', LANG === 'ar' ? 'الكل' : 'All'], ['fully', t('f.fully')], ['exclude', t('f.exclude')]])}</section>` +
        `<section class="mz-surface" style="padding:var(--mz-space-5)"><h3>${t('sec.methodology')}</h3><p class="mz-muted" style="margin:0;line-height:1.55">${t('sec.mtext')}</p></section>`;
    } else if (S.tab === 'following') {
      const followed = derivePortfolios(S.rows).filter((p) => S.follows.has(p.name) && p.holdings >= MIN_HOLDINGS);
      div.innerHTML = followed.length
        ? `<div class="mz-card-list" style="display:grid">${followed.map((p, i) => portfolioCard(p, i)).join('')}</div>`
        : emptyState(I.star, LANG === 'ar' ? 'لا تتابع أحدًا بعد' : "You're not following anyone yet",
          LANG === 'ar' ? 'تابِع محفظة من تبويب المحافظ لإبقائها هنا.' : 'Follow a portfolio from the Portfolios tab to keep it here.');
    } else { // alerts
      const notes = S.rows.filter((r) => S.follows.has(r.actor)).sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || ''));
      div.innerHTML = notes.length
        ? `<div class="mz-card-list" style="display:grid">${notes.map((r) => { const lag = daysBetween(r.transactionDate, r.filingDate); return `<article class="mz-stock-card" tabindex="0" role="button" data-row="stock" data-id="${esc(r.ticker)}"><div style="display:flex;gap:.75rem;align-items:center"><div style="flex:1;min-width:0"><div class="mz-entity__name">${esc(r.actor)}</div><div class="mz-entity__meta">${String(r.side).toUpperCase() === 'SELL' ? t('dtl.sold') : t('dtl.bought')} <span class="mz-ltr">${esc(r.ticker)}</span> · ${esc(r.amount || disclosedMoney(r))} · ${esc(shortDate(fDisclosed(r)))}${lag != null ? ` · ${t('dtl.filedLater', { n: lag })}` : ''}</div></div>${badge(r.label)}${I.chevronRight ? `<span style="width:1rem;color:var(--mz-ink-400)">${I.chevronRight}</span>` : ''}</div></article>`; }).join('')}</div>`
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
    document.body.classList.toggle('mz-pf-panel-open', S.tab === 'portfolios' && S.drawer?.type === 'detail');
    const scrim = document.getElementById('scrim');
    if (!S.drawer) { grid.classList.remove('mz-content-grid--drawer-open'); d.hidden = true; d.innerHTML = ''; scrim.hidden = true; lockBodyScroll(false); return; }
    grid.classList.add('mz-content-grid--drawer-open'); d.hidden = false;
    // Scrim only under the sheet/side-panel on tablet & mobile (desktop drawer is in-grid).
    scrim.hidden = window.matchMedia('(min-width: 75rem)').matches;
    // Freeze the page behind the sheet/side-panel so scrolling it never leaks to the list below.
    lockBodyScroll(!scrim.hidden);
    if (S.drawer.type === 'compare') d.innerHTML = compareDrawer();
    else if (S.drawer.type === 'evidence') d.innerHTML = evidenceDrawer(S.drawer.ticker);
    else if (S.drawer.type === 'detail') d.innerHTML = portfolioDrawer(S.drawer.name);
  }
  // iOS-safe background scroll lock: pin the body at its current offset while a sheet is open,
  // then restore the exact scroll position on close. (overflow:hidden alone leaks on iOS Safari.)
  let _lockedY = 0;
  function lockBodyScroll(on) {
    const b = document.body, locked = b.classList.contains('mz-locked');
    if (on && !locked) { _lockedY = window.scrollY || window.pageYOffset || 0; b.style.top = `-${_lockedY}px`; b.classList.add('mz-locked'); }
    else if (!on && locked) { b.classList.remove('mz-locked'); b.style.top = ''; window.scrollTo(0, _lockedY); }
  }
  // Rotating / resizing across the desktop breakpoint must re-evaluate the lock (in-grid vs sheet).
  window.addEventListener('resize', () => { if (S.drawer) renderDrawer(); else lockBodyScroll(false); });
  function drawerHead(title, opts) {
    opts = opts || {};
    const backIcon = LANG === 'ar' ? I.chevronRight : I.chevronLeft;
    const back = opts.back ? `<button class="mz-button mz-button--icon" id="drawerBack" aria-label="${LANG === 'ar' ? 'رجوع' : 'Back'}">${backIcon}</button>` : '';
    return `<div class="mz-drawer__header"><div class="mz-drawer__title" style="gap:.4rem">${back}<h3 style="margin:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</h3>${opts.tag ? `<span style="flex:0 0 auto">${opts.tag}</span>` : ''}<button class="mz-button mz-button--icon" id="drawerClose" aria-label="${LANG === 'ar' ? 'إغلاق' : 'Close'}">${I.close}</button></div></div>`;
  }

  function compareDrawer() {
    const items = currentList().filter((p) => S.selected.includes(p.name)).slice(0, 2);
    const row = (label, fn) => `<div class="mz-drawer__section"><div class="mz-cmp-metric__label">${label}</div><div class="mz-cmp-vals">${items.map((p) => `<div>${fn(p)}</div>`).join('')}</div></div>`;
    return drawerHead(t('cmp.title')) +
      `<div class="mz-drawer__section"><div class="mz-cmp-head">${items.map((p) => `<div><span class="mz-entity__avatar" style="margin-inline:auto">${esc(p.initials)}</span><div style="font-weight:700;margin-block-start:.35rem">${esc(p.name)}</div><div class="mz-entity__meta">${typeLabel(p.kind)}</div>${compliancePill(portfolioFlag(p).tone)}</div>`).join('')}</div></div>` +
      row(t('cmp.return'), (p) => perfHero(p.ret) + chart(sliceTf(portfolioIndexHist(p.rows)), { cls: 'mz-chart--card', unit: 'index' })) +
      row(t('cmp.disclosures'), (p) => p.count) +
      row(t('cmp.alloc'), (p) => Math.round(p.cleanPct * 100) + '%') +
      row(t('cmp.purify'), (p) => `<span style="color:var(--mz-purify-700)">${p.purifyPct}%</span>`) +
      `<div class="mz-drawer__section">${items.map((p) => allocBar(p.mix)).join('')}</div>` +
      `<div class="mz-drawer__footer"><p class="mz-muted" style="margin:0;font-size:.75rem">${t('cmp.note')}</p></div>`;
  }
  function evidenceDrawer(ticker) {
    const rows = S.rows.filter((r) => r.ticker === ticker);
    if (!rows.length) return drawerHead(ticker, { back: true });
    const filers = new Set(rows.map((r) => r.actor)).size;
    const buyers = new Set(rows.filter((r) => sideUp(r.side)).map((r) => r.actor)).size;
    const fresh = Math.min(...rows.map((r) => daysSince(r.filingDate) ?? 999));
    const label = rows[0].label;
    const ar = LANG === 'ar';
    // Disclosure conviction: share of disclosed trades for this name that are BUYS (0–100,
    // 50 = balanced). A factual read of disclosed flow — cobalt/ink, never a verdict hue —
    // weighted for credibility by filer breadth. Informational, not advice.
    const convBuys = rows.filter((r) => sideUp(r.side)).length;
    const convSells = rows.length - convBuys;
    const convScore = rows.length ? Math.round((100 * convBuys) / rows.length) : null;
    const convStrength = filers >= 5 ? (ar ? 'إشارة واسعة' : 'Broad signal')
      : filers >= 2 ? (ar ? 'إشارة متوسطة' : 'Moderate signal')
      : (ar ? 'مُفصِح واحد' : 'Single filer');
    const convDir = convScore == null ? '' : convScore > 55 ? (ar ? 'شراء صافٍ' : 'net buying')
      : convScore < 45 ? (ar ? 'بيع صافٍ' : 'net selling') : (ar ? 'متوازن' : 'balanced');
    const convictionHtml = convScore == null ? '' :
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${ar ? 'مؤشر القناعة في الإفصاح' : 'Disclosure conviction'}</div>` +
      `<div style="display:flex;align-items:baseline;gap:.4rem"><b class="mz-ltr" style="font-size:var(--mz-text-2xl);font-weight:800;color:var(--mz-cobalt-700);line-height:1">${convScore}</b><span class="mz-muted" style="font-size:var(--mz-text-xs)">/100 · ${convDir}</span></div>` +
      `<div style="position:relative;height:.5rem;border-radius:var(--mz-radius-pill);background:var(--mz-ink-100);margin:.55rem 0;overflow:hidden"><span style="position:absolute;inset-block:0;inset-inline-start:0;width:${convScore}%;background:var(--mz-cobalt-600);border-radius:var(--mz-radius-pill)"></span><i style="position:absolute;inset-block:-2px;inset-inline-start:50%;width:1px;background:var(--mz-ink-300)"></i></div>` +
      `<div class="mz-entity__meta" style="display:flex;justify-content:space-between;gap:.5rem"><span>${convBuys} ${ar ? 'شراء' : (convBuys === 1 ? 'buy' : 'buys')} · ${convSells} ${ar ? 'بيع' : (convSells === 1 ? 'sell' : 'sells')}</span><span>${convStrength}</span></div>` +
      `<p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.4rem 0 0;line-height:1.4">${ar ? 'نسبة عمليات الشراء من إجمالي الصفقات المُفصَح عنها — معلوماتي، ليس نصيحة.' : 'Share of disclosed trades that are buys — informational, not advice.'}</p></div>`;
    const perfs = rows.map((r) => r.performance && r.performance.sinceDisclosed).filter((x) => x != null && isFinite(x));
    const perf = perfs.length ? +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(1) : null;
    const headline = composeHeadline(returnOf(histOf(ticker), perf).val, { hasActivity: true, buyers, active: filers >= 3 });
    // Attraction: filers buying is the real signal; a public follower count only shows when meaningful.
    const stats = dtlStat(buyers, LANG === 'ar' ? 'جهة تشتري' : (buyers === 1 ? 'filer buying' : 'filers buying')) +
      dtlStat(filers, LANG === 'ar' ? 'إجمالي المُفصِحين' : (filers === 1 ? 'filer total' : 'total filers')) +
      dtlStat(fresh <= 900 ? fresh + 'd' : '—', LANG === 'ar' ? 'منذ آخر إفصاح' : 'since last filing');
    // Who bought & sold — the disclosure log as a TIMELINE (most recent trade first), each with
    // amount + date + filing lag. (Was sorted by dollar size, which jumbled the dates.)
    const dOf = (r) => Date.parse(fDisclosed(r) || r[FIELD.filedDate] || '') || 0;
    const log = [...rows].sort((a, b) => dOf(b) - dOf(a) || fAmt(b) - fAmt(a)).slice(0, 8);
    // Trust note: when a material share of a move happened during the filing lag (before public).
    const freshNote = log.map((r) => r.performance && r.performance.freshness).find(Boolean);
    const following = S.follows.has(ticker);
    const who = { avatar: `<span class="mz-ltr" style="font-weight:800;font-size:.72rem">${esc(ticker.slice(0, 4))}</span>`, name: ticker, sub: rows[0].company || ticker, ltr: true };
    // Chart: pin each disclosed trade on the line (cobalt buy / ink sell) + a "today" price label.
    // On "All", frame to the trade window so the (recent) markers spread across the chart.
    const shist = frameToTrades(histOf(ticker), rows);
    const quote = (S.prices[ticker] && S.prices[ticker].quote != null) ? +S.prices[ticker].quote : (shist.length ? +shist[shist.length - 1].c : null);
    const todayLab = quote != null ? `${fmtPrice(quote)} · ${shist.length ? shortDate(shist[shist.length - 1].d) : (LANG === 'ar' ? 'آخر سعر مخزّن' : 'latest cached')}` : '';
    const marks = rows.map((r) => ({ d: fDisclosed(r), side: r.side, label: r.actor }));
    return drawerHead(t('dtl.stock'), { back: true, tag: badge(label) }) +
      detailHero(who, headline, returnOf(histOf(ticker), perf), stats) +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('dtl.perf')}</div>${chart(shist, { markers: marks, today: todayLab, axis: true, empty: t('dtl.pending') })}<p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.5rem 0 0">${LANG === 'ar' ? '● شراء · ○ بيع مُفصَح عنه — اسحب لأي نقطة لرؤية التاريخ.' : '● disclosed buy · ○ sell — scrub any point for its date & value.'}</p></div>` +
      convictionHtml +
      screeningSection([rows[0]]) +
      `<details class="mz-disclosure mz-drawer__section"><summary>${t('dtl.who')}<span>${log.length}</span></summary>${log.map((r) => { const lag = daysBetween(r[FIELD.disclosedDate], r[FIELD.filedDate]); const evn = entryVsNow(r); return `<div class="mz-hold"><div class="mz-hold__n"><div style="font-weight:700">${esc(r.actor)}</div><div class="mz-entity__meta">${esc(r.source || r.kind || '')} · ${esc(shortDate(fDisclosed(r)))}${lag != null ? ` · ${t('dtl.filedLater', { n: lag })}` : ''}</div>${evn ? `<div class="mz-entity__meta">${evn}</div>` : ''}</div>${sideTag(r.side)}<span class="mz-cell-num" style="font-weight:750;margin-inline-start:.5rem">${disclosedMoney(r)}</span></div>`; }).join('')}${freshNote ? `<p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.5rem 0 0;line-height:1.4;display:flex;gap:.35rem;align-items:flex-start">${miniIcon(I.info)}<span>${esc(freshNote)}</span></p>` : ''}</details>` +
      `<p class="mz-drawer__section mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;padding-block:0">${t('dtl.compNote')} ${t('dtl.evNote')}</p>` +
      `<div class="mz-drawer__footer" style="display:grid;grid-template-columns:1fr auto;gap:.5rem"><button class="mz-button mz-button--${following ? 'secondary' : 'primary'}" data-follow="${esc(ticker)}">${following ? I.starOn : I.star}${following ? t('common.following') : t('common.follow')}</button><button class="mz-button mz-button--ghost" data-nav="alerts">${I.bell}${t('common.watch')}</button></div>`;
  }
  function portfolioDrawer(name) {
    const p = derivePortfolios(S.rows).find((x) => x.name === name); if (!p) return drawerHead(esc(name), { back: true });
    const disclosuresLbl = LANG === 'ar' ? 'إفصاح' : (p.count === 1 ? 'disclosure' : 'disclosures');
    // Preserve the existing disclosed-value weights and holding drill-down.
    const holdings = {};
    for (const r of p.rows) { const h = holdings[r.ticker] || (holdings[r.ticker] = { ticker: r.ticker, company: r.company, label: r.label, v: 0, known: true, d: null }); h.known = h.known && (r[FIELD.positionValue] != null ? isFinite(+r[FIELD.positionValue]) : hasAmount(r)); h.v += fWeightBasis(r); const dd = fDisclosed(r); if (dd && (!h.d || Date.parse(dd) > Date.parse(h.d))) h.d = dd; }
    const weightsKnown = Object.values(holdings).every((h) => h.known);
    const positionWeights = p.rows.every((r) => r[FIELD.positionValue] != null);
    const weightLabel = positionWeights ? t('dtl.weight') : (LANG === 'ar' ? 'من قيمة الإفصاحات' : 'of disclosed value');
    const totalV = Object.values(holdings).reduce((a, h) => a + h.v, 0) || 1;
    const pick = (S.drawer && S.drawer.chartTicker && histOf(S.drawer.chartTicker).length >= 2) ? S.drawer.chartTicker : null;
    const ar = LANG === 'ar', tab = S.drawer?.panelTab || 'overview', latest = latestFiling(p.rows);
    const tabs = [['overview', ar ? 'نظرة عامة' : 'Overview'], ['holdings', t('dtl.holdings')], ['activity', t('dtl.activity')], ['filings', ar ? 'التقديمات' : 'Filings'], ['insights', ar ? 'رؤى' : 'Insights']];
    const head = `<div class="mz-drawer__header mz-pf-panel-head"><span class="mz-entity__avatar">${esc(p.initials)}</span><div><h3>${esc(name)}</h3><span class="mz-entity__meta">${esc(typeLabel(p.kind))} ${ar ? 'محفظة' : 'portfolio'}</span></div>${starBtn(name)}<button class="mz-button mz-button--icon" id="drawerClose" aria-label="${ar ? 'إغلاق' : 'Close'}">${I.close}</button></div><div class="mz-pf-panel-tabs" role="tablist">${tabs.map(([k, label]) => `<button role="tab" data-panel-tab="${k}" aria-selected="${tab === k}">${label}</button>`).join('')}</div>`;
    const insightRead = ar
      ? `${p.ret.val == null ? 'بيانات العائد قيد الانتظار' : `العائد ${fmtPct(p.ret.val)} ${p.ret.indicative ? 'تقديري منذ الإفصاح' : `للفترة ${tfLabelNow()}`}`}، مع ${p.count} إفصاح عبر ${p.holdings} أسهم.`
      : `${p.ret.val == null ? 'Performance data is pending' : p.ret.indicative ? `Indicative return since disclosure is ${fmtPct(p.ret.val)}` : `Disclosed holdings returned ${fmtPct(p.ret.val)} over ${S.tf === 'ALL' ? 'the full available period' : tfLabelNow()}`}, with ${p.count} ${disclosuresLbl} across ${p.holdings} stocks.`;
    const insight = `<div class="mz-pf-insight"><span>${I.info} ${ar ? 'رؤية الذكاء الاصطناعي' : 'AI Insight'}</span><p>${esc(insightRead)}</p></div>`;
    const activity = (all) => `<div class="mz-pf-activity">${[...p.rows].sort((a, b) => (Date.parse(b[FIELD.filedDate]) || 0) - (Date.parse(a[FIELD.filedDate]) || 0)).slice(0, all ? p.rows.length : 3).map((r) => { const lag = daysBetween(r[FIELD.disclosedDate], r[FIELD.filedDate]); return `<div class="mz-pf-event">${I.portfolios}<div><strong>${esc(r.ticker)} · ${sideTag(r.side)}</strong><span>${disclosedMoney(r)} · ${esc(shortDate(fDisclosed(r)) || '—')}${lag == null ? '' : ` · ${t('dtl.filedLater', { n: lag })}`}</span></div><time>${r[FIELD.filedDate] ? esc(shortDate(r[FIELD.filedDate])) : '—'}</time></div>`; }).join('')}</div>`;
    const holdingsHtml = `<div class="mz-drawer__section">${Object.values(holdings).sort((a, b) => b.v - a.v).map((h) => `<div class="mz-hold mz-hold--pick" tabindex="0" role="button" data-holding="${esc(h.ticker)}" data-active="${pick === h.ticker}"><div class="mz-hold__n"><strong>${esc(h.ticker)}</strong><div class="mz-entity__meta">${esc(h.company || '')} · ${weightsKnown ? Math.round(h.v / totalV * 100) + '%' : '—'} ${weightLabel} · ${h.d ? esc(shortDate(h.d)) : '—'}</div></div>${badge(h.label)}</div>`).join('')}</div>`;
    const methodology = `<details class="mz-pf-methodology" ${S.drawer?.methodology ? 'open' : ''}><summary>${ar ? 'عرض المنهجية' : 'View methodology'} ${I.chevronRight}</summary>${screeningSection(p.rows)}<p class="mz-muted">${t('dtl.compNote')} ${t('dtl.evNote')}</p></details>`;
    const perfSection = `<section class="mz-drawer__section mz-pf-performance"><h3>${t('dtl.perf')} (${esc(tfLabelNow())})${pick ? ` · ${esc(pick)}` : ''}</h3>${portfolioReturn(pick ? returnOf(histOf(pick), null) : p.ret)}${pick ? `<button class="mz-linkbtn" data-holding="${esc(pick)}">↩ ${ar ? 'المحفظة' : 'Portfolio'}</button>` : ''}${chart(pick ? sliceTf(histOf(pick)) : sliceTf(portfolioIndexHist(p.rows)), { unit: pick ? 'price' : 'index', axis: true, area: true, valueAxis: !pick, color: portfolioColor(pick ? returnOf(histOf(pick), null).val : p.ret.val), empty: t('dtl.pending') })}</section>`;
    const overview = perfSection + `<div class="mz-pf-panel-stats"><div><span>${ar ? 'الإفصاحات' : 'Disclosures'}</span><strong>${p.count}</strong><small>${ar ? 'الإجمالي' : 'Total'}</small></div><div><span>${t('dtl.holdings')}</span><strong>${p.holdings}</strong><small>${ar ? 'أسهم' : 'Stocks'}</small></div><div><span>${ar ? 'آخر تقديم' : 'Latest filing'}</span><strong>${latest ? esc(shortDate(latest)) : '—'}</strong><small>${p.fresh == null ? t('dtl.pending') : p.fresh + (ar ? 'ي مضت' : 'd ago')}</small></div></div><section class="mz-pf-status-card"><h3>${ar ? 'حالة ميزان' : 'Mizan Status'}</h3>${compliancePill(portfolioTone(p))}<p>${ar ? 'وفق منهجية الفحص الحالية.' : 'Based on current screening methodology.'}</p>${methodology}</section><section class="mz-drawer__section"><div class="mz-section-title"><h3>${ar ? 'النشاط الأخير' : 'Recent activity'}</h3><button class="mz-linkbtn" data-panel-tab="activity">${ar ? 'عرض الكل' : 'View all'} ${I.chevronRight}</button></div>${activity(false)}</section>${insight}`;
    const filingGroups = new Map();
    p.rows.forEach((r) => { const d = r[FIELD.filedDate]; if (d && isFinite(Date.parse(d))) { const group = filingGroups.get(d) || []; group.push(r); filingGroups.set(d, group); } });
    const filings = `<section class="mz-drawer__section"><h3>${ar ? 'التقديمات المُفصَح عنها' : 'Disclosed filings'}</h3>${[...filingGroups].sort(([a], [b]) => Date.parse(b) - Date.parse(a)).map(([d, rows]) => `<div class="mz-pf-event">${I.portfolios}<div><strong>${esc(shortDate(d))}</strong><span>${rows.length} ${ar ? 'إفصاح' : rows.length === 1 ? 'disclosure' : 'disclosures'} · ${esc([...new Set(rows.map((r) => r.ticker))].join(', '))}</span></div><time>${daysSince(d)}${ar ? 'ي مضت' : 'd ago'}</time></div>`).join('') || `<p class="mz-muted">${t('dtl.pending')}</p>`}</section>`;
    return head + (tab === 'overview' ? overview : tab === 'holdings' ? perfSection + holdingsHtml : tab === 'activity' ? `<section class="mz-drawer__section">${activity(true)}</section>` : tab === 'filings' ? filings : `<section class="mz-drawer__section">${insight}${vsMineSection(p)}</section>`);

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
    if (S._openPortfolio) { S.drawer = { type: 'detail', name: S._openPortfolio }; S._openPortfolio = null; renderDrawer(); renderList(); }
  }

  /* ---------------------------------------------------------------- events (delegated) */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-panel-tab],[data-tab],[data-sub],[data-tf],[data-rail],[data-nav],[data-lang],[data-theme-pick],[data-star],[data-select],[data-holding],[data-row],[data-chip],[data-open-stock],[data-follow],#langToggle,#themeToggle,#sortBtn,#filterBtn,#compareBtn,#whyBtn,#drawerClose,#drawerBack,#clearChips,#trayOpen,#bellBtn,#myImportBtn,#mySampleBtn,#myClearBtn');
    if (!el) { if (S.openMenu) { S.openMenu = null; closeMenus(); } return; }
    const has = (a) => el.hasAttribute(a) || el.id === a;

    if (el.dataset.panelTab) { if (S.drawer) { S.drawer.panelTab = el.dataset.panelTab; renderDrawer(); } return; }
    if (el.dataset.tab) { S.tab = el.dataset.tab; go('/' + el.dataset.tab); return; }
    if (el.dataset.nav) { e.preventDefault(); S.tab = el.dataset.nav; go('/' + el.dataset.nav); return; }
    if (el.dataset.rail !== undefined && el.dataset.rail) { e.preventDefault(); go('/' + el.dataset.rail); return; }
    if (el.dataset.sub) { if (S.tab === 'portfolios') S.pMetric = el.dataset.sub; else S.sMetric = el.dataset.sub; S.drawer = null; render(); return; }
    if (el.dataset.tf) { S.tf = el.dataset.tf; render(); return; }
    if (el.id === 'bellBtn') { go('/alerts'); return; }
    if (el.id === 'themeToggle' || el.dataset.themePick) { THEME = el.dataset.themePick || (THEME === 'light' ? 'dark' : 'light'); document.documentElement.dataset.theme = THEME; try { localStorage.setItem('mz_theme', THEME); } catch (e) { /* private mode */ } render(); return; }
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
    if (el.dataset.holding != null) { e.stopPropagation(); if (S.drawer) { S.drawer.chartTicker = S.drawer.chartTicker === el.dataset.holding ? null : el.dataset.holding; renderDrawer(); } return; }
    if (el.id === 'myImportBtn') { const ta = document.getElementById('myHoldingsInput'); const parsed = parseHoldings(ta ? ta.value : ''); if (parsed.length) { S.myHoldings = parsed; saveMyHoldings(); render(); } return; }
    if (el.id === 'mySampleBtn') { S.myHoldings = MY_SAMPLE.slice(); saveMyHoldings(); render(); return; }
    if (el.id === 'myClearBtn') { S.myHoldings = []; saveMyHoldings(); render(); return; }
    if (el.id === 'drawerClose' || el.id === 'drawerBack') { closeDrawer(); return; }
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { S.openMenu = null; closeMenus(); closeDrawer(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-row], [data-holding]')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'portfolioSort') { S.pMetric = e.target.value; render(); }
    if (e.target.id === 'portfolioStatus') { S.compliance = e.target.value; render(); }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'portfolioSearch') { S.query = e.target.value; document.getElementById('search').value = S.query; renderList(); } });
  document.getElementById('search').addEventListener('input', (e) => { S.query = e.target.value; const local = document.getElementById('portfolioSearch'); if (local) local.value = S.query; renderList(); });
  document.getElementById('scrim').addEventListener('click', closeDrawer);

  // Close a drawer and, if we're on a detail route, return to the tab's list URL.
  function closeDrawer() {
    S.drawer = null;
    const p = location.protocol === 'file:' ? location.hash.slice(1) : location.pathname;
    if (p.startsWith('/stock/')) setPath('/stocks');
    else if (p.startsWith('/portfolio/')) setPath('/portfolios');
    renderDrawer(); renderList();
  }

  function toggleFollow(id) {
    const portfolio = derivePortfolios(S.rows).find((p) => p.name === id);
    if (portfolio && portfolio.holdings < MIN_HOLDINGS) return;
    S.follows.has(id) ? S.follows.delete(id) : S.follows.add(id);
  }
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
        <button data-fc="all" aria-selected="${S.compliance === 'all'}">${t('f.all')}</button>
        <button data-fc="fully" aria-selected="${S.compliance === 'fully'}">${t('f.fully')}</button>
        <button data-fc="exclude" aria-selected="${S.compliance === 'exclude'}">${t('f.exclude')}</button>
        ${!isP ? `<div style="border-top:var(--mz-border);margin:.35rem 0"></div>${['all', 'high', 'medium', 'low'].map((k) => `<button data-fe="${k}" aria-selected="${S.evFilter === k}">${k === 'all' ? t('f.evAll') : t('ev.' + k) + ' ' + t('h.evidence').toLowerCase()}</button>`).join('')}` : ''}
        <div style="border-top:var(--mz-border);margin:.35rem 0"></div>
        <button data-fo="1" aria-selected="${S.followedOnly}">${t('tab.following')}${LANG === 'ar' ? ' فقط' : ' only'}</button>
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

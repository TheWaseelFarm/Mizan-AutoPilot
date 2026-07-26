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
      'p.title': 'Portfolio intelligence', 'p.sub': 'Compare disclosed portfolios through performance, activity and Sharia exposure.',
      's.title': 'Stock intelligence', 's.sub': 'Explore disclosed activity with evidence and Sharia context.',
      'sv.top': 'Top performers', 'sv.active': 'Most active', 'sv.followed': 'Most followed', 'sv.alloc': 'Highest compliant allocation', 'sv.conc': 'Most concentrated', 'sv.lag': 'Fastest to disclose',
      'so.conc': 'Concentration (HHI)', 'so.lag': 'Disclosure lag',
      'sv.bought': 'Most bought', 'sv.sold': 'Most sold', 'sv.flow': 'Net flow', 'sv.new': 'New positions', 'sv.incr': 'Increased', 'sv.red': 'Reduced', 'sv.exit': 'Exited',
      'so.net': 'Absolute net flow', 'flow.note': 'Net flow = gross buying − gross selling over the disclosed window. Non-compliant names stay visible for market awareness but are never actionable. Informational only — not advice.',
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
      'common.follow': 'Follow', 'common.following': 'Following', 'common.watch': 'Watch',
      'dtl.portfolio': 'Portfolio', 'dtl.stock': 'Stock', 'dtl.return': 'Disclosed return', 'dtl.returnSub': 'Disclosed-holdings performance',
      'dtl.pending': 'Pending', 'dtl.pendingSub': 'Not enough price history yet', 'dtl.attention': 'Attention',
      'dtl.followers': 'followers', 'dtl.disclosures': 'disclosures', 'dtl.buyers': 'filers buying', 'dtl.filers': 'total filers',
      'dtl.perf': 'Performance', 'dtl.holdings': 'Top holdings', 'dtl.who': 'Who bought & sold', 'dtl.activity': 'Activity log',
      'dtl.nojudge': 'Not enough data yet to judge.', 'dtl.evNote': 'Disclosed-holdings evidence, delayed by filing lag (up to 45 days). Informational only — not advice or a recommendation to follow.',
      'dtl.compNote': 'Compliance is shown as a label (AAOIFI Standard No. 21). Screening is a filter you apply elsewhere — it does not change the performance shown.',
      'sec.methodology': 'Methodology', 'sec.mtext': 'Screening follows AAOIFI Shariah Standard No. 21 — the current "30/30/5" rule. Two screens, both required: (1) permissible business activity, and (2) financial ratios vs. market capitalization — interest-bearing debt < 30%, cash + interest-bearing securities < 30%, and non-permissible income < 5% of revenue. Over any limit is Non-compliant. Some impure income (0–5%) is Compliant · purify — you purify that share of dividends. (The 33% figure used by some index providers is not AAOIFI.)',
    },
    ar: {
      'tab.portfolios': 'المحافظ', 'tab.stocks': 'الأسهم', 'tab.following': 'المتابَعون', 'tab.alerts': 'التنبيهات', 'tab.account': 'الحساب',
      'p.title': 'ذكاء المحافظ', 'p.sub': 'قارن المحافظ المُفصَح عنها من حيث الأداء والنشاط والالتزام الشرعي.',
      's.title': 'ذكاء الأسهم', 's.sub': 'استكشف النشاط المُفصَح عنه مع الأدلة والسياق الشرعي.',
      'sv.top': 'الأفضل أداءً', 'sv.active': 'الأكثر نشاطًا', 'sv.followed': 'الأكثر متابعة', 'sv.alloc': 'أعلى تخصيص متوافق', 'sv.conc': 'الأكثر تركيزًا', 'sv.lag': 'الأسرع إفصاحًا',
      'so.conc': 'التركيز (HHI)', 'so.lag': 'زمن الإفصاح',
      'sv.bought': 'الأكثر شراءً', 'sv.sold': 'الأكثر بيعًا', 'sv.flow': 'صافي التدفق', 'sv.new': 'مراكز جديدة', 'sv.incr': 'زيادة', 'sv.red': 'تخفيض', 'sv.exit': 'خروج',
      'so.net': 'صافي التدفق المطلق', 'flow.note': 'صافي التدفق = إجمالي الشراء − إجمالي البيع خلال نافذة الإفصاح. تبقى الأسماء غير المتوافقة ظاهرة للوعي بالسوق لكنها غير قابلة للتنفيذ. لأغراض معلوماتية فقط — ليست نصيحة.',
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
      'common.follow': 'متابعة', 'common.following': 'تتابعه', 'common.watch': 'مراقبة',
      'dtl.portfolio': 'المحفظة', 'dtl.stock': 'السهم', 'dtl.return': 'العائد المُفصَح', 'dtl.returnSub': 'أداء الحيازات المُفصَح عنها',
      'dtl.pending': 'قيد الانتظار', 'dtl.pendingSub': 'لا يوجد سجل أسعار كافٍ بعد', 'dtl.attention': 'الاهتمام',
      'dtl.followers': 'متابِع', 'dtl.disclosures': 'إفصاح', 'dtl.buyers': 'جهة تشتري', 'dtl.filers': 'إجمالي المُفصِحين',
      'dtl.perf': 'الأداء', 'dtl.holdings': 'أهم الحيازات', 'dtl.who': 'مَن اشترى وباع', 'dtl.activity': 'سجل النشاط',
      'dtl.nojudge': 'لا توجد بيانات كافية للحكم بعد.', 'dtl.evNote': 'أدلة الحيازات المُفصَح عنها، متأخرة بزمن الإفصاح (حتى 45 يومًا). لأغراض معلوماتية فقط — ليست نصيحة أو توصية بالمتابعة.',
      'dtl.compNote': 'يُعرض الالتزام كوسم (معيار AAOIFI رقم 21). الفحص مرشِّح تطبّقه في مكان آخر — ولا يغيّر الأداء المعروض.',
      'sec.methodology': 'المنهجية', 'sec.mtext': 'يتبع الفحص معيار AAOIFI الشرعي رقم 21 — قاعدة «30/30/5» الحالية. فحصان، كلاهما مطلوب: (1) نشاط تجاري مباح، و(2) نسب مالية إلى القيمة السوقية — الدين بفائدة < 30%، والنقد والأوراق ذات الفائدة < 30%، والدخل غير المباح < 5% من الإيراد. تجاوز أي حد = غير متوافق. دخل غير نقي يسير (0–5%) = متوافق · تطهير. (نسبة 33% لدى بعض مزوّدي المؤشرات ليست من AAOIFI.)',
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
      p.hhi = concentration(p); // Herfindahl concentration of ownable holdings (0–1)
      const lags = p.rows.map((r) => daysBetween(r.transactionDate, r.filingDate)).filter((x) => x != null);
      p.avgLag = lags.length ? Math.round(lags.reduce((a, b) => a + b, 0) / lags.length) : null; // avg filing lag (days)
    }
    return [...m.values()];
  }
  const portfolioFlag = (p) => p.mix.fail > 0 ? { text: 'Contains non-compliant names', tone: 'fail' } : p.mix.purify > 0 ? { text: `Mostly compliant · ${p.mix.purify} to purify`, tone: 'purify' } : { text: 'Fully compliant', tone: 'clean' };

  /* --- Decision-support synthesis: turn the raw disclosures into a plain-language "read" +
     scannable signal tags, so a user can judge a setup at a glance instead of parsing columns. */
  const sideUp = (s) => String(s).toUpperCase() !== 'SELL';
  const signalChip = (text, tone) => `<span class="mz-signal" data-tone="${tone || 'muted'}">${esc(text)}</span>`;
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
    if (flag.tone === 'clean') tags.push(['Fully compliant', 'up']);
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
  // Real, deterministic rank of a portfolio by disclosed return (nulls excluded — never invented).
  function returnRank(name) {
    const ranked = derivePortfolios(S.rows).filter((p) => p.perf != null && isFinite(p.perf)).sort((a, b) => b.perf - a.perf);
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
  function detailHero(who, headline, perf, statsHtml) {
    const ret = (perf == null || !isFinite(perf))
      ? `<div class="mz-dtl-big mz-dtl-neutral">${t('dtl.pending')}</div><div class="mz-dtl-sub">${t('dtl.pendingSub')}</div>`
      : `<div class="mz-dtl-big" data-up="${perf >= 0}">${perf >= 0 ? '▲' : '▼'} ${Math.abs(perf).toFixed(1)}%</div><div class="mz-dtl-sub">${t('dtl.returnSub')}</div>`;
    return `<div class="mz-drawer__section">
      <div class="mz-dtl-who"><span class="mz-entity__avatar">${who.avatar}</span><div style="min-width:0"><div class="mz-dtl-name${who.ltr ? ' mz-ltr' : ''}">${esc(who.name)}</div><div class="mz-dtl-whosub">${esc(who.sub)}</div></div></div>
      <p class="mz-dtl-headline">${esc(headline)}</p>
      <div class="mz-dtl-heros">
        <div class="mz-dtl-card"><div class="mz-dtl-lab">${t('dtl.return')}</div>${ret}</div>
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
      return { ...s, filerCount: s.filers.size, perf: perfs.length ? +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(1) : null };
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

  /* ---------------------------------------------------------------- state */
  const S = {
    tab: 'portfolios', pMetric: 'top', sMetric: 'bought', tf: 'ALL', query: '',
    compliance: 'all', evFilter: 'all', followedOnly: false, compareMode: false,
    selected: [], follows: new Set(), drawer: null, // {type:'compare'|'evidence'|'detail', ...}
    openMenu: null, rows: SAMPLE, live: false, prices: {}, followerCounts: {},
  };
  const P_SUB = [['top', 'sv.top'], ['active', 'sv.active'], ['followed', 'sv.followed'], ['alloc', 'sv.alloc'], ['conc', 'sv.conc'], ['lag', 'sv.lag']];
  const S_SUB = [['bought', 'sv.bought', 'BUY', 'value'], ['sold', 'sv.sold', 'SELL', 'value'], ['flow', 'sv.flow', '', 'net'], ['new', 'sv.new', 'BUY', 'filers'], ['incr', 'sv.incr', 'BUY', 'weight'], ['red', 'sv.red', 'SELL', 'weight'], ['exit', 'sv.exit', 'SELL', 'filers']];
  const P_SORT = { top: 'so.return', active: 'so.activity', followed: 'so.followers', alloc: 'so.alloc', conc: 'so.conc', lag: 'so.lag' };
  const S_SORT = { value: 'so.value', weight: 'so.weight', filers: 'so.filers', net: 'so.net' };
  const TFS = [['1W', '1W'], ['1M', '1M'], ['3M', '3M'], ['6M', '6M'], ['1Y', '1Y'], ['3Y', '3Y'], ['5Y', '5Y'], ['ALL', 'All']];

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
    const [feed, prices, followers] = await Promise.allSettled([j('/api/feed?performance=1'), j('/api/prices'), j('/api/follower-counts')]);
    if (feed.status === 'fulfilled' && Array.isArray(feed.value) && feed.value.length) {
      S.rows = feed.value.map((r) => ({ ...r, label: r.label || labelOf(r) }));
      S.live = true;
    }
    if (prices.status === 'fulfilled' && prices.value && typeof prices.value === 'object') S.prices = prices.value;
    if (followers.status === 'fulfilled' && followers.value && typeof followers.value === 'object') S.followerCounts = followers.value;
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
      const cmp = {
        top: (a, b) => (b.perf ?? -1e9) - (a.perf ?? -1e9),
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
    return `<div class="mz-allocation"><div class="mz-allocation__bar">${seg('clean', 'compliant')}${seg('purify', 'purify')}${seg('fail', 'noncompliant')}</div><div class="mz-allocation__legend">${pct('clean')}${pct('purify')}${pct('fail')}</div></div>`;
  };
  const freshEl = (d) => d == null ? '<span class="mz-muted">—</span>' : `<span class="mz-fresh" data-fresh="${d <= 30}">${I.clock}${d}d · ${d <= 30 ? 'Fresh' : d <= 75 ? 'Recent' : 'Aging'}</span>`;
  // avatarHtml + metaHtml are trusted HTML built by callers (they escape their own text).
  const entity = (avatarHtml, name, metaHtml, nameLtr) => `<div class="mz-entity"><span class="mz-entity__avatar">${avatarHtml}</span><div><div class="mz-entity__name${nameLtr ? ' mz-ltr' : ''}">${esc(name)}</div><div class="mz-entity__meta">${metaHtml}</div></div></div>`;
  const miniIcon = (svg) => `<span style="width:.9rem;height:.9rem;display:inline-flex">${svg}</span>`;
  const perfCell = (v) => v == null ? '<span class="mz-muted">—</span>' : `<span class="mz-performance">${fmtPct(v)}</span>`;
  // Performance HERO — the primary signal (performance-led hierarchy). Cobalt up / neutral-ink
  // down with a caret; deliberately NOT a Sharia hue, so it never reads as a verdict.
  const perfHero = (v) => v == null
    ? '<span class="mz-muted" style="font-size:var(--mz-text-lg)">—</span>'
    : `<span class="mz-perf-hero" data-up="${v >= 0}">${v >= 0 ? I.caretUp : I.caretDown}${fmtPct(v)}</span>`;
  // Compact compliance tag — small pill, no longer the loud hero (performance-led).
  const compliancePill = (tone) => { const cls = tone === 'clean' ? 'compliant' : tone === 'purify' ? 'purify' : 'noncompliant'; const short = tone === 'clean' ? t('v.compliant') : tone === 'purify' ? t('v.purify') : t('v.noncompliant'); return `<span class="mz-badge mz-badge--${cls}" style="min-height:1.4rem;font-size:.65rem">${short}</span>`; };
  const starBtn = (id) => `<button class="mz-star" data-star="${esc(id)}" data-on="${S.follows.has(id)}" aria-label="Follow">${S.follows.has(id) ? I.starOn : I.star}</button>`;

  /* ============ ONE shared, interactive chart component — used by EVERY chart ============
     Global consistency rule (CLAUDE.md): every chart in the app is this component. Same
     behavior everywhere — scrub (touch/pointer) reveals value + date, respects the active
     timeframe (1W…All), neutral cobalt/ink only (never a verdict hue), graceful empty state. */
  const chartPath = (v, W, H, mn, mx) => { const r = (mx - mn) || 1; return v.map((y, i) => `${(i / (v.length - 1) * W).toFixed(2)},${(H - (y - mn) / r * H).toFixed(2)}`).join(' '); };
  const histOf = (ticker) => ((S.prices[ticker] && S.prices[ticker].history) || []).filter((p) => p && isFinite(+p.c));
  const TF_DAYS_ALL = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825, ALL: Infinity };
  const sliceTf = (hist) => { const n = TF_DAYS_ALL[S.tf] ?? Infinity; return (n === Infinity || hist.length <= n) ? hist : hist.slice(-Math.max(2, Math.round(n))); };
  const shortDate = (d) => { const ms = Date.parse(d); if (!isFinite(ms)) return d || ''; return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  const seriesReturn = (v) => v && v.length >= 2 ? (v[v.length - 1] / v[0] - 1) * 100 : null;

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

  // THE shared chart. `hist` = [{d,c}]. opts: { cls: 'mz-chart--full|--card|--spark', compare:[{d,c}], empty }.
  function chart(hist, opts) {
    opts = opts || {};
    const cls = opts.cls || 'mz-chart--full';
    const h = cls === 'mz-chart--spark' ? 28 : cls === 'mz-chart--card' ? 40 : 120;
    const data = (hist || []).filter((p) => p && isFinite(+p.c));
    if (data.length < 2) return `<div class="mz-chart ${cls} mz-chart__empty" style="height:${h}px">${opts.empty || '—'}</div>`;
    const closes = data.map((p) => +p.c), mn = Math.min(...closes), mx = Math.max(...closes);
    const W = 320, H = 100, sw = cls === 'mz-chart--full' ? 1.7 : 1.4;
    const line = `<polyline points="${chartPath(closes, W, H, mn, mx)}" fill="none" stroke="var(--mz-cobalt-600)" stroke-width="${sw}" stroke-linejoin="round"/>`;
    let cmp = '';
    if (opts.compare) { const c2 = (opts.compare || []).filter((p) => p && isFinite(+p.c)).map((p) => +p.c); if (c2.length >= 2) cmp = `<polyline points="${chartPath(c2, W, H, mn, mx)}" fill="none" stroke="var(--mz-ink-400)" stroke-width="1.2" stroke-dasharray="3 3"/>`; }
    const series = esc(JSON.stringify(data.map((p) => [p.d, +p.c])));
    return `<div class="mz-chart ${cls}" data-series="${series}" data-min="${mn}" data-max="${mx}" style="height:${h}px"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${cmp}${line}</svg><span class="mz-chart__cx"></span><span class="mz-chart__dot"></span></div>`;
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
    chartTip.textContent = `$${c.toFixed(2)} · ${shortDate(d)}`;
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
      // Performance-led: Return is the hero column (2nd), compliance is a compact tag near the end.
      thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.portfolio')}</th><th>${t('h.return')}</th><th>${t('h.activity')}</th><th>${t('h.freshness')}</th><th>${LANG === 'ar' ? 'الالتزام' : 'Compliance'}</th><th>${t('h.followers')}</th></tr>`;
      tbody.innerHTML = list.map((p, i) => {
        const flag = portfolioFlag(p), sel = S.selected.includes(p.name);
        const first = S.compareMode ? `<button class="mz-check-btn" data-select="${esc(p.name)}" data-on="${sel}" aria-label="Select">${sel ? I.check : ''}</button>` : `<span class="mz-rank">${i + 1}</span>`;
        const av = `<span style="color:var(--mz-cobalt-700);font-weight:800;font-size:.8rem">${esc(p.initials)}</span>`;
        const tags = portfolioRead(p).tags.slice(0, 2);
        const meta = `<span style="display:inline-flex;gap:.4rem;align-items:center;flex-wrap:wrap">${miniIcon(groupIcon(p.group))}${esc(typeLabel(p.kind))}${signalRow(tags)}</span>`;
        return `<tr data-row="portfolio" data-id="${esc(p.name)}" data-selected="${sel}"><td>${first}</td><td>${entity(av, p.name, meta)}</td><td><div class="mz-perf-cell">${perfHero(p.perf)}${chart(sliceTf(portfolioIndexHist(p.rows)), { cls: 'mz-chart--spark' })}</div></td><td class="mz-cell-num">${p.count}</td><td>${freshEl(p.fresh)}</td><td>${compliancePill(flag.tone)}</td><td>${starBtn(p.name)}</td></tr>`;
      }).join('') || emptyRow(7);
      cards.innerHTML = list.map((p, i) => portfolioCard(p, i)).join('');
    } else if (S.sMetric === 'flow') {
      renderFlowBoard(list, thead, tbody, cards);
    } else {
      // Performance-led: Since-disclosed return is the hero column (3rd); status is a compact badge.
      thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.stock')}</th><th>${t('h.since')}</th><th>${t('h.signal')}</th><th>${t('h.evidence')}</th><th>${t('h.filers')}</th><th>${t('h.value')}</th><th>${t('h.status')}</th></tr>`;
      const signal = { bought: 'Accumulation', sold: 'Reduction', new: 'New position', incr: 'Position increased', red: 'Position reduced', exit: 'Exited' }[S.sMetric];
      tbody.innerHTML = list.map((s, i) => `<tr data-row="stock" data-id="${esc(s.ticker)}"><td><span class="mz-rank">${i + 1}</span></td><td>${entity(`<span class="mz-ltr" style="font-weight:800;font-size:.72rem">${esc(s.ticker.slice(0, 4))}</span>`, s.ticker, `${esc(s.company)}${s.fresh != null ? ` · ${s.fresh}d` : ''}`, true)}</td><td><div class="mz-perf-cell">${perfHero(s.perf)}${chart(sliceTf(histOf(s.ticker)), { cls: 'mz-chart--spark' })}</div></td><td><div class="mz-muted" style="margin-block-end:.2rem">${signal}</div>${signalRow(stockRead(s.ticker).tags.slice(0, 1))}</td><td style="font-weight:700">${t('ev.' + evStrength(s.filerCount))}</td><td class="mz-cell-num">${s.filerCount}</td><td class="mz-cell-num" style="font-weight:750">${fmtMoney(s.dollar)}</td><td>${badge(s.label)}</td></tr>`).join('') || emptyRow(8);
      cards.innerHTML = list.map((s, i) => stockCard(s, i)).join('');
    }
  }

  // Net-flow board — the diverging gross-buy vs gross-sell visualization (Smart Money).
  function renderFlowBoard(list, thead, tbody, cards) {
    const scale = Math.max(1, ...list.map((f) => Math.max(f.buy, f.sell)));
    const netCell = (f) => { const up = f.net >= 0; return `<span class="mz-perf-hero" data-up="${up}" style="font-size:var(--mz-text-md)">${up ? I.caretUp : I.caretDown}${fmtMoney(Math.abs(f.net))}</span>`; };
    const tickerCell = (f) => { const bad = f.label === 'fail'; return entity(`<span class="mz-ltr" style="font-weight:800;font-size:.72rem${bad ? ';text-decoration:line-through' : ''}">${esc(f.ticker.slice(0, 4))}</span>`, f.ticker, `${esc(f.company)}${f.fresh != null ? ` · ${f.fresh}d` : ''}`, true); };
    thead.innerHTML = `<tr><th>${t('h.rank')}</th><th>${t('h.stock')}</th><th>${LANG === 'ar' ? 'صافي التدفق' : 'Net flow'}</th><th>${LANG === 'ar' ? 'صافي' : 'Net'}</th><th>${LANG === 'ar' ? 'إجمالي' : 'Gross'}</th><th>${t('h.filers')}</th><th>${t('h.status')}</th></tr>`;
    tbody.innerHTML = list.map((f, i) => `<tr data-row="stock" data-id="${esc(f.ticker)}"${f.label === 'fail' ? ' style="opacity:.85"' : ''}><td><span class="mz-rank">${i + 1}</span></td><td>${tickerCell(f)}</td><td style="min-width:14rem">${netFlowBar(f, scale)}<div style="display:flex;justify-content:space-between;margin-block-start:.25rem;font-size:var(--mz-text-xs)" class="mz-muted"><span>${LANG === 'ar' ? 'بيع' : 'sold'} ${fmtMoney(f.sell)}</span><span>${LANG === 'ar' ? 'شراء' : 'bought'} ${fmtMoney(f.buy)}</span></div></td><td>${netCell(f)}</td><td class="mz-cell-num mz-muted">${fmtMoney(f.gross)}</td><td class="mz-cell-num">${f.filerCount}</td><td>${badge(f.label)}</td></tr>`).join('') || emptyRow(7);
    cards.innerHTML = list.map((f, i) => `<article class="mz-stock-card" data-row="stock" data-id="${esc(f.ticker)}"${f.label === 'fail' ? ' style="opacity:.85"' : ''}><div style="display:flex;gap:.75rem;align-items:center"><span class="mz-rank">${i + 1}</span><div style="flex:1;min-width:0"><div class="mz-entity__name mz-ltr"${f.label === 'fail' ? ' style="text-decoration:line-through"' : ''}>${esc(f.ticker)}</div><div class="mz-entity__meta">${esc(f.company)}</div></div><div style="text-align:end">${netCell(f)}</div></div><div style="margin-block-start:.6rem">${netFlowBar(f, scale)}</div><div style="display:flex;justify-content:space-between;margin-block-start:.5rem;gap:.5rem;align-items:center">${badge(f.label)}<span class="mz-muted" style="font-size:var(--mz-text-xs)">${LANG === 'ar' ? 'بيع' : 'sold'} ${fmtMoney(f.sell)} · ${LANG === 'ar' ? 'شراء' : 'bought'} ${fmtMoney(f.buy)}</span></div></article>`).join('');
    // Add a note that non-compliant names are visible but blocked from screening.
    document.getElementById('guardrail').textContent = t('flow.note');
  }
  function netFlowBar(f, scale) {
    const half = 50;
    const bw = Math.min(1, f.buy / scale) * half, sw = Math.min(1, f.sell / scale) * half, nw = Math.min(1, Math.abs(f.net) / scale) * half;
    const muted = f.label === 'fail' ? 'opacity:.55;' : '';
    return `<div class="mz-flow-bar"><span class="mz-flow-axis"></span><span class="mz-flow-sell" style="width:${sw}%;${muted}"></span><span class="mz-flow-buy" style="width:${bw}%;${muted}"></span><span class="mz-flow-zero"></span>${Math.abs(f.net) > 0 ? `<span class="mz-flow-net" style="${f.net >= 0 ? `inset-inline-start:calc(50% + ${nw}%)` : `inset-inline-start:calc(50% - ${nw}%)`}"></span>` : ''}</div>`;
  }
  const emptyRow = (cols) => `<tr><td colspan="${cols}"><div class="mz-state"><div class="mz-state__content"><h3>${t('empty.title')}</h3><p class="mz-muted">${t('empty.body')}</p></div></div></td></tr>`;

  function portfolioCard(p, i) {
    const flag = portfolioFlag(p), sel = S.selected.includes(p.name);
    return `<article class="mz-portfolio-card" data-row="portfolio" data-id="${esc(p.name)}" data-selected="${sel}">
      <div style="display:flex;gap:.75rem;align-items:center">
        ${S.compareMode ? `<button class="mz-check-btn" data-select="${esc(p.name)}" data-on="${sel}">${sel ? I.check : ''}</button>` : `<span class="mz-rank">${i + 1}</span>`}
        <span class="mz-entity__avatar"><span style="color:var(--mz-cobalt-700);font-weight:800">${esc(p.initials)}</span></span>
        <div style="flex:1;min-width:0"><div class="mz-entity__name">${esc(p.name)}</div><div class="mz-entity__meta">${esc(typeLabel(p.kind))}${p.fresh != null ? ` · ${p.fresh}d` : ''}</div></div>
        <div style="text-align:end">${perfHero(p.perf)}</div>
      </div>
      <div style="margin-block-start:.65rem">${chart(sliceTf(portfolioIndexHist(p.rows)), { cls: 'mz-chart--card' })}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-block-start:.6rem;gap:.5rem">
        ${compliancePill(flag.tone)}
        <span class="mz-muted" style="font-size:var(--mz-text-xs)">${p.count} ${LANG === 'ar' ? 'إفصاح' : 'disclosures'} · ${starBtn(p.name)}</span>
      </div>
    </article>`;
  }
  function stockCard(s, i) {
    return `<article class="mz-stock-card" data-row="stock" data-id="${esc(s.ticker)}">
      <div style="display:flex;gap:.75rem;align-items:center">
        <span class="mz-rank">${i + 1}</span>
        <div style="flex:1;min-width:0"><div class="mz-entity__name mz-ltr">${esc(s.ticker)}</div><div class="mz-entity__meta">${esc(s.company)}${s.fresh != null ? ` · ${s.fresh}d` : ''}</div></div>
        <div style="text-align:end">${perfHero(s.perf)}</div>
      </div>
      <div style="margin-block-start:.6rem">${chart(sliceTf(histOf(s.ticker)), { cls: 'mz-chart--card' })}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-block-start:.6rem;gap:.5rem">
        ${badge(s.label)}
        <span class="mz-muted" style="font-size:var(--mz-text-xs)">${t('ev.' + evStrength(s.filerCount))} · ${s.filerCount} ${LANG === 'ar' ? 'مُفصِح' : 'filers'} · ${fmtMoney(s.dollar)}</span>
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
    const back = opts.back ? `<button class="mz-button mz-button--icon" id="drawerBack" aria-label="${LANG === 'ar' ? 'رجوع' : 'Back'}" style="min-height:2.25rem;width:2.25rem">${backIcon}</button>` : '';
    return `<div class="mz-drawer__header"><div class="mz-drawer__title" style="gap:.4rem">${back}<h3 style="margin:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</h3>${opts.tag ? `<span style="flex:0 0 auto">${opts.tag}</span>` : ''}<button class="mz-button mz-button--icon" id="drawerClose" aria-label="Close" style="min-height:2.25rem;width:2.25rem">${I.close}</button></div></div>`;
  }

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
    if (!rows.length) return drawerHead(ticker, { back: true });
    const filers = new Set(rows.map((r) => r.actor)).size;
    const buyers = new Set(rows.filter((r) => sideUp(r.side)).map((r) => r.actor)).size;
    const fresh = Math.min(...rows.map((r) => daysSince(r.filingDate) ?? 999));
    const label = rows[0].label;
    const perfs = rows.map((r) => r.performance && r.performance.sinceDisclosed).filter((x) => x != null && isFinite(x));
    const perf = perfs.length ? +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(1) : null;
    const headline = composeHeadline(perf, { hasActivity: true, buyers, active: filers >= 3 });
    // Attraction: filers buying is the real signal; a public follower count only shows when meaningful.
    const stats = dtlStat(buyers, t('dtl.buyers')) + dtlStat(filers, t('dtl.filers')) + dtlStat(fresh <= 900 ? fresh + 'd' : '—', LANG === 'ar' ? 'منذ آخر إفصاح' : 'since last filing');
    // Who bought & sold — the disclosure log, newest-value first.
    const log = [...rows].sort((a, b) => (+b.amountMid || 0) - (+a.amountMid || 0)).slice(0, 6);
    const following = S.follows.has(ticker);
    const who = { avatar: `<span class="mz-ltr" style="font-weight:800;font-size:.72rem">${esc(ticker.slice(0, 4))}</span>`, name: ticker, sub: rows[0].company || ticker, ltr: true };
    return drawerHead(t('dtl.stock'), { back: true, tag: badge(label) }) +
      detailHero(who, headline, perf, stats) +
      `<div class="mz-drawer__section"><div style="display:flex;align-items:baseline;justify-content:space-between;margin-block-end:.5rem"><span class="mz-cmp-metric__label">${t('dtl.perf')}</span>${perf != null ? `<span class="mz-performance">${fmtPct(perf)} ${t('h.since').toLowerCase()}</span>` : ''}</div>${chart(sliceTf(histOf(ticker)), { empty: t('dtl.pending') })}</div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('dtl.who')}</div>${log.map((r) => { const sell = String(r.side).toUpperCase() === 'SELL'; return `<div class="mz-hold"><div class="mz-hold__n"><div style="font-weight:700">${esc(r.actor)}</div><div class="mz-entity__meta">${sell ? (LANG === 'ar' ? 'باع' : 'Sold') : (LANG === 'ar' ? 'اشترى' : 'Bought')} · ${esc(r.source || r.kind || '')}</div></div><span class="mz-badge mz-badge--${sell ? 'noncompliant' : 'compliant'}" style="min-height:1.3rem">${sell ? (LANG === 'ar' ? 'باع' : 'Sold') : (LANG === 'ar' ? 'اشترى' : 'Bought')}</span><span class="mz-cell-num" style="font-weight:750;margin-inline-start:.5rem">${fmtMoney(+r.amountMid || 0)}</span></div>`; }).join('')}</div>` +
      `<p class="mz-drawer__section mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;padding-block:0">${t('dtl.compNote')} ${t('dtl.evNote')}</p>` +
      `<div class="mz-drawer__footer" style="display:grid;grid-template-columns:1fr auto;gap:.5rem"><button class="mz-button mz-button--primary" data-follow="${esc(ticker)}">${following ? I.starOn : I.star}${following ? t('common.following') : t('common.follow')}</button><button class="mz-button mz-button--ghost" data-nav="alerts">${I.bell}${t('common.watch')}</button></div>`;
  }
  function portfolioDrawer(name) {
    const p = derivePortfolios(S.rows).find((x) => x.name === name); if (!p) return drawerHead(esc(name), { back: true });
    const flag = portfolioFlag(p);
    const fc = followerCountOf(name), rk = returnRank(name);
    const headline = composeHeadline(p.perf, { hasActivity: p.count > 0, active: p.count >= 5, quiet: p.count > 0 && p.count < 3, wellFollowed: fc != null && fc >= 100 });
    // Attraction: rank + disclosures are real; a public follower count only shows once meaningful.
    const stats = dtlStat(fc != null ? fc.toLocaleString() : '—', t('dtl.followers')) +
      dtlStat(rk ? '#' + rk.rank : '—', rk ? (LANG === 'ar' ? `من ${rk.total} بالعائد` : `of ${rk.total} by return`) : (LANG === 'ar' ? 'الترتيب' : 'rank')) +
      dtlStat(p.count, t('dtl.disclosures'));
    const compTag = compliancePill(flag.tone); // compact quiet label (full wording lives in the holdings chips)
    // Evidence: the disclosed-holdings performance — a single neutral line (compliance never
    // changes the performance shown). Timeframe-aware via sliceTf(), like every chart.
    const idxH = sliceTf(portfolioIndexHist(p.rows));
    // Top holdings, value-weighted, each with its own compliance chip + neutral price return.
    const holdings = {};
    for (const r of p.rows) { holdings[r.ticker] = holdings[r.ticker] || { ticker: r.ticker, company: r.company, label: r.label, v: 0 }; holdings[r.ticker].v += Math.abs(+r.amountMid || 0); }
    const hs = Object.values(holdings).sort((a, b) => b.v - a.v).slice(0, 6);
    // Disclosure facts — recent trades, newest first (quiet, below the conclusion).
    const acts = [...p.rows].sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || '')).slice(0, 4);
    const following = S.follows.has(name);
    const who = { avatar: `<span style="color:var(--mz-cobalt-700);font-weight:800;font-size:.8rem">${esc(p.initials)}</span>`, name, sub: `${typeLabel(p.kind)} · ${p.count} ${LANG === 'ar' ? 'إفصاح' : 'disclosures'}` };
    return drawerHead(t('dtl.portfolio'), { back: true, tag: compTag }) +
      detailHero(who, headline, p.perf, stats) +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('dtl.perf')}</div>${chart(idxH, { empty: t('dtl.pending') })}<p class="mz-muted" style="font-size:var(--mz-text-xs);margin:.5rem 0 0">${LANG === 'ar' ? 'مؤشّر متساوي الأوزان للحيازات المُفصَح عنها. أدلة، ليست نصيحة.' : 'Equal-weight index of the disclosed holdings. Evidence, not advice.'}</p></div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('dtl.holdings')}</div>${hs.map((h) => `<div class="mz-hold"><div class="mz-hold__n"><div class="mz-ltr" style="font-weight:750">${esc(h.ticker)}</div><div class="mz-entity__meta">${esc(h.company || '')}</div></div>${badge(h.label)}<span style="margin-inline-start:.5rem;min-width:3.4rem;text-align:end">${retNode(priceReturn(h.ticker))}</span></div>`).join('')}</div>` +
      `<div class="mz-drawer__section"><div class="mz-cmp-metric__label" style="margin-block-end:.5rem">${t('dtl.activity')}</div>${acts.map((r) => { const lag = daysBetween(r.transactionDate, r.filingDate); const sell = String(r.side).toUpperCase() === 'SELL'; return `<div class="mz-hold"><div class="mz-hold__n"><div class="mz-ltr" style="font-weight:700">${esc(r.ticker)}</div><div class="mz-entity__meta">${esc(r.amount || (r.amountMid ? fmtMoney(+r.amountMid) : ''))}${lag != null ? (LANG === 'ar' ? ` · أُفصح بعد ${lag}ي` : ` · filed ${lag}d later`) : ''}</div></div><span class="mz-badge mz-badge--${sell ? 'noncompliant' : 'compliant'}" style="min-height:1.3rem">${sell ? (LANG === 'ar' ? 'باع' : 'Sold') : (LANG === 'ar' ? 'اشترى' : 'Bought')}</span></div>`; }).join('')}</div>` +
      `<p class="mz-drawer__section mz-muted" style="font-size:var(--mz-text-xs);line-height:1.5;padding-block:0">${t('dtl.compNote')} ${t('dtl.evNote')}</p>` +
      `<div class="mz-drawer__footer"><button class="mz-button mz-button--secondary" style="width:100%" data-follow="${esc(name)}">${following ? I.starOn : I.star}${following ? t('common.following') : t('common.follow')}</button></div>`;
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
    const el = e.target.closest('[data-tab],[data-sub],[data-tf],[data-rail],[data-nav],[data-lang],[data-star],[data-select],[data-row],[data-chip],[data-open-stock],[data-follow],#langToggle,#sortBtn,#filterBtn,#compareBtn,#whyBtn,#drawerClose,#drawerBack,#clearChips,#trayOpen,#bellBtn');
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

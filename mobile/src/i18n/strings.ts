/**
 * Mizān UI string dictionary (English + Arabic).
 *
 * Scope: UI CHROME only — navigation, titles, controls, legend, buttons, empty states.
 * DISCLOSED DATA is never translated here: company names, tickers, filer names, amounts and
 * dates come from filings and stay as filed (handoff §9: "Do not translate company names
 * without an approved Arabic value"; keep tickers/numbers LTR).
 *
 * Arabic copy covers the chrome shipped in this pass; any key without an `ar` value falls back
 * to English via t(), so new strings degrade gracefully until translated.
 */

export type Lang = 'en' | 'ar';

export type StringKey = keyof typeof en;

export const en = {
  // Tabs / navigation
  'tab.portfolios': 'Portfolios',
  'tab.stocks': 'Stocks',
  'tab.following': 'Following',
  'tab.alerts': 'Alerts',
  'tab.account': 'Account',
  'nav.back': 'Back',

  // Screen titles
  'portfolios.title': 'Portfolio intelligence',
  'portfolios.subtitle': 'Compare disclosed portfolios by performance, activity and Sharia exposure.',
  'stocks.title': 'Stock intelligence',
  'stocks.subtitle': 'Explore disclosed activity with evidence and Sharia context.',

  // Portfolio subviews
  'sub.topPerformers': 'Top performers',
  'sub.mostActive': 'Most active',
  'sub.mostFollowed': 'Most followed',
  'sub.highestAllocation': 'Highest compliant allocation',
  // Stock subviews
  'sub.mostBought': 'Most bought',
  'sub.mostSold': 'Most sold',
  'sub.newPositions': 'New positions',
  'sub.increased': 'Increased',
  'sub.reduced': 'Reduced',
  'sub.exited': 'Exited',

  // Controls
  'ctrl.filter': 'Filter',
  'ctrl.sort': 'Sort',
  'ctrl.savedView': 'Saved view',
  'ctrl.compare': 'Compare',
  'ctrl.evidence': 'Evidence',
  'ctrl.followed': 'Followed',
  'ctrl.whyRanking': 'Why this ranking?',
  'ctrl.clearAll': 'Clear all',
  'ctrl.showAll': 'Show all',
  'ctrl.showLess': 'Show less',
  'ctrl.why': 'Why?',
  'ctrl.search': 'Search',
  'search.portfolios': 'Search a portfolio or stock',
  'search.stocks': 'Search a ticker or company',

  // Sort metrics
  'sort.disclosedReturn': 'Disclosed return',
  'sort.disclosedActivity': 'Disclosed activity',
  'sort.followers': 'Followers',
  'sort.compliantAllocation': 'Compliant allocation',
  'sort.disclosedValue': 'Disclosed value',
  'sort.positionWeight': 'Position weight',
  'sort.numberOfFilers': 'Number of filers',

  // Legend / verdicts
  'verdict.compliant': 'Compliant',
  'verdict.purify': 'Compliant · purify',
  'verdict.noncompliant': 'Non-compliant',
  'verdict.underReview': 'Under review',

  // Freshness
  'fresh.fresh': 'Fresh',
  'fresh.recent': 'Recent',
  'fresh.aging': 'Aging',

  // Evidence strength
  'ev.high': 'High',
  'ev.medium': 'Medium',
  'ev.low': 'Low',

  // Compare drawer
  'cmp.title': 'Compare portfolios',
  'cmp.disclosures': 'Disclosures',
  'cmp.compliantAllocation': 'Compliant allocation',
  'cmp.purifyExposure': 'Purify exposure',
  'cmp.followers': 'Followers',
  'cmp.selected': 'selected',
  'cmp.pickOneMore': 'pick one more',
  'cmp.compareN': 'Compare {n} portfolios',
  'cmp.note': 'All metrics use the latest disclosed filings. Not investment advice.',

  // Following / Alerts
  'following.title': 'Following',
  'following.emptyTitle': "You're not following anyone yet",
  'following.emptyBody': 'Follow portfolios on the Portfolios tab to keep them here and get alerts when they file new disclosures.',
  'alerts.title': 'Alerts',
  'alerts.emptyTitle': 'No alerts yet',
  'alerts.emptyBody': 'Follow portfolios to be notified here when they file new disclosures.',
  'alerts.caughtUp': "You're all caught up",
  'alerts.noNew': 'No new disclosures from the portfolios you follow.',

  // Account / language
  'account.language': 'Language',
  'account.languageEnglish': 'English',
  'account.languageArabic': 'العربية',

  // Misc
  'common.reviewEvidence': 'Review full evidence',
  'common.follow': 'Follow',
  'common.following': 'Following',
} as const;

export const ar: Partial<Record<StringKey, string>> = {
  'tab.portfolios': 'المحافظ',
  'tab.stocks': 'الأسهم',
  'tab.following': 'المتابَعون',
  'tab.alerts': 'التنبيهات',
  'tab.account': 'الحساب',
  'nav.back': 'رجوع',

  'portfolios.title': 'ذكاء المحافظ',
  'portfolios.subtitle': 'قارن المحافظ المُفصَح عنها حسب الأداء والنشاط والالتزام الشرعي.',
  'stocks.title': 'ذكاء الأسهم',
  'stocks.subtitle': 'استكشف النشاط المُفصَح عنه مع الأدلة والسياق الشرعي.',

  'sub.topPerformers': 'الأفضل أداءً',
  'sub.mostActive': 'الأكثر نشاطًا',
  'sub.mostFollowed': 'الأكثر متابعة',
  'sub.highestAllocation': 'أعلى تخصيص متوافق',
  'sub.mostBought': 'الأكثر شراءً',
  'sub.mostSold': 'الأكثر بيعًا',
  'sub.newPositions': 'مراكز جديدة',
  'sub.increased': 'زيادة',
  'sub.reduced': 'تخفيض',
  'sub.exited': 'خروج',

  'ctrl.filter': 'تصفية',
  'ctrl.sort': 'ترتيب',
  'ctrl.savedView': 'العرض المحفوظ',
  'ctrl.compare': 'مقارنة',
  'ctrl.evidence': 'الأدلة',
  'ctrl.followed': 'المتابَعة',
  'ctrl.whyRanking': 'لماذا هذا الترتيب؟',
  'ctrl.clearAll': 'مسح الكل',
  'ctrl.showAll': 'عرض الكل',
  'ctrl.showLess': 'عرض أقل',
  'ctrl.why': 'لماذا؟',
  'ctrl.search': 'بحث',
  'search.portfolios': 'ابحث عن محفظة أو سهم',
  'search.stocks': 'ابحث عن رمز أو شركة',

  'sort.disclosedReturn': 'العائد المُفصَح',
  'sort.disclosedActivity': 'النشاط المُفصَح',
  'sort.followers': 'المتابِعون',
  'sort.compliantAllocation': 'التخصيص المتوافق',
  'sort.disclosedValue': 'القيمة المُفصَح عنها',
  'sort.positionWeight': 'وزن المركز',
  'sort.numberOfFilers': 'عدد المُفصِحين',

  'verdict.compliant': 'متوافق',
  'verdict.purify': 'متوافق · تطهير',
  'verdict.noncompliant': 'غير متوافق',
  'verdict.underReview': 'قيد المراجعة',

  'fresh.fresh': 'حديث',
  'fresh.recent': 'قريب',
  'fresh.aging': 'قديم',

  'ev.high': 'قوي',
  'ev.medium': 'متوسط',
  'ev.low': 'ضعيف',

  'cmp.title': 'مقارنة المحافظ',
  'cmp.disclosures': 'الإفصاحات',
  'cmp.compliantAllocation': 'التخصيص المتوافق',
  'cmp.purifyExposure': 'نسبة التطهير',
  'cmp.followers': 'المتابِعون',
  'cmp.selected': 'مُحدَّد',
  'cmp.pickOneMore': 'اختر واحدة أخرى',
  'cmp.compareN': 'قارن {n} محافظ',
  'cmp.note': 'تستخدم كل المقاييس أحدث الإفصاحات. ليست نصيحة استثمارية.',

  'following.title': 'المتابَعون',
  'following.emptyTitle': 'لا تتابع أحدًا بعد',
  'following.emptyBody': 'تابِع المحافظ من تبويب المحافظ لإبقائها هنا وتلقّي التنبيهات عند نشر إفصاحات جديدة.',
  'alerts.title': 'التنبيهات',
  'alerts.emptyTitle': 'لا توجد تنبيهات بعد',
  'alerts.emptyBody': 'تابِع المحافظ لتصلك التنبيهات هنا عند نشر إفصاحات جديدة.',
  'alerts.caughtUp': 'أنت مُطّلع على كل شيء',
  'alerts.noNew': 'لا إفصاحات جديدة من المحافظ التي تتابعها.',

  'account.language': 'اللغة',
  'account.languageEnglish': 'English',
  'account.languageArabic': 'العربية',

  'common.reviewEvidence': 'مراجعة كل الأدلة',
  'common.follow': 'متابعة',
  'common.following': 'متابَع',
};

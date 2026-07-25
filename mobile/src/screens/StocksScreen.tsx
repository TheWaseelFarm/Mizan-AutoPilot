import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { ComplianceFilter, type ComplianceKey } from '../components/ComplianceFilter';
import { AppliedChips, ControlPill, type AppliedChip } from '../components/Controls';
import { Disclaimer } from '../components/Disclaimer';
import { Drawer } from '../components/Drawer';
import { EvidenceBadge, EVIDENCE_LABEL } from '../components/EvidenceBadge';
import { Icon } from '../components/Icon';
import { Legend } from '../components/Legend';
import { SearchBar } from '../components/SearchBar';
import { Segmented } from '../components/Segmented';
import { SelectSheet } from '../components/SelectSheet';
import { Sparkline } from '../components/Sparkline';
import { TabSwitch } from '../components/TabSwitch';
import { VerdictBadge } from '../components/VerdictBadge';
import { useI18n } from '../i18n';
import type { StringKey } from '../i18n/strings';
import { actorDescriptor, deriveSmartMoney, fmtMoney, lagWord, daysBetween, type SmartRow } from '../lib/derive';
import { fmtPctCompact, perfTone, windowReturn } from '../lib/performance';
import type { Disclosure } from '../lib/types';
import { VERDICT_PERMISSION } from '../lib/aaoifi';
import type { EvidenceStrength } from '../theme/tokens';
import type { StocksStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { usePreferences } from '../state/preferences';
import { color, font, perfColor, radius, shadow, space } from '../theme/tokens';

type Nav = NativeStackNavigationProp<StocksStackParamList, 'Stocks'>;

const TIMEFRAMES = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'All' },
] as const;
const TF_DAYS: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: Infinity };

type SubKey = 'bought' | 'sold' | 'new' | 'increased' | 'reduced' | 'exited';
type SortMetric = 'volume' | 'weight' | 'filers';

// Subviews (handoff §4). The mock feed distinguishes BUY/SELL; the position-change subviews
// approximate new/increased/reduced/exited by pairing the side with a distinct ranking metric.
const SUBVIEWS: readonly { key: SubKey; labelKey: StringKey; side: 'BUY' | 'SELL'; sort: SortMetric }[] = [
  { key: 'bought', labelKey: 'sub.mostBought', side: 'BUY', sort: 'volume' },
  { key: 'sold', labelKey: 'sub.mostSold', side: 'SELL', sort: 'volume' },
  { key: 'new', labelKey: 'sub.newPositions', side: 'BUY', sort: 'filers' },
  { key: 'increased', labelKey: 'sub.increased', side: 'BUY', sort: 'weight' },
  { key: 'reduced', labelKey: 'sub.reduced', side: 'SELL', sort: 'weight' },
  { key: 'exited', labelKey: 'sub.exited', side: 'SELL', sort: 'filers' },
];

const SORT_LABEL_KEY: Record<SortMetric, StringKey> = {
  volume: 'sort.disclosedValue',
  weight: 'sort.positionWeight',
  filers: 'sort.numberOfFilers',
};

function evidenceStrength(s: SmartRow): EvidenceStrength {
  if (s.filers >= 8) return 'high';
  if (s.filers >= 3) return 'medium';
  return 'low';
}

export function StocksScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rows, prices, loading, live, refresh } = useFeed();
  const { followed } = useFollows();
  const { compliance, setCompliance } = usePreferences();
  const { t } = useI18n();
  const subviewOptions = SUBVIEWS.map((s) => ({ key: s.key, label: t(s.labelKey) }));
  const [sub, setSub] = useState<SubKey>('bought');
  const [tf, setTf] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [evFilter, setEvFilter] = useState<EvidenceStrength | 'all'>('all');
  const [followedOnly, setFollowedOnly] = useState(false);
  const [evFilterOpen, setEvFilterOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState<SmartRow | null>(null);

  const config = SUBVIEWS.find((s) => s.key === sub)!;

  // Per-ticker context: freshness (days since latest filing) + rows for the evidence drawer.
  const byTicker = useMemo(() => {
    const m = new Map<string, Disclosure[]>();
    for (const r of rows) (m.get(r.ticker) || m.set(r.ticker, []).get(r.ticker)!).push(r);
    return m;
  }, [rows]);

  const freshDays = (ticker: string): number | null => {
    const list = byTicker.get(ticker) || [];
    let best: number | null = null;
    const now = Date.now();
    for (const r of list) {
      const t = Date.parse(r.filingDate || '');
      if (!isFinite(t)) continue;
      const d = Math.max(0, Math.round((now - t) / 86400000));
      if (best == null || d < best) best = d;
    }
    return best;
  };

  const followedTickers = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (followed.includes(r.actor)) set.add(r.ticker);
    return set;
  }, [rows, followed]);

  const stocks = useMemo(() => {
    let list = deriveSmartMoney(rows, config.side, TF_DAYS[tf]);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q));
    }
    if (compliance !== 'all') {
      list = list.filter((s) => (compliance === 'fully' ? s.label === 'clean' : s.label !== 'fail'));
    }
    if (evFilter !== 'all') list = list.filter((s) => evidenceStrength(s) === evFilter);
    if (followedOnly) list = list.filter((s) => followedTickers.has(s.ticker));
    const sorters: Record<SortMetric, (a: SmartRow, b: SmartRow) => number> = {
      volume: (a, b) => b.dollarVol - a.dollarVol,
      weight: (a, b) => (b.netWeightPct ?? -1) - (a.netWeightPct ?? -1) || b.dollarVol - a.dollarVol,
      filers: (a, b) => b.filers - a.filers || b.dollarVol - a.dollarVol,
    };
    return [...list].sort(sorters[config.sort]);
  }, [rows, config, tf, query, compliance, evFilter, followedOnly, followedTickers]);

  const activeFilters = (compliance !== 'all' ? 1 : 0) + (evFilter !== 'all' ? 1 : 0) + (followedOnly ? 1 : 0);
  const chips: AppliedChip[] = [];
  if (compliance === 'fully') chips.push({ key: 'c', label: 'Compliant only', onRemove: () => setCompliance('all') });
  if (compliance === 'exclude') chips.push({ key: 'c', label: 'Compliant + purify', onRemove: () => setCompliance('all') });
  if (evFilter !== 'all') chips.push({ key: 'e', label: `${EVIDENCE_LABEL[evFilter]} evidence`, onRemove: () => setEvFilter('all') });
  if (followedOnly) chips.push({ key: 'f', label: 'Followed only', onRemove: () => setFollowedOnly(false) });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader subtitle="Stocks" />

      <TabSwitch active="stocks" />

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>{t('stocks.title')}</Text>
          <Text style={styles.screenSub}>{t('stocks.subtitle')}</Text>
        </View>
      </View>
      <SearchBar value={query} onChange={setQuery} placeholder={t('search.stocks')} />

      <FlatList
        data={stocks}
        keyExtractor={(s) => s.ticker}
        renderItem={({ item, index }) => (
          <StockCard
            s={item}
            rank={index + 1}
            tf={tf}
            history={prices[item.ticker]?.history}
            freshDays={freshDays(item.ticker)}
            followed={followedTickers.has(item.ticker)}
            onWhy={() => setEvidenceFor(item)}
            onPress={() => nav.navigate('StockDetail', { ticker: item.ticker })}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={{ paddingTop: space.sm, paddingBottom: space.sm }}>
              <Segmented options={subviewOptions} value={sub} onChange={setSub} ariaLabel="Stock subviews" />
            </View>
            <View style={styles.controls}>
              <ControlPill icon="sort" label={t(SORT_LABEL_KEY[config.sort])} onPress={() => setWhyOpen(true)} caret />
              <ControlPill icon="filter" label={t('ctrl.filter')} count={activeFilters || undefined} active={activeFilters > 0} onPress={() => setFilterOpen(true)} />
              <ControlPill icon="shield" label={evFilter === 'all' ? t('ctrl.evidence') : EVIDENCE_LABEL[evFilter]} active={evFilter !== 'all'} caret onPress={() => setEvFilterOpen(true)} />
              <ControlPill icon="star" label={t('ctrl.followed')} active={followedOnly} onPress={() => setFollowedOnly((f) => !f)} />
            </View>
            <AppliedChips chips={chips} onClearAll={() => { setCompliance('all'); setEvFilter('all'); setFollowedOnly(false); }} />
            <View style={styles.timeWrap}>
              <View style={styles.timeBar}>
                {TIMEFRAMES.map((t) => {
                  const on = t.key === tf;
                  return (
                    <TouchableOpacity key={t.key} onPress={() => setTf(t.key)} activeOpacity={0.7} style={[styles.timeChip, on && styles.timeChipOn]}>
                      <Text style={[styles.timeText, on && styles.timeTextOn]}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.sectionMeta}>{stocks.length} shown{live ? '' : ' · sample data'}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={color.brand} />
          ) : (
            <Text style={styles.empty}>No stocks match this filter.</Text>
          )
        }
        ListFooterComponent={
          <View>
            <Legend />
            <Disclaimer />
          </View>
        }
        contentContainerStyle={{ paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.brand} />}
      />

      <SelectSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Sharia status"
        note="Filter the list by the Sharia verdict."
        options={[
          { key: 'all', label: 'All names' },
          { key: 'fully', label: 'Compliant only', desc: 'Fully compliant — nothing to purify' },
          { key: 'exclude', label: 'Compliant + purify', desc: 'Exclude non-compliant names' },
        ]}
        value={compliance}
        onSelect={(k) => setCompliance(k as ComplianceKey)}
      />

      <SelectSheet
        visible={evFilterOpen}
        onClose={() => setEvFilterOpen(false)}
        title="Evidence strength"
        note="How strong the disclosed evidence is — number of independent filers, consistency and freshness."
        options={[
          { key: 'all', label: 'Any strength' },
          { key: 'high', label: 'High', desc: 'Many independent, consistent, fresh filings' },
          { key: 'medium', label: 'Medium', desc: 'Some corroborating filings' },
          { key: 'low', label: 'Low', desc: 'Few filers or thin evidence' },
        ]}
        value={evFilter}
        onSelect={(k) => setEvFilter(k as EvidenceStrength | 'all')}
      />

      <SelectSheet
        visible={whyOpen}
        onClose={() => setWhyOpen(false)}
        title="How this is ranked"
        note={`Ranked by ${t(SORT_LABEL_KEY[config.sort]).toLowerCase()} for the "${t(config.labelKey)}" board. Disclosed value is the summed disclosed dollar amount; position weight is the trade as a share of the filer's disclosed position; filers is the number of independent disclosing investors.`}
        options={[]}
        onSelect={() => {}}
      />

      <Drawer
        visible={evidenceFor != null}
        onClose={() => setEvidenceFor(null)}
        title={evidenceFor ? `${evidenceFor.ticker} evidence` : 'Evidence'}
        footer={
          evidenceFor ? (
            <TouchableOpacity
              style={styles.reviewBtn}
              activeOpacity={0.85}
              onPress={() => {
                const t = evidenceFor.ticker;
                setEvidenceFor(null);
                nav.navigate('StockDetail', { ticker: t });
              }}
            >
              <Text style={styles.reviewBtnText}>{t('common.reviewEvidence')}</Text>
              <Icon name="externalLink" size={16} color={color.onBrand} />
            </TouchableOpacity>
          ) : null
        }
      >
        {evidenceFor ? <EvidenceBody s={evidenceFor} rows={byTicker.get(evidenceFor.ticker) || []} freshDays={freshDays(evidenceFor.ticker)} /> : null}
      </Drawer>
    </View>
  );
}

function StockCard({
  s,
  rank,
  tf,
  history,
  freshDays,
  followed,
  onWhy,
  onPress,
}: {
  s: SmartRow;
  rank: number;
  tf: string;
  history?: { d: string; c: number }[];
  freshDays: number | null;
  followed: boolean;
  onWhy: () => void;
  onPress: () => void;
}) {
  const strength = evidenceStrength(s);
  const perf = history ? windowReturn(history as any, TF_DAYS[tf]) : null;
  const tone = perfTone(perf);
  const freshLabel = freshDays == null ? null : freshDays <= 30 ? 'Fresh' : freshDays <= 75 ? 'Recent' : 'Aging';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.rank}>{rank}</Text>
        <View style={styles.tickerWrap}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{s.ticker}</Text>
            {followed ? <Icon name="star" size={13} color={color.brand} fill={color.brand} /> : null}
          </View>
          <Text style={styles.company} numberOfLines={1}>{s.company}</Text>
        </View>
        {history && history.length > 1 ? (
          <View style={styles.sparkWrap}>
            <Sparkline history={history as any} height={34} />
          </View>
        ) : null}
        <VerdictBadge label={s.label} size="sm" />
      </View>

      <View style={styles.evRow}>
        <EvidenceBadge strength={strength} onWhy={onWhy} />
        <View style={styles.metaChips}>
          <Text style={styles.metaChip}>{s.filers} filer{s.filers === 1 ? '' : 's'}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaChip}>{fmtMoney(s.dollarVol)}</Text>
          {perf != null ? (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaChip, { color: perfColor[tone] }]}>{fmtPctCompact(perf)}</Text>
            </>
          ) : null}
        </View>
      </View>

      {freshLabel ? (
        <View style={styles.freshRow}>
          <Icon name="clock" size={12} color={freshLabel === 'Fresh' ? color.brand : color.faint} />
          <Text style={[styles.freshText, freshLabel === 'Fresh' && { color: color.brand }]}>
            Filed {freshDays}d ago · {freshLabel}
          </Text>
          {s.netWeightPct != null ? <Text style={styles.freshText}>  ·  {s.netWeightPct}% of position</Text> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function EvidenceBody({ s, rows, freshDays }: { s: SmartRow; rows: Disclosure[]; freshDays: number | null }) {
  const strength = evidenceStrength(s);
  const buyers = rows.filter((r) => String(r.side).toUpperCase() === 'BUY').length;
  const sellers = rows.filter((r) => String(r.side).toUpperCase() === 'SELL').length;
  const reasons: string[] = [];
  reasons.push(`${s.filers} independent disclosing filer${s.filers === 1 ? '' : 's'}`);
  if (buyers && sellers) reasons.push(`Mixed activity — ${buyers} buying, ${sellers} selling`);
  else reasons.push('Consistent direction across filings');
  if (freshDays != null) reasons.push(freshDays <= 30 ? 'Recent, fresh disclosures' : `Most recent filing ${freshDays}d ago`);

  const top = [...rows]
    .sort((a, b) => (Number(b.amountMid) || 0) - (Number(a.amountMid) || 0))
    .slice(0, 5);

  return (
    <View style={{ gap: space.lg }}>
      <View>
        <Text style={styles.evWhyTitle}>Why {EVIDENCE_LABEL[strength]} evidence?</Text>
        {reasons.map((r, i) => (
          <View key={i} style={styles.evWhyRow}>
            <Icon name="check" size={15} color={color.brand} />
            <Text style={styles.evWhyText}>{r}</Text>
          </View>
        ))}
      </View>

      <View style={styles.evStats}>
        <EvStat label="Disclosed value" value={fmtMoney(s.dollarVol)} />
        <EvStat label="Filers" value={String(s.filers)} />
        <EvStat label="Sharia" value={VERDICT_PERMISSION[s.label]} small />
      </View>

      <View>
        <Text style={styles.evSectionTitle}>Recent filer activity</Text>
        {top.map((t) => {
          const lag = daysBetween(t.transactionDate, t.filingDate);
          return (
            <View key={String(t.id)} style={styles.filerRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.filerName} numberOfLines={1}>{t.actor}</Text>
                <Text style={styles.filerMeta} numberOfLines={1}>
                  {String(t.side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought'} · {actorDescriptor(t)}
                  {lag != null ? ` · filed ${lag}d later — ${lagWord(lag)}` : ''}
                </Text>
              </View>
              <Text style={styles.filerVal}>{t.amount || (t.amountMid ? fmtMoney(Number(t.amountMid)) : '—')}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.evNote}>Amounts shown are disclosed values. Not investment advice.</Text>
    </View>
  );
}

function EvStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={styles.evStat}>
      <Text style={styles.evStatLabel}>{label}</Text>
      <Text style={[styles.evStatValue, small && { fontSize: font.label }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  titleRow: { flexDirection: 'row', paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.sm },
  screenTitle: { fontSize: font.h1, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.3 },
  screenSub: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium, marginTop: 2, lineHeight: 16 },

  controls: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: space.lg, paddingBottom: space.sm },

  timeWrap: { paddingBottom: space.xs },
  timeBar: { flexDirection: 'row', gap: 6, paddingHorizontal: space.lg, flexWrap: 'wrap' },
  timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  timeChipOn: { backgroundColor: color.ink },
  timeText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.faint },
  timeTextOn: { color: color.onBrand },

  metaRow: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  sectionMeta: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },

  card: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.ghost, width: 18, textAlign: 'center' },
  tickerWrap: { flex: 1, minWidth: 0 },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticker: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.4 },
  company: { fontSize: font.small, color: color.muted, marginTop: 2 },
  sparkWrap: { width: 68 },

  evRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  metaChips: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaChip: { fontSize: font.small, color: color.muted, fontWeight: font.weight.bold, fontVariant: ['tabular-nums'] },
  metaDot: { fontSize: font.small, color: color.ghost },

  freshRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.sm },
  freshText: { fontSize: font.small, color: color.faint, fontWeight: font.weight.bold },

  empty: { marginHorizontal: space.lg, marginTop: space.xl, padding: space.xl, textAlign: 'center', color: color.muted, fontSize: font.label },

  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: color.brand,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  reviewBtnText: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.onBrand },

  evWhyTitle: { fontSize: font.h3, fontWeight: font.weight.heavy, color: color.ink, marginBottom: space.sm },
  evWhyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  evWhyText: { fontSize: font.label, color: color.strong, fontWeight: font.weight.medium, flex: 1 },
  evStats: { flexDirection: 'row', gap: space.sm },
  evStat: { flex: 1, padding: space.md, borderRadius: radius.md, backgroundColor: color.surfaceAlt },
  evStatLabel: { fontSize: font.small, color: color.faint, fontWeight: font.weight.bold },
  evStatValue: { fontSize: font.h3, fontWeight: font.weight.heavy, color: color.ink, marginTop: 3 },
  evSectionTitle: { fontSize: font.small, color: color.faint, fontWeight: font.weight.heavy, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: space.sm },
  filerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line },
  filerName: { fontSize: font.label, fontWeight: font.weight.bold, color: color.ink },
  filerMeta: { fontSize: font.small, color: color.faint, marginTop: 2 },
  filerVal: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.strong, fontVariant: ['tabular-nums'] },
  evNote: { fontSize: font.small, color: color.faint, lineHeight: 16 },
});

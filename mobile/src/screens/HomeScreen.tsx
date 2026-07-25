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
import type { ComplianceKey } from '../components/ComplianceFilter';
import { AppliedChips, ControlPill, type AppliedChip } from '../components/Controls';
import { Disclaimer } from '../components/Disclaimer';
import { Drawer } from '../components/Drawer';
import { Emblem } from '../components/Emblem';
import { FilterSheet } from '../components/FilterSheet';
import { Icon } from '../components/Icon';
import { Legend } from '../components/Legend';
import { MixBar } from '../components/MixBar';
import { SearchBar } from '../components/SearchBar';
import { Segmented, type SegmentOption } from '../components/Segmented';
import { SelectSheet } from '../components/SelectSheet';
import { TabSwitch } from '../components/TabSwitch';
import { derivePortfolios, portfolioComposition, portfolioFlag, typeLabel } from '../lib/derive';
import { hasMeaningfulFollowers } from '../lib/followers';
import { fmtPctCompact, perfTone, windowReturn } from '../lib/performance';
import { portfolioIndex } from '../lib/portfolioPerf';
import type { Disclosure, Portfolio } from '../lib/types';
import type { HomeStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { usePreferences } from '../state/preferences';
import { color, font, perfColor, radius, shadow, space, verdictColor } from '../theme/tokens';

const TIMEFRAMES = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: '3Y', label: '3Y' },
  { key: '5Y', label: '5Y' },
  { key: 'ALL', label: 'All' },
] as const;

const TF_DAYS: Record<string, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '3Y': 1095,
  '5Y': 1825,
  ALL: Infinity,
};

type Metric = 'performance' | 'activity' | 'followers' | 'allocation';

const SUBVIEWS: readonly SegmentOption<Metric>[] = [
  { key: 'performance', label: 'Top performers' },
  { key: 'activity', label: 'Most active' },
  { key: 'followers', label: 'Most followed' },
  { key: 'allocation', label: 'Highest compliant allocation' },
];

const METRIC_META: Record<Metric, { sort: string; why: string }> = {
  performance: {
    sort: 'Disclosed return',
    why: 'Ranked by the disclosed trailing return over the selected period — a neutral, evidence-only figure computed from cached prices. It is never a Sharia signal and not a prediction.',
  },
  activity: {
    sort: 'Disclosed activity',
    why: 'Ranked by how many disclosures the portfolio has filed — the most actively-disclosing filers first.',
  },
  followers: {
    sort: 'Followers',
    why: 'Ranked by how many Mizān users follow the portfolio.',
  },
  allocation: {
    sort: 'Compliant allocation',
    why: 'Ranked by the share of the portfolio’s disclosed names that are fully compliant (no purification needed).',
  },
};

const INITIAL_SHOWN = 8;

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

interface Ranked {
  p: Portfolio;
  who: string;
  perf: number | null;
  illustrative: boolean;
  followers: number;
  freshDays: number | null;
  purifyPct: number;
  cleanPct: number;
}

function whoLine(p: Portfolio, source?: string): string {
  const lead =
    p.group === 'official'
      ? /senate/i.test(source || '')
        ? 'US Senator'
        : /house/i.test(source || '')
          ? 'US Representative'
          : 'US lawmaker'
      : p.group === 'insider'
        ? 'Corporate insider'
        : 'Institutional';
  const src = (source || '').trim();
  const form = /^13f/i.test(src) ? '13F' : src;
  return form ? `${lead} · ${form}` : lead;
}

/** Days since the portfolio's most recent filing (freshness of the evidence). */
function freshestDays(rows: Disclosure[]): number | null {
  let best: number | null = null;
  const now = Date.now();
  for (const r of rows) {
    const t = Date.parse(r.filingDate || '');
    if (!isFinite(t)) continue;
    const d = Math.max(0, Math.round((now - t) / 86400000));
    if (best == null || d < best) best = d;
  }
  return best;
}

function freshnessWord(days: number | null): { label: string; fresh: boolean } | null {
  if (days == null) return null;
  if (days <= 30) return { label: 'Fresh', fresh: true };
  if (days <= 75) return { label: 'Recent', fresh: false };
  return { label: 'Aging', fresh: false };
}

/** Mean disclosed impure-income % across the portfolio's names — its purification exposure. */
function purifyExposure(rows: Disclosure[]): number {
  if (!rows.length) return 0;
  const sum = rows.reduce((a, r) => a + (Number(r.impurePct) || 0), 0);
  return +(sum / rows.length).toFixed(1);
}

interface SavedView {
  name: string;
  metric: Metric;
  tf: string;
  compliance: ComplianceKey;
}

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rows, prices, followerCounts, loading, refresh } = useFeed();
  const [metric, setMetric] = useState<Metric>('performance');
  const [tf, setTf] = useState<string>('1M');
  const { compliance, setCompliance } = usePreferences();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [showAll, setShowAll] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const byActor = useMemo(() => {
    const m = new Map<string, Disclosure[]>();
    for (const r of rows) {
      const k = r.actor || 'Unknown source';
      (m.get(k) || m.set(k, []).get(k)!).push(r);
    }
    return m;
  }, [rows]);

  const ranked = useMemo<Ranked[]>(() => {
    let list = derivePortfolios(rows).map((p): Ranked => {
      const actorRows = byActor.get(p.name) || [];
      const idx = portfolioIndex(portfolioComposition(actorRows), actorRows, prices);
      const source = actorRows.find((r) => r.source)?.source;
      const total = p.mix.clean + p.mix.purify + p.mix.fail + p.mix.unscreened || 1;
      return {
        p,
        who: whoLine(p, source),
        perf: idx ? windowReturn(idx.history, TF_DAYS[tf]) : null,
        illustrative: idx?.illustrative ?? true,
        followers: followerCounts[p.name] || 0,
        freshDays: freshestDays(actorRows),
        purifyPct: purifyExposure(actorRows),
        cleanPct: p.mix.clean / total,
      };
    });

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.p.name.toLowerCase().includes(q) ||
          r.p.tickers.some((t) => t.ticker.toLowerCase().includes(q)),
      );
    }
    if (compliance !== 'all') {
      list = list.filter((r) => {
        const tone = portfolioFlag(r.p).tone;
        return compliance === 'fully' ? tone === 'clean' : tone !== 'fail';
      });
    }

    const cmp: Record<Metric, (a: Ranked, b: Ranked) => number> = {
      performance: (a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity),
      activity: (a, b) => b.p.count - a.p.count,
      followers: (a, b) => b.followers - a.followers || b.p.count - a.p.count,
      allocation: (a, b) => b.cleanPct - a.cleanPct || b.p.count - a.p.count,
    };
    return list.sort(cmp[metric]);
  }, [rows, byActor, prices, followerCounts, query, metric, compliance, tf]);

  const shown = showAll ? ranked : ranked.slice(0, INITIAL_SHOWN);
  const complianceChipLabel =
    compliance === 'fully' ? 'Compliant only' : compliance === 'exclude' ? 'Compliant + purify' : null;
  const activeFilters = compliance !== 'all' ? 1 : 0;
  const samplePerf = ranked.some((r) => r.perf != null && r.illustrative);
  const showMostFollowed = hasMeaningfulFollowers(followerCounts);

  const appliedChips: AppliedChip[] = [];
  if (complianceChipLabel)
    appliedChips.push({ key: 'compliance', label: complianceChipLabel, onRemove: () => setCompliance('all') });
  if (tf !== '1M')
    appliedChips.push({ key: 'tf', label: TIMEFRAMES.find((t) => t.key === tf)?.label || tf, onRemove: () => setTf('1M') });

  const toggleSelect = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : s.length >= 3 ? s : [...s, name]));

  const selectedRanked = ranked.filter((r) => selected.includes(r.p.name));

  const saveCurrentView = () => {
    const name = `View ${savedViews.length + 1}`;
    setSavedViews((v) => [...v, { name, metric, tf, compliance }]);
  };
  const applyView = (v: SavedView) => {
    setMetric(v.metric);
    setTf(v.tf);
    setCompliance(v.compliance);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader />

      <TabSwitch active="portfolios" />

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Portfolio intelligence</Text>
          <Text style={styles.screenSub}>Compare disclosed portfolios by performance, activity and Sharia exposure.</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setSearchOpen((s) => !s)}
          activeOpacity={0.7}
          accessibilityLabel="Search"
        >
          <Icon name="search" size={20} color={color.muted} />
        </TouchableOpacity>
      </View>

      {searchOpen ? (
        <View style={{ paddingBottom: space.sm }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search a portfolio or stock" />
        </View>
      ) : null}

      <FlatList
        data={shown}
        keyExtractor={(r) => r.p.name}
        renderItem={({ item, index }) =>
          view === 'cards' ? (
            <PerformerCard
              r={item}
              rank={index + 1}
              metric={metric}
              compareMode={compareMode}
              selected={selected.includes(item.p.name)}
              onToggleSelect={() => toggleSelect(item.p.name)}
              onPress={() => nav.navigate('PortfolioDetail', { name: item.p.name })}
            />
          ) : (
            <PerformerTableRow
              r={item}
              rank={index + 1}
              onPress={() => nav.navigate('PortfolioDetail', { name: item.p.name })}
            />
          )
        }
        ListHeaderComponent={
          <View>
            <View style={{ paddingTop: space.xs, paddingBottom: space.sm }}>
              <Segmented options={SUBVIEWS} value={metric} onChange={setMetric} ariaLabel="Portfolio subviews" />
            </View>

            {/* Control bar: sort + why-ranking + saved view + view toggle + compare + filter */}
            <View style={styles.controls}>
              <ControlPill icon="sort" label={METRIC_META[metric].sort} caret onPress={() => setSortOpen(true)} />
              <TouchableOpacity style={styles.whyLink} onPress={() => setWhyOpen(true)} activeOpacity={0.7}>
                <Icon name="info" size={14} color={color.brand} />
                <Text style={styles.whyText}>Why this ranking?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controls}>
              <ControlPill icon="filter" label="Filter" count={activeFilters || undefined} active={activeFilters > 0} onPress={() => setFilterOpen(true)} />
              <ControlPill icon="star" label="Saved view" caret onPress={() => setSavedOpen(true)} />
              <ViewToggle value={view} onChange={setView} />
              <ControlPill
                icon="compare"
                label={compareMode ? `Compare (${selected.length})` : 'Compare'}
                active={compareMode}
                onPress={() => {
                  setCompareMode((m) => !m);
                  if (compareMode) setSelected([]);
                }}
              />
            </View>

            <AppliedChips
              chips={appliedChips}
              onClearAll={() => {
                setCompliance('all');
                setTf('1M');
              }}
            />

            <View style={styles.timeWrap}>
              <TimeBar value={tf} onChange={setTf} />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.sectionMeta}>
                {ranked.length} portfolio{ranked.length === 1 ? '' : 's'}
                {samplePerf ? ' · sample performance' : ''}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={color.brand} />
          ) : (
            <Text style={styles.empty}>No portfolios match this search.</Text>
          )
        }
        ListFooterComponent={
          <View>
            {ranked.length > INITIAL_SHOWN ? (
              <TouchableOpacity style={styles.more} onPress={() => setShowAll((s) => !s)} activeOpacity={0.75}>
                <Text style={styles.moreText}>
                  {showAll ? 'Show less' : `Show all ${ranked.length}`}
                </Text>
              </TouchableOpacity>
            ) : null}

            <Legend />

            <View style={styles.guardrail}>
              <Text style={styles.guardrailText}>
                Rankings reflect disclosed data and calculated metrics for the selected period.
                Performance is never colored like a Sharia verdict, and this is not advice to buy or sell.
              </Text>
            </View>
            <Disclaimer />
          </View>
        }
        contentContainerStyle={{ paddingBottom: compareMode ? 96 : space.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.brand} />}
      />

      {/* Sticky compare tray (handoff §3): appears in compare mode, opens the drawer at ≥2. */}
      {compareMode && selected.length > 0 ? (
        <View style={[styles.tray, { paddingBottom: insets.bottom + space.sm }]}>
          <Text style={styles.trayText}>
            {selected.length} selected{selected.length < 2 ? ' · pick one more' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.trayBtn, selected.length < 2 && styles.trayBtnOff]}
            disabled={selected.length < 2}
            onPress={() => setCompareOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.trayBtnText}>Compare {selected.length} portfolios</Text>
            <Icon name="chevronRight" size={16} color={color.onBrand} />
          </TouchableOpacity>
        </View>
      ) : null}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        time={{ label: 'Time', options: TIMEFRAMES, value: tf as (typeof TIMEFRAMES)[number]['key'], onChange: (k) => setTf(k) }}
        sort={{ label: 'Sort by', options: SUBVIEWS.map((s) => ({ key: s.key, label: s.label })), value: metric, onChange: (k) => setMetric(k as Metric) }}
        compliance={{ value: compliance, onChange: setCompliance }}
      />

      <SelectSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Sort portfolios by"
        options={SUBVIEWS.map((s) => ({ key: s.key, label: METRIC_META[s.key].sort, desc: s.label }))}
        value={metric}
        onSelect={(k) => setMetric(k)}
      />

      <SelectSheet
        visible={whyOpen}
        onClose={() => setWhyOpen(false)}
        title="Why this ranking?"
        note={METRIC_META[metric].why}
        options={[]}
        onSelect={() => {}}
      />

      <SelectSheet
        visible={savedOpen}
        onClose={() => setSavedOpen(false)}
        title="Saved views"
        note="Saved views remember the current sort, period and compliance filter for this session."
        options={[
          { key: '__save__', label: 'Save current view', desc: 'Sort, period and filters' },
          ...savedViews.map((v, i) => ({ key: String(i), label: v.name, desc: `${METRIC_META[v.metric].sort} · ${v.tf}` })),
        ]}
        onSelect={(k) => {
          if (k === '__save__') saveCurrentView();
          else applyView(savedViews[Number(k)]);
        }}
      />

      <Drawer
        visible={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Compare portfolios"
      >
        <CompareBody items={selectedRanked} tf={tf} />
      </Drawer>
    </View>
  );
}

function ViewToggle({ value, onChange }: { value: 'cards' | 'table'; onChange: (v: 'cards' | 'table') => void }) {
  return (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.viewBtn, value === 'table' && styles.viewBtnOn]}
        onPress={() => onChange('table')}
        accessibilityLabel="Table view"
      >
        <Icon name="list" size={16} color={value === 'table' ? color.brandInk : color.faint} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewBtn, value === 'cards' && styles.viewBtnOn]}
        onPress={() => onChange('cards')}
        accessibilityLabel="Card view"
      >
        <Icon name="grid" size={16} color={value === 'cards' ? color.brandInk : color.faint} />
      </TouchableOpacity>
    </View>
  );
}

function TimeBar({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <View style={styles.timeBar}>
      {TIMEFRAMES.map((t) => {
        const on = t.key === value;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            activeOpacity={0.7}
            style={[styles.timeChip, on && styles.timeChipOn]}
          >
            <Text style={[styles.timeText, on && styles.timeTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MetricValue({ r, metric }: { r: Ranked; metric: Metric }) {
  if (metric === 'activity') return <Text style={styles.metricStrong}>{r.p.count}</Text>;
  if (metric === 'followers') return <Text style={styles.metricStrong}>{fmtFollowers(r.followers)}</Text>;
  if (metric === 'allocation') return <Text style={styles.metricStrong}>{Math.round(r.cleanPct * 100)}% clean</Text>;
  const perf = fmtPctCompact(r.perf);
  const tone = perfTone(r.perf);
  return (
    <View style={[styles.perfChip, { backgroundColor: perfColor[`${tone}Soft`] }]}>
      <Text style={[styles.perfText, { color: perfColor[tone] }]}>{perf ?? 'perf pending'}</Text>
    </View>
  );
}

function PerformerCard({
  r,
  rank,
  metric,
  compareMode,
  selected,
  onToggleSelect,
  onPress,
}: {
  r: Ranked;
  rank: number;
  metric: Metric;
  compareMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onPress: () => void;
}) {
  const flag = portfolioFlag(r.p);
  const fresh = freshnessWord(r.freshDays);
  // In compare mode the whole card toggles selection; otherwise it opens the detail.
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={compareMode ? onToggleSelect : onPress}
      style={[styles.card, selected && styles.cardSel]}
    >
      <View style={styles.cardTop}>
        {compareMode ? (
          <View style={[styles.check, selected && styles.checkOn]}>
            {selected ? <Icon name="check" size={14} color={color.onBrand} /> : null}
          </View>
        ) : (
          <Text style={styles.rank}>{rank}</Text>
        )}
        <Emblem p={r.p} size={44} />
        <View style={styles.cardId}>
          <Text style={styles.name} numberOfLines={1}>{r.p.name}</Text>
          <Text style={styles.who} numberOfLines={1}>{r.who}</Text>
        </View>
        <View style={styles.cardMetric}>
          <MetricValue r={r} metric={metric} />
          {r.illustrative && metric === 'performance' && r.perf != null ? (
            <Text style={styles.perfNote}>sample</Text>
          ) : null}
        </View>
      </View>

      {/* Sharia flag — louder than performance (spec §2). */}
      <View style={styles.flagRow}>
        <View style={[styles.flagDot, { backgroundColor: verdictColor[flag.tone].solid }]} />
        <Text style={[styles.flagText, { color: verdictColor[flag.tone].text }]} numberOfLines={1}>
          {flag.text}
        </Text>
        {fresh ? (
          <View style={styles.freshRow}>
            <Icon name="clock" size={12} color={fresh.fresh ? color.brand : color.faint} />
            <Text style={[styles.freshText, fresh.fresh && { color: color.brand }]}>
              {r.freshDays}d · {fresh.label}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.allocRow}>
        <MixBar mix={r.p.mix} inlineLabels />
      </View>

      <View style={styles.footRow}>
        <Text style={styles.footMeta}>
          {r.p.count} disclosure{r.p.count === 1 ? '' : 's'}
          {r.purifyPct > 0 ? `  ·  ${r.purifyPct}% purify exposure` : ''}
        </Text>
        <View style={styles.followWrap}>
          <Icon name="star" size={13} color={color.faint} />
          <Text style={styles.footMeta}>{fmtFollowers(r.followers)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PerformerTableRow({ r, rank, onPress }: { r: Ranked; rank: number; onPress: () => void }) {
  const flag = portfolioFlag(r.p);
  const perf = fmtPctCompact(r.perf);
  const tone = perfTone(r.perf);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.tableRow}>
      <Text style={styles.rank}>{rank}</Text>
      <Emblem p={r.p} size={34} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{r.p.name}</Text>
        <View style={styles.tableFlag}>
          <View style={[styles.flagDot, { backgroundColor: verdictColor[flag.tone].solid }]} />
          <Text style={[styles.tableFlagText, { color: verdictColor[flag.tone].text }]} numberOfLines={1}>{flag.text}</Text>
        </View>
      </View>
      <Text style={[styles.tablePerf, { color: perfColor[tone] }]}>{perf ?? '—'}</Text>
      <Icon name="chevronRight" size={18} color={color.ghost} />
    </TouchableOpacity>
  );
}

function CompareBody({ items, tf }: { items: Ranked[]; tf: string }) {
  const tfLabel = TIMEFRAMES.find((t) => t.key === tf)?.label || tf;
  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.cmpHeadRow}>
        {items.map((r) => (
          <View key={r.p.name} style={styles.cmpHeadCell}>
            <Emblem p={r.p} size={40} />
            <Text style={styles.cmpName} numberOfLines={2}>{r.p.name}</Text>
            <Text style={styles.cmpSub} numberOfLines={1}>{typeLabel(r.p.kind)}</Text>
          </View>
        ))}
      </View>
      <CmpMetric label={`Disclosed return (${tfLabel})`} items={items} render={(r) => {
        const t = perfTone(r.perf);
        return <Text style={[styles.cmpVal, { color: perfColor[t] }]}>{fmtPctCompact(r.perf) ?? '—'}</Text>;
      }} />
      <CmpMetric label="Disclosures" items={items} render={(r) => <Text style={styles.cmpVal}>{r.p.count}</Text>} />
      <CmpMetric label="Compliant allocation" items={items} render={(r) => <Text style={styles.cmpVal}>{Math.round(r.cleanPct * 100)}%</Text>} />
      <CmpMetric label="Purify exposure" items={items} render={(r) => <Text style={[styles.cmpVal, { color: verdictColor.purify.text }]}>{r.purifyPct}%</Text>} />
      <CmpMetric label="Followers" items={items} render={(r) => <Text style={styles.cmpVal}>{fmtFollowers(r.followers)}</Text>} />
      <View style={styles.cmpAlloc}>
        {items.map((r) => (
          <View key={r.p.name} style={{ flex: 1, gap: 4 }}>
            <MixBar mix={r.p.mix} />
          </View>
        ))}
      </View>
      <Text style={styles.cmpNote}>All metrics use the latest disclosed filings. Not investment advice.</Text>
    </View>
  );
}

function CmpMetric({ label, items, render }: { label: string; items: Ranked[]; render: (r: Ranked) => React.ReactNode }) {
  return (
    <View style={styles.cmpMetric}>
      <Text style={styles.cmpLabel}>{label}</Text>
      <View style={styles.cmpValRow}>
        {items.map((r) => (
          <View key={r.p.name} style={{ flex: 1 }}>{render(r)}</View>
        ))}
      </View>
    </View>
  );
}

function fmtFollowers(n: number): string {
  const s = n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
  return `${s}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.sm,
  },
  screenTitle: { fontSize: font.h1, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.3 },
  screenSub: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium, marginTop: 2, lineHeight: 16 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controls: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: space.lg, paddingBottom: space.sm },
  whyLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  whyText: { fontSize: font.small, fontWeight: font.weight.bold, color: color.brand },

  viewToggle: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
    padding: 2,
  },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  viewBtnOn: { backgroundColor: color.brandTint },

  timeWrap: { paddingBottom: space.xs },
  metaRow: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  sectionMeta: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },

  timeBar: { flexDirection: 'row', gap: 6, paddingHorizontal: space.lg, flexWrap: 'wrap' },
  timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  timeChipOn: { backgroundColor: color.ink },
  timeText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.faint },
  timeTextOn: { color: color.onBrand },

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
  cardSel: { borderColor: color.brand, backgroundColor: color.surfaceSelected },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.ghost, width: 18, textAlign: 'center' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: color.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: color.brand, borderColor: color.brand },
  cardId: { flex: 1, minWidth: 0 },
  name: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  who: { fontSize: font.small, color: color.faint, marginTop: 1, fontWeight: font.weight.medium },
  cardMetric: { alignItems: 'flex-end', gap: 2 },
  metricStrong: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.strong, fontVariant: ['tabular-nums'] },
  perfChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.sm },
  perfText: { fontSize: font.label, fontWeight: font.weight.heavy, fontVariant: ['tabular-nums'] },
  perfNote: { fontSize: font.tiny, color: color.faint, fontWeight: font.weight.medium },

  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  flagDot: { width: 8, height: 8, borderRadius: 4 },
  flagText: { fontSize: font.small, fontWeight: font.weight.heavy },
  freshRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  freshText: { fontSize: font.small, color: color.faint, fontWeight: font.weight.bold },

  allocRow: { marginTop: space.sm },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  footMeta: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },
  followWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  tableFlag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  tableFlagText: { fontSize: font.small, fontWeight: font.weight.bold },
  tablePerf: { fontSize: font.body, fontWeight: font.weight.heavy, fontVariant: ['tabular-nums'] },

  more: {
    marginHorizontal: space.lg,
    marginTop: space.xs,
    marginBottom: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line2,
    alignItems: 'center',
    backgroundColor: color.surface,
  },
  moreText: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.brand },

  guardrail: { paddingHorizontal: space.lg, paddingTop: space.xs },
  guardrailText: { fontSize: font.small, color: color.faint, lineHeight: 16 },

  empty: { marginHorizontal: space.lg, marginTop: space.xl, padding: space.xl, textAlign: 'center', color: color.muted, fontSize: font.label },

  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.line2,
  },
  trayText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  trayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.brand,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  trayBtnOff: { backgroundColor: color.ghost },
  trayBtnText: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.onBrand },

  cmpHeadRow: { flexDirection: 'row', gap: space.md },
  cmpHeadCell: { flex: 1, alignItems: 'center', gap: 4 },
  cmpName: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.ink, textAlign: 'center' },
  cmpSub: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },
  cmpMetric: { gap: 6 },
  cmpLabel: { fontSize: font.small, color: color.faint, fontWeight: font.weight.bold, textTransform: 'uppercase', letterSpacing: 0.3 },
  cmpValRow: { flexDirection: 'row', gap: space.md },
  cmpVal: { fontSize: font.h3, fontWeight: font.weight.heavy, color: color.strong, fontVariant: ['tabular-nums'] },
  cmpAlloc: { flexDirection: 'row', gap: space.md },
  cmpNote: { fontSize: font.small, color: color.faint, lineHeight: 16, marginTop: space.xs },
});

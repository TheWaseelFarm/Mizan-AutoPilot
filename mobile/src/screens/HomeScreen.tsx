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
import { Disclaimer } from '../components/Disclaimer';
import { Emblem } from '../components/Emblem';
import { FilterSheet } from '../components/FilterSheet';
import type { ComplianceKey } from '../components/ComplianceFilter';
import { MixBar } from '../components/MixBar';
import { SearchBar } from '../components/SearchBar';
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
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: '3Y', label: '3Y' },
  { key: '5Y', label: '5Y' },
  { key: 'ALL', label: 'All' },
] as const;

// Trailing window (days) each timeframe scopes the performance to.
const TF_DAYS: Record<string, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '3Y': 1095,
  '5Y': 1825,
  ALL: Infinity,
};

const SORTS = [
  { key: 'performance', label: 'Performance' },
  { key: 'followers', label: 'Followers' },
] as const;


const INITIAL_SHOWN = 6;

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

/** One ranked portfolio with its neutral (evidence-only) performance figure attached. */
interface Ranked {
  p: Portfolio;
  who: string;
  perf: number | null;
  illustrative: boolean;
  followers: number;
}

/** A plain "who is this" subtitle from the filer's group + filing source (no invented titles). */
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

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rows, prices, followerCounts, loading, live, refresh } = useFeed();
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]['key']>('1M');
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('performance');
  // Compliance is a shared, app-wide preference (also set from Profile) — one verdict tolerance.
  const { compliance, setCompliance } = usePreferences();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Group the (already gated) feed by actor once, so each portfolio can compute its own
  // composition + weighted performance index.
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
      return {
        p,
        who: whoLine(p, source),
        // Trailing-window return for the selected timeframe (so 1W/1M/3M… actually re-scope it).
        perf: idx ? windowReturn(idx.history, TF_DAYS[tf]) : null,
        illustrative: idx?.illustrative ?? true,
        followers: followerCounts[p.name] || 0,
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

    if (sort === 'performance') {
      // Rank by the neutral evidence figure; names with no price fall to the bottom.
      list = list.sort((a, b) => (b.perf ?? -Infinity) - (a.perf ?? -Infinity));
    } else {
      // Followers: real follower counts, disclosure count only as a stable tiebreak.
      list = list.sort((a, b) => b.followers - a.followers || b.p.count - a.p.count);
    }
    return list;
  }, [rows, byActor, prices, followerCounts, query, sort, compliance, tf]);

  const shown = showAll ? ranked : ranked.slice(0, INITIAL_SHOWN);
  const activeFilters = (sort !== 'performance' ? 1 : 0) + (compliance !== 'all' ? 1 : 0);
  // "sample performance" reflects the PRICES, not the feed: it clears itself the moment real
  // cached prices replace the illustrative series (decision: illustrative must be labelled).
  const samplePerf = ranked.some((r) => r.perf != null && r.illustrative);
  // Most-followed board appears only when the counts describe a real leaderboard (decision #8).
  const showMostFollowed = hasMeaningfulFollowers(followerCounts);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader />

      {/* Screen title + a search affordance. (Stocks lives in the bottom tab — a single door;
          the old top "Portfolios | Stocks" switcher was a confusing second one — round-2 #3.) */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Portfolios</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setSearchOpen((s) => !s)}
          activeOpacity={0.7}
          accessibilityLabel="Search"
        >
          <Text style={styles.icon}>⌕</Text>
        </TouchableOpacity>
      </View>

      {searchOpen ? (
        <View style={{ paddingBottom: space.sm }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search a stock or portfolio" />
        </View>
      ) : null}

      <FlatList
        data={shown}
        keyExtractor={(r) => r.p.name}
        renderItem={({ item, index }) => (
          <PerformerRow
            r={item}
            rank={index + 1}
            onPress={() => nav.navigate('PortfolioDetail', { name: item.p.name })}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.sectionHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Top performers</Text>
                <Text style={styles.sectionMeta}>
                  {ranked.length} portfolio{ranked.length === 1 ? '' : 's'}
                  {samplePerf ? ' · sample performance' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.filterPill, activeFilters ? styles.filterPillOn : null]}
                onPress={() => setFilterOpen(true)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, activeFilters ? styles.filterPillTextOn : null]}>
                  ⚙ {activeFilters ? `${activeFilters} filter${activeFilters === 1 ? '' : 's'}` : 'Filter'}
                </Text>
              </TouchableOpacity>
            </View>

            <TimeBar value={tf} onChange={setTf} />
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
              <TouchableOpacity
                style={styles.more}
                onPress={() => setShowAll((s) => !s)}
                activeOpacity={0.75}
              >
                <Text style={styles.moreText}>
                  {showAll ? 'Show less' : `More — ${ranked.length - INITIAL_SHOWN} more`}
                </Text>
              </TouchableOpacity>
            ) : null}

            {showMostFollowed ? <MostFollowed ranked={ranked} /> : null}

            <View style={styles.guardrail}>
              <Text style={styles.guardrailText}>
                Ranked on past disclosed-holdings evidence — delayed by up to 45 days and shown for
                information only. Performance is never colored like a Sharia verdict, and this is not
                advice to buy or sell.
              </Text>
            </View>
            <Disclaimer />
          </View>
        }
        contentContainerStyle={{ paddingBottom: space.xxl }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.brand} />
        }
      />

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        time={{ label: 'Time', options: TIMEFRAMES, value: tf, onChange: setTf }}
        sort={{ label: 'Sort by', options: SORTS, value: sort, onChange: setSort }}
        compliance={{ value: compliance, onChange: setCompliance }}
      />
    </View>
  );
}

/** Compact horizontal time selector — active = solid ink pill (concept). */
function TimeBar({
  value,
  onChange,
}: {
  value: (typeof TIMEFRAMES)[number]['key'];
  onChange: (k: (typeof TIMEFRAMES)[number]['key']) => void;
}) {
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

function PerformerRow({ r, rank, onPress }: { r: Ranked; rank: number; onPress: () => void }) {
  const flag = portfolioFlag(r.p);
  const perf = fmtPctCompact(r.perf);
  const tone = perfTone(r.perf); // up = blue, down = slate — never a verdict color
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <Emblem p={r.p} />

      <View style={styles.rowMid}>
        <Text style={styles.name} numberOfLines={1}>
          {r.p.name}
        </Text>
        <Text style={styles.who} numberOfLines={1}>
          {r.who}
        </Text>
        {/* Sharia flag — louder than performance (spec §2). */}
        <View style={styles.flagRow}>
          <View style={[styles.flagDot, { backgroundColor: verdictColor[flag.tone].solid }]} />
          <Text style={[styles.flagText, { color: verdictColor[flag.tone].text }]} numberOfLines={1}>
            {flag.text}
          </Text>
        </View>
        <View style={styles.mixWrap}>
          <MixBar mix={r.p.mix} />
        </View>
      </View>

      <View style={styles.rowRight}>
        {/* Performance chip — up=blue / down=slate (a non-verdict tone, so a gain reads clearly). */}
        <View style={[styles.perfChip, { backgroundColor: perfColor[`${tone}Soft`] }]}>
          <Text style={[styles.perfText, { color: perfColor[tone] }]}>{perf ?? 'perf pending'}</Text>
        </View>
        {r.illustrative && perf ? <Text style={styles.perfNote}>sample</Text> : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

/** Most-followed board — shown only once follower counts are meaningful (decision #8). */
function MostFollowed({ ranked }: { ranked: Ranked[] }) {
  // Only portfolios that actually have followers — never pad the board with 0-follower rows.
  const top = ranked
    .filter((r) => r.followers > 0)
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 3);
  if (!top.length) return null;
  return (
    <View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Most followed</Text>
      </View>
      {top.map((r, i) => (
        <View key={r.p.name} style={styles.row}>
          <Text style={styles.rank}>{i + 1}</Text>
          <Emblem p={r.p} />
          <View style={styles.rowMid}>
            <Text style={styles.name} numberOfLines={1}>
              {r.p.name}
            </Text>
            <Text style={styles.who} numberOfLines={1}>
              {r.who}
            </Text>
          </View>
          <Text style={styles.followers}>{fmtFollowers(r.followers)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Compact follower label (e.g. 1.2k followers). */
function fmtFollowers(n: number): string {
  const s = n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
  return `${s} follower${n === 1 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: space.sm,
  },
  screenTitle: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.3 },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20, color: color.muted },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  sectionTitle: { fontSize: font.h1, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.3 },
  sectionMeta: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium, marginTop: 2 },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
  },
  filterPillOn: { backgroundColor: color.brandSoft, borderColor: color.brand },
  filterPillText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  filterPillTextOn: { color: color.brandInk },

  timeBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    flexWrap: 'wrap',
  },
  timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  timeChipOn: { backgroundColor: color.ink },
  timeText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.faint },
  timeTextOn: { color: color.onBrand },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow.card,
  },
  rank: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.faint, width: 16, textAlign: 'center' },
  rowMid: { flex: 1, minWidth: 0 },
  name: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  who: { fontSize: font.small, color: color.faint, marginTop: 1, fontWeight: font.weight.medium },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  flagDot: { width: 8, height: 8, borderRadius: 4 },
  flagText: { fontSize: font.small, fontWeight: font.weight.heavy, flex: 1 },
  mixWrap: { marginTop: 6 },

  rowRight: { alignItems: 'flex-end', gap: 3, minWidth: 62 },
  perfChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
  },
  perfText: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.muted },
  perfNote: { fontSize: font.tiny, color: color.faint, fontWeight: font.weight.medium },
  chevron: { fontSize: 22, color: color.faint, marginTop: 2 },
  followers: { fontSize: font.small, fontWeight: font.weight.heavy, color: color.muted },

  more: {
    marginHorizontal: space.lg,
    marginTop: space.xs,
    marginBottom: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line2,
    alignItems: 'center',
    backgroundColor: color.surface,
  },
  moreText: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.brand },

  guardrail: { paddingHorizontal: space.lg, paddingTop: space.sm },
  guardrailText: { fontSize: font.small, color: color.faint, lineHeight: 16 },

  empty: {
    marginHorizontal: space.lg,
    marginTop: space.xl,
    padding: space.xl,
    textAlign: 'center',
    color: color.muted,
    fontSize: font.label,
  },
});

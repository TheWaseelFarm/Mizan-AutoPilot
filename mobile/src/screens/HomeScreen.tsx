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
import { ChipRow } from '../components/Chips';
import { Disclaimer } from '../components/Disclaimer';
import { FollowButton } from '../components/FollowButton';
import { MixBar } from '../components/MixBar';
import { SearchBar } from '../components/SearchBar';
import { derivePortfolios, portfolioFlag, typeLabel } from '../lib/derive';
import type { Portfolio } from '../lib/types';
import type { HomeStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, radius, shadow, space, verdictColor } from '../theme/tokens';

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

const SORTS = [
  { key: 'performance', label: 'Performance' },
  { key: 'followers', label: 'Followers' },
] as const;

// Compliance FILTERS the list (it is not a sort) — v1-extend task #2.
const COMPLIANCE = [
  { key: 'all', label: 'All' },
  { key: 'fully', label: 'Fully compliant' },
  { key: 'exclude', label: 'Exclude non-compliant' },
] as const;

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rows, loading, live, refresh } = useFeed();
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]['key']>('1M');
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('performance');
  const [compliance, setCompliance] = useState<(typeof COMPLIANCE)[number]['key']>('all');
  const [query, setQuery] = useState('');

  const portfolios = useMemo(() => {
    let list = derivePortfolios(rows);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tickers.some((t) => t.ticker.toLowerCase().includes(q)),
      );
    }
    // Compliance filter (not a sort): by the portfolio Sharia flag.
    if (compliance !== 'all') {
      list = list.filter((p) => {
        const tone = portfolioFlag(p).tone;
        return compliance === 'fully' ? tone === 'clean' : tone !== 'fail';
      });
    }
    // 'performance' (default) and 'followers' keep the count-based order until
    // the price cache / follower counts land.
    return list;
  }, [rows, query, sort, compliance]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader subtitle="Portfolios" />
      <SearchBar value={query} onChange={setQuery} placeholder="Search a stock or portfolio" />

      <FlatList
        data={portfolios}
        keyExtractor={(p) => p.name}
        renderItem={({ item, index }) => (
          <PortfolioCard
            p={item}
            rank={index + 1}
            onPress={() => nav.navigate('PortfolioDetail', { name: item.name })}
          />
        )}
        ListHeaderComponent={
          <View>
            <ChipRow label="Time" options={TIMEFRAMES} value={tf} onChange={setTf} />
            <ChipRow label="Sort by" options={SORTS} value={sort} onChange={setSort} />
            <ChipRow label="Compliance" options={COMPLIANCE} value={compliance} onChange={setCompliance} />
            <View style={styles.listHead}>
              <Text style={styles.listHeadTitle}>Ranked portfolios</Text>
              <Text style={styles.listHeadMeta}>
                {portfolios.length} shown{live ? '' : ' · sample data'}
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
        ListFooterComponent={<Disclaimer />}
        contentContainerStyle={{ paddingBottom: space.xxl }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.brand} />
        }
      />
    </View>
  );
}

function PortfolioCard({ p, rank, onPress }: { p: Portfolio; rank: number; onPress: () => void }) {
  const flag = portfolioFlag(p);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.rank}>{rank}</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{p.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={styles.type}>
            {typeLabel(p.kind)} · {p.count} disclosure{p.count === 1 ? '' : 's'}
          </Text>
        </View>
        <FollowButton name={p.name} />
      </View>

      {/* Sharia flag — louder than performance (spec §2). */}
      <View style={styles.flagRow}>
        <View style={[styles.flagDot, { backgroundColor: verdictColor[flag.tone].solid }]} />
        <Text style={[styles.flagText, { color: verdictColor[flag.tone].text }]}>{flag.text}</Text>
        <Text style={styles.perf}>▲▼ perf pending</Text>
      </View>
      <MixBar mix={p.mix} />

      {/* Verdict-colored ticker chips (no logos). */}
      <View style={styles.chips}>
        {p.tickers.slice(0, 6).map((t) => (
          <View key={t.ticker} style={[styles.tickerChip, { borderColor: verdictColor[t.label].solid }]}>
            <Text style={[styles.tickerText, { color: verdictColor[t.label].text }]}>{t.ticker}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  listHeadTitle: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.muted, textTransform: 'uppercase' },
  listHeadMeta: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },
  card: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.faint, width: 16 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.small, fontWeight: font.weight.heavy, color: color.brandInk },
  name: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  type: { fontSize: font.small, color: color.faint, marginTop: 2 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: space.md, marginBottom: space.sm },
  flagDot: { width: 9, height: 9, borderRadius: 5 },
  flagText: { fontSize: font.label, fontWeight: font.weight.heavy, flex: 1 },
  perf: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  tickerChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  tickerText: { fontSize: font.small, fontWeight: font.weight.bold },
  empty: {
    marginHorizontal: space.lg,
    marginTop: space.xl,
    padding: space.xl,
    textAlign: 'center',
    color: color.muted,
    fontSize: font.label,
  },
});

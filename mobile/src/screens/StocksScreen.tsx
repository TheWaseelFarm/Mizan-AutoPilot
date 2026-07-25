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
import { SearchBar } from '../components/SearchBar';
import { VerdictBadge } from '../components/VerdictBadge';
import { deriveSmartMoney, fmtMoney, type SmartRow } from '../lib/derive';
import type { StocksStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, radius, shadow, space } from '../theme/tokens';

type Side = 'bought' | 'sold';
type Nav = NativeStackNavigationProp<StocksStackParamList, 'Stocks'>;

// Same Time control as Portfolios; here it's the aggregation window (trade recency).
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
const TF_DAYS: Record<string, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825, ALL: Infinity };

const SORTS = [
  { key: 'volume', label: '$ Volume' },
  { key: 'weight', label: 'Weight' },
] as const;

// Self-explanatory compliance filter (round-2 #4).
const COMPLIANCE = [
  { key: 'all', label: 'All' },
  { key: 'fully', label: 'Clean only' },
  { key: 'exclude', label: 'Hide non-compliant' },
] as const;

const COMPLIANCE_HELP =
  'Clean = own freely · Purify = charity owed at sale · Non-compliant = not permissible.';

export function StocksScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rows, loading, live, refresh } = useFeed();
  const [side, setSide] = useState<Side>('bought');
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]['key']>('ALL');
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('volume');
  const [compliance, setCompliance] = useState<(typeof COMPLIANCE)[number]['key']>('all');
  const [query, setQuery] = useState('');

  const stocks = useMemo(() => {
    // deriveSmartMoney returns rows already ranked by $ volume (the default, logical order).
    let list = deriveSmartMoney(rows, side === 'bought' ? 'BUY' : 'SELL', TF_DAYS[tf]);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q));
    }
    if (compliance !== 'all') {
      list = list.filter((s) => (compliance === 'fully' ? s.label === 'clean' : s.label !== 'fail'));
    }
    if (sort === 'weight') {
      // Rank by the gaugeable weight; names with no sizeable position (null) fall to the bottom.
      list = [...list].sort((a, b) => (b.netWeightPct ?? -1) - (a.netWeightPct ?? -1) || b.dollarVol - a.dollarVol);
    }
    return list;
  }, [rows, side, tf, sort, compliance, query]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader subtitle="Stocks" />
      <SearchBar value={query} onChange={setQuery} placeholder="Search a ticker or company" />

      <View style={styles.toggle}>
        {(['bought', 'sold'] as Side[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSide(s)}
            activeOpacity={0.8}
            style={[styles.toggleBtn, side === s && styles.toggleBtnOn]}
          >
            <Text style={[styles.toggleText, side === s && styles.toggleTextOn]}>
              {s === 'bought' ? 'Most Bought' : 'Most Sold'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={stocks}
        keyExtractor={(s) => s.ticker}
        renderItem={({ item, index }) => (
          <StockRow s={item} rank={index + 1} onPress={() => nav.navigate('StockDetail', { ticker: item.ticker })} />
        )}
        ListHeaderComponent={
          <View>
            <ChipRow label="Time" options={TIMEFRAMES} value={tf} onChange={setTf} />
            <ChipRow label="Sort by" options={SORTS} value={sort} onChange={setSort} />
            <ChipRow label="Compliance" options={COMPLIANCE} value={compliance} onChange={setCompliance} />
            <Text style={styles.complianceHelp}>{COMPLIANCE_HELP}</Text>
            <View style={styles.listHead}>
              <Text style={styles.listHeadTitle}>{side === 'bought' ? 'Most bought' : 'Most sold'}</Text>
              <Text style={styles.listHeadMeta}>
                {stocks.length} shown{live ? '' : ' · sample data'}
              </Text>
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
        ListFooterComponent={<Disclaimer />}
        contentContainerStyle={{ paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.brand} />}
      />
    </View>
  );
}

function StockRow({ s, rank, onPress }: { s: SmartRow; rank: number; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.ticker}>{s.ticker}</Text>
        <Text style={styles.company} numberOfLines={1}>
          {s.company}
        </Text>
      </View>
      <View style={styles.right}>
        <VerdictBadge label={s.label} size="sm" />
        {/* Primary rank metric: real disclosed $ volume. */}
        <Text style={styles.weight}>{fmtMoney(s.dollarVol)}</Text>
        {/* Secondary: filer count + "% of position" ONLY when a position could be sized. */}
        <Text style={styles.metric}>
          {s.filers} filer{s.filers === 1 ? '' : 's'}
          {s.netWeightPct != null ? ` · ${s.netWeightPct}% of position` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  toggle: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
    alignItems: 'center',
  },
  toggleBtnOn: { backgroundColor: color.brandSoft, borderColor: color.brand },
  toggleText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  toggleTextOn: { color: color.brandInk },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  complianceHelp: {
    fontSize: font.small,
    color: color.faint,
    lineHeight: 15,
    paddingHorizontal: space.lg,
    paddingTop: 4,
  },
  listHeadTitle: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.muted, textTransform: 'uppercase' },
  listHeadMeta: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow.card,
  },
  rank: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.faint, width: 16 },
  ticker: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.4 },
  company: { fontSize: font.small, color: color.muted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  // Rank metric is a neutral figure (not P&L) — ink, tabular; kept distinct from verdict color.
  weight: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.ink, fontVariant: ['tabular-nums'] },
  metric: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium, fontVariant: ['tabular-nums'] },
  empty: {
    marginHorizontal: space.lg,
    marginTop: space.xl,
    padding: space.xl,
    textAlign: 'center',
    color: color.muted,
    fontSize: font.label,
  },
});

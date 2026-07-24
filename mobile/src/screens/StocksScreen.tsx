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
import { SearchBar } from '../components/SearchBar';
import { VerdictBadge } from '../components/VerdictBadge';
import { deriveStocks } from '../lib/derive';
import type { Stock } from '../lib/types';
import type { StocksStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, radius, shadow, space } from '../theme/tokens';

type Side = 'bought' | 'sold';
type Nav = NativeStackNavigationProp<StocksStackParamList, 'Stocks'>;

export function StocksScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { rows, loading, live, refresh } = useFeed();
  const [side, setSide] = useState<Side>('bought');
  const [query, setQuery] = useState('');

  const stocks = useMemo(() => {
    let list = deriveStocks(rows).filter((s) => (side === 'bought' ? s.buys > 0 : s.sells > 0));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q),
      );
    }
    // Weight-normalized ranking (trade value as a stand-in until position sizes land).
    list.sort((a, b) => (side === 'bought' ? b.buyWeight - a.buyWeight : b.sellWeight - a.sellWeight));
    return list;
  }, [rows, side, query]);

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
          <StockRow
            s={item}
            side={side}
            rank={index + 1}
            onPress={() => nav.navigate('StockDetail', { ticker: item.ticker })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHead}>
            <Text style={styles.listHeadTitle}>{side === 'bought' ? 'Most bought' : 'Most sold'}</Text>
            <Text style={styles.listHeadMeta}>
              {stocks.length} shown{live ? '' : ' · sample data'}
            </Text>
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
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.brand} />
        }
      />
    </View>
  );
}

function StockRow({
  s,
  side,
  rank,
  onPress,
}: {
  s: Stock;
  side: Side;
  rank: number;
  onPress: () => void;
}) {
  const n = side === 'bought' ? s.buys : s.sells;
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
        <Text style={styles.metric}>
          {n} {side === 'bought' ? 'buy' : 'sell'}
          {n === 1 ? '' : 's'} · {s.filers} filer{s.filers === 1 ? '' : 's'}
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
  right: { alignItems: 'flex-end', gap: 6 },
  metric: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium },
  empty: {
    marginHorizontal: space.lg,
    marginTop: space.xl,
    padding: space.xl,
    textAlign: 'center',
    color: color.muted,
    fontSize: font.label,
  },
});

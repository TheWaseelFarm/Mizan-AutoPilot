import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Disclaimer } from '../components/Disclaimer';
import { VerdictBadge } from '../components/VerdictBadge';
import { actorDescriptor, daysBetween, lagWord } from '../lib/derive';
import { VERDICT_PERMISSION } from '../lib/frameworkB';
import type { StocksStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, radius, shadow, space } from '../theme/tokens';

export function StockDetailScreen() {
  const route = useRoute<RouteProp<StocksStackParamList, 'StockDetail'>>();
  const { ticker } = route.params;
  const { rows } = useFeed();

  const activity = useMemo(
    () =>
      rows
        .filter((r) => r.ticker === ticker)
        .sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || '')),
    [rows, ticker],
  );

  if (!activity.length) {
    return (
      <View style={styles.screen}>
        <Text style={styles.empty}>No disclosures on record for {ticker}.</Text>
      </View>
    );
  }

  const head = activity[0];
  const buys = activity.filter((t) => String(t.side).toUpperCase() !== 'SELL').length;
  const sells = activity.length - buys;
  const reason = plainReason(head);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: space.xxl }}>
      {/* Conclusion first: verdict + plain one-line reason. */}
      <View style={styles.header}>
        <Text style={styles.ticker}>{ticker}</Text>
        <Text style={styles.company}>{head.company || ticker}</Text>
        <View style={{ marginTop: space.md }}>
          <VerdictBadge label={head.label} />
        </View>
        <Text style={styles.permission}>{VERDICT_PERMISSION[head.label]}</Text>
        <Text style={styles.reason}>{reason}</Text>
      </View>

      {/* Key indicators. */}
      <View style={styles.stats}>
        <Stat label="Filers buying" value={String(buys)} />
        <Stat label="Filers selling" value={String(sells)} />
        <Stat label="Performance" value="Pending" muted />
      </View>

      {/* Activity log: who bought / who sold. */}
      <Text style={styles.sectionTitle}>Who bought & who sold</Text>
      {activity.map((t) => {
        const lag = daysBetween(t.transactionDate, t.filingDate);
        const isSell = String(t.side).toUpperCase() === 'SELL';
        return (
          <View key={String(t.id)} style={styles.logRow}>
            <View style={[styles.sideTag, isSell ? styles.sellTag : styles.buyTag]}>
              <Text style={[styles.sideTagText, { color: isSell ? color.muted : color.brandInk }]}>
                {isSell ? 'SELL' : 'BUY'}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.logActor} numberOfLines={1}>
                {t.actor}
              </Text>
              <Text style={styles.logMeta}>
                {actorDescriptor(t)} · {t.amount || '—'} · {t.transactionDate || '—'}
                {lag != null ? ` · filed ${lag}d after — ${lagWord(lag)}` : ''}
              </Text>
            </View>
          </View>
        );
      })}

      <Disclaimer />
    </ScrollView>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, muted && styles.statValueMuted]}>{value}</Text>
    </View>
  );
}

function plainReason(t: { label: string; business?: string; screened?: boolean; impurePct?: number }): string {
  if (t.screened === false) return 'Not screened yet — reachable by search, never shown as compliant.';
  const biz = String(t.business || '').replace(/^\s*(pass|fail|watch)[^—]*—\s*/i, '').trim() || 'the disclosed business';
  if (t.label === 'clean') return `${biz} — permissible, with no impure income.`;
  if (t.label === 'purify') return `${biz} — permissible, but a share of profit is owed to charity at sale.`;
  if (t.label === 'fail') return `Excluded at the business-activity level (${biz}).`;
  return biz;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { paddingHorizontal: space.lg, paddingTop: space.md },
  ticker: { fontSize: font.display, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.8 },
  company: { fontSize: font.body, color: color.muted, marginTop: 2 },
  permission: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink, marginTop: space.md },
  reason: { fontSize: font.body, color: color.muted, marginTop: space.sm, lineHeight: 22 },
  stats: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginTop: space.lg, marginBottom: space.sm },
  stat: {
    flex: 1,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  statLabel: { fontSize: font.tiny, fontWeight: font.weight.bold, color: color.faint, textTransform: 'uppercase' },
  statValue: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink, marginTop: 6 },
  statValueMuted: { color: color.muted, fontSize: font.body },
  sectionTitle: {
    fontSize: font.label,
    fontWeight: font.weight.heavy,
    color: color.muted,
    textTransform: 'uppercase',
    paddingHorizontal: space.lg,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  sideTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  buyTag: { backgroundColor: color.brandSoft },
  sellTag: { backgroundColor: color.surfaceAlt },
  sideTagText: { fontSize: font.tiny, fontWeight: font.weight.heavy, letterSpacing: 0.5 },
  logActor: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  logMeta: { fontSize: font.small, color: color.faint, marginTop: 3 },
  empty: { textAlign: 'center', color: color.muted, marginTop: 40, fontSize: font.label },
});

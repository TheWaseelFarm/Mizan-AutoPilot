import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Disclaimer } from '../components/Disclaimer';
import { FollowButton } from '../components/FollowButton';
import { MixBar } from '../components/MixBar';
import { VerdictBadge } from '../components/VerdictBadge';
import { actorDescriptor, daysBetween, derivePortfolios, lagWord, portfolioFlag } from '../lib/derive';
import type { HomeStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, radius, shadow, space, verdictColor } from '../theme/tokens';

export function PortfolioDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'PortfolioDetail'>>();
  const { name } = route.params;
  const { rows } = useFeed();

  const activity = useMemo(
    () =>
      rows
        .filter((r) => r.actor === name)
        .sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || '')),
    [rows, name],
  );
  const portfolio = useMemo(() => derivePortfolios(activity)[0], [activity]);

  if (!portfolio) {
    return (
      <View style={styles.screen}>
        <Text style={styles.empty}>No disclosures on record for this filer.</Text>
      </View>
    );
  }

  const flag = portfolioFlag(portfolio);
  const descriptor = actorDescriptor(activity[0] ?? { kind: portfolio.kind });
  const avgLag = averageLag(activity);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: space.xxl }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{portfolio.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.descriptor}>{descriptor}</Text>
        </View>
        <FollowButton name={name} />
      </View>

      {/* Sharia flag — the hero. */}
      <View style={styles.flagCard}>
        <View style={styles.flagRow}>
          <View style={[styles.flagDot, { backgroundColor: verdictColor[flag.tone].solid }]} />
          <Text style={[styles.flagText, { color: verdictColor[flag.tone].text }]}>{flag.text}</Text>
        </View>
        <MixBar mix={portfolio.mix} showLegend />
      </View>

      {/* Key indicators (compact stat row). */}
      <View style={styles.stats}>
        <Stat label="Holdings" value={String(portfolio.tickers.length)} />
        <Stat label="Disclosures" value={String(portfolio.count)} />
        <Stat label="Avg filing lag" value={avgLag != null ? `${avgLag}d` : '—'} muted />
      </View>
      <View style={styles.stats}>
        <Stat label="Risk appetite" value="Pending" muted />
        <Stat label="Performance" value="Pending" muted />
        <Stat label="Followers" value="—" muted />
      </View>

      {/* Activity log. */}
      <Text style={styles.sectionTitle}>Activity</Text>
      {activity.map((t) => {
        const lag = daysBetween(t.transactionDate, t.filingDate);
        return (
          <View key={String(t.id)} style={styles.logRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.logTicker}>
                {t.ticker} <Text style={styles.logSide}>· {sideWord(t.side)}</Text>
              </Text>
              <Text style={styles.logMeta}>
                {t.amount || '—'} · {t.transactionDate || '—'}
                {lag != null ? ` · filed ${lag}d after — ${lagWord(lag)}` : ''}
              </Text>
            </View>
            <VerdictBadge label={t.label} size="sm" />
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

function sideWord(side: string): string {
  return String(side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought';
}

function averageLag(rows: { transactionDate?: string; filingDate?: string }[]): number | null {
  const lags = rows.map((r) => daysBetween(r.transactionDate, r.filingDate)).filter((d): d is number => d != null);
  if (!lags.length) return null;
  return Math.round(lags.reduce((a, b) => a + b, 0) / lags.length);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.brandInk },
  name: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink },
  descriptor: { fontSize: font.small, color: color.muted, marginTop: 2 },
  flagCard: {
    margin: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    ...shadow.card,
  },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.md },
  flagDot: { width: 10, height: 10, borderRadius: 5 },
  flagText: { fontSize: font.body, fontWeight: font.weight.heavy },
  stats: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginBottom: space.sm },
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
  logTicker: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  logSide: { fontSize: font.small, color: color.muted, fontWeight: font.weight.medium },
  logMeta: { fontSize: font.small, color: color.faint, marginTop: 3 },
  empty: { textAlign: 'center', color: color.muted, marginTop: 40, fontSize: font.label },
});

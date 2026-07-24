import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Disclaimer } from '../components/Disclaimer';
import { FollowButton } from '../components/FollowButton';
import { MixBar } from '../components/MixBar';
import { PerformanceChart } from '../components/PerformanceChart';
import { VerdictBadge } from '../components/VerdictBadge';
import {
  actorDescriptor,
  daysBetween,
  derivePortfolios,
  lagWord,
  portfolioComposition,
  portfolioFlag,
} from '../lib/derive';
import { dualAnchor, fmtPctCompact } from '../lib/performance';
import { portfolioIndex } from '../lib/portfolioPerf';
import type { HomeStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, radius, shadow, space, verdictColor } from '../theme/tokens';

export function PortfolioDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'PortfolioDetail'>>();
  const { name } = route.params;
  const { rows, prices } = useFeed();

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
  const composition = useMemo(() => portfolioComposition(activity), [activity]);
  const maxWeight = composition[0]?.weightPct || 1;
  const pp = useMemo(() => portfolioIndex(composition, activity, prices), [composition, activity, prices]);
  const ppSince = pp?.sinceDisclosed != null ? fmtPctCompact(pp.sinceDisclosed) : null;

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
        <Stat label="Performance" value={ppSince || 'Pending'} muted />
        <Stat label="Followers" value="—" muted />
      </View>

      {/* Portfolio performance — a weighted index of the holdings (spec §4). Muted. */}
      {pp && pp.history.length > 1 ? (
        <View style={styles.perfCard}>
          <View style={styles.perfHead}>
            <Text style={styles.perfTitle}>Performance</Text>
            {pp.illustrative ? (
              <View style={styles.illBadge}>
                <Text style={styles.illText}>Illustrative · not live prices</Text>
              </View>
            ) : null}
          </View>
          <PerformanceChart history={pp.history} />
          <Text style={styles.perfSub}>
            Weighted index of the holdings{ppSince ? ` · ${ppSince} since disclosed` : ''}
          </Text>
        </View>
      ) : null}

      {/* Composition — how much of the portfolio each stock makes up (informational). */}
      <View style={styles.compHead}>
        <Text style={styles.sectionTitle}>Composition</Text>
        <Text style={styles.compSub}>Share of the disclosed portfolio, by amount</Text>
      </View>
      {/* Stacked allocation bar (neutral blue tints — verdict colors stay reserved). */}
      <View style={styles.allocBar}>
        {composition.map((h, i) => (
          <View
            key={h.ticker}
            style={{ flex: h.weightPct, backgroundColor: allocTint(i, composition.length), height: '100%' }}
          />
        ))}
      </View>
      {composition.map((h) => (
        <View key={h.ticker} style={styles.compRow}>
          <View style={[styles.compDot, { backgroundColor: verdictColor[h.label].solid }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.compTicker} numberOfLines={1}>
              {h.ticker} <Text style={styles.compCompany}>· {h.company}</Text>
            </Text>
            <View style={styles.compTrack}>
              <View style={[styles.compFill, { width: `${(h.weightPct / maxWeight) * 100}%` }]} />
            </View>
          </View>
          <Text style={styles.compPct}>{h.weightPct >= 9.5 ? Math.round(h.weightPct) : h.weightPct.toFixed(1)}%</Text>
        </View>
      ))}
      <Text style={styles.compNote}>
        The share each name makes up of this portfolio — informational, not a recommendation to buy.
      </Text>

      {/* Activity log. */}
      <Text style={styles.sectionTitle}>Activity</Text>
      {activity.map((t) => {
        const lag = daysBetween(t.transactionDate, t.filingDate);
        const perf = dualAnchor(prices[t.ticker], t);
        const since = perf ? fmtPctCompact(perf.sinceDisclosed) : null;
        return (
          <View key={String(t.id)} style={styles.logRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.logTicker}>
                {t.ticker} <Text style={styles.logSide}>· {sideWord(t.side)}</Text>
              </Text>
              <Text style={styles.logMeta}>
                {t.amount || '—'} · {t.transactionDate || '—'}
                {lag != null ? ` · filed ${lag}d after — ${lagWord(lag)}` : ''}
                {since ? ` · ${since} since disclosed` : ''}
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

// Neutral blue tint for an allocation segment (index-based) — kept distinct from the
// reserved verdict color language.
function allocTint(i: number, n: number): string {
  const opacity = Math.max(0.28, 0.9 - (i / Math.max(1, n - 1)) * 0.62);
  return `rgba(37, 99, 235, ${opacity.toFixed(2)})`;
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
  perfCard: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  perfHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  perfTitle: { fontSize: font.tiny, fontWeight: font.weight.heavy, color: color.faint, textTransform: 'uppercase', letterSpacing: 0.6 },
  perfSub: { fontSize: font.small, color: color.faint, marginTop: space.sm },
  illBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: color.surfaceAlt, borderWidth: 1, borderColor: color.line2 },
  illText: { fontSize: 9.5, fontWeight: font.weight.bold, color: color.faint, letterSpacing: 0.2 },
  compHead: { paddingHorizontal: space.lg, marginTop: space.md, marginBottom: space.sm },
  compSub: { fontSize: font.small, color: color.faint, marginTop: 2 },
  allocBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginHorizontal: space.lg,
    marginBottom: space.md,
    backgroundColor: color.surfaceAlt,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingVertical: 6,
  },
  compDot: { width: 9, height: 9, borderRadius: 5, flex: 0 },
  compTicker: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  compCompany: { fontSize: font.small, fontWeight: font.weight.regular, color: color.faint },
  compTrack: { height: 6, borderRadius: 3, backgroundColor: color.surfaceAlt, marginTop: 5, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 3, backgroundColor: color.brand },
  compPct: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.ink, fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
  compNote: { fontSize: font.tiny, color: color.faint, fontStyle: 'italic', paddingHorizontal: space.lg, marginTop: 2, marginBottom: space.sm, lineHeight: 14 },
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

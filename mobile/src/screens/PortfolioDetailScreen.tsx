import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Disclaimer } from '../components/Disclaimer';
import { FollowButton } from '../components/FollowButton';
import { MixBar } from '../components/MixBar';
import { PerformanceChart } from '../components/PerformanceChart';
import { PieChart } from '../components/PieChart';
import { VerdictBadge } from '../components/VerdictBadge';
import {
  actorDescriptor,
  daysBetween,
  derivePortfolios,
  lagWord,
  portfolioComposition,
  portfolioFlag,
  reportsPositions,
} from '../lib/derive';
import { resolvePrice } from '../lib/illustrative';
import { dualAnchor, fmtPctCompact, perfTone } from '../lib/performance';
import { portfolioIndex } from '../lib/portfolioPerf';
import type { HomeStackParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { color, font, perfColor, radius, shadow, space, verdictColor } from '../theme/tokens';

export function PortfolioDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'PortfolioDetail'>>();
  const { name } = route.params;
  const { rows, prices, followerCounts } = useFeed();

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
  const followers = followerCounts[name] || 0;
  const composition = useMemo(() => portfolioComposition(activity), [activity]);
  const held = composition.filter((h) => h.held);
  const maxWeight = held[0]?.weightPct || 1;
  const pp = useMemo(() => portfolioIndex(composition, activity, prices), [composition, activity, prices]);
  const ppSince = pp?.sinceDisclosed != null ? fmtPctCompact(pp.sinceDisclosed) : null;
  // Per-holding "since disclosed" so each name shows whether it's up ▲ or down ▼.
  const holdingPerf = useMemo(() => {
    const m: Record<string, { since: string | null; tone: 'up' | 'down' | 'flat' }> = {};
    for (const h of composition) {
      const disc = activity
        .filter((r) => r.ticker === h.ticker)
        .sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || ''))[0];
      const v = disc ? dualAnchor(resolvePrice(prices, { ticker: h.ticker }).price, disc)?.sinceDisclosed ?? null : null;
      m[h.ticker] = { since: fmtPctCompact(v), tone: perfTone(v) };
    }
    return m;
  }, [composition, activity, prices]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: space.xxl }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{portfolio.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.descriptor}>
            {descriptor}
            {followers > 0 ? ` · ${fmtFollowers(followers)} followers` : ''}
          </Text>
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

      {/* Key indicators — real figures only. Performance lives in the chart below (not
          duplicated here); empty placeholders (risk / followers) are omitted until they exist. */}
      <View style={styles.stats}>
        <Stat label="Holdings" value={String(held.length)} />
        <Stat label="Disclosures" value={String(portfolio.count)} />
        <Stat label="Avg filing lag" value={avgLag != null ? `${avgLag}d` : '—'} muted />
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
          <PerformanceChart
            history={pp.history}
            events={activity.map((t) => ({ date: t.transactionDate || t.filingDate, side: t.side, label: t.ticker }))}
          />
          <Text style={styles.perfSub}>
            Weighted index of the holdings{ppSince ? ` · ${ppSince} since disclosed` : ''}
          </Text>
        </View>
      ) : null}

      {/* Composition — how much of the portfolio each stock makes up (informational). */}
      <View style={styles.compHead}>
        <Text style={styles.sectionTitle}>Composition</Text>
        <Text style={styles.compSub}>
          {reportsPositions(activity)
            ? 'Reported 13F holdings, by value (latest filing)'
            : 'Share of disclosed trades, by net value'}
        </Text>
      </View>
      {/* Donut: value split by CURRENT holdings (net-sold names carry 0% and drop out of the
          pie, but still appear below tagged "Sold"). Neutral colors — verdict colors reserved. */}
      {held.length ? (
        <View style={styles.pieCard}>
          <PieChart slices={held.map((h) => ({ key: h.ticker, label: h.ticker, sub: h.company, pct: h.weightPct }))} />
        </View>
      ) : (
        <Text style={styles.noHoldings}>No current disclosed holdings — every position here was net sold.</Text>
      )}
      {composition.map((h) => {
        const perf = holdingPerf[h.ticker];
        return (
          <View key={h.ticker} style={styles.compRow}>
            <View style={[styles.compDot, { backgroundColor: verdictColor[h.label].solid }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.compTicker, !h.held && styles.compTickerMuted]} numberOfLines={1}>
                {h.ticker} <Text style={styles.compCompany}>· {h.company}</Text>
              </Text>
              {h.held ? (
                <View style={styles.compTrack}>
                  <View style={[styles.compFill, { width: `${(h.weightPct / maxWeight) * 100}%` }]} />
                </View>
              ) : null}
            </View>
            <View style={styles.compRight}>
              {h.held ? (
                <Text style={styles.compPct}>{h.weightPct >= 9.5 ? Math.round(h.weightPct) : h.weightPct.toFixed(1)}%</Text>
              ) : (
                <View style={styles.soldTag}>
                  <Text style={styles.soldTagText}>Sold</Text>
                </View>
              )}
              {/* Per-name performance — up=blue / down=slate (a non-verdict tone). */}
              {perf?.since ? (
                <Text style={[styles.compPerf, { color: perfColor[perf.tone] }]}>{perf.since} since</Text>
              ) : (
                <Text style={styles.compPerfPending}>perf pending</Text>
              )}
            </View>
          </View>
        );
      })}
      <Text style={styles.compNote}>
        Share of current disclosed holdings by value; names net sold in these filings are kept
        and marked “Sold.” Each name shows its move since disclosed (▲ up / ▼ down) —
        informational, not a recommendation to buy.
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

function Stat({ label, value, muted, valueColor }: { label: string; value: string; muted?: boolean; valueColor?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, muted && styles.statValueMuted, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function sideWord(side: string): string {
  return String(side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought';
}

/** Compact follower label (e.g. 1.2k). */
function fmtFollowers(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
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
  pieCard: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
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
  compTickerMuted: { color: color.muted },
  compCompany: { fontSize: font.small, fontWeight: font.weight.regular, color: color.faint },
  soldTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: color.surfaceAlt },
  soldTagText: { fontSize: font.tiny, fontWeight: font.weight.heavy, color: color.muted, letterSpacing: 0.4 },
  noHoldings: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surfaceAlt,
    fontSize: font.small,
    color: color.muted,
    lineHeight: 18,
  },
  compTrack: { height: 6, borderRadius: 3, backgroundColor: color.surfaceAlt, marginTop: 5, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 3, backgroundColor: color.brand },
  compRight: { alignItems: 'flex-end', minWidth: 74 },
  compPct: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.ink, fontVariant: ['tabular-nums'], textAlign: 'right' },
  // Performance stays MUTED (▲/▼ shows direction); never a verdict color.
  compPerf: { fontSize: font.small, fontWeight: font.weight.bold, color: color.muted, fontVariant: ['tabular-nums'], marginTop: 3 },
  compPerfDown: { color: color.faint },
  compPerfPending: { fontSize: font.tiny, fontWeight: font.weight.medium, color: color.faint, marginTop: 3 },
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

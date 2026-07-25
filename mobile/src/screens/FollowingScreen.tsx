import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { Emblem } from '../components/Emblem';
import { VerdictBadge } from '../components/VerdictBadge';
import { daysBetween, derivePortfolios, lagWord, portfolioFlag } from '../lib/derive';
import type { Portfolio } from '../lib/types';
import type { TabParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { color, font, radius, shadow, space, verdictColor } from '../theme/tokens';

export function FollowingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { rows } = useFeed();
  const { followed } = useFollows();

  // In-app notifications = disclosures from followed portfolios, newest first.
  const notifications = useMemo(
    () =>
      rows
        .filter((r) => followed.includes(r.actor))
        .sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || '')),
    [rows, followed],
  );
  // Look up the rolled-up portfolio for a followed name (for its emblem + Sharia flag).
  const portfolios = useMemo(() => {
    const m = new Map<string, Portfolio>();
    for (const p of derivePortfolios(rows)) m.set(p.name, p);
    return m;
  }, [rows]);

  const openPortfolio = (name: string) => nav.navigate('HomeTab', { screen: 'PortfolioDetail', params: { name } });
  const openStock = (ticker: string) => nav.navigate('StocksTab', { screen: 'StockDetail', params: { ticker } });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space.xxl }}
    >
      <BrandHeader subtitle="Following" />

      <View style={styles.inboxHead}>
        <Text style={styles.inboxTitle}>Inbox</Text>
        {notifications.length > 0 ? (
          <View style={styles.bell}>
            <Text style={styles.bellText}>🔔 {notifications.length}</Text>
          </View>
        ) : null}
      </View>

      {followed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You're not following anyone yet</Text>
          <Text style={styles.emptyBody}>
            Follow portfolios on Home to get in-app updates when they file new disclosures.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Following ({followed.length})</Text>
          {followed.map((name) => {
            const p = portfolios.get(name);
            const flag = p ? portfolioFlag(p) : null;
            return (
              <TouchableOpacity
                key={name}
                style={styles.followRow}
                activeOpacity={0.85}
                onPress={() => openPortfolio(name)}
              >
                {p ? (
                  <Emblem p={p} size={40} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(name)}</Text>
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.followName} numberOfLines={1}>
                    {name}
                  </Text>
                  {flag ? (
                    <Text style={[styles.followFlag, { color: verdictColor[flag.tone].text }]} numberOfLines={1}>
                      {flag.text}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Latest activity</Text>
          {notifications.length === 0 ? (
            <Text style={styles.quiet}>No new disclosures from the portfolios you follow.</Text>
          ) : (
            notifications.map((t) => {
              const lag = daysBetween(t.transactionDate, t.filingDate);
              return (
                <TouchableOpacity
                  key={String(t.id)}
                  style={styles.noteRow}
                  activeOpacity={0.85}
                  onPress={() => openStock(t.ticker)}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.noteActor} numberOfLines={1}>
                      {t.actor}
                    </Text>
                    <Text style={styles.noteMeta}>
                      {sideWord(t.side)} {t.ticker} · {t.amount || '—'}
                      {lag != null ? ` · filed ${lag}d after — ${lagWord(lag)}` : ''}
                    </Text>
                  </View>
                  <VerdictBadge label={t.label} size="sm" />
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

function sideWord(side: string): string {
  return String(side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought';
}
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  inboxHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  inboxTitle: { fontSize: font.h1, fontWeight: font.weight.heavy, color: color.ink },
  bell: {
    backgroundColor: color.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  bellText: { fontSize: font.small, fontWeight: font.weight.bold, color: color.brandInk },
  sectionTitle: {
    fontSize: font.label,
    fontWeight: font.weight.heavy,
    color: color.muted,
    textTransform: 'uppercase',
    paddingHorizontal: space.lg,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  followRow: {
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.small, fontWeight: font.weight.heavy, color: color.brandInk },
  followName: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  followFlag: { fontSize: font.small, fontWeight: font.weight.bold, marginTop: 2 },
  chevron: { fontSize: 22, color: color.faint },
  noteRow: {
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
    ...shadow.card,
  },
  noteActor: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  noteMeta: { fontSize: font.small, color: color.faint, marginTop: 3 },
  quiet: { paddingHorizontal: space.lg, color: color.faint, fontSize: font.label },
  empty: {
    marginHorizontal: space.lg,
    marginTop: space.xl,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.ink, marginBottom: space.sm },
  emptyBody: { fontSize: font.label, color: color.muted, textAlign: 'center', lineHeight: 20 },
});

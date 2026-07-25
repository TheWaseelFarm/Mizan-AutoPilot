import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { Disclaimer } from '../components/Disclaimer';
import { Icon } from '../components/Icon';
import { VerdictBadge } from '../components/VerdictBadge';
import { daysBetween, lagWord } from '../lib/derive';
import type { TabParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { color, font, radius, shadow, space } from '../theme/tokens';

/**
 * Alerts — the activity inbox (handoff §2: a distinct secondary destination). New disclosures
 * from the portfolios the user follows, newest first. Empty until the user follows someone.
 */
export function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { rows } = useFeed();
  const { followed } = useFollows();

  const notifications = useMemo(
    () =>
      rows
        .filter((r) => followed.includes(r.actor))
        .sort((a, b) => Date.parse(b.filingDate || '') - Date.parse(a.filingDate || '')),
    [rows, followed],
  );

  const openStock = (ticker: string) => nav.navigate('StocksTab', { screen: 'StockDetail', params: { ticker } });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space.xxl }}
    >
      <BrandHeader subtitle="Alerts" />

      <View style={styles.head}>
        <Text style={styles.title}>Alerts</Text>
        {notifications.length > 0 ? (
          <View style={styles.badge}>
            <Icon name="bell" size={13} color={color.brandInk} />
            <Text style={styles.badgeText}>{notifications.length}</Text>
          </View>
        ) : null}
      </View>

      {followed.length === 0 ? (
        <EmptyState
          title="No alerts yet"
          body="Follow portfolios to be notified here when they file new disclosures."
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          body="No new disclosures from the portfolios you follow."
        />
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
                <Text style={styles.noteMeta} numberOfLines={2}>
                  {sideWord(t.side)} {t.ticker} · {t.amount || '—'}
                  {lag != null ? ` · filed ${lag}d later — ${lagWord(lag)}` : ''}
                </Text>
              </View>
              <VerdictBadge label={t.label} size="sm" />
              <Icon name="chevronRight" size={18} color={color.ghost} />
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ marginTop: space.lg }}>
        <Disclaimer />
      </View>
    </ScrollView>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Icon name="bell" size={26} color={color.ghost} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function sideWord(side: string): string {
  return String(side).toUpperCase() === 'SELL' ? 'Sold' : 'Bought';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  title: { fontSize: font.h1, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.3 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.brandTint,
    borderWidth: 1,
    borderColor: color.brandBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: font.small, fontWeight: font.weight.heavy, color: color.brandInk },
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
  noteMeta: { fontSize: font.small, color: color.faint, marginTop: 3, lineHeight: 16 },
  empty: {
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginTop: space.xl,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line2,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.ink },
  emptyBody: { fontSize: font.label, color: color.muted, textAlign: 'center', lineHeight: 20 },
});

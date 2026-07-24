import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { VerdictBadge } from '../components/VerdictBadge';
import { daysBetween, lagWord } from '../lib/derive';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { color, font, radius, shadow, space } from '../theme/tokens';

export function FollowingScreen() {
  const insets = useSafeAreaInsets();
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
          {followed.map((name) => (
            <View key={name} style={styles.followRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(name)}</Text>
              </View>
              <Text style={styles.followName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Latest activity</Text>
          {notifications.length === 0 ? (
            <Text style={styles.quiet}>No new disclosures from the portfolios you follow.</Text>
          ) : (
            notifications.map((t) => {
              const lag = daysBetween(t.transactionDate, t.filingDate);
              return (
                <View key={String(t.id)} style={styles.noteRow}>
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
                </View>
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
  followName: { flex: 1, fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
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

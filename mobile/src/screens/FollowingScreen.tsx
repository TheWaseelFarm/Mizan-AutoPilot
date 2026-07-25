import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { Emblem } from '../components/Emblem';
import { Icon } from '../components/Icon';
import { MixBar } from '../components/MixBar';
import { useI18n } from '../i18n';
import { derivePortfolios, portfolioFlag, typeLabel } from '../lib/derive';
import type { Portfolio } from '../lib/types';
import type { TabParamList } from '../navigation/types';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { color, font, radius, shadow, space, verdictColor } from '../theme/tokens';

/**
 * Following — the list of portfolios the user follows (handoff §2: a secondary destination).
 * Managing follows lives here; new-disclosure notifications live in the Alerts tab.
 */
export function FollowingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { rows } = useFeed();
  const { followed } = useFollows();
  const { t } = useI18n();

  const portfolios = useMemo(() => {
    const m = new Map<string, Portfolio>();
    for (const p of derivePortfolios(rows)) m.set(p.name, p);
    return m;
  }, [rows]);

  const openPortfolio = (name: string) => nav.navigate('HomeTab', { screen: 'PortfolioDetail', params: { name } });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space.xxl }}
    >
      <BrandHeader subtitle={t('tab.following')} />

      <View style={styles.head}>
        <Text style={styles.title}>{t('following.title')}</Text>
        {followed.length > 0 ? <Text style={styles.count}>{followed.length}</Text> : null}
      </View>

      {followed.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="star" size={26} color={color.ghost} />
          <Text style={styles.emptyTitle}>{t('following.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('following.emptyBody')}</Text>
        </View>
      ) : (
        followed.map((name) => {
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
                <Emblem p={p} size={44} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(name)}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.followName} numberOfLines={1}>
                  {name}
                </Text>
                {p ? <Text style={styles.followSub} numberOfLines={1}>{typeLabel(p.kind)}</Text> : null}
                {flag ? (
                  <View style={styles.flagRow}>
                    <View style={[styles.flagDot, { backgroundColor: verdictColor[flag.tone].solid }]} />
                    <Text style={[styles.followFlag, { color: verdictColor[flag.tone].text }]} numberOfLines={1}>
                      {flag.text}
                    </Text>
                  </View>
                ) : null}
                {p ? <View style={styles.mixWrap}><MixBar mix={p.mix} /></View> : null}
              </View>
              <Icon name="chevronRight" size={20} color={color.ghost} />
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
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
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  title: { fontSize: font.h1, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.3 },
  count: { fontSize: font.h3, fontWeight: font.weight.heavy, color: color.ghost },
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
    ...shadow.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: color.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.small, fontWeight: font.weight.heavy, color: color.brandInk },
  followName: { fontSize: font.body, fontWeight: font.weight.bold, color: color.ink },
  followSub: { fontSize: font.small, color: color.faint, marginTop: 1, fontWeight: font.weight.medium },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  flagDot: { width: 8, height: 8, borderRadius: 4 },
  followFlag: { fontSize: font.small, fontWeight: font.weight.heavy, flex: 1 },
  mixWrap: { marginTop: 7 },
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

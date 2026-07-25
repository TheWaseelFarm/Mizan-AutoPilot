import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n';
import type { StringKey } from '../i18n/strings';
import { color, font, space, verdictColor } from '../theme/tokens';

const ITEMS = [
  { tone: 'clean', key: 'verdict.compliant' },
  { tone: 'purify', key: 'verdict.purify' },
  { tone: 'fail', key: 'verdict.noncompliant' },
  { tone: 'unscreened', key: 'verdict.underReview' },
] as const;

/**
 * The Sharia verdict legend shown beneath the ranking lists (design handoff references). Pairs
 * each reserved color with its text label so status is never communicated by color alone.
 */
export function Legend() {
  const { t } = useI18n();
  return (
    <View style={styles.wrap}>
      {ITEMS.map((it) => (
        <View key={it.tone} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: verdictColor[it.tone].solid }]} />
          <Text style={styles.label}>{t(it.key as StringKey)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  label: { fontSize: font.small, color: color.muted, fontWeight: font.weight.bold },
});

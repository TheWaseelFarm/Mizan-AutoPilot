import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { color, font, space, verdictColor } from '../theme/tokens';

const ITEMS = [
  { tone: 'clean', label: 'Compliant' },
  { tone: 'purify', label: 'Compliant · purify' },
  { tone: 'fail', label: 'Non-compliant' },
  { tone: 'unscreened', label: 'Under review' },
] as const;

/**
 * The Sharia verdict legend shown beneath the ranking lists (design handoff references). Pairs
 * each reserved color with its text label so status is never communicated by color alone.
 */
export function Legend() {
  return (
    <View style={styles.wrap}>
      {ITEMS.map((it) => (
        <View key={it.tone} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: verdictColor[it.tone].solid }]} />
          <Text style={styles.label}>{it.label}</Text>
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

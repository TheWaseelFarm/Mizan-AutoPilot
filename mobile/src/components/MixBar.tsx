import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Portfolio } from '../lib/types';
import { color, font, radius, space, verdictColor } from '../theme/tokens';

/**
 * Mini Clean/Purify/Fail mix bar for a portfolio (spec §2). The Sharia flag is
 * visually louder than performance; this bar accompanies it everywhere.
 */
export function MixBar({ mix, showLegend = false }: { mix: Portfolio['mix']; showLegend?: boolean }) {
  const total = mix.clean + mix.purify + mix.fail + mix.unscreened || 1;
  const seg = [
    ['clean', mix.clean],
    ['purify', mix.purify],
    ['fail', mix.fail],
    ['unscreened', mix.unscreened],
  ] as const;
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {seg.map(([k, n]) =>
          n > 0 ? (
            <View
              key={k}
              style={{ flex: n, backgroundColor: verdictColor[k].solid, height: '100%' }}
            />
          ) : null,
        )}
      </View>
      {showLegend ? (
        <View style={styles.legend}>
          {seg.map(([k, n]) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: verdictColor[k].solid }]} />
              <Text style={styles.legendText}>
                {k[0].toUpperCase() + k.slice(1)} {Math.round((n / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: color.surfaceAlt,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: font.small, fontWeight: font.weight.medium, color: color.muted },
});

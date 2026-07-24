import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { color, font, space } from '../theme/tokens';

/**
 * Brand lockup: a geometric "M" suggesting upward movement (spec §6), in blue,
 * with the "Mizān" wordmark. Optional right-side subtitle (e.g. a screen title).
 */
export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Svg width={26} height={26} viewBox="0 0 26 26">
          <Path
            d="M4 20 L4 9 L13 15 L22 9 L22 20"
            stroke={color.brand}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
        <Text style={styles.word}>Mizān</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.brand, letterSpacing: -0.2 },
  subtitle: { fontSize: font.label, fontWeight: font.weight.medium, color: color.faint },
});

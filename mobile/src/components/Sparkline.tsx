import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import type { PricePoint } from '../lib/performance';
import { color } from '../theme/tokens';

/**
 * Minimal price-trend sparkline — shape only, no axes, muted (evidence, never a verdict
 * color). Renders nothing when there isn't enough history.
 */
export function Sparkline({ history, height = 56 }: { history: PricePoint[]; height?: number }) {
  if (!history || history.length < 2) return null;
  const W = 300;
  const H = height;
  const pad = 4;
  const cs = history.map((p) => Number(p.c));
  const min = Math.min(...cs);
  const max = Math.max(...cs);
  const range = max - min || 1;
  const n = cs.length;
  const points = cs
    .map((c, i) => {
      const x = pad + (i / (n - 1)) * (W - 2 * pad);
      const y = pad + (1 - (c - min) / range) * (H - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <View accessibilityRole="image" accessibilityLabel="Price trend over the cached history">
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Polyline
          points={points}
          fill="none"
          stroke={color.faint}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

import React, { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { Portfolio } from '../lib/types';
import { font } from '../theme/tokens';

/**
 * A generated emblem — a deterministic gradient tile with the portfolio's monogram and a
 * source glyph. We never show third-party logos or photographs of filers (legal constraint),
 * so every portfolio gets a stable, recognizable mark derived only from its own name.
 *
 * The gradient hue is decorative brand chrome, NOT a Sharia signal: the verdict language
 * (green / amber / red / grey) is reserved for the flag + mix bar that sit beside the emblem.
 */

// Six calm gradient pairs (concept palette). None of these are the reserved verdict hues.
const PALETTE: readonly [string, string][] = [
  ['#2E6BE6', '#5B8DEF'],
  ['#7A5AF8', '#9B7BFF'],
  ['#0FB5A6', '#2ED3C4'],
  ['#E6892E', '#F2A94E'],
  ['#D6456B', '#F06A8B'],
  ['#3C4A63', '#5A6B88'],
];

const GLYPH: Record<Portfolio['group'], string> = {
  fund: '🏦',
  official: '🏛️',
  insider: '👤',
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Emblem({ p, size = 56 }: { p: Portfolio; size?: number }) {
  // A DOM-safe unique id so each emblem's gradient is its own (web export shares the <defs>).
  const gid = 'emb' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [c0, c1] = PALETTE[hashStr(p.name) % PALETTE.length];
  const initials = (p.initials || p.name.slice(0, 2) || '·').slice(0, 2).toUpperCase();
  const glyph = GLYPH[p.group] ?? '🏦';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c0} />
            <Stop offset="1" stopColor={c1} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={size * 0.29} fill={`url(#${gid})`} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.mono, { fontSize: size * 0.32 }]}>{initials}</Text>
      </View>
      <View style={[styles.glyphWrap, { width: size * 0.42, height: size * 0.42 }]}>
        <Text style={{ fontSize: size * 0.22 }}>{glyph}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  mono: { color: '#FFFFFF', fontWeight: font.weight.heavy, letterSpacing: 0.4 },
  glyphWrap: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1B2D',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

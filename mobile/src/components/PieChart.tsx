import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { color, font, radius, space } from '../theme/tokens';

/**
 * Donut chart of a portfolio's value split by stock (spec §4 composition). Slices use a neutral
 * categorical palette — the reserved verdict colors (green/amber/red) stay for the Sharia
 * verdict, so allocation is never mistaken for compliance. Informational, not a recommendation.
 */
export interface PieSlice {
  key: string;
  label: string;
  pct: number; // 0–100
  sub?: string;
}

// Cool, distinct hues (shared with the Emblem palette family). Deliberately no verdict colors.
const PALETTE = ['#2E6BE6', '#7A5AF8', '#0FB5A6', '#4F86C6', '#9B7BFF', '#E0699A', '#2ED3C4', '#3C4A63'];
const OTHER = '#AEB8CC';

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
function arcPath(cx: number, cy: number, ro: number, ri: number, start: number, end: number): string {
  const [x1, y1] = polar(cx, cy, ro, end);
  const [x2, y2] = polar(cx, cy, ro, start);
  const [x3, y3] = polar(cx, cy, ri, start);
  const [x4, y4] = polar(cx, cy, ri, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${ro},${ro} 0 ${large} 0 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${ri},${ri} 0 ${large} 1 ${x4.toFixed(2)},${y4.toFixed(2)} Z`;
}

export function PieChart({ slices, max = 7 }: { slices: PieSlice[]; max?: number }) {
  const clean = slices.filter((s) => s.pct > 0);
  if (!clean.length) return null;

  // Keep the donut legible: show the top N, roll the rest into "Other".
  const top = clean.slice(0, max);
  const restPct = clean.slice(max).reduce((s, i) => s + i.pct, 0);
  const items: PieSlice[] = restPct > 0.05 ? [...top, { key: '__other', label: 'Other', pct: restPct }] : top;
  const total = items.reduce((s, i) => s + i.pct, 0) || 1;

  const size = 152;
  const ro = 72;
  const ri = 46;
  const cx = size / 2;
  const cy = size / 2;
  const colorAt = (i: number, key: string) => (key === '__other' ? OTHER : PALETTE[i % PALETTE.length]);

  let angle = 0;
  const arcs = items.map((it, i) => {
    const sweep = (it.pct / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { key: it.key, full: sweep >= 359.99, d: arcPath(cx, cy, ro, ri, start, end), fill: colorAt(i, it.key) };
  });
  const topShare = items[0] ? (items[0].pct >= 9.5 ? Math.round(items[0].pct) : items[0].pct.toFixed(1)) : '0';

  return (
    <View style={styles.wrap}>
      <View>
        <Svg width={size} height={size} accessibilityRole="image" accessibilityLabel="Portfolio value split by stock">
          {arcs.map((a, i) =>
            a.full ? (
              <Circle key={a.key} cx={cx} cy={cy} r={(ro + ri) / 2} stroke={a.fill} strokeWidth={ro - ri} fill="none" />
            ) : (
              <Path key={a.key} d={a.d} fill={a.fill} />
            ),
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerNum}>{items.length}</Text>
          <Text style={styles.centerLbl}>{items.length === 1 ? 'holding' : 'holdings'}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {items.map((it, i) => (
          <View key={it.key} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colorAt(i, it.key) }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.label} numberOfLines={1}>
                {it.label}
              </Text>
              {it.sub ? (
                <Text style={styles.sub} numberOfLines={1}>
                  {it.sub}
                </Text>
              ) : null}
            </View>
            <Text style={styles.pct}>{it.pct >= 9.5 ? Math.round(it.pct) : it.pct.toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  centerNum: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink },
  centerLbl: { fontSize: font.tiny, color: color.faint, fontWeight: font.weight.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  legend: { flex: 1, minWidth: 0, gap: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 3 },
  label: { fontSize: font.label, fontWeight: font.weight.bold, color: color.ink },
  sub: { fontSize: font.tiny, color: color.faint, marginTop: 1 },
  pct: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.muted, fontVariant: ['tabular-nums'] },
});

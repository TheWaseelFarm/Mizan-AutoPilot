import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import type { PricePoint } from '../lib/performance';
import { color, font, space } from '../theme/tokens';

/**
 * Performance chart (spec §4/§6): a clean, muted price line with minimal axes and TWO
 * markers on the timeline — the filer's trade point vs the public filing point — so the
 * disclosure lag is visible, not hidden. Muted throughout (evidence, never a verdict color).
 */
export function PerformanceChart({
  history,
  transactionDate,
  filingDate,
}: {
  history: PricePoint[];
  transactionDate?: string;
  filingDate?: string;
}) {
  if (!history || history.length < 2) return null;
  const W = 320;
  const H = 132;
  const padX = 8;
  const padTop = 10;
  const padBottom = 24;
  const cs = history.map((p) => Number(p.c));
  const min = Math.min(...cs);
  const max = Math.max(...cs);
  const range = max - min || 1;
  const n = cs.length;
  const xAt = (i: number) => padX + (i / (n - 1)) * (W - 2 * padX);
  const yAt = (c: number) => padTop + (1 - (c - min) / range) * (H - padTop - padBottom);
  const points = cs.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c).toFixed(1)}`).join(' ');
  const baseY = H - padBottom;

  // Index of the first trading day on/after a target date (where a marker sits).
  const idxOnOrAfter = (iso?: string) => {
    const t = Date.parse(iso || '');
    if (Number.isNaN(t)) return -1;
    const i = history.findIndex((p) => Date.parse(p.d) >= t);
    return i;
  };
  const tradeI = idxOnOrAfter(transactionDate);
  const fileI = idxOnOrAfter(filingDate);

  // Labels sit on opposite sides of their marker (trade → left, filed → right) so they
  // never collide when the trade and filing dates are only a few days apart.
  const Marker = ({
    i,
    label,
    tone,
    side,
  }: {
    i: number;
    label: string;
    tone: string;
    side: 'left' | 'right';
  }) => {
    if (i < 0) return null;
    const x = xAt(i);
    const y = yAt(cs[i]);
    const anchor = side === 'left' ? 'end' : 'start';
    const lx = Math.min(Math.max(x + (side === 'left' ? -5 : 5), 4), W - 4);
    return (
      <>
        <Line x1={x} y1={padTop} x2={x} y2={baseY} stroke={tone} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <Circle cx={x} cy={y} r={3.5} fill={color.surface} stroke={tone} strokeWidth={2} />
        <SvgText x={lx} y={baseY + 14} fill={tone} fontSize={9.5} fontWeight="700" textAnchor={anchor}>
          {label}
        </SvgText>
      </>
    );
  };

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        accessibilityRole="image" accessibilityLabel="Price trend with trade and filing points marked">
        {/* minimal baseline */}
        <Line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke={color.line2} strokeWidth={1} />
        {/* price line (muted) */}
        <Polyline points={points} fill="none" stroke={color.muted} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
        {/* the lag made visible: trade point vs filing point */}
        <Marker i={tradeI} label="trade" tone={color.faint} side="left" />
        <Marker i={fileI} label="filed" tone={color.brand} side="right" />
      </Svg>
      {/* minimal price axis labels */}
      <View style={styles.axis}>
        <Text style={styles.axisText}>${min.toFixed(0)}</Text>
        <Text style={styles.axisText}>${max.toFixed(0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  axisText: { fontSize: font.tiny, color: color.faint, fontWeight: font.weight.medium, fontVariant: ['tabular-nums'] },
});

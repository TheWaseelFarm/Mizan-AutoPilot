import React, { useId, useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import type { PricePoint } from '../lib/performance';
import { color, font, perfColor, radius } from '../theme/tokens';

export interface ChartEvent {
  date?: string;
  side?: string; // 'BUY' | 'SELL'
  label?: string;
}

/** "Jun 17" style short date for the scrub tooltip. */
function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Performance chart (spec §4/§6): a clean, muted price line with a soft area fill, a "now"
 * dot, and TWO markers on the timeline — the filer's trade point vs the public filing point —
 * so the disclosure lag is visible, not hidden. Muted throughout (evidence, never a verdict
 * color). Rendered at the measured pixel width (1 SVG unit = 1px) so nothing is stretched.
 */
export function PerformanceChart({
  history,
  transactionDate,
  filingDate,
  events,
}: {
  history: PricePoint[];
  transactionDate?: string;
  filingDate?: string;
  /** Buy/sell markers to plot on the timeline (e.g. a portfolio's disclosures). */
  events?: ChartEvent[];
}) {
  // Measure real width so the SVG draws 1:1 (no aspect-ratio stretch => crisp line + labels).
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null); // scrubbed data-point index
  const gid = 'perffill' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next && next !== w) setW(next);
  };

  if (!history || history.length < 2) return null;

  const H = 150;
  const padX = 10;
  const padTop = 14;
  const padBottom = 26;
  const baseY = H - padBottom;
  const cs = history.map((p) => Number(p.c));
  const min = Math.min(...cs);
  const max = Math.max(...cs);
  const range = max - min || 1;
  const n = cs.length;
  const width = w || 320; // first paint before onLayout; replaced on measure

  const xAt = (i: number) => padX + (i / (n - 1)) * (width - 2 * padX);
  const yAt = (c: number) => padTop + (1 - (c - min) / range) * (baseY - padTop);

  const pts = cs.map((c, i) => `${xAt(i).toFixed(1)},${yAt(c).toFixed(1)}`);
  const linePath = 'M' + pts.join(' L');
  const areaPath = `${linePath} L${xAt(n - 1).toFixed(1)},${baseY} L${xAt(0).toFixed(1)},${baseY} Z`;
  const lastX = xAt(n - 1);
  const lastY = yAt(cs[n - 1]);

  // Colour the line by its net direction over the window (up = blue, down = slate) — a
  // non-verdict tone, so it never reads as a Sharia colour.
  const trendUp = cs[n - 1] >= cs[0];
  const lineColor = trendUp ? perfColor.up : perfColor.down;
  const hasEvents = Array.isArray(events) && events.length > 0;

  // Faint interior gridlines for depth (kept very light — the line stays the hero).
  const grid = [0.33, 0.66].map((f) => padTop + f * (baseY - padTop));

  // Index of the first trading day on/after a target date (where a marker sits).
  const idxOnOrAfter = (iso?: string) => {
    const t = Date.parse(iso || '');
    if (Number.isNaN(t)) return -1;
    return history.findIndex((p) => Date.parse(p.d) >= t);
  };
  const tradeI = idxOnOrAfter(transactionDate);
  const fileI = idxOnOrAfter(filingDate);

  // Touch/drag scrubbing → nearest data-point index (works for touch and mouse-drag on web).
  const scrub = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    if (x == null || Number.isNaN(x)) return;
    const frac = (x - padX) / Math.max(1, width - 2 * padX);
    setActive(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  };

  // Labels sit on opposite sides of their marker (trade → left, filed → right) so they never
  // collide when the trade and filing dates are only a few days apart.
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
    const lx = Math.min(Math.max(x + (side === 'left' ? -6 : 6), 6), width - 6);
    return (
      <>
        <Line x1={x} y1={padTop} x2={x} y2={baseY} stroke={tone} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
        <Circle cx={x} cy={y} r={4.5} fill={color.surface} stroke={tone} strokeWidth={2} />
        <SvgText
          x={lx}
          y={baseY + 15}
          fill={tone}
          fontSize={9.5}
          fontWeight="700"
          letterSpacing={0.6}
          textAnchor={anchor}
        >
          {label.toUpperCase()}
        </SvgText>
      </>
    );
  };

  return (
    <View>
      <View
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={scrub}
        onResponderMove={scrub}
      >
        <Svg
          width={width}
          height={H}
          accessibilityRole="image"
          accessibilityLabel="Price trend with trade and filing points marked"
        >
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={0.28} />
              <Stop offset="0.7" stopColor={lineColor} stopOpacity={0.06} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* faint gridlines + baseline */}
          {grid.map((gy, i) => (
            <Line key={i} x1={padX} y1={gy} x2={width - padX} y2={gy} stroke={color.line} strokeWidth={1} />
          ))}
          <Line x1={padX} y1={baseY} x2={width - padX} y2={baseY} stroke={color.line2} strokeWidth={1} />

          {/* soft area fill under the line */}
          <Path d={areaPath} fill={`url(#${gid})`} />
          {/* price line — direction-coloured, crisp */}
          <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />

          {/* the lag made visible: trade point vs filing point (single-stock chart) */}
          <Marker i={tradeI} label="trade" tone={color.faint} side="left" />
          <Marker i={fileI} label="filed" tone={color.brand} side="right" />

          {/* buy / sell markers (portfolio chart): filled dot = bought, hollow = sold */}
          {(events || []).map((ev, k) => {
            const i = idxOnOrAfter(ev.date);
            if (i < 0) return null;
            const x = xAt(i);
            const buy = String(ev.side).toUpperCase() !== 'SELL';
            return (
              <React.Fragment key={`ev${k}`}>
                <Line x1={x} y1={yAt(cs[i])} x2={x} y2={baseY} stroke={color.line2} strokeWidth={1} opacity={0.7} />
                <Circle
                  cx={x}
                  cy={yAt(cs[i])}
                  r={4}
                  fill={buy ? color.ink : color.surface}
                  stroke={color.ink}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}

          {/* "now" — the latest close, emphasised with a soft halo */}
          <Circle cx={lastX} cy={lastY} r={7} fill={color.muted} opacity={0.14} />
          <Circle cx={lastX} cy={lastY} r={3.5} fill={color.ink} stroke={color.surface} strokeWidth={1.5} />

          {/* scrub crosshair */}
          {active != null ? (
            <>
              <Line x1={xAt(active)} y1={padTop} x2={xAt(active)} y2={baseY} stroke={color.ink} strokeWidth={1} opacity={0.35} />
              <Circle cx={xAt(active)} cy={yAt(cs[active])} r={4.5} fill={color.ink} stroke={color.surface} strokeWidth={1.5} />
            </>
          ) : null}
        </Svg>

        {/* scrub tooltip (value + date at the touched point) */}
        {active != null ? (
          <View
            pointerEvents="none"
            style={[styles.tip, { left: Math.min(Math.max(xAt(active) - 44, 0), Math.max(0, width - 88)) }]}
          >
            <Text style={styles.tipVal}>${cs[active].toFixed(2)}</Text>
            <Text style={styles.tipDate}>{shortDate(history[active].d)}</Text>
          </View>
        ) : (
          // Discoverability hint — fades out once the user starts scrubbing.
          <View pointerEvents="none" style={styles.hint}>
            <Text style={styles.hintText}>↔ Drag to explore</Text>
          </View>
        )}
      </View>

      {/* price range + (optional) buy/sell legend */}
      <View style={styles.axis}>
        <Text style={styles.axisText}>${min.toFixed(0)}</Text>
        {hasEvents ? (
          <Text style={styles.legendText}>
            ● bought{'  '}○ sold
          </Text>
        ) : null}
        <Text style={styles.axisText}>${max.toFixed(0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  axisText: { fontSize: font.tiny, color: color.faint, fontWeight: font.weight.medium, fontVariant: ['tabular-nums'] },
  legendText: { fontSize: font.tiny, color: color.muted, fontWeight: font.weight.medium },
  hint: {
    position: 'absolute',
    right: 8,
    top: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
    opacity: 0.9,
  },
  hintText: { fontSize: font.tiny, color: color.muted, fontWeight: font.weight.bold },
  tip: {
    position: 'absolute',
    top: 0,
    width: 88,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: color.ink,
  },
  tipVal: { fontSize: font.label, fontWeight: font.weight.heavy, color: color.onBrand, fontVariant: ['tabular-nums'] },
  tipDate: { fontSize: font.tiny, fontWeight: font.weight.medium, color: 'rgba(255,255,255,0.75)' },
});

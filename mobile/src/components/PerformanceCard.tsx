import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { resolvePrice } from '../lib/illustrative';
import { dualAnchor, fmtPctCompact, perfTone, type PricesMap } from '../lib/performance';
import { color, font, perfColor, radius, space } from '../theme/tokens';
import { Icon } from './Icon';
import { PerformanceChart } from './PerformanceChart';

/**
 * Dual-anchor performance (spec §3.4/§4): a proper chart with the trade-point vs filing-point
 * markers, both anchors labelled, and the freshness note. All muted (evidence, never a verdict
 * color). Uses the REAL cached price when available; otherwise a clearly-labelled illustrative
 * placeholder so the chart is visible before the live FMP cache is populated.
 */
export function PerformanceCard({
  disclosure,
  prices,
}: {
  disclosure: { ticker: string; transactionDate?: string; filingDate?: string };
  prices: PricesMap;
}) {
  const { price, illustrative } = resolvePrice(prices, disclosure);
  const perf = dualAnchor(price, disclosure);

  if (!perf) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Performance</Text>
        <Text style={styles.pending}>Price pending — awaiting cached market data.</Text>
      </View>
    );
  }

  const sinceDisclosed = fmtPctCompact(perf.sinceDisclosed);
  const sincePublic = fmtPctCompact(perf.sincePublic);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Performance</Text>
        {illustrative ? (
          <View style={styles.illBadge}>
            <Text style={styles.illText}>Illustrative · not live prices</Text>
          </View>
        ) : null}
      </View>

      <PerformanceChart
        history={price.history}
        transactionDate={disclosure.transactionDate}
        filingDate={disclosure.filingDate}
      />

      <View style={styles.anchors}>
        <Anchor label="Since disclosed" value={sinceDisclosed} sub="from the trade date" tone={perfTone(perf.sinceDisclosed)} />
        <Anchor label="Since public" value={sincePublic} sub="from the filing date" tone={perfTone(perf.sincePublic)} />
      </View>

      {perf.freshness ? (
        <View style={styles.fresh}>
          <Icon name="clock" size={13} color={color.muted} />
          <Text style={styles.freshText}>{perf.freshness}</Text>
        </View>
      ) : null}

      <View style={styles.prow}>
        <Text style={styles.price}>
          disclosed{perf.disclosedClose != null ? ` $${perf.disclosedClose.toFixed(2)}` : ' —'}
        </Text>
        <Text style={styles.price}>
          filed{perf.publicClose != null ? ` $${perf.publicClose.toFixed(2)}` : ' —'}
        </Text>
        <Text style={styles.price}>now ${perf.now.toFixed(2)}</Text>
      </View>

      {illustrative ? (
        <Text style={styles.illNote}>
          Illustrative sample series — not real market data. Set an FMP key to show live prices.
        </Text>
      ) : null}
    </View>
  );
}

function Anchor({ label, value, sub, tone }: { label: string; value: string | null; sub: string; tone?: 'up' | 'down' | 'flat' }) {
  return (
    <View style={styles.anchor}>
      <Text style={styles.anchorLabel}>{label}</Text>
      <Text style={[styles.anchorValue, value != null && tone ? { color: perfColor[tone] } : null]}>{value ?? 'Pending'}</Text>
      <Text style={styles.anchorSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  title: {
    fontSize: font.tiny,
    fontWeight: font.weight.heavy,
    color: color.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  illBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line2,
  },
  illText: { fontSize: 9.5, fontWeight: font.weight.bold, color: color.faint, letterSpacing: 0.2 },
  pending: { fontSize: font.small, color: color.faint, lineHeight: 18 },
  anchors: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  anchor: { flex: 1 },
  anchorLabel: { fontSize: font.tiny, fontWeight: font.weight.bold, color: color.faint, textTransform: 'uppercase' },
  // Muted — evidence, never a verdict color.
  anchorValue: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.muted, marginTop: 4, fontVariant: ['tabular-nums'] },
  anchorSub: { fontSize: font.tiny, color: color.faint, marginTop: 2 },
  fresh: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md, padding: space.md, borderRadius: radius.sm, backgroundColor: color.surfaceAlt },
  freshText: { fontSize: font.small, color: color.muted, fontWeight: font.weight.medium, lineHeight: 18 },
  prow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  price: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium, fontVariant: ['tabular-nums'] },
  illNote: { fontSize: font.tiny, color: color.faint, fontStyle: 'italic', marginTop: space.sm, lineHeight: 14 },
});

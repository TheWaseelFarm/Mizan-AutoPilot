import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dualAnchor, fmtPctCompact, type PricesMap } from '../lib/performance';
import { color, font, radius, space } from '../theme/tokens';
import { Sparkline } from './Sparkline';

/**
 * Dual-anchor performance (spec §3.4): both anchors labelled, a sparkline, and the
 * freshness note when most of the move predates the public filing. All muted (evidence,
 * never a verdict color). Honest: no cached price -> "Price pending", never a fake 0%.
 */
export function PerformanceCard({
  disclosure,
  prices,
}: {
  disclosure: { ticker: string; transactionDate?: string; filingDate?: string };
  prices: PricesMap;
}) {
  const price = prices[disclosure.ticker];
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
      <Text style={styles.title}>Performance</Text>
      {price?.history?.length ? <Sparkline history={price.history} /> : null}

      <View style={styles.anchors}>
        <Anchor label="Since disclosed" value={sinceDisclosed} sub="from the trade date" />
        <Anchor label="Since public" value={sincePublic} sub="from the filing date" />
      </View>

      {perf.freshness ? (
        <View style={styles.fresh}>
          <Text style={styles.freshText}>⚑ {perf.freshness}</Text>
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
    </View>
  );
}

function Anchor({ label, value, sub }: { label: string; value: string | null; sub: string }) {
  return (
    <View style={styles.anchor}>
      <Text style={styles.anchorLabel}>{label}</Text>
      <Text style={styles.anchorValue}>{value ?? 'Pending'}</Text>
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
  title: {
    fontSize: font.tiny,
    fontWeight: font.weight.heavy,
    color: color.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: space.sm,
  },
  pending: { fontSize: font.small, color: color.faint, lineHeight: 18 },
  anchors: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  anchor: { flex: 1 },
  anchorLabel: { fontSize: font.tiny, fontWeight: font.weight.bold, color: color.faint, textTransform: 'uppercase' },
  // Muted — evidence, never a verdict color.
  anchorValue: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.muted, marginTop: 4, fontVariant: ['tabular-nums'] },
  anchorSub: { fontSize: font.tiny, color: color.faint, marginTop: 2 },
  fresh: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
  },
  freshText: { fontSize: font.small, color: color.muted, fontWeight: font.weight.medium, lineHeight: 18 },
  prow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  price: { fontSize: font.small, color: color.faint, fontWeight: font.weight.medium, fontVariant: ['tabular-nums'] },
});

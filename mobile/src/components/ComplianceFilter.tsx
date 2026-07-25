import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Label } from '../lib/aaoifi';
import { color, font, radius, space, verdictColor } from '../theme/tokens';

/**
 * Compliance filter (round-2 #4) — color-coded so it's obvious what each option shows. Each
 * chip carries the verdict dots it includes, and a legend maps the colors to plain meanings.
 * The key distinction is the middle "purify" bucket (compliant, but some impure income to
 * purify from dividends): "Clean only" hides it, while "Clean + Purify" keeps it (hiding only
 * non-compliant names). Uses the reserved verdict colors — this control is explicitly about
 * the Sharia verdict, so the colors belong here.
 */
export type ComplianceKey = 'all' | 'fully' | 'exclude';

export const COMPLIANCE_OPTIONS: { key: ComplianceKey; label: string; tones: Label[] }[] = [
  { key: 'all', label: 'All', tones: ['clean', 'purify', 'fail'] },
  { key: 'fully', label: 'Clean only', tones: ['clean'] },
  { key: 'exclude', label: 'Clean + Purify', tones: ['clean', 'purify'] },
];

const LEGEND: { tone: Label; word: string; desc: string }[] = [
  { tone: 'clean', word: 'Compliant', desc: 'own freely' },
  { tone: 'purify', word: 'Purify', desc: 'purify dividends' },
  { tone: 'fail', word: 'Non-compliant', desc: 'not permissible' },
];

export function ComplianceFilter({
  value,
  onChange,
  label = 'Compliance',
}: {
  value: ComplianceKey;
  onChange: (k: ComplianceKey) => void;
  label?: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {COMPLIANCE_OPTIONS.map((o) => {
          const on = o.key === value;
          return (
            <TouchableOpacity
              key={o.key}
              onPress={() => onChange(o.key)}
              activeOpacity={0.7}
              style={[styles.chip, on && styles.chipOn]}
            >
              <View style={styles.dots}>
                {o.tones.map((t) => (
                  <View key={t} style={[styles.dot, { backgroundColor: verdictColor[t].solid }]} />
                ))}
              </View>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Color key */}
      <View style={styles.legend}>
        {LEGEND.map((l) => (
          <View key={l.tone} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: verdictColor[l.tone].solid }]} />
            <Text style={styles.legendText}>
              <Text style={[styles.legendWord, { color: verdictColor[l.tone].text }]}>{l.word}</Text>
              {` = ${l.desc}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 2 },
  groupLabel: {
    fontSize: font.tiny,
    fontWeight: font.weight.heavy,
    color: color.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
    marginBottom: 2,
  },
  row: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
  },
  chipOn: { backgroundColor: color.brandSoft, borderColor: color.brand },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  chipTextOn: { color: color.brandInk },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: font.small, color: color.muted, fontWeight: font.weight.medium },
  legendWord: { fontWeight: font.weight.heavy },
});

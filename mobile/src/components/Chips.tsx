import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { color, font, radius, space } from '../theme/tokens';

/**
 * A labelled, horizontally-scrolling row of selectable pill chips. The `label` (e.g. "Time",
 * "Sort by", "Compliance") makes each control group unmistakable — no chip row can be taken
 * for a navigation tab (v1-extend task #2).
 */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  label?: string;
}) {
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.groupLabel}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((o) => {
          const on = o.key === value;
          return (
            <TouchableOpacity
              key={o.key}
              onPress={() => onChange(o.key)}
              activeOpacity={0.7}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
  },
  chipOn: { backgroundColor: color.brandSoft, borderColor: color.brand },
  chipText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  chipTextOn: { color: color.brandInk },
});

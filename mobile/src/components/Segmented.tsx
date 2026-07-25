import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { color, font, radius, space } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
  icon?: IconName;
}

/**
 * Horizontal segmented control used for subview switching (Top performers / Most bought …) and
 * small toggles (Table / Cards). Active segment = cobalt-tinted surface + cobalt ink; the whole
 * strip scrolls horizontally so long subview lists never overflow the page (handoff §8).
 */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  scroll = true,
  size = 'md',
  ariaLabel,
}: {
  options: readonly SegmentOption<K>[];
  value: K;
  onChange: (k: K) => void;
  scroll?: boolean;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}) {
  const items = options.map((o) => {
    const on = o.key === value;
    return (
      <TouchableOpacity
        key={o.key}
        onPress={() => onChange(o.key)}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={o.label}
        style={[styles.seg, size === 'sm' && styles.segSm, on && styles.segOn]}
      >
        {o.icon ? (
          <Icon name={o.icon} size={size === 'sm' ? 15 : 16} color={on ? color.brandInk : color.faint} />
        ) : null}
        <Text style={[styles.segText, size === 'sm' && styles.segTextSm, on && styles.segTextOn]} numberOfLines={1}>
          {o.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (!scroll) {
    return (
      <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={ariaLabel}>
        {items}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollRow}
      accessibilityRole="tablist"
      accessibilityLabel={ariaLabel}
    >
      {items}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  scrollRow: { flexDirection: 'row', gap: 6, paddingHorizontal: space.lg },
  seg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segSm: { paddingHorizontal: 11, paddingVertical: 6 },
  segOn: { backgroundColor: color.brandTint, borderColor: color.brandBorder },
  segText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.faint },
  segTextSm: { fontSize: font.small },
  segTextOn: { color: color.brandInk },
});

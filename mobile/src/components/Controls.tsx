import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useI18n } from '../i18n';
import { color, font, radius, space } from '../theme/tokens';
import { Icon, type IconName } from './Icon';

/**
 * A control-bar pill: leading icon + label, with an optional trailing count badge or caret.
 * Used for Filter / Sort / Saved view / Compare across both primary screens (handoff §7).
 */
export function ControlPill({
  icon,
  label,
  count,
  caret,
  active,
  onPress,
}: {
  icon?: IconName;
  label: string;
  count?: number;
  caret?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillOn]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? <Icon name={icon} size={15} color={active ? color.brandInk : color.muted} /> : null}
      <Text style={[styles.pillText, active && styles.pillTextOn]}>{label}</Text>
      {count ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
      {caret ? <Icon name="chevronDown" size={14} color={active ? color.brandInk : color.faint} /> : null}
    </TouchableOpacity>
  );
}

export interface AppliedChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Applied-filter chips with a Clear all action (handoff §7). Horizontally scrollable. */
export function AppliedChips({ chips, onClearAll }: { chips: AppliedChip[]; onClearAll: () => void }) {
  const { t } = useI18n();
  if (chips.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {chips.map((c) => (
        <TouchableOpacity
          key={c.key}
          style={styles.chip}
          onPress={c.onRemove}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Remove filter ${c.label}`}
        >
          <Text style={styles.chipText}>{c.label}</Text>
          <Icon name="close" size={13} color={color.brandInk} />
        </TouchableOpacity>
      ))}
      {chips.length > 1 ? (
        <TouchableOpacity style={styles.clearAll} onPress={onClearAll} activeOpacity={0.75}>
          <Text style={styles.clearAllText}>{t('ctrl.clearAll')}</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
  },
  pillOn: { backgroundColor: color.brandTint, borderColor: color.brandBorder },
  pillText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  pillTextOn: { color: color.brandInk },
  countBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: font.tiny, fontWeight: font.weight.heavy, color: color.onBrand },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: space.lg, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.brandTint,
    borderWidth: 1,
    borderColor: color.brandBorder,
  },
  chipText: { fontSize: font.small, fontWeight: font.weight.bold, color: color.brandInk },
  clearAll: { paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center' },
  clearAllText: { fontSize: font.small, fontWeight: font.weight.heavy, color: color.muted, textDecorationLine: 'underline' },
});

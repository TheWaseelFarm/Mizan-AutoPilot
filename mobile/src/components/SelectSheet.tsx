import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, font, radius, shadow, space } from '../theme/tokens';
import { Icon } from './Icon';

export interface SelectOption<K extends string> {
  key: K;
  label: string;
  desc?: string;
}

/**
 * A lightweight single-select bottom sheet used for Sort, Saved views, and any short option
 * list. Selecting an option fires onSelect and closes. Set `value` to show the active check.
 */
export function SelectSheet<K extends string>({
  visible,
  onClose,
  title,
  note,
  options,
  value,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  note?: string;
  options: readonly SelectOption<K>[];
  value?: K;
  onSelect: (k: K) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { paddingBottom: insets.bottom + space.md }, shadow.drawer]}
        >
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Close">
              <Icon name="close" size={20} color={color.muted} />
            </TouchableOpacity>
          </View>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          {options.map((o) => {
            const on = o.key === value;
            return (
              <TouchableOpacity
                key={o.key}
                style={[styles.opt, on && styles.optOn]}
                onPress={() => {
                  onSelect(o.key);
                  onClose();
                }}
                activeOpacity={0.75}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: on }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optLabel, on && styles.optLabelOn]}>{o.label}</Text>
                  {o.desc ? <Text style={styles.optDesc}>{o.desc}</Text> : null}
                </View>
                {on ? <Icon name="check" size={18} color={color.brandInk} /> : null}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(16, 24, 40, 0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  title: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink },
  note: { fontSize: font.small, color: color.muted, lineHeight: 17, marginBottom: space.sm },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  optOn: { backgroundColor: color.surfaceSelected },
  optLabel: { fontSize: font.body, fontWeight: font.weight.bold, color: color.strong },
  optLabelOn: { color: color.brandInk },
  optDesc: { fontSize: font.small, color: color.faint, marginTop: 2, lineHeight: 16 },
});

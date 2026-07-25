import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ChipRow } from './Chips';
import { color, font, radius, space } from '../theme/tokens';

/**
 * Bottom-sheet that holds the ranking controls (Time / Sort by / Compliance). It keeps the
 * landing itself calm — a single "filter" pill opens this, so the performers board leads with
 * results, not knobs. Each control stays a labelled chip group (never a tab).
 */
export interface FilterOption<T extends string> {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
  label: string;
}

export function FilterSheet<A extends string, B extends string, C extends string>({
  visible,
  onClose,
  time,
  sort,
  compliance,
}: {
  visible: boolean;
  onClose: () => void;
  time: FilterOption<A>;
  sort: FilterOption<B>;
  compliance: FilterOption<C>;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grab} />
          <View style={styles.head}>
            <Text style={styles.title}>Filter & sort</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.done}>Done</Text>
            </TouchableOpacity>
          </View>

          <ChipRow label={time.label} options={time.options} value={time.value} onChange={time.onChange} />
          <ChipRow label={sort.label} options={sort.options} value={sort.value} onChange={sort.onChange} />
          <ChipRow
            label={compliance.label}
            options={compliance.options}
            value={compliance.value}
            onChange={compliance.onChange}
          />
          <Text style={styles.help}>
            Clean = own freely · Purify = charity owed at sale · Non-compliant = not permissible.
          </Text>

          <Text style={styles.note}>
            Sorting on disclosed-holdings evidence only. It ranks past filings — never a
            recommendation to buy or sell.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 27, 45, 0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: space.xxl,
    paddingTop: space.sm,
  },
  grab: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.line2,
    marginBottom: space.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.xs,
  },
  title: { fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink },
  done: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.brand },
  help: {
    fontSize: font.small,
    color: color.muted,
    lineHeight: 16,
    paddingHorizontal: space.lg,
    paddingTop: 6,
    fontWeight: font.weight.medium,
  },
  note: {
    fontSize: font.small,
    color: color.faint,
    lineHeight: 16,
    paddingHorizontal: space.lg,
    marginTop: space.md,
  },
});

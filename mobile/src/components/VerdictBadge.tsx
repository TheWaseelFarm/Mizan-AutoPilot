import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Label } from '../lib/frameworkB';
import { VERDICT_SHORT } from '../lib/frameworkB';
import { font, radius, space, verdictColor } from '../theme/tokens';

/** The reserved verdict pill — soft tint + legible text + a solid dot. */
export function VerdictBadge({ label, size = 'md' }: { label: Label; size?: 'sm' | 'md' }) {
  const v = verdictColor[label];
  const small = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: v.tint }, small && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: v.solid }]} />
      <Text style={[styles.text, { color: v.text }, small && styles.textSm]}>
        {VERDICT_SHORT[label]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 4, gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: font.small, fontWeight: font.weight.heavy },
  textSm: { fontSize: font.tiny },
});

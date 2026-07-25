import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { TabParamList } from '../navigation/types';
import { color, font, radius, space } from '../theme/tokens';

/**
 * The persistent Portfolios | Stocks primary switch (design handoff §2). It sits at the top of
 * both primary screens' content to reinforce the two-tab mental model even though the tabs also
 * live in the bottom navigation. Selecting a segment jumps to that tab's stack root.
 */
export function TabSwitch({ active }: { active: 'portfolios' | 'stocks' }) {
  const nav = useNavigation<BottomTabNavigationProp<TabParamList>>();
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      <Segment
        label="Portfolios"
        on={active === 'portfolios'}
        onPress={() => nav.navigate('HomeTab', { screen: 'Home' })}
      />
      <Segment
        label="Stocks"
        on={active === 'stocks'}
        onPress={() => nav.navigate('StocksTab', { screen: 'Stocks' })}
      />
    </View>
  );
}

function Segment({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.seg, on && styles.segOn]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.segText, on && styles.segTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  segOn: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.brandBorder,
    ...({
      shadowColor: '#101828',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    }),
  },
  segText: { fontSize: font.body, fontWeight: font.weight.bold, color: color.faint },
  segTextOn: { color: color.brandInk },
});

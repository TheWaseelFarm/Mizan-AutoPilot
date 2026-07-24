import React from 'react';
import { StyleSheet, TextInput, View, Text } from 'react-native';

import { color, font, radius, space } from '../theme/tokens';

/** Instant-search input used at the top of Home and Stocks. */
export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={color.faint}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="characters"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line2,
    paddingHorizontal: space.md,
    marginHorizontal: space.lg,
  },
  icon: { fontSize: 18, color: color.faint },
  input: { flex: 1, fontSize: font.body, color: color.ink, paddingVertical: 0 },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useFollows } from '../state/follows';
import { color, font, radius } from '../theme/tokens';

export function FollowButton({ name }: { name: string }) {
  const { isFollowed, toggle } = useFollows();
  const on = isFollowed(name);
  return (
    <TouchableOpacity
      onPress={() => toggle(name)}
      activeOpacity={0.7}
      style={[styles.btn, on && styles.btnOn]}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${on ? 'Unfollow' : 'Follow'} ${name}`}
    >
      <Text style={[styles.text, on && styles.textOn]}>{on ? 'Following' : 'Follow'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.brand,
    backgroundColor: color.brand,
  },
  btnOn: { backgroundColor: 'transparent' },
  text: { fontSize: font.label, fontWeight: font.weight.bold, color: color.onBrand },
  textOn: { color: color.brand },
});

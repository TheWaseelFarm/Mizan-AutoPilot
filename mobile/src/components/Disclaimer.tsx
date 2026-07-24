import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { color, font, space } from '../theme/tokens';
import { DISCLAIMER } from '../theme/tokens';

/** The required subtle disclaimer on every performance surface (spec §0). */
export function Disclaimer() {
  return <Text style={styles.text}>{DISCLAIMER}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: font.tiny,
    lineHeight: 15,
    color: color.faint,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
});

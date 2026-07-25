import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useI18n } from '../i18n';
import { color, evidenceColor, font, radius, type EvidenceStrength } from '../theme/tokens';
import { Icon } from './Icon';

export const EVIDENCE_LABEL: Record<EvidenceStrength, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * Evidence-strength badge — how strong the disclosed evidence is (number of independent filers,
 * consistency, freshness). NEUTRAL ink tones only, never a Sharia hue: evidence quality is
 * orthogonal to compliance (handoff: "Status is never communicated by color alone").
 * An optional "Why?" affordance opens the evidence explanation.
 */
export function EvidenceBadge({
  strength,
  onWhy,
  compact,
}: {
  strength: EvidenceStrength;
  onWhy?: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const c = evidenceColor[strength];
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: c.tint, borderColor: c.border }]}>
        <View style={[styles.dot, { backgroundColor: c.solid }]} />
        <Text style={[styles.text, { color: c.text }]}>{EVIDENCE_LABEL[strength]}</Text>
      </View>
      {onWhy && !compact ? (
        <TouchableOpacity
          onPress={onWhy}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Why ${EVIDENCE_LABEL[strength]} evidence`}
          style={styles.why}
        >
          <Text style={styles.whyText}>{t('ctrl.why')}</Text>
          <Icon name="info" size={13} color={color.brand} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: font.small, fontWeight: font.weight.heavy },
  why: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  whyText: { fontSize: font.small, fontWeight: font.weight.bold, color: color.brand },
});

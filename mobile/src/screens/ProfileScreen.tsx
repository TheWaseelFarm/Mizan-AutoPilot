import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { color, font, radius, space } from '../theme/tokens';

const RISK = ['Conservative', 'Balanced', 'Growth'] as const;
const VERDICT_TOLERANCE = ['Clean only', 'Clean + Purify', 'All'] as const;
const SECTORS = ['Technology', 'Energy', 'Healthcare', 'Consumer', 'Industrials'] as const;

/**
 * Profile / For you (Tab 4). Explicit preferences that reshuffle the app; in v1
 * these persist to a per-user `preferences` record (RLS) and blend with implicit
 * viewing behavior. Here they drive a local, session-only profile.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [risk, setRisk] = useState<(typeof RISK)[number]>('Balanced');
  const [tolerance, setTolerance] = useState<(typeof VERDICT_TOLERANCE)[number]>('Clean + Purify');
  const [sectors, setSectors] = useState<string[]>(['Technology']);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const toggleSector = (s: string) =>
    setSectors((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space.xxl }}
    >
      <BrandHeader subtitle="Profile" />

      <Segment label="Risk appetite" options={RISK} value={risk} onChange={setRisk} />
      <Segment
        label="Verdict tolerance"
        options={VERDICT_TOLERANCE}
        value={tolerance}
        onChange={setTolerance}
      />

      <Text style={styles.label}>Sectors of interest</Text>
      <View style={styles.chips}>
        {SECTORS.map((s) => {
          const on = sectors.includes(s);
          return (
            <TouchableOpacity
              key={s}
              onPress={() => toggleSector(s)}
              activeOpacity={0.7}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.rowCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>In-app alerts</Text>
          <Text style={styles.rowBody}>New disclosures from portfolios you follow. Always on.</Text>
        </View>
        <Switch value disabled trackColor={{ true: color.brand }} />
      </View>
      <View style={styles.rowCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Email alerts</Text>
          <Text style={styles.rowBody}>Optional email summaries (coming later).</Text>
        </View>
        <Switch
          value={emailAlerts}
          onValueChange={setEmailAlerts}
          trackColor={{ true: color.brand }}
        />
      </View>

      <Text style={styles.sectionTitle}>Methodology</Text>
      <View style={styles.infoCard}>
        <Text style={styles.rowTitle}>Framework B · Hanbali</Text>
        <Text style={styles.rowBody}>
          Two disqualifying tests: permissible business activity, and impure income ≤ 5%. Debt is
          advisory — it never fails a name, only moves it to Purify-at-sale.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.rowTitle}>Disclaimer</Text>
        <Text style={styles.rowBody}>
          Mizān is informational only. It is not a brokerage, a trading or copy-trading service, or a
          formal fatwa. Performance is past disclosed-holdings evidence, delayed by filing lag — never
          a recommendation.
        </Text>
      </View>
    </ScrollView>
  );
}

function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segment}>
        {options.map((o) => {
          const on = o === value;
          return (
            <TouchableOpacity
              key={o}
              onPress={() => onChange(o)}
              activeOpacity={0.8}
              style={[styles.segBtn, on && styles.segBtnOn]}
            >
              <Text style={[styles.segText, on && styles.segTextOn]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  label: {
    fontSize: font.small,
    fontWeight: font.weight.heavy,
    color: color.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: space.lg,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  sectionTitle: {
    fontSize: font.label,
    fontWeight: font.weight.heavy,
    color: color.muted,
    textTransform: 'uppercase',
    paddingHorizontal: space.lg,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  segment: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
    alignItems: 'center',
  },
  segBtnOn: { backgroundColor: color.brandSoft, borderColor: color.brand },
  segText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  segTextOn: { color: color.brandInk },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.lg },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line2,
    backgroundColor: color.surface,
  },
  chipOn: { backgroundColor: color.brandSoft, borderColor: color.brand },
  chipText: { fontSize: font.label, fontWeight: font.weight.bold, color: color.muted },
  chipTextOn: { color: color.brandInk },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  infoCard: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  rowTitle: { fontSize: font.body, fontWeight: font.weight.heavy, color: color.ink, marginBottom: 4 },
  rowBody: { fontSize: font.small, color: color.muted, lineHeight: 19 },
});

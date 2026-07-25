import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '../components/BrandHeader';
import { ComplianceFilter } from '../components/ComplianceFilter';
import { useI18n } from '../i18n';
import { usePreferences } from '../state/preferences';
import { color, font, radius, space } from '../theme/tokens';

const RISK = ['Conservative', 'Balanced', 'Growth'] as const;
const SECTORS = ['Technology', 'Energy', 'Healthcare', 'Consumer', 'Industrials'] as const;

/**
 * Profile / For you (Tab 4). Explicit preferences that reshuffle the app; in v1
 * these persist to a per-user `preferences` record (RLS) and blend with implicit
 * viewing behavior. Here they drive a local, session-only profile.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { compliance, setCompliance } = usePreferences();
  const { lang, setLang, t } = useI18n();
  const [risk, setRisk] = useState<(typeof RISK)[number]>('Balanced');
  const [sectors, setSectors] = useState<string[]>(['Technology']);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const toggleSector = (s: string) =>
    setSectors((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: space.xxl }}
    >
      <BrandHeader subtitle={t('tab.account')} />

      {/* Language / direction — switches the UI chrome and flips layout to RTL for Arabic. */}
      <Text style={styles.label}>{t('account.language')}</Text>
      <View style={styles.segment}>
        <TouchableOpacity
          onPress={() => setLang('en')}
          activeOpacity={0.8}
          style={[styles.segBtn, lang === 'en' && styles.segBtnOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: lang === 'en' }}
        >
          <Text style={[styles.segText, lang === 'en' && styles.segTextOn]}>{t('account.languageEnglish')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLang('ar')}
          activeOpacity={0.8}
          style={[styles.segBtn, lang === 'ar' && styles.segBtnOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: lang === 'ar' }}
        >
          <Text style={[styles.segText, lang === 'ar' && styles.segTextOn]}>{t('account.languageArabic')}</Text>
        </TouchableOpacity>
      </View>

      {/* The one control here that actually drives the app today: the default verdict tolerance,
          shared with the Home & Stocks filters (change it in either place). */}
      <ComplianceFilter label="Verdict tolerance" value={compliance} onChange={setCompliance} />
      <Text style={styles.caption}>Sets the default for every list. You can still override it per-list on Home & Stocks.</Text>

      <Segment label="Risk appetite" options={RISK} value={risk} onChange={setRisk} />

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
      <Text style={styles.caption}>Risk &amp; sectors are saved for upcoming personalization — they don’t change your results yet.</Text>

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
        <Text style={styles.rowTitle}>AAOIFI Standard No. 21 · the “30/30/5” rule</Text>
        <Text style={styles.rowBody}>
          Two screens, both required: permissible business activity, and financial ratios vs. market
          capitalization — interest-bearing debt &lt; 30%, cash + interest-bearing securities &lt; 30%,
          and non-permissible income &lt; 5% of revenue. Over any limit is Non-compliant. Some impure
          income (0–5%) is Compliant · purify — you purify that share of dividends. (The 33% ratio used
          by some index providers is not AAOIFI.)
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.rowTitle}>Disclaimer</Text>
        <Text style={styles.rowBody}>
          Screening is based on AAOIFI Standard No. 21. Mizān is informational only — not a brokerage,
          a trading or copy-trading service, or a formal fatwa. Performance is past disclosed-holdings
          evidence, delayed by filing lag — never a recommendation. Scholarly review confirms the
          sector list and thresholds.
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
  caption: {
    fontSize: font.small,
    color: color.faint,
    lineHeight: 16,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
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

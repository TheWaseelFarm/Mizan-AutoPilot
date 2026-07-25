import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, font, layout, radius, shadow, space } from '../theme/tokens';
import { Icon } from './Icon';

/**
 * Responsive drawer (handoff §7): a 360–400px side panel on desktop/tablet, a modal bottom
 * sheet on mobile. Used for the compare panel (Portfolios) and the evidence panel (Stocks).
 * Same content, geometry chosen from viewport width — no duplicated markup.
 */
export function Drawer({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const side = width >= layout.bpTablet; // side panel vs bottom sheet

  return (
    <Modal visible={visible} transparent animationType={side ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable
        style={[styles.scrim, side ? styles.scrimSide : styles.scrimBottom]}
        onPress={onClose}
        accessibilityLabel="Close"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            side
              ? [styles.panelSide, { width: layout.drawerWidth, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md }]
              : [styles.panelBottom, { paddingBottom: insets.bottom + space.md }],
            shadow.drawer,
          ]}
        >
          <View style={styles.head}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close panel"
              style={styles.closeBtn}
            >
              <Icon name="close" size={20} color={color.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(16, 24, 40, 0.35)' },
  scrimSide: { flexDirection: 'row', justifyContent: 'flex-end' },
  scrimBottom: { justifyContent: 'flex-end' },
  panelSide: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    height: '100%',
  },
  panelBottom: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '86%',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  title: { flex: 1, fontSize: font.h2, fontWeight: font.weight.heavy, color: color.ink, letterSpacing: -0.2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceAlt,
  },
  body: { padding: space.lg, gap: space.lg },
  footer: { padding: space.lg, borderTopWidth: 1, borderTopColor: color.line, gap: space.sm },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MoonlightBrandIcon, { MOONLIGHT_BRAND_SIZE } from './MoonlightBrandIcon';
import { MenuIcon } from './GoogleIcons';
import { Theme } from '../constants/theme';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  trailing?: React.ReactNode;
  showBrand?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  onMenuPress,
  trailing,
  showBrand = true,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {onMenuPress ? (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          activeOpacity={0.7}
        >
          <MenuIcon size={21} color={Theme.color.text} />
        </TouchableOpacity>
      ) : null}
      {showBrand ? (
        <MoonlightBrandIcon size={MOONLIGHT_BRAND_SIZE.header} />
      ) : null}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    paddingHorizontal: Theme.space.lg,
    paddingVertical: Theme.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.space.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.color.border,
  },
  menuButton: {
    width: Theme.touchTarget,
    height: Theme.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radius.md,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { color: Theme.color.text, fontSize: 20, fontWeight: '800' },
  subtitle: {
    color: Theme.color.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    flexShrink: 1,
  },
  trailing: { flexShrink: 0 },
});

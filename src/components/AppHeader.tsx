import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/theme';
import { IconButton, MoonMark } from './Design';
type Props = {
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
}: Props) {
  return (
    <View style={S.header}>
      {showBrand && <MoonMark size={30} />}
      <View style={S.copy}>
        <Text style={S.title}>{title}</Text>
        {!!subtitle && <Text style={S.subtitle}>{subtitle}</Text>}
      </View>
      {trailing}
      {onMenuPress && (
        <IconButton glyph="☷" label="Open settings" onPress={onMenuPress} />
      )}
    </View>
  );
}
const S = StyleSheet.create({
  header: {
    minHeight: 72,
    paddingHorizontal: 22,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  copy: { flex: 1 },
  title: {
    color: Theme.color.text,
    fontSize: 20,
    letterSpacing: -0.5,
    fontWeight: '600',
  },
  subtitle: {
    color: Theme.color.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
});

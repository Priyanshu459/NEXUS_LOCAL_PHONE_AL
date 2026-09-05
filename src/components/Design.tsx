import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/theme';
import MoonlightBrandIcon from './MoonlightBrandIcon';
const c = Theme.color;
// Use the same artwork as the site assets and Android launcher, without tinting.
export function MoonMark({ size = 36 }: { size?: number }) {
  return <MoonlightBrandIcon size={size} />;
}
export function IconButton({
  glyph,
  label,
  onPress,
  disabled = false,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[ui.iconButton, disabled && ui.disabled]}
    >
      <Text style={ui.glyph}>{glyph}</Text>
    </TouchableOpacity>
  );
}
export function PageIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <View style={ui.intro}>
      <Text style={ui.eyebrow}>{eyebrow}</Text>
      <Text style={ui.title}>{title}</Text>
      <Text style={ui.body}>{body}</Text>
    </View>
  );
}
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: 22, gap: 18 },
  intro: { gap: 12, marginTop: 14, marginBottom: 12 },
  eyebrow: {
    color: c.accent,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  title: {
    color: c.text,
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 43,
    letterSpacing: -1.4,
  },
  body: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  section: { color: c.text, fontSize: 18, fontWeight: '600', marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  primary: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: c.background, fontSize: 14, fontWeight: '700' },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { color: c.text, fontSize: 24 },
  disabled: { opacity: 0.35 },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    minHeight: 52,
    color: c.text,
    padding: 14,
    fontSize: 14,
    backgroundColor: c.background,
  },
  small: { color: c.textMuted, fontSize: 12, lineHeight: 19 },
});

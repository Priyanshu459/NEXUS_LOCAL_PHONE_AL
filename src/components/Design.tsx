import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, themedStyles, useAppearance } from '../constants/theme';
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
  icon,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: 'microphone';
}) {
  useAppearance();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[ui.iconButton, disabled && ui.disabled]}
    >
      {icon === 'microphone' || label === 'Dictate message' ? <View style={{width:24,height:28,alignItems:'center'}}>
        <View style={{width:10,height:18,borderWidth:1.7,borderColor:c.text,borderRadius:5}}/>
        <View style={{position:'absolute',top:8,width:19,height:15,borderWidth:1.7,borderTopWidth:0,borderColor:c.text,borderBottomLeftRadius:10,borderBottomRightRadius:10}}/>
        <View style={{width:1.7,height:6,backgroundColor:c.text,marginTop:4}}/>
      </View> : <Text style={ui.glyph}>{glyph}</Text>}
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
export const ui = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: 22, gap: 18, width:'100%', maxWidth:760, alignSelf:'center' },
  intro: { gap: 12, marginTop: 14, marginBottom: 12 },
  eyebrow: {
    color: c.accent,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  title: {
    color: c.text,
    fontFamily: Theme.headingFont,
    fontSize: 34,
    fontWeight: '600',
    lineHeight: 43,
    letterSpacing: -1.4,
  },
  body: { color: c.textSecondary, fontSize: 15, lineHeight: 23 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 26,
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
    borderRadius: 26,
    paddingHorizontal: 18,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: Theme.onPrimary, fontSize: 14, fontWeight: '700' },
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
    borderRadius: 19,
    minHeight: 52,
    color: c.text,
    padding: 14,
    fontSize: 14,
    backgroundColor: c.surfaceRaised,
  },
  small: { color: c.textMuted, fontSize: 12, lineHeight: 19 },
}));

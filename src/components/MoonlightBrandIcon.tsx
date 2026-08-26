import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export const MOONLIGHT_BRAND_SIZE = {
  compact: 24,
  header: 36,
  about: 40,
  empty: 48,
  hero: 72,
  splash: 120,
} as const;

type MoonlightBrandIconProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The single in-app Moonlight brand mark. The artwork mirrors the official
 * adaptive launcher foreground without redrawing, recoloring, or cropping it.
 */
export function MoonlightBrandIcon({
  size = MOONLIGHT_BRAND_SIZE.header,
  style,
}: MoonlightBrandIconProps) {
  return (
    <Image
      source={require('../assets/branding/moon-brand-dark.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Moonlight AI"
    />
  );
}

export default MoonlightBrandIcon;

/**
 * MoonLogo — Reusable brand logo component
 *
 * Uses the official Moonlight AI brand icon (moonlight-icon.png for light bg,
 * moonlight-icon-light.png for dark bg).
 *
 * Usage:
 *   <MoonLogo size={40} />                    // on dark background (default)
 *   <MoonLogo size={40} variant="dark" />     // on light background
 */

import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { MoonBrandLightBase64, MoonBrandDarkBase64 } from '../assets/branding/BrandAssets';

interface MoonLogoProps {
  size?: number;
  variant?: 'light' | 'dark';  // 'light' = white logo (for dark bg), 'dark' = black (for light bg)
  style?: ViewStyle;
}

const MoonLogo: React.FC<MoonLogoProps> = ({
  size = 32,
  variant = 'light',
  style,
}) => {
  const sourceUri =
    variant === 'dark'
      ? MoonBrandDarkBase64
      : MoonBrandLightBase64;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={{ uri: sourceUri }}
        style={{ width: size * 0.8, height: size * 0.8 }}
        resizeMode="contain"
        accessibilityLabel="Moonlight AI"
        accessibilityRole="image"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MoonLogo;

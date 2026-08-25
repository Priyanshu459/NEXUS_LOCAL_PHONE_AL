/**
 * MoonLogo — Reusable brand logo component
 *
 * Uses the official Moonlight AI website icon.
 *
 * Usage:
 *   <MoonLogo size={40} />                    // on dark background (default)
 *   <MoonLogo size={40} variant="dark" />     // on light background
 */

import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface MoonLogoProps {
  size?: number;
  variant?: 'light' | 'dark';
  style?: ViewStyle;
}

const MoonLogo: React.FC<MoonLogoProps> = ({
  size = 32,
  variant: _variant = 'light',
  style,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        source={require('../assets/moon_icon.png')}
        style={{ width: size, height: size }}
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
    overflow: 'hidden',
  },
});

export default MoonLogo;

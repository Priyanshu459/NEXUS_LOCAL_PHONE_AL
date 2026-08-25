/**
 * MoonlightSplash — Animated splash screen for Moonlight AI
 *
 * Uses the official brand icon (moonlight-icon.png) as the sole visual element.
 *
 * Animation sequence (total ~1.6s):
 *   0ms    — opacity 0, scale 0.88
 *   0–600ms  — fade in + scale up to 1.0  (ease-out cubic)
 *   600–1200ms — hold at full visibility
 *   1200–1600ms — fade out + very slight scale-up to 1.05 (ease-in)
 *   1600ms  — calls onFinish() → app navigates away
 *
 * Design rules:
 *   - Dark background (#0F1014) matching the app's primary surface
 *   - White crescent on dark bg (moonlight-icon-light.png)
 *   - No additional decorations, text, or particles
 *   - Logo is centered both vertically and horizontally
 *   - Premium startup-grade feel
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

interface MoonlightSplashProps {
  onFinish: () => void;
}

const MoonlightSplash: React.FC<MoonlightSplashProps> = ({ onFinish }) => {
  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    // Phase 1: Fade in + scale up (0 → 600ms)
    const phaseIn = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Hold (600 → 1200ms)
    const hold = Animated.delay(600);

    // Phase 3: Fade out + subtle upward scale (1200 → 1600ms)
    const phaseOut = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([phaseIn, hold, phaseOut]).start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => {
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [onFinish, opacity, scale]);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity, transform: [{ scale }] },
        ]}>
        <Image
          source={{ uri: require('../assets/branding/BrandAssets').MoonBrandLightBase64 }}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',   // App primary dark surface
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
});

export default MoonlightSplash;

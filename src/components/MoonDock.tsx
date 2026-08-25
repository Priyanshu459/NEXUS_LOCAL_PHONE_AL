import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StudioIcon, VaultIcon } from './GoogleIcons';
import MoonLogo from './MoonLogo';
import { DOCK_HEIGHT } from '../constants/layout';

export function MoonDock({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Animation for the lunar orbit indicator
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3 equal-width tabs. Indicator translates by state.index
    Animated.timing(translateX, {
      toValue: state.index,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Cannot use native driver for width % or left % easily in older RN, but we use it here safely
    }).start();
  }, [state.index, translateX]);

  return (
    <View style={[styles.dockContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.dockSurface}>
        {/* The Animated Lunar Orbit Indicator */}
        <Animated.View 
          style={[
            styles.lunarOrbit,
            {
              width: '33.333%',
              left: translateX.interpolate({
                inputRange: [0, 1, 2],
                outputRange: ['0%', '33.333%', '66.666%']
              })
            }
          ]}
        >
          <View style={styles.lunarOrbitInner} />
        </Animated.View>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const color = isFocused ? '#FFFFFF' : '#94A3B8';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                {route.name === 'Home' && <StudioIcon active={isFocused} />}
                {route.name === 'Tools' && <MoonLogo size={22} variant="light" />}
                {route.name === 'Models' && <VaultIcon active={isFocused} />}
              </View>
              <Text style={[styles.tabLabel, { color }]}>
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  dockSurface: {
    flexDirection: 'row',
    backgroundColor: '#1E2024',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    height: DOCK_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  lunarOrbit: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lunarOrbitInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderTopWidth: 1.5,
    borderTopColor: '#6366F1',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    zIndex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigationItem } from './BottomNavigationItem';

import { DOCK_HEIGHT } from '../constants/layout';
import { Theme } from '../constants/theme';

export function MoonDock({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.dockContainer,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.dockSurface}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = String(
            options.tabBarLabel ?? options.title ?? route.name,
          );
          const selected = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!selected && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const icon = (
            <Text
              style={{
                color: selected ? Theme.color.accent : Theme.color.textMuted,
                fontSize: 22,
              }}
            >
              {route.name === 'Home' ? '◒' : route.name === 'Tools' ? '✧' : '▤'}
            </Text>
          );

          return (
            <BottomNavigationItem
              key={route.key}
              label={route.name === 'Tools' ? 'Explore' : label}
              selected={selected}
              icon={icon}
              onPress={onPress}
              accessibilityLabel={
                options.tabBarAccessibilityLabel || `${route.name} tab`
              }
            />
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
    paddingHorizontal: 12,
  },
  dockSurface: {
    height: DOCK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    backgroundColor: Theme.color.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.color.border,
    overflow: 'hidden',
  },
});

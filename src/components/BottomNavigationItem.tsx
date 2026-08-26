import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Theme } from '../constants/theme';

const TRANSITION_MS = 180;

type BottomNavigationItemProps = {
  label: string;
  selected: boolean;
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
};

export function BottomNavigationItem({
  label,
  selected,
  icon,
  onPress,
  accessibilityLabel,
}: BottomNavigationItemProps) {
  const selectedOpacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectedOpacity, {
      toValue: selected ? 1 : 0,
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selected, selectedOpacity]);

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.pill}>
        <Animated.View
          pointerEvents="none"
          style={[styles.selectedBackground, { opacity: selectedOpacity }]}
        />
        <View style={styles.icon}>{icon}</View>
        <Text
          style={[styles.label, selected && styles.selectedLabel]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingHorizontal: 3,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: '100%',
    maxWidth: 108,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 15,
    backgroundColor: Theme.color.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(124, 140, 255, 0.32)',
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Theme.color.textMuted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedLabel: {
    color: Theme.color.text,
    fontWeight: '700',
  },
});

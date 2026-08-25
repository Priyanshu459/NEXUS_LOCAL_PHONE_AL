import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ContextualActionProps = {
  title: string;
  subtitle?: string;
  primaryAction: { label: string; onPress: () => void; color?: string };
  secondaryAction?: { label: string; onPress: () => void; color?: string };
  progress?: number;
  bottomOffset?: number; // Distance above the dock or bottom
};

export function ContextualBottomAction({
  title, subtitle, primaryAction, secondaryAction, progress, bottomOffset = 0
}: ContextualActionProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 16) + bottomOffset }]}>
      <View style={styles.surface}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          {progress !== undefined && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          {secondaryAction && (
            <TouchableOpacity 
              style={[styles.btn, styles.secondaryBtn]}
              onPress={secondaryAction.onPress}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: secondaryAction.color || '#F8FAFC' }]}>
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.btn, styles.primaryBtn, primaryAction.color ? { backgroundColor: primaryAction.color + '25', borderColor: primaryAction.color } : {}]}
            onPress={primaryAction.onPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: primaryAction.color || '#00F2FE' }]}>
              {primaryAction.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  surface: {
    backgroundColor: '#1E2024',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

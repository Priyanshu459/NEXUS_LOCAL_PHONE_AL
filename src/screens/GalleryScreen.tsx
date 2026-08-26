import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { GalleryCardIcon, VaultIcon } from '../components/GoogleIcons';
import { DOCK_RESERVED_SPACE } from '../constants/layout';
import { Theme } from '../constants/theme';

const TOOLS = [
  {
    id: 'chat',
    icon: 'ai_chat',
    title: 'Chat',
    desc: 'Talk privately with the selected on-device model.',
  },
  {
    id: 'models',
    icon: 'models',
    title: 'Models',
    desc: 'Download, inspect, and activate compatible GGUF models.',
  },
  {
    id: 'settings',
    icon: 'settings',
    title: 'Settings',
    desc: 'Adjust generation, memory, privacy, and storage options.',
  },
  {
    id: 'voice',
    icon: 'audio_scribe',
    title: 'Voice Input',
    desc: 'Open chat and dictate using your device speech service.',
  },
] as const;

export function GalleryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const useSingleColumn = width < 380 || fontScale > 1.25;

  const openTool = (id: (typeof TOOLS)[number]['id']) => {
    if (id === 'models') navigation.navigate('Models');
    else if (id === 'settings') navigation.navigate('Settings');
    else navigation.navigate('Chat');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Tools"
        subtitle="Working on-device capabilities"
        onMenuPress={() => navigation.navigate('Settings')}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + DOCK_RESERVED_SPACE },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Choose what you want to do</Text>
        <Text style={styles.intro}>
          Every tool below opens a complete, usable workflow.
        </Text>
        <View style={styles.grid}>
          {TOOLS.map(tool => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.card, useSingleColumn && styles.cardWide]}
              onPress={() => openTool(tool.id)}
              accessibilityRole="button"
              accessibilityLabel={`${tool.title}. ${tool.desc}`}
              activeOpacity={0.68}
            >
              {tool.id === 'models' ? (
                <View style={styles.modelIcon}>
                  <VaultIcon active />
                </View>
              ) : (
                <GalleryCardIcon
                  type={tool.icon}
                  color={Theme.color.accent}
                  size={42}
                />
              )}
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{tool.title}</Text>
                <Text style={styles.cardDescription}>{tool.desc}</Text>
              </View>
              <Text style={styles.openLabel}>
                {tool.id === 'models'
                  ? 'Manage models'
                  : tool.id === 'settings'
                  ? 'Open settings'
                  : tool.id === 'voice'
                  ? 'Open voice input'
                  : 'Start chat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.color.background },
  content: { padding: Theme.space.lg },
  heading: {
    color: Theme.color.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: Theme.space.sm,
  },
  intro: {
    color: Theme.color.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: Theme.space.lg,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.space.md },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
    minHeight: 184,
    backgroundColor: Theme.color.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.color.border,
    padding: Theme.space.lg,
  },
  cardWide: { flexBasis: '100%', minHeight: 154 },
  modelIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Theme.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1, marginTop: Theme.space.md },
  cardTitle: { color: Theme.color.text, fontSize: 17, fontWeight: '700' },
  cardDescription: {
    color: Theme.color.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  openLabel: {
    color: Theme.color.accent,
    fontSize: 12,
    fontWeight: '800',
    marginTop: Theme.space.md,
  },
});

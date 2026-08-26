import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GColor } from '../components/GoogleIcons';
import { AppHeader } from '../components/AppHeader';
import { getSettings } from '../services/storage';
import {
  checkModelExists,
  getModelFilenameFromUrl,
} from '../services/modelManager';
import { DOCK_RESERVED_SPACE } from '../constants/layout';

const PROMPT_TEMPLATES = [
  {
    id: '1',
    title: 'Summarize Document',
    desc: 'Pull out decisions, risks, and action items from pasted text or an attached file.',
    prompt:
      'Please summarize the following content into 3 clear bullet points with key takeaways:\n\n',
  },
  {
    id: '2',
    title: 'Review Code',
    desc: 'Find bugs, simplify structure, and suggest focused improvements.',
    prompt:
      'Review this code for bugs, optimize its performance, and add clean documentation:\n\n',
  },
  {
    id: '3',
    title: 'Plan Architecture',
    desc: 'Compare options, tradeoffs, and a practical path forward.',
    prompt:
      'Act as a Principal System Architect. Provide 5 architectural approaches for:\n\n',
  },
  {
    id: '4',
    title: 'Rewrite Clearly',
    desc: 'Turn rough notes or transcripts into polished, useful prose.',
    prompt:
      'Translate and polish this transcribed text into professional business English:\n\n',
  },
];

export function WorkspaceScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [modelInstalled, setModelInstalled] = useState(false);
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    checkModelExists(getModelFilenameFromUrl(settings.modelUrl)).then(
      setModelInstalled,
    );
  }, [settings.modelUrl]);

  useEffect(
    () => navigation.addListener('focus', () => setSettings(getSettings())),
    [navigation],
  );

  const handleLaunchChat = (initialPrompt?: string) => {
    navigation.navigate('Chat', initialPrompt ? { initialPrompt } : undefined);
  };

  return (
    <View style={[S.screen, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <AppHeader
        title="Moonlight AI"
        subtitle="Private, on-device workspace"
        onMenuPress={() => navigation.navigate('Settings')}
        trailing={
          <TouchableOpacity
            style={S.telemetryBtn}
            onPress={() => setShowTelemetry(!showTelemetry)}
            accessibilityRole="button"
            accessibilityLabel="Open local AI status"
            activeOpacity={0.7}
          >
            <View
              style={[
                S.dot,
                { backgroundColor: modelInstalled ? GColor.green : '#F4C56A' },
              ]}
            />
            <Text style={S.telemetryBtnText}>Status</Text>
          </TouchableOpacity>
        }
      />

      {/* ── Developer Telemetry Overlay ───────────────────────────────────── */}
      {showTelemetry && (
        <View style={S.telemetryCard}>
          <View style={S.telemetryHeader}>
            <Text style={S.telemetryTitle}>Local Status</Text>
            <TouchableOpacity onPress={() => setShowTelemetry(false)}>
              <Text style={{ color: GColor.textMuted, fontSize: 20 }}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={S.telemetryGrid}>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Model</Text>
              <Text style={S.telemetryVal}>
                {modelInstalled
                  ? 'Installed and selected'
                  : 'Download required'}
              </Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Chat processing</Text>
              <Text style={S.telemetryVal}>
                {modelInstalled
                  ? 'Runs on this device'
                  : 'Unavailable until setup'}
              </Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Internet</Text>
              <Text style={S.telemetryVal}>
                {modelInstalled
                  ? 'Not required for text chat'
                  : 'Required to download a model'}
              </Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Selected model</Text>
              <Text style={S.telemetryVal} numberOfLines={1}>
                {settings.modelUrl
                  ? settings.modelUrl.split('/').pop()
                  : 'None'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Main Tab Content ──────────────────────────────────────────────── */}
      <ScrollView
        style={S.content}
        contentContainerStyle={{
          paddingBottom: insets.bottom + DOCK_RESERVED_SPACE,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 20, marginTop: 16 }}>
          {/* Hero Welcome Banner */}
          <View style={S.heroCard}>
            <View style={S.heroTopRow}>
              <View style={S.heroStatusPill}>
                <View
                  style={[
                    S.dot,
                    {
                      backgroundColor: modelInstalled
                        ? GColor.green
                        : '#F4C56A',
                    },
                  ]}
                />
                <Text style={S.heroStatusText}>
                  {modelInstalled
                    ? 'Model ready · local chat'
                    : 'Model download needed'}
                </Text>
              </View>
            </View>
            <Text style={S.heroTitle}>How can I help today?</Text>
            <Text style={S.heroDesc}>
              Start a focused conversation, attach text files, or choose a
              reusable prompt. The interface stays quiet so the work can stay
              clear.
            </Text>
            <TouchableOpacity
              style={S.launchStudioBtn}
              onPress={() => handleLaunchChat()}
              activeOpacity={0.85}
            >
              <Text style={S.launchStudioBtnText}>Start Chat</Text>
            </TouchableOpacity>
          </View>

          {/* M3 Assist Chips / Prompt Starters */}
          <View>
            <Text style={S.sectionLabel}>Suggested Tasks</Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              {PROMPT_TEMPLATES.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[S.templateCard]}
                  onPress={() => {
                    handleLaunchChat(item.prompt);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.desc}`}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={S.templateTitle}>{item.title}</Text>
                    <View style={S.arrowPill}>
                      <Text
                        style={{
                          color: GColor.blue,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {item.id === '1'
                          ? 'Summarize'
                          : item.id === '2'
                          ? 'Review code'
                          : item.id === '3'
                          ? 'Start planning'
                          : 'Rewrite'}
                      </Text>
                    </View>
                  </View>
                  <Text style={S.templateDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GColor.bg },
  telemetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GColor.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GColor.border,
  },
  telemetryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: GColor.textPrimary,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  telemetryCard: {
    margin: 16,
    padding: 14,
    backgroundColor: GColor.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GColor.green + '40',
    gap: 10,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GColor.textPrimary,
  },
  telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  telemetryItem: { width: '46%', gap: 2 },
  telemetryLabel: { fontSize: 11, color: GColor.textSecondary },
  telemetryVal: { fontSize: 12, fontWeight: '600', color: GColor.textPrimary },
  content: { flex: 1 },
  heroCard: {
    backgroundColor: GColor.surfaceHigh,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GColor.border,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GColor.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: GColor.textSecondary,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: GColor.textPrimary },
  heroDesc: { fontSize: 14, color: GColor.textSecondary, lineHeight: 21 },
  launchStudioBtn: {
    backgroundColor: GColor.textPrimary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  launchStudioBtnText: { fontSize: 14, fontWeight: '800', color: GColor.bg },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: GColor.textSecondary,
    letterSpacing: 0,
  },
  templateCard: {
    backgroundColor: GColor.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GColor.border,
    gap: 6,
  },
  templateTitle: { fontSize: 15, fontWeight: '700', color: GColor.textPrimary },
  templateDesc: { fontSize: 12, color: GColor.textSecondary, lineHeight: 18 },
  arrowPill: {
    backgroundColor: GColor.blue + '18',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
});

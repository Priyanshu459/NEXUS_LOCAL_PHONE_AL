import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GColor, MenuIcon,
} from '../components/GoogleIcons';
import MoonLogo from '../components/MoonLogo';
import { getSettings } from '../services/storage';
import { DOCK_RESERVED_SPACE } from '../constants/layout';



const PROMPT_TEMPLATES = [
  { id: '1', title: 'Summarize Document', desc: 'Pull out decisions, risks, and action items from pasted text or an attached file.', prompt: 'Please summarize the following content into 3 clear bullet points with key takeaways:\n\n' },
  { id: '2', title: 'Review Code', desc: 'Find bugs, simplify structure, and suggest focused improvements.', prompt: 'Review this code for bugs, optimize its performance, and add clean documentation:\n\n' },
  { id: '3', title: 'Plan Architecture', desc: 'Compare options, tradeoffs, and a practical path forward.', prompt: 'Act as a Principal System Architect. Provide 5 architectural approaches for:\n\n' },
  { id: '4', title: 'Rewrite Clearly', desc: 'Turn rough notes or transcripts into polished, useful prose.', prompt: 'Translate and polish this transcribed text into professional business English:\n\n' },
];

export function WorkspaceScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const settings = getSettings();

  const handleLaunchChat = (initialPrompt?: string) => {
    navigation.navigate('Chat', initialPrompt ? { initialPrompt } : undefined);
  };

  return (
    <View style={[S.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={GColor.bg} />

      {/* ── Top App Bar (M3 Floating Style) ───────────────────────────────── */}
      <View style={S.appBar}>
        <View style={S.brandRow}>
          <MoonLogo size={36} variant="light" />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={S.brandTitle}>Moonlight AI</Text>
              <View style={S.edgeBadge}>
                <Text style={S.edgeBadgeText}>LOCAL AI</Text>
              </View>
            </View>
              <Text style={S.brandSub}>Private assistant workspace</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={S.telemetryBtn}
            onPress={() => setShowTelemetry(!showTelemetry)}
            activeOpacity={0.7}
          >
            <View style={[S.dot, { backgroundColor: GColor.green }]} />
            <Text style={S.telemetryBtnText}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={S.iconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <MenuIcon color={GColor.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Developer Telemetry Overlay ───────────────────────────────────── */}
      {__DEV__ && showTelemetry && (
        <View style={S.telemetryCard}>
          <View style={S.telemetryHeader}>
            <Text style={S.telemetryTitle}>Local Status</Text>
            <TouchableOpacity onPress={() => setShowTelemetry(false)}>
              <Text style={{ color: GColor.textMuted, fontSize: 20 }}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={S.telemetryGrid}>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Engine Bridge</Text>
              <Text style={S.telemetryVal}>Llama.rn JNI / C++</Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Acceleration</Text>
              <Text style={[S.telemetryVal, { color: GColor.green }]}>CPU local runtime</Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>RAM Allocation</Text>
              <Text style={S.telemetryVal}>Depends on model</Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Loaded Model</Text>
              <Text style={S.telemetryVal} numberOfLines={1}>
                {settings.modelUrl ? settings.modelUrl.split('/').pop() : 'None'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Main Tab Content ──────────────────────────────────────────────── */}
      <ScrollView
        style={S.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + DOCK_RESERVED_SPACE, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 20, marginTop: 16 }}>
          {/* Hero Welcome Banner */}
          <View style={S.heroCard}>
            <View style={S.heroTopRow}>
              <MoonLogo size={32} variant="light" />
              <View style={S.heroStatusPill}>
                <View style={[S.dot, { backgroundColor: GColor.blue }]} />
                <Text style={S.heroStatusText}>Local chat after setup</Text>
              </View>
            </View>
            <Text style={S.heroTitle}>How can I help today?</Text>
            <Text style={S.heroDesc}>
              Start a focused conversation, attach text files, or choose a reusable prompt. The interface stays quiet so the work can stay clear.
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
              {PROMPT_TEMPLATES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    S.templateCard,
                    selectedTemplate === item.id && { borderColor: GColor.blue, backgroundColor: GColor.blue + '15' },
                  ]}
                  onPress={() => {
                    setSelectedTemplate(item.id);
                    handleLaunchChat(item.prompt);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={S.templateTitle}>{item.title}</Text>
                    <View style={S.arrowPill}>
                      <Text style={{ color: GColor.blue, fontSize: 12, fontWeight: '700' }}>Open</Text>
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
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12, backgroundColor: GColor.bg,
    borderBottomWidth: 1, borderBottomColor: GColor.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: GColor.textPrimary },
  brandSub: { fontSize: 12, color: GColor.textMuted, marginTop: 2 },
  edgeBadge: {
    backgroundColor: GColor.surfaceHigh, paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: GColor.border,
  },
  edgeBadgeText: { fontSize: 9, fontWeight: '800', color: GColor.textSecondary },
  telemetryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GColor.surface, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 16, borderWidth: 1, borderColor: GColor.border,
  },
  telemetryBtnText: { fontSize: 11, fontWeight: '700', color: GColor.textPrimary },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: GColor.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GColor.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  telemetryCard: {
    margin: 16, padding: 14, backgroundColor: GColor.surfaceHigh,
    borderRadius: 12, borderWidth: 1, borderColor: GColor.green + '40', gap: 10,
  },
  telemetryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  telemetryTitle: { fontSize: 13, fontWeight: '700', color: GColor.textPrimary },
  telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  telemetryItem: { width: '46%', gap: 2 },
  telemetryLabel: { fontSize: 11, color: GColor.textSecondary },
  telemetryVal: { fontSize: 12, fontWeight: '600', color: GColor.textPrimary },
  content: { flex: 1 },
  heroCard: {
    backgroundColor: GColor.surfaceHigh, padding: 22, borderRadius: 18,
    borderWidth: 1, borderColor: GColor.border, gap: 12,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GColor.surfaceHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  heroStatusText: { fontSize: 11, fontWeight: '600', color: GColor.textSecondary },
  heroTitle: { fontSize: 28, fontWeight: '800', color: GColor.textPrimary },
  heroDesc: { fontSize: 14, color: GColor.textSecondary, lineHeight: 21 },
  launchStudioBtn: {
    backgroundColor: GColor.textPrimary, paddingVertical: 13, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  launchStudioBtnText: { fontSize: 14, fontWeight: '800', color: GColor.bg },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: GColor.textSecondary, letterSpacing: 0 },
  templateCard: {
    backgroundColor: GColor.surface, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: GColor.border, gap: 6,
  },
  templateTitle: { fontSize: 15, fontWeight: '700', color: GColor.textPrimary },
  templateDesc: { fontSize: 12, color: GColor.textSecondary, lineHeight: 18 },
  arrowPill: { backgroundColor: GColor.blue + '18', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
});

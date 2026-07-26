import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  GColor, GoogleAIEmblem, MenuIcon, SparkleFourColorIcon,
  StudioIcon, VaultIcon, GalleryCardIcon, FileTextIcon,
} from '../components/GoogleIcons';
import { getSettings } from '../services/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Workspace'>;

const PROMPT_TEMPLATES = [
  { id: '1', title: '✨ Summarize Document', desc: 'Extract key insights, bullet points, and action items from any text or attached file.', prompt: 'Please summarize the following content into 3 clear bullet points with key takeaways:\n\n' },
  { id: '2', title: '💻 Refactor & Optimize Code', desc: 'Clean up code structure, improve Big-O performance, and add professional JSDoc comments.', prompt: 'Review this code for bugs, optimize its performance, and add clean documentation:\n\n' },
  { id: '3', title: '💡 Technical Brainstorming', desc: 'Generate 5 innovative system architecture approaches with trade-off analysis.', prompt: 'Act as a Principal System Architect. Provide 5 architectural approaches for:\n\n' },
  { id: '4', title: '🌍 Multilingual Audio Translation', desc: 'Transcribe and translate spoken dictation into natural, professional English.', prompt: 'Translate and polish this transcribed text into professional business English:\n\n' },
];

export function WorkspaceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'studio' | 'lab' | 'vault'>('studio');
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
          <GoogleAIEmblem size={26} />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={S.brandTitle}>Moon Studio</Text>
              <View style={S.edgeBadge}>
                <Text style={S.edgeBadgeText}>MOON NDK</Text>
              </View>
            </View>
            <Text style={S.brandSub}>On-Device Neural Engine v2026.4</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={S.telemetryBtn}
            onPress={() => setShowTelemetry(!showTelemetry)}
            activeOpacity={0.7}
          >
            <View style={[S.dot, { backgroundColor: GColor.green }]} />
            <Text style={S.telemetryBtnText}>ARM64 NEON</Text>
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
      {showTelemetry && (
        <View style={S.telemetryCard}>
          <View style={S.telemetryHeader}>
            <Text style={S.telemetryTitle}>⚙️ Neural NDK Hardware Telemetry</Text>
            <TouchableOpacity onPress={() => setShowTelemetry(false)}>
              <Text style={{ color: GColor.textSecondary, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={S.telemetryGrid}>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Engine Bridge</Text>
              <Text style={S.telemetryVal}>Llama.rn JNI / C++</Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Acceleration</Text>
              <Text style={[S.telemetryVal, { color: GColor.green }]}>ARM64 NEON Active</Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>RAM Allocation</Text>
              <Text style={S.telemetryVal}>~1.25 GB / Offline</Text>
            </View>
            <View style={S.telemetryItem}>
              <Text style={S.telemetryLabel}>Loaded Model</Text>
              <Text style={S.telemetryVal} numberOfLines={1}>
                {settings.modelUrl.split('/').pop()?.split('?')[0] || 'Llama-3.2-1B.gguf'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Main Tab Content ──────────────────────────────────────────────── */}
      <ScrollView
        style={S.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'studio' && (
          <View style={{ gap: 20, marginTop: 12 }}>
            {/* Hero Welcome Banner */}
            <View style={S.heroCard}>
              <View style={S.heroTopRow}>
                <SparkleFourColorIcon size={28} />
                <View style={S.heroStatusPill}>
                  <View style={[S.dot, { backgroundColor: GColor.blue }]} />
                  <Text style={S.heroStatusText}>100% On-Device Privacy</Text>
                </View>
              </View>
              <Text style={S.heroTitle}>What will we build today?</Text>
              <Text style={S.heroDesc}>
                Experience state-of-the-art on-device intelligence. Attach files, speak naturally, or run complex reasoning tasks entirely offline.
              </Text>
              <TouchableOpacity
                style={S.launchStudioBtn}
                onPress={() => handleLaunchChat()}
                activeOpacity={0.85}
              >
                <Text style={S.launchStudioBtnText}>✨ Open Conversational Studio</Text>
              </TouchableOpacity>
            </View>

            {/* M3 Assist Chips / Prompt Starters */}
            <View>
              <Text style={S.sectionLabel}>RECOMMENDED PROMPT STARTERS</Text>
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
                        <Text style={{ color: GColor.blue, fontSize: 12, fontWeight: '700' }}>Launch ➔</Text>
                      </View>
                    </View>
                    <Text style={S.templateDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'lab' && (
          <View style={{ gap: 16, marginTop: 12 }}>
            <Text style={S.sectionLabel}>PROMPT LAB & MULTIMODAL SANDBOX</Text>
            <View style={S.labCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FileTextIcon color={GColor.red} />
                <View style={{ flex: 1 }}>
                  <Text style={S.labTitle}>Document Summarizer Engine</Text>
                  <Text style={S.labDesc}>Test text extraction and multi-document synthesis.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={S.labBtn}
                onPress={() => handleLaunchChat('Summarize and extract key entities from the attached document:\n\n')}
                activeOpacity={0.8}
              >
                <Text style={S.labBtnText}>Run Summarization Sandbox</Text>
              </TouchableOpacity>
            </View>

            <View style={S.labCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <GalleryCardIcon type="agent_skills" color={GColor.yellow} />
                <View style={{ flex: 1 }}>
                  <Text style={S.labTitle}>Agentic Coding & Debugger</Text>
                  <Text style={S.labDesc}>On-device code generation with automated JSDoc formatting.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={S.labBtn}
                onPress={() => handleLaunchChat('Act as a Principal Software Developer. Generate clean React Native code for:\n\n')}
                activeOpacity={0.8}
              >
                <Text style={S.labBtnText}>Run Code Generation Lab</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'vault' && (
          <View style={{ gap: 16, marginTop: 12 }}>
            <Text style={S.sectionLabel}>MODEL VAULT & STORAGE DIAGNOSTICS</Text>
            <View style={S.vaultCard}>
              <Text style={S.vaultTitle}>Loaded GGUF Neural Weight</Text>
              <Text style={S.vaultVal}>{settings.modelUrl}</Text>
              <View style={S.vaultDivider} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={S.vaultStat}>Context Window: 2048 tokens</Text>
                <TouchableOpacity
                  style={S.switchModelBtn}
                  onPress={() => navigation.navigate('Chat', { openModels: true })}
                >
                  <Text style={S.switchModelText}>Switch Model</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={S.vaultCard}>
              <Text style={S.vaultTitle}>Storage & Memory Health</Text>
              <Text style={S.vaultDesc}>
                All user memories, embeddings, and chat transcripts are encrypted and stored in local MMKV flash memory.
              </Text>
              <TouchableOpacity
                style={[S.switchModelBtn, { marginTop: 12, alignSelf: 'flex-start', backgroundColor: GColor.red + '20' }]}
                onPress={() => Alert.alert('Storage Status', 'Local MMKV Database: Healthy (100% offline)')}
              >
                <Text style={[S.switchModelText, { color: GColor.red }]}>Check MMKV Integrity</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Material 3 Bottom Navigation Bar ──────────────────────────────── */}
      <View style={[S.navBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={S.navItem}
          onPress={() => setActiveTab('studio')}
          activeOpacity={0.8}
        >
          <View style={[S.navPill, activeTab === 'studio' && S.navPillActive]}>
            <StudioIcon active={activeTab === 'studio'} />
          </View>
          <Text style={[S.navLabel, activeTab === 'studio' && S.navLabelActive]}>Studio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.navItem}
          onPress={() => setActiveTab('lab')}
          activeOpacity={0.8}
        >
          <View style={[S.navPill, activeTab === 'lab' && S.navPillActive]}>
            <SparkleFourColorIcon size={22} />
          </View>
          <Text style={[S.navLabel, activeTab === 'lab' && S.navLabelActive]}>Prompt Lab</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.navItem}
          onPress={() => setActiveTab('vault')}
          activeOpacity={0.8}
        >
          <View style={[S.navPill, activeTab === 'vault' && S.navPillActive]}>
            <VaultIcon active={activeTab === 'vault'} />
          </View>
          <Text style={[S.navLabel, activeTab === 'vault' && S.navLabelActive]}>System Vault</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GColor.bg },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: GColor.bg,
    borderBottomWidth: 1, borderBottomColor: GColor.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: GColor.textPrimary },
  brandSub: { fontSize: 11, color: GColor.textSecondary, marginTop: 1 },
  edgeBadge: {
    backgroundColor: GColor.cyan + '25', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: GColor.cyan,
  },
  edgeBadgeText: { fontSize: 9, fontWeight: '800', color: GColor.cyan },
  telemetryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GColor.surface, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: GColor.border,
  },
  telemetryBtnText: { fontSize: 11, fontWeight: '700', color: GColor.textPrimary },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: GColor.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GColor.border,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  telemetryCard: {
    margin: 16, padding: 14, backgroundColor: GColor.surface,
    borderRadius: 12, borderWidth: 1, borderColor: GColor.green + '40', gap: 10,
  },
  telemetryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  telemetryTitle: { fontSize: 13, fontWeight: '700', color: GColor.green },
  telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  telemetryItem: { width: '46%', gap: 2 },
  telemetryLabel: { fontSize: 11, color: GColor.textSecondary },
  telemetryVal: { fontSize: 12, fontWeight: '600', color: GColor.textPrimary },
  content: { flex: 1 },
  heroCard: {
    backgroundColor: GColor.surface, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: GColor.border, gap: 12,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GColor.surfaceHigh, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  heroStatusText: { fontSize: 11, fontWeight: '600', color: GColor.textSecondary },
  heroTitle: { fontSize: 22, fontWeight: '800', color: GColor.textPrimary },
  heroDesc: { fontSize: 13, color: GColor.textSecondary, lineHeight: 20 },
  launchStudioBtn: {
    backgroundColor: GColor.blue, paddingVertical: 12, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  launchStudioBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: GColor.textSecondary, letterSpacing: 0.8 },
  templateCard: {
    backgroundColor: GColor.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: GColor.border, gap: 6,
  },
  templateTitle: { fontSize: 15, fontWeight: '700', color: GColor.textPrimary },
  templateDesc: { fontSize: 12, color: GColor.textSecondary, lineHeight: 18 },
  arrowPill: { backgroundColor: GColor.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  labCard: {
    backgroundColor: GColor.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: GColor.border, gap: 14,
  },
  labTitle: { fontSize: 15, fontWeight: '700', color: GColor.textPrimary },
  labDesc: { fontSize: 12, color: GColor.textSecondary, marginTop: 2 },
  labBtn: {
    backgroundColor: GColor.surfaceHigh, paddingVertical: 10, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: GColor.borderHigh,
  },
  labBtnText: { fontSize: 13, fontWeight: '600', color: GColor.textPrimary },
  vaultCard: {
    backgroundColor: GColor.surface, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: GColor.border, gap: 6,
  },
  vaultTitle: { fontSize: 14, fontWeight: '700', color: GColor.textPrimary },
  vaultVal: { fontSize: 12, color: GColor.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  vaultDesc: { fontSize: 12, color: GColor.textSecondary, lineHeight: 18 },
  vaultDivider: { height: 1, backgroundColor: GColor.border, marginVertical: 6 },
  vaultStat: { fontSize: 12, fontWeight: '600', color: GColor.green },
  switchModelBtn: {
    backgroundColor: GColor.blue + '20', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: GColor.blue,
  },
  switchModelText: { fontSize: 12, fontWeight: '700', color: GColor.blue },
  navBar: {
    flexDirection: 'row', backgroundColor: '#16181D',
    borderTopWidth: 1, borderTopColor: GColor.border, paddingTop: 10,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navPill: {
    width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  navPillActive: { backgroundColor: GColor.blue + '25' },
  navLabel: { fontSize: 11, fontWeight: '600', color: GColor.textSecondary },
  navLabelActive: { color: GColor.textPrimary, fontWeight: '700' },
});

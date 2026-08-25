import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, Easing, Alert, Switch, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getSettings, saveSettings, AppSettings, defaultSettings } from '../services/storage';
import { getMemories, deleteMemory, memoryStorage, Fact } from '../services/MemoryManager';
import MoonLogo from '../components/MoonLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const C = {
  bg: '#0F1014',
  surface: '#191A20',
  surfaceHigh: '#24262F',
  border: 'rgba(255, 255, 255, 0.10)',
  borderHigh: 'rgba(255, 255, 255, 0.18)',
  accent: '#6EA8FE',
  accentDim: '#1B355C',
  textPrimary: '#F4F4F5',
  textSecondary: '#B5BAC4',
  textMuted: '#777D89',
  green: '#24D3B5',
  red: '#FF5A7A',
  purple: '#B08CFF',
  indigo: '#6EA8FE',
  pink: '#FF8A5B',
};

// Back Icon
const BackIcon = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
    <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderRightWidth: 7, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: C.textSecondary }} />
    <View style={{ width: 7, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1 }} />
  </View>
);

// Stepper Slider
function Slider({ value, min, max, step, color, onChange }: {
  value: number; min: number; max: number; step: number; color: string; onChange: (v: number) => void;
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const dec = () => onChange(parseFloat(Math.max(min, value - step).toFixed(2)));
  const inc = () => onChange(parseFloat(Math.min(max, value + step).toFixed(2)));

  return (
    <View style={sl.row}>
      <TouchableOpacity style={[sl.btn, { borderColor: color + '30' }]} onPress={dec} activeOpacity={0.7}>
        <View style={{ width: 10, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1 }} />
      </TouchableOpacity>
      <View style={sl.trackArea}>
        <View style={sl.track}>
          <View style={[sl.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        </View>
        <View style={[sl.thumb, {
          left: `${pct * 100}%`,
          borderColor: color,
          shadowColor: color,
        }]} />
      </View>
      <TouchableOpacity style={[sl.btn, { borderColor: color + '30' }]} onPress={inc} activeOpacity={0.7}>
        <View style={{ width: 10, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1 }} />
        <View style={{ width: 1.5, height: 10, backgroundColor: C.textSecondary, borderRadius: 1, position: 'absolute' }} />
      </TouchableOpacity>
    </View>
  );
}

const sl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.surfaceHigh, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  trackArea: { flex: 1, height: 20, justifyContent: 'center', position: 'relative' },
  track: { height: 3, backgroundColor: C.border, borderRadius: 100, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 100 },
  thumb: {
    position: 'absolute', top: 2, width: 16, height: 16,
    borderRadius: 8, backgroundColor: C.bg, borderWidth: 2,
    marginLeft: -8,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 4,
  },
});

// Section Header
function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// Param row
function ParamItem({ label, desc, value, min, max, step, color, onChange }: {
  label: string; desc: string; value: number; min: number; max: number;
  step: number; color: string; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.paramItem}>
      <View style={styles.paramTopRow}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text style={styles.paramLabel}>{label}</Text>
          <Text style={styles.paramDesc}>{desc}</Text>
        </View>
        <View style={[styles.valuePill, { borderColor: color + '35' }]}>
          <Text style={[styles.valueNum, { color }]}>{value.toFixed(step < 1 ? 1 : 0)}</Text>
        </View>
      </View>
      <Slider value={value} min={min} max={max} step={step} color={color} onChange={onChange} />
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [memories, setMemories] = useState<Fact[]>([]);

  useEffect(() => {
    setSettings(getSettings());
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  if (!settings) return null;

  const update = (k: keyof AppSettings, v: any) => {
    const next = { ...settings, [k]: v };
    setSettings(next);
    saveSettings(next);
  };

  const reset = () =>
    Alert.alert('Reset to defaults', 'All settings will return to their default values.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: () => { setSettings(defaultSettings); saveSettings(defaultSettings); },
      },
    ]);

  const openMemoryModal = () => {
    setMemories(getMemories());
    setMemoryModalVisible(true);
  };

  const handleDeleteMemory = (id: string) => {
    deleteMemory(id);
    setMemories(getMemories());
  };

  const handleClearAllMemories = () => {
    Alert.alert('Clear All Memories', 'Are you sure you want to delete all saved memories? This will not affect your chat history or downloaded models.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
          memoryStorage.set('memories', JSON.stringify([]));
          setMemories([]);
      }}
    ]);
  };

  // Response Style Logic
  const getStylePreset = () => {
    const { temperature: t, top_p: p, top_k: k } = settings;
    if (t === 0.2 && p === 0.9 && k === 20) return 'Precise';
    if (t === 0.7 && p === 0.95 && k === 40) return 'Balanced';
    if (t === 1.2 && p === 0.98 && k === 60) return 'Creative';
    return 'Custom';
  };

  const currentStyle = getStylePreset();

  const setPreset = (preset: 'Precise' | 'Balanced' | 'Creative') => {
    let next = { ...settings };
    if (preset === 'Precise') {
      next.temperature = 0.2; next.top_p = 0.9; next.top_k = 20;
    } else if (preset === 'Balanced') {
      next.temperature = 0.7; next.top_p = 0.95; next.top_k = 40;
    } else if (preset === 'Creative') {
      next.temperature = 1.2; next.top_p = 0.98; next.top_k = 60;
    }
    setSettings(next);
    saveSettings(next);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.65}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Model */}
        <SectionLabel label="Model" />
        <View style={styles.card}>
          <Text style={styles.cardFieldLabel}>Download URL</Text>
          <View style={styles.urlField}>
            <TextInput
              style={styles.urlInput}
              value={settings.modelUrl}
              onChangeText={t => update('modelUrl', t)}
              placeholder="https://huggingface.co/..."
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
          </View>
          <View style={styles.hintRow}>
            <View style={styles.hintDotWrap} />
            <Text style={styles.hintText}>Use a direct quantized .gguf URL. Changing it requires a new download.</Text>
          </View>
        </View>

        {/* 2. Response Style */}
        <SectionLabel label="Response Style" />
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border }}>
            {['Precise', 'Balanced', 'Creative'].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.segmentBtn, currentStyle === preset && styles.segmentBtnActive]}
                onPress={() => setPreset(preset as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentBtnText, currentStyle === preset && styles.segmentBtnTextActive]}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {currentStyle === 'Custom' && (
            <Text style={{ color: C.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              Currently using <Text style={{ color: C.accent, fontWeight: '700' }}>Custom</Text> advanced settings.
            </Text>
          )}
        </View>

        {/* 3. Memory */}
        <SectionLabel label="Memory" />
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.paramLabel}>Enable Memory</Text>
              <Text style={styles.paramDesc}>Allow the assistant to reuse facts it explicitly saves from chat.</Text>
            </View>
            <Switch
              value={settings.memoryEnabled}
              onValueChange={v => update('memoryEnabled', v)}
              trackColor={{ false: C.surfaceHigh, true: C.accentDim }}
              thumbColor={settings.memoryEnabled ? C.accent : C.textSecondary}
            />
          </View>
          <View style={styles.paramDivider} />
          <TouchableOpacity style={styles.manageMemoryBtn} onPress={openMemoryModal} activeOpacity={0.7}>
            <Text style={styles.manageMemoryBtnText}>View & Manage Saved Memories</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Privacy and storage */}
        <SectionLabel label="Privacy and Storage" />
        <View style={styles.card}>
          <Text style={styles.privacyText}>
            Moonlight AI is designed as a private, local-first Android AI assistant. Chats, settings, downloaded models, and saved memories are stored on this device. Internet access is used for model downloads. Chat inference does not use external cloud AI APIs after a compatible model is installed. File attachments read selected text into the current chat only. Moonlight AI does not include accounts, ad SDKs, or analytics SDKs.
          </Text>
        </View>

        {/* 5. Voice Input */}
        <SectionLabel label="Voice Input" />
        <View style={styles.card}>
          <Text style={styles.privacyText}>
            Voice input uses Android's speech recognition service. Depending on your device and settings, speech recognition may use network processing.
          </Text>
        </View>

        {/* 6. Advanced generation controls */}
        <SectionLabel label="Advanced Generation Controls" />
        <View style={[styles.card, { gap: 0 }]}>
          <ParamItem
            label="Temperature" desc="Randomness of output"
            value={settings.temperature} min={0} max={2} step={0.1} color={C.purple}
            onChange={v => update('temperature', v)}
          />
          <View style={styles.paramDivider} />
          <ParamItem
            label="Top P" desc="Nucleus sampling threshold"
            value={settings.top_p} min={0} max={1} step={0.1} color={C.indigo}
            onChange={v => update('top_p', v)}
          />
          <View style={styles.paramDivider} />
          <ParamItem
            label="Top K" desc="Token candidate pool size"
            value={settings.top_k} min={1} max={100} step={1} color={C.pink}
            onChange={v => update('top_k', v)}
          />
        </View>

        {/* 7. About */}
        <View style={styles.about}>
          <MoonLogo size={40} variant="light" />
          <Text style={styles.aboutName}>Moonlight AI</Text>
          <Text style={styles.aboutSub}>Private AI for Android</Text>
        </View>
      </Animated.ScrollView>

      {/* Memory Management Modal */}
      <Modal visible={memoryModalVisible} animationType="slide" transparent={true} onRequestClose={() => setMemoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Memories</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setMemoryModalVisible(false)}>
                <Text style={{ color: C.textSecondary, fontWeight: '700', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
              {memories.length === 0 ? (
                <Text style={{ color: C.textMuted, textAlign: 'center', paddingVertical: 20 }}>No memories saved yet.</Text>
              ) : (
                memories.map((m) => (
                  <View key={m.id} style={styles.memoryItem}>
                    <Text style={styles.memoryText}>{m.content}</Text>
                    <TouchableOpacity onPress={() => handleDeleteMemory(m.id)} style={styles.memoryDeleteBtn}>
                      <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            {memories.length > 0 && (
              <View style={{ padding: 20, borderTopWidth: 1, borderColor: C.border }}>
                <TouchableOpacity style={styles.clearMemoriesBtn} onPress={handleClearAllMemories}>
                  <Text style={styles.clearMemoriesBtnText}>Clear All Memories</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.textPrimary, letterSpacing: 0 },
  resetBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: '#3B1010', backgroundColor: '#160808',
  },
  resetBtnText: { color: C.red, fontSize: 12, fontWeight: '600' },
  headerDivider: { height: 1, backgroundColor: C.border, marginBottom: 4 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 6 },

  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 0, marginBottom: 6, marginTop: 14, marginLeft: 2,
  },

  card: {
    backgroundColor: C.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: C.border, gap: 10,
  },
  cardFieldLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600', letterSpacing: 0.3 },

  urlField: {
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 2,
  },
  urlInput: {
    color: C.accent, fontSize: 12, fontFamily: 'monospace',
    lineHeight: 20, paddingVertical: 8,
  },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  hintDotWrap: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.textMuted, marginTop: 5, flexShrink: 0 },
  hintText: { color: C.textMuted, fontSize: 12, flex: 1, lineHeight: 18 },

  promptField: {
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
    color: C.textPrimary, fontSize: 14, lineHeight: 22, minHeight: 100,
  },
  charCount: { color: C.textMuted, fontSize: 11, textAlign: 'right' },

  paramItem: { paddingVertical: 14, gap: 10 },
  paramTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  paramLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  paramDesc: { fontSize: 12, color: C.textMuted },
  valuePill: {
    borderWidth: 1, borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 3, flexShrink: 0,
  },
  valueNum: { fontSize: 13, fontWeight: '700' },
  paramDivider: { height: 1, backgroundColor: C.border },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14,
  },
  privacyText: {
    color: C.textSecondary, fontSize: 12, lineHeight: 18,
  },

  about: {
    alignItems: 'center', gap: 5, paddingVertical: 20, marginTop: 16,
  },
  aboutLogo: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  aboutName: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  aboutSub: { fontSize: 11, color: C.textMuted },

  segmentBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: C.surfaceHigh,
  },
  segmentBtnText: {
    color: C.textMuted, fontSize: 12, fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: C.textPrimary,
  },
  manageMemoryBtn: {
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surfaceHigh, borderRadius: 10,
  },
  manageMemoryBtnText: {
    color: C.accent, fontSize: 13, fontWeight: '600',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  memoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  memoryText: { color: C.textPrimary, fontSize: 13, flex: 1, marginRight: 12, lineHeight: 18 },
  memoryDeleteBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255, 90, 122, 0.1)', borderRadius: 8 },
  clearMemoriesBtn: { backgroundColor: 'rgba(255, 90, 122, 0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  clearMemoriesBtnText: { color: C.red, fontSize: 14, fontWeight: '700' },
});

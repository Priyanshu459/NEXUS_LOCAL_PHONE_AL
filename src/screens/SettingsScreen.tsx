import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, Easing, Alert, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getSettings, saveSettings, AppSettings, defaultSettings } from '../services/storage';

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

  useEffect(() => {
    setSettings(getSettings());
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* ── Model ──────────────────────────────── */}
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

        {/* ── Persona ─────────────────────────────── */}
        <SectionLabel label="System Persona" />
        <View style={styles.card}>
          <Text style={styles.cardFieldLabel}>Instructions for the AI</Text>
          <TextInput
            style={styles.promptField}
            value={settings.systemPrompt}
            onChangeText={t => update('systemPrompt', t)}
            multiline
            textAlignVertical="top"
            placeholder="You are a helpful assistant..."
            placeholderTextColor={C.textMuted}
          />
          <Text style={styles.charCount}>{settings.systemPrompt.length} chars</Text>
        </View>

        {/* ── Sampling ────────────────────────────── */}
        <SectionLabel label="Generation" />
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

        <SectionLabel label="Memory And Privacy" />
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.paramLabel}>Memory</Text>
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
          <Text style={styles.privacyText}>
            Chats, settings, downloaded models, and saved memories are stored on this device. Local model inference runs on device after a model is downloaded. Voice input uses the operating system speech recognizer, which may use network services depending on device settings. File attachments read selected text into the current chat only.
          </Text>
        </View>

        {/* ── About ───────────────────────────────── */}
        <View style={styles.about}>
          <View style={styles.aboutLogo}>
            <View style={{ width: 16, height: 18, position: 'relative' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
              <View style={{ position: 'absolute', right: 0, top: 0, width: 2, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
              <View style={{ position: 'absolute', left: 2, top: 0, width: 11, height: 2, backgroundColor: C.accent, borderRadius: 1, transform: [{ rotate: '36deg' }, { translateY: 1 }] }} />
            </View>
          </View>
          <Text style={styles.aboutName}>Moonlight AI</Text>
          <Text style={styles.aboutSub}>Local model runtime · llama.cpp</Text>
        </View>
      </Animated.ScrollView>
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
});

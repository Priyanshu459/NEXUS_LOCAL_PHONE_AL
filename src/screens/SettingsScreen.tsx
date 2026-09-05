import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, PageIntro, ui } from '../components/Design';
import { Theme } from '../constants/theme';
import {
  AppSettings,
  defaultSettings,
  getSettings,
  saveSettings,
} from '../services/storage';
import {
  deleteMemory,
  getMemories,
  memoryStorage,
} from '../services/MemoryManager';
import { validateGgufDownloadUrl } from '../services/modelManager';
const c = Theme.color;
const presets = [
  { name: 'Precise', temperature: 0.2, top_p: 0.9, top_k: 20 },
  { name: 'Balanced', temperature: 0.7, top_p: 0.9, top_k: 40 },
  { name: 'Creative', temperature: 1.2, top_p: 0.98, top_k: 60 },
];
export function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(getSettings);
  const [url, setUrl] = useState(settings.modelUrl);
  const [urlStatus, setUrlStatus] = useState('');
  const [prompt, setPrompt] = useState(settings.systemPrompt);
  const [promptStatus, setPromptStatus] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [memories, setMemories] = useState(getMemories);
  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    saveSettings(next);
    setSettings(getSettings());
  };
  const reset = () =>
    Alert.alert(
      'Reset preferences?',
      'Your chats, saved memories, and downloaded models will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            saveSettings(defaultSettings);
            setSettings(defaultSettings);
            setUrl(defaultSettings.modelUrl);
            setPrompt(defaultSettings.systemPrompt);
            setUrlStatus('');
            setPromptStatus('');
          },
        },
      ],
    );
  const selected = presets.find(
    p =>
      p.temperature === settings.temperature &&
      p.top_p === settings.top_p &&
      p.top_k === settings.top_k,
  )?.name;
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <IconButton
          glyph="‹"
          label="Go back"
          onPress={() => navigation.goBack()}
        />
        <Text style={S.headerTitle}>Preferences</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={S.textButton}
          onPress={reset}
        >
          <Text style={S.link}>Reset</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          ui.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        <PageIntro
          eyebrow="MAKE IT YOURS"
          title="Your AI. Your way."
          body="A few small adjustments can make every conversation feel more useful."
        />
        <Text style={ui.section}>How should Moonlight respond?</Text>
        <View style={ui.card}>
          <View style={S.segments}>
            {presets.map(p => (
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === p.name }}
                key={p.name}
                style={[S.segment, selected === p.name && S.selected]}
                onPress={() =>
                  update({
                    temperature: p.temperature,
                    top_p: p.top_p,
                    top_k: p.top_k,
                  })
                }
              >
                <Text
                  style={[S.segmentText, selected === p.name && S.selectedText]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={ui.small}>
            {selected === 'Precise'
              ? 'Lower randomness for focused answers.'
              : selected === 'Creative'
              ? 'More variety for exploring different ideas.'
              : selected === 'Balanced'
              ? 'A middle ground between focus and variety.'
              : 'Your custom generation settings are active.'}
          </Text>
        </View>
        <Text style={ui.section}>Personal instructions</Text>
        <View style={ui.card}>
          <Text style={ui.body}>Tell Moonlight how you prefer it to help.</Text>
          <TextInput
            accessibilityLabel="Personal instructions"
            multiline
            value={prompt}
            onChangeText={value => {
              setPrompt(value);
              setPromptStatus('');
            }}
            style={[ui.input, S.prompt]}
          />
          <TouchableOpacity
            accessibilityRole="button"
            style={ui.primary}
            onPress={() => {
              if (!prompt.trim()) {
                setPromptStatus('Write an instruction before saving.');
                return;
              }
              update({ systemPrompt: prompt.trim() });
              setPromptStatus('Instructions saved.');
            }}
          >
            <Text style={ui.primaryText}>Save instructions</Text>
          </TouchableOpacity>
          {!!promptStatus && (
            <Text accessibilityLiveRegion="polite" style={ui.small}>
              {promptStatus}
            </Text>
          )}
        </View>
        <Text style={ui.section}>Memory & privacy</Text>
        <View style={ui.card}>
          <View style={ui.row}>
            <View style={ui.flex}>
              <Text style={S.label}>Remember useful details</Text>
              <Text style={ui.small}>Reuse saved facts in future replies.</Text>
            </View>
            <Switch
              accessibilityLabel="Enable memory"
              value={settings.memoryEnabled}
              onValueChange={value => update({ memoryEnabled: value })}
              trackColor={{ false: c.border, true: c.accentSoft }}
              thumbColor={settings.memoryEnabled ? c.accent : c.textMuted}
            />
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={S.rowButton}
            onPress={() => {
              setMemories(getMemories());
              setShowMemories(true);
            }}
          >
            <Text style={S.link}>Manage saved memories</Text>
            <Text style={S.link}>↗</Text>
          </TouchableOpacity>
          <Text style={ui.small}>
            Text chat runs on your phone. Android voice recognition may use
            network processing.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: advanced }}
          style={S.rowButton}
          onPress={() => setAdvanced(!advanced)}
        >
          <Text style={ui.section}>Model & advanced controls</Text>
          <Text style={S.link}>{advanced ? '−' : '＋'}</Text>
        </TouchableOpacity>
        {advanced && (
          <>
            <View style={ui.card}>
              <Text style={S.label}>Custom Hugging Face model</Text>
              <TextInput
                accessibilityLabel="Model download URL"
                value={url}
                onChangeText={value => {
                  setUrl(value);
                  setUrlStatus('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                style={[ui.input, S.url]}
              />
              <TouchableOpacity
                accessibilityRole="button"
                style={ui.primary}
                onPress={() => {
                  const error = validateGgufDownloadUrl(url);
                  if (error) {
                    setUrlStatus(error);
                    return;
                  }
                  update({ modelUrl: url.trim() });
                  setUrlStatus('Model URL saved. Open chat to download it.');
                }}
              >
                <Text style={ui.primaryText}>Save model URL</Text>
              </TouchableOpacity>
              {!!urlStatus && (
                <Text accessibilityLiveRegion="polite" style={ui.small}>
                  {urlStatus}
                </Text>
              )}
            </View>
            <View style={ui.card}>
              {(
                [
                  {
                    key: 'temperature',
                    title: 'Temperature',
                    step: 0.1,
                    min: 0,
                    max: 2,
                  },
                  { key: 'top_p', title: 'Top P', step: 0.05, min: 0, max: 1 },
                  { key: 'top_k', title: 'Top K', step: 1, min: 1, max: 100 },
                  {
                    key: 'maxTokens',
                    title: 'Response token limit',
                    step: 128,
                    min: 64,
                    max: 2048,
                  },
                ] as const
              ).map(item => (
                <View key={item.key} style={S.control}>
                  <Text style={[S.label, ui.flex]}>{item.title}</Text>
                  <IconButton
                    glyph="−"
                    label={'Decrease ' + item.title}
                    onPress={() =>
                      update({
                        [item.key]: Math.max(
                          item.min,
                          Number((settings[item.key] - item.step).toFixed(2)),
                        ),
                      })
                    }
                  />
                  <Text style={S.value}>{settings[item.key]}</Text>
                  <IconButton
                    glyph="＋"
                    label={'Increase ' + item.title}
                    onPress={() =>
                      update({
                        [item.key]: Math.min(
                          item.max,
                          Number((settings[item.key] + item.step).toFixed(2)),
                        ),
                      })
                    }
                  />
                </View>
              ))}
              <Text style={ui.small}>
                The model’s context also limits response length.
              </Text>
            </View>
          </>
        )}
        <View style={ui.card}>
          <TouchableOpacity
            accessibilityRole="button"
            style={S.rowButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={S.label}>Privacy policy</Text>
            <Text style={S.link}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={S.rowButton}
            onPress={() => navigation.navigate('ModelAttribution')}
          >
            <Text style={S.label}>Model credits & licenses</Text>
            <Text style={S.link}>↗</Text>
          </TouchableOpacity>
        </View>
        <Text style={S.footer}>
          {'MOONLIGHT\nPrivate by design. Curious by nature.'}
        </Text>
      </ScrollView>
      <Modal
        transparent
        visible={showMemories}
        animationType="slide"
        onRequestClose={() => setShowMemories(false)}
      >
        <View style={S.overlay}>
          <View style={[S.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={ui.row}>
              <Text style={[ui.section, ui.flex]}>Saved memories</Text>
              <IconButton
                glyph="×"
                label="Close memories"
                onPress={() => setShowMemories(false)}
              />
            </View>
            <ScrollView>
              {memories.length ? (
                memories.map(m => (
                  <View style={S.memory} key={m.id}>
                    <Text style={[ui.body, ui.flex]}>{m.content}</Text>
                    <IconButton
                      glyph="×"
                      label={'Delete memory: ' + m.content}
                      onPress={() => {
                        deleteMemory(m.id);
                        setMemories(getMemories());
                      }}
                    />
                  </View>
                ))
              ) : (
                <Text style={S.empty}>
                  No saved memories. Details saved during your conversations
                  will appear here.
                </Text>
              )}
            </ScrollView>
            {!!memories.length && (
              <TouchableOpacity
                accessibilityRole="button"
                style={S.textButton}
                onPress={() =>
                  Alert.alert(
                    'Delete all memories?',
                    'This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete all',
                        style: 'destructive',
                        onPress: () => {
                          memoryStorage.set('memories', '[]');
                          setMemories([]);
                        },
                      },
                    ],
                  )
                }
              >
                <Text style={S.danger}>Delete all memories</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
const S = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    minHeight: 70,
  },
  headerTitle: { color: c.text, fontSize: 18, fontWeight: '600', flex: 1 },
  textButton: {
    minHeight: 48,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { color: c.accent, fontSize: 13, fontWeight: '600' },
  segments: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: c.background,
    padding: 4,
    borderRadius: 14,
  },
  segment: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 11,
  },
  selected: { backgroundColor: c.primary },
  segmentText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
  selectedText: { color: c.background },
  prompt: { minHeight: 130, textAlignVertical: 'top', lineHeight: 22 },
  url: { minHeight: 110, textAlignVertical: 'top' },
  label: { color: c.text, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  rowButton: {
    flexDirection: 'row',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingVertical: 6,
  },
  value: { color: c.accent, fontSize: 13, minWidth: 35, textAlign: 'center' },
  footer: {
    color: c.textMuted,
    fontSize: 11,
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: 20,
    letterSpacing: 1,
  },
  overlay: { flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    padding: 22,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 20,
  },
  memory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  empty: { color: c.textSecondary, lineHeight: 23, paddingVertical: 30 },
  danger: { color: c.destructive },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { GColor, GoogleAIEmblem, MenuIcon, GalleryCardIcon, SparklesIcon } from '../components/GoogleIcons';



const { width: W } = Dimensions.get('window');
const CARD_WIDTH = (W - 48) / 2;
const MODULES = [
  { id: 'ai_chat', type: 'ai_chat', color: GColor.blue, status: 'Ready', title: 'Chat', desc: 'Talk with the selected local model.' },
  { id: 'models', type: 'models', color: GColor.green, status: 'Ready', title: 'Models', desc: 'Choose and download GGUF models.' },
  { id: 'prompt_lab', type: 'prompt_lab', color: GColor.coral, status: 'Preview', title: 'Prompt Lab', desc: 'Try focused prompt templates.' },
  { id: 'settings', type: 'settings', color: GColor.blue, status: 'System', title: 'Settings', desc: 'Tune model and generation options.' },
  { id: 'audio_scribe', type: 'audio_scribe', color: GColor.green, status: 'Chat', title: 'Voice Input', desc: 'Speak into the chat composer.' },
  { id: 'ask_image', type: 'ask_image', color: GColor.red, status: 'Soon', title: 'Images', desc: 'Vision model support is planned.' },
  { id: 'agent_skills', type: 'agent_skills', color: GColor.yellow, status: 'Prompt', title: 'Agent Skills', desc: 'Use structured system prompts.' },
  { id: 'notifications', type: 'notifications', color: GColor.red, status: 'Soon', title: 'Notifications', desc: 'Scheduled assistant updates.' },
];

export function GalleryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showPromptLab, setShowPromptLab] = useState(false);
  const [promptLabInput, setPromptLabInput] = useState('Summarize the theory of relativity in 2 bullet points.');
  const [promptLabResult, setPromptLabResult] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleCardPress = (id: string) => {
    if (id === 'ai_chat') {
      navigation.navigate('Chat');
    } else if (id === 'settings') {
      navigation.navigate('Settings');
    } else if (id === 'models') {
      // Navigate to chat and prompt user
      navigation.navigate('Chat', { openModels: true });
    } else if (id === 'prompt_lab') {
      setShowPromptLab(true);
    } else if (id === 'audio_scribe') {
      Alert.alert("Voice Input", "Switch to Moonlight Chat and tap the microphone icon to use the device speech recognizer.");
    } else if (id === 'agent_skills') {
      Alert.alert("Agent Skills", "Agent Skills enable local LLMs to reason over structured tasks and system rules. Manage system prompts in Settings.");
    } else if (id === 'ask_image') {
      Alert.alert("Images", "Vision model support is coming soon. Current GGUF text models cannot inspect images directly.");
    } else if (id === 'tiny_garden') {
      Alert.alert("Tiny Garden", "Welcome to Tiny Garden! An experimental interactive benchmark demonstrating natural language state management on-device.");
    } else if (id === 'mobile_actions') {
      Alert.alert("Mobile Actions", "On-device mobile automation benchmark. Designed for secure, zero-latency local execution.");
    } else if (id === 'notifications') {
      Alert.alert("Notifications", "No scheduled AI notifications pending. Background inference engine is idle.");
    }
  };

  const runPromptLab = () => {
    if (!promptLabInput.trim()) return;
    setIsSimulating(true);
    setPromptLabResult('');
    setTimeout(() => {
      setPromptLabResult("• Relativity states that space and time are intertwined into a single spacetime fabric, curved by mass and energy.\n• The speed of light in a vacuum is constant for all observers, meaning time slows down and length contracts at speeds approaching light.");
      setIsSimulating(false);
    }, 800);
  };

  return (
    <View style={[S.screen, { paddingTop: insets.top }]}>
      {/* Top App Bar */}
      <View style={S.appBar}>
        <View style={S.appBarLeft}>
          <TouchableOpacity style={S.iconBtn} onPress={() => Alert.alert("Moonlight AI", "Local model runtime powered by llama.rn.")} activeOpacity={0.7}>
            <MenuIcon />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GoogleAIEmblem size={24} />
            <Text style={S.appBarTitle}>Tools</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={[S.content, { paddingBottom: Math.max(insets.bottom, 20) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.intro}>
          <Text style={S.introTitle}>Choose a workspace</Text>
          <Text style={S.introBody}>Open chat, manage models, or start from a focused task.</Text>
        </View>
        <View style={S.grid}>
          {MODULES.map(module => (
            <TouchableOpacity key={module.id} style={S.card} onPress={() => handleCardPress(module.id)} activeOpacity={0.82}>
              <View style={S.cardHeader}>
                <GalleryCardIcon type={module.type} color={module.color} size={38} />
                <View style={S.statusPill}>
                  <Text style={S.cardSub}>{module.status}</Text>
                </View>
              </View>
              <Text style={S.cardTitle}>{module.title}</Text>
              <Text style={S.cardDesc}>{module.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Prompt Lab Modal */}
      <Modal visible={showPromptLab} animationType="slide" transparent={true} onRequestClose={() => setShowPromptLab(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={S.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <GalleryCardIcon type="prompt_lab" color={GColor.red} size={32} />
                <Text style={S.modalTitle}>Prompt Lab</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPromptLab(false)} style={S.modalCloseBtn}>
                <Text style={{ color: GColor.textSecondary, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={S.modalDesc}>Draft a prompt, then move it into chat when you are ready to run it against your selected model.</Text>

            <View style={S.inputBoxWrap}>
              <TextInput
                style={S.promptInput}
                value={promptLabInput}
                onChangeText={setPromptLabInput}
                multiline
                placeholder="Enter prompt instruction..."
                placeholderTextColor={GColor.textMuted}
              />
            </View>

            <TouchableOpacity style={S.runBtn} onPress={runPromptLab} disabled={isSimulating} activeOpacity={0.8}>
              <SparklesIcon size={18} />
              <Text style={S.runBtnText}>{isSimulating ? "Preparing..." : "Preview Prompt"}</Text>
            </TouchableOpacity>

            {promptLabResult ? (
              <View style={S.resultBox}>
                <Text style={S.resultLabel}>Preview</Text>
                <Text style={S.resultText}>{promptLabResult}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GColor.bg,
  },
  appBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: GColor.border,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: GColor.surface,
    borderWidth: 1,
    borderColor: GColor.border,
  },
  appBarTitle: {
    color: GColor.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  intro: {
    marginBottom: 18,
    gap: 5,
  },
  introTitle: {
    color: GColor.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  introBody: {
    color: GColor.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: GColor.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: GColor.border,
    minHeight: 148,
    justifyContent: 'flex-start',
  },
  cardHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: GColor.surfaceHigh,
    borderColor: GColor.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardSub: {
    color: GColor.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
  },
  cardTitle: {
    color: GColor.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0,
  },
  cardDesc: {
    color: GColor.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: GColor.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: GColor.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: GColor.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GColor.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    color: GColor.textSecondary,
    fontSize: 14,
    marginBottom: 18,
    lineHeight: 20,
  },
  inputBoxWrap: {
    backgroundColor: GColor.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GColor.border,
    marginBottom: 16,
  },
  promptInput: {
    color: GColor.textPrimary,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  runBtn: {
    backgroundColor: GColor.blue,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: GColor.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  runBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 168, 83, 0.3)',
  },
  resultLabel: {
    color: GColor.green,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultText: {
    color: GColor.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
});

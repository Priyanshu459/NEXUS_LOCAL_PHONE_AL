import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { GColor, GoogleAIEmblem, MenuIcon, GalleryCardIcon, SparklesIcon } from '../components/GoogleIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

const { width: W } = Dimensions.get('window');
const CARD_WIDTH = (W - 48) / 2;

export function GalleryScreen({ navigation }: Props) {
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
      Alert.alert("Audio Scribe", "Transcribe and summarize audio locally. Switch to Moon Studio Chat and tap the microphone icon to begin real-time speech recognition.");
    } else if (id === 'agent_skills') {
      Alert.alert("Agent Skills", "Agent Skills enable local LLMs to reason over structured tasks and system rules. Manage system prompts in Settings.");
    } else if (id === 'ask_image') {
      Alert.alert("Ask Image", "Multimodal vision model support (4 Models available in Neural Studio). Connect compatible vision GGUF weights in Settings.");
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
      {/* Top App Bar matching Moon Studio Gallery */}
      <View style={S.appBar}>
        <View style={S.appBarLeft}>
          <TouchableOpacity style={S.iconBtn} onPress={() => Alert.alert("Moon Studio", "Local LLM Runtime v0.86\nPowered by Moon NDK & Llama.rn")} activeOpacity={0.7}>
            <MenuIcon />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GoogleAIEmblem size={24} />
            <Text style={S.appBarTitle}>Moon Studio Gallery</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.grid}>
          {/* Ask Image */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('ask_image')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="ask_image" color={GColor.red} />
            </View>
            <Text style={S.cardSub}>4 Models</Text>
            <Text style={S.cardTitle}>Ask Image</Text>
            <Text style={S.cardDesc}>Ask questions about images</Text>
          </TouchableOpacity>

          {/* Audio Scribe */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('audio_scribe')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="audio_scribe" color={GColor.green} />
            </View>
            <Text style={S.cardSub}>4 Models</Text>
            <Text style={S.cardTitle}>Audio Scribe</Text>
            <Text style={S.cardDesc}>Transcribe and translate audio</Text>
          </TouchableOpacity>

          {/* AI Chat */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('ai_chat')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="ai_chat" color={GColor.blue} />
            </View>
            <Text style={S.cardSub}>7 Models</Text>
            <Text style={S.cardTitle}>Moon Studio Chat</Text>
            <Text style={S.cardDesc}>Chat with an on-device LLM</Text>
          </TouchableOpacity>

          {/* Agent Skills */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('agent_skills')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="agent_skills" color={GColor.yellow} />
            </View>
            <Text style={S.cardSub}>2 Models</Text>
            <Text style={S.cardTitle}>Agent Skills</Text>
            <Text style={S.cardDesc}>Complete agentic tasks with chat</Text>
          </TouchableOpacity>

          {/* Prompt Lab */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('prompt_lab')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="prompt_lab" color={GColor.red} />
            </View>
            <Text style={S.cardSub}>7 Models</Text>
            <Text style={S.cardTitle}>Prompt Lab</Text>
            <Text style={S.cardDesc}>Single turn use cases</Text>
          </TouchableOpacity>

          {/* Tiny Garden */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('tiny_garden')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="tiny_garden" color={GColor.green} />
            </View>
            <Text style={S.cardSub}>1 Model</Text>
            <Text style={S.cardTitle}>Tiny Garden</Text>
            <Text style={S.cardDesc}>Use natural language to plant</Text>
          </TouchableOpacity>

          {/* Mobile Actions */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('mobile_actions')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="mobile_actions" color={GColor.blue} />
            </View>
            <Text style={S.cardSub}>1 Model</Text>
            <Text style={S.cardTitle}>Mobile Actions</Text>
            <Text style={S.cardDesc}>Automate device workflows</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('settings')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="settings" color={GColor.blue} />
            </View>
            <Text style={S.cardSub}>System</Text>
            <Text style={S.cardTitle}>Settings</Text>
            <Text style={S.cardDesc}>Manage application settings</Text>
          </TouchableOpacity>

          {/* Models */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('models')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="models" color={GColor.green} />
            </View>
            <Text style={S.cardSub}>Storage & GGUF</Text>
            <Text style={S.cardTitle}>Models</Text>
            <Text style={S.cardDesc}>Browse, try, and benchmark models</Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={S.card} onPress={() => handleCardPress('notifications')} activeOpacity={0.8}>
            <View style={S.cardHeader}>
              <GalleryCardIcon type="notifications" color={GColor.red} />
            </View>
            <Text style={S.cardSub}>Alerts</Text>
            <Text style={S.cardTitle}>Notifications</Text>
            <Text style={S.cardDesc}>View scheduled notifications</Text>
          </TouchableOpacity>
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

            <Text style={S.modalDesc}>Test single-turn prompts against the local neural engine with zero overhead.</Text>

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
              <Text style={S.runBtnText}>{isSimulating ? "Running Inference..." : "Run Test Prompt"}</Text>
            </TouchableOpacity>

            {promptLabResult ? (
              <View style={S.resultBox}>
                <Text style={S.resultLabel}>OUTPUT RESULT (ON-DEVICE)</Text>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    borderRadius: 20,
  },
  appBarTitle: {
    color: GColor.textPrimary,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: GColor.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 180,
    justifyContent: 'flex-start',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardSub: {
    color: GColor.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cardTitle: {
    color: GColor.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDesc: {
    color: GColor.textSecondary,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    borderRadius: 24,
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
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
    borderRadius: 16,
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

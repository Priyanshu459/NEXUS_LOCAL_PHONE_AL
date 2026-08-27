import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  getSettings,
  saveSettings,
  storage,
  CHAT_HISTORY_KEY,
} from '../services/storage';
import {
  checkModelExists,
  downloadModel,
  getModelPath,
  deleteModel,
  cancelDownload,
} from '../services/modelManager';
import { initLlama, LlamaContext } from 'llama.rn';
import { NativeModules } from 'react-native';
import {
  getMemoryContextString,
  addMemory,
  parseMemoryActions,
} from '../services/MemoryManager';
import {
  ArrowLeftIcon,
  SendArrowIcon,
  AttachmentIcon,
  CopyIcon,
} from '../components/GoogleIcons';
import MoonlightBrandIcon, {
  MOONLIGHT_BRAND_SIZE,
} from '../components/MoonlightBrandIcon';
import {
  AI_REPORT_CATEGORIES,
  AiReportCategory,
  isAiReportingConfigured,
  submitAiReport,
} from '../services/aiReportService';
type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const { width: W, height: H } = Dimensions.get('window');

const C = {
  bg: '#131314',
  surface: '#1E1F22',
  surfaceHighlight: '#282A2F',
  border: 'rgba(255, 255, 255, 0.08)',
  accent: '#4285F4',
  accentSoft: '#1A3B6E',
  userBubble: '#004A77',
  userBubbleBorder: '#005D96',
  aiBubble: '#1E1F22',
  textPrimary: '#F2F2F2',
  textSecondary: '#9AA0A6',
  textMuted: '#5F6368',
  green: '#34A853',
  blue: '#4285F4',
  orange: '#FBBC04',
  red: '#EA4335',
  purple: '#A142F4',
};

// ── Icons ──────────────────────────────────────────────────────────────────
const StopIcon = () => (
  <View
    style={{ width: 12, height: 12, backgroundColor: '#fff', borderRadius: 2 }}
  />
);

const ClearIcon = () => (
  <View style={{ width: 14, height: 14 }}>
    <View
      style={{
        position: 'absolute',
        width: 14,
        height: 1.5,
        backgroundColor: C.textSecondary,
        borderRadius: 1,
        top: 6,
        transform: [{ rotate: '45deg' }],
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: 14,
        height: 1.5,
        backgroundColor: C.textSecondary,
        borderRadius: 1,
        top: 6,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

const MicIcon = ({ active }: { active: boolean }) => {
  const color = active ? C.accent : C.textSecondary;
  return (
    <View style={{ width: 18, height: 20, alignItems: 'center' }}>
      {/* Capsule body */}
      <View
        style={{
          width: 8,
          height: 12,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: color,
          backgroundColor: active ? C.accent + '30' : 'transparent',
        }}
      />
      {/* Stand arm */}
      <View
        style={{
          width: 12,
          height: 2,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
          marginTop: 1,
        }}
      />
      {/* Base */}
      <View
        style={{ width: 1.5, height: 2, backgroundColor: color, marginTop: 0 }}
      />
      <View
        style={{
          width: 6,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
};

const MenuIcon = () => (
  <View style={{ gap: 3 }}>
    <View
      style={{
        width: 14,
        height: 1.5,
        backgroundColor: C.textSecondary,
        borderRadius: 1,
      }}
    />
    <View
      style={{
        width: 10,
        height: 1.5,
        backgroundColor: C.textSecondary,
        borderRadius: 1,
      }}
    />
    <View
      style={{
        width: 12,
        height: 1.5,
        backgroundColor: C.textSecondary,
        borderRadius: 1,
      }}
    />
  </View>
);

// ── Moonlight AI Official Logo Mark ────────────────────────────────────────
function LogoMark({ size = 36 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.06,
            duration: 2400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.85,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.4,
            duration: 2400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 1.25,
          height: size * 1.25,
          borderRadius: size * 0.625,
          backgroundColor: 'rgba(0, 242, 254, 0.10)',
          opacity: glow,
          transform: [{ scale: pulse }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pulse }],
          borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(0, 242, 254, 0.4)',
        }}
      >
        <MoonlightBrandIcon size={size} />
      </Animated.View>
    </View>
  );
}

// ── Moonlight AI Avatar ───────────────────────────────────────────────────
function AIAvatar({
  size = 28,
  isGenerating = false,
}: {
  size?: number;
  isGenerating?: boolean;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.parallel([
          Animated.timing(spin, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.15,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    } else {
      spin.stopAnimation();
      pulse.stopAnimation();
      spin.setValue(0);
      pulse.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating]);

  const spinInterpolate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isGenerating ? '#00F2FE' : 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        shadowColor: isGenerating ? '#00F2FE' : 'transparent',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: isGenerating ? 3 : 0,
      }}
    >
      {isGenerating && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size + 6,
            height: size + 6,
            borderRadius: (size + 6) / 2,
            borderWidth: 1.5,
            borderColor: '#7F00FF',
            borderStyle: 'dashed',
            transform: [{ rotate: spinInterpolate }, { scale: pulse }],
          }}
        />
      )}
      <MoonlightBrandIcon size={size * 0.82} />
    </View>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator() {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const colors = ['#00F2FE', '#7F00FF', '#FF007F', '#3B82F6'];

  useEffect(() => {
    const loop = (a: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(a, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(a, {
            toValue: 0.2,
            duration: 350,
            useNativeDriver: true,
            easing: Easing.in(Easing.quad),
          }),
          Animated.delay(700 - delay),
        ]),
      );
    Animated.parallel(anims.map((a, i) => loop(a, i * 150))).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={S.msgRow}>
      <AIAvatar isGenerating={true} />
      <View
        style={[
          S.typingBubble,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: '#1E1F22',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(0, 242, 254, 0.25)',
          },
        ]}
      >
        <Text
          style={{
            color: '#9AA0A6',
            fontSize: 12,
            fontWeight: '600',
            marginRight: 4,
          }}
        >
          Moonlight AI Thinking...
        </Text>
        {anims.map((a, i) => (
          <Animated.View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: colors[i],
              opacity: a,
              transform: [
                {
                  scale: a.interpolate({
                    inputRange: [0.2, 1],
                    outputRange: [0.6, 1.3],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────
const MessageBubble = memo(
  ({
    item,
    isGenerating,
    onReport,
  }: {
    item: Message;
    isGenerating: boolean;
    onReport: (message: Message) => void;
  }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const isUser = item.role === 'user';

    useEffect(() => {
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Animated.View
        style={{
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
          marginBottom: 8,
        }}
      >
        {isUser ? (
          <View style={S.userRow}>
            <View style={S.userBubble}>
              <Text style={S.userText}>{item.content}</Text>
            </View>
          </View>
        ) : (
          <View style={S.aiRow}>
            <AIAvatar isGenerating={isGenerating} />
            <View style={S.aiBubble}>
              <Text style={S.aiText}>{item.content}</Text>
              {!!item.content && !isGenerating && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: 8,
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: C.surfaceHighlight,
                      borderRadius: 12,
                    }}
                    onPress={() => {
                      NativeModules.DeviceControl?.copyToClipboard?.(
                        item.content,
                      );
                      Alert.alert(
                        'Moonlight AI',
                        'Response copied to clipboard.',
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <CopyIcon color={C.textSecondary} />
                    <Text
                      style={{
                        fontSize: 11,
                        color: C.textSecondary,
                        fontWeight: '600',
                      }}
                    >
                      Copy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={S.messageAction}
                    onPress={() => onReport(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Report response"
                  >
                    <Text style={S.messageActionText}>Report response</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    );
  },
  (prev, next) => {
    return (
      prev.item.content === next.item.content &&
      prev.isGenerating === next.isGenerating &&
      prev.onReport === next.onReport
    );
  },
);

function ReportResponseModal({
  message,
  onClose,
}: {
  message: Message | null;
  onClose: () => void;
}) {
  const reportingConfigured = isAiReportingConfigured();
  const [category, setCategory] = useState<AiReportCategory>(
    'Harmful or dangerous',
  );
  const [explanation, setExplanation] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    kind: 'success' | 'failure';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (message) {
      setCategory('Harmful or dangerous');
      setExplanation('');
      setPreviewing(false);
      setSubmitting(false);
      setStatus(null);
    }
  }, [message]);

  const submit = async () => {
    if (!message) return;
    setSubmitting(true);
    setStatus(null);
    try {
      await submitAiReport({
        responseId: message.id,
        responseText: message.content,
        category,
        explanation,
      });
      setStatus({ kind: 'success', text: 'Report submitted. Thank you.' });
    } catch (error: any) {
      setStatus({
        kind: 'failure',
        text: error?.message ?? 'The report could not be sent. Try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={Boolean(message)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={S.reportOverlay}>
        <View style={S.reportSheet}>
          <View style={S.reportHeader}>
            <Text style={S.reportTitle}>Report response</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text style={S.reportClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={S.reportScroll}>
            {!reportingConfigured ? (
              <>
                <Text style={S.reportNotice} accessibilityRole="alert">
                  Response reporting is not currently configured for this build.
                  No information has been sent.
                </Text>
                <TouchableOpacity style={S.reportSecondary} onPress={onClose}>
                  <Text style={S.reportSecondaryText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : !previewing ? (
              <>
                <Text style={S.reportLabel}>Category</Text>
                {AI_REPORT_CATEGORIES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      S.reportCategory,
                      category === option && S.reportCategorySelected,
                    ]}
                    onPress={() => setCategory(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: category === option }}
                  >
                    <Text style={S.reportCategoryText}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={S.reportLabel}>Optional explanation</Text>
                <TextInput
                  style={S.reportExplanation}
                  value={explanation}
                  onChangeText={setExplanation}
                  multiline
                  maxLength={1000}
                  placeholder="Add context for the developer"
                  placeholderTextColor={C.textMuted}
                />
                <TouchableOpacity
                  style={S.reportPrimary}
                  onPress={() => setPreviewing(true)}
                >
                  <Text style={S.reportPrimaryText}>Review report</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={S.reportNotice}>
                  Only the information below will be sent. The rest of your
                  conversation, memories, files, model, and device identifiers
                  are not included.
                </Text>
                <Text style={S.reportLabel}>Category</Text>
                <Text style={S.reportPreviewText}>{category}</Text>
                <Text style={S.reportLabel}>Reported assistant response</Text>
                <Text style={S.reportPreviewText}>{message?.content}</Text>
                {explanation.trim() ? (
                  <>
                    <Text style={S.reportLabel}>Your explanation</Text>
                    <Text style={S.reportPreviewText}>
                      {explanation.trim()}
                    </Text>
                  </>
                ) : null}
                {status ? (
                  <Text
                    style={
                      status.kind === 'success'
                        ? S.reportSuccess
                        : S.reportFailure
                    }
                    accessibilityRole="alert"
                  >
                    {status.text}
                  </Text>
                ) : null}
                {status?.kind !== 'success' ? (
                  <TouchableOpacity
                    style={[S.reportPrimary, submitting && S.reportDisabled]}
                    onPress={() => void submit()}
                    disabled={submitting}
                  >
                    <Text style={S.reportPrimaryText}>
                      {submitting
                        ? 'Sending…'
                        : status?.kind === 'failure'
                        ? 'Retry'
                        : 'Confirm and send'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={S.reportSecondary}
                  onPress={() => {
                    setPreviewing(false);
                    setStatus(null);
                  }}
                  disabled={submitting}
                >
                  <Text style={S.reportSecondaryText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Compatible GGUF models ────────────────────────────────────────────────
const AVAILABLE_MODELS = [
  {
    id: 'llama32-1b',
    name: 'Llama 3.2 1B',
    desc: 'Compact GGUF model for quick on-device chat on a wide range of Android devices.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    color: '#4285F4',
    size: '1.3 GB',
    provider: 'Meta AI',
    badge: 'Lightweight',
    tags: ['GGUF', '4-bit quant', 'Lower RAM'],
  },
  {
    id: 'qwen25-15b',
    name: 'Qwen 2.5 1.5B',
    desc: 'Small instruction model with a practical balance of reasoning quality and phone-friendly size.',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    color: '#A142F4',
    size: '1.1 GB',
    provider: 'Alibaba',
    badge: 'Compact',
    tags: ['GGUF', 'Reasoning', 'Q4_K_M'],
  },
  {
    id: 'llama32-3b',
    name: 'Llama 3.2 3B',
    desc: 'General-purpose local chat model for newer devices with enough free storage and memory.',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    color: '#1A73E8',
    size: '2.1 GB',
    provider: 'Meta AI',
    badge: 'Recommended',
    tags: ['GGUF', 'General chat', '3B params'],
  },
  {
    id: 'deepseek-15b',
    name: 'DeepSeek R1 1.5B',
    desc: 'Reasoning-focused distilled model. Output style and speed depend on device and prompt.',
    url: 'https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    color: '#FBBC04',
    size: '1.1 GB',
    provider: 'DeepSeek',
    badge: 'Reasoning',
    tags: ['GGUF', 'Distilled', '1.5B'],
  },
  {
    id: 'gemma2-2b',
    name: 'Gemma 2 2B',
    desc: 'Lightweight instruction model for local text chat and summarization-style prompts.',
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    color: '#00F2FE',
    size: '1.6 GB',
    provider: 'Google',
    badge: 'Small',
    tags: ['GGUF', 'Instruction tuned', '2B params'],
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3 Mini 3.8B',
    desc: 'Microsoft small language model for local instruction following on capable devices.',
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    color: '#00A4EF',
    size: '2.4 GB',
    provider: 'Microsoft',
    badge: 'Capable',
    tags: ['GGUF', '4K context', 'Q4 quant'],
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B (v0.3)',
    desc: 'Larger local chat model for high-memory devices. Expect slower setup and generation.',
    url: 'https://huggingface.co/MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/Mistral-7B-Instruct-v0.3.Q4_K_M.gguf',
    color: '#EA4335',
    size: '4.4 GB',
    provider: 'Mistral AI',
    badge: 'Large',
    tags: ['GGUF', 'v0.3 instruct', '8GB+ RAM'],
  },
];

// ── Splash Screen ─────────────────────────────────────────────────────────
function SplashScreen() {
  const pulse = useRef(new Animated.Value(0.85)).current;
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [statusText, setStatusText] = useState('STARTING MOONLIGHT AI');

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.88,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotate1, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(rotate2, {
        toValue: 1,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    const t1 = setTimeout(() => setStatusText('CHECKING LOCAL RUNTIME'), 900);
    const t2 = setTimeout(() => setStatusText('ON-DEVICE RUNTIME READY'), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin1 = rotate1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spin2 = rotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View
      style={[
        S.screen,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070913',
          overflow: 'hidden',
        },
      ]}
    >
      {/* Ambient background glows */}
      <View
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: 'rgba(99, 102, 241, 0.18)',
          transform: [{ scale: 1.4 }],
          top: '20%',
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          transform: [{ scale: 1.2 }],
          bottom: '25%',
        }}
      />

      <Animated.View style={{ opacity, alignItems: 'center' }}>
        {/* Kinetic Core Animation */}
        <View
          style={{
            width: 180,
            height: 180,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Outer dashed spinning orbit */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 170,
              height: 170,
              borderRadius: 85,
              borderWidth: 1.5,
              borderColor: 'rgba(99, 102, 241, 0.4)',
              borderStyle: 'dashed',
              transform: [{ rotate: spin1 }],
            }}
          />

          {/* Middle counter-spinning ring with orbital nodes */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.5)',
              transform: [{ rotate: spin2 }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: -3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#A855F7',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#6366F1',
              }}
            />
          </Animated.View>

          {/* Central Core Emblem */}
          <Animated.View
            style={{
              transform: [{ scale: pulse }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogoMark size={76} />
          </Animated.View>
        </View>

        {/* Title Typography */}
        <Text
          style={{
            color: '#F8FAFC',
            fontSize: 36,
            fontWeight: '900',
            letterSpacing: 6,
            marginTop: 36,
            textTransform: 'uppercase',
            textAlign: 'center',
            textShadowColor: 'rgba(99, 102, 241, 0.6)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 16,
          }}
        >
          MOONLIGHT AI
        </Text>

        <Text
          style={{
            color: 'rgba(148, 163, 184, 0.8)',
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 4,
            marginTop: 6,
            textTransform: 'uppercase',
          }}
        >
          PRIVATE AI FOR ANDROID
        </Text>

        {/* Status indicator pill */}
        <View
          style={{
            marginTop: 48,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(99, 102, 241, 0.3)',
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: C.accent,
            }}
          />
          <Text
            style={{
              color: C.accent,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
            }}
          >
            {statusText}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Google Vertex Model Garden Card ────────────────────────────────────────
const VertexModelCard = memo(
  ({
    model,
    isSelected,
    onPress,
    index = 0,
  }: {
    model: any;
    isSelected: boolean;
    onPress: () => void;
    index?: number;
  }) => {
    const scale = useRef(new Animated.Value(0.92)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.delay(index * 70),
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 9,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Animated.View
        style={{ opacity, transform: [{ scale }], marginBottom: 14 }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={[
            S.storeCard,
            {
              borderColor: isSelected ? '#4285F4' : 'rgba(255, 255, 255, 0.09)',
              borderWidth: isSelected ? 1.5 : 1,
              padding: 18,
            },
            isSelected && {
              backgroundColor: '#1E293B',
              shadowColor: '#4285F4',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 100,
                  backgroundColor: model.color + '20',
                  borderWidth: 1,
                  borderColor: model.color + '60',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: model.color,
                  }}
                />
                <Text
                  style={{
                    color: model.color,
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 0.4,
                  }}
                >
                  {model.provider.toUpperCase()}
                </Text>
              </View>
              {!!model.badge && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 100,
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <Text
                    style={{
                      color: '#E2E8F0',
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {model.badge}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={{
                backgroundColor: isSelected
                  ? '#4285F4'
                  : 'rgba(66, 133, 244, 0.18)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : '#60A5FA',
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {model.size}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 19,
                fontWeight: '800',
                color: '#F8FAFC',
                letterSpacing: -0.3,
                marginBottom: 5,
              }}
            >
              {model.name}
            </Text>
            <Text
              style={{ fontSize: 13, color: '#94A3B8', lineHeight: 18 }}
              numberOfLines={2}
            >
              {model.desc}
            </Text>
          </View>

          {!!model.tags && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              {model.tags.map((tag: string, tIdx: number) => (
                <View
                  key={tIdx}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Text
                    style={{
                      color: '#CBD5E1',
                      fontSize: 11,
                      fontWeight: '600',
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// ── Animated Setup Screen (Model Store) ───────────────────────────────────
function SetupScreen({
  currentModelUrl,
  isDownloading,
  downloadProgress,
  onDownload,
  onCancel,
  onSettings,
}: any) {
  const insets = useSafeAreaInsets();
  const [dots, setDots] = useState('.');
  const isCustomModel = !AVAILABLE_MODELS.some(
    model => model.url === currentModelUrl,
  );

  // Continuous background wave animation
  const bgWave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgWave, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgWave, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isDownloading) return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [isDownloading]);

  const bgScale = bgWave.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const bgOpacity = bgWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  // If currently downloading, show a prominent downloading UI
  if (isDownloading) {
    return (
      <View
        style={[
          S.setupScreen,
          {
            paddingTop: insets.top,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: W * 1.5,
            height: W * 1.5,
            borderRadius: W,
            backgroundColor: C.accentSoft,
            opacity: bgOpacity,
            transform: [{ scale: bgScale }],
          }}
        />
        <LogoMark size={70} />
        <Text style={[S.setupAppName, { marginTop: 30 }]}>
          Downloading{dots}
        </Text>
        <Text style={S.setupTagline}>
          Preparing the AI brain. Please don't close the app.
        </Text>

        <View style={{ width: '80%', marginTop: 40 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: C.textPrimary, fontWeight: '700' }}>
              Progress
            </Text>
            <Text style={{ color: C.accent, fontWeight: '700' }}>
              {Math.round(downloadProgress)}%
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: C.surfaceHighlight,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${downloadProgress}%`,
                backgroundColor: C.accent,
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={{
            marginTop: 40,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 100,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
          }}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={{ color: C.red, fontWeight: '600' }}>
            Cancel Download
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[S.setupScreen, { paddingTop: insets.top }]}>
      <View
        style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LogoMark size={44} />
          <View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text
                style={{
                  color: C.textPrimary,
                  fontSize: 24,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                }}
              >
                Model Store
              </Text>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(0, 242, 254, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 242, 254, 0.5)',
                }}
              >
                <Text
                  style={{ color: '#00F2FE', fontSize: 10, fontWeight: '800' }}
                >
                  ON-DEVICE
                </Text>
              </View>
            </View>
            <Text style={{ color: C.textSecondary, fontSize: 13 }}>
              Downloads require internet. Chat runs locally after setup.
            </Text>
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {AVAILABLE_MODELS.map((model, idx) => (
          <VertexModelCard
            key={model.id}
            model={model}
            index={idx}
            isSelected={currentModelUrl === model.url}
            onPress={() => onDownload(model.url)}
          />
        ))}

        {isCustomModel ? (
          <TouchableOpacity
            style={[S.customUrlBtn, { borderStyle: 'solid' }]}
            onPress={() => onDownload(currentModelUrl)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Download saved Hugging Face model"
          >
            <Text style={S.customUrlBtnText}>Download saved custom model</Text>
            <Text
              style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}
              numberOfLines={2}
            >
              {currentModelUrl}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={S.customUrlBtn}
          onPress={onSettings}
          activeOpacity={0.7}
        >
          <Text style={S.customUrlBtnText}>Paste Custom HuggingFace URL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Standalone Memoized Chat Input Bar (Eliminates Keyboard Lag & Screen Re-renders) ──
const ChatInputBar = memo(
  ({
    onSend,
    onStop,
    isGenerating,
    attachedFile,
    onPickFile,
    onVoiceInput,
    voiceModeActive,
    insetsBottom,
    externalPrompt,
    onClearExternalPrompt,
  }: {
    onSend: (text?: string) => void;
    onStop: () => void;
    isGenerating: boolean;
    attachedFile: any;
    onPickFile: () => void;
    onVoiceInput: () => void;
    voiceModeActive: boolean;
    insetsBottom: number;
    externalPrompt: string;
    onClearExternalPrompt: () => void;
  }) => {
    const [localText, setLocalText] = useState('');
    const sendScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (externalPrompt) {
        setLocalText(externalPrompt);
        onClearExternalPrompt();
      }
    }, [externalPrompt, onClearExternalPrompt]);

    const handlePressSend = () => {
      const trimmed = localText.trim();
      if ((!trimmed && !attachedFile) || isGenerating) return;
      Animated.sequence([
        Animated.timing(sendScale, {
          toValue: 0.85,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(sendScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
      ]).start();
      onSend(trimmed);
      setLocalText('');
    };

    return (
      <View style={[S.inputBar, { marginBottom: insetsBottom + 12 }]}>
        <View style={S.inputWrap}>
          <TouchableOpacity
            onPress={onPickFile}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Attach a text file"
            activeOpacity={0.7}
          >
            <AttachmentIcon color={C.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={S.input}
            placeholder={
              attachedFile
                ? 'Ask about attached document...'
                : 'Message Moonlight AI...'
            }
            placeholderTextColor={C.textMuted}
            value={localText}
            onChangeText={setLocalText}
            multiline
            maxLength={2000}
            accessibilityLabel="Message"
          />
          <TouchableOpacity
            onPress={onVoiceInput}
            style={[S.micBtn, voiceModeActive && S.micBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={
              voiceModeActive
                ? 'Listening for voice input'
                : 'Start voice input'
            }
            activeOpacity={0.7}
          >
            <MicIcon active={voiceModeActive} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          {isGenerating ? (
            <TouchableOpacity
              style={S.stopBtn}
              onPress={onStop}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Stop generating"
            >
              <StopIcon />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                S.sendBtn,
                !localText.trim() && !attachedFile && S.sendBtnDim,
              ]}
              onPress={handlePressSend}
              disabled={!localText.trim() && !attachedFile}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              activeOpacity={0.85}
            >
              <SendArrowIcon />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    );
  },
);

// ── Chat Screen ───────────────────────────────────────────────────────────
export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(getSettings());
  const [isAppBooting, setIsAppBooting] = useState(true);

  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const startVoiceInput = async () => {
    const deviceControl = NativeModules.DeviceControl;
    if (typeof deviceControl?.startSpeechRecognition !== 'function') {
      Alert.alert(
        'Voice input unavailable',
        'The Android voice-input component is not available in this build.',
      );
      return;
    }
    try {
      setVoiceModeActive(true);
      const result = await deviceControl.startSpeechRecognition();
      if (result && result.length > 0) {
        setInputText('');
        handleSendMessage(result);
      }
    } catch (e: any) {
      if (e?.code !== 'CANCELLED') {
        Alert.alert(
          'Voice input unavailable',
          e?.message || 'Speech could not be recognized. Please try again.',
        );
      }
    } finally {
      setVoiceModeActive(false);
    }
  };

  const showMemories = () => {
    const mems = getMemoryContextString();
    if (!mems) {
      Alert.alert('Moon Core', 'No memories stored yet.');
      return;
    }
    Alert.alert(
      'Moon Core',
      mems
        .replace('Here are some facts to remember about the user:\n', '')
        .trim(),
    );
  };
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    content: string;
    uri: string;
  } | null>(null);

  const handlePickFile = async () => {
    try {
      const file = await NativeModules.DeviceControl.pickFile();
      if (file && file.content) {
        setAttachedFile(file);
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('cancelled')) {
        Alert.alert('File Attachment Error', e.message);
      }
    }
  };

  const llamaRef = useRef<LlamaContext | null>(null);
  const listRef = useRef<FlatList>(null);

  const modelFilename =
    settings.modelUrl.split('/').pop()?.split('?')[0] || 'model.gguf';

  useEffect(() => {
    if (route?.params?.initialPrompt) {
      setInputText(route.params.initialPrompt);
    }
  }, [route?.params?.initialPrompt]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () =>
      setSettings(getSettings()),
    );
    return unsub;
  }, [navigation]);

  useEffect(() => {
    const saved = storage.getString(CHAT_HISTORY_KEY);
    if (saved) setMessages(JSON.parse(saved));
    const initTimer = setTimeout(() => {
      checkAndInit();
    }, 600);
    return () => {
      clearTimeout(initTimer);
      llamaRef.current?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.modelUrl]);

  useEffect(() => {
    if (messages.length > 0 && !isGenerating) {
      const timer = setTimeout(() => {
        storage.set(CHAT_HISTORY_KEY, JSON.stringify(messages));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [messages, isGenerating]);

  const checkAndInit = async () => {
    try {
      if (await checkModelExists(modelFilename)) {
        await initModel();
      } else {
        setModelReady(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Ensure the splash animation plays for at least 2.5 seconds for a premium feel
      setTimeout(() => setIsAppBooting(false), 2500);
    }
  };

  const handleDownload = async (urlToDownload: string) => {
    // If they picked a new model from the store
    if (urlToDownload !== settings.modelUrl) {
      const newSettings = { ...settings, modelUrl: urlToDownload };
      setSettings(newSettings);
      saveSettings(newSettings);
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    const filename =
      urlToDownload.split('/').pop()?.split('?')[0] || 'model.gguf';

    try {
      const downloadedPath = await downloadModel(urlToDownload, filename, p =>
        setDownloadProgress(p),
      );
      const downloadedFilename = downloadedPath.split('/').pop() || filename;
      await initModel(downloadedFilename);
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('canceled')) {
        // Download was canceled, don't show error alert
      } else {
        Alert.alert(
          'Download Failed',
          e?.message ||
            'There was an error downloading the model. Please check your connection and try again.',
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelDownload = () => {
    cancelDownload();
    setIsDownloading(false);
  };

  const initModel = async (specificFilename?: string) => {
    const fileToLoad = specificFilename || modelFilename;
    try {
      if (llamaRef.current) await llamaRef.current.release();
      // Extremely optimized parameters for mobile RAM (1024 ctx, tuned threads)
      llamaRef.current = await initLlama({
        model: getModelPath(fileToLoad),
        use_mlock: false,
        n_ctx: 1024,
        n_gpu_layers: 0,
        n_threads: 4, // 4 Efficiency/Performance threads for 2x faster local inference without overheating
      });
      setModelReady(true);
      if (messages.length === 0) {
        setMessages([
          {
            id: Date.now().toString(),
            role: 'system',
            content: settings.systemPrompt,
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to load model:', e);
      // Delete corrupted file so we don't try to load it again
      await deleteModel(fileToLoad);
      setModelReady(false);
      Alert.alert(
        'Model Error',
        'The model file appears to be corrupted. It has been automatically deleted. Please download it again.',
      );
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const rawInput = (
      textOverride !== undefined ? textOverride : inputText
    ).trim();
    if ((!rawInput && !attachedFile) || isGenerating || !llamaRef.current)
      return;

    let promptInput = rawInput;
    let displayInput = rawInput;
    if (attachedFile) {
      promptInput = `[Attached Document: ${attachedFile.name} (${
        attachedFile.size
      })]\n${attachedFile.content}\n\nUser Question: ${
        rawInput || 'Please analyze this document.'
      }`;
      displayInput = `📄 ${attachedFile.name}\n\n${
        rawInput || 'Please analyze this document.'
      }`;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayInput,
    };
    const memoryString = getMemoryContextString();
    let prompt = '';
    messages.forEach(m => {
      if (m.role === 'system')
        prompt += `<|system|>\n${m.content}${
          memoryString ? '\n\n' + memoryString : ''
        }<|end|>\n`;
      else if (m.role === 'user') prompt += `<|user|>\n${m.content}<|end|>\n`;
      else if (m.role === 'assistant')
        prompt += `<|assistant|>\n${m.content}<|end|>\n`;
    });
    prompt += `<|user|>\n${promptInput}<|end|>\n<|assistant|>\n`;

    const aid = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: aid, role: 'assistant', content: '' },
    ]);
    setInputText('');
    setAttachedFile(null);
    setIsGenerating(true);

    try {
      let fullResponse = '';
      await llamaRef.current.completion(
        {
          prompt,
          n_predict: 512,
          temperature: settings.temperature,
          top_p: settings.top_p,
          top_k: settings.top_k,
          stop: ['<|end|>', '<|user|>'],
        },
        data => {
          fullResponse += data.token;
          const displayContent = fullResponse
            .replace(/<MEMORY>.*?<\/MEMORY>/gi, '')
            .trim();
          setMessages(prev =>
            prev.map(m =>
              m.id === aid ? { ...m, content: displayContent } : m,
            ),
          );
        },
      );

      const newMemories = parseMemoryActions(fullResponse);
      newMemories.forEach(m => addMemory(m));

      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopGeneration = () => {
    if (llamaRef.current && isGenerating) {
      llamaRef.current.stopCompletion();
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'system',
        content: settings.systemPrompt,
      },
    ]);
    storage.set(CHAT_HISTORY_KEY, JSON.stringify([]));
  };

  const switchModel = (url: string) => {
    const newSettings = { ...settings, modelUrl: url };
    setSettings(newSettings);
    saveSettings(newSettings);
    setShowModelModal(false);
    setModelReady(false); // trigger download/init flow
  };

  const filteredMessages = useMemo(
    () => messages.filter(m => m.role !== 'system'),
    [messages],
  );

  const openReport = useCallback((message: Message) => {
    setReportedMessage(message);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isLast = index === filteredMessages.length - 1;
      const isCurrentlyGenerating =
        isGenerating && item.role === 'assistant' && isLast;

      if (item.role === 'assistant' && item.content === '' && isGenerating)
        return <TypingIndicator />;
      return (
        <MessageBubble
          item={item}
          isGenerating={isCurrentlyGenerating}
          onReport={openReport}
        />
      );
    },
    [filteredMessages, isGenerating, openReport],
  );

  if (isAppBooting) {
    return <SplashScreen />;
  }

  if (!modelReady) {
    return (
      <SetupScreen
        currentModelUrl={settings.modelUrl}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onDownload={handleDownload}
        onCancel={handleCancelDownload}
        onSettings={() => navigation.navigate('Settings')}
      />
    );
  }

  const findModelName = (url: string) => {
    const found = AVAILABLE_MODELS.find(m => m.url === url);
    return found ? found.name : url.split('/').pop()?.split('?')[0];
  };

  const CoreIcon = () => (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.4)',
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: C.accent,
          shadowColor: C.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        }}
      />
    </View>
  );

  return (
    <View style={[S.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={S.header}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flex: 1,
          }}
        >
          <TouchableOpacity
            style={S.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeftIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={S.headerBrand}
            onPress={() => setShowModelModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Change active model"
          >
            <MoonlightBrandIcon size={MOONLIGHT_BRAND_SIZE.compact} />
            <View style={{ gap: 1 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={S.headerBrandName}>Moonlight AI Chat</Text>
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 4,
                    borderRightWidth: 4,
                    borderTopWidth: 5,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: C.textSecondary,
                    marginTop: 2,
                  }}
                />
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <View style={S.onlineDot} />
                <Text style={S.headerStatus} numberOfLines={1}>
                  {findModelName(settings.modelUrl)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={S.headerActions}>
          <TouchableOpacity
            style={S.headerBtn}
            onPress={showMemories}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="View saved memories"
          >
            <CoreIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={S.headerBtn}
            onPress={clearChat}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Clear chat"
          >
            <ClearIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={S.headerBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <MenuIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={S.divider} />

      <KeyboardAvoidingView
        style={S.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={filteredMessages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[S.chatContent, { flexGrow: 1 }]}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          updateCellsBatchingPeriod={30}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={S.emptyState}>
              <LogoMark size={48} />
              <Text style={S.emptyTitle}>Good to see you.</Text>
              <Text style={S.emptyBody}>
                Ask me anything. After a model is installed, prompts and
                responses are processed on your device.
              </Text>
              <View style={S.suggestionsWrap}>
                {[
                  'Explain quantum computing simply',
                  'Write a haiku about code',
                  'What is the Fermi paradox?',
                ].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={S.suggestionChip}
                    onPress={() => setInputText(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={S.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />

        {/* ── M3 Assist Chips (Horizontal Prompt Starters) ────────────────── */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 8,
              paddingBottom: 8,
            }}
          >
            {[
              '✨ Summarize document',
              '💡 Brainstorm architecture',
              '📝 Refactor code',
              '🌍 Translate pasted text',
              '🔍 Debug JSDoc',
            ].map(chip => (
              <TouchableOpacity
                key={chip}
                style={{
                  backgroundColor: C.surfaceHighlight,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
                onPress={() => setInputText(chip + ':\n\n')}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: C.textPrimary,
                  }}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── M3 Attached Document Card ───────────────────────────────────── */}
        {attachedFile && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              padding: 10,
              backgroundColor: C.blue + '15',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.blue,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                flex: 1,
              }}
            >
              <AttachmentIcon color={C.blue} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: C.textPrimary,
                  }}
                  numberOfLines={1}
                >
                  {attachedFile.name}
                </Text>
                <Text style={{ fontSize: 11, color: C.blue }}>
                  Attached Document • {attachedFile.size}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setAttachedFile(null)}
              style={{ padding: 4 }}
            >
              <Text
                style={{
                  color: C.textSecondary,
                  fontSize: 14,
                  fontWeight: '800',
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <ChatInputBar
          onSend={handleSendMessage}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          attachedFile={attachedFile}
          onPickFile={handlePickFile}
          onVoiceInput={startVoiceInput}
          voiceModeActive={voiceModeActive}
          insetsBottom={isKeyboardVisible ? 0 : insets.bottom}
          externalPrompt={inputText}
          onClearExternalPrompt={() => setInputText('')}
        />
      </KeyboardAvoidingView>

      <ReportResponseModal
        message={reportedMessage}
        onClose={() => setReportedMessage(null)}
      />

      {/* ── Model Selector Modal ────────────────────────────────────────── */}
      <Modal
        visible={showModelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={S.modalHandle} />
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Change Model</Text>
              <TouchableOpacity
                onPress={() => setShowModelModal(false)}
                style={S.modalCloseBtn}
              >
                <ClearIcon />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flexShrink: 1 }}
            >
              {AVAILABLE_MODELS.map((model, idx) => (
                <VertexModelCard
                  key={model.id}
                  model={model}
                  index={idx}
                  isSelected={settings.modelUrl === model.url}
                  onPress={() => switchModel(model.url)}
                />
              ))}

              <TouchableOpacity
                style={S.modelOption}
                onPress={() => {
                  setShowModelModal(false);
                  navigation.navigate('Settings');
                }}
              >
                <View style={S.modelOptionIcon}>
                  <Text style={{ color: C.textSecondary, fontSize: 16 }}>
                    ⚙
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.modelOptionTitle}>Custom URL</Text>
                  <Text style={S.modelOptionSub}>
                    Paste a direct .gguf link in Settings.
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  divider: { height: 1, backgroundColor: C.border },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  headerStatus: {
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.2,
    maxWidth: 140,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.green,
  },
  headerActions: { flexDirection: 'row', gap: 6 },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatContent: { padding: 16, paddingBottom: 40 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 48,
  },
  userBubble: {
    backgroundColor: C.userBubble,
    borderRadius: 20,
    borderTopRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.userBubbleBorder,
  },
  userText: { fontSize: 15, color: '#D4CAFF', lineHeight: 23 },

  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: 32,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: C.aiBubble,
    borderRadius: 20,
    borderTopLeftRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.border,
  },
  aiText: { fontSize: 15, color: C.textPrimary, lineHeight: 23 },
  messageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: C.surfaceHighlight,
    borderRadius: 12,
  },
  messageActionText: {
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: '600',
  },
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.70)',
    justifyContent: 'flex-end',
  },
  reportSheet: {
    maxHeight: '88%',
    backgroundColor: C.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportTitle: { color: C.textPrimary, fontSize: 19, fontWeight: '800' },
  reportClose: { color: C.accent, fontSize: 14, fontWeight: '700' },
  reportScroll: { flexGrow: 0 },
  reportLabel: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 7,
  },
  reportCategory: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  reportCategorySelected: {
    borderColor: C.accent,
    backgroundColor: C.accentSoft,
  },
  reportCategoryText: { color: C.textPrimary, fontSize: 13 },
  reportExplanation: {
    minHeight: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    color: C.textPrimary,
    padding: 12,
    textAlignVertical: 'top',
  },
  reportNotice: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
    borderRadius: 10,
    backgroundColor: C.bg,
  },
  reportPreviewText: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    padding: 10,
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  reportPrimary: {
    marginTop: 18,
    backgroundColor: C.accent,
    padding: 13,
    borderRadius: 11,
    alignItems: 'center',
  },
  reportPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  reportSecondary: { marginTop: 8, padding: 12, alignItems: 'center' },
  reportSecondaryText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  reportDisabled: { opacity: 0.55 },
  reportSuccess: { color: C.green, marginTop: 14, lineHeight: 19 },
  reportFailure: { color: C.red, marginTop: 14, lineHeight: 19 },

  typingBubble: {
    backgroundColor: C.aiBubble,
    borderRadius: 20,
    borderTopLeftRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsWrap: { width: '100%', gap: 8, marginTop: 8 },
  suggestionChip: {
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  suggestionText: { color: C.textSecondary, fontSize: 13, lineHeight: 19 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginHorizontal: 16,
    padding: 10,
    backgroundColor: '#1E2024',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
    minHeight: 46,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 15,
    maxHeight: 130,
    paddingVertical: 4,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: C.accent + '30',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDim: { backgroundColor: C.surface, shadowOpacity: 0, elevation: 0 },
  stopBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },

  // Setup / Store UI
  setupScreen: { flex: 1, backgroundColor: C.bg },
  setupLogoArea: { alignItems: 'center', gap: 0 },
  setupAppName: {
    fontSize: 28,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  setupTagline: { fontSize: 14, color: C.textSecondary, marginTop: 6 },
  storeCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  storeCardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  storeCardDesc: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  downloadBadge: {
    backgroundColor: C.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  customUrlBtn: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 10,
  },
  customUrlBtnText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
    maxHeight: H * 0.85,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  modelOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelOptionTitle: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  modelOptionSub: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});

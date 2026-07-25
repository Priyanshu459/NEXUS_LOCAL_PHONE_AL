import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  Animated, Easing, Dimensions, Modal, ScrollView, Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getSettings, saveSettings, storage, CHAT_HISTORY_KEY } from '../services/storage';
import { checkModelExists, downloadModel, getModelPath, deleteModel, cancelDownload } from '../services/modelManager';
import { initLlama, LlamaContext } from 'llama.rn';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string };

const { width: W, height: H } = Dimensions.get('window');

const C = {
  bg: '#080C14',
  surface: '#0F1422',
  surfaceHighlight: '#1A2138',
  border: '#1C2035',
  accent: '#7C5CFC',
  accentSoft: '#3D2E80',
  userBubble: '#1E1540',
  userBubbleBorder: '#4C35A0',
  aiBubble: '#0F1422',
  textPrimary: '#E8E9F3',
  textSecondary: '#8B95B1',
  textMuted: '#353A55',
  green: '#10B981',
  blue: '#3B82F6',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6'
};

// ── Icons ──────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff', marginBottom: 2 }} />
    <View style={{ width: 2, height: 5, backgroundColor: '#fff', borderRadius: 1 }} />
  </View>
);

const StopIcon = () => (
  <View style={{ width: 12, height: 12, backgroundColor: '#fff', borderRadius: 2 }} />
);

const ClearIcon = () => (
  <View style={{ width: 14, height: 14 }}>
    <View style={{ position: 'absolute', width: 14, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1, top: 6, transform: [{ rotate: '45deg' }] }} />
    <View style={{ position: 'absolute', width: 14, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1, top: 6, transform: [{ rotate: '-45deg' }] }} />
  </View>
);

const MenuIcon = () => (
  <View style={{ gap: 3 }}>
    <View style={{ width: 14, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1 }} />
    <View style={{ width: 10, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1 }} />
    <View style={{ width: 12, height: 1.5, backgroundColor: C.textSecondary, borderRadius: 1 }} />
  </View>
);

// ── Logo Mark ─────────────────────────────────────────────────────────────
function LogoMark({ size = 36 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.9, duration: 1800, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: size * 1.5, height: size * 1.5,
        borderRadius: size, borderWidth: 1, borderColor: C.accent,
        opacity: glow, transform: [{ scale: pulse }],
      }} />
      <View style={{
        width: size, height: size, borderRadius: size * 0.28,
        backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.accent,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: C.accent, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
      }}>
        <View style={{ width: size * 0.48, height: size * 0.52, position: 'relative' }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
          <View style={{ position: 'absolute', right: 0, top: 0, width: 2.5, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
          <View style={{
            position: 'absolute', left: 2, top: 0,
            width: Math.sqrt((size * 0.44) ** 2 + (size * 0.52) ** 2) * 0.6,
            height: 2.5, backgroundColor: C.accent, borderRadius: 1,
            transform: [{ rotate: '35deg' }, { translateX: 0 }],
          }} />
        </View>
      </View>
    </View>
  );
}

// ── AI Avatar ─────────────────────────────────────────────────────────────
function AIAvatar({ size = 26, isGenerating = false }: { size?: number, isGenerating?: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.linear })
      ).start();
    } else {
      spin.stopAnimation();
      spin.setValue(0);
    }
  }, [isGenerating]);

  const spinInterpolate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.3,
      backgroundColor: C.surface, borderWidth: 1, borderColor: isGenerating ? C.accent : C.border,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {isGenerating && (
        <Animated.View style={{
          position: 'absolute', width: size, height: size,
          borderRadius: size * 0.3, borderWidth: 1, borderColor: C.accent,
          borderStyle: 'dashed', transform: [{ rotate: spinInterpolate }]
        }} />
      )}
      <View style={{ width: size * 0.42, height: size * 0.48, position: 'relative' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: 1.5, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 0, top: 0, width: 1.5, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
        <View style={{
          position: 'absolute', left: 1.5, top: 0,
          width: size * 0.32, height: 1.5, backgroundColor: C.accent, borderRadius: 1,
          transform: [{ rotate: '38deg' }],
        }} />
      </View>
    </View>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loop = (a: Animated.Value, delay: number) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(a, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.delay(800 - delay),
      ])
    );
    Animated.parallel(anims.map((a, i) => loop(a, i * 180))).start();
  }, []);

  return (
    <View style={S.msgRow}>
      <AIAvatar isGenerating={true} />
      <View style={S.typingBubble}>
        {anims.map((a, i) => (
          <Animated.View key={i} style={[S.typingDot, {
            opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
            transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) }],
          }]} />
        ))}
      </View>
    </View>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────
const MessageBubble = memo(({ item, isGenerating }: { item: Message, isGenerating: boolean }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const isUser = item.role === 'user';
  
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      marginBottom: 8,
    }}>
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
          </View>
        </View>
      )}
    </Animated.View>
  );
}, (prev, next) => {
  return prev.item.content === next.item.content && prev.isGenerating === next.isGenerating;
});


// ── AVAILABLE TOP MODELS ──────────────────────────────────────────────────
const AVAILABLE_MODELS = [
  {
    id: "llama32-1b",
    name: "Llama 3.2 1B",
    desc: "Extremely fast, very capable. Perfect for older devices.",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    color: C.blue,
    size: "1.3 GB",
    provider: "Meta"
  },
  {
    id: "qwen25-15b",
    name: "Qwen 2.5 1.5B",
    desc: "Unbeatable reasoning for its size. Lightning fast.",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    color: C.purple,
    size: "1.1 GB",
    provider: "Alibaba"
  },
  {
    id: "llama32-3b",
    name: "Llama 3.2 3B",
    desc: "The sweet spot of speed and immense intelligence.",
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    color: C.blue,
    size: "2.1 GB",
    provider: "Meta"
  },
  {
    id: "deepseek-15b",
    name: "DeepSeek R1 1.5B",
    desc: "Distilled reasoning model. Thinks deeply.",
    url: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
    color: C.orange,
    size: "1.1 GB",
    provider: "DeepSeek"
  },
  {
    id: "gemma2-2b",
    name: "Gemma 2 2B",
    desc: "Google's lightweight but punchy architecture.",
    url: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
    color: C.green,
    size: "1.6 GB",
    provider: "Google"
  },
  {
    id: "phi3-mini",
    name: "Phi-3 Mini 3.8B",
    desc: "Microsoft's small model that hits way above its weight.",
    url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
    color: '#00A4EF',
    size: "2.4 GB",
    provider: "Microsoft"
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B (v0.3)",
    desc: "Very large. Needs 8GB+ RAM to run well.",
    url: "https://huggingface.co/MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/Mistral-7B-Instruct-v0.3.Q4_K_M.gguf",
    color: C.red,
    size: "4.4 GB",
    provider: "Mistral AI"
  },
];

// ── Splash Screen (Boot Animation) ──────────────────────────────────────────
function SplashScreen() {
  const pulse = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      )
    ]).start();
  }, []);

  return (
    <View style={[S.screen, { alignItems: 'center', justifyContent: 'center' }]}>
      <Animated.View style={{ opacity, transform: [{ scale: pulse }], alignItems: 'center' }}>
        <LogoMark size={90} />
        <Text style={{ color: C.textPrimary, fontSize: 32, fontWeight: '800', letterSpacing: -1, marginTop: 24 }}>Nexus</Text>
        <Text style={{ color: C.accent, fontSize: 14, fontWeight: '600', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Awakening Core</Text>
      </Animated.View>
    </View>
  );
}

// ── Animated Setup Screen (Model Store) ───────────────────────────────────
function SetupScreen({ currentModelUrl, isDownloading, downloadProgress, onDownload, onCancel, onSettings }: any) {
  const insets = useSafeAreaInsets();
  const [dots, setDots] = useState('.');
  
  // Continuous background wave animation
  const bgWave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgWave, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgWave, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!isDownloading) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [isDownloading]);

  const bgScale = bgWave.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const bgOpacity = bgWave.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  // If currently downloading, show a prominent downloading UI
  if (isDownloading) {
    return (
      <View style={[S.setupScreen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={{
          position: 'absolute', width: W*1.5, height: W*1.5, borderRadius: W,
          backgroundColor: C.accentSoft, opacity: bgOpacity, transform: [{ scale: bgScale }]
        }} />
        <LogoMark size={70} />
        <Text style={[S.setupAppName, { marginTop: 30 }]}>Downloading{dots}</Text>
        <Text style={S.setupTagline}>Preparing the AI brain. Please don't close the app.</Text>
        
        <View style={{ width: '80%', marginTop: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: C.textPrimary, fontWeight: '700' }}>Progress</Text>
            <Text style={{ color: C.accent, fontWeight: '700' }}>{Math.round(downloadProgress)}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: C.surfaceHighlight, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${downloadProgress}%`, backgroundColor: C.accent, borderRadius: 4 }} />
          </View>
        </View>

        <TouchableOpacity 
          style={{ marginTop: 40, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 100, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={{ color: C.red, fontWeight: '600' }}>Cancel Download</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[S.setupScreen, { paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LogoMark size={40} />
          <View>
            <Text style={{ color: C.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>Model Store</Text>
            <Text style={{ color: C.textSecondary, fontSize: 13 }}>Choose an AI engine to download</Text>
          </View>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {AVAILABLE_MODELS.map((model, idx) => {
          const isSelected = currentModelUrl === model.url;
          return (
            <TouchableOpacity 
              key={model.id} 
              activeOpacity={0.8}
              onPress={() => onDownload(model.url)}
              style={[
                S.storeCard, 
                isSelected && { borderColor: C.accent, backgroundColor: C.surfaceHighlight }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={[S.storeIconWrap, { borderColor: model.color + '40', backgroundColor: model.color + '15' }]}>
                  <Text style={{ color: model.color, fontWeight: '800', fontSize: 18 }}>{model.provider[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.storeCardTitle}>{model.name}</Text>
                  <Text style={S.storeCardDesc} numberOfLines={2}>{model.desc}</Text>
                </View>
                <View style={S.downloadBadge}>
                  <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>{model.size}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={S.customUrlBtn} onPress={onSettings} activeOpacity={0.7}>
          <Text style={S.customUrlBtnText}>Paste Custom HuggingFace URL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Chat Screen ───────────────────────────────────────────────────────────
export function ChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(getSettings());
  const [isAppBooting, setIsAppBooting] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  
  const llamaRef = useRef<LlamaContext | null>(null);
  const listRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;

  const modelFilename = settings.modelUrl.split('/').pop()?.split('?')[0] || 'model.gguf';

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => setSettings(getSettings()));
    return unsub;
  }, [navigation]);

  useEffect(() => {
    const saved = storage.getString(CHAT_HISTORY_KEY);
    if (saved) setMessages(JSON.parse(saved));
    checkAndInit();
    return () => { llamaRef.current?.release(); };
  }, [settings.modelUrl]);

  useEffect(() => {
    if (messages.length > 0) storage.set(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const checkAndInit = async () => {
    try {
      if (await checkModelExists(modelFilename)) {
        await initModel();
      } else {
        setModelReady(false);
      }
    } catch (e) { console.error(e); }
    finally {
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
    const filename = urlToDownload.split('/').pop()?.split('?')[0] || 'model.gguf';
    
    try {
      await downloadModel(urlToDownload, filename, p => setDownloadProgress(p));
      await initModel(filename);
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes('canceled')) {
        // Download was canceled, don't show error alert
      } else {
        Alert.alert("Download Failed", "There was an error downloading the model. Please check your connection and try again.");
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
        use_mlock: true, 
        n_ctx: 1024, 
        n_gpu_layers: 1,
        n_threads: 2, // Restrict threads so OS scheduler doesn't thrash (improves thermal throttling & speed)
      });
      setModelReady(true);
      if (messages.length === 0) {
        setMessages([{ id: Date.now().toString(), role: 'system', content: settings.systemPrompt }]);
      }
    } catch (e) {
      console.error("Failed to load model:", e);
      // Delete corrupted file so we don't try to load it again
      await deleteModel(fileToLoad);
      setModelReady(false);
      Alert.alert("Model Error", "The model file appears to be corrupted. It has been automatically deleted. Please download it again.");
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isGenerating || !llamaRef.current) return;
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 70, useNativeDriver: true }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    let prompt = '';
    messages.forEach(m => {
      if (m.role === 'system') prompt += `<|system|>\n${m.content}<|end|>\n`;
      else if (m.role === 'user') prompt += `<|user|>\n${m.content}<|end|>\n`;
      else if (m.role === 'assistant') prompt += `<|assistant|>\n${m.content}<|end|>\n`;
    });
    prompt += `<|user|>\n${userMsg.content}<|end|>\n<|assistant|>\n`;

    const aid = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: aid, role: 'assistant', content: '' }]);
    setInputText('');
    setIsGenerating(true);

    try {
      await llamaRef.current.completion(
        { prompt, n_predict: 512, temperature: settings.temperature, top_p: settings.top_p, top_k: settings.top_k, stop: ['<|end|>', '<|user|>'] },
        data => setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: m.content + data.token } : m))
      );
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  const stopGeneration = () => {
    if (llamaRef.current && isGenerating) {
      llamaRef.current.stopCompletion();
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: Date.now().toString(), role: 'system', content: settings.systemPrompt }]);
    storage.set(CHAT_HISTORY_KEY, JSON.stringify([]));
  };

  const switchModel = (url: string) => {
    const newSettings = { ...settings, modelUrl: url };
    setSettings(newSettings);
    saveSettings(newSettings);
    setShowModelModal(false);
    setModelReady(false); // trigger download/init flow
  };

  const renderItem = useCallback(({ item, index }: { item: Message, index: number }) => {
    if (item.role === 'system') return null;
    const isLast = index === messages.length - 1;
    const isCurrentlyGenerating = isGenerating && item.role === 'assistant' && isLast;
    
    if (item.role === 'assistant' && item.content === '' && isGenerating) return <TypingIndicator />;
    return <MessageBubble item={item} isGenerating={isCurrentlyGenerating} />;
  }, [messages, isGenerating]);

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

  return (
    <View style={[S.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.headerBrand} onPress={() => setShowModelModal(true)} activeOpacity={0.7}>
          <View style={S.headerLogoWrap}>
            <View style={{ width: 18, height: 20, position: 'relative' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
              <View style={{ position: 'absolute', right: 0, top: 0, width: 2, height: '100%', backgroundColor: C.accent, borderRadius: 1 }} />
              <View style={{ position: 'absolute', left: 2, top: 0, width: 12, height: 2, backgroundColor: C.accent, borderRadius: 1, transform: [{ rotate: '35deg' }, { translateY: 2 }] }} />
            </View>
          </View>
          <View style={{ gap: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={S.headerBrandName}>Nexus</Text>
              <View style={{ width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: C.textSecondary, marginTop: 2 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={S.onlineDot} />
              <Text style={S.headerStatus} numberOfLines={1}>{findModelName(settings.modelUrl)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={S.headerActions}>
          <TouchableOpacity style={S.headerBtn} onPress={clearChat} activeOpacity={0.6}>
            <ClearIcon />
          </TouchableOpacity>
          <TouchableOpacity style={S.headerBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.6}>
            <MenuIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={S.divider} />

      <KeyboardAvoidingView style={S.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages.filter(m => m.role !== 'system')}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[S.chatContent, { flexGrow: 1 }]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={S.emptyState}>
              <LogoMark size={48} />
              <Text style={S.emptyTitle}>Good to see you.</Text>
              <Text style={S.emptyBody}>Ask me anything. I run entirely on your device — no cloud, no tracking.</Text>
              <View style={S.suggestionsWrap}>
                {['Explain quantum computing simply', 'Write a haiku about code', 'What is the Fermi paradox?'].map(s => (
                  <TouchableOpacity key={s} style={S.suggestionChip} onPress={() => setInputText(s)} activeOpacity={0.7}>
                    <Text style={S.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />

        {/* Input */}
        <View style={[S.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <View style={S.inputWrap}>
            <TextInput
              style={S.input}
              placeholder="Message Nexus..."
              placeholderTextColor={C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
          </View>
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            {isGenerating ? (
              <TouchableOpacity style={S.stopBtn} onPress={stopGeneration} activeOpacity={0.85}>
                <StopIcon />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[S.sendBtn, !inputText.trim() && S.sendBtnDim]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.85}
              >
                <SendIcon />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Model Selector Modal ────────────────────────────────────────── */}
      <Modal visible={showModelModal} animationType="slide" transparent={true} onRequestClose={() => setShowModelModal(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={S.modalHandle} />
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Change Model</Text>
              <TouchableOpacity onPress={() => setShowModelModal(false)} style={S.modalCloseBtn}>
                <ClearIcon />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              {AVAILABLE_MODELS.map((model) => (
                <TouchableOpacity 
                  key={model.id}
                  style={[S.modelOption, settings.modelUrl === model.url && { borderColor: C.accent, backgroundColor: C.surfaceHighlight }]} 
                  onPress={() => switchModel(model.url)}
                >
                  <View style={[S.modelOptionIcon, { backgroundColor: model.color + '20', borderColor: model.color + '50' }]}>
                    <Text style={{ color: model.color, fontSize: 16, fontWeight: '700' }}>{model.provider[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.modelOptionTitle}>{model.name}</Text>
                    <Text style={S.modelOptionSub} numberOfLines={1}>{model.desc}</Text>
                  </View>
                  <View style={S.downloadBadge}>
                    <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>{model.size}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={S.modelOption} onPress={() => { setShowModelModal(false); navigation.navigate('Settings'); }}>
                <View style={S.modelOptionIcon}>
                  <Text style={{ color: C.textSecondary, fontSize: 16 }}>⚙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.modelOptionTitle}>Custom URL</Text>
                  <Text style={S.modelOptionSub}>Paste a direct .gguf link in Settings.</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerLogoWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBrandName: { fontSize: 16, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.3 },
  headerStatus: { fontSize: 11, color: C.textMuted, letterSpacing: 0.2, maxWidth: 140 },
  onlineDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.green },
  headerActions: { flexDirection: 'row', gap: 6 },
  headerBtn: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  chatContent: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },

  userRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: 48 },
  userBubble: {
    backgroundColor: C.userBubble, borderRadius: 20, borderTopRightRadius: 5,
    paddingHorizontal: 15, paddingVertical: 11,
    borderWidth: 1, borderColor: C.userBubbleBorder,
  },
  userText: { fontSize: 15, color: '#D4CAFF', lineHeight: 23 },

  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingRight: 32 },
  aiBubble: {
    flex: 1, backgroundColor: C.aiBubble, borderRadius: 20, borderTopLeftRadius: 5,
    paddingHorizontal: 15, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border,
  },
  aiText: { fontSize: 15, color: C.textPrimary, lineHeight: 23 },

  typingBubble: {
    backgroundColor: C.aiBubble, borderRadius: 20, borderTopLeftRadius: 5,
    paddingHorizontal: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24, gap: 14 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.4, marginTop: 8 },
  emptyBody: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  suggestionsWrap: { width: '100%', gap: 8, marginTop: 8 },
  suggestionChip: {
    backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: C.border,
  },
  suggestionText: { color: C.textSecondary, fontSize: 13, lineHeight: 19 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  inputWrap: {
    flex: 1, backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 15, paddingVertical: 6,
    minHeight: 46, justifyContent: 'center',
  },
  input: { color: C.textPrimary, fontSize: 15, maxHeight: 130, paddingVertical: 4 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDim: { backgroundColor: C.surface, shadowOpacity: 0, elevation: 0 },
  stopBtn: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: C.red, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },

  // Setup / Store UI
  setupScreen: { flex: 1, backgroundColor: C.bg },
  setupLogoArea: { alignItems: 'center', gap: 0 },
  setupAppName: { fontSize: 28, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  setupTagline: { fontSize: 14, color: C.textSecondary, marginTop: 6 },
  storeCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  storeIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1
  },
  storeCardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  storeCardDesc: { fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 18 },
  downloadBadge: { backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  customUrlBtn: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', marginTop: 10
  },
  customUrlBtnText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: C.border, borderBottomWidth: 0,
    maxHeight: H * 0.85, paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalSectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, marginBottom: 12 },
  modelOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  modelOptionIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modelOptionTitle: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  modelOptionSub: { fontSize: 12, color: C.textSecondary, marginTop: 2, lineHeight: 18 },
});

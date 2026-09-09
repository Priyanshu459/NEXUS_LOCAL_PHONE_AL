import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConversationDrawer } from '../components/ConversationDrawer';
import { getDeviceRecommendation } from '../services/deviceRecommendation';
import { storage, defaultSettings } from '../services/storage';
import { getModelFilenameFromUrl } from '../services/modelManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  getSettings,
  saveSettings,
  PersistedMessage,
} from '../services/storage';
import {
  checkModelExists,
  downloadModel,
  getModelPath,
  deleteModel,
  cancelDownload,
} from '../services/modelManager';
import { initLlama, LlamaContext } from 'llama.rn';
import {checkLoadCapacity, serializeModelLoad} from '../services/modelLoadGuard';
import {getSearchConnection, restoreSearchConnection, searchWeb, sanitizeSources, WebSource} from '../services/webSearch';
import {
  getMemoryContextString,
  addMemory,
  parseMemoryActions,
} from '../services/MemoryManager';
import {
  AI_REPORT_CATEGORIES,
  AiReportCategory,
  isAiReportingConfigured,
  submitAiReport,
} from '../services/aiReportService';
import { fitContext } from '../services/contextWindow';
import { listConversations, saveConversation } from '../services/conversations';
import { AnswerText } from '../components/AnswerText';
import { MoonMark, IconButton, ui } from '../components/Design';
import { Theme, themedStyles, useAppearance } from '../constants/theme';
import { AVAILABLE_MODELS } from '../constants/models';
type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type Message = PersistedMessage;
const MODEL_CONTEXT_SIZE = 1024;
const generateUniqueId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const C = {
  get bg() { return Theme.color.background; },
  get surface() { return Theme.color.surface; },
  get surfaceHighlight() { return Theme.color.surfaceRaised; },
  get border() { return Theme.color.border; },
  get accent() { return Theme.color.accent; },
  get accentSoft() { return Theme.color.accentSoft; },
  get textPrimary() { return Theme.color.text; },
  get textSecondary() { return Theme.color.textSecondary; },
  get textMuted() { return Theme.color.textMuted; },
  get green() { return Theme.color.success; },
  get red() { return Theme.color.destructive; },
};
function ReportResponseModal({
  message,
  onClose,
}: {
  message: Message | null;
  onClose: () => void;
}) {
  useAppearance();
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

export function ChatScreen({ navigation, route }: Props) {
  const appearance = useAppearance();
  const [drawer, setDrawer] = useState(false);
  const [webEnabled, setWebEnabled] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchAbort = useRef<AbortController | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [recommendedId, setRecommendedId] = useState('');
  const conversationId = useRef(
    route.params?.conversationId || generateUniqueId(),
  );
  const generationBusy = useRef(false);
  const cancelRequested = useRef(false);
  const mounted = useRef(true);
  const modelEpoch = useRef(0);
  const downloadEpoch = useRef(0);
  const releasePending = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      searchAbort.current?.abort();
    };
  }, []);
  const [contextNotice, setContextNotice] = useState('');
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
    if (voiceModeActive || generationBusy.current) return;
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
      if (mounted.current && typeof result === 'string' && result.trim()) {
        Keyboard.dismiss();
        if (llamaRef.current && !generationBusy.current) {
          await handleSendMessage(result);
        } else {
          setInputText(result);
          Alert.alert('Message saved', 'Your model is not ready. Send this message once it has loaded.');
        }
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
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(
    () =>
      listConversations().find(c => c.id === route.params?.conversationId)
        ?.messages || [],
  );
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

  const modelFilename = getModelFilenameFromUrl(settings.modelUrl);

  useEffect(() => {
    let active = true;
    getDeviceRecommendation().then(async result => {
      if (!active) return;
      setRecommendation(result.reason); setRecommendedId(result.model.id);
      const saved = getSettings();
      if (!storage.getString('model_recommendation_done') && saved.modelUrl === defaultSettings.modelUrl) {
        const exists = await checkModelExists(getModelFilenameFromUrl(saved.modelUrl));
        if (!active) return;
        if (!exists) { const next = {...saved, modelUrl: result.model.url}; saveSettings(next); setSettings(next); }
      }
      storage.set('model_recommendation_done', 'true');
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (route.params?.openHistory) { setDrawer(true); navigation.setParams({openHistory: false}); }
    if (route.params?.conversationId) {
      const found = listConversations().find(c => c.id === route.params?.conversationId);
      if (found) { conversationId.current = found.id; setMessages(found.messages); }
    } else if (route.params?.newConversation) {
      conversationId.current = generateUniqueId(); setMessages([]);
      navigation.setParams({newConversation: false});
    }
  }, [route.params?.conversationId, route.params?.newConversation, route.params?.openHistory, navigation]);
  useEffect(() => {
    if (route?.params?.initialPrompt) {
      setInputText(route.params.initialPrompt);
    }
  }, [route?.params?.initialPrompt]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setSettings(getSettings());
      // A download may have completed in Models without changing the selected URL.
      if (!llamaRef.current && getSettings().modelUrl === settings.modelUrl) {
        void checkAndInit(modelEpoch.current);
      }
      if (messages.length && !listConversations().some(c => c.id === conversationId.current)) {
        setMessages([]); conversationId.current = generateUniqueId();
      }
    });
    return unsub;
  }, [navigation, messages.length, settings.modelUrl]);

  useEffect(() => {
    setIsAppBooting(true);
    setModelReady(false);
    const epoch = ++modelEpoch.current;
    const initTimer = setTimeout(() => {
      checkAndInit(epoch);
    }, 600);
    return () => {
      clearTimeout(initTimer);
      modelEpoch.current = epoch + 1;
      cancelRequested.current = true;
      searchAbort.current?.abort();
      const context = llamaRef.current;
      llamaRef.current = null;
      if (context) {
        try {
          const stopRes = context.stopCompletion() as unknown;
          if (stopRes && typeof (stopRes as any).catch === 'function') {
            (stopRes as Promise<any>).catch(() => {});
          }
        } catch {}
        try {
          const releaseRes = context.release() as unknown;
          releasePending.current = Promise.resolve(releaseRes).catch(() => {});
          if (releaseRes && typeof (releaseRes as any).catch === 'function') {
            (releaseRes as Promise<any>).catch(() => {});
          }
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.modelUrl]);

  useEffect(() => {
    if (messages.length > 0 && !isGenerating) {
      saveConversation(conversationId.current, messages);
    }
  }, [messages, isGenerating]);

  const checkAndInit = async (epoch: number) => {
    try {
      const exists = await checkModelExists(modelFilename);
      if (!mounted.current || epoch !== modelEpoch.current) return;
      if (exists) {
        await initModel(undefined, epoch);
      } else {
        setModelReady(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAppBooting(false);
    }
  };

  const handleDownload = async (urlToDownload: string) => {
    if (isDownloading) return;
    const request = ++downloadEpoch.current;
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
      if (request === downloadEpoch.current && mounted.current) await initModel(downloadedFilename);
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
      if (request === downloadEpoch.current && mounted.current) setIsDownloading(false);
    }
  };

  const handleCancelDownload = () => {
    downloadEpoch.current++;
    cancelDownload();
    setIsDownloading(false);
  };

  const initModel = async (
    specificFilename?: string,
    epoch = modelEpoch.current,
  ) => serializeModelLoad(async () => {
    if (!mounted.current || epoch !== modelEpoch.current || llamaRef.current) return;
    const fileToLoad = specificFilename || modelFilename;
    try {
      await releasePending.current;
      if (!mounted.current || epoch !== modelEpoch.current) return;
      llamaRef.current = null;
      setModelReady(false);

      await checkLoadCapacity(getModelPath(fileToLoad));
      if (!mounted.current || epoch !== modelEpoch.current) return;

      const loaded = await initLlama({
        model: getModelPath(fileToLoad),
        use_mlock: false,
        use_mmap: true,
        n_batch: 128,
        n_ubatch: 64,
        n_ctx: MODEL_CONTEXT_SIZE,
        n_gpu_layers: 0,
        n_threads: 2,
      });
      if (!mounted.current || epoch !== modelEpoch.current) {
        await loaded.release();
        return;
      }
      llamaRef.current = loaded;
      setModelReady(true);
    } catch (e: any) {
      console.error('Failed to load model:', e);
      if (llamaRef.current) await llamaRef.current.release();
      llamaRef.current = null;
      setModelReady(false);

      Alert.alert('Model Error', `Failed to load the model.\n\n${e?.message}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => initModel(fileToLoad) },
        {
          text: 'Delete Model',
          style: 'destructive',
          onPress: async () => {
            await deleteModel(fileToLoad);
            setModelReady(false);
          },
        },
      ]);
    }
  });

  const handleSendMessage = async (textOverride?: string, historyOverride?: Message[]) => {
    const rawInput = (
      textOverride !== undefined ? textOverride : inputText
    ).trim();
    if (
      (!rawInput && !attachedFile) ||
      generationBusy.current ||
      !llamaRef.current
    )
      return;
    generationBusy.current = true;
    cancelRequested.current = false;
    const context = llamaRef.current;

    let displayInput = rawInput;
    if (attachedFile) {
      displayInput = `📄 ${attachedFile.name}\n\n${
        rawInput || 'Please analyze this document.'
      }`;
    }

    const userMsg: Message = {
      id: generateUniqueId().toString(),
      role: 'user',
      content: displayInput,
    };
    const currentAttachmentText = attachedFile
      ? attachedFile.content
      : undefined;

    const aid = generateUniqueId().toString();
    const newMessages = [...(historyOverride ?? messages), userMsg];
    saveConversation(conversationId.current, newMessages);
    setMessages([...newMessages, { id: aid, role: 'assistant', content: '' }]);
    if (!historyOverride) setInputText('');
    setAttachedFile(null);
    setIsGenerating(true);

    let fullResponse = '';
    const turnQuery = webEnabled ? rawInput.slice(0,400) : '';
    let usedSources: WebSource[] = [];
    try {
      let webSources: WebSource[] | undefined;
      if (turnQuery) {
        setSearching(true);
        searchAbort.current = new AbortController();
        webSources = await searchWeb(turnQuery, searchAbort.current.signal);
        if (cancelRequested.current || !mounted.current) throw new Error('Search cancelled.');
        setSearching(false);
      }
      const formattedResult = await fitContext(
        context,
        {
          messages: newMessages,
          systemPrompt: settings.systemPrompt + (settings.responseStyle === 'concise' ? '\nKeep answers brief and practical.' : settings.responseStyle === 'detailed' ? '\nGive thorough explanations with useful examples.' : ''),
          memoryContextString: settings.memoryEnabled && !turnQuery
            ? getMemoryContextString()
            : '',
          currentAttachmentText,
          modelUrl: settings.modelUrl,
          webSources,
        },
        MODEL_CONTEXT_SIZE,
        turnQuery ? Math.min(settings.maxTokens,256) : settings.maxTokens,
      );
      usedSources = formattedResult.webSources || [];
      setMessages(prev => prev.map(m => m.id === aid ? {...m,sources:usedSources} : m));
      if (cancelRequested.current) {
        setMessages(newMessages);
        return;
      }
      setContextNotice(
        formattedResult.removedMessages
          ? 'Using recent messages to fit this model. Your full conversation is saved.'
          : '',
      );

      await context.completion(
        {
          prompt: formattedResult.prompt,
          n_predict: formattedResult.nPredict,
          temperature: settings.temperature,
          top_p: settings.top_p,
          top_k: settings.top_k,
          stop: [
            ...formattedResult.additionalStops,
            '<|end|>',
            '<|user|>',
            '<|im_end|>',
            '<|im_start|>',
          ],
        },
        data => {
          if (cancelRequested.current) return;
          fullResponse += data.token;
          const displayContent = fullResponse
            .replace(/<MEMORY>[\s\S]*?(?:<\/MEMORY>|$)/gi, '')
            .trim();
          setMessages(prev =>
            prev.map(m =>
              m.id === aid ? { ...m, content: displayContent } : m,
            ),
          );
        },
      );

      if (!cancelRequested.current && settings.memoryEnabled && !turnQuery) {
        const newMemories = parseMemoryActions(fullResponse);
        newMemories.forEach(m => addMemory(m));
      }
      const savedResponse = fullResponse
        .replace(/<MEMORY>[\s\S]*?(?:<\/MEMORY>|$)/gi, '')
        .trim();
      const completedMessages: Message[] = savedResponse
        ? [
            ...newMessages,
            { id: aid, role: 'assistant', content: savedResponse, sources:usedSources },
          ]
        : newMessages;
      saveConversation(conversationId.current, completedMessages);
      if (mounted.current) setMessages(completedMessages);
    } catch (e: any) {
      if (cancelRequested.current) {
        // User requested stop: preserve whatever response was already received, or remove empty assistant placeholder
        const savedResponse = fullResponse
          .replace(/<MEMORY>[\s\S]*?(?:<\/MEMORY>|$)/gi, '')
          .trim();
        const completedMessages: Message[] = savedResponse
          ? [
              ...newMessages,
              { id: aid, role: 'assistant', content: savedResponse, sources:usedSources },
            ]
          : newMessages;
        saveConversation(conversationId.current, completedMessages);
        if (mounted.current) setMessages(completedMessages);
      } else {
        console.error(e);
        Alert.alert(
          turnQuery ? 'Web answer unavailable' : 'Generation Error',
          e?.message || 'Failed to generate response.',
        );
        saveConversation(conversationId.current, messages);
        setMessages(messages);
        if (!historyOverride) setInputText(rawInput);
        setAttachedFile(attachedFile);
      }
    } finally {
      generationBusy.current = false;
      searchAbort.current = null;
      if (mounted.current) {
        setIsGenerating(false);
        setSearching(false);
      }
    }
  };

  const stopGeneration = () => {
    if (llamaRef.current && isGenerating) {
      cancelRequested.current = true;
      searchAbort.current?.abort();
      try {
        const stopRes = llamaRef.current.stopCompletion() as unknown;
        if (stopRes && typeof (stopRes as any).catch === 'function') {
          (stopRes as Promise<any>).catch(() => {});
        }
      } catch (err) {
        console.warn('stopCompletion failed:', err);
      }
    }
  };

  const clearChat = () => {
    if (generationBusy.current) return;
    if (messages.length) saveConversation(conversationId.current, messages);
    conversationId.current = generateUniqueId();
    setMessages([]);
    setContextNotice('');
    setInputText(''); setAttachedFile(null);
  };

  const switchModel = (url: string) => {
    if (generationBusy.current) return;
    const newSettings = { ...settings, modelUrl: url };
    setSettings(newSettings);
    saveSettings(newSettings);
    setShowModelModal(false);
    setModelReady(false); // trigger download/init flow
  };

  const selected = AVAILABLE_MODELS.find(m => m.url === settings.modelUrl);
  const copy = async (text: string) => {
    try {
      if (!NativeModules.DeviceControl?.copyToClipboard)
        throw new Error('Clipboard unavailable');
      await NativeModules.DeviceControl.copyToClipboard(text);
      setContextNotice('Copied to clipboard.');
    } catch {
      Alert.alert(
        'Could not copy',
        'Select the response text to copy it manually.',
      );
    }
  };
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <IconButton glyph="☰" label="Open menu" disabled={isGenerating || isDownloading} onPress={() => setDrawer(true)} />
        <View style={[ui.row, ui.flex, {justifyContent: 'center'}]}><MoonMark size={28} /><Text style={S.headerTitle}>Moonlight</Text></View>
        <IconButton glyph="＋" label="Start a new conversation" disabled={isGenerating || isDownloading} onPress={clearChat} />
      </View>
      {modelReady && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose a model" disabled={isGenerating || isDownloading} onPress={() => setShowModelModal(true)} style={{alignSelf:'center', padding:12}}>
        <Text style={ui.small}>{selected?.name || 'Custom model'} · On device  ⌄</Text>
      </TouchableOpacity>}
      <KeyboardAvoidingView
        style={ui.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          style={{flex:1,minHeight:0}}
          ref={listRef}
          data={messages}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={S.messages}
          onLayout={() => listRef.current?.scrollToEnd({animated:false})}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={S.welcome}>
              <Text style={S.welcomeTitle}>A little clarity.{'\n'}A lot of possibility.</Text>
              {modelReady && <Text style={S.welcomeBody}>
                Big questions, half-formed ideas, everyday things.
              </Text>}
              {isAppBooting ? (
                <View style={S.loading}>
                  <ActivityIndicator color={C.accent} />
                  <Text style={ui.small}>Preparing your local model</Text>
                </View>
              ) : !modelReady ? (
                <View style={S.setup}>
                  <Text style={S.setupTitle}>
                    {isDownloading
                      ? 'Downloading your model'
                      : 'Set up local chat'}
                  </Text>
                  <Text style={ui.body}>
                    {isDownloading
                      ? 'Keep writing while it downloads. Keep the app open.'
                      : 'Download a model once, then chat with it offline. Your phone does the thinking.'}
                  </Text>
                  <Text style={S.modelName}>
                    {selected?.name || 'Your custom model'}
                    {selected ? ' · ' + selected.size : ''}
                  </Text>
                  {selected?.id === recommendedId && <Text style={ui.small}>Suggested for your available device capacity</Text>}
                  {isDownloading && (
                    <View
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: Math.round(downloadProgress),
                      }}
                      style={S.progress}
                    >
                      <View
                        style={[
                          S.progressFill,
                          {
                            width: (Math.max(
                              0,
                              Math.min(100, downloadProgress),
                            ) + '%') as any,
                          },
                        ]}
                      />
                    </View>
                  )}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={ui.primary}
                    onPress={() =>
                      isDownloading
                        ? handleCancelDownload()
                        : handleDownload(settings.modelUrl)
                    }
                  >
                    <Text style={ui.primaryText}>
                      {isDownloading
                        ? 'Cancel download · ' +
                          Math.round(downloadProgress) +
                          '%'
                        : selected?.id === 'moonlight-v7' ? 'Download Moonlight' : 'Download model'}
                    </Text>
                  </TouchableOpacity>
                  {!isDownloading && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={S.textButton}
                      onPress={() => setShowModelModal(true)}
                    >
                      <Text style={S.link}>Choose another model</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={S.starters}>
                  {[
                    'Explain a tricky idea',
                    'Help me write something',
                    'Plan my next step',
                  ].map(text => (
                    <TouchableOpacity
                      key={text}
                      accessibilityRole="button"
                      style={S.starter}
                      onPress={() => setInputText(text)}
                    >
                      <Text style={ui.body}>{text}</Text>
                      <Text style={S.link}>↗</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) =>
            item.role === 'user' ? (
              <View style={S.userRow}>
                <Text selectable style={[S.userText, appearance.largeText && {fontSize:20,lineHeight:30}]}>
                  {item.content}
                </Text>
              </View>
            ) : (
              <View style={S.answer}>
                <View style={S.answerHeader}>
                  <MoonMark size={18} />
                  <Text style={S.answerName}>Moonlight</Text>
                  {isGenerating && index === messages.length - 1 && (
                    <ActivityIndicator size="small" color={C.accent} />
                  )}
                </View>
                {item.content ? (
                  <AnswerText content={item.content} />
                ) : (
                  <Text style={ui.small}>{searching ? 'Searching the web…' : 'Thinking through your message…'}</Text>
                )}
                {!!item.sources?.length && <View style={{gap:8,marginTop:14}}>
                  <Text style={ui.small}>Search sources · Excerpts may be incomplete</Text>
                  {sanitizeSources(item.sources).map(source=><TouchableOpacity key={source.url} accessibilityRole="link" onPress={()=>Linking.openURL(source.url).catch(()=>Alert.alert('Unable to open source','Try again in your browser.'))} style={[ui.card,{padding:12}]}>
                    <Text style={ui.body}>[{source.id}] {source.title}</Text><Text style={ui.small}>{new URL(source.url).hostname}</Text>
                  </TouchableOpacity>)}
                </View>}
                {!!item.content && !isGenerating && (
                  <View style={S.answerActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={S.action}
                      onPress={() => copy(item.content)}
                    >
                      <Text style={S.actionText}>Copy</Text>
                    </TouchableOpacity>
                    {index === messages.length - 1 && <TouchableOpacity accessibilityRole="button" style={S.action} disabled={!modelReady} onPress={() => {
                      const previous = messages[index-1];
                      if (previous?.role !== 'user') return;
                      if (previous.content.startsWith('📄')) { Alert.alert('Attach the file again', 'File contents are not retained for retry. Attach it again to generate another answer.'); return; }
                      if (attachedFile) { Alert.alert('Remove the attachment first', 'Retry uses the previous message. Your current draft is kept.'); return; }
                      void handleSendMessage(previous.content, messages.slice(0,index-1));
                    }}><Text style={S.actionText}>Retry</Text></TouchableOpacity>}
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={S.action}
                      onPress={() =>
                        Share.share({ message: item.content }).catch(() =>
                          Alert.alert('Sharing unavailable'),
                        )
                      }
                    >
                      <Text style={S.actionText}>Share</Text>
                    </TouchableOpacity>
                    {isAiReportingConfigured() && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        style={S.action}
                        onPress={() => setReportedMessage(item)}
                      >
                        <Text style={S.actionText}>Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )
          }
        />
        {!!messages.length && !modelReady && (
          <TouchableOpacity
            accessibilityRole="button"
            style={S.resume}
            onPress={() =>
              isDownloading
                ? handleCancelDownload()
                : !isAppBooting && handleDownload(settings.modelUrl)
            }
          >
            <Text style={S.link}>
              {isAppBooting
                ? 'Loading model…'
                : isDownloading
                ? 'Cancel download · ' + Math.round(downloadProgress) + '%'
                : 'Download selected model to continue'}
            </Text>
          </TouchableOpacity>
        )}
        {!!contextNotice && (
          <Text accessibilityLiveRegion="polite" style={S.notice}>
            {contextNotice}
          </Text>
        )}
        {!!attachedFile && (
          <View style={S.attachment}>
            <View style={ui.flex}>
              <Text numberOfLines={1} style={S.modelName}>
                {attachedFile.name}
              </Text>
              <Text style={ui.small}>
                Text attachment · {attachedFile.size}
              </Text>
            </View>
            <IconButton
              glyph="×"
              label="Remove attachment"
              onPress={() => setAttachedFile(null)}
            />
          </View>
        )}
        <View
          onLayout={() => listRef.current?.scrollToEnd({animated:false})}
          style={[
            S.composer,
            { marginBottom: (isKeyboardVisible ? 0 : insets.bottom) + 8 },
          ]}
        >
          <TextInput
            accessibilityLabel="Message"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={12000}
            style={S.input}
            placeholder="Ask Moonlight"
            placeholderTextColor={C.textMuted}
          />
          <View style={S.composerTools}>
            <IconButton
              glyph="＋"
              label="Attach a text file"
              disabled={isGenerating}
              onPress={handlePickFile}
            />
            <TouchableOpacity accessibilityRole="switch" accessibilityState={{checked:webEnabled}} accessibilityLabel="Web search" disabled={isGenerating} style={S.memoryButton} onPress={async () => {
              if (webEnabled) {setWebEnabled(false);return;}
              try {await restoreSearchConnection();} catch(error:any) {Alert.alert('Search connection',error.message);return;}
              if (!getSearchConnection().connected) {Alert.alert('Connect web search','Open Settings → Web search and save the server address and access key supplied by your alpha administrator.',[{text:'Later',style:'cancel'},{text:'Open settings',onPress:()=>navigation.navigate('Settings')}]);return;}
              setWebEnabled(true);
            }}>
              <Text style={[ui.small,webEnabled&&{color:C.accent,fontWeight:'600'}]}>{webEnabled ? '◎ Web on' : '◎ Web off'}</Text>
            </TouchableOpacity>
            <View style={ui.flex} />
            <IconButton
              glyph="≋"
              icon="microphone"
              label="Speak and send message"
              disabled={voiceModeActive || isGenerating}
              onPress={startVoiceInput}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                isGenerating ? 'Stop response' : 'Send message'
              }
              disabled={
                !isGenerating &&
                (!modelReady || (!inputText.trim() && !attachedFile))
              }
              onPress={() =>
                isGenerating ? stopGeneration() : handleSendMessage()
              }
              style={[
                S.send,
                !isGenerating &&
                  (!modelReady || (!inputText.trim() && !attachedFile)) &&
                  ui.disabled,
              ]}
            >
              <Text style={S.sendText}>{isGenerating ? '■' : '↑'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <ConversationDrawer visible={drawer} onDeleted={id => {if(id === conversationId.current) {conversationId.current = generateUniqueId(); setMessages([]);}}} onClose={() => setDrawer(false)} onNew={() => {clearChat(); setDrawer(false);}} onOpen={conversation => {
        conversationId.current = conversation.id; setMessages(conversation.messages); setInputText(''); setAttachedFile(null); setDrawer(false);
      }} onNavigate={name => {setDrawer(false); navigation.navigate(name);}} />
      <ReportResponseModal
        message={reportedMessage}
        onClose={() => setReportedMessage(null)}
      />
      <Modal
        transparent
        visible={showModelModal}
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={S.reportOverlay}>
          <View style={[S.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={S.sheetHeader}>
              <Text style={S.setupTitle}>Choose your model</Text>
              <IconButton
                glyph="×"
                label="Close model picker"
                onPress={() => setShowModelModal(false)}
              />
            </View>
            <Text style={ui.body}>
              {recommendation || 'Models run locally after download. Larger models need more memory.'}
            </Text>
            <ScrollView>
              {[...AVAILABLE_MODELS].sort((a,b) => Number(b.id === recommendedId) - Number(a.id === recommendedId)).map(model => (
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: model.url === settings.modelUrl,
                  }}
                  key={model.id}
                  style={S.modelOption}
                  onPress={() => switchModel(model.url)}
                >
                  <View style={ui.flex}>
                    <Text style={S.modelName}>{model.name}</Text>
                    <Text style={ui.small}>
                      {model.provider} · {model.size}{model.id === recommendedId ? ' · Suggested' : ''}
                    </Text>
                  </View>
                  <Text style={S.link}>
                    {model.url === settings.modelUrl ? 'Selected' : 'Select'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              accessibilityRole="button"
              style={S.textButton}
              onPress={() => {
                setShowModelModal(false);
                navigation.navigate('Settings');
              }}
            >
              <Text style={S.link}>Use a custom model URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const S = themedStyles(() => ({
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
  reportPrimaryText: { color: C.bg, fontSize: 14, fontWeight: '800' },
  reportSecondary: { marginTop: 8, padding: 12, alignItems: 'center' },
  reportSecondaryText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  reportDisabled: { opacity: 0.55 },
  reportSuccess: { color: C.green, marginTop: 14, lineHeight: 19 },
  reportFailure: { color: C.red, marginTop: 14, lineHeight: 19 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modelPicker: { flex: 1, padding: 8 },
  headerTitle: { fontSize: 19, fontWeight: '600', color: C.textPrimary },
  chevron: { color: C.textMuted },
  status: { color: C.textMuted, fontSize: 11, marginTop: 4 },
  messages: { padding: 22, paddingBottom: 30, flexGrow: 1 },
  welcome: { alignItems: 'center', paddingTop: 8, gap: 12 },
  welcomeTitle: {
    fontFamily: Theme.headingFont,
    fontSize: 29,
    fontWeight: '500',
    letterSpacing: -1,
    color: C.textPrimary,
    textAlign: 'center',
  },
  welcomeBody: {
    color: C.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 23,
  },
  loading: { gap: 12, padding: 24 },
  setup: {
    alignSelf: 'stretch',
    marginTop: 10,
    padding: 18,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  setupTitle: { color: C.textPrimary, fontSize: 20, fontWeight: '600' },
  modelName: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  link: { color: C.accent, fontSize: 13, fontWeight: '600' },
  textButton: {
    padding: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.accent },
  starters: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
  starter: {
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userRow: { alignItems: 'flex-end', marginBottom: 28, paddingLeft: 30 },
  userText: {
    backgroundColor: C.surfaceHighlight,
    color: C.textPrimary,
    padding: 16,
    borderRadius: 22,
    fontSize: 16,
    lineHeight: 24,
    overflow: 'hidden',
  },
  answer: { marginBottom: 30 },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  answerName: { color: C.textPrimary, fontSize: 13, fontWeight: '600' },
  answerActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  action: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  actionText: { color: C.textSecondary, fontSize: 12 },
  composer: {
    flexShrink: 0,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 14,
    borderRadius: 18,
    padding: 8,
  },
  input: {
    color: C.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 44,
    maxHeight: 160,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  composerTools: { flexDirection: 'row', alignItems: 'center' },
  memoryButton: { minHeight: 48, justifyContent: 'center' },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    get backgroundColor() { return Theme.color.primary; },
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  sendText: { color: C.bg, fontSize: 25, fontWeight: '600' },
  notice: {
    color: C.textMuted,
    paddingHorizontal: 22,
    paddingBottom: 8,
    fontSize: 11,
  },
  attachment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: C.accentSoft,
    borderRadius: 18,
    marginBottom: 8,
  },
  resume: { padding: 16, alignItems: 'center' },
  sheet: {
    backgroundColor: C.surface,
    padding: 22,
    gap: 14,
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelOption: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
}));

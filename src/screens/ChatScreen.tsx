import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { Theme } from '../constants/theme';
import { AVAILABLE_MODELS } from '../constants/models';
type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type Message = PersistedMessage;
const MODEL_CONTEXT_SIZE = 2048;
const generateUniqueId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const C = {
  bg: Theme.color.background,
  surface: Theme.color.surface,
  surfaceHighlight: Theme.color.surfaceRaised,
  border: Theme.color.border,
  accent: Theme.color.accent,
  accentSoft: Theme.color.accentSoft,
  textPrimary: Theme.color.text,
  textSecondary: Theme.color.textSecondary,
  textMuted: Theme.color.textMuted,
  green: Theme.color.success,
  red: Theme.color.destructive,
};
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

export function ChatScreen({ navigation, route }: Props) {
  const conversationId = useRef(
    route.params?.conversationId || generateUniqueId(),
  );
  const generationBusy = useRef(false);
  const cancelRequested = useRef(false);
  const mounted = useRef(true);
  const modelEpoch = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
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
        setInputText(result);
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
      const context = llamaRef.current;
      llamaRef.current = null;
      if (context) {
        context
          .stopCompletion()
          .catch(() => {})
          .finally(() => context.release().catch(() => {}));
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

  const initModel = async (
    specificFilename?: string,
    epoch = modelEpoch.current,
  ) => {
    if (!mounted.current || epoch !== modelEpoch.current) return;
    const fileToLoad = specificFilename || modelFilename;
    try {
      if (llamaRef.current) await llamaRef.current.release();
      llamaRef.current = null;
      setModelReady(false);

      const loaded = await initLlama({
        model: getModelPath(fileToLoad),
        use_mlock: false,
        n_ctx: MODEL_CONTEXT_SIZE,
        n_gpu_layers: 0,
        n_threads: 4,
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
  };

  const handleSendMessage = async (textOverride?: string) => {
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
    const newMessages = [...messages, userMsg];
    saveConversation(conversationId.current, newMessages);
    setMessages([...newMessages, { id: aid, role: 'assistant', content: '' }]);
    setInputText('');
    setAttachedFile(null);
    setIsGenerating(true);

    try {
      const formattedResult = await fitContext(
        context,
        {
          messages: newMessages,
          systemPrompt: settings.systemPrompt,
          memoryContextString: settings.memoryEnabled
            ? getMemoryContextString()
            : '',
          currentAttachmentText,
          modelUrl: settings.modelUrl,
        },
        MODEL_CONTEXT_SIZE,
        settings.maxTokens,
      );
      if (cancelRequested.current) {
        setMessages(newMessages);
        return;
      }
      setContextNotice(
        formattedResult.removedMessages
          ? 'Using recent messages to fit this model. Your full conversation is saved.'
          : '',
      );

      let fullResponse = '';
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

      const newMemories = parseMemoryActions(fullResponse);
      if (settings.memoryEnabled) newMemories.forEach(m => addMemory(m));
      const savedResponse = fullResponse
        .replace(/<MEMORY>[\s\S]*?(?:<\/MEMORY>|$)/gi, '')
        .trim();
      const completedMessages: Message[] = savedResponse
        ? [
            ...newMessages,
            { id: aid, role: 'assistant', content: savedResponse },
          ]
        : newMessages;
      saveConversation(conversationId.current, completedMessages);
      if (mounted.current) setMessages(completedMessages);
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        'Generation Error',
        e?.message || 'Failed to generate response.',
      );
      setMessages(messages);
      setInputText(rawInput);
      setAttachedFile(attachedFile);
    } finally {
      generationBusy.current = false;
      setIsGenerating(false);
    }
  };

  const stopGeneration = () => {
    if (llamaRef.current && isGenerating) {
      cancelRequested.current = true;
      llamaRef.current.stopCompletion().catch(() => {});
    }
  };

  const clearChat = () => {
    if (generationBusy.current) return;
    if (messages.length) saveConversation(conversationId.current, messages);
    conversationId.current = generateUniqueId();
    setMessages([]);
    setContextNotice('');
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
        <IconButton
          glyph="‹"
          label="Back to conversations"
          onPress={() => navigation.goBack()}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Choose a model"
          disabled={isGenerating || isDownloading}
          style={S.modelPicker}
          onPress={() => setShowModelModal(true)}
        >
          <Text style={S.headerTitle}>
            Moonlight <Text style={S.chevron}>⌄</Text>
          </Text>
          <Text numberOfLines={1} style={S.status}>
            {isAppBooting
              ? 'Loading model…'
              : modelReady
              ? selected?.name || 'Custom model'
              : 'Model setup needed'}
          </Text>
        </TouchableOpacity>
        <IconButton
          glyph="＋"
          label="Start a new conversation"
          disabled={isGenerating}
          onPress={clearChat}
        />
        <IconButton
          glyph="☷"
          label="Open settings"
          disabled={isGenerating}
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
      <KeyboardAvoidingView
        style={ui.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={S.messages}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={S.welcome}>
              <MoonMark size={52} />
              <Text style={S.welcomeTitle}>What’s on your mind?</Text>
              <Text style={S.welcomeBody}>
                A question, a rough idea, a fresh start. Let’s work through it
                together.
              </Text>
              {isAppBooting ? (
                <View style={S.loading}>
                  <ActivityIndicator color={C.accent} />
                  <Text style={ui.small}>Preparing your local model</Text>
                </View>
              ) : !modelReady ? (
                <View style={S.setup}>
                  <Text style={S.setupTitle}>
                    {isDownloading
                      ? 'Bringing your AI on device'
                      : 'Make this space yours'}
                  </Text>
                  <Text style={ui.body}>
                    {isDownloading
                      ? 'Keep the app open while your model downloads.'
                      : 'Download a model once, then chat with it offline. Your phone does the thinking.'}
                  </Text>
                  <Text style={S.modelName}>
                    {selected?.name || 'Your custom model'}
                    {selected ? ' · ' + selected.size : ''}
                  </Text>
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
                        : 'Download model'}
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
                <Text selectable style={S.userText}>
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
                  <Text style={ui.small}>Thinking through your message…</Text>
                )}
                {!!item.content && !isGenerating && (
                  <View style={S.answerActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={S.action}
                      onPress={() => copy(item.content)}
                    >
                      <Text style={S.actionText}>Copy</Text>
                    </TouchableOpacity>
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
            placeholder="Ask anything, make something…"
            placeholderTextColor={C.textMuted}
          />
          <View style={S.composerTools}>
            <IconButton
              glyph="＋"
              label="Attach a text file"
              disabled={isGenerating}
              onPress={handlePickFile}
            />
            <TouchableOpacity
              accessibilityRole="button"
              style={S.memoryButton}
              onPress={showMemories}
            >
              <Text style={ui.small}>
                {settings.memoryEnabled ? 'Memory on' : 'Memory off'}
              </Text>
            </TouchableOpacity>
            <View style={ui.flex} />
            <IconButton
              glyph="≋"
              label="Dictate message"
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
              Models run locally after download. Larger models need more memory.
            </Text>
            <ScrollView>
              {AVAILABLE_MODELS.map(model => (
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
                      {model.provider} · {model.size}
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
const S = StyleSheet.create({
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
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modelPicker: { flex: 1, padding: 8 },
  headerTitle: { fontSize: 19, fontWeight: '600', color: C.textPrimary },
  chevron: { color: C.textMuted },
  status: { color: C.textMuted, fontSize: 11, marginTop: 4 },
  messages: { padding: 22, paddingBottom: 30, flexGrow: 1 },
  welcome: { alignItems: 'center', paddingTop: 42, gap: 20 },
  welcomeTitle: {
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
    padding: 22,
    borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 16,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 14,
    borderRadius: 26,
    padding: 8,
  },
  input: {
    color: C.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 54,
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
    backgroundColor: Theme.color.primary,
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
});

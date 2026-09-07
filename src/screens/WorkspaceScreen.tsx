import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Theme, themedStyles, useAppearance } from '../constants/theme';
import { DOCK_RESERVED_SPACE } from '../constants/layout';
import { getSettings } from '../services/storage';
import {
  checkModelExists,
  getModelFilenameFromUrl,
} from '../services/modelManager';
import {
  Conversation,
  deleteConversation,
  listConversations,
  renameConversation,
} from '../services/conversations';
import { AVAILABLE_MODELS } from '../constants/models';

const STARTERS = [
  {
    icon: '✦',
    title: 'Make something',
    detail: 'From a spark to a first draft',
    prompt:
      'Help me write a first draft. Ask me about the audience, topic, and tone before you begin.',
  },
  {
    icon: '⌘',
    title: 'Solve a problem',
    detail: 'Code, logic, and clear next steps',
    prompt:
      'Help me solve a problem step by step. First ask what I am trying to do and what is getting in the way.',
  },
  {
    icon: '◎',
    title: 'Learn a little',
    detail: 'Make the complicated click',
    prompt:
      'Teach me something with a simple explanation, an example, and a short quiz. First ask what I want to learn.',
  },
  {
    icon: '↗',
    title: 'Find your focus',
    detail: 'Turn a big goal into a small step',
    prompt:
      'Help me make a realistic plan. Ask about my goal, available time, and biggest constraint.',
  },
];

export function WorkspaceScreen({ navigation }: any) {
  useAppearance();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const [modelName, setModelName] = useState('Local model');
  const [rename, setRename] = useState<Conversation | null>(null);
  const [title, setTitle] = useState('');
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setConversations(listConversations());
      const settings = getSettings();
      setModelName(
        AVAILABLE_MODELS.find(m => m.url === settings.modelUrl)?.name ||
          'Custom model',
      );
      checkModelExists(getModelFilenameFromUrl(settings.modelUrl))
        .then(value => {
          if (active) setReady(value);
        })
        .catch(() => {
          if (active) setReady(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const open = (initialPrompt?: string) =>
    navigation.navigate('Chat', { newConversation: true, initialPrompt });
  const matching = conversations.filter(c =>
    `${c.title} ${c.messages.map(m => m.content).join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const actions = (conversation: Conversation) =>
    Alert.alert(conversation.title, 'Manage this conversation', [
      {
        text: 'Rename',
        onPress: () => {
          setRename(conversation);
          setTitle(conversation.title);
        },
      },
      {
        text: 'Share text',
        onPress: () => {
          Share.share({
            message: conversation.messages
              .map(
                m =>
                  `${m.role === 'user' ? 'You' : 'Moonlight'}:\n${m.content}`,
              )
              .join('\n\n'),
          }).catch(() => Alert.alert('Sharing unavailable'));
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Delete conversation?',
            'This removes its saved messages from this phone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteConversation(conversation.id);
                  setConversations(listConversations());
                },
              },
            ],
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  return (
    <View style={[S.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Moonlight"
        subtitle="Your private thinking space"
        onMenuPress={() => navigation.navigate('Settings')}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          S.content,
          { paddingBottom: insets.bottom + DOCK_RESERVED_SPACE },
        ]}
      >
        <View style={S.topline}>
          <Text style={S.eyebrow}>YOUR THINKING SPACE</Text>
          <Text numberOfLines={1} style={S.badge}>ON DEVICE</Text>
        </View>
        <Text style={S.hero}>A clear space.{'\n'}A fresh perspective.</Text>
        <Text style={S.subtitle}>
          Write, untangle, and explore. Your text conversations stay on your
          phone.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={S.primary}
          onPress={() => open()}
        >
          <Text style={S.primaryText}>＋ New conversation</Text>
          <Text style={S.primaryText}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Manage local models"
          style={S.model}
          onPress={() => navigation.navigate('Models')}
        >
          <View
            style={[S.dot, { backgroundColor: ready ? '#71C9A8' : '#D9B77C' }]}
          />
          <View style={S.flex}>
            <Text style={S.modelTitle}>
              {ready ? modelName : 'Set up your local AI'}
            </Text>
            <Text style={S.small}>
              {ready
                ? 'Downloaded · ready for offline text chat'
                : 'Download a model once to get started'}
            </Text>
          </View>
          <Text style={S.muted}>›</Text>
        </TouchableOpacity>
        <Text style={S.section}>Where shall we start?</Text>
        <View style={S.grid}>
          {STARTERS.map(item => (
            <TouchableOpacity
              accessibilityRole="button"
              key={item.title}
              style={[
                S.card,
                (width < 380 || fontScale > 1.2) && { width: '100%' },
              ]}
              onPress={() => open(item.prompt)}
            >
              <Text style={S.cardIcon}>{item.icon}</Text>
              <Text style={S.cardTitle}>{item.title}</Text>
              <Text style={S.small}>{item.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={S.topline}>
          <Text style={S.section}>Your conversations</Text>
          <Text style={S.muted}>{conversations.length}</Text>
        </View>
        <TextInput
          accessibilityLabel="Search conversations"
          placeholder="Search your ideas…"
          placeholderTextColor={Theme.color.textMuted}
          value={query}
          onChangeText={setQuery}
          style={S.search}
        />
        {matching.map(c => (
          <View key={c.id} style={S.conversation}>
            <TouchableOpacity
              accessibilityRole="button"
              style={S.flex}
              onPress={() =>
                navigation.navigate('Chat', { conversationId: c.id })
              }
            >
              <Text numberOfLines={1} style={S.cardTitle}>
                {c.title}
              </Text>
              <Text numberOfLines={1} style={S.small}>
                {c.messages[c.messages.length - 1]?.content ||
                  'No messages yet'}
              </Text>
              <Text style={S.date}>
                {c.messages.length} messages ·{' '}
                {new Date(c.updatedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Manage ${c.title}`}
              style={S.more}
              onPress={() => actions(c)}
            >
              <Text style={S.muted}>•••</Text>
            </TouchableOpacity>
          </View>
        ))}
        {!matching.length && (
          <View style={S.empty}>
            <Text style={S.cardTitle}>
              {query
                ? 'No matching conversations'
                : 'Your next idea starts here'}
            </Text>
            <Text style={S.small}>
              {query
                ? 'Try a different word or phrase.'
                : 'Start a chat. Come back to it whenever you like.'}
            </Text>
          </View>
        )}
        <Text style={S.footnote}>
          Offline by design. Answers can be mistaken; check important details.
        </Text>
      </ScrollView>
      <Modal
        transparent
        visible={!!rename}
        animationType="fade"
        onRequestClose={() => setRename(null)}
      >
        <View style={S.overlay}>
          <View style={S.dialog}>
            <Text style={S.section}>Rename conversation</Text>
            <TextInput
              accessibilityLabel="Conversation title"
              autoFocus
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              style={S.search}
            />
            <TouchableOpacity
              style={S.primary}
              onPress={() => {
                if (rename && title.trim()) {
                  renameConversation(rename.id, title);
                  setConversations(listConversations());
                  setRename(null);
                }
              }}
            >
              <Text style={S.primaryText}>Save title</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.more} onPress={() => setRename(null)}>
              <Text style={S.muted}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const S = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: Theme.color.background },
  flex: { flex: 1 },
  content: { padding: 22, gap: 18 },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#929AA6',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  badge: {
    color: '#A8C7FA',
    fontSize: 9,
    letterSpacing: 1.2,
    backgroundColor: '#252F3F',
    padding: 7,
    borderRadius: 6,
  },
  hero: {
    color: '#F3F4F6',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '500',
    letterSpacing: -1.8,
    marginTop: 12,
  },
  subtitle: { color: '#B5BAC3', fontSize: 16, lineHeight: 25, maxWidth: 330 },
  primary: {
    minHeight: 54,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Theme.color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryText: { color: '#141517', fontSize: 15, fontWeight: '700' },
  model: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1D1F22',
    borderRadius: 14,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  modelTitle: { color: '#F3F4F6', fontWeight: '600', marginBottom: 4 },
  small: { color: '#B5BAC3', fontSize: 12, lineHeight: 19 },
  muted: { color: '#B5BAC3', fontSize: 14 },
  section: { fontSize: 18, fontWeight: '600', color: '#F3F4F6', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    flexGrow: 1,
    padding: 16,
    minHeight: 146,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#33363C',
    backgroundColor: '#1D1F22',
    gap: 8,
  },
  cardIcon: { color: '#A8C7FA', fontSize: 25, marginBottom: 7 },
  cardTitle: {
    color: '#F3F4F6',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  search: {
    backgroundColor: '#1D1F22',
    borderWidth: 1,
    borderColor: '#33363C',
    borderRadius: 12,
    color: '#F3F4F6',
    padding: 14,
    minHeight: 50,
  },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#33363C',
  },
  date: { color: '#929AA6', fontSize: 11, marginTop: 8 },
  more: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { paddingVertical: 24, gap: 6 },
  footnote: {
    color: '#929AA6',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000A',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#1D1F22',
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
}));

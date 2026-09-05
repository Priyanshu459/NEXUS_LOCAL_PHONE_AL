import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { PageIntro, ui } from '../components/Design';
import { Theme } from '../constants/theme';
import { DOCK_RESERVED_SPACE } from '../constants/layout';
const tasks = [
  {
    group: 'WRITE',
    glyph: '↗',
    title: 'Find the right words',
    desc: 'An email, a story, or a sharper first draft.',
    prompt:
      'Help me write something. First ask what I am writing, who it is for, and the tone I want.',
  },
  {
    group: 'UNDERSTAND',
    glyph: '◎',
    title: 'Make it make sense',
    desc: 'Break a difficult idea into something clear.',
    prompt:
      'Help me understand a topic. Ask what I want to learn, then explain it with an everyday example and a question to check my understanding.',
  },
  {
    group: 'BUILD',
    glyph: '⌘',
    title: 'Think through the code',
    desc: 'Find a bug or explore an implementation.',
    prompt:
      'Help me work through a coding problem. Ask me for the code, expected behavior, and any error messages before suggesting a fix.',
  },
  {
    group: 'PLAN',
    glyph: '≡',
    title: 'Give your idea a plan',
    desc: 'Small, practical steps toward a bigger goal.',
    prompt:
      'Help me plan a project. First ask about my goal, deadline, and available resources. Then help me identify the next concrete step.',
  },
  {
    group: 'REFINE',
    glyph: '✧',
    title: 'Say it more clearly',
    desc: 'Tighten your writing without losing your voice.',
    prompt:
      'Help me rewrite a piece of text for clarity while preserving my meaning. Ask me to paste the text and tell you the intended audience.',
  },
];
export function GalleryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Explore"
        onMenuPress={() => navigation.navigate('Settings')}
      />
      <ScrollView
        contentContainerStyle={[
          ui.content,
          { paddingBottom: insets.bottom + DOCK_RESERVED_SPACE },
        ]}
      >
        <PageIntro
          eyebrow="A PLACE TO BEGIN"
          title={'Good ideas start\nwith a question.'}
          body="A few thoughtful starting points. Every one opens a new conversation with your local model."
        />
        {tasks.map(task => (
          <TouchableOpacity
            key={task.group}
            accessibilityRole="button"
            accessibilityLabel={task.title}
            style={S.card}
            onPress={() =>
              navigation.navigate('Chat', {
                newConversation: true,
                initialPrompt: task.prompt,
              })
            }
          >
            <View style={S.top}>
              <Text style={S.group}>{task.group}</Text>
              <Text style={S.glyph}>{task.glyph}</Text>
            </View>
            <Text style={S.title}>{task.title}</Text>
            <Text style={ui.body}>{task.desc}</Text>
            <Text style={S.link}>Start a conversation ↗</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const S = StyleSheet.create({
  card: {
    padding: 22,
    backgroundColor: Theme.color.surface,
    borderWidth: 1,
    borderColor: Theme.color.border,
    borderRadius: 24,
    gap: 9,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  group: { color: Theme.color.textMuted, fontSize: 10, letterSpacing: 2 },
  glyph: { fontSize: 27, color: Theme.color.accent },
  title: {
    color: Theme.color.text,
    fontSize: 23,
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  link: {
    color: Theme.color.accent,
    fontSize: 12,
    marginTop: 14,
    fontWeight: '600',
  },
});

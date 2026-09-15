import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import {safeWebUrl} from '../services/webSearch';
import {Theme, themedStyles, useAppearance, getAppearance} from '../constants/theme';

function inline(text: string) {
  return text.split(/(\[[^\]]+\]\(https:\/\/[^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    const link=/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/.exec(part);
    const url=link&&safeWebUrl(link[2]);
    if(url)return <Text key={i} accessibilityRole="link" style={{color:Theme.color.accent,textDecorationLine:'underline'}} onPress={()=>Linking.openURL(url).catch(()=>Alert.alert('Unable to open source','Try again in your browser.'))}>{link![1]}</Text>;
    return (
    <Text
      key={i}
      style={
        part.startsWith('**')
          ? S.bold
          : part.startsWith('`')
          ? S.inlineCode
          : undefined
      }
    >
      {part.startsWith('**')
        ? part.slice(2, -2)
        : part.startsWith('`')
        ? part.slice(1, -1)
        : part}
    </Text>
  );});
}

export function AnswerText({ content }: { content: string }) {
  useAppearance();
  return (
    <View>
      {content.split('```').map((block, i) => {
        if (i % 2) {
          const newline = block.indexOf('\n');
          const language =
            newline >= 0 ? block.slice(0, newline).trim() : 'code';
          const code = newline >= 0 ? block.slice(newline + 1) : block;
          return (
            <View key={i} style={S.codeBox}>
              <Text style={S.language}>{language || 'code'}</Text>
              <ScrollView horizontal>
                <Text selectable style={S.code}>
                  {code.trimEnd()}
                </Text>
              </ScrollView>
            </View>
          );
        }
        return block.split('\n').map((line, j) => {
          const heading = /^#{1,3}\s/.test(line);
          return (
            <Text
              selectable
              key={`${i}-${j}`}
              style={[S.text, heading && S.heading]}
            >
              {inline(line.replace(/^#{1,3}\s/, '').replace(/^[-*]\s/, '• '))}
            </Text>
          );
        });
      })}
    </View>
  );
}
const S = themedStyles(() => ({
  text: { color: Theme.color.text, fontSize: getAppearance().largeText ? 20 : 16, lineHeight: getAppearance().largeText ? 30 : 26 },
  bold: { fontWeight: '700' },
  heading: { fontWeight: '700', fontSize: 18, marginVertical: 8 },
  inlineCode: {
    fontFamily: 'monospace',
    color: Theme.color.accent,
    backgroundColor: Theme.color.accentSoft,
  },
  codeBox: {
    backgroundColor: Theme.color.surfaceRaised,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  language: { color: Theme.color.textMuted, fontSize: 11, marginBottom: 8 },
  code: {
    color: Theme.color.text,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 21,
  },
}));

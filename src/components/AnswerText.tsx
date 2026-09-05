import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => (
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
  ));
}

export function AnswerText({ content }: { content: string }) {
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
const S = StyleSheet.create({
  text: { color: '#F3F4F6', fontSize: 15, lineHeight: 24 },
  bold: { fontWeight: '700' },
  heading: { fontWeight: '700', fontSize: 18, marginVertical: 8 },
  inlineCode: {
    fontFamily: 'monospace',
    color: '#A8C7FA',
    backgroundColor: '#252F3F',
  },
  codeBox: {
    backgroundColor: '#101113',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  language: { color: '#929AA6', fontSize: 11, marginBottom: 8 },
  code: {
    color: '#DEE3EB',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 21,
  },
});

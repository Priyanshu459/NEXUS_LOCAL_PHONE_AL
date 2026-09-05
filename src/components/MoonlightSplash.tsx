import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoonMark } from './Design';
import { Theme } from '../constants/theme';
export default function MoonlightSplash({ onFinish }: { onFinish: () => void }) {
  useEffect(() => { const timer = setTimeout(onFinish, 450); return () => clearTimeout(timer); }, [onFinish]);
  return <View style={S.screen}><MoonMark size={64} /><Text style={S.title}>Moonlight</Text><Text style={S.caption}>A space to think.</Text></View>;
}
const S = StyleSheet.create({ screen: { flex: 1, backgroundColor: Theme.color.background, justifyContent: 'center', alignItems: 'center', gap: 20 }, title: { color: Theme.color.text, fontSize: 29, letterSpacing: -1, fontWeight: '600' }, caption: { color: Theme.color.textMuted, fontSize: 13 } });

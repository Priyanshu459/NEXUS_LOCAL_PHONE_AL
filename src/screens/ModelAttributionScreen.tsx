import { Theme, themedStyles, useAppearance } from '../constants/theme';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AVAILABLE_MODELS } from '../constants/models';

type Props = NativeStackScreenProps<RootStackParamList, 'ModelAttribution'>;

const C = {
  get bg() { return Theme.color.background; },
  get surface() { return Theme.color.surface; },
  get surfaceHigh() { return Theme.color.surfaceRaised; },
  border: 'rgba(255, 255, 255, 0.10)',
  get textPrimary() { return Theme.color.text; },
  get textSecondary() { return Theme.color.textSecondary; },
  get textMuted() { return Theme.color.textMuted; },
  get accent() { return Theme.color.accent; },
  get red() { return Theme.color.destructive; },
};

const attributionData: Record<string, {
  originalPublisher: string;
  originalModelLink: string;
  ggufPublisher: string;
  license: string;
}> = {
  'llama32-1b': {
    originalPublisher: 'Meta AI',
    originalModelLink: 'https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct',
    ggufPublisher: 'bartowski',
    license: 'Llama 3.2 Community License',
  },
  'qwen25-15b': {
    originalPublisher: 'Alibaba Cloud',
    originalModelLink: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct',
    ggufPublisher: 'Qwen',
    license: 'Apache 2.0',
  },
  'llama32-3b': {
    originalPublisher: 'Meta AI',
    originalModelLink: 'https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct',
    ggufPublisher: 'bartowski',
    license: 'Llama 3.2 Community License',
  },
  'deepseek-15b': {
    originalPublisher: 'DeepSeek',
    originalModelLink: 'https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B',
    ggufPublisher: 'unsloth',
    license: 'MIT',
  },
  'gemma2-2b': {
    originalPublisher: 'Google',
    originalModelLink: 'https://huggingface.co/google/gemma-2-2b-it',
    ggufPublisher: 'bartowski',
    license: 'Gemma License',
  },
  'phi3-mini': {
    originalPublisher: 'Microsoft',
    originalModelLink: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct',
    ggufPublisher: 'microsoft',
    license: 'MIT',
  }
};

export function ModelAttributionScreen({ navigation }: Props) {
  useAppearance();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.65}
        >
          <Text style={{ color: C.textSecondary }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Model Attribution</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={styles.intro}>
          Moonlight AI provides an interface to run open weights models locally on your device. 
          The models listed below are created, licensed, and hosted by third parties.
        </Text>

        {AVAILABLE_MODELS.map(model => {
          const attr = attributionData[model.id] || {
            originalPublisher: model.originalPublisher, originalModelLink: model.originalModelUrl,
            ggufPublisher: model.quantizationPublisher, license: model.licenseIdentifier,
          };

          const isUnverified = attr.license.includes('Unverified');

          return (
            <View key={model.id} style={styles.card}>
              <Text style={styles.modelName}>{model.name}</Text>
              
              <View style={styles.row}>
                <Text style={styles.label}>Original Publisher:</Text>
                <Text style={styles.value}>{attr.originalPublisher}</Text>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.label}>Original Model:</Text>
                <TouchableOpacity onPress={() => Linking.openURL(attr.originalModelLink)}>
                  <Text style={styles.link}>View Source</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>GGUF Quantization by:</Text>
                <Text style={styles.value}>{attr.ggufPublisher}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Quantized File:</Text>
                <TouchableOpacity onPress={() => Linking.openURL(model.url)}>
                  <Text style={styles.link}>View File</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>License:</Text>
                <Text style={[styles.value, isUnverified && { color: C.red, fontWeight: '700' }]}>
                  {attr.license}
                </Text>
              </View>
              <TouchableOpacity accessibilityRole="link" onPress={()=>Linking.openURL(model.licenseUrl)}><Text style={styles.link}>Read publisher license</Text></TouchableOpacity>
              
              {isUnverified && (
                <Text style={styles.warning}>
                  Release Blocker: License unverified. Do not release this build to production until verified.
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  content: { padding: 16, gap: 16 },
  intro: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  modelName: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: C.textMuted,
    fontSize: 13,
  },
  value: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  link: {
    color: C.accent,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  warning: {
    marginTop: 8,
    color: C.red,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 90, 122, 0.1)',
    padding: 8,
    borderRadius: 6,
  }
}));

import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVAILABLE_MODELS } from '../constants/models';
import { getSettings, saveSettings } from '../services/storage';
import { checkModelExists, downloadModel, cancelDownload, deleteModel, getModelFilenameFromUrl } from '../services/modelManager';
import { ContextualBottomAction } from '../components/ContextualBottomAction';
import MoonLogo from '../components/MoonLogo';
import { CONTEXTUAL_ACTION_HEIGHT, DOCK_HEIGHT, DOCK_RESERVED_SPACE } from '../constants/layout';

const C = {
  bg: '#131314',
  surface: '#1E1F22',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F2F2F2',
  textSecondary: '#9AA0A6',
  accent: '#4285F4',
  red: '#EA4335',
  green: '#34A853',
};

const VertexModelCard = memo(({ model, isSelected, onPress, index }: any) => {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 70),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, [index, opacity, scale]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }], marginBottom: 14 }}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.storeCard, 
          { borderColor: isSelected ? '#4285F4' : 'rgba(255, 255, 255, 0.09)', borderWidth: isSelected ? 1.5 : 1, padding: 18 },
          isSelected && { backgroundColor: '#1E293B' }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: model.color + '20', borderWidth: 1, borderColor: model.color + '60', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: model.color }} />
              <Text style={{ color: model.color, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }}>{model.provider.toUpperCase()}</Text>
            </View>
            {!!model.badge && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.07)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }}>
                <Text style={{ color: '#E2E8F0', fontSize: 11, fontWeight: '700' }}>{model.badge}</Text>
              </View>
            )}
          </View>
          <View style={{ backgroundColor: isSelected ? '#4285F4' : 'rgba(66, 133, 244, 0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: isSelected ? '#FFFFFF' : '#60A5FA', fontSize: 11, fontWeight: '800' }}>{model.size}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.3, marginBottom: 5 }}>{model.name}</Text>
          <Text style={{ fontSize: 13, color: '#94A3B8', lineHeight: 18 }} numberOfLines={2}>{model.desc}</Text>
        </View>

        {!!model.tags && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)' }}>
            {model.tags.map((tag: string, tIdx: number) => (
              <View key={tIdx} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <Text style={{ color: '#CBD5E1', fontSize: 11, fontWeight: '600' }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

export function ModelsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(getSettings());
  const [currentModelUrl, setCurrentModelUrl] = useState(settings.modelUrl);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Sync settings when focusing
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const s = getSettings();
      setSettings(s);
      setCurrentModelUrl(s.modelUrl);
      checkInstallation(s.modelUrl);
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    checkInstallation(currentModelUrl);
  }, [currentModelUrl]);

  const checkInstallation = async (url: string) => {
    const filename = url.split('/').pop()?.split('?')[0] || 'model.gguf';
    const exists = await checkModelExists(filename);
    setIsInstalled(exists);
  };

  const handleDownload = async (url: string) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    const filename = url.split('/').pop()?.split('?')[0] || 'model.gguf';
    
    try {
      await downloadModel(url, filename, p => setDownloadProgress(p));
      setIsInstalled(true);
      // Auto-set as active if they just downloaded it
      selectModel(url);
    } catch (e: any) {
      if (!e?.message?.includes('canceled')) {
        Alert.alert("Download Failed", "There was an error downloading the model.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelDownload = () => {
    cancelDownload();
    setIsDownloading(false);
  };

  const selectModel = (url: string) => {
    setCurrentModelUrl(url);
    const newSettings = { ...settings, modelUrl: url };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDelete = async (url: string) => {
    const filename = url.split('/').pop()?.split('?')[0] || 'model.gguf';
    await deleteModel(filename);
    setIsInstalled(false);
  };

  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.url === currentModelUrl);
  const selectedModelName = selectedModelInfo?.name || getModelFilenameFromUrl(currentModelUrl);
  const selectedModelSize = selectedModelInfo?.size || 'Custom GGUF';

  const getContextualState = () => {
    if (isDownloading) {
      return {
        title: `Downloading ${selectedModelName}`,
        subtitle: `Please keep the app open`,
        progress: downloadProgress,
        primaryAction: { label: 'Cancel', onPress: handleCancelDownload, color: C.red }
      };
    }
    
    if (isInstalled && currentModelUrl === settings.modelUrl) {
      return {
        title: selectedModelName,
        subtitle: `${selectedModelSize} · Active model · Ready for chat`,
        primaryAction: { label: 'Delete', onPress: () => handleDelete(currentModelUrl), color: C.red }
      };
    }

    if (!isInstalled) {
      return {
        title: selectedModelName,
        subtitle: `Size: ${selectedModelSize}`,
        primaryAction: { label: 'Download', onPress: () => handleDownload(currentModelUrl) }
      };
    }

    return null;
  };

  const contextState = getContextualState();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MoonLogo size={44} variant="light" />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: C.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>Model Store</Text>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <Text style={{ color: '#E2E8F0', fontSize: 10, fontWeight: '800' }}>ON-DEVICE</Text>
              </View>
            </View>
            <Text style={{ color: C.textSecondary, fontSize: 13 }}>Downloads require internet. Chat runs locally after setup.</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + DOCK_RESERVED_SPACE + CONTEXTUAL_ACTION_HEIGHT }}
        showsVerticalScrollIndicator={false}
      >
        {AVAILABLE_MODELS.map((model, idx) => (
          <VertexModelCard
            key={model.id}
            model={model}
            index={idx}
            isSelected={currentModelUrl === model.url}
            onPress={() => selectModel(model.url)}
          />
        ))}

        <TouchableOpacity 
          style={styles.customUrlBtn} 
          onPress={() => navigation.navigate('Settings')} 
          activeOpacity={0.7}
        >
          <Text style={styles.customUrlBtnText}>Paste Custom HuggingFace URL</Text>
        </TouchableOpacity>
      </ScrollView>

      {contextState && (
        <ContextualBottomAction 
          title={contextState.title}
          subtitle={contextState.subtitle}
          progress={contextState.progress}
          primaryAction={contextState.primaryAction}
          bottomOffset={DOCK_HEIGHT + 18}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  storeCard: {
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
  },
  customUrlBtn: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', marginTop: 10, marginBottom: 20
  },
  customUrlBtnText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
});

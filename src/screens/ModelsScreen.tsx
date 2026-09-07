import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { AVAILABLE_MODELS } from '../constants/models';
import { DOCK_RESERVED_SPACE } from '../constants/layout';
import { PageIntro, IconButton } from '../components/Design';
import {getDeviceRecommendation} from '../services/deviceRecommendation';
import { Theme, themedStyles, useAppearance } from '../constants/theme';
import { getSettings, saveSettings } from '../services/storage';
import {
  cancelDownload,
  checkModelExists,
  deleteModel,
  downloadModel,
  getModelFilenameFromUrl,
} from '../services/modelManager';

type InstallationMap = Record<string, boolean>;

export function ModelsScreen({ navigation }: any) {
  useAppearance();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(getSettings());
  const [installed, setInstalled] = useState<InstallationMap>({});
  const [checking, setChecking] = useState(true);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [suggested, setSuggested] = useState('');
  const [capacityNote, setCapacityNote] = useState('');
  useEffect(()=>{let active=true;getDeviceRecommendation().then(r=>{if(active){setSuggested(r.model.id);setCapacityNote(r.reason);}});return()=>{active=false;};},[]);

  const refreshInstallations = useCallback(async () => {
    setChecking(true);
    setLoadError(false);
    try {
      const savedSettings = getSettings();
      const urls = AVAILABLE_MODELS.map(model => model.url);
      if (!urls.includes(savedSettings.modelUrl)) {
        urls.push(savedSettings.modelUrl);
      }
      const entries = await Promise.all(
        urls.map(
          async url =>
            [
              url,
              await checkModelExists(getModelFilenameFromUrl(url)),
            ] as const,
        ),
      );
      setInstalled(Object.fromEntries(entries));
      setSettings(savedSettings);
    } catch {
      setLoadError(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshInstallations();
    return navigation.addListener('focus', refreshInstallations);
  }, [navigation, refreshInstallations]);

  const setActive = (url: string) => {
    if (!installed[url]) return;
    const next = { ...getSettings(), modelUrl: url };
    saveSettings(next);
    setSettings(next);
  };

  const startDownload = async (url: string) => {
    if (downloadingUrl) return;
    setDownloadingUrl(url);
    setDownloadProgress(0);
    try {
      await downloadModel(
        url,
        getModelFilenameFromUrl(url),
        setDownloadProgress,
      );
      setInstalled(previous => ({ ...previous, [url]: true }));
      const next = { ...getSettings(), modelUrl: url };
      saveSettings(next);
      setSettings(next);
    } catch (error: any) {
      if (!String(error?.message).toLowerCase().includes('cancel')) {
        Alert.alert(
          'Download failed',
          error?.message ||
            'The model could not be downloaded. Check your connection and available storage, then try again.',
        );
      }
    } finally {
      setDownloadingUrl(null);
      setDownloadProgress(0);
    }
  };

  const customModelUrl = AVAILABLE_MODELS.some(
    model => model.url === settings.modelUrl,
  )
    ? null
    : settings.modelUrl;

  const stopDownload = () => {
    cancelDownload();
    setDownloadingUrl(null);
    setDownloadProgress(0);
  };

  const confirmRemoval = (model: (typeof AVAILABLE_MODELS)[number]) => {
    if (settings.modelUrl === model.url) {
      Alert.alert(
        'Active model cannot be removed',
        `Select another installed model before removing ${model.name}.`,
      );
      return;
    }
    Alert.alert(
      `Remove ${model.name}?`,
      `This recovers approximately ${model.size} of storage. You will need internet access to download the model again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove model',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModel(getModelFilenameFromUrl(model.url));
              setInstalled(previous => ({ ...previous, [model.url]: false }));
            } catch {
              Alert.alert(
                'Could not remove model',
                'The model file was not changed. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Your models"
        subtitle="A little intelligence, kept close"
        trailing={<IconButton glyph="‹" label="Back to chat" disabled={!!downloadingUrl} onPress={() => navigation.goBack()} />}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + DOCK_RESERVED_SPACE },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PageIntro
          eyebrow="INTELLIGENCE, ON DEVICE"
          title="Find the right fit."
          body={capacityNote || 'Choose a model for your phone. Larger models need more available memory.'}
        />
        {loadError && (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.notice}
            onPress={refreshInstallations}
          >
            <Text style={styles.noticeTitle}>
              Could not check downloaded models
            </Text>
            <Text style={styles.noticeText}>Tap to try again.</Text>
          </TouchableOpacity>
        )}
        {[...AVAILABLE_MODELS].sort((a,b)=>Number(b.id===suggested)-Number(a.id===suggested)).map(model => {
          const isActive = settings.modelUrl === model.url;
          const isInstalled = !!installed[model.url];
          const isDownloading = downloadingUrl === model.url;
          const stateLabel = checking
            ? 'Checking'
            : isDownloading
            ? `Downloading ${Math.round(downloadProgress)}%`
            : isActive && isInstalled
            ? 'Active'
            : isInstalled
            ? 'Installed'
            : 'Available';
          return (
            <View
              key={model.id}
              style={[
                styles.card,
                isActive && isInstalled && styles.activeCard,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.providerPill}>
                  <Text style={styles.providerText}>{model.provider}</Text>
                </View>
                <View
                  style={[
                    styles.statePill,
                    isActive && isInstalled && styles.activePill,
                  ]}
                >
                  <View
                    style={[
                      styles.stateDot,
                      {
                        backgroundColor:
                          isActive && isInstalled
                            ? Theme.color.success
                            : isDownloading
                            ? Theme.color.warning
                            : Theme.color.textMuted,
                      },
                    ]}
                  />
                  <Text style={styles.stateText}>{stateLabel}</Text>
                </View>
              </View>
              <Text style={styles.modelName}>{model.name}</Text>
              {model.id === suggested && <Text style={styles.noticeText}>Suggested for available device capacity</Text>}
              <Text style={styles.description}>{model.desc}</Text>
              <View style={styles.metadata}>
                <Text style={styles.metadataText}>{model.size}</Text>
                {model.tags.map(tag => (
                  <Text key={tag} style={styles.metadataText}>
                    {tag}
                  </Text>
                ))}
              </View>
              {isDownloading ? (
                <View
                  style={styles.progressTrack}
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: downloadProgress,
                  }}
                >
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${downloadProgress}%` },
                    ]}
                  />
                </View>
              ) : null}
              <View style={styles.actions}>
                {!isInstalled ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (checking || !!downloadingUrl) && styles.disabledButton,
                    ]}
                    onPress={() =>
                      isDownloading ? stopDownload() : startDownload(model.url)
                    }
                    disabled={
                      checking ||
                      loadError ||
                      (!!downloadingUrl && !isDownloading)
                    }
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonText}>
                      {isDownloading ? 'Cancel download' : 'Download'}
                    </Text>
                  </TouchableOpacity>
                ) : isActive ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Chat')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonText}>
                      Chat with this model
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setActive(model.url)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonText}>Use model</Text>
                  </TouchableOpacity>
                )}
                {isInstalled ? (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => confirmRemoval(model)}
                    accessibilityRole="button"
                    accessibilityLabel={`More options for ${model.name}`}
                  >
                    <Text style={styles.secondaryButtonText}>Remove…</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}

        {customModelUrl ? (
          <View
            style={[
              styles.card,
              installed[customModelUrl] && styles.activeCard,
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.providerPill}>
                <Text style={styles.providerText}>Hugging Face</Text>
              </View>
              <View style={styles.statePill}>
                <Text style={styles.stateText}>
                  {downloadingUrl === customModelUrl
                    ? `Downloading ${Math.round(downloadProgress)}%`
                    : installed[customModelUrl]
                    ? 'Installed'
                    : 'Custom model'}
                </Text>
              </View>
            </View>
            <Text style={styles.modelName}>Saved custom model</Text>
            <Text style={styles.description} numberOfLines={3}>
              {customModelUrl}
            </Text>
            {downloadingUrl === customModelUrl ? (
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${downloadProgress}%` },
                  ]}
                />
              </View>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  downloadingUrl === customModelUrl
                    ? stopDownload()
                    : installed[customModelUrl]
                    ? navigation.navigate('Chat')
                    : startDownload(customModelUrl)
                }
                disabled={!!downloadingUrl && downloadingUrl !== customModelUrl}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>
                  {downloadingUrl === customModelUrl
                    ? 'Cancel download'
                    : installed[customModelUrl]
                    ? 'Chat with this model'
                    : 'Download'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.customButton}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={styles.customTitle}>Add model from Hugging Face</Text>
          <Text style={styles.customDescription}>
            Paste a repository or direct .gguf link in Settings. Repository,
            /blob/, and /resolve/ links work.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: Theme.color.background },
  content: { padding: Theme.space.lg, gap: Theme.space.md },
  notice: {
    backgroundColor: Theme.color.accentSoft,
    borderRadius: Theme.radius.md,
    padding: Theme.space.lg,
  },
  noticeTitle: { color: Theme.color.text, fontSize: 14, fontWeight: '800' },
  noticeText: {
    color: Theme.color.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  card: {
    backgroundColor: Theme.color.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.color.border,
    padding: Theme.space.lg,
  },
  activeCard: { borderColor: Theme.color.accent, backgroundColor: Theme.color.accentSoft },
  cardTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.space.sm,
  },
  providerPill: {
    backgroundColor: Theme.color.surfaceRaised,
    borderRadius: Theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  providerText: {
    color: Theme.color.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Theme.color.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activePill: { borderColor: Theme.color.success },
  stateDot: { width: 7, height: 7, borderRadius: 4 },
  stateText: { color: Theme.color.text, fontSize: 11, fontWeight: '800' },
  modelName: {
    color: Theme.color.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: Theme.space.md,
  },
  description: {
    color: Theme.color.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Theme.space.md,
  },
  metadataText: {
    color: Theme.color.textSecondary,
    fontSize: 11,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Theme.color.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.color.surfaceRaised,
    overflow: 'hidden',
    marginTop: Theme.space.md,
  },
  progressFill: { height: '100%', backgroundColor: Theme.color.accent },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.space.sm,
    marginTop: Theme.space.lg,
  },
  primaryButton: {
    minHeight: Theme.touchTarget,
    flexGrow: 1,
    backgroundColor: Theme.color.primary,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Theme.color.background,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: { opacity: 0.45 },
  secondaryButton: {
    minHeight: Theme.touchTarget,
    paddingHorizontal: Theme.space.lg,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Theme.color.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  customButton: {
    backgroundColor: Theme.color.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.color.accent,
    padding: Theme.space.lg,
    minHeight: 96,
  },
  customTitle: { color: Theme.color.accent, fontSize: 15, fontWeight: '800' },
  customDescription: {
    color: Theme.color.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
}));

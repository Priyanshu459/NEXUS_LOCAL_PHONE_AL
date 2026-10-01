import { Theme, themedStyles, useAppearance } from '../constants/theme';
import {GlassBackdrop} from '../components/GlassBackdrop';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  hasPublishedPrivacyPolicy,
  openPublishedPrivacyPolicy,
  openPublishedTermsOfService,
} from '../services/privacyPolicy';
import {
  OFFICIAL_WEBSITE_URL,
  PRIVACY_POLICY_URL,
  PRIVACY_CONTACT_EMAIL,
} from '../config/compliance';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen({ navigation }: Props) {
  useAppearance();
  const insets = useSafeAreaInsets();
  const publishedPolicy = hasPublishedPrivacyPolicy();

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open link',
        'Please check your connection and try again.',
      );
    }
  };

  const openPolicy = async () => {
    try {
      await openPublishedPrivacyPolicy();
    } catch {
      Alert.alert(
        'Unable to open link',
        'Please check your connection and try again.',
      );
    }
  };

  const openTerms = async () => {
    try {
      await openPublishedTermsOfService();
    } catch {
      Alert.alert(
        'Unable to open link',
        'Please check your connection and try again.',
      );
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassBackdrop/>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Effective date: October 1, 2026</Text>

        <Text style={styles.heading}>Architecture Overview</Text>
        <Text style={styles.body}>
          Moonlight AI is built on a local-first architecture. It does not include
          user accounts, profile tracking, advertising SDKs, or analytics trackers.
          The application differentiates strictly between on-device processing and
          user-configured optional external services.
        </Text>

        <Text style={styles.heading}>Local Processing (On-Device)</Text>
        <Text style={styles.body}>
          When using on-device models, text generation runs entirely on your phone
          using local GGUF models via llama.rn. Your conversations, settings, saved
          memories, downloaded model files, and document text read through the Android
          system picker are stored solely in application-private storage on your device.
          These local records are not uploaded or transmitted to the developer.
        </Text>

        <Text style={styles.heading}>Optional Cloud AI Providers</Text>
        <Text style={styles.body}>
          If you choose to configure a cloud provider (such as OpenAI, Google Gemini,
          Anthropic, Alibaba Cloud, or NVIDIA), Moonlight AI asks for confirmation
          before sending your conversation to that service. Up to 20 recent messages,
          your custom system instructions, approved text attachments, and search excerpts
          are sent over encrypted HTTPS for generation. Saved memories are not included.
          API keys are stored encrypted using Android Keystore (AES-256 GCM) and are never
          bundled in the application. Each provider processes data according to its own
          terms and privacy policy.
        </Text>

        <Text style={styles.heading}>Optional Web Search</Text>
        <Text style={styles.body}>
          Supported cloud models can perform web searches through provider-native tools.
          Additionally, when configured with a search connection, search queries are
          sent over HTTPS to retrieve relevant source excerpts. Cited URLs are stored
          with answers. Tapping a citation opens that third-party website directly in
          your browser.
        </Text>

        <Text style={styles.heading}>LM Studio Connections</Text>
        <Text style={styles.body}>
          Connecting to LM Studio routes selected messages and instructions to your
          configured computer or server. Server authorization tokens are encrypted in
          Android Keystore. Unencrypted HTTP is permitted only for literal private IPv4
          addresses on your local trusted network (such as 192.168.x.x); public HTTP
          destinations and redirects are blocked.
        </Text>

        <Text style={styles.heading}>Agent Actions & Human Review</Text>
        <Text style={styles.body}>
          The assistant may propose actions such as viewing a destination in Maps,
          sharing text via the system share sheet, or adding an event to Calendar.
          Moonlight AI never executes actions autonomously. Every action requires
          your explicit review and confirmation before any external app is opened.
        </Text>

        <Text style={styles.heading}>Media, Documents, and Voice</Text>
        <Text style={styles.body}>
          For vision models, user-selected images are resized and short videos are
          represented by four sampled frames without audio. Media frames are sent only
          to your confirmed cloud provider and are not retained in chat history after
          generation. Voice input utilizes your device’s built-in Android speech-recognition
          service; Moonlight AI receives recognized text and does not record or store raw
          microphone audio.
        </Text>

        <Text style={styles.heading}>AI Response Reports</Text>
        <Text style={styles.body}>
          You can report problematic AI responses using the in-app "Report response"
          action. Reports include only the reported assistant response, its identifier,
          your selected category, and any explanation you provide. Reports never include
          your broader conversation history, personal documents, device identifiers, or
          API keys. Reports are sent via an HTTPS endpoint when configured, or via a
          pre-filled email to our support team.
        </Text>

        <Text style={styles.heading}>Retention and Deletion</Text>
        <Text style={styles.body}>
          You can delete individual conversations, clear all chats, delete memories,
          and remove downloaded model files at any time using the in-app controls.
          Uninstalling the app removes its private local data. Android cloud backup is
          disabled (android:allowBackup="false") to ensure deleted data is not restored
          by cloud backup services.
        </Text>

        <Text style={styles.heading}>Security and Children</Text>
        <Text style={styles.body}>
          Private app storage and HTTPS minimize exposure, though no software system is
          entirely free of risk. Moonlight AI is intended for general audiences and is
          not directed to children under 13.
        </Text>

        <TouchableOpacity
          style={styles.textLink}
          onPress={() => openLink(OFFICIAL_WEBSITE_URL)}
          accessibilityRole="link"
          accessibilityLabel="Open the official Moonlight AI website"
        >
          <Text style={styles.linkText}>Official Moonlight AI website</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textLink}
          onPress={openTerms}
          accessibilityRole="link"
          accessibilityLabel="Open the Terms of Service"
        >
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textLink}
          onPress={() => openLink(`mailto:${PRIVACY_CONTACT_EMAIL}`)}
          accessibilityRole="link"
          accessibilityLabel={`Email Moonlight AI privacy contact at ${PRIVACY_CONTACT_EMAIL}`}
        >
          <Text style={styles.linkText}>
            Privacy contact: {PRIVACY_CONTACT_EMAIL}
          </Text>
        </TouchableOpacity>

        {publishedPolicy ? (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={openPolicy}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>Open published HTTPS policy</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.pending}>
            Public HTTPS publication is accessible at: {PRIVACY_POLICY_URL}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = themedStyles(() => ({
  screen: { flex: 1, backgroundColor: Theme.color.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  back: { color: Theme.color.accent, fontSize: 15, fontWeight: '700' },
  title: { color: Theme.color.text, fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 36 },
  content: { padding: 20, paddingBottom: 48 },
  updated: { color: Theme.color.textMuted, marginBottom: 16 },
  heading: {
    color: Theme.color.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 6,
  },
  body: { color: Theme.color.textSecondary, fontSize: 14, lineHeight: 21 },
  linkButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Theme.color.accentSoft,
    alignItems: 'center',
  },
  textLink: { marginTop: 14, alignSelf: 'flex-start' },
  linkText: { color: Theme.color.accent, fontWeight: '800' },
  pending: { marginTop: 24, color: Theme.color.warning, fontSize: 13, lineHeight: 19 },
}));


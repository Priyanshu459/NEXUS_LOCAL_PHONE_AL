import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import {
  hasPublishedPrivacyPolicy,
  openPublishedPrivacyPolicy,
} from '../services/privacyPolicy';
import {
  OFFICIAL_WEBSITE_URL,
  PRIVACY_CONTACT_EMAIL,
} from '../config/compliance';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const published = hasPublishedPrivacyPolicy();
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
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
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
        <Text style={styles.updated}>Effective date: August 26, 2026</Text>
        <Text style={styles.heading}>Local data</Text>
        <Text style={styles.body}>
          Chats, settings, saved memories, downloaded GGUF models, and text read
          from documents you select are stored or processed on your device.
          Moonlight AI does not include user accounts, advertising SDKs,
          analytics SDKs, or cloud AI inference.
        </Text>
        <Text style={styles.heading}>Network activity</Text>
        <Text style={styles.body}>
          Moonlight AI connects to Hugging Face to resolve and download models
          you choose. Hugging Face receives normal network information such as
          your IP address and request metadata under its own terms and privacy
          policy.
        </Text>
        <Text style={styles.heading}>Documents and speech</Text>
        <Text style={styles.body}>
          The Android system document picker grants access only to a document
          you select. Supported text is read into the current local chat. Voice
          input launches the device's speech-recognition provider. That provider
          may process audio over a network depending on your device and
          settings. Moonlight AI does not directly receive or store microphone
          audio; it receives recognized text.
        </Text>
        <Text style={styles.heading}>Response reports</Text>
        <Text style={styles.body}>
          If response reporting is configured and you choose to submit a report,
          Moonlight AI sends only the reported assistant response, its response
          identifier, your selected category, and any explanation you enter. It
          does not include the rest of the conversation, memories, attachments,
          model files, or device identifiers. You preview and confirm the data
          before it is sent.
        </Text>
        <Text style={styles.heading}>Retention and deletion</Text>
        <Text style={styles.body}>
          Use the app's clear-chat, memory-management, and model-removal
          controls to delete local data. Uninstalling the app removes its
          application-private data subject to Android backup and device
          behavior. The report operator must publish its report-retention period
          before reporting is enabled.
        </Text>
        <Text style={styles.heading}>Security and children</Text>
        <Text style={styles.body}>
          Application-private storage and HTTPS reduce exposure but no device or
          transmission is perfectly secure. Moonlight AI is not directed to
          children under 13. A final target-audience decision and any
          region-specific age obligations must be completed before publication.
        </Text>
        <Text style={styles.heading}>Third parties, changes, and contact</Text>
        <Text style={styles.body}>
          Third-party services include Hugging Face and your device's
          speech-recognition provider. Their policies apply to their processing.
          Material policy changes will be reflected in the published policy with
          an updated effective date.
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
          onPress={() => openLink(`mailto:${PRIVACY_CONTACT_EMAIL}`)}
          accessibilityRole="link"
          accessibilityLabel={`Email Moonlight AI privacy contact at ${PRIVACY_CONTACT_EMAIL}`}
        >
          <Text style={styles.linkText}>
            Privacy contact: {PRIVACY_CONTACT_EMAIL}
          </Text>
        </TouchableOpacity>
        {published ? (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={openPolicy}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>Open published HTTPS policy</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.pending}>
            Public HTTPS publication and owner contact are pending. This in-app
            copy is provided for review and is not a substitute for the required
            public URL.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#141517' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  back: { color: '#A8C7FA', fontSize: 15, fontWeight: '700' },
  title: { color: '#F3F4F6', fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 36 },
  content: { padding: 20, paddingBottom: 48 },
  updated: { color: '#929AA6', marginBottom: 16 },
  heading: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 6,
  },
  body: { color: '#B5BAC3', fontSize: 14, lineHeight: 21 },
  linkButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#252F3F',
    alignItems: 'center',
  },
  textLink: { marginTop: 14, alignSelf: 'flex-start' },
  linkText: { color: '#A8C7FA', fontWeight: '800' },
  pending: { marginTop: 24, color: '#FFB86B', fontSize: 13, lineHeight: 19 },
});

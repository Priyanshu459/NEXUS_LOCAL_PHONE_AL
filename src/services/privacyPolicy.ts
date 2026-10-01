import { Linking } from 'react-native';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../config/compliance';

export const isActiveHttpsUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
};
export const hasPublishedPrivacyPolicy = (): boolean =>
  isActiveHttpsUrl(PRIVACY_POLICY_URL);

export const openPublishedPrivacyPolicy = async (): Promise<void> => {
  if (!hasPublishedPrivacyPolicy()) {
    throw new Error('The public privacy policy URL has not been configured.');
  }
  await Linking.openURL(PRIVACY_POLICY_URL);
};

export const hasPublishedTermsOfService = (): boolean =>
  isActiveHttpsUrl(TERMS_OF_SERVICE_URL);

export const openPublishedTermsOfService = async (): Promise<void> => {
  if (!hasPublishedTermsOfService()) {
    throw new Error('The public terms of service URL has not been configured.');
  }
  await Linking.openURL(TERMS_OF_SERVICE_URL);
};

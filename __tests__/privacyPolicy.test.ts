import { Linking } from 'react-native';
import {
  hasPublishedPrivacyPolicy,
  isActiveHttpsUrl,
  openPublishedPrivacyPolicy,
} from '../src/services/privacyPolicy';

describe('privacy policy link', () => {
  it('accepts only active-looking HTTPS URLs', () => {
    expect(isActiveHttpsUrl('https://moonlight.example/privacy')).toBe(true);
    expect(isActiveHttpsUrl('http://moonlight.example/privacy')).toBe(false);
    expect(isActiveHttpsUrl('')).toBe(false);
    expect(isActiveHttpsUrl('not a url')).toBe(false);
  });

  it('opens the configured public privacy policy', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    expect(hasPublishedPrivacyPolicy()).toBe(true);
    await expect(openPublishedPrivacyPolicy()).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      'https://moonlight-ai-app.pages.dev/privacy',
    );
  });
});

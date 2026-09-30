import { Linking } from 'react-native';

jest.mock('../src/config/compliance', () => ({
  AI_REPORT_ENDPOINT: '',
  AI_REPORT_EMAIL: 'compliance@moonlight-ai-app.pages.dev',
  PRIVACY_CONTACT_EMAIL: 'support@moonlight-ai-app.pages.dev',
}));

import {
  isAiReportingEndpointConfigured,
  isAiReportingEmailConfigured,
  isAiReportingConfigured,
  buildAiReportMailtoUrl,
  openAiReportEmail,
  dispatchAiReport,
  resetAiReportRateLimitForTests,
} from '../src/services/aiReportService';

describe('AI Report Service - Email Fallback Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAiReportRateLimitForTests();
  });

  it('detects endpoint as unconfigured and email as configured', () => {
    expect(isAiReportingEndpointConfigured()).toBe(false);
    expect(isAiReportingEmailConfigured()).toBe(true);
    expect(isAiReportingConfigured()).toBe(true);
  });

  it('constructs a minimal, properly encoded mailto URL with no secrets', () => {
    const url = buildAiReportMailtoUrl({
      responseId: 'resp-test-456',
      responseText: 'This response contains offensive language.',
      category: 'Hate or harassment',
      explanation: 'Found in regular chat.',
    });

    expect(url.startsWith('mailto:compliance@moonlight-ai-app.pages.dev?')).toBe(true);
    expect(url).toContain(encodeURIComponent('Moonlight AI — AI Response Report'));
    expect(url).toContain(encodeURIComponent('resp-test-456'));
    expect(url).toContain(encodeURIComponent('Hate or harassment'));
    expect(url).toContain(encodeURIComponent('This response contains offensive language.'));
    expect(url).toContain(encodeURIComponent('Found in regular chat.'));

    // Verify privacy: no auth headers, tokens, or API keys
    expect(url).not.toContain('Bearer');
    expect(url).not.toContain('apiKey');
    expect(url).not.toContain('authorization');
  });

  it('opens email composer using Linking.openURL when available', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    await expect(
      openAiReportEmail({
        responseId: 'resp-test-789',
        responseText: 'Potentially misleading advice.',
        category: 'Harmful or dangerous',
      })
    ).resolves.toBeUndefined();

    expect(Linking.canOpenURL).toHaveBeenCalledTimes(1);
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });

  it('throws an error if no email client is installed / available to handle mailto', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('ActivityNotFoundException'));

    await expect(
      openAiReportEmail({
        responseId: 'resp-test-789',
        responseText: 'Potentially misleading advice.',
        category: 'Harmful or dangerous',
      })
    ).rejects.toThrow(
      'Your email app could not be opened. Please install or configure a mail app.',
    );
  });

  it('dispatchAiReport routes directly to email fallback when endpoint is empty', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const result = await dispatchAiReport({
      responseId: 'resp-test-email-dispatch',
      responseText: 'Some reported answer',
      category: 'Other',
    });

    expect(result.method).toBe('email');
    expect(result.success).toBe(true);
    expect(Linking.openURL).toHaveBeenCalled();
  });

  it('dispatchAiReport fails validation if response text is blank', async () => {
    await expect(
      dispatchAiReport({
        responseId: 'resp-blank',
        responseText: '   ',
        category: 'Other',
      })
    ).rejects.toThrow('The response to report is missing or empty.');
  });
});

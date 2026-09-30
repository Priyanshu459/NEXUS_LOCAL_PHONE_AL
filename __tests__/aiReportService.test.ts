jest.mock('../src/config/compliance', () => ({
  AI_REPORT_ENDPOINT: 'https://reports.example.test/v1/ai-response',
  PRIVACY_POLICY_URL: '',
  AI_REPORT_EMAIL: 'reports@example.test',
  PRIVACY_CONTACT_EMAIL: 'reports@example.test',
}));

import {
  buildAiReportPayload,
  dispatchAiReport,
  DuplicateAiReportError,
  isAiReportingConfigured,
  isAiReportingEndpointConfigured,
  resetAiReportRateLimitForTests,
  submitAiReport,
} from '../src/services/aiReportService';

describe('AI response reporting (configured endpoint)', () => {
  beforeEach(() => resetAiReportRateLimitForTests());

  it('detects that the HTTPS reporting endpoint is configured', () => {
    expect(isAiReportingEndpointConfigured()).toBe(true);
    expect(isAiReportingConfigured()).toBe(true);
  });

  it('minimizes the payload to the reported response and explicit report fields', () => {
    const payload = buildAiReportPayload({
      responseId: 'assistant-42',
      responseText: 'Reported answer',
      category: 'Incorrect or misleading',
      explanation: '  The date is wrong.  ',
    });
    expect(payload).toEqual({
      schemaVersion: 1,
      responseId: 'assistant-42',
      reportedResponse: 'Reported answer',
      category: 'Incorrect or misleading',
      explanation: 'The date is wrong.',
      conversationIncluded: false,
    });
    expect(payload).not.toHaveProperty('conversation');
    expect(payload).not.toHaveProperty('memories');
    expect(payload).not.toHaveProperty('attachments');
    expect(payload).not.toHaveProperty('deviceId');
    expect(payload).not.toHaveProperty('modelFile');
  });

  it('attempts a POST request with headers and minimal JSON body', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const input = {
      responseId: 'assistant-post',
      responseText: 'Harmful content',
      category: 'Harmful or dangerous' as const,
      explanation: 'Unsafe instructions',
    };

    const result = await dispatchAiReport(input, { fetchImpl });
    expect(result).toEqual({ method: 'endpoint', success: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://reports.example.test/v1/ai-response',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAiReportPayload(input)),
      }),
    );
  });

  it('reports network failures without recording a duplicate', async () => {
    const failedFetch = jest.fn().mockRejectedValue(new Error('offline'));
    const input = {
      responseId: 'assistant-1',
      responseText: 'Answer',
      category: 'Other' as const,
    };
    await expect(submitAiReport(input, failedFetch)).rejects.toThrow(/connection/i);

    const retryFetch = jest.fn().mockResolvedValue({ ok: true, status: 204 });
    await expect(submitAiReport(input, retryFetch)).resolves.toBeUndefined();
  });

  it('surfaces non-success HTTP responses', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(
      submitAiReport(
        {
          responseId: 'assistant-2',
          responseText: 'Answer',
          category: 'Harmful or dangerous',
        },
        fetchImpl,
      ),
    ).rejects.toThrow(/HTTP 503/);
  });

  it('prevents an identical successful report for five minutes', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const input = {
      responseId: 'assistant-3',
      responseText: 'Answer',
      category: 'Hate or harassment' as const,
      explanation: 'Reason',
    };
    await submitAiReport(input, fetchImpl, () => 1_000);
    await expect(submitAiReport(input, fetchImpl, () => 2_000)).rejects.toBeInstanceOf(
      DuplicateAiReportError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects missing or empty reported response gracefully', async () => {
    const fetchImpl = jest.fn();
    await expect(
      submitAiReport(
        {
          responseId: 'assistant-empty',
          responseText: '   ',
          category: 'Other',
        },
        fetchImpl,
      ),
    ).rejects.toThrow(/missing or empty/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

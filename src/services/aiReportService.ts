import { Linking } from 'react-native';
import {
  AI_REPORT_ENDPOINT,
  AI_REPORT_EMAIL,
  PRIVACY_CONTACT_EMAIL,
} from '../config/compliance';
import { isActiveHttpsUrl } from './privacyPolicy';

export const AI_REPORT_CATEGORIES = [
  'Harmful or dangerous',
  'Hate or harassment',
  'Sexual content',
  'Child-safety concern',
  'Deceptive or fraudulent',
  'Incorrect or misleading',
  'Other',
] as const;

export type AiReportCategory = (typeof AI_REPORT_CATEGORIES)[number];

export interface AiReportInput {
  responseId: string;
  responseText: string;
  category: AiReportCategory;
  explanation?: string;
}

export interface AiReportPayload {
  schemaVersion: 1;
  responseId: string;
  reportedResponse: string;
  category: AiReportCategory;
  explanation?: string;
  conversationIncluded: false;
}

export type AiReportDispatchResult =
  | { method: 'endpoint'; success: true }
  | { method: 'email'; success: true };

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const recentReports = new Map<string, number>();

export const validateAiReportInput = (input: AiReportInput): void => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid report input.');
  }
  if (
    !input.responseId ||
    typeof input.responseId !== 'string' ||
    !input.responseId.trim()
  ) {
    throw new Error('Report is missing a valid response identifier.');
  }
  if (
    !input.responseText ||
    typeof input.responseText !== 'string' ||
    !input.responseText.trim()
  ) {
    throw new Error('The response to report is missing or empty.');
  }
  if (!input.category || !AI_REPORT_CATEGORIES.includes(input.category)) {
    throw new Error('Please select a valid report category.');
  }
};

export const getEffectiveReportEmail = (): string =>
  (typeof AI_REPORT_EMAIL === 'string' && AI_REPORT_EMAIL.trim()) ||
  (typeof PRIVACY_CONTACT_EMAIL === 'string' &&
    PRIVACY_CONTACT_EMAIL.trim()) ||
  'priyanshu09016@gmail.com';

export const isAiReportingEndpointConfigured = (): boolean =>
  isActiveHttpsUrl(AI_REPORT_ENDPOINT);

export const isAiReportingEmailConfigured = (): boolean =>
  Boolean(getEffectiveReportEmail() && getEffectiveReportEmail().includes('@'));

export const isAiReportingConfigured = (): boolean =>
  isAiReportingEndpointConfigured() || isAiReportingEmailConfigured();

const fingerprint = (input: AiReportInput) =>
  [input.responseId, input.category, input.explanation?.trim() ?? ''].join(
    '\u0000',
  );

export const buildAiReportPayload = (input: AiReportInput): AiReportPayload => {
  validateAiReportInput(input);
  const explanation = input.explanation?.trim();
  return {
    schemaVersion: 1,
    responseId: input.responseId,
    reportedResponse: input.responseText,
    category: input.category,
    ...(explanation ? { explanation } : {}),
    conversationIncluded: false,
  };
};

export const buildAiReportMailtoUrl = (
  input: AiReportInput,
  recipient: string = getEffectiveReportEmail(),
  now: number = Date.now(),
): string => {
  validateAiReportInput(input);
  const subject = 'Moonlight AI — AI Response Report';
  const explanation = input.explanation?.trim() || 'None provided';
  const body = [
    'Moonlight AI — AI Response Report',
    '',
    `Category: ${input.category}`,
    `Response ID: ${input.responseId}`,
    `Timestamp: ${new Date(now).toISOString()}`,
    '',
    'User Explanation:',
    explanation,
    '',
    'Reported Assistant Response:',
    input.responseText,
    '',
    '---',
    'This report was generated from the Moonlight AI Android app.',
  ].join('\n');

  return `mailto:${recipient.trim()}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
};

export class DuplicateAiReportError extends Error {}
export class AiReportConfigurationError extends Error {}

export const openAiReportEmail = async (
  input: AiReportInput,
  recipient: string = getEffectiveReportEmail(),
  linking: {
    canOpenURL?: (url: string) => Promise<boolean>;
    openURL: (url: string) => Promise<any>;
  } = Linking,
  now: number = Date.now(),
): Promise<void> => {
  validateAiReportInput(input);
  const mailtoUrl = buildAiReportMailtoUrl(input, recipient, now);

  let canOpen = true;
  if (typeof linking.canOpenURL === 'function') {
    try {
      canOpen = await linking.canOpenURL(mailtoUrl);
    } catch {
      canOpen = false;
    }
  }

  if (!canOpen) {
    try {
      await linking.openURL(mailtoUrl);
      return;
    } catch {
      throw new Error(
        'Your email app could not be opened. Please install or configure a mail app.',
      );
    }
  }

  try {
    await linking.openURL(mailtoUrl);
  } catch {
    throw new Error(
      'Your email app could not be opened. Please try again later.',
    );
  }
};

export const submitAiReport = async (
  input: AiReportInput,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<void> => {
  validateAiReportInput(input);
  if (!isAiReportingEndpointConfigured()) {
    throw new AiReportConfigurationError(
      'Response reporting endpoint is not configured for this build.',
    );
  }

  const key = fingerprint(input);
  const lastSubmitted = recentReports.get(key);
  if (
    lastSubmitted !== undefined &&
    now() - lastSubmitted < DUPLICATE_WINDOW_MS
  ) {
    throw new DuplicateAiReportError(
      'This response report was already submitted recently.',
    );
  }

  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetchImpl(AI_REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAiReportPayload(input)),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError' || controller.signal?.aborted) {
      throw new Error(
        'Report submission timed out. Check your connection and try again.',
      );
    }
    throw new Error(
      'Could not send the report. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      throw new Error(
        `The report service rejected the request (HTTP ${response.status}). Try again.`,
      );
    }
    throw new Error(
      `The report service returned HTTP ${response.status}. Try again.`,
    );
  }
  recentReports.set(key, now());
};

export const dispatchAiReport = async (
  input: AiReportInput,
  options?: {
    fetchImpl?: typeof fetch;
    linking?: {
      canOpenURL?: (url: string) => Promise<boolean>;
      openURL: (url: string) => Promise<any>;
    };
    now?: () => number;
  },
): Promise<AiReportDispatchResult> => {
  validateAiReportInput(input);
  if (isAiReportingEndpointConfigured()) {
    await submitAiReport(input, options?.fetchImpl, options?.now);
    return { method: 'endpoint', success: true };
  }
  await openAiReportEmail(
    input,
    getEffectiveReportEmail(),
    options?.linking,
    options?.now ? options.now() : Date.now(),
  );
  return { method: 'email', success: true };
};

export const resetAiReportRateLimitForTests = () => recentReports.clear();

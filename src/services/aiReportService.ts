import { AI_REPORT_ENDPOINT } from '../config/compliance';
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

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const recentReports = new Map<string, number>();

export const isAiReportingConfigured = (): boolean =>
  isActiveHttpsUrl(AI_REPORT_ENDPOINT);

const fingerprint = (input: AiReportInput) =>
  [input.responseId, input.category, input.explanation?.trim() ?? ''].join(
    '\u0000',
  );

export const buildAiReportPayload = (input: AiReportInput): AiReportPayload => {
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

export class DuplicateAiReportError extends Error {}
export class AiReportConfigurationError extends Error {}

export const submitAiReport = async (
  input: AiReportInput,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<void> => {
  if (!isAiReportingConfigured()) {
    throw new AiReportConfigurationError(
      'Response reporting is not configured for this build.',
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
  try {
    response = await fetchImpl(AI_REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAiReportPayload(input)),
    });
  } catch {
    throw new Error(
      'Could not send the report. Check your connection and try again.',
    );
  }

  if (!response.ok) {
    throw new Error(
      `The report service returned HTTP ${response.status}. Try again.`,
    );
  }
  recentReports.set(key, now());
};

export const resetAiReportRateLimitForTests = () => recentReports.clear();

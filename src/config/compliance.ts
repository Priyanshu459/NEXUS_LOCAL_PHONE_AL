/**
 * Public production configuration.
 *
 * Do not put API keys or other credentials in this file. The report endpoint
 * must authenticate/abuse-protect requests on the server side without a secret
 * embedded in the application.
 */
export const OFFICIAL_WEBSITE_URL = 'https://moonlight-ai-app.pages.dev/';
export const PRIVACY_POLICY_URL = 'https://moonlight-ai-app.pages.dev/privacy';
export const PRIVACY_CONTACT_EMAIL = 'priyanshu09016@gmail.com';

/**
 * AI Response Reporting Configuration:
 *
 * 1. AI_REPORT_ENDPOINT:
 *    When configured with a valid HTTPS endpoint, response reports are submitted
 *    directly via HTTP POST using a minimal, privacy-preserving JSON payload.
 *    Keep empty ('') until a production reporting endpoint (e.g. Cloudflare Worker)
 *    is deployed and verified.
 *
 * 2. AI_REPORT_EMAIL:
 *    When AI_REPORT_ENDPOINT is empty, the application falls back to opening the
 *    user's native email client with a pre-filled report addressed to this email.
 */
export const AI_REPORT_ENDPOINT = '';
export const AI_REPORT_EMAIL = PRIVACY_CONTACT_EMAIL;


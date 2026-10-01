# Privacy Policy

Effective date: October 1, 2026

Published URL: `https://moonlight-ai-app.pages.dev/privacy`
Terms of Service: `https://moonlight-ai-app.pages.dev/terms`
Support / Privacy Contact: `priyanshu09016@gmail.com`

## App Overview

Moonlight AI is an Android app that lets users run and manage local GGUF language models, chat with those models, import user-selected documents, and optionally connect to cloud AI providers, local LM Studio servers, or web search services. Moonlight AI does not include user accounts, profile tracking, advertising SDKs, or analytics trackers.

## Information Processed Locally on the Device

The app stores conversations, settings, saved memories, selected model metadata, and imported document text solely on the user's device in application-private storage. Local model inference is executed on-device using llama.rn. These local items are not uploaded or transmitted to the app developer.

Users may delete conversations, clear memories, and remove downloaded models at any time within the app. Android cloud backup is disabled (`android:allowBackup="false"`).

## Optional Cloud AI Providers

If a user explicitly chooses to configure and select a third-party cloud AI provider (such as OpenAI, Google Gemini, Anthropic, Alibaba Cloud, or NVIDIA), up to 20 recent messages, custom system instructions, approved text attachments, and search excerpts are sent over encrypted HTTPS for response generation. Saved memories are not included. API keys are stored encrypted on-device in Android Keystore (AES-256 GCM). Data sent to third-party providers is governed by the respective provider's terms and privacy policy.

## Optional Web Search

Supported cloud models can perform web searches using provider-native tools. Additionally, when a search connection is configured, search queries are transmitted over HTTPS to retrieve relevant source excerpts. Cited URLs are stored with the answer. Opening a source link navigates directly to that third-party website.

## Optional LM Studio Connections

Connecting to LM Studio routes selected messages and instructions to the user's configured computer or server. Server authorization tokens are encrypted in Android Keystore. Unencrypted HTTP is permitted only for literal private IPv4 addresses on the user's trusted local network; public HTTP destinations and redirects are blocked.

## Agent Actions & Human Review

The assistant may propose actions such as viewing a destination in Maps, sharing text via the system share sheet, or adding an event to Calendar. Moonlight AI never executes actions autonomously; every action requires explicit user review and confirmation before any external app is opened.

## Model Downloads

When a user downloads a model, the app connects directly to the model host (such as Hugging Face) over HTTPS. The host may receive standard network request information such as IP address and request metadata under its own terms and privacy policy.

## Voice Input

Voice input uses the Android speech-recognition provider available on the user's device. The app receives recognized text from that provider. The app does not directly record, store, or transmit microphone audio.

## User-Selected Files and Media

Users may select files through the Android system picker. The app reads plain text from selected documents into local chat context. For vision models, user-selected images or video frames are converted to temporary base64 frames and transmitted only to the confirmed cloud provider.

## AI Response Reports

Users may submit a report about a specific AI response. A report contains:

- Report category.
- The reported AI response text.
- Optional user explanation.
- A response identifier.

Reports do not include full conversation history, memories, imported files, device identifiers, or API credentials. Reports are sent via an HTTPS reporting endpoint when configured, or through the device's native email client addressed to our support team.

## Children

Moonlight AI is intended for general audiences and is not directed to children under 13.

## Security

Network calls for cloud providers, web search, model downloads, and reporting require HTTPS. The app stores credentials in Android Keystore with AES-256 GCM encryption.

## Contact and Data Deletion

To request assistance, report an issue, or ask privacy questions, contact:

Privacy contact: `priyanshu09016@gmail.com`
Official website: `https://moonlight-ai-app.pages.dev/`

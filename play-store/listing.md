# Google Play Listing Draft

Owner action required: review all copy for final app name, package name, screenshots, support email, and legal claims before publishing.

## App name

Moonlight AI

## Short description

Local AI chat with downloadable GGUF models and private on-device storage.

## Full description

Moonlight AI helps you chat with local language models on Android. Download compatible GGUF models, manage local model files, keep chats and memories on your device, and use selected documents as local context.

The app is designed for local-first use. Model quality, speed, and availability depend on your device and the model you choose. AI responses can be inaccurate, incomplete, or inappropriate, so important information should be checked before you rely on it.

Features:

- Download and manage supported GGUF models.
- Run local AI chats on device.
- Import user-selected files for local context.
- Optional voice input through the Android speech-recognition provider.
- Report problematic AI responses when reporting is configured.

The app does not include model weights in the app download. Third-party model licenses and host terms apply.

## Release notes

Initial production preparation release with local model chat, model download management, document context, privacy policy access, and AI response reporting support.

## Reviewer notes

- No login is required.
- The app requires internet access for model downloads and optional report submission.
- The app should request no microphone permission from this package; voice input is delegated to Android speech recognition.
- The app should request no broad storage permission.
- AI reporting is not production-ready until `AI_REPORT_ENDPOINT` is configured with a live HTTPS endpoint.
- The external privacy policy is not production-ready until `PRIVACY_POLICY_URL` is configured with a live HTTPS URL.

## Audience and content

Recommended initial target audience: adults only, until child-safety review is complete.

Recommended content rating disclosures:

- User-generated or AI-generated text may include mature, inaccurate, or sensitive content.
- No gambling, purchases, or ads are intended.
- No account creation is required.

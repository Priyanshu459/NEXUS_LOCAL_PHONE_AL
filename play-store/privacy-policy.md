# Privacy Policy Draft

Effective date: 2026-08-26

Owner action required: publish this policy at a live HTTPS URL before Google Play submission, then set that URL in `src/config/compliance.ts`.

## App

Moonlight AI is an Android app that lets users run and manage local GGUF language models, chat with those models, import user-selected files, and optionally report AI responses that appear inappropriate or inaccurate.

## Information processed on the device

The app stores chats, settings, memories, selected model metadata, and imported document text on the user's device. Local model inference is designed to run on the device. These local items are not sent to the app developer unless the user takes an action that sends data off the device, such as reporting an AI response or downloading a model.

## Model downloads

When a user downloads a model, the app connects to the model host selected in the app. The host may receive network information such as IP address, request metadata, and download activity according to that host's own terms and privacy policy.

## Voice input

Voice input uses the Android speech-recognition provider available on the user's device. The app receives recognized text from that provider. The app does not directly record, store, or transmit microphone audio.

## User-selected files

Users may select files through the Android system picker. The app reads the selected file so it can be used in local chat context. Users should not import files they do not want processed by the app.

## AI response reports

If reporting is enabled, users may submit a report about a specific AI response. A report contains:

- Report category.
- The reported AI response text.
- Optional user explanation.
- A response identifier.

Reports do not include the full conversation, memories, imported files, device identifiers, model files, or hidden prompts. Reports are used to investigate safety, quality, and policy issues.

Owner action required: define retention, deletion, access controls, and contact process for the production reporting backend before launch.

## Children

The app is not prepared for a child-directed launch. Until a separate child-safety review is complete, list the app for adults only and avoid marketing it to children.

## Security

Network calls must use HTTPS. The app does not contain backend credentials or signing keys. Users should protect their device lock screen because local app data is stored on the device.

## Deletion and contact

Owner action required: add a monitored privacy contact email and deletion-request process before publication.

Privacy contact: [OWNER: add monitored privacy email]

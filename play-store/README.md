# Google Play Release Readiness

This repository has been hardened for a safer Google Play production path, but it is not ready to upload yet.

## Current verdict

Blocked until the app owner supplies and verifies:

- Final permanent package name/application ID. The repository still uses `com.localllmapp`.
- A Play App Signing enrollment decision and a private upload key.
- A live HTTPS privacy policy URL, published outside the app.
- A live HTTPS AI content reporting endpoint.
- Play Console version history for the package, so `versionCode` can be advanced correctly.
- Physical-device and closed-test evidence.

## Repository changes included

- Release builds no longer fall back to the Android debug signing key.
- Release signing now requires explicit environment variables.
- The Android manifest removes microphone and legacy external-storage permissions inherited by dependencies.
- Voice input uses the external Android speech-recognition activity and does not request microphone permission from this app.
- The app now has an in-app privacy-policy screen and settings entry.
- Assistant responses now expose an AI report flow with fixed report categories and a minimized network payload.
- Store-prep documents are in this `play-store` directory.

## Owner files to complete

- `privacy-policy.md`: publish externally and put the final HTTPS URL into `src/config/compliance.ts`.
- `reporting-contract.md`: implement the backend and put the final HTTPS endpoint into `src/config/compliance.ts`.
- `signing.md`: create and protect the upload key outside the repository.
- `data-safety-worksheet.md`: use as the starting point for the Play Console Data Safety form.
- `model-licenses.md`: keep with release evidence and review the custom Llama/Gemma terms before commercial launch.
- `release-checklist.md`: use before every production upload.
- `listing.md`: draft store listing and review notes.
- `asset-checklist.md`: required screenshots and graphics.

# Moonlight 1.1 preview: app assessment

## Starting state

The repository is a React Native 0.86 / React 19 Android and iOS app. Android includes a llama.rn CPU inference engine, MMKV persistence, GGUF downloads, native speech recognition, clipboard support, and text-file selection. The model catalog includes compact instruction models. Existing uncommitted fixes were preserved.

The baseline passed TypeScript and 75 tests. Its home screen led to a single shared chat history. Assistant answers were rendered as plain text. A fixed 2,048-token context caused long conversations to fail. The memory toggle did not gate memory injection in ChatScreen. Stopping generation cleared the UI's busy state before native completion had settled. The release build already required a signing key, but no configured release artifact was present.

## Implemented in this update

- Redesigned home: quiet dark palette, clear model setup status, four task starters, and a searchable conversation library.
- Independent saved conversations with generated titles, rename, explicit deletion confirmation, native text sharing, and reopening.
- One-time migration of legacy chat history; old storage is removed after the new copy is saved.
- Readable assistant headings, bold text, inline code, and horizontally scrollable fenced code blocks with selectable text.
- Token-aware context fitting: remove oldest whole turns from inference while retaining the complete saved conversation. Show a notice when this happens. Reject oversized latest messages with an actionable error.
- Respect the memory-enabled preference for both reading and saving model-generated memories.
- Serialize generation and wait for native completion to settle after Stop. Cancel requests that are still formatting. Restore the draft and attachment if generation fails.
- Save a submitted user message immediately, and save completed conversations without a delayed timer.
- Remove the extra 2.5-second wait when opening chat.
- Signed ARM64 release preview, version 1.1.0, in a separate application ID so the existing app stays installed.

## Position relative to major assistants

This is a stronger offline assistant prototype, not a demonstrated replacement for ChatGPT or Gemini. Its useful distinction is local text inference without a chat subscription or sending text prompts to a cloud inference service. Small phone models have substantially different capabilities and resource constraints from hosted frontier systems. No comparative quality, speed, or battery benchmark was performed.

There is no implemented cloud fallback, web search, image understanding, image generation, cross-device sync, or document retrieval index. Attachments are text-only and limited by model context. The existing voice recognizer is provided by Android and may use a network service. History is app-private but not encrypted by this update. The CPU build does not promise GPU acceleration. Reporting remains dependent on the existing endpoint configuration. Existing model license verification flags still require attention before public distribution.

## Validation and next work

Baseline: 75 tests passed. Added service tests for migration, deletion, conversation isolation, title preservation, context trimming, and oversized-message errors. Added a home-screen interaction test. Final test/build results are recorded with the delivery.

No connected Android phone or configured emulator was available during development. Real-device visual checks, downloads, offline inference, latency, thermal behavior, battery usage, and speech/file-picker flows still need testing. The existing app-entry test only covers its splash mock; it is not evidence of end-to-end startup.

The next product milestone should measure reliability on several real phones, benchmark a chosen small model on a fixed task set, and improve answer quality based on those measurements. Retrieval for long documents and an optional securely hosted model gateway can follow. Cloud integration would need an actual service, operating budget, authentication, and clear privacy controls.

## Final release verification

- 80 tests passed across 10 suites.
- TypeScript passed; targeted ESLint checks have no errors (existing inline-style warnings remain).
- Full native release built successfully. Final JavaScript-only packaging reused those unchanged native binaries after a Windows Ninja incremental path-length error.
- Final APK: `releases/Moonlight-1.1.0-preview-arm64.apk`, 101,546,883 bytes.
- APK v2 signature verified; zipalign 16 KB page-alignment check passed.
- Package: `com.moonknightstudio.moonlightai.preview`; version code 2; version 1.1.0-preview.
- ARM64 only; minimum SDK 24; target SDK 36; non-debuggable release.
- SHA-256: `A31E04B08CA343E7A44E269F0339CD37B03A2692D371D118152961AFA4EA5C3A`.
- No physical-device or emulator smoke test was available.

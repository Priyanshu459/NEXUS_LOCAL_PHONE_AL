# Moonlight AI 1.2.0 preview

Built September 6, 2026. Installable file: `releases/Moonlight-1.2.0-Paper-Mono-arm64.apk` (101,514,963 bytes).

## Included

- Paper and Mono appearance with light, dark and system themes; existing Moonlight logo and Android icons preserved.
- Chat opens first. Inline model download keeps the draft editable and requires the user to send it after setup.
- Conversation drawer with search, rename, share, delete, Explore, Models, Settings and privacy access.
- Moonlight Qwen3 4B v7 Q8_0 recommended when available RAM and storage meet conservative thresholds. Smaller catalog models suggested otherwise. These are capacity estimates, not measured inference performance guarantees.
- Response style and personal instructions, larger conversation text, memory controls, model management, conversation deletion, advanced generation settings and help.
- Web search explicitly marked not connected, pending a provider connection. No simulated web results.
- Model URL validation and bounded native attachment reading security fixes.

## Validation

TypeScript checking and 96 automated tests across 13 suites pass. Browser review covered phone-width setup, conversation drawer, settings and live light/dark appearance. Browser native services are stubs, so this does not verify on-device inference or downloads.

Android release Java/Kotlin compilation, signing verification and 16 KB APK ZIP alignment checks passed. Unchanged native C/C++ binaries were reused from the prior build. No phone or emulator was connected; model download, inference speed, memory pressure, voice input and native attachment integration still need testing on a phone.

Package: `com.moonknightstudio.moonlightai.preview`, version `1.2.0-preview`, code `4`. Requires Android 7.0 or newer and ARM64. Model files download separately; Moonlight's model is approximately 4.28 GB.

SHA-256: `7A00B9E6CBF6E319FE138BF87867CD3347FE03B765AFC12825FA0EFE6CCDD2F4`.

## Phone test

Copy the APK to your phone and open it to install. Allow installation from that file-opening app if Android asks. Open Moonlight, select/download the suggested model, and send a short message. Check that an unsent draft survives setup, then try history, appearance settings and switching models. Keep web search disabled until its provider is configured.

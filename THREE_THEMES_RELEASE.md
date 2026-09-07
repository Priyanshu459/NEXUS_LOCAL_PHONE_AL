# Moonlight 1.2.1 preview

This supersedes the 1.2.0 APK involved in the reported Realme 11 Pro 5G freeze. The exact cause of that freeze remains unconfirmed; this release is not verified on that phone.

## Changes

- Settings → Appearance offers Paper, Mono and Midnight with color previews and a saved selection. Follow system selects Paper or Midnight. Existing light/dark preferences migrate automatically. Mono uses sans-serif headings. Theme changes preserve mounted chat state and drafts.
- Updated chat welcome; original brand image and launcher resources unchanged.
- The model picker is restricted to Llama 3.2 1B and Qwen 2.5 1.5B. Moonlight 4B and other large models are not offered. The loader also rejects files larger than 1.3 GiB, including previously downloaded or custom models.
- Actual file size and live available RAM are checked immediately before native loading. Unknown capacity fails closed. Requires 64-bit support, at least 4 GiB total RAM and available RAM of file size plus 1.5 GiB. These are conservative heuristics, not proven safe-device thresholds.
- Serialized initialization prevents concurrent model loads. Context is reduced to 1,024 tokens, batch to 128, microbatch to 64 and CPU threads to two; memory mapping enabled, memory locking disabled.
- Web search remains unconnected.

## Verification

106 tests in 15 suites passed, including load sequencing, large-file rejection, memory reserve checks and appearance state preservation. TypeScript checking passed. Android release build uses unchanged prior C/C++ outputs; JS and platform compilation follow the regular release process.

No real-phone inference, thermal, sustained-load or freeze-recovery test was performed. First inspect the UI without downloading a model. Further model testing remains necessary before treating this as a production release.

Output: `releases/Moonlight-1.2.1-Three-Themes-arm64.apk`. Android 7+, ARM64; preview package version code 5. Model files are separate downloads.

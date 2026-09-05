# Moonlight AI

The latest app, with neutral colors and restored branding, is available as `releases/Moonlight-Updated-arm64.apk`. See [UI redesign notes](UI_REDESIGN.md) for changes and verification.

A private, on-device text assistant built with React Native and llama.rn.

## 1.1.0 preview

The update adds a refreshed home, searchable saved conversations, rename/share/delete controls, formatted answers, and automatic context fitting for longer chats. See [the app assessment](APP_STATE.md) for findings and limitations.

## Test on your phone

1. Copy `releases/Moonlight-1.1.0-preview-arm64.apk` to a 64-bit ARM Android phone running Android 7.0 or later.
2. Open it from Files and allow installation from that app if Android asks.
3. Launch Moonlight AI. The preview installs separately from the old app and has separate chats/models.
4. Download a model on Wi-Fi. The default Qwen 2.5 1.5B download is approximately 1.1 GB; leave additional storage and RAM available. Models are not bundled in the APK.
5. Start a chat, go home, reopen it, and test search, rename, sharing, and deletion.
6. After the model is downloaded, try text chat in airplane mode. Test Stop, a longer conversation, a short text attachment, and the memory toggle.

This is a signed release-mode preview, not a Play Store publication. Device performance has not been measured. It supports ARM64 phones only.

## Development

```powershell
npm ci
npx tsc --noEmit
npm test -- --runInBand
npm run android
```

## Rebuild the signed preview

With Android Studio, SDK 36, NDK 27.1.12297006, and Node installed:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-preview.ps1
```

The script uses the local Android SDK, generates a preview signing key if needed, builds the bundled release, verifies its signature, and copies it to `releases`. Keep the ignored `.local-release` directory private and backed up if you want future preview APKs to update this installation. It contains the local signing key and its credentials. Public-release signing requirements remain in `play-store/signing.md`.

Preview application ID: `com.moonknightstudio.moonlightai.preview`.

For a JavaScript-only rebuild after a successful native release, `tools/build-preview.ps1 -ReuseNativeBinaries` reuses compiled native libraries. This avoids an incremental Ninja 260-character path error observed in this Windows checkout. Do not use that option after changing native code, Android configuration, or dependencies; those require a full native rebuild, preferably from a shorter workspace/cache path.



# Google Play Release Audit: Moonlight AI

Audit date: 2026-08-25  
Project: React Native Android app (`moonlight-ai`)  
Package/application ID: `com.localllmapp`

## Executive Summary

Moonlight AI is not ready for a Google Play production release yet. The Android App Bundle can be built successfully, and the project already targets Android 16 / API 36, which satisfies the Google Play target API requirement taking effect on 2026-08-31. However, the release variant is still signed with the debug keystore, lint fails, Jest crashes after teardown, Play policy/privacy declarations need tightening, and several product/reliability issues should be fixed before a closed test or production submission.

Current status: **Release buildable, not release-ready.**

## Verification Performed

| Check | Result | Notes |
| --- | --- | --- |
| `npm test -- --runInBand` | Failed | `App.test.tsx` reports PASS, then Jest crashes after environment teardown due to React Native Animated/Easing mock behavior. |
| `npm run lint` | Failed | 250 total issues: 12 errors and 238 warnings. Errors include unused imports and missing React hook dependencies. |
| `android/gradlew.bat :app:bundleRelease` | Passed | Generated `android/app/build/outputs/bundle/release/app-release.aab`. Build warns that deprecated Gradle features are incompatible with Gradle 10. |
| Release AAB size | 90,160,273 bytes | About 86 MB. Below current Play bundle limits, but native ABI and model-delivery strategy should still be optimized. |

## Google Play Requirements Checked

Sources reviewed:

- Google Play target API requirement: <https://developer.android.com/google/play/requirements/target-sdk>
- Google Play Data safety form: <https://support.google.com/googleplay/android-developer/answer/10787469>
- Android App Bundle size guidance: <https://developer.android.com/guide/app-bundle/faq>
- Google Play app size limits: <https://support.google.com/googleplay/android-developer/answer/9859372>
- Play App Signing / upload keys: <https://support.google.com/googleplay/android-developer/answer/9842756>
- Android app signing: <https://developer.android.com/studio/publish/app-signing>

Important 2026 requirement: starting **2026-08-31**, new apps and updates must target Android 16 / API 36 or higher for standard phone/tablet apps. This project currently sets `targetSdkVersion = 36`, so it is aligned.

## Release Blockers

### 1. Release Build Uses the Debug Keystore

Evidence:

- `android/app/build.gradle` defines only `signingConfigs.debug`.
- `android/app/build.gradle` release build uses `signingConfig signingConfigs.debug`.

Risk:

- A debug-signed AAB is not acceptable for a proper Google Play release workflow.
- The app must use a private upload key and be enrolled in Play App Signing.
- Shipping a debug key also damages update/security posture.

Fix:

- Generate a production upload keystore outside source control.
- Store passwords/paths in `~/.gradle/gradle.properties`, environment variables, or CI secrets.
- Add a `release` signing config that reads secrets securely.
- Ensure `android/app/debug.keystore` is never used by `buildTypes.release`.
- Keep Play App Signing enabled in Play Console.

Recommended Gradle pattern:

```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### 2. Lint Fails

Evidence:

- `npm run lint` exits with 12 errors.
- Examples:
  - `src/screens/GalleryScreen.tsx`: unused `NativeStackScreenProps`, `RootStackParamList`.
  - `src/screens/ModelsScreen.tsx`: unused `Easing`, unused `W`, missing `useEffect` dependencies.
  - `src/screens/SettingsScreen.tsx`: missing `useEffect` dependencies.
  - `src/screens/WorkspaceScreen.tsx`: unused `Platform`, `Alert`, `NativeStackScreenProps`, `RootStackParamList`, `SparkleFourColorIcon`.

Risk:

- Failing lint should block release CI.
- Missing hook dependencies can create stale animation/state bugs.
- Large warning count hides real issues.

Fix:

- Remove unused imports/constants.
- Fix hook dependency arrays or rewrite animations to use stable refs.
- Decide whether `react-native/no-inline-styles` is a release-blocking rule. If the current design intentionally uses inline styles, configure the rule explicitly instead of carrying 238 warnings.

### 3. Jest Test Command Crashes After Teardown

Evidence:

- `__tests__/App.test.tsx` passes, then process crashes with:
  - `ReferenceError: You are trying to import a file after the Jest environment has been torn down`
  - `TypeError: Cannot read properties of undefined (reading 'inOut')`

Risk:

- CI cannot trust the test suite.
- Animated timers are still active after render, causing late imports/mocks after teardown.

Fix:

- Mock React Native Animated more completely in `jest.setup.js`, or disable native animation timers for app render tests.
- Unmount the renderer in `App.test.tsx`.
- Consider using fake timers and flushing pending timers before test completion.
- Add focused tests for model filename sanitization, failed downloads, voice permission denial, and corrupt model handling.

### 4. Release Minification Is Disabled

Evidence:

- `android/app/build.gradle`: `enableProguardInReleaseBuilds = false`.

Risk:

- Larger bundle, easier reverse engineering, and less optimized Java/Kotlin bytecode.
- Google Play does not require minification, but production Android apps generally should enable R8 after keep-rule validation.

Fix:

- Enable `minifyEnabled true` for release.
- Validate ProGuard/R8 rules for React Native, `llama.rn`, `react-native-mmkv`, and Nitro modules.
- Upload native debug symbols and mapping files to Play Console after each release.

## High-Priority Improvements Before Closed Testing

### 1. Package Name Is Still Generic

Evidence:

- `android/app/build.gradle`: `applicationId "com.localllmapp"`.
- Kotlin/Java namespace: `com.localllmapp`.

Risk:

- Looks like a scaffold/internal package rather than a brand-ready Play identity.
- Package ID cannot be changed after production launch without publishing a new app.

Fix:

- Choose final package ID before first Play upload, for example `com.moonlightai.app` if legally available.
- Rename Android namespace/package and verify native modules still autoload.

### 2. Model Download Licensing and Attribution Need Review

Evidence:

- Model links point to Hugging Face repositories from Meta/bartowski, Qwen, unsloth, Microsoft, and others.
- The app UI exposes those model options directly.

Risk:

- Each model has its own license, acceptable use policy, attribution expectations, and redistribution/linking terms.
- Store listing claims must not imply ownership of third-party models.

Fix:

- Add an in-app model license/attribution screen.
- Review each linked model repo license before publishing.
- Add store listing wording that models are downloaded from third-party sources chosen by the user/app.
- Consider starting with a smaller curated list whose licenses are clearly compatible with your release plan.

### 3. Privacy/Data Safety Declarations Need to Match Real Behavior

Evidence:

- Manifest declares `INTERNET` and `RECORD_AUDIO`.
- App downloads models from the internet.
- Voice input uses Android speech recognition.
- File picker reads selected document text into the current chat.
- Chats, settings, memories, and downloaded models are stored locally via MMKV / document storage.

Risk:

- Google Play requires accurate Data Safety disclosure for app and SDK behavior.
- Voice recognition may involve network processing depending on device/service.
- "Local-first" wording is acceptable only if exceptions are explicit.

Fix:

- Publish a privacy policy URL before completing Play Console App Content.
- Declare microphone use clearly.
- Decide Data Safety carefully:
  - If the app itself only downloads models and does not transmit prompts/files/chats to your servers, say so.
  - If Android speech recognition or third-party services process audio, disclose this accurately.
  - If future analytics/crash reporting is added, update declarations before release.
- Add a first-use voice disclosure before requesting microphone permission.

### 4. Missing Runtime Permission Rationale and Graceful Denial Paths

Evidence:

- `ChatScreen.tsx` requests `RECORD_AUDIO` directly.
- If denied, it shows a basic alert.

Risk:

- Lower conversion and poor review experience.
- Users who permanently deny permission need a Settings path.

Fix:

- Add a pre-permission explanation tied to the voice button.
- Handle `never_ask_again` with a route to app settings.
- Make voice feature optional and keep core chat usable without microphone.

### 5. Model File Integrity Is Too Weak

Evidence:

- Download accepts HTTP status 200 and moves `.tmp` to final path.
- Existing model path returns true based only on file existence.
- Failed model load deletes the file automatically.

Risk:

- Partial/corrupt files may survive if the download reports success incorrectly.
- Users may lose large downloads due to transient load/runtime failures.
- No checksum means no reliable integrity guarantee for 1GB+ model files.

Fix:

- Store expected file size and SHA-256 per curated model.
- Verify checksum before marking installed.
- Treat initialization failures separately from proven corruption.
- Ask for confirmation before deleting a downloaded model unless checksum fails.

### 6. CPU-Only AI Runtime Build Warning

Evidence:

- Release bundle build logs: `Hexagon SDK not found - building CPU-only`.
- App includes `ggml-hexagon` assets, but local build did not use Hexagon SDK acceleration.

Risk:

- Performance/battery may not match product claims on supported Qualcomm devices.
- Device testing must cover CPU-only behavior, thermal throttling, memory pressure, and large downloads.

Fix:

- Decide whether Hexagon acceleration is required for release.
- If required, install/configure Hexagon SDK in CI and document build prerequisites.
- If CPU-only is acceptable, tune app copy and performance claims.

## Medium-Priority Fixes

### 1. Native ABI Strategy Should Be Optimized

Evidence:

- `gradle.properties` builds `armeabi-v7a,arm64-v8a,x86,x86_64`.

Risk:

- Google Play App Bundles deliver ABI-specific native code, so this is not as bad as a universal APK, but x86/x86_64 adds build/test surface.
- Local LLM workloads are realistically strongest on `arm64-v8a`.

Fix:

- Keep `arm64-v8a` as primary.
- Consider dropping `armeabi-v7a` if memory/performance is unacceptable on 32-bit devices.
- Keep x86/x86_64 only if emulator/testing or target device support justifies it.

### 2. App Icons Appear Duplicated Across Densities

Evidence:

- All launcher PNG density files are the same size: 65,759 bytes.

Risk:

- Density assets may have been copied instead of generated at proper resolutions.
- Store icon and launcher appearance may be blurry or oversized on some devices.

Fix:

- Regenerate adaptive icons at correct densities.
- Confirm a 512x512 Play Store icon and 1024x500 feature graphic.
- Verify icon safe zone, monochrome/themed icon support, and dark/light contrast.

### 3. Gradle Deprecation Warning

Evidence:

- Release build reports deprecated Gradle features incompatible with Gradle 10.

Risk:

- Future Android Gradle/Gradle upgrades may break CI suddenly.

Fix:

- Run `./gradlew :app:bundleRelease --warning-mode all`.
- Identify whether warnings come from project scripts or dependencies.
- Track upstream React Native/AGP compatibility.

### 4. No Crash Reporting or Release Observability

Evidence:

- No visible crash/analytics SDK in `package.json`.

Risk:

- Closed testing feedback will be harder to triage.

Fix:

- Add privacy-conscious crash reporting if acceptable.
- If adding Firebase Crashlytics or similar, update Data Safety and privacy policy.
- At minimum, add structured local error boundaries and user-visible exportable diagnostics.

## Play Console Readiness Checklist

Before production release:

- Create final package name and app identity.
- Configure Play App Signing and production upload key.
- Build signed `.aab` with release upload key.
- Fix lint errors and make CI fail on errors.
- Fix Jest teardown crash and require test pass in CI.
- Publish privacy policy URL.
- Complete Data Safety form accurately.
- Complete App Access, Ads, Content Rating, Target Audience, News, Health, Government, Financial features declarations as applicable.
- Add screenshots for phone and large screens if targeting tablets.
- Add app icon, feature graphic, short description, full description, and release notes.
- Provide model license/attribution notices.
- Test on Android 16/API 36, Android 15/API 35, a low-RAM Android 8+ device/emulator, and at least one modern arm64 physical device.
- Test install, first launch, model download interruption/resume/cancel, offline launch, voice permission denied, file picker, corrupt model recovery, memory clear, and app update.

## Recommended Release Plan

### Phase 1: Technical Gate

- Replace debug release signing.
- Fix lint errors.
- Fix Jest crash.
- Enable release minification or document why it is deferred.
- Add CI command sequence:
  - `npm run lint`
  - `npm test -- --runInBand`
  - `cd android && ./gradlew :app:bundleRelease`

### Phase 2: Policy Gate

- Write privacy policy.
- Review model licenses.
- Add in-app attribution/licenses.
- Finalize Data Safety answers.
- Add voice permission rationale and external speech-processing disclosure.

### Phase 3: Quality Gate

- Add checksum-based model verification.
- Improve download recovery/resume.
- Run physical device tests with 1GB+ model downloads.
- Verify memory and thermal behavior during generation.
- Run Play Console pre-launch report on closed testing artifact.

## Release Verdict

Do not submit this build to production yet.

It is reasonable to move toward an internal test only after fixing release signing, lint, and the Jest teardown crash. It is reasonable to move to closed testing after the privacy policy, Data Safety answers, permission rationale, model attribution, and model integrity checks are complete.


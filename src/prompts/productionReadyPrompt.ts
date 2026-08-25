export const PRODUCTION_READY_MASTER_PROMPT = `You are a senior React Native product engineer, mobile architect, UI/UX designer, QA lead, and security reviewer. Work inside this repository and make the Moonlight AI local LLM app production-ready with no known build, runtime, TypeScript, lint, test, UX, security, or platform errors.

Primary goal:
Transform this React Native app into a polished, premium, fully functional production app comparable in quality and UX clarity to ChatGPT, Gemini, and Claude mobile experiences, while preserving the Moonlight AI brand and local-first assistant concept.

Rules:
- First analyze the existing project structure, dependencies, native Android/iOS code, navigation, screens, services, storage, tests, and build configs.
- Do not guess. Verify every claim through code inspection, tests, builds, or official documentation when needed.
- Do not remove user work or unrelated changes.
- Keep changes consistent with the current React Native architecture.
- Prefer focused, production-grade fixes over decorative rewrites.
- Every feature shown in the UI must either work fully or be clearly marked as coming soon/disabled.
- Remove exaggerated or false claims such as "100% offline" unless technically guaranteed.
- Maintain TypeScript correctness throughout.

Required production outcomes:

1. Build and Tooling
- npm ci works cleanly.
- npx tsc --noEmit passes with zero errors.
- npm test -- --runInBand passes.
- npm run lint passes with zero errors, and reduce warnings where practical.
- Android debug build succeeds.
- Android release build is configured correctly and does not use debug signing for production.
- iOS project is either fully supported or clearly guarded/documented if Android-only.
- Fix Jest config, native mocks, ESM transforms, and test setup.
- Ensure llama.rn native artifacts/install scripts are handled correctly.

2. Core Chat Functionality
- Model download, cancel, retry, corrupt-file handling, and progress states work reliably.
- Do not delete downloaded models automatically unless corruption is strongly verified and user confirms.
- Chat history saves and restores safely.
- Handle malformed storage JSON gracefully.
- Streaming generation works without duplicate state bugs.
- Stop generation works.
- Empty, loading, error, offline, and model-not-found states are polished.
- Add per-model prompt templates where needed instead of one hardcoded prompt format for all GGUF models.
- Add model metadata: name, provider, size, RAM guidance, context, prompt format.
- Make memory behavior explicit and user-controllable.

3. File, Voice, Clipboard, And Native Bridges
- Android DeviceControl bridge must be robust: null-safe, lifecycle-safe, permission-safe, and not overwrite pending promises.
- Add iOS equivalents for file picking, speech, and clipboard, or hide/disable those controls on iOS with clear UX.
- Voice input must not claim offline if using system/cloud speech recognition.
- File attachment should support text files safely with size limits, encoding handling, and graceful binary/PDF/image messaging.
- Clipboard copy should work cross-platform using a maintained package or native bridge.

4. Storage And Privacy
- Remove hardcoded MMKV encryption key from source.
- Use Android Keystore / iOS Keychain, or a secure key-management approach.
- Add storage migration and fallback behavior.
- Add clear privacy wording that accurately reflects model downloads, local inference, speech recognition, and file handling.
- Avoid logging sensitive user prompts or file contents.

5. Premium UI/UX
- Redesign all main screens to feel premium, calm, modern, and highly usable.
- Match the interaction quality expected from ChatGPT/Gemini/Claude:
  - clean hierarchy
  - readable typography
  - refined dark mode
  - excellent empty states
  - polished loading/progress states
  - ergonomic chat input
  - clear model selector
  - useful settings
  - accessible touch targets
  - responsive layouts
- Remove gimmicky, sci-fi, exaggerated, or misleading copy.
- Avoid clutter and excessive cards.
- Keep cards at reasonable radii, avoid nested cards, and maintain consistent spacing.
- Ensure no text overlaps or clips on small screens.
- Ensure placeholder features are either functional, disabled, or labeled "Coming soon."
- Add accessibility labels where appropriate.
- Support safe-area handling and keyboard behavior on Android/iOS.

6. Feature Completeness
- Fully implement or properly gate:
  - Chat
  - Model manager
  - Settings
  - Prompt starters
  - Memory viewer/editor
  - File attachment
  - Voice input
  - Model switching
  - Clear chat
  - Copy response
- Gallery/tool cards must navigate to real experiences or be disabled with honest labels.
- Prompt Lab must use the real selected model or be renamed as a prompt draft/preview tool.

7. Testing
- Add focused tests for:
  - storage defaults and corrupted JSON
  - memory parsing and dedupe
  - model filename/path handling
  - model download success/failure/cancel behavior
  - ChatScreen empty/loading/error states
  - Settings updates
  - Gallery card routing/gating
- Mock native modules cleanly.
- Do not depend on real model downloads in unit tests.

8. Security And Dependency Health
- Run npm audit.
- Fix or document vulnerabilities.
- Replace deprecated dependencies where practical, especially deprecated voice packages.
- Ensure no debug secrets, debug signing, or fake production claims remain.
- Check Android permissions and iOS usage descriptions.

9. Final Verification
Before finishing, run:
- npx tsc --noEmit
- npm test -- --runInBand
- npm run lint
- Android build command
- Any relevant iOS validation if available

Final response must include:
- Summary of major changes
- Files changed
- Verification results
- Known remaining risks, if any
- Clear next steps only if something cannot be completed in the current environment

Definition of done:
The app has a premium production-level UI, all visible core features work or are honestly gated, TypeScript/tests/lint/builds pass, native/platform behavior is robust, privacy/security claims are accurate, and there are no known unresolved production-blocking errors.`;

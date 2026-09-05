# Moonlight UI redesign

The redesigned interface uses warm charcoal surfaces, ivory text, and a lime accent throughout the home, chat, Explore, models, preferences, and policy screens. Shared typography, spacing, buttons, and navigation replace the previous mixed visual styles.

## Working flows

- Home: real model status, new conversations, history search, rename, delete, and sharing.
- Chat: readable unboxed assistant answers, selectable code, copy/share actions, attachment removal, model selection, actual download progress, and a larger composer. Dictation fills the draft for review rather than automatically sending it.
- Explore: five writing, learning, coding, planning, and rewriting starters open a new conversation with the selected prompt.
- Models: real installation state, download/cancel, activation, removal, and retry when storage checks fail.
- Preferences: working response presets, editable saved personal instructions, memory controls, validated custom model URLs, and expandable generation controls.
- Startup: a short, consistent brand screen; simulated engine boot animations were removed.

No seeded conversations, invented performance figures, fake online states, or decorative inactive feature buttons were added. Empty states represent real absence of chats or downloaded models. Input hints describe what the user can enter.

## Verification

83 tests passed across 11 suites, including new UI interaction coverage for preference persistence, Explore navigation, and dictation. TypeScript passed. The redesigned screens were reviewed using their actual React Native components rendered through React Native Web in a local development-only harness at a 390-pixel width, with an additional 320-pixel home-screen check. The harness has no installed models and does not emulate native inference, Android speech, the keyboard, or file selection; it is excluded from the shipped app.

Physical-phone verification is still needed for keyboard resizing, native file/voice flows, font rendering, and model inference. The APK retains the existing offline model engine and does not gain cloud-model or web-search capabilities from this redesign.


## Release artifact

`releases/Moonlight-Redesign-arm64.apk` is the signed ARM64 release (101,516,763 bytes). The build completed successfully and APK signature and 16 KB package-alignment verification passed. It updates the previous preview installation using the same application ID and signing key.

SHA-256: `E884718350926C18441DB7FBE84033A333E2CE4B8FD739FDF44AC4EDBDBF099B`.

## Latest palette and branding release

The latest artifact is `releases/Moonlight-Updated-arm64.apk` (101,517,427 bytes). It includes neutral graphite surfaces, white primary actions, restrained blue accents, and the original Moonlight artwork shared with the stored site assets and Android launcher. It supersedes the lime-palette redesign APK. TypeScript and all 83 tests passed; release signing and alignment verified.

SHA-256: `6466BCFA7C19F132EA22410DF3B9210784C8198A05006488283060E39F060552`.

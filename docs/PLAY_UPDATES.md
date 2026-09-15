# Google Play update notice

Moonlight checks Google Play on startup and foreground, at most once per hour per app process. It displays a theme-aware, dismissible notice only when Play reports UPDATE_AVAILABLE with a higher version code. Update opens the installed app's Play listing, using the HTTPS listing if the Play app cannot open. Not now hides that version for the current app session. No server, API key, notification permission or push service is required.

The `.preview` package deliberately skips checks because it has no listing. Network errors and installations not eligible for Play updates do not interrupt chat. This is an in-app notice, not a background push notification.

## Release verification

1. Publish a correctly signed production-package build containing this feature to the appropriate Play test track. Verify its version code exceeds every previously uploaded code. The locally configured package is `com.moonknightstudio.moonlightai`; confirm it against the existing Play listing and use the existing upload signing key.
2. Install that build through Google Play with an eligible tester account.
3. Publish a later build with a higher version code to that tester's track and wait for Play processing and availability.
4. Open the older build (or foreground it after the hourly check interval). Confirm the notice appears, Update opens the correct listing, and Not now preserves the current conversation.
5. Install the newer version and confirm the notice is absent. Repeat with no network; chat should remain usable.

Users running older releases without this feature must first update through Google Play. Merely uploading a draft release does not make it available to users. No live Play-track test has been performed in this workspace.

Official API: https://developer.android.com/guide/playcore/in-app-updates/kotlin-java

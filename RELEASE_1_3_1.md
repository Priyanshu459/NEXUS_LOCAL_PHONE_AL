# Moonlight 1.3.1 preview

This is an installable ARM64 preview, not a completed Google Play automatic-search release.

- Existing Paper, Mono and Midnight appearance choices and Moonlight branding are retained.
- Existing compact-model restriction (up to 1.3 GB), available-memory checks and serialized model loading are retained following the reported phone freeze. These are safeguards, not proof of device stability.
- Normal Web search settings explain availability and privacy without URL or credential inputs.
- The owner's temporary server connection is under Settings → Advanced → Administrator search testing. The Moonlight HTTPS endpoint is prefilled. Credentials remain session-only, and rejected credentials are discarded.
- Search still requires explicit query review, uses bounded HTTPS responses, and provides sanitized source links. No shared credential is embedded in the APK.

## Outstanding work

The user confirmed Google Play Integrity is not configured. Automatic access has NOT been implemented or activated. Google Play project setup, server-side integrity verification and limited automatic credentials are needed before no-setup search can ship. Oracle remains the search host. Do not remove authentication from the deployed gateway to make this preview work.

The server was successfully tested by the user with an authenticated request. This build has not been tested on a physical phone. The preview uses the existing preview signing identity and package suffix; it is not a production Play bundle.

## Validation

TypeScript checking passed. All 117 tests across 17 suites passed, including checks that normal search settings do not request credentials, unactivated search sends nothing, rejected credentials are discarded, and query review alone sends no request. The Android build script now uses an explicit Android configuration directory and a fresh Gradle process to avoid reusing a restricted build daemon.

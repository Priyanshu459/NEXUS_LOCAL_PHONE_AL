# Moonlight 1.3.2 alpha candidate

- Keep the chat model resident when navigating to Settings or other screens. Release on model selection change or chat unmount; retain serialized loading and memory checks.
- Send recognized speech directly to the local model. If no model is ready, preserve the transcript in the composer and explain why it was not sent.
- Place alpha URL and masked access-key setup in Settings → Web search. Include connection status, usage instructions and privacy information using the selected theme.
- Keep HTTPS validation, native redirect restrictions, session-only bearer credentials and server authorization. Saving a connection does not claim successful server verification.
- Keep the existing Moonlight branding and compact-model safety limits.

Validation: TypeScript check and 118 tests in 18 suites passed, including navigation retention, model replacement and voice submission. Physical phone behavior has not been verified.

Version code 8 is provisional for Play: the user recalls 3 as the latest upload. Confirm the actual highest uploaded code, package name and upload certificate before publishing. Only preview signing is configured locally; the preview APK cannot update the production Play package.

Phone checks: load a compact model, visit Settings and return, speak a short message, configure alpha search and submit an approved query, switch models, restart and confirm that search requests require the key again.

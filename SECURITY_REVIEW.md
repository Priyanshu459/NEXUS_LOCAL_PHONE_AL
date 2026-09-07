# Local security review — 5 September 2026

This was a targeted code review and local adversarial test session, not a Strix run. No external targets were probed. Tests did not demonstrate remote code execution, account compromise or data theft. A real Android device was not used.

## Fixed: malformed model link causes an uncaught error

In `src/services/modelManager.ts`, the filename decoding step in `parseHuggingFaceUrl` was outside its error handler. A user saving a supplied link such as `https://huggingface.co/org/repo/resolve/main/%FF.gguf` could trigger `URIError` in the Settings validation handler. Exploitation requires the user to paste/save the malformed link. Impact is an input-triggered application error; whole-process termination was not tested.

Three regression cases (`%`, `%FF`, `%E0%A4%A`) failed before the fix. Invalid encoding now returns a normal validation error. Filename extraction also safely handles malformed encoding.

## Fixed: attachment byte limit bypass

The Android file reader trusted reported size for its initial check, then used `readLine` before checking accumulated character count. A file with absent or inaccurate size metadata and one very long line bypassed the 512 KB limit. This can cause excessive allocation and UI stalls; sufficiently large inputs could exhaust memory. The user must select the file, potentially through an untrusted document provider.

A local JVM reproduction of the previous algorithm accepted 2,097,153 characters from a 2 MB single-line fixture. The new `BoundedTextReader`, called by the actual Android module, rejects oversized content after at most 524,289 input bytes, regardless of line breaks or declared size. It counts UTF-8 bytes rather than characters, while preserving the existing line and control-character handling.

The JVM harness checks oversized ASCII, oversized multibyte UTF-8, exact-limit content, empty input, control characters and the 2,000-line limit. It does not simulate the Android document picker. Slow or blocking content providers still warrant device testing; a byte bound is not a time bound.

## Additional hardening: download service rejects unsupported URLs

The Settings validator restricted model sources, but `resolveHuggingFaceModelUrl` passed unrecognized URLs straight through to the downloader. Direct service tests reproduced this with mocked network/filesystem calls. The resolver now fails closed for unsupported domains or schemes. Existing download tests use permitted source URLs.

This was a service-boundary gap, not a demonstrated UI-accessible SSRF or local-file disclosure. Native downloader behavior and redirects were not exercised by the mocked tests.

## Verification and limits

- All 90 Jest tests across 12 suites passed after changes, including six new adversarial regression cases.
- TypeScript type checking passed.
- All six attachment checks passed against the compiled Java reader.
- Android release Kotlin and Java compilation passed (`compileReleaseKotlin` and `compileReleaseJavaWithJavac`). This compiled the Android integration but did not package a new APK.
- Source inspection found release backup disabled, cleartext disabled, no document provider exported by the app, and generated answers rendered as native text rather than executable HTML. These observations are not a full mobile security certification.
- Strix is still unconfigured. Native llama/GGUF parser fuzzing, dependency advisory scanning, malicious document-provider integration, device storage extraction and end-to-end APK penetration testing were not performed.
- The signed `releases/Moonlight-1.2.0-Paper-Mono-arm64.apk` built on September 6, 2026 includes these changes. APK signature and alignment checks passed; no phone or emulator was connected for runtime penetration testing.

Re-run JavaScript checks with `npx jest --runInBand` and `npx tsc --noEmit`. Compile `tools/AttachmentSecurityTest.java` together with the production `BoundedTextReader.java` using a local JDK, then run `AttachmentSecurityTest` from the resulting class directory.

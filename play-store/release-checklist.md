# Production Release Checklist

## Identity

- Choose final permanent application ID.
- Confirm the package is not already used by another Play Console app unless this is an intentional update.
- Confirm `versionCode` is higher than every previous Play Console upload for this package.
- Confirm `versionName` matches the release notes.

## Signing

- Enroll in Play App Signing.
- Generate an upload key outside the repository.
- Store key and passwords in approved secrets storage.
- Export and upload the upload certificate if requested by Play Console.
- Build release AAB only with signing environment variables set.

## Compliance

- Publish privacy policy at a live HTTPS URL.
- Set `PRIVACY_POLICY_URL` in `src/config/compliance.ts`.
- Deploy AI report backend at a live HTTPS URL.
- Set `AI_REPORT_ENDPOINT` in `src/config/compliance.ts`.
- Complete Play Data Safety form from `data-safety-worksheet.md`.
- Complete AI-generated content and AI feature declarations in Play Console.
- Review model licenses in `model-licenses.md`.

## Technical verification

- `npx tsc --noEmit`
- `npm test -- --runInBand`
- `npm run lint -- --quiet`
- `cd android && .\gradlew.bat :app:processReleaseMainManifest`
- `cd android && .\gradlew.bat :app:bundleRelease`
- Check merged release manifest permissions.
- Check AAB/APK native libraries for 16 KB page-size compatibility.
- Check 64-bit ABI support.
- Check release artifact signature and upload certificate fingerprint.

## Device testing

- Install on at least one Android 16/API 36 device or emulator.
- Install on one lower supported Android version.
- Download each listed model on Wi-Fi.
- Run a short local inference on each model.
- Test model deletion and re-download.
- Test document import.
- Test voice input on a device with Android speech recognition configured.
- Test AI report success, HTTP failure, and offline retry behavior.
- Confirm app works after force stop and device reboot.
- Run Play Console closed testing as required for the account type.
